import XCTest
@testable import MuralCore

final class ConversationPaceTests: XCTestCase {
    private func sample(_ id: String, typed: Bool = false, meaning: Bool = false, level: Int = 4, outcome: Outcome = .success, evidence: EvidenceKind = .independent, language: String = "nb") -> (Assessment, Passage) {
        let fragment = Fragment(id: id, speaker: .user, text: "Jeg liker å gå på tur", startMS: 0, endMS: 1000, meaningVisible: meaning, typed: typed)
        let passage = Passage(id: id, speaker: .user, fragments: [fragment])
        let word = WordProposal(lemma: "tur", meaning: "walk", form: "tur", kind: evidence, confidence: 0.9, sourceIDs: [id], quote: fragment.text, language: language)
        return (Assessment(passageID: id, revisionKey: passage.revisionKey, outcome: outcome, suggestedLevel: level, nextGoal: "Fortell mer", capability: "describes an interest", words: [word]), passage)
    }
    func testEarlyAdaptationAndDuplicateRevisionCannotAccelerateIt() {
        var pace = ConversationPace()
        XCTAssertEqual(pace.delivery, .gentle)
        let (first, passage) = sample("first")
        XCTAssertTrue(pace.observe(first, passage: passage, languageID: "nb"))
        XCTAssertEqual(pace.delivery, .natural)
        XCTAssertFalse(pace.observe(first, passage: passage, languageID: "nb"))
        let (second, next) = sample("second")
        XCTAssertTrue(pace.observe(second, passage: next, languageID: "nb"))
        XCTAssertEqual(pace.delivery, .extended)
        XCTAssertTrue(pace.askForHelp())
        XCTAssertEqual(pace.delivery, .gentle)
        XCTAssertEqual(ConversationPace().delivery, .gentle)
    }
    func testUncertainAssistedTypedOtherLanguageAndStaleEvidenceCannotRaisePace() {
        var pace = ConversationPace()
        let cases = [sample("typed", typed: true), sample("visible", meaning: true), sample("uncertain", outcome: .uncertain), sample("assisted", evidence: .assisted), sample("foreign", language: "es"), sample("invalid", level: 9)]
        for (assessment, passage) in cases { XCTAssertFalse(pace.observe(assessment, passage: passage, languageID: "nb")) }
        var (stale, passage) = sample("stale")
        stale.revisionKey = "older"
        XCTAssertFalse(pace.observe(stale, passage: passage, languageID: "nb"))
        XCTAssertEqual(pace.delivery, .gentle)
    }
    func testBreakdownImmediatelySimplifiesWithoutChangingAssessment() {
        var pace = ConversationPace()
        let (good, first) = sample("good")
        pace.observe(good, passage: first, languageID: "nb")
        let (bad, next) = sample("struggle", outcome: .breakdown)
        XCTAssertTrue(pace.observe(bad, passage: next, languageID: "nb"))
        XCTAssertEqual(pace.delivery, .gentle)
        XCTAssertEqual(bad.suggestedLevel, 4)
        XCTAssertTrue(pace.instruction.contains("unhurried"))
    }
    func testAllSpokenPromptPathsPreserveRegionalPronunciation() {
        for language in LanguageRegistry.all {
            let learner = LearningEngine.project([], languageID: language.id)
            let prompts = [TeachingPolicy.voice(language: language, learner: learner, theme: nil, interests: "", meaningLanguage: "English"), TeachingPolicy.greeting(language: language), TeachingPolicy.checkIn(language: language), TeachingPolicy.help(language: language), TeachingPolicy.redirect(language: language), TeachingPolicy.delegation(language: language), TeachingPolicy.typedReply(language: language), TeachingPolicy.currentTopic(language: language)]
            for prompt in prompts {
                XCTAssertTrue(prompt.contains(language.speechGuidance), language.id)
                XCTAssertTrue(prompt.contains("Persona and accent:"), language.id)
            }
            XCTAssertLessThan(prompts[0].utf8.count, 12000)
        }
    }
}
