# How Mural keeps languages independent

A learner can be comfortable in Norwegian and new to Spanish. Mural therefore gives each conversation an immutable language ID and projects vocabulary, challenge level and capability observations from that language's evidence only. Identical word forms have different vocabulary keys across languages, so hiding or recalling a word in one language does not affect another.

Language-specific content lives in `Core/Languages/`. Each module defines its greeting, regional speech guidance, writing conventions, lemma rules, six teaching stages and cultural theme overrides. `LanguageRegistry` supplies the available choices to the UI. Spanish targets Spain; Norwegian uses Bokmål and an Eastern Norwegian voice target; French targets France; English accepts international usage with consistent spelling within a conversation. Regional pronunciation is a model instruction and still needs listening checks.

`TeachingPolicy` combines a module with the shared teaching rules. Voice, assessment, typed replies, help, word lookup, subtitles and current-topic search all use that policy. The audio transport and provider connection remain shared. A module can override selected theme IDs while inheriting the common conversation catalog.

Switching is allowed between conversations. It clears the current screen context and invalidates pending language-dependent work. Previous messages and sourced topic briefs are selected only from the active language. Learner replies can use a support language; the meaning-subtitle language is a separate preference. Vocabulary senses remain in English to keep glossary identities stable.

Archive version 2 stores language IDs explicitly. Version 1 records migrate to Norwegian, and their hidden-word keys gain the same namespace as new evidence. The SwiftData record itself retains its original identity. Before persisting that migration, the app saves a protected copy of the original payload in its Application Support/Mural directory. The API key stays in Keychain. Backups with unknown language IDs or mixed-language topic attachments are rejected without replacing existing data.

These are compiled modules. Adding one ships with an app update; there is no remote module download or extra service. Different scripts may require additional word-selection and layout work, and every new language needs a native-speaker teaching and pronunciation review.

See [how to add a language](add-language.md) for the implementation steps.

## Two native cores, one contract

The Android client is a separate Kotlin/Compose app, not a shared build. `scripts/export_android_content.py` generates Android's language content (`Languages.kt`) from the Swift modules under `Core/Languages/`, so a module registered in `LanguageRegistry.all` reaches both platforms without being written twice.

Everything else in the learning core is ported by hand, so `scripts/check_cross_platform.py` checks that the two ports stay in agreement: the teaching prompts sent to the model, a fixed table of shared numeric constants (recall spacing, evidence thresholds, session limits), and the required fields of the JSON backup archive. Golden fixtures under `Tests/Fixtures/cross-platform/` are read by both `swift test` and the Android unit tests, so a behavior change can be verified identically on both cores.

An export is semantically, not byte-for-byte, compatible with what it describes: Swift's `JSONEncoder` sorts keys when writing an archive, while Kotlin does not attempt to reproduce that ordering. Backups exchanged between platforms are compared by decoding and re-validating, never by comparing raw bytes.
