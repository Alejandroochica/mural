package chat.mural

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import chat.mural.core.AccountState
import chat.mural.core.MinuteBalance
import chat.mural.ui.AccountSheet
import chat.mural.ui.MuralTheme
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AccountSheetTest {
    @get:Rule val compose = createComposeRule()
    @Test fun unavailableGoogleDoesNotLaunchAndExplainsGuestAccess() {
        var signIns = 0
        compose.setContent { MuralTheme {
            AccountSheet(AccountState(), {}, { signIns++ }, {}, {}, {})
        } }
        compose.onNodeWithTag("account-google").assertIsNotEnabled()
        assertEquals(0, signIns)
        compose.onNodeWithText("Make yourself at home.").assertIsDisplayed()
        compose.onNodeWithText("You can keep using Mural without an account.", substring = true).assertExists()
    }
    @Test fun accountShowsMinutesAndDeletionRequiresConfirmation() {
        var deletions = 0
        val state = AccountState(googleAvailable = true, accountID = "synthetic-account", email = "preview@example.test",
            minutes = MinuteBalance("milliseconds", "connected-conversation-time", 1_800_000, 0, 1_800_000))
        compose.setContent { MuralTheme { AccountSheet(state, {}, {}, {}, { deletions++ }, {}) } }
        compose.onNodeWithTag("account-minute-balance").assertTextEquals("30 minutes")
        compose.onNodeWithText("Delete account").performScrollTo().performClick()
        assertEquals(0, deletions)
        compose.onNodeWithText("Delete your Mural account", substring = true).assertIsDisplayed()
        compose.onNodeWithTag("account-confirm-delete").performClick()
        compose.runOnIdle { assertEquals(1, deletions) }
    }
}
