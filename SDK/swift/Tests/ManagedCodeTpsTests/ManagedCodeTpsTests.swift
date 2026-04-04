import Foundation
import XCTest
@testable import ManagedCodeTps

final class ManagedCodeTpsTests: XCTestCase {
    private var rootDir: URL {
        URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }

    private var fixturesDir: URL { rootDir.appendingPathComponent("SDK/fixtures") }
    private var examplesDir: URL { rootDir.appendingPathComponent("examples") }

    func testSpecConstants() {
        XCTAssertEqual(TpsSpec.defaultBaseWpm, 140)
        XCTAssertEqual(TpsSpec.defaultEmotion, "neutral")
        XCTAssertEqual(TpsKeywords.tags["pause"], "pause")
        XCTAssertTrue(TpsKeywords.emotions.contains("motivational"))
        XCTAssertTrue(TpsKeywords.deliveryModes.contains("building"))
    }

    func testCanonicalTransportFixture() throws {
        let result = TpsRuntime.compileTps(readFixture("valid/runtime-parity.tps"))
        let expected = try readJsonFixture("transport/runtime-parity.compiled.json")
        XCTAssertTrue(result.ok)
        try XCTAssertJsonEqual(actual: scriptJson(result.script), expected: expected)

        let restored = try TpsStandalonePlayer.fromCompiledJson(String(data: try JSONSerialization.data(withJSONObject: expected, options: [.sortedKeys]), encoding: .utf8)!)
        XCTAssertEqual(restored.snapshot.state.currentSegment?.name, "Call to Action")
        restored.dispose()
    }

    func testExampleSnapshots() throws {
        for example in ["basic.tps", "advanced.tps", "multi-segment.tps"] {
            let result = TpsRuntime.compileTps(readExample(example))
            XCTAssertTrue(result.ok, example)
            let expected = try readJsonFixture("examples/\(example.replacingOccurrences(of: ".tps", with: ".snapshot.json"))")
            try XCTAssertJsonEqual(actual: exampleSnapshot(fileName: example, script: result.script), expected: expected)
        }
    }

    func testInvalidFixtures() throws {
        let expectations = try readJsonFixture("runtime-expectations.json")
        let invalidDiagnostics = expectations["invalidDiagnostics"] as! [String: Any]
        for (fileName, rawExpected) in invalidDiagnostics {
            let result = TpsRuntime.validateTps(readFixture("invalid/\(fileName)"))
            let expectedCodes = rawExpected as! [String]
            XCTAssertEqual(result.ok, fileName == "header-parameter.tps", fileName)
            XCTAssertEqual(result.diagnostics.map(\.code), expectedCodes, fileName)
            XCTAssertTrue(result.diagnostics.allSatisfy { $0.range.start.line >= 1 }, fileName)
        }
    }

    func testParseAndValidateApisCoverHeaderVariantsAndFrontMatter() throws {
        let invalid = TpsRuntime.validateTps("## []")
        XCTAssertFalse(invalid.ok)
        XCTAssertEqual(invalid.diagnostics.first?.code, "invalid-header")

        let parsed = TpsRuntime.parseTps("""
        ---
        title: "Front"
        base_wpm: 150
        ---

        # Display

        Intro words.

        ### Body
        Now read this.

        ## [Signal|0:30-1:10|Warm|Speaker:Alex]
        ### [Callout|160WPM]
        Message.
        """)
        XCTAssertTrue(parsed.ok)
        XCTAssertEqual(parsed.document.metadata["title"], "Display")
        XCTAssertEqual(parsed.document.segments.first?.name, "Display")
        XCTAssertEqual(parsed.document.segments.last?.timing, "0:30-1:10")
        XCTAssertEqual(parsed.document.segments.last?.speaker, "Alex")
        XCTAssertEqual(parsed.document.segments.last?.blocks.first?.targetWpm, 160)

        let eofFrontMatter = TpsRuntime.parseTps("---\nbase_wpm: 150\n---")
        XCTAssertTrue(eofFrontMatter.ok)
        XCTAssertEqual(eofFrontMatter.document.metadata["base_wpm"], "150")
    }

    func testAuthoringEdgeCasesAndPlayerGuardRails() throws {
        let source = TpsRuntime.compileTps("""
        ## [Signal|focused]
        ### [Body]
        [180WPM][slow]*beta*[/slow][normal]**gamma**[/normal][/180WPM] [phonetic:ˈkæməl]camel[/phonetic] literal \\/ slash \\[tag\\]
        """)
        XCTAssertTrue(source.ok)
        let words = spokenWords(source.script)
        XCTAssertEqual(words.first(where: { $0.cleanText == "beta" })?.metadata.speedOverride, 144)
        XCTAssertEqual(words.first(where: { $0.cleanText == "beta" })?.metadata.emphasisLevel, 1)
        XCTAssertEqual(words.first(where: { $0.cleanText == "gamma" })?.metadata.speedOverride, 180)
        XCTAssertEqual(words.first(where: { $0.cleanText == "gamma" })?.metadata.emphasisLevel, 2)
        XCTAssertEqual(words.first(where: { $0.cleanText == "camel" })?.metadata.phoneticGuide, "ˈkæməl")
        XCTAssertTrue(words.contains(where: { $0.cleanText == "/" }))
        XCTAssertTrue(words.contains(where: { $0.cleanText == "[tag]" }))

        let malformed = TpsRuntime.compileTps("""
        ## [Broken|260WPM|Mystery]

        ### [Body]
        [unknown]tag[/unknown] [edit_point:critical] [slow]dangling
        """)
        XCTAssertFalse(malformed.ok)
        XCTAssertEqual(
            malformed.diagnostics.map(\.code),
            ["invalid-wpm", "invalid-header-parameter", "unknown-tag", "invalid-tag-argument", "unclosed-tag"]
        )
        XCTAssertTrue(spokenWords(malformed.script).contains { $0.cleanText.contains("[unknown]tag[/unknown]") })

        let punctuation = TpsRuntime.compileTps("""
        ## [Signal|neutral]
        ### [Body]
        A/b stays literal. [emphasis]Done[/emphasis], / dash - restored.
        """)
        let punctuationWords = spokenWords(punctuation.script).map(\.cleanText)
        XCTAssertTrue(punctuationWords.contains("A/b"))
        XCTAssertTrue(punctuationWords.contains("Done,"))
        XCTAssertTrue(punctuationWords.contains("dash -"))
        XCTAssertEqual(punctuation.script.words.filter { $0.kind == "pause" }.count, 1)

        let empty = TpsRuntime.compileTps("")
        XCTAssertTrue(empty.ok)
        XCTAssertEqual(TpsPlayer(empty.script).getState(0).currentWordIndex, -1)

        let player = TpsPlayer(source.script)
        XCTAssertEqual(player.seek(0).elapsedMs, 0)
        XCTAssertEqual(player.enumerateStates(stepMs: max(1, source.script.totalDurationMs / 2)).last?.isComplete, true)
    }

    func testCompiledJsonGuardsAndPlaybackLifecycle() throws {
        let compiled = TpsRuntime.compileTps("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.\n## [Wrap]\n### [Body]\nDone.")
        let canonicalTransport = try readJsonFixture("transport/runtime-parity.compiled.json")

        XCTAssertThrowsError(try parseCompiledScriptJson(""))
        XCTAssertThrowsError(try parseCompiledScriptJson("[]"))

        let session = TpsPlaybackSession(compiled.script, options: .init(tickIntervalMs: 10, initialSpeedOffsetWpm: -10))
        let standalone = try TpsStandalonePlayer.fromCompiledJson(try jsonString(canonicalTransport))
        var statuses: [String] = []
        var words: [String] = []
        var snapshots: [TpsPlaybackSnapshot] = []

        let removeStatus = session.on("statusChanged") { event in
            let payload = event as! [String: Any]
            statuses.append(payload["status"] as! String)
        }
        let removeWord = session.on("wordChanged") { event in
            let payload = event as! [String: Any]
            let state = payload["state"] as! PlayerState
            words.append(state.currentWord?.cleanText ?? "")
        }
        let removeSnapshot = session.observeSnapshot { snapshot in
            snapshots.append(snapshot)
        }

        XCTAssertEqual(session.seek(0).elapsedMs, 0)
        XCTAssertEqual(session.status, .idle)
        XCTAssertEqual(session.nextBlock().currentBlock?.name, "Close")
        XCTAssertEqual(session.previousBlock().currentBlock?.name, "Lead")
        XCTAssertEqual(session.nextWord().currentWord?.cleanText, "Now.")
        XCTAssertEqual(session.previousWord().currentWord?.cleanText, "Ready.")
        XCTAssertEqual(session.increaseSpeed(20).tempo.effectiveBaseWpm, 150)
        XCTAssertEqual(session.pause().currentWord?.cleanText, "Ready.")
        XCTAssertEqual(session.stop().elapsedMs, 0)

        removeStatus()
        removeWord()
        removeSnapshot()

        let completed = expectation(description: "completed-again")
        let disposeCompleted = session.on("completed") { _ in completed.fulfill() }
        _ = session.play()
        wait(for: [completed], timeout: 3)
        disposeCompleted()

        XCTAssertEqual(session.status, .completed)
        XCTAssertEqual(standalone.snapshot.state.currentSegment?.name, "Call to Action")
        XCTAssertFalse(statuses.isEmpty)
        XCTAssertTrue(words.contains("Ready."))
        XCTAssertEqual(snapshots.first?.state.currentWord?.cleanText, "Ready.")

        session.dispose()
        standalone.dispose()
    }

    func testPlaybackNavigationAndTimer() throws {
        let compilation = TpsRuntime.compileTps("## [Signal]\n### [Body]\nReady now.")
        let session = TpsPlaybackSession(compilation.script, options: .init(tickIntervalMs: 10))
        XCTAssertEqual(session.snapshot.state.currentWord?.cleanText, "Ready")

        _ = session.nextWord()
        XCTAssertEqual(session.snapshot.state.currentWord?.cleanText, "now.")

        _ = session.previousWord()
        XCTAssertEqual(session.snapshot.state.currentWord?.cleanText, "Ready")

        _ = session.increaseSpeed(20)
        XCTAssertEqual(session.snapshot.tempo.effectiveBaseWpm, 160)

        let expectation = expectation(description: "completed")
        let dispose = session.on("completed") { _ in expectation.fulfill() }
        _ = session.play()
        wait(for: [expectation], timeout: 3)
        dispose()
        XCTAssertEqual(session.status, .completed)
        session.dispose()
    }

    func testLargeGeneratedScript() {
        var lines: [String] = ["---", "base_wpm: 140", "---", ""]
        for segmentIndex in 1...8 {
            lines.append("## [Segment \(segmentIndex)|focused|Speaker:Host]")
            for blockIndex in 1...10 {
                lines.append("### [Block \(blockIndex)|150WPM]")
                for sentenceIndex in 1...6 {
                    lines.append("[slow]Generated[/slow] script segment \(segmentIndex) block \(blockIndex) sentence \(sentenceIndex) for performance coverage. //")
                }
                lines.append("[pause:1s]")
            }
        }
        let result = TpsRuntime.compileTps(lines.joined(separator: "\n"))
        XCTAssertTrue(result.ok)
        XCTAssertGreaterThan(result.script.words.count, 2000)
        let player = TpsPlayer(result.script)
        let states = player.enumerateStates(stepMs: max(1, result.script.totalDurationMs / 10))
        XCTAssertEqual(states.first?.currentSegment?.name, "Segment 1")
        XCTAssertTrue(states.last?.isComplete == true)
    }

    private func readFixture(_ relativePath: String) -> String {
        let url = fixturesDir.appendingPathComponent(relativePath)
        return try! String(contentsOf: url, encoding: .utf8)
    }

    private func readExample(_ fileName: String) -> String {
        try! String(contentsOf: examplesDir.appendingPathComponent(fileName), encoding: .utf8)
    }

    private func readJsonFixture(_ relativePath: String) throws -> [String: Any] {
        let data = try Data(contentsOf: fixturesDir.appendingPathComponent(relativePath))
        return try JSONSerialization.jsonObject(with: data) as! [String: Any]
    }
}

private func jsonString(_ value: Any) throws -> String {
    let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
    return String(data: data, encoding: .utf8)!
}

private func spokenWords(_ script: CompiledScript) -> [CompiledWord] {
    script.words.filter { $0.kind == "word" }
}

private func exampleSnapshot(fileName: String, script: CompiledScript) -> [String: Any] {
    let player = TpsPlayer(script)
    let session = TpsPlaybackSession(script)
    let standalone = TpsStandalonePlayer.fromCompiledScript(script)
    defer {
        session.dispose()
        standalone.dispose()
    }
    return [
        "fileName": fileName,
        "source": "examples/\(fileName)",
        "compiled": compiledSnapshot(script),
        "player": [
            "checkpoints": checkpointTimes(totalDurationMs: script.totalDurationMs).map { label, elapsedMs in
                normalizePlayerState(label: label, state: player.getState(elapsedMs))
            }
        ],
        "playback": [
            "session": playbackSequence(session),
            "standalone": playbackSequence(standalone)
        ]
    ]
}

private func checkpointTimes(totalDurationMs: Int) -> [(String, Int)] {
    let raw: [(String, Int)] = [
        ("start", 0),
        ("quarter", Int(round(Double(totalDurationMs) * 0.25))),
        ("middle", Int(round(Double(totalDurationMs) * 0.5))),
        ("threeQuarter", Int(round(Double(totalDurationMs) * 0.75))),
        ("complete", totalDurationMs)
    ]
    var seen: Set<Int> = []
    return raw.filter { seen.insert($0.1).inserted }
}

private func scriptJson(_ script: CompiledScript) -> [String: Any] {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    let data = try! encoder.encode(script)
    return try! JSONSerialization.jsonObject(with: data) as! [String: Any]
}

private func compiledSnapshot(_ script: CompiledScript) -> [String: Any] {
    [
        "metadata": script.metadata.sorted { $0.key < $1.key }.reduce(into: [String: String]()) { $0[$1.key] = $1.value },
        "totalDurationMs": script.totalDurationMs,
        "segments": script.segments.map(normalizeSegment),
        "words": script.words.map(normalizeWord)
    ]
}

private func normalizeSegment(_ segment: CompiledSegment) -> [String: Any] {
    compact([
        "id": segment.id,
        "name": segment.name,
        "targetWpm": segment.targetWpm,
        "emotion": segment.emotion,
        "speaker": segment.speaker,
        "timing": segment.timing,
        "backgroundColor": segment.backgroundColor,
        "textColor": segment.textColor,
        "accentColor": segment.accentColor,
        "startWordIndex": segment.startWordIndex,
        "endWordIndex": segment.endWordIndex,
        "startMs": segment.startMs,
        "endMs": segment.endMs,
        "wordIds": segment.words.map(\.id),
        "blocks": segment.blocks.map(normalizeBlock)
    ])
}

private func normalizeBlock(_ block: CompiledBlock) -> [String: Any] {
    compact([
        "id": block.id,
        "name": block.name,
        "targetWpm": block.targetWpm,
        "emotion": block.emotion,
        "speaker": block.speaker,
        "isImplicit": block.isImplicit,
        "startWordIndex": block.startWordIndex,
        "endWordIndex": block.endWordIndex,
        "startMs": block.startMs,
        "endMs": block.endMs,
        "wordIds": block.words.map(\.id),
        "phrases": block.phrases.map(normalizePhrase)
    ])
}

private func normalizePhrase(_ phrase: CompiledPhrase) -> [String: Any] {
    [
        "id": phrase.id,
        "text": phrase.text,
        "startWordIndex": phrase.startWordIndex,
        "endWordIndex": phrase.endWordIndex,
        "startMs": phrase.startMs,
        "endMs": phrase.endMs,
        "wordIds": phrase.words.map(\.id)
    ]
}

private func normalizeWord(_ word: CompiledWord) -> [String: Any] {
    compact([
        "id": word.id,
        "index": word.index,
        "kind": word.kind,
        "cleanText": word.cleanText,
        "characterCount": word.characterCount,
        "orpPosition": word.orpPosition,
        "displayDurationMs": word.displayDurationMs,
        "startMs": word.startMs,
        "endMs": word.endMs,
        "metadata": compact([
            "isEmphasis": word.metadata.isEmphasis,
            "emphasisLevel": word.metadata.emphasisLevel,
            "isPause": word.metadata.isPause,
            "pauseDurationMs": word.metadata.pauseDurationMs,
            "isHighlight": word.metadata.isHighlight,
            "isBreath": word.metadata.isBreath,
            "isEditPoint": word.metadata.isEditPoint,
            "editPointPriority": word.metadata.editPointPriority,
            "emotionHint": word.metadata.emotionHint,
            "inlineEmotionHint": word.metadata.inlineEmotionHint,
            "volumeLevel": word.metadata.volumeLevel,
            "deliveryMode": word.metadata.deliveryMode,
            "phoneticGuide": word.metadata.phoneticGuide,
            "pronunciationGuide": word.metadata.pronunciationGuide,
            "stressText": word.metadata.stressText,
            "stressGuide": word.metadata.stressGuide,
            "speedOverride": word.metadata.speedOverride,
            "speedMultiplier": normalizeNumber(word.metadata.speedMultiplier),
            "speaker": word.metadata.speaker,
            "headCue": word.metadata.headCue
        ]),
        "segmentId": word.segmentId,
        "blockId": word.blockId,
        "phraseId": word.phraseId
    ])
}

private func normalizePlayerState(label: String, state: PlayerState) -> [String: Any] {
    compact([
        "label": label,
        "elapsedMs": state.elapsedMs,
        "remainingMs": state.remainingMs,
        "progress": normalizeNumber(state.progress),
        "isComplete": state.isComplete,
        "currentWordIndex": state.currentWordIndex,
        "currentWordId": state.currentWord?.id,
        "currentWordText": state.currentWord?.cleanText,
        "currentWordKind": state.currentWord?.kind,
        "previousWordId": state.previousWord?.id,
        "nextWordId": state.nextWord?.id,
        "currentSegmentId": state.currentSegment?.id,
        "currentBlockId": state.currentBlock?.id,
        "currentPhraseId": state.currentPhrase?.id,
        "nextTransitionMs": state.nextTransitionMs,
        "presentation": compact([
            "segmentName": state.presentation.segmentName,
            "blockName": state.presentation.blockName,
            "phraseText": state.presentation.phraseText,
            "visibleWordIds": state.presentation.visibleWords.map(\.id),
            "visibleWordTexts": state.presentation.visibleWords.map(\.cleanText),
            "activeWordInPhrase": state.presentation.activeWordInPhrase
        ])
    ])
}

private func playbackSequence(_ controller: AnyObject) -> [[String: Any]] {
    var snapshots: [[String: Any]] = []
    if let controller = controller as? TpsPlaybackSession {
        snapshots.append(normalizePlaybackSnapshot(label: "initial", snapshot: controller.snapshot))
        _ = controller.nextWord()
        snapshots.append(normalizePlaybackSnapshot(label: "afterNextWord", snapshot: controller.snapshot))
        _ = controller.previousWord()
        snapshots.append(normalizePlaybackSnapshot(label: "afterPreviousWord", snapshot: controller.snapshot))
        _ = controller.nextBlock()
        snapshots.append(normalizePlaybackSnapshot(label: "afterNextBlock", snapshot: controller.snapshot))
        _ = controller.previousBlock()
        snapshots.append(normalizePlaybackSnapshot(label: "afterPreviousBlock", snapshot: controller.snapshot))
        _ = controller.increaseSpeed()
        snapshots.append(normalizePlaybackSnapshot(label: "afterIncreaseSpeed", snapshot: controller.snapshot))
        _ = controller.decreaseSpeed(controller.snapshot.tempo.speedStepWpm)
        snapshots.append(normalizePlaybackSnapshot(label: "afterDecreaseSpeed", snapshot: controller.snapshot))
    } else if let controller = controller as? TpsStandalonePlayer {
        snapshots.append(normalizePlaybackSnapshot(label: "initial", snapshot: controller.snapshot))
        _ = controller.nextWord()
        snapshots.append(normalizePlaybackSnapshot(label: "afterNextWord", snapshot: controller.snapshot))
        _ = controller.previousWord()
        snapshots.append(normalizePlaybackSnapshot(label: "afterPreviousWord", snapshot: controller.snapshot))
        _ = controller.nextBlock()
        snapshots.append(normalizePlaybackSnapshot(label: "afterNextBlock", snapshot: controller.snapshot))
        _ = controller.previousBlock()
        snapshots.append(normalizePlaybackSnapshot(label: "afterPreviousBlock", snapshot: controller.snapshot))
        _ = controller.increaseSpeed()
        snapshots.append(normalizePlaybackSnapshot(label: "afterIncreaseSpeed", snapshot: controller.snapshot))
        _ = controller.decreaseSpeed(controller.snapshot.tempo.speedStepWpm)
        snapshots.append(normalizePlaybackSnapshot(label: "afterDecreaseSpeed", snapshot: controller.snapshot))
    }
    return snapshots
}

private func normalizePlaybackSnapshot(label: String, snapshot: TpsPlaybackSnapshot) -> [String: Any] {
    compact([
        "label": label,
        "status": snapshot.status.rawValue,
        "state": normalizePlayerState(label: "state", state: snapshot.state),
        "tempo": compact([
            "baseWpm": snapshot.tempo.baseWpm,
            "effectiveBaseWpm": snapshot.tempo.effectiveBaseWpm,
            "speedOffsetWpm": snapshot.tempo.speedOffsetWpm,
            "speedStepWpm": snapshot.tempo.speedStepWpm,
            "playbackRate": normalizeNumber(snapshot.tempo.playbackRate)
        ]),
        "controls": [
            "canPlay": snapshot.controls.canPlay,
            "canPause": snapshot.controls.canPause,
            "canStop": snapshot.controls.canStop,
            "canNextWord": snapshot.controls.canNextWord,
            "canPreviousWord": snapshot.controls.canPreviousWord,
            "canNextBlock": snapshot.controls.canNextBlock,
            "canPreviousBlock": snapshot.controls.canPreviousBlock,
            "canIncreaseSpeed": snapshot.controls.canIncreaseSpeed,
            "canDecreaseSpeed": snapshot.controls.canDecreaseSpeed,
        ],
        "focusedWordId": snapshot.focusedWord?.word.id,
        "focusedWordText": snapshot.focusedWord?.word.cleanText,
        "currentWordDurationMs": snapshot.currentWordDurationMs,
        "currentWordRemainingMs": snapshot.currentWordRemainingMs,
        "currentSegmentIndex": snapshot.currentSegmentIndex,
        "currentBlockIndex": snapshot.currentBlockIndex,
        "visibleWords": snapshot.visibleWords.map {
            compact([
                "id": $0.word.id,
                "text": $0.word.cleanText,
                "isActive": $0.isActive,
                "isRead": $0.isRead,
                "isUpcoming": $0.isUpcoming,
                "emotion": $0.emotion,
                "speaker": $0.speaker,
                "emphasisLevel": $0.emphasisLevel,
                "isHighlighted": $0.isHighlighted,
                "deliveryMode": $0.deliveryMode,
                "volumeLevel": $0.volumeLevel
            ])
        }
    ])
}

private func compact(_ value: [String: Any?]) -> [String: Any] {
    value.reduce(into: [String: Any]()) { partialResult, entry in
        if let value = entry.value {
            partialResult[entry.key] = value
        }
    }
}

private func normalizeNumber(_ value: Double?) -> Double? {
    guard let value else { return nil }
    return (value * 1_000_000).rounded() / 1_000_000
}

private func XCTAssertJsonEqual(actual: [String: Any], expected: [String: Any], file: StaticString = #filePath, line: UInt = #line) throws {
    let actualData = try JSONSerialization.data(withJSONObject: actual, options: [.sortedKeys])
    let expectedData = try JSONSerialization.data(withJSONObject: expected, options: [.sortedKeys])
    XCTAssertEqual(String(decoding: actualData, as: UTF8.self), String(decoding: expectedData, as: UTF8.self), file: file, line: line)
}
