package chat.mural.core

/** Adding a verified member identity does not revoke a guest lease or transfer its funds.
 * Destructive account changes still require the separate settlement gate. */
class AccountSignInPreparation(
    private val finishLocalWork: suspend () -> Boolean,
    private val pendingOwner: () -> String?,
    private val guestOwns: suspend (String) -> Boolean,
    private val prepareAccountChange: suspend () -> Boolean,
) {
    suspend fun prepare(): Boolean {
        if (!finishLocalWork()) return false
        val owner = pendingOwner()
        // The guest bearer and durable owner remain available after member OAuth completes.
        if (owner != null && guestOwns(owner)) return true
        return prepareAccountChange()
    }
}
