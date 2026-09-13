package chat.mural

import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import chat.mural.core.AccountState
import chat.mural.core.ConversationProvider
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
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
    private val member = AccountState(accountID = "12345678-1234-1234-1234-123456789012", googleAvailable = true,
        minutes = MinuteBalance("milliseconds", "connected-conversation-time", 5_000, 0, 5_000))

    @Test fun finalSecondsAreVisibleAndAnUnavailableStoreDoesNotOfferPurchases() {
        compose.setContent { MuralTheme { AccountSheet(member, {}, {}, {}, {}, {}) } }
        compose.onNodeWithTag("account-minute-balance").assertTextEquals(context.getString(R.string.account_seconds_value, "5"))
        compose.onNodeWithTag("account-buy-minutes").assertDoesNotExist()
        compose.onNodeWithTag("account-conversation-source").assertDoesNotExist()
    }

    @Test fun minutesRequireAnExplicitChoiceAndCannotChangeDuringAConversation() {
        val running = mutableStateOf(false)
        val provider = mutableStateOf(ConversationProvider.PERSONAL_KEY)
        compose.setContent { MuralTheme {
            AccountSheet(member, {}, {}, {}, {}, {}, provider = provider.value, hostedAvailable = true,
                conversationRunning = running.value, onSelectProvider = { provider.value = it })
        } }
        compose.runOnIdle { assertEquals(ConversationProvider.PERSONAL_KEY, provider.value) }
        compose.onNodeWithTag("account-conversation-source").performScrollTo().performClick()
        compose.onNodeWithTag("account-conversation-source-HOSTED_MINUTES").performClick()
        compose.onNodeWithText(context.getString(R.string.hosted_minimum_charge_disclosure)).performScrollTo().assertIsDisplayed()
        compose.runOnIdle { assertEquals(ConversationProvider.HOSTED_MINUTES, provider.value); running.value = true }
        compose.onNodeWithTag("account-conversation-source").assertIsNotEnabled()
    }

    @Test fun accountTransitionDisablesAnotherSignInOrPurchase() {
        var purchases = 0
        compose.setContent { MuralTheme {
            AccountSheet(member, {}, {}, {}, {}, {}, transitionBusy = true, onBuyMinutes = { purchases++ })
        } }
        compose.onNodeWithTag("account-buy-minutes").performScrollTo().assertIsNotEnabled()
        compose.onNodeWithText(context.getString(R.string.account_sign_out)).assertDoesNotExist()
        compose.runOnIdle { assertEquals(0, purchases) }
    }
}
