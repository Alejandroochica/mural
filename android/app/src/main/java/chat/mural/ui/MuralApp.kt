package chat.mural.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import chat.mural.MuralViewModel
import chat.mural.R
import chat.mural.core.CloudAction

private data class Tab(val label: String, val glyph: String, val tag: String)

@Composable
fun MuralApp(
    vm: MuralViewModel,
    microphoneMessage: String?,
    onRequestMicrophone: () -> Unit,
    onOpenAppSettings: (() -> Unit)?,
    onExport: () -> Unit,
    onImport: () -> Unit,
) {
    val prefs = vm.archive.preferences
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var showConsent by rememberSaveable { mutableStateOf(false) }
    fun perform(action: CloudAction) {
        when (action) {
            CloudAction.StartVoice -> onRequestMicrophone()
            is CloudAction.SendTyped -> vm.sendTyped(action.text)
            is CloudAction.Lookup -> vm.lookup(action.word, action.sentence)
            is CloudAction.CurrentTopic -> vm.currentTopic(action.query)
            CloudAction.Help -> vm.help()
        }
    }
    fun withConsent(action: CloudAction) {
        if (vm.archive.preferences.aiConsentVersion == AI_CONSENT_VERSION) perform(action)
        else {
            vm.pendingCloudAction = action
            showConsent = true
        }
    }

    MuralTheme {
        Surface(Modifier.fillMaxSize(), color = MuralColors.Cream) {
            if (!prefs.hasOnboarded) {
                OnboardingScreen(prefs.learningLanguageID, prefs.meaningLanguage) { language, meaning ->
                    vm.selectLanguage(language)
                    vm.updatePreferences(
                        vm.archive.preferences.copy(
                            learningLanguageID = language,
                            meaningLanguage = meaning,
                            meaningVisible = true,
                            hasOnboarded = true,
                            aiConsentVersion = null,
                        ),
                    )
                    vm.pendingCloudAction = null
                    showConsent = true
                }
            } else {
                val tabs = listOf(
                    Tab(stringResource(R.string.talk_tab_title), "●", "tab-talk"),
                    Tab(stringResource(R.string.topics_tab_title), "✦", "tab-topics"),
                    Tab(stringResource(R.string.words_tab_title), "▤", "tab-words"),
                    Tab(stringResource(R.string.settings_tab_title), "≡", "tab-settings"),
                )
                Scaffold(
                    containerColor = MuralColors.Cream,
                    contentWindowInsets = WindowInsets.safeDrawing,
                    topBar = {
                        Row(
                            Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.statusBars).padding(horizontal = 20.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Brand()
                            Spacer(Modifier.weight(1f))
                            Text(vm.language.nativeName, color = MuralColors.Secondary, style = MaterialTheme.typography.labelMedium)
                        }
                    },
                    bottomBar = {
                        NavigationBar(containerColor = MuralColors.CreamRaised) {
                            tabs.forEachIndexed { index, item ->
                                NavigationBarItem(
                                    selected = tab == index,
                                    onClick = { tab = index },
                                    icon = { Text(item.glyph, modifier = Modifier.semantics { contentDescription = item.label }) },
                                    label = { Text(item.label) },
                                    modifier = Modifier.testTag(item.tag),
                                )
                            }
                        }
                    },
                ) { padding ->
                    Column(Modifier.fillMaxSize().padding(padding)) {
                        when (tab) {
                            0 -> TalkScreen(
                                vm = vm,
                                microphoneMessage = microphoneMessage,
                                onMicrophone = { withConsent(CloudAction.StartVoice) },
                                onOpenAppSettings = onOpenAppSettings,
                                onSendTyped = { text -> withConsent(CloudAction.SendTyped(text)) },
                                onLookup = { word, sentence -> withConsent(CloudAction.Lookup(word, sentence)) },
                                onHelp = { withConsent(CloudAction.Help) },
                            )
                            1 -> TopicsScreen(
                                vm,
                                onChoose = { tab = 0 },
                                onCurrentTopic = { query -> withConsent(CloudAction.CurrentTopic(query)) },
                            )
                            2 -> WordsScreen(vm)
                            else -> SettingsScreen(vm, onExport, onImport, onReviewConsent = {
                                vm.pendingCloudAction = null
                                showConsent = true
                            })
                        }
                    }
                }
            }

            if (showConsent) AIConsentDialog(
                onAgree = {
                    vm.updatePreferences(vm.archive.preferences.copy(aiConsentVersion = AI_CONSENT_VERSION))
                    showConsent = false
                    val action = vm.pendingCloudAction
                    vm.pendingCloudAction = null
                    action?.let(::perform)
                },
                onDecline = {
                    showConsent = false
                    vm.pendingCloudAction = null
                },
            )

            vm.error?.let { message ->
                AlertDialog(
                    onDismissRequest = vm::dismissError,
                    title = { Text(stringResource(R.string.error_dialog_title)) },
                    text = { Text(message) },
                    confirmButton = { TextButton(onClick = vm::dismissError) { Text(stringResource(R.string.common_ok)) } },
                    dismissButton = if (vm.errorNeedsKeySetup) ({
                        TextButton(onClick = { vm.dismissError(); tab = 3 }) { Text(stringResource(R.string.error_go_to_settings)) }
                    }) else null,
                )
            }
        }
    }
}
