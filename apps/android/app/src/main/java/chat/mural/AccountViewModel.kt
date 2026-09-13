package chat.mural

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import chat.mural.core.AccountController
import chat.mural.core.AccountState
import chat.mural.network.AccountSessionStore
import chat.mural.network.ManagedAccountClient
import chat.mural.network.ManagedAccountConfiguration
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.CancellationException
import androidx.credentials.CredentialManager
import androidx.credentials.ClearCredentialStateRequest

class AccountViewModel(application: Application) : AndroidViewModel(application) {
    val configuration = ManagedAccountConfiguration.parse(BuildConfig.MANAGED_API_ORIGIN, BuildConfig.GOOGLE_SERVER_CLIENT_ID)
    private val controller = configuration?.let {
        AccountController(ManagedAccountClient(it), AccountSessionStore(application, it.origin.toString()))
    }
    val state = controller?.state ?: MutableStateFlow(AccountState())
    init { viewModelScope.launch { controller?.restore() } }
    fun refresh() { viewModelScope.launch { controller?.refresh() } }
    suspend fun signIn(getToken: suspend (String) -> String) { controller?.signIn(getToken) }
    fun signOut() { viewModelScope.launch { controller?.signOut(); clearGoogleIfSignedOut() } }
    fun delete() { viewModelScope.launch { controller?.delete(); clearGoogleIfSignedOut() } }
    fun dismissNotice() { controller?.dismissNotice() }
    private suspend fun clearGoogleIfSignedOut() {
        if (state.value.signedIn) return
        try { CredentialManager.create(getApplication<Application>()).clearCredentialState(ClearCredentialStateRequest()) }
        catch (error: CancellationException) { throw error }
        catch (_: Exception) { /* The Mural session has already been removed. */ }
    }
}
