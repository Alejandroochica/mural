import Foundation
import Observation
import MuralCore

@MainActor @Observable
final class ManagedAccountStore {
    let configuration: ManagedAccountConfiguration?
    private(set) var session: ManagedAccountSession?
    private(set) var wallet: ManagedWallet?
    private(set) var isBusy = false
    var message: String?
    @ObservationIgnored private let client: ManagedAccountClient?
    @ObservationIgnored private let keychain: ManagedAccountKeychain?
    @ObservationIgnored private let identity = ManagedAccountIdentity()
    @ObservationIgnored private var operation: Task<Void, Never>?
    @ObservationIgnored private var gate = ManagedAccountOperationGate()

    init(configuration: ManagedAccountConfiguration? = .load()) {
        self.configuration = configuration
        client = configuration.map(ManagedAccountClient.init)
        keychain = configuration.map { ManagedAccountKeychain(scope: $0.storageScope) }
        do { session = try keychain?.load() }
        catch { message = Self.message(for: error) }
    }
    func signIn(_ provider: ManagedIdentityProvider) {
        guard !isBusy, session == nil, let client, let configuration, let keychain else { return }
        run { [self] token in
            let challenge = try await client.challenge()
            let expiresAt = Date.now.addingTimeInterval(TimeInterval(challenge.expiresInSeconds))
            let credential = try await (provider == .google
                ? identity.google(configuration: configuration, nonce: challenge.nonce, http: client.http)
                : identity.apple(nonce: challenge.nonce))
            guard gate.accepts(token), Date.now < expiresAt else { throw ManagedAccountError.cancelled }
            let exchanged = try await client.exchange(provider: provider, token: credential.idToken, challenge: challenge)
            let newSession = try ManagedAccountSession(exchange: exchanged, provider: provider, scope: configuration.storageScope)
            guard gate.accepts(token), !Task.isCancelled else {
                try? await client.signOut(session: newSession); return
            }
            do { try keychain.save(newSession) }
            catch { try? await client.signOut(session: newSession); throw error }
            session = newSession
            wallet = try await client.wallet(session: newSession)
        }
    }
    func refresh() {
        guard !isBusy, let client, let session else { return }
        run { [self] token in
            let result = try await client.wallet(session: session)
            guard gate.accepts(token) else { return }
            wallet = result
        }
    }
    func signOut() {
        guard !isBusy, let client, let session, let keychain else { return }
        run { [self] token in
            var remoteFailed = false
            do { try await client.signOut(session: session) }
            catch let error as ManagedAccountError where error == .server("sign_in_required") { /* Already expired or revoked. */ }
            catch { remoteFailed = true }
            guard gate.accepts(token) else { return }
            try keychain.remove()
            self.session = nil; wallet = nil
            if remoteFailed { message = "Signed out on this iPhone. We couldn’t reach Mural to revoke other sessions; they expire within 24 hours." }
        }
    }
    func deleteAccount() {
        guard !isBusy, let client, let session, let keychain else { return }
        run { [self] token in
            var code: String?
            if session.provider == .apple {
                // A fresh code lets the server verify this Apple identity and revoke its authorization.
                code = try await identity.apple(nonce: ManagedAccountIdentity.random()).authorizationCode
            }
            guard gate.accepts(token) else { return }
            try await client.delete(session: session, appleCode: code)
            guard gate.accepts(token) else { return }
            self.session = nil; wallet = nil
            do { try keychain.remove() }
            catch {
                message = "Account deleted. Mural couldn’t clear its local secure sign-in record. Unlock this iPhone and reopen Account to clear it."
                return
            }
            message = "Account deleted. Your learning history remains on this iPhone. Required financial records may be retained."
        }
    }
    /// Close pending sign-in on dismissal. Account mutations finish so their result is not ambiguous.
    func cancelSignIn() {
        guard session == nil else { return }
        gate.cancel(); operation?.cancel(); identity.cancel(); operation = nil; isBusy = false
    }
    private func run(_ body: @escaping @MainActor (UInt64) async throws -> Void) {
        let token = gate.begin(); isBusy = true; message = nil
        operation = Task { [self] in
            defer { if gate.accepts(token) { isBusy = false; operation = nil } }
            do { try await body(token) }
            catch {
                guard gate.accepts(token) else { return }
                if error as? ManagedAccountError == .server("sign_in_required") {
                    session = nil; wallet = nil
                    do { try keychain?.remove() } catch { message = Self.message(for: error); return }
                }
                if error as? ManagedAccountError != .cancelled, !(error is CancellationError) {
                    message = Self.message(for: error)
                }
            }
        }
    }
    private static func message(for error: Error) -> String {
        switch error as? ManagedAccountError {
        case .secureStorage: "Mural couldn’t update this iPhone’s secure account storage. Unlock the iPhone and try again."
        case .server("unresolved_billing"): "Your account has a balance, pending payment or active usage. Contact hi@hackmamba.io to resolve it before deleting your account."
        case .server("sign_in_required"): "Please sign in again. Your learning history is still on this iPhone."
        case .server("rate_limit"): "Please wait a minute before trying again."
        case .server("apple_sign_in_not_ready"), .server("apple_revocation_not_configured"), .unavailable:
            "Accounts aren’t available in this build yet."
        case .invalidCallback, .invalidResponse, .server("invalid_challenge"):
            "Sign-in couldn’t be verified. Please start again."
        default: "Mural couldn’t complete that request. Check your connection and try again."
        }
    }
}
