import Foundation

public struct TpsPosition: Codable, Equatable {
    public let line: Int
    public let column: Int
    public let offset: Int
}

public struct TpsRange: Codable, Equatable {
    public let start: TpsPosition
    public let end: TpsPosition
}

public struct TpsDiagnostic: Codable, Equatable {
    public let code: String
    public let severity: String
    public let message: String
    public let suggestion: String?
    public let range: TpsRange
}

public struct TpsValidationResult {
    public let ok: Bool
    public let diagnostics: [TpsDiagnostic]
}

public struct TpsParseResult {
    public let ok: Bool
    public let diagnostics: [TpsDiagnostic]
    public let document: TpsDocument
}

public struct TpsCompilationResult {
    public let ok: Bool
    public let diagnostics: [TpsDiagnostic]
    public let document: TpsDocument
    public let script: CompiledScript
}

public struct TpsNumericRange: Equatable, Sendable {
    public let min: Int
    public let max: Int
}

public struct TpsArchetypeProfile: Equatable, Sendable {
    public let articulation: String
    public let energy: TpsNumericRange
    public let melody: TpsNumericRange
    public let volume: String
    public let speed: TpsNumericRange
}

public struct TpsArchetypeRhythmProfile: Equatable, Sendable {
    public let phraseLength: TpsNumericRange
    public let pauseFrequencyPer100Words: TpsNumericRange
    public let averagePauseDurationMs: TpsNumericRange
    public let emphasisDensityPercent: TpsNumericRange
    public let speedVariationPer100Words: TpsNumericRange
}

public struct TpsDocument {
    public let metadata: [String: String]
    public let segments: [TpsSegment]
}

public struct TpsSegment {
    public let id: String
    public let name: String
    public let content: String
    public let targetWpm: Int?
    public let emotion: String?
    public let speaker: String?
    public let archetype: String?
    public let timing: String?
    public let backgroundColor: String?
    public let textColor: String?
    public let accentColor: String?
    public let leadingContent: String?
    public let blocks: [TpsBlock]
}

public struct TpsBlock {
    public let id: String
    public let name: String
    public let content: String
    public let targetWpm: Int?
    public let emotion: String?
    public let speaker: String?
    public let archetype: String?
}

public struct WordMetadata: Codable, Equatable {
    public let isEmphasis: Bool
    public let emphasisLevel: Int
    public let isPause: Bool
    public let pauseDurationMs: Int?
    public let isHighlight: Bool
    public let isBreath: Bool
    public let isEditPoint: Bool
    public let editPointPriority: String?
    public let emotionHint: String?
    public let inlineEmotionHint: String?
    public let volumeLevel: String?
    public let deliveryMode: String?
    public let phoneticGuide: String?
    public let pronunciationGuide: String?
    public let stressText: String?
    public let stressGuide: String?
    public let speedOverride: Int?
    public let speedMultiplier: Double?
    public let articulationStyle: String?
    public let energyLevel: Int?
    public let melodyLevel: Int?
    public let speaker: String?
    public let headCue: String?
}

public struct CompiledWord: Codable, Equatable {
    public let id: String
    public let index: Int
    public let kind: String
    public let cleanText: String
    public let characterCount: Int
    public let orpPosition: Int
    public let displayDurationMs: Int
    public let startMs: Int
    public let endMs: Int
    public let metadata: WordMetadata
    public let segmentId: String
    public let blockId: String
    public let phraseId: String
}

public struct CompiledPhrase: Codable, Equatable {
    public let id: String
    public let text: String
    public let startWordIndex: Int
    public let endWordIndex: Int
    public let startMs: Int
    public let endMs: Int
    public let words: [CompiledWord]
}

public struct CompiledBlock: Codable, Equatable {
    public let id: String
    public let name: String
    public let targetWpm: Int
    public let emotion: String
    public let speaker: String?
    public let archetype: String?
    public let isImplicit: Bool
    public let startWordIndex: Int
    public let endWordIndex: Int
    public let startMs: Int
    public let endMs: Int
    public let phrases: [CompiledPhrase]
    public let words: [CompiledWord]
}

public struct CompiledSegment: Codable, Equatable {
    public let id: String
    public let name: String
    public let targetWpm: Int
    public let emotion: String
    public let speaker: String?
    public let archetype: String?
    public let timing: String?
    public let backgroundColor: String
    public let textColor: String
    public let accentColor: String
    public let startWordIndex: Int
    public let endWordIndex: Int
    public let startMs: Int
    public let endMs: Int
    public let blocks: [CompiledBlock]
    public let words: [CompiledWord]
}

public struct CompiledScript: Codable, Equatable {
    public let metadata: [String: String]
    public let totalDurationMs: Int
    public let segments: [CompiledSegment]
    public let words: [CompiledWord]
}

public struct PlayerPresentationModel {
    public let segmentName: String?
    public let blockName: String?
    public let phraseText: String?
    public let visibleWords: [CompiledWord]
    public let activeWordInPhrase: Int
}

public struct PlayerState {
    public let elapsedMs: Int
    public let remainingMs: Int
    public let progress: Double
    public let isComplete: Bool
    public let currentWordIndex: Int
    public let currentWord: CompiledWord?
    public let previousWord: CompiledWord?
    public let nextWord: CompiledWord?
    public let currentSegment: CompiledSegment?
    public let currentBlock: CompiledBlock?
    public let currentPhrase: CompiledPhrase?
    public let nextTransitionMs: Int?
    public let presentation: PlayerPresentationModel
}

public enum TpsPlaybackStatus: String, Codable {
    case idle
    case playing
    case paused
    case completed
}

public enum TpsPlaybackDefaults {
    public static let defaultSpeedStepWpm = 10
    public static let defaultTickIntervalMs = 16
}

public enum TpsPlaybackEventNames {
    public static let stateChanged = "stateChanged"
    public static let wordChanged = "wordChanged"
    public static let phraseChanged = "phraseChanged"
    public static let blockChanged = "blockChanged"
    public static let segmentChanged = "segmentChanged"
    public static let statusChanged = "statusChanged"
    public static let completed = "completed"
    public static let snapshotChanged = "snapshotChanged"
}

public struct TpsPlaybackSessionOptions {
    public let tickIntervalMs: Int?
    public let baseWpm: Int?
    public let speedStepWpm: Int?
    public let initialSpeedOffsetWpm: Int?
    public let autoPlay: Bool

    public init(
        tickIntervalMs: Int? = nil,
        baseWpm: Int? = nil,
        speedStepWpm: Int? = nil,
        initialSpeedOffsetWpm: Int? = nil,
        autoPlay: Bool = false
    ) {
        self.tickIntervalMs = tickIntervalMs
        self.baseWpm = baseWpm
        self.speedStepWpm = speedStepWpm
        self.initialSpeedOffsetWpm = initialSpeedOffsetWpm
        self.autoPlay = autoPlay
    }
}

public struct TpsPlaybackTempo {
    public let baseWpm: Int
    public let effectiveBaseWpm: Int
    public let speedOffsetWpm: Int
    public let speedStepWpm: Int
    public let playbackRate: Double
}

public struct TpsPlaybackControls {
    public let canPlay: Bool
    public let canPause: Bool
    public let canStop: Bool
    public let canNextWord: Bool
    public let canPreviousWord: Bool
    public let canNextBlock: Bool
    public let canPreviousBlock: Bool
    public let canIncreaseSpeed: Bool
    public let canDecreaseSpeed: Bool
}

public struct TpsPlaybackWordView {
    public let word: CompiledWord
    public let isActive: Bool
    public let isRead: Bool
    public let isUpcoming: Bool
    public let emotion: String
    public let speaker: String?
    public let emphasisLevel: Int
    public let isHighlighted: Bool
    public let deliveryMode: String?
    public let volumeLevel: String?
}

public struct TpsPlaybackSnapshot {
    public let status: TpsPlaybackStatus
    public let state: PlayerState
    public let tempo: TpsPlaybackTempo
    public let controls: TpsPlaybackControls
    public let visibleWords: [TpsPlaybackWordView]
    public let focusedWord: TpsPlaybackWordView?
    public let currentWordDurationMs: Int?
    public let currentWordRemainingMs: Int?
    public let currentSegmentIndex: Int
    public let currentBlockIndex: Int
}

public enum TpsFrontMatterKeys {
    public static let title = "title"
    public static let profile = "profile"
    public static let duration = "duration"
    public static let baseWpm = "base_wpm"
    public static let author = "author"
    public static let created = "created"
    public static let version = "version"
    public static let speedOffsetsXslow = "speed_offsets.xslow"
    public static let speedOffsetsSlow = "speed_offsets.slow"
    public static let speedOffsetsFast = "speed_offsets.fast"
    public static let speedOffsetsXfast = "speed_offsets.xfast"
}

public enum TpsTags {
    public static let aside = "aside"
    public static let breath = "breath"
    public static let building = "building"
    public static let editPoint = "edit_point"
    public static let emphasis = "emphasis"
    public static let energy = "energy"
    public static let fast = "fast"
    public static let highlight = "highlight"
    public static let legato = "legato"
    public static let loud = "loud"
    public static let melody = "melody"
    public static let normal = "normal"
    public static let pause = "pause"
    public static let phonetic = "phonetic"
    public static let pronunciation = "pronunciation"
    public static let rhetorical = "rhetorical"
    public static let sarcasm = "sarcasm"
    public static let slow = "slow"
    public static let soft = "soft"
    public static let staccato = "staccato"
    public static let stress = "stress"
    public static let whisper = "whisper"
    public static let xfast = "xfast"
    public static let xslow = "xslow"
}

public enum TpsDiagnosticCodes {
    public static let archetypeArticulationMismatch = "archetype-articulation-mismatch"
    public static let archetypeEnergyMismatch = "archetype-energy-mismatch"
    public static let archetypeMelodyMismatch = "archetype-melody-mismatch"
    public static let archetypeRhythmEmphasisDensity = "archetype-rhythm-emphasis-density"
    public static let archetypeRhythmPauseDuration = "archetype-rhythm-pause-duration"
    public static let archetypeRhythmPauseFrequency = "archetype-rhythm-pause-frequency"
    public static let archetypeRhythmPhraseLength = "archetype-rhythm-phrase-length"
    public static let archetypeRhythmSpeedVariation = "archetype-rhythm-speed-variation"
    public static let archetypeSpeedMismatch = "archetype-speed-mismatch"
    public static let archetypeVolumeMismatch = "archetype-volume-mismatch"
    public static let invalidFrontMatter = "invalid-front-matter"
    public static let invalidHeader = "invalid-header"
    public static let invalidHeaderParameter = "invalid-header-parameter"
    public static let unterminatedTag = "unterminated-tag"
    public static let unknownTag = "unknown-tag"
    public static let invalidPause = "invalid-pause"
    public static let invalidTagArgument = "invalid-tag-argument"
    public static let invalidWpm = "invalid-wpm"
    public static let invalidEnergyLevel = "invalid-energy-level"
    public static let invalidMelodyLevel = "invalid-melody-level"
    public static let unknownArchetype = "unknown-archetype"
    public static let mismatchedClosingTag = "mismatched-closing-tag"
    public static let unclosedTag = "unclosed-tag"
}

public enum TpsSpec {
    public static let defaultBaseWpm = 140
    public static let defaultEmotion = "neutral"
    public static let defaultImplicitSegmentName = "Content"
    public static let defaultProfile = "Actor"
    public static let minimumWpm = 80
    public static let maximumWpm = 220
    public static let shortPauseDurationMs = 300
    public static let mediumPauseDurationMs = 600
    public static let speakerPrefix = "Speaker:"
    public static let archetypePrefix = "Archetype:"
    public static let wpmSuffix = "WPM"
    public static let emotions = [
        "neutral", "warm", "professional", "focused", "concerned", "urgent",
        "motivational", "excited", "happy", "sad", "calm", "energetic"
    ]
    public static let volumeLevels = [TpsTags.loud, TpsTags.soft, TpsTags.whisper]
    public static let deliveryModes = [TpsTags.sarcasm, TpsTags.aside, TpsTags.rhetorical, TpsTags.building]
    public static let articulationStyles = [TpsTags.legato, TpsTags.staccato]
    public static let archetypeFriend = "friend"
    public static let archetypeMotivator = "motivator"
    public static let archetypeEducator = "educator"
    public static let archetypeCoach = "coach"
    public static let archetypeStoryteller = "storyteller"
    public static let archetypeEntertainer = "entertainer"
    public static let archetypeRhythmMinimumWords = 12

    public static let archetypes = [archetypeFriend, archetypeMotivator, archetypeEducator, archetypeCoach, archetypeStoryteller, archetypeEntertainer]
    public static let warningDiagnosticCodes: Set<String> = [
        TpsDiagnosticCodes.invalidHeaderParameter,
        TpsDiagnosticCodes.archetypeArticulationMismatch,
        TpsDiagnosticCodes.archetypeEnergyMismatch,
        TpsDiagnosticCodes.archetypeMelodyMismatch,
        TpsDiagnosticCodes.archetypeVolumeMismatch,
        TpsDiagnosticCodes.archetypeSpeedMismatch,
        TpsDiagnosticCodes.archetypeRhythmPhraseLength,
        TpsDiagnosticCodes.archetypeRhythmPauseFrequency,
        TpsDiagnosticCodes.archetypeRhythmPauseDuration,
        TpsDiagnosticCodes.archetypeRhythmEmphasisDensity,
        TpsDiagnosticCodes.archetypeRhythmSpeedVariation,
    ]
    public static let archetypeRecommendedWpm: [String: Int] = [archetypeFriend: 135, archetypeMotivator: 155, archetypeEducator: 120, archetypeCoach: 145, archetypeStoryteller: 125, archetypeEntertainer: 150]
    public static let archetypeArticulationExpectations = [
        "legato": "legato",
        "staccato": "staccato",
        "neutral": "neutral",
        "flexible": "flexible",
    ]
    public static let archetypeVolumeExpectations = [
        "defaultOnly": "default-only",
        "softOrDefault": "soft-or-default",
        "loudOnly": "loud-only",
        "flexible": "flexible",
    ]
    public static let archetypeProfiles: [String: TpsArchetypeProfile] = [
        archetypeFriend: .init(articulation: "legato", energy: .init(min: 4, max: 6), melody: .init(min: 6, max: 8), volume: "soft-or-default", speed: .init(min: 125, max: 150)),
        archetypeMotivator: .init(articulation: "legato", energy: .init(min: 7, max: 10), melody: .init(min: 7, max: 9), volume: "loud-only", speed: .init(min: 145, max: 170)),
        archetypeEducator: .init(articulation: "neutral", energy: .init(min: 3, max: 5), melody: .init(min: 2, max: 4), volume: "default-only", speed: .init(min: 110, max: 135)),
        archetypeCoach: .init(articulation: "staccato", energy: .init(min: 7, max: 9), melody: .init(min: 1, max: 3), volume: "loud-only", speed: .init(min: 135, max: 160)),
        archetypeStoryteller: .init(articulation: "flexible", energy: .init(min: 4, max: 7), melody: .init(min: 8, max: 10), volume: "flexible", speed: .init(min: 100, max: 150)),
        archetypeEntertainer: .init(articulation: "flexible", energy: .init(min: 6, max: 8), melody: .init(min: 7, max: 9), volume: "flexible", speed: .init(min: 140, max: 165)),
    ]
    public static let archetypeRhythmProfiles: [String: TpsArchetypeRhythmProfile] = [
        archetypeFriend: .init(phraseLength: .init(min: 8, max: 15), pauseFrequencyPer100Words: .init(min: 4, max: 8), averagePauseDurationMs: .init(min: 300, max: 600), emphasisDensityPercent: .init(min: 3, max: 8), speedVariationPer100Words: .init(min: 0, max: 1)),
        archetypeMotivator: .init(phraseLength: .init(min: 8, max: 20), pauseFrequencyPer100Words: .init(min: 3, max: 6), averagePauseDurationMs: .init(min: 600, max: 2000), emphasisDensityPercent: .init(min: 10, max: 20), speedVariationPer100Words: .init(min: 0, max: 2)),
        archetypeEducator: .init(phraseLength: .init(min: 10, max: 25), pauseFrequencyPer100Words: .init(min: 6, max: 12), averagePauseDurationMs: .init(min: 400, max: 800), emphasisDensityPercent: .init(min: 3, max: 8), speedVariationPer100Words: .init(min: 0, max: 2)),
        archetypeCoach: .init(phraseLength: .init(min: 3, max: 8), pauseFrequencyPer100Words: .init(min: 8, max: 15), averagePauseDurationMs: .init(min: 200, max: 400), emphasisDensityPercent: .init(min: 15, max: 30), speedVariationPer100Words: .init(min: 0, max: 2)),
        archetypeStoryteller: .init(phraseLength: .init(min: 5, max: 20), pauseFrequencyPer100Words: .init(min: 4, max: 10), averagePauseDurationMs: .init(min: 500, max: 3000), emphasisDensityPercent: .init(min: 5, max: 12), speedVariationPer100Words: .init(min: 3, max: 6)),
        archetypeEntertainer: .init(phraseLength: .init(min: 5, max: 15), pauseFrequencyPer100Words: .init(min: 5, max: 10), averagePauseDurationMs: .init(min: 300, max: 2000), emphasisDensityPercent: .init(min: 5, max: 15), speedVariationPer100Words: .init(min: 2, max: 4)),
    ]
    public static let energyLevelMin = 1
    public static let energyLevelMax = 10
    public static let melodyLevelMin = 1
    public static let melodyLevelMax = 10
    public static let relativeSpeedTags = [TpsTags.xslow, TpsTags.slow, TpsTags.fast, TpsTags.xfast, TpsTags.normal]
    public static let editPointPriorities = ["high", "medium", "low"]
    public static let defaultSpeedOffsets = [
        TpsTags.xslow: -40,
        TpsTags.slow: -20,
        TpsTags.fast: 25,
        TpsTags.xfast: 50,
    ]
    public static let emotionPalettes = [
        "neutral": ["accent": "#2563EB", "text": "#0F172A", "background": "#60A5FA"],
        "warm": ["accent": "#EA580C", "text": "#1C1917", "background": "#FDBA74"],
        "professional": ["accent": "#1D4ED8", "text": "#0F172A", "background": "#93C5FD"],
        "focused": ["accent": "#15803D", "text": "#052E16", "background": "#86EFAC"],
        "concerned": ["accent": "#B91C1C", "text": "#1F1111", "background": "#FCA5A5"],
        "urgent": ["accent": "#DC2626", "text": "#FFF7F7", "background": "#FCA5A5"],
        "motivational": ["accent": "#7C3AED", "text": "#FFFFFF", "background": "#C4B5FD"],
        "excited": ["accent": "#DB2777", "text": "#FFF7FB", "background": "#F9A8D4"],
        "happy": ["accent": "#D97706", "text": "#1C1917", "background": "#FCD34D"],
        "sad": ["accent": "#4F46E5", "text": "#EEF2FF", "background": "#A5B4FC"],
        "calm": ["accent": "#0F766E", "text": "#F0FDFA", "background": "#99F6E4"],
        "energetic": ["accent": "#C2410C", "text": "#FFF7ED", "background": "#FDBA74"],
    ]
    public static let emotionHeadCues = [
        "neutral": "H0", "calm": "H0", "professional": "H9", "focused": "H5",
        "motivational": "H9", "urgent": "H4", "concerned": "H1", "sad": "H1",
        "warm": "H7", "happy": "H6", "excited": "H6", "energetic": "H8"
    ]
}

public enum TpsKeywords {
    public static let tags: [String: String] = [
        "aside": TpsTags.aside,
        "breath": TpsTags.breath,
        "building": TpsTags.building,
        "editPoint": TpsTags.editPoint,
        "emphasis": TpsTags.emphasis,
        "energy": TpsTags.energy,
        "fast": TpsTags.fast,
        "highlight": TpsTags.highlight,
        "legato": TpsTags.legato,
        "loud": TpsTags.loud,
        "melody": TpsTags.melody,
        "normal": TpsTags.normal,
        "pause": TpsTags.pause,
        "phonetic": TpsTags.phonetic,
        "pronunciation": TpsTags.pronunciation,
        "rhetorical": TpsTags.rhetorical,
        "sarcasm": TpsTags.sarcasm,
        "slow": TpsTags.slow,
        "soft": TpsTags.soft,
        "staccato": TpsTags.staccato,
        "stress": TpsTags.stress,
        "whisper": TpsTags.whisper,
        "xfast": TpsTags.xfast,
        "xslow": TpsTags.xslow,
    ]
    public static let emotions = TpsSpec.emotions
    public static let volumeLevels = TpsSpec.volumeLevels
    public static let deliveryModes = TpsSpec.deliveryModes
    public static let articulationStyles = TpsSpec.articulationStyles
    public static let archetypes = TpsSpec.archetypes
    public static let archetypeProfiles = TpsSpec.archetypeProfiles
    public static let archetypeRhythmProfiles = TpsSpec.archetypeRhythmProfiles
    public static let warningDiagnosticCodes = TpsSpec.warningDiagnosticCodes
    public static let relativeSpeedTags = TpsSpec.relativeSpeedTags
    public static let editPointPriorities = TpsSpec.editPointPriorities
}

public enum TpsRuntime {
    public static func validateTps(_ source: String) -> TpsValidationResult {
        let analysis = parseDocument(source)
        var diagnostics = analysis.diagnostics
        _ = compileAnalysis(analysis, diagnostics: &diagnostics)
        return TpsValidationResult(ok: !hasErrors(diagnostics), diagnostics: diagnostics)
    }

    public static func parseTps(_ source: String) -> TpsParseResult {
        let analysis = parseDocument(source)
        var diagnostics = analysis.diagnostics
        _ = compileAnalysis(analysis, diagnostics: &diagnostics)
        return TpsParseResult(ok: !hasErrors(diagnostics), diagnostics: diagnostics, document: analysis.document)
    }

    public static func compileTps(_ source: String) -> TpsCompilationResult {
        let analysis = parseDocument(source)
        var diagnostics = analysis.diagnostics
        let script = normalizeCompiledScript(compileAnalysis(analysis, diagnostics: &diagnostics))
        return TpsCompilationResult(ok: !hasErrors(diagnostics), diagnostics: diagnostics, document: analysis.document, script: script)
    }
}

public final class TpsPlayer {
    private let compiledScript: CompiledScript
    private var segmentById: [String: CompiledSegment] = [:]
    private var blockById: [String: CompiledBlock] = [:]
    private var phraseById: [String: CompiledPhrase] = [:]

    public init(_ compiledScript: CompiledScript) {
        self.compiledScript = normalizeCompiledScript(compiledScript)
        for segment in self.compiledScript.segments {
            segmentById[segment.id] = segment
            for block in segment.blocks {
                blockById[block.id] = block
                for phrase in block.phrases {
                    phraseById[phrase.id] = phrase
                }
            }
        }
    }

    public var script: CompiledScript { compiledScript }

    public func getState(_ elapsedMs: Int) -> PlayerState {
        let clampedElapsed = clamp(elapsedMs, minimum: 0, maximum: compiledScript.totalDurationMs)
        let currentWord = findCurrentWord(clampedElapsed)
        let currentSegment = currentWord != nil ? currentWord.flatMap { segmentById[$0.segmentId] } : compiledScript.segments.first
        let currentBlock = currentWord != nil ? currentWord.flatMap { blockById[$0.blockId] } : currentSegment?.blocks.first
        let currentPhrase = currentWord != nil ? currentWord.flatMap { phraseById[$0.phraseId] } : currentBlock?.phrases.first
        let currentWordIndex = currentWord?.index ?? -1
        let previousWord = currentWordIndex > 0 ? compiledScript.words[currentWordIndex - 1] : nil
        let nextWord = currentWordIndex >= 0 && currentWordIndex + 1 < compiledScript.words.count ? compiledScript.words[currentWordIndex + 1] : nil
        let progress = compiledScript.totalDurationMs == 0 ? 1.0 : Double(clampedElapsed) / Double(compiledScript.totalDurationMs)
        let activeWordInPhrase = currentPhrase?.words.firstIndex(where: { $0.id == currentWord?.id }) ?? -1
        return PlayerState(
            elapsedMs: clampedElapsed,
            remainingMs: max(0, compiledScript.totalDurationMs - clampedElapsed),
            progress: progress,
            isComplete: clampedElapsed >= compiledScript.totalDurationMs,
            currentWordIndex: currentWordIndex,
            currentWord: currentWord,
            previousWord: previousWord,
            nextWord: nextWord,
            currentSegment: currentSegment,
            currentBlock: currentBlock,
            currentPhrase: currentPhrase,
            nextTransitionMs: currentWord?.endMs ?? compiledScript.totalDurationMs,
            presentation: PlayerPresentationModel(
                segmentName: currentSegment?.name,
                blockName: currentBlock?.name,
                phraseText: currentPhrase?.text,
                visibleWords: currentPhrase?.words ?? [],
                activeWordInPhrase: activeWordInPhrase
            )
        )
    }

    public func seek(_ elapsedMs: Int) -> PlayerState {
        getState(elapsedMs)
    }

    public func enumerateStates(stepMs: Int = 100) -> [PlayerState] {
        precondition(stepMs > 0, "stepMs must be greater than 0.")
        if compiledScript.totalDurationMs == 0 {
            return [getState(0)]
        }
        var states: [PlayerState] = []
        var elapsed = 0
        while elapsed < compiledScript.totalDurationMs {
            states.append(getState(elapsed))
            elapsed += stepMs
        }
        states.append(getState(compiledScript.totalDurationMs))
        return states
    }

    private func findCurrentWord(_ elapsedMs: Int) -> CompiledWord? {
        guard !compiledScript.words.isEmpty else { return nil }
        var low = 0
        var high = compiledScript.words.count - 1
        var candidateIndex = -1
        while low <= high {
            let middle = low + ((high - low) / 2)
            let word = compiledScript.words[middle]
            if word.endMs > elapsedMs {
                candidateIndex = middle
                high = middle - 1
            } else {
                low = middle + 1
            }
        }
        if candidateIndex >= 0 {
            for index in candidateIndex..<compiledScript.words.count {
                let word = compiledScript.words[index]
                if word.endMs > elapsedMs && word.endMs > word.startMs {
                    return word
                }
            }
        }
        return compiledScript.words.last
    }
}

public final class TpsPlaybackSession {
    public typealias Listener = (Any) -> Void
    private let blocks: [CompiledBlock]
    private let tickIntervalMs: Int
    private var listeners: [String: [UUID: Listener]] = [:]
    private var segmentIndexById: [String: Int] = [:]
    private var blockIndexById: [String: Int] = [:]
    private var timer: DispatchSourceTimer?
    private var playbackOffsetMs = 0
    private var playbackStartedAtMs = 0
    private var speedOffsetWpm: Int

    public let player: TpsPlayer
    public let baseWpm: Int
    public let speedStepWpm: Int
    public private(set) var currentState: PlayerState
    public private(set) var status: TpsPlaybackStatus = .idle

    public init(_ script: CompiledScript, options: TpsPlaybackSessionOptions = .init()) {
        self.player = TpsPlayer(script)
        self.currentState = player.getState(0)
        self.tickIntervalMs = normalizeTickInterval(options.tickIntervalMs)
        self.baseWpm = normalizeBaseWpm(options.baseWpm ?? resolveBaseWpm(player.script.metadata))
        self.speedStepWpm = normalizeSpeedStep(options.speedStepWpm)
        self.speedOffsetWpm = normalizeSpeedOffset(self.baseWpm, options.initialSpeedOffsetWpm ?? 0)
        self.blocks = flattenBlocks(player.script)
        for (index, segment) in player.script.segments.enumerated() {
            segmentIndexById[segment.id] = index
        }
        for (index, block) in blocks.enumerated() {
            blockIndexById[block.id] = index
        }
    }

    deinit {
        dispose()
    }

    public var isPlaying: Bool { status == .playing }
    public var effectiveBaseWpm: Int { clamp(baseWpm + speedOffsetWpm, minimum: TpsSpec.minimumWpm, maximum: TpsSpec.maximumWpm) }
    public var playbackRate: Double { baseWpm <= 0 ? 1 : Double(effectiveBaseWpm) / Double(baseWpm) }
    public var speedOffset: Int { speedOffsetWpm }
    public var snapshot: TpsPlaybackSnapshot { createSnapshot() }

    @discardableResult
    public func on(_ eventName: String, _ listener: @escaping Listener) -> () -> Void {
        let id = UUID()
        var bucket = listeners[eventName] ?? [:]
        bucket[id] = listener
        listeners[eventName] = bucket
        return { [weak self] in self?.listeners[eventName]?[id] = nil }
    }

    @discardableResult
    public func observeSnapshot(emitCurrent: Bool = true, _ listener: @escaping (TpsPlaybackSnapshot) -> Void) -> () -> Void {
        let unsubscribe = on(TpsPlaybackEventNames.snapshotChanged) { event in
            if let snapshot = event as? TpsPlaybackSnapshot {
                listener(snapshot)
            }
        }
        if emitCurrent {
            listener(snapshot)
        }
        return unsubscribe
    }

    public func play() -> PlayerState {
        if status == .playing { return currentState }
        if currentState.isComplete && player.script.totalDurationMs > 0 { _ = seek(0) }
        if player.script.totalDurationMs == 0 { return updatePosition(0, .completed) }
        playbackOffsetMs = currentState.elapsedMs
        playbackStartedAtMs = nowMs()
        clearTimer()
        updateStatus(.playing)
        emitSnapshotChanged()
        scheduleNextTick()
        return currentState
    }

    public func pause() -> PlayerState {
        if status != .playing { return currentState }
        let state = updatePosition(readLiveElapsedMs(), .paused)
        clearTimer()
        return state
    }

    public func stop() -> PlayerState {
        clearTimer()
        playbackOffsetMs = 0
        playbackStartedAtMs = 0
        return updatePosition(0, .idle)
    }

    public func seek(_ elapsedMs: Int) -> PlayerState {
        let nextStatus: TpsPlaybackStatus = status == .playing ? .playing : resolveStatusAfterSeek(status, totalDurationMs: player.script.totalDurationMs, elapsedMs: elapsedMs)
        let state = updatePosition(elapsedMs, nextStatus)
        if nextStatus == .playing {
            playbackOffsetMs = state.elapsedMs
            playbackStartedAtMs = nowMs()
            clearTimer()
            scheduleNextTick()
        }
        return state
    }

    public func advanceBy(_ deltaMs: Int) -> PlayerState { seek(currentState.elapsedMs + deltaMs) }

    public func nextWord() -> PlayerState {
        guard !player.script.words.isEmpty else { return currentState }
        guard let currentWord = currentState.currentWord else { return seek(player.script.words[0].startMs) }
        let nextIndex = min(currentWord.index + 1, player.script.words.count - 1)
        return seek(player.script.words[nextIndex].startMs)
    }

    public func previousWord() -> PlayerState {
        guard !player.script.words.isEmpty else { return currentState }
        guard let currentWord = currentState.currentWord else { return seek(0) }
        if currentState.elapsedMs > currentWord.startMs { return seek(currentWord.startMs) }
        let previousIndex = max(0, currentWord.index - 1)
        return seek(player.script.words[previousIndex].startMs)
    }

    public func nextBlock() -> PlayerState {
        guard !blocks.isEmpty else { return currentState }
        let currentIndex = currentState.currentBlock.flatMap { blockIndexById[$0.id] } ?? -1
        let nextIndex = currentIndex < 0 ? 0 : min(currentIndex + 1, blocks.count - 1)
        return seek(blocks[nextIndex].startMs)
    }

    public func previousBlock() -> PlayerState {
        guard !blocks.isEmpty else { return currentState }
        guard let currentBlock = currentState.currentBlock else { return seek(0) }
        let currentIndex = blockIndexById[currentBlock.id] ?? 0
        if currentState.elapsedMs > currentBlock.startMs { return seek(currentBlock.startMs) }
        let previousIndex = max(0, currentIndex - 1)
        return seek(blocks[previousIndex].startMs)
    }

    public func increaseSpeed(_ stepWpm: Int? = nil) -> TpsPlaybackSnapshot { setSpeedOffsetWpm(speedOffsetWpm + (stepWpm ?? speedStepWpm)) }
    public func decreaseSpeed(_ stepWpm: Int? = nil) -> TpsPlaybackSnapshot { setSpeedOffsetWpm(speedOffsetWpm - (stepWpm ?? speedStepWpm)) }

    public func setSpeedOffsetWpm(_ offsetWpm: Int) -> TpsPlaybackSnapshot {
        let normalized = normalizeSpeedOffset(baseWpm, offsetWpm)
        if normalized == speedOffsetWpm { return snapshot }
        let elapsedMs = status == .playing ? readLiveElapsedMs() : currentState.elapsedMs
        speedOffsetWpm = normalized
        let state = updatePosition(elapsedMs, status)
        if status == .playing {
            playbackOffsetMs = state.elapsedMs
            playbackStartedAtMs = nowMs()
            clearTimer()
            scheduleNextTick()
        }
        return snapshot
    }

    public func createSnapshot() -> TpsPlaybackSnapshot {
        let visibleWords = (currentState.currentPhrase?.words ?? []).map { createWordView($0, state: currentState) }
        let currentSegmentIndex = currentState.currentSegment.flatMap { segmentIndexById[$0.id] } ?? -1
        let currentBlockIndex = currentState.currentBlock.flatMap { blockIndexById[$0.id] } ?? -1
        let currentWordDurationMs = currentState.currentWord.map { max(1, Int(round(Double($0.displayDurationMs) / playbackRate))) }
        let currentWordRemainingMs = currentState.currentWord.map { max(0, Int(round(Double($0.endMs - currentState.elapsedMs) / playbackRate))) }
        return TpsPlaybackSnapshot(
            status: status,
            state: currentState,
            tempo: TpsPlaybackTempo(baseWpm: baseWpm, effectiveBaseWpm: effectiveBaseWpm, speedOffsetWpm: speedOffsetWpm, speedStepWpm: speedStepWpm, playbackRate: playbackRate),
            controls: createControls(currentBlockIndex: currentBlockIndex),
            visibleWords: visibleWords,
            focusedWord: visibleWords.first(where: { $0.isActive }),
            currentWordDurationMs: currentWordDurationMs,
            currentWordRemainingMs: currentWordRemainingMs,
            currentSegmentIndex: currentSegmentIndex,
            currentBlockIndex: currentBlockIndex
        )
    }

    public func dispose() { clearTimer() }

    private func emit(_ eventName: String, event: Any) {
        for listener in listeners[eventName]?.values ?? [UUID: TpsPlaybackSession.Listener]().values {
            listener(event)
        }
    }

    private func emitSnapshotChanged() { emit(TpsPlaybackEventNames.snapshotChanged, event: createSnapshot()) }

    private func scheduleNextTick() {
        guard status == .playing else { return }
        let timer = DispatchSource.makeTimerSource(queue: .global(qos: .userInitiated))
        timer.schedule(deadline: .now() + .milliseconds(tickIntervalMs))
        timer.setEventHandler { [weak self] in
            guard let self else { return }
            let state = self.updatePosition(self.readLiveElapsedMs(), .playing)
            if state.isComplete || self.status != .playing {
                self.clearTimer()
                return
            }
            self.scheduleNextTick()
        }
        self.timer = timer
        timer.resume()
    }

    private func clearTimer() {
        timer?.cancel()
        timer = nil
    }

    private func updateStatus(_ nextStatus: TpsPlaybackStatus) {
        let previousStatus = status
        guard previousStatus != nextStatus else { return }
        status = nextStatus
        if nextStatus != .playing {
            playbackOffsetMs = currentState.elapsedMs
            playbackStartedAtMs = 0
        }
        if nextStatus == .completed && previousStatus == .playing {
            clearTimer()
        }
        emit(TpsPlaybackEventNames.statusChanged, event: ["state": currentState, "previousStatus": previousStatus.rawValue, "status": nextStatus.rawValue])
    }

    private func updatePosition(_ elapsedMs: Int, _ nextStatus: TpsPlaybackStatus) -> PlayerState {
        let previousState = currentState
        let previousStatus = status
        let nextState = player.getState(elapsedMs)
        let resolvedStatus: TpsPlaybackStatus = nextStatus == .playing && nextState.isComplete ? .completed : nextStatus
        currentState = nextState
        updateStatus(resolvedStatus)
        if nextState.currentWord?.id != previousState.currentWord?.id {
            emit(TpsPlaybackEventNames.wordChanged, event: ["state": nextState, "previousState": previousState, "status": status.rawValue])
        }
        if nextState.currentPhrase?.id != previousState.currentPhrase?.id {
            emit(TpsPlaybackEventNames.phraseChanged, event: ["state": nextState, "previousState": previousState, "status": status.rawValue])
        }
        if nextState.currentBlock?.id != previousState.currentBlock?.id {
            emit(TpsPlaybackEventNames.blockChanged, event: ["state": nextState, "previousState": previousState, "status": status.rawValue])
        }
        if nextState.currentSegment?.id != previousState.currentSegment?.id {
            emit(TpsPlaybackEventNames.segmentChanged, event: ["state": nextState, "previousState": previousState, "status": status.rawValue])
        }
        if nextState.elapsedMs != previousState.elapsedMs || status != previousStatus {
            emit(TpsPlaybackEventNames.stateChanged, event: ["state": nextState, "previousState": previousState, "status": status.rawValue])
        }
        if !previousState.isComplete && resolvedStatus == .completed {
            emit(TpsPlaybackEventNames.completed, event: ["state": nextState, "previousState": previousState, "status": status.rawValue])
        }
        emitSnapshotChanged()
        return nextState
    }

    private func readLiveElapsedMs() -> Int {
        let deltaMs = Int(round(Double(nowMs() - playbackStartedAtMs) * playbackRate))
        return clamp(playbackOffsetMs + deltaMs, minimum: 0, maximum: player.script.totalDurationMs)
    }

    private func createControls(currentBlockIndex: Int) -> TpsPlaybackControls {
        let wordCount = player.script.words.count
        let currentWordIndex = currentState.currentWordIndex
        let canRewindCurrentWord = currentState.currentWord != nil && currentState.elapsedMs > (currentState.currentWord?.startMs ?? 0)
        let canRewindCurrentBlock = currentState.currentBlock != nil && currentState.elapsedMs > (currentState.currentBlock?.startMs ?? 0)
        return TpsPlaybackControls(
            canPlay: status != .playing,
            canPause: status == .playing,
            canStop: status != .idle || currentState.elapsedMs > 0,
            canNextWord: wordCount > 0 && (currentState.currentWord == nil || currentWordIndex < wordCount - 1),
            canPreviousWord: wordCount > 0 && (currentWordIndex > 0 || canRewindCurrentWord),
            canNextBlock: !blocks.isEmpty && (currentState.currentBlock == nil || currentBlockIndex < blocks.count - 1),
            canPreviousBlock: !blocks.isEmpty && (currentBlockIndex > 0 || canRewindCurrentBlock),
            canIncreaseSpeed: effectiveBaseWpm < TpsSpec.maximumWpm,
            canDecreaseSpeed: effectiveBaseWpm > TpsSpec.minimumWpm
        )
    }
}

public final class TpsStandalonePlayer {
    public let ok: Bool
    public let diagnostics: [TpsDiagnostic]
    public let document: TpsDocument?
    public let script: CompiledScript
    public let session: TpsPlaybackSession

    public init(_ compilation: TpsCompilationResult, options: TpsPlaybackSessionOptions = .init()) {
        self.ok = compilation.ok
        self.diagnostics = compilation.diagnostics
        self.document = compilation.document
        self.script = normalizeCompiledScript(compilation.script)
        self.session = TpsPlaybackSession(self.script, options: options)
        if options.autoPlay { _ = play() }
    }

    private init(script: CompiledScript, options: TpsPlaybackSessionOptions = .init()) {
        self.ok = true
        self.diagnostics = []
        self.document = nil
        self.script = normalizeCompiledScript(script)
        self.session = TpsPlaybackSession(self.script, options: options)
        if options.autoPlay { _ = play() }
    }

    public static func compile(_ source: String, options: TpsPlaybackSessionOptions = .init()) -> TpsStandalonePlayer {
        TpsStandalonePlayer(TpsRuntime.compileTps(source), options: options)
    }

    public static func fromCompiledScript(_ script: CompiledScript, options: TpsPlaybackSessionOptions = .init()) -> TpsStandalonePlayer {
        TpsStandalonePlayer(script: script, options: options)
    }

    public static func fromCompiledJson(_ json: String, options: TpsPlaybackSessionOptions = .init()) throws -> TpsStandalonePlayer {
        TpsStandalonePlayer(script: try parseCompiledScriptJson(json), options: options)
    }

    public var currentState: PlayerState { session.currentState }
    public var isPlaying: Bool { session.isPlaying }
    public var snapshot: TpsPlaybackSnapshot { session.snapshot }
    public var status: TpsPlaybackStatus { session.status }

    @discardableResult public func on(_ eventName: String, _ listener: @escaping TpsPlaybackSession.Listener) -> () -> Void { session.on(eventName, listener) }
    @discardableResult public func observeSnapshot(emitCurrent: Bool = true, _ listener: @escaping (TpsPlaybackSnapshot) -> Void) -> () -> Void { session.observeSnapshot(emitCurrent: emitCurrent, listener) }
    public func play() -> PlayerState { session.play() }
    public func pause() -> PlayerState { session.pause() }
    public func stop() -> PlayerState { session.stop() }
    public func seek(_ elapsedMs: Int) -> PlayerState { session.seek(elapsedMs) }
    public func advanceBy(_ deltaMs: Int) -> PlayerState { session.advanceBy(deltaMs) }
    public func nextWord() -> PlayerState { session.nextWord() }
    public func previousWord() -> PlayerState { session.previousWord() }
    public func nextBlock() -> PlayerState { session.nextBlock() }
    public func previousBlock() -> PlayerState { session.previousBlock() }
    public func increaseSpeed(_ stepWpm: Int? = nil) -> TpsPlaybackSnapshot { session.increaseSpeed(stepWpm) }
    public func decreaseSpeed(_ stepWpm: Int? = nil) -> TpsPlaybackSnapshot { session.decreaseSpeed(stepWpm) }
    public func setSpeedOffsetWpm(_ offsetWpm: Int) -> TpsPlaybackSnapshot { session.setSpeedOffsetWpm(offsetWpm) }
    public func dispose() { session.dispose() }
}

public func normalizeCompiledScript(_ script: CompiledScript) -> CompiledScript {
    try! validateCompiledScript(script)
    let canonicalWords = script.words.map(cloneWord)
    let wordById = Dictionary(uniqueKeysWithValues: canonicalWords.map { ($0.id, $0) })
    let segments = script.segments.map { normalizeSegment($0, wordById: wordById) }
    return CompiledScript(metadata: script.metadata, totalDurationMs: script.totalDurationMs, segments: segments, words: canonicalWords)
}

public func parseCompiledScriptJson(_ json: String) throws -> CompiledScript {
    if json.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        throw NSError(domain: "ManagedCodeTps", code: 1)
    }
    let decoded = try JSONDecoder().decode(CompiledScript.self, from: Data(json.utf8))
    return normalizeCompiledScript(decoded)
}

private func validateCompiledScript(_ script: CompiledScript) throws {
    if script.totalDurationMs < 0 { throw NSError(domain: "ManagedCodeTps", code: 2) }
    if script.segments.isEmpty { throw NSError(domain: "ManagedCodeTps", code: 3) }
    if script.words.isEmpty {
        if script.totalDurationMs != 0 { throw NSError(domain: "ManagedCodeTps", code: 4) }
    } else if script.totalDurationMs != script.words.last?.endMs {
        throw NSError(domain: "ManagedCodeTps", code: 5)
    }
    var segmentIds = Set<String>()
    var blockIds = Set<String>()
    var phraseIds = Set<String>()
    var wordIds = Set<String>()
    try validateWords(script.words, seenIds: &wordIds)
    var expectedSegmentStartWordIndex = 0
    for segment in script.segments {
        try validateIdentifier(segment.id, scope: "segment", seen: &segmentIds)
        try validateTimeRange(segment.startWordIndex, segment.endWordIndex, segment.startMs, segment.endMs, wordCount: script.words.count)
        try validateCanonicalScopeWords(segment.words, startWordIndex: segment.startWordIndex, endWordIndex: segment.endWordIndex, startMs: segment.startMs, endMs: segment.endMs, canonicalWords: script.words, expectedSegmentId: segment.id)
        if !script.words.isEmpty && segment.startWordIndex != expectedSegmentStartWordIndex { throw NSError(domain: "ManagedCodeTps", code: 6) }
        var expectedBlockStartWordIndex = script.words.isEmpty ? 0 : segment.startWordIndex
        for block in segment.blocks {
            try validateIdentifier(block.id, scope: "block", seen: &blockIds)
            try validateTimeRange(block.startWordIndex, block.endWordIndex, block.startMs, block.endMs, wordCount: script.words.count)
            try validateCanonicalScopeWords(block.words, startWordIndex: block.startWordIndex, endWordIndex: block.endWordIndex, startMs: block.startMs, endMs: block.endMs, canonicalWords: script.words, expectedSegmentId: segment.id, expectedBlockId: block.id)
            var previousPhraseEndWordIndex = block.startWordIndex - 1
            for phrase in block.phrases {
                try validateIdentifier(phrase.id, scope: "phrase", seen: &phraseIds)
                try validateTimeRange(phrase.startWordIndex, phrase.endWordIndex, phrase.startMs, phrase.endMs, wordCount: script.words.count)
                try validateCanonicalScopeWords(phrase.words, startWordIndex: phrase.startWordIndex, endWordIndex: phrase.endWordIndex, startMs: phrase.startMs, endMs: phrase.endMs, canonicalWords: script.words, expectedSegmentId: segment.id, expectedBlockId: block.id, expectedPhraseId: phrase.id)
                if !script.words.isEmpty && !phrase.words.isEmpty && phrase.startWordIndex <= previousPhraseEndWordIndex { throw NSError(domain: "ManagedCodeTps", code: 7) }
                if !phrase.words.isEmpty { previousPhraseEndWordIndex = phrase.endWordIndex }
            }
            if !script.words.isEmpty && !block.words.isEmpty && block.startWordIndex != expectedBlockStartWordIndex { throw NSError(domain: "ManagedCodeTps", code: 8) }
            if !block.words.isEmpty { expectedBlockStartWordIndex = block.endWordIndex + 1 }
        }
        expectedSegmentStartWordIndex = segment.words.isEmpty ? segment.startWordIndex : segment.endWordIndex + 1
    }
}

private func normalizeSegment(_ segment: CompiledSegment, wordById: [String: CompiledWord]) -> CompiledSegment {
    let blocks = segment.blocks.map { normalizeBlock($0, wordById: wordById) }
    let words = segment.words.compactMap { wordById[$0.id] }
    return CompiledSegment(id: segment.id, name: segment.name, targetWpm: segment.targetWpm, emotion: segment.emotion, speaker: segment.speaker, archetype: segment.archetype, timing: segment.timing, backgroundColor: segment.backgroundColor, textColor: segment.textColor, accentColor: segment.accentColor, startWordIndex: segment.startWordIndex, endWordIndex: segment.endWordIndex, startMs: segment.startMs, endMs: segment.endMs, blocks: blocks, words: words)
}

private func normalizeBlock(_ block: CompiledBlock, wordById: [String: CompiledWord]) -> CompiledBlock {
    let phrases = block.phrases.map { normalizePhrase($0, wordById: wordById) }
    let words = block.words.compactMap { wordById[$0.id] }
    return CompiledBlock(id: block.id, name: block.name, targetWpm: block.targetWpm, emotion: block.emotion, speaker: block.speaker, archetype: block.archetype, isImplicit: block.isImplicit, startWordIndex: block.startWordIndex, endWordIndex: block.endWordIndex, startMs: block.startMs, endMs: block.endMs, phrases: phrases, words: words)
}

private func normalizePhrase(_ phrase: CompiledPhrase, wordById: [String: CompiledWord]) -> CompiledPhrase {
    let words = phrase.words.compactMap { wordById[$0.id] }
    return CompiledPhrase(id: phrase.id, text: phrase.text, startWordIndex: phrase.startWordIndex, endWordIndex: phrase.endWordIndex, startMs: phrase.startMs, endMs: phrase.endMs, words: words)
}

private func cloneWord(_ word: CompiledWord) -> CompiledWord { word }

private struct ParsedBlockInternal { var block: TpsBlock; var content: ContentSection? = nil }
private struct ParsedSegmentInternal { var segment: TpsSegment; var leadingContent: ContentSection? = nil; var directContent: ContentSection? = nil; var parsedBlocks: [ParsedBlockInternal] }
private struct ContentSection { let text: String; let startOffset: Int }
private struct DocumentAnalysis { let source: String; let lineStarts: [Int]; var diagnostics: [TpsDiagnostic]; let document: TpsDocument; let parsedSegments: [ParsedSegmentInternal] }
private struct ParsedHeader { var name: String; var targetWpm: Int? = nil; var emotion: String? = nil; var timing: String? = nil; var speaker: String? = nil; var archetype: String? = nil }
private struct SegmentCandidate { let segment: CompiledSegment; let blocks: [BlockCandidate] }
private final class ArchetypeDiagnosticTarget {
    let rangeStart: Int
    let rangeEnd: Int
    var block: CompiledBlock?

    init(rangeStart: Int, rangeEnd: Int) {
        self.rangeStart = rangeStart
        self.rangeEnd = rangeEnd
    }
}
private struct BlockCandidate { let block: CompiledBlock; let content: ContentCompilationResult; let diagnosticTarget: ArchetypeDiagnosticTarget }
private struct WordSeed { var kind: String; var cleanText: String; var characterCount: Int; var orpPosition: Int; var displayDurationMs: Int; let metadata: WordMetadata }
private struct PhraseSeed { let words: [WordSeed]; let text: String }
private struct InheritedFormattingState { let targetWpm: Int; let emotion: String; let speaker: String?; let archetype: String?; let speedOffsets: [String: Int] }
private struct ContentCompilationResult { let words: [WordSeed]; let phrases: [PhraseSeed] }
private struct InlineScope { let name: String; let emphasisLevel: Int?; let highlight: Bool?; let inlineEmotion: String?; let volumeLevel: String?; let deliveryMode: String?; let articulationStyle: String?; let energyLevel: Int?; let melodyLevel: Int?; let phoneticGuide: String?; let pronunciationGuide: String?; let stressGuide: String?; let stressWrap: Bool?; let absoluteSpeed: Int?; let relativeSpeedMultiplier: Double?; let resetSpeed: Bool? }
private struct LiteralScope { let name: String }
private struct ActiveInlineState { let emotion: String; let inlineEmotion: String?; let speaker: String?; let emphasisLevel: Int; let highlight: Bool; let volumeLevel: String?; let deliveryMode: String?; let articulationStyle: String?; let energyLevel: Int?; let melodyLevel: Int?; let phoneticGuide: String?; let pronunciationGuide: String?; let stressGuide: String?; let stressWrap: Bool; let hasAbsoluteSpeed: Bool; let absoluteSpeed: Int; let hasRelativeSpeed: Bool; let relativeSpeedMultiplier: Double }
private struct TagToken { let raw: String; let inner: String; let name: String; let argument: String?; let isClosing: Bool }
private struct HeaderPart { let value: String; let start: Int; let end: Int }
private struct FrontMatterExtraction { let metadata: [String: String]; let body: String; let bodyStartOffset: Int }
private struct BodyExtraction { let body: String; let startOffset: Int; let metadata: [String: String] }
private struct TokenAccumulator {
    var stressText: [String] = []
    var emphasisLevel = 0
    var isHighlight = false
    var emotionHint = ""
    var inlineEmotionHint: String? = nil
    var volumeLevel: String? = nil
    var deliveryMode: String? = nil
    var articulationStyle: String? = nil
    var energyLevel: Int? = nil
    var melodyLevel: Int? = nil
    var phoneticGuide: String? = nil
    var pronunciationGuide: String? = nil
    var stressGuide: String? = nil
    var hasAbsoluteSpeed = false
    var absoluteSpeed = 0
    var hasRelativeSpeed = false
    var relativeSpeedMultiplier = 1.0
    var speaker: String? = nil

    mutating func apply(_ state: ActiveInlineState, character: String) {
        emphasisLevel = max(emphasisLevel, state.emphasisLevel)
        isHighlight = isHighlight || state.highlight
        emotionHint = state.emotion
        inlineEmotionHint = state.inlineEmotion ?? inlineEmotionHint
        volumeLevel = state.volumeLevel ?? volumeLevel
        deliveryMode = state.deliveryMode ?? deliveryMode
        articulationStyle = state.articulationStyle ?? articulationStyle
        if let stateEnergyLevel = state.energyLevel { energyLevel = stateEnergyLevel }
        if let stateMelodyLevel = state.melodyLevel { melodyLevel = stateMelodyLevel }
        phoneticGuide = state.phoneticGuide ?? phoneticGuide
        pronunciationGuide = state.pronunciationGuide ?? pronunciationGuide
        stressGuide = state.stressGuide ?? stressGuide
        speaker = state.speaker
        if state.stressWrap { stressText.append(character) }
        if !isWhitespace(character) && !isStandalonePunctuationToken(character) {
            hasAbsoluteSpeed = state.hasAbsoluteSpeed
            absoluteSpeed = state.absoluteSpeed
            hasRelativeSpeed = state.hasRelativeSpeed
            relativeSpeedMultiplier = state.relativeSpeedMultiplier
        }
    }

    func buildWordMetadata(inheritedWpm: Int) -> WordMetadata {
        var metadata = WordMetadata(isEmphasis: emphasisLevel > 0, emphasisLevel: emphasisLevel, isPause: false, pauseDurationMs: nil, isHighlight: isHighlight, isBreath: false, isEditPoint: false, editPointPriority: nil, emotionHint: emotionHint, inlineEmotionHint: inlineEmotionHint, volumeLevel: volumeLevel, deliveryMode: deliveryMode, phoneticGuide: phoneticGuide, pronunciationGuide: pronunciationGuide, stressText: stressText.isEmpty ? nil : stressText.joined(), stressGuide: stressGuide, speedOverride: nil, speedMultiplier: nil, articulationStyle: articulationStyle, energyLevel: energyLevel, melodyLevel: melodyLevel, speaker: speaker, headCue: TpsSpec.emotionHeadCues[emotionHint.isEmpty ? TpsSpec.defaultEmotion : emotionHint])
        if hasAbsoluteSpeed {
            let effectiveWpm = hasRelativeSpeed ? max(1, Int(round(Double(absoluteSpeed) * relativeSpeedMultiplier))) : absoluteSpeed
            if effectiveWpm != inheritedWpm {
                metadata = WordMetadata(isEmphasis: metadata.isEmphasis, emphasisLevel: metadata.emphasisLevel, isPause: metadata.isPause, pauseDurationMs: metadata.pauseDurationMs, isHighlight: metadata.isHighlight, isBreath: metadata.isBreath, isEditPoint: metadata.isEditPoint, editPointPriority: metadata.editPointPriority, emotionHint: metadata.emotionHint, inlineEmotionHint: metadata.inlineEmotionHint, volumeLevel: metadata.volumeLevel, deliveryMode: metadata.deliveryMode, phoneticGuide: metadata.phoneticGuide, pronunciationGuide: metadata.pronunciationGuide, stressText: metadata.stressText, stressGuide: metadata.stressGuide, speedOverride: effectiveWpm, speedMultiplier: metadata.speedMultiplier, articulationStyle: metadata.articulationStyle, energyLevel: metadata.energyLevel, melodyLevel: metadata.melodyLevel, speaker: metadata.speaker, headCue: metadata.headCue)
            }
        } else if hasRelativeSpeed && abs(relativeSpeedMultiplier - 1) > 0.0001 {
            metadata = WordMetadata(isEmphasis: metadata.isEmphasis, emphasisLevel: metadata.emphasisLevel, isPause: metadata.isPause, pauseDurationMs: metadata.pauseDurationMs, isHighlight: metadata.isHighlight, isBreath: metadata.isBreath, isEditPoint: metadata.isEditPoint, editPointPriority: metadata.editPointPriority, emotionHint: metadata.emotionHint, inlineEmotionHint: metadata.inlineEmotionHint, volumeLevel: metadata.volumeLevel, deliveryMode: metadata.deliveryMode, phoneticGuide: metadata.phoneticGuide, pronunciationGuide: metadata.pronunciationGuide, stressText: metadata.stressText, stressGuide: metadata.stressGuide, speedOverride: metadata.speedOverride, speedMultiplier: relativeSpeedMultiplier, articulationStyle: metadata.articulationStyle, energyLevel: metadata.energyLevel, melodyLevel: metadata.melodyLevel, speaker: metadata.speaker, headCue: metadata.headCue)
        }
        return metadata
    }
}

private func parseDocument(_ source: String) -> DocumentAnalysis {
    let normalized = normalizeLineEndings(source)
    let lineStarts = createLineStarts(normalized)
    var diagnostics: [TpsDiagnostic] = []
    let frontMatter = extractFrontMatter(normalized, lineStarts: lineStarts, diagnostics: &diagnostics)
    let titledBody = extractTitleHeader(frontMatter.body, bodyStartOffset: frontMatter.bodyStartOffset, metadata: frontMatter.metadata)
    let parsedSegments = parseSegments(titledBody.body, bodyStartOffset: titledBody.startOffset, metadata: titledBody.metadata, lineStarts: lineStarts, diagnostics: &diagnostics)
    let document = TpsDocument(metadata: titledBody.metadata, segments: parsedSegments.map(\.segment))
    return DocumentAnalysis(source: normalized, lineStarts: lineStarts, diagnostics: diagnostics, document: document, parsedSegments: parsedSegments)
}

private func compileAnalysis(_ analysis: DocumentAnalysis, diagnostics: inout [TpsDiagnostic]) -> CompiledScript {
    let baseWpm = resolveBaseWpm(analysis.document.metadata)
    let speedOffsets = resolveSpeedOffsets(analysis.document.metadata)
    let candidates = analysis.parsedSegments.map { compileSegment($0, baseWpm: baseWpm, speedOffsets: speedOffsets, analysis: analysis, diagnostics: &diagnostics) }
    let script = finalizeScript(metadata: analysis.document.metadata, candidates: candidates)
    appendArchetypeDiagnostics(candidates.flatMap(\.blocks).map(\.diagnosticTarget), lineStarts: analysis.lineStarts, diagnostics: &diagnostics)
    return script
}

private func extractFrontMatter(_ source: String, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> FrontMatterExtraction {
    guard source.hasPrefix("---\n") else { return FrontMatterExtraction(metadata: [:], body: source, bodyStartOffset: 0) }
    guard let closing = findFrontMatterClosing(source) else {
        diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, message: "Front matter must be closed by a terminating --- line.", start: 0, end: min(source.count, 3), lineStarts: lineStarts))
        return FrontMatterExtraction(metadata: [:], body: source, bodyStartOffset: 0)
    }
    let metadata = parseMetadata(substring(source, 4, closing.0 - 4), startOffset: 4, lineStarts: lineStarts, diagnostics: &diagnostics)
    return FrontMatterExtraction(metadata: metadata, body: substring(source, closing.0 + closing.1), bodyStartOffset: closing.0 + closing.1)
}

private func parseMetadata(_ frontMatterText: String, startOffset: Int, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> [String: String] {
    var metadata: [String: String] = [:]
    var currentSection: String? = nil
    var lineOffset = startOffset
    for rawLine in frontMatterText.split(separator: "\n", omittingEmptySubsequences: false).map(String.init) {
        let entryStart = lineOffset
        let entryEnd = lineOffset + rawLine.count
        lineOffset = entryEnd + 1
        if rawLine.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || rawLine.trimmingCharacters(in: .whitespaces).hasPrefix("#") { continue }
        let indentation = rawLine.count - rawLine.trimmingCharacters(in: .whitespaces).count
        let line = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let separatorIndex = line.firstIndex(of: ":"), separatorIndex > line.startIndex else { continue }
        let key = String(line[..<separatorIndex]).trimmingCharacters(in: .whitespacesAndNewlines)
        let value = normalizeMetadataValue(String(line[line.index(after: separatorIndex)...]))
        if indentation > 0, let currentSection {
            let compositeKey = "\(currentSection).\(key)"
            metadata[compositeKey] = value
            validateMetadataEntry(key: compositeKey, value: value, start: entryStart, end: entryEnd, lineStarts: lineStarts, diagnostics: &diagnostics)
            continue
        }
        currentSection = value.isEmpty ? key : nil
        if !value.isEmpty {
            metadata[key] = value
            validateMetadataEntry(key: key, value: value, start: entryStart, end: entryEnd, lineStarts: lineStarts, diagnostics: &diagnostics)
        }
    }
    return metadata
}

private func extractTitleHeader(_ body: String, bodyStartOffset: Int, metadata: [String: String]) -> BodyExtraction {
    var mutableMetadata = metadata
    for line in splitLines(body, startOffset: bodyStartOffset) {
        if line.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { continue }
        let trimmed = line.text.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.hasPrefix("# ") || trimmed.hasPrefix("## ") { break }
        mutableMetadata[TpsFrontMatterKeys.title] = String(trimmed.dropFirst(2)).trimmingCharacters(in: .whitespacesAndNewlines)
        let consumedLength = line.startOffset - bodyStartOffset + line.text.count
        let trailingNewlineLength = consumedLength < body.count && characterAt(body, consumedLength) == "\n" ? 1 : 0
        let bodyOffset = consumedLength + trailingNewlineLength
        return BodyExtraction(body: substring(body, bodyOffset), startOffset: bodyStartOffset + bodyOffset, metadata: mutableMetadata)
    }
    return BodyExtraction(body: body, startOffset: bodyStartOffset, metadata: mutableMetadata)
}

private func parseSegments(_ body: String, bodyStartOffset: Int, metadata: [String: String], lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> [ParsedSegmentInternal] {
    let lines = splitLines(body, startOffset: bodyStartOffset)
    var segments: [ParsedSegmentInternal] = []
    var preamble: [LineRecord] = []
    var current: ParsedSegmentInternal? = nil
    var currentBlock: ParsedBlockInternal? = nil
    var segmentLeading: [LineRecord] = []
    var blockLines: [LineRecord] = []
    for line in lines {
        if let segmentHeader = tryParseHeader(line, level: "segment", lineStarts: lineStarts, diagnostics: &diagnostics) {
            finalizeParsedBlock(current: &current, block: &currentBlock, lines: blockLines)
            finalizeSegment(target: &segments, segment: &current, lines: segmentLeading)
            current = createSegment(segmentHeader, metadata: metadata, index: segments.count + 1)
            currentBlock = nil
            if !preamble.isEmpty {
                segmentLeading = preamble
                preamble.removeAll()
            }
            continue
        }
        if let blockHeader = tryParseHeader(line, level: "block", lineStarts: lineStarts, diagnostics: &diagnostics) {
            if current == nil { current = createImplicitSegment(metadata: metadata, index: segments.count + 1) }
            if !preamble.isEmpty {
                segmentLeading = preamble
                preamble.removeAll()
            }
            finalizeParsedBlock(current: &current, block: &currentBlock, lines: blockLines)
            currentBlock = createBlock(blockHeader, blockIndex: current!.parsedBlocks.count + 1, segmentId: current!.segment.id)
            blockLines = []
            continue
        }
        if currentBlock != nil {
            blockLines.append(line)
        } else if current != nil {
            segmentLeading.append(line)
        } else {
            preamble.append(line)
        }
    }
    if current == nil {
        var implicit = createImplicitSegment(metadata: metadata, index: 1)
        implicit.directContent = createContentSection(preamble)
        return [implicit]
    }
    finalizeParsedBlock(current: &current, block: &currentBlock, lines: blockLines)
    finalizeSegment(target: &segments, segment: &current, lines: segmentLeading)
    return segments
}

private struct LineRecord { let text: String; let startOffset: Int }

private func tryParseHeader(_ line: LineRecord, level: String, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> ParsedHeader? {
    let hashPrefix = level == "segment" ? "##" : "###"
    let trimmedStart = line.text.trimmingCharacters(in: .whitespaces)
    guard trimmedStart.hasPrefix(hashPrefix) else { return nil }
    let afterHashes = String(trimmedStart.dropFirst(hashPrefix.count))
    if !afterHashes.isEmpty && !afterHashes.hasPrefix(" ") { return nil }
    let headerContent = afterHashes.trimmingCharacters(in: .whitespacesAndNewlines)
    if headerContent.isEmpty {
        diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidHeader, message: "Header cannot be empty.", start: line.startOffset, end: line.startOffset + line.text.count, lineStarts: lineStarts))
        return nil
    }
    if !headerContent.hasPrefix("[") || !headerContent.hasSuffix("]") {
        return ParsedHeader(name: headerContent)
    }
    return parseBracketHeader(String(headerContent.dropFirst().dropLast()), contentOffset: line.startOffset + (line.text as NSString).range(of: "[").location + 1, lineStarts: lineStarts, diagnostics: &diagnostics)
}

private func parseBracketHeader(_ headerContent: String, contentOffset: Int, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> ParsedHeader? {
    let parts = splitHeaderPartsDetailed(headerContent)
    guard let first = parts.first, !first.value.isEmpty else {
        diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidHeader, message: "Header name is required.", start: contentOffset, end: contentOffset + headerContent.count, lineStarts: lineStarts))
        return nil
    }
    var parsed = ParsedHeader(name: first.value)
    for part in parts.dropFirst() {
        guard let normalized = normalizeValue(part.value) else { continue }
        let tokenRangeStart = contentOffset + part.start
        let tokenRangeEnd = contentOffset + part.end
        if normalized.lowercased().hasPrefix(TpsSpec.speakerPrefix.lowercased()) {
            parsed.speaker = normalizeValue(String(normalized.dropFirst(TpsSpec.speakerPrefix.count)))
            continue
        }
        if normalized.lowercased().hasPrefix(TpsSpec.archetypePrefix.lowercased()) {
            let archetypeValue = normalizeValue(String(normalized.dropFirst(TpsSpec.archetypePrefix.count)))
            if let value = archetypeValue, TpsSpec.archetypes.contains(value.lowercased()) {
                parsed.archetype = value.lowercased()
            } else {
                diagnostics.append(createDiagnostic(TpsDiagnosticCodes.unknownArchetype, message: "Archetype '\(archetypeValue ?? "")' is not a known vocal archetype.", start: tokenRangeStart, end: tokenRangeEnd, lineStarts: lineStarts))
            }
            continue
        }
        if isTimingToken(normalized) { parsed.timing = normalized; continue }
        if let updated = applyHeaderWpm(parsed: parsed, token: normalized, start: tokenRangeStart, end: tokenRangeEnd, lineStarts: lineStarts, diagnostics: &diagnostics) {
            parsed = updated
            continue
        }
        if isKnownEmotion(normalized) { parsed.emotion = normalized.lowercased(); continue }
        diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidHeaderParameter, message: "Header parameter '\(normalized)' is not a known TPS header token.", start: tokenRangeStart, end: tokenRangeEnd, lineStarts: lineStarts, suggestion: "Use a speaker, emotion, timing, or WPM value."))
    }
    return parsed
}

private func applyHeaderWpm(parsed: ParsedHeader, token: String, start: Int, end: Int, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> ParsedHeader? {
    let normalized = token.replacingOccurrences(of: "\\s+", with: "", options: .regularExpression)
    guard normalized.range(of: #"^\d+(wpm)?$"#, options: [.regularExpression, .caseInsensitive]) != nil else { return nil }
    let candidate = normalized.lowercased().hasSuffix(TpsSpec.wpmSuffix.lowercased())
        ? Int(normalized.dropLast(TpsSpec.wpmSuffix.count)) ?? 0
        : Int(normalized) ?? 0
    if isInvalidWpm(candidate) {
        diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidWpm, message: buildInvalidWpmMessage(token), start: start, end: end, lineStarts: lineStarts))
        return parsed
    }
    var updated = parsed
    updated.targetWpm = candidate
    return updated
}

private func createSegment(_ header: ParsedHeader, metadata: [String: String], index: Int) -> ParsedSegmentInternal {
    let emotion = resolveEmotion(header.emotion)
    let palette = resolvePalette(emotion)
    let archetypeWpm = resolveArchetypeWpm(header.archetype)
    return ParsedSegmentInternal(segment: TpsSegment(id: "segment-\(index)", name: header.name, content: "", targetWpm: header.targetWpm ?? archetypeWpm ?? resolveBaseWpm(metadata), emotion: emotion, speaker: header.speaker, archetype: header.archetype, timing: header.timing, backgroundColor: palette["background"], textColor: palette["text"], accentColor: palette["accent"], leadingContent: nil, blocks: []), parsedBlocks: [])
}

private func createImplicitSegment(metadata: [String: String], index: Int) -> ParsedSegmentInternal {
    createSegment(ParsedHeader(name: metadata[TpsFrontMatterKeys.title] ?? TpsSpec.defaultImplicitSegmentName, targetWpm: resolveBaseWpm(metadata), emotion: TpsSpec.defaultEmotion), metadata: metadata, index: index)
}

private func createBlock(_ header: ParsedHeader, blockIndex: Int, segmentId: String) -> ParsedBlockInternal {
    ParsedBlockInternal(block: TpsBlock(id: "\(segmentId)-block-\(blockIndex)", name: header.name, content: "", targetWpm: header.targetWpm, emotion: header.emotion, speaker: header.speaker, archetype: header.archetype))
}

private func finalizeParsedBlock(current: inout ParsedSegmentInternal?, block: inout ParsedBlockInternal?, lines: [LineRecord]) {
    guard var segment = current, var block else { return }
    block.content = createContentSection(lines)
    block.block = TpsBlock(id: block.block.id, name: block.block.name, content: block.content?.text ?? "", targetWpm: block.block.targetWpm, emotion: block.block.emotion, speaker: block.block.speaker, archetype: block.block.archetype)
    segment.parsedBlocks.append(block)
    current = segment
}

private func finalizeSegment(target: inout [ParsedSegmentInternal], segment: inout ParsedSegmentInternal?, lines: [LineRecord]) {
    guard var segment else { return }
    segment.leadingContent = createContentSection(lines)
    let blocks = segment.parsedBlocks.map(\.block)
    let content = segment.parsedBlocks.isEmpty ? (segment.leadingContent?.text ?? "") : ""
    segment.segment = TpsSegment(id: segment.segment.id, name: segment.segment.name, content: content, targetWpm: segment.segment.targetWpm, emotion: segment.segment.emotion, speaker: segment.segment.speaker, archetype: segment.segment.archetype, timing: segment.segment.timing, backgroundColor: segment.segment.backgroundColor, textColor: segment.segment.textColor, accentColor: segment.segment.accentColor, leadingContent: segment.leadingContent?.text, blocks: blocks)
    if segment.parsedBlocks.isEmpty { segment.directContent = segment.leadingContent }
    target.append(segment)
}

private func createContentSection(_ lines: [LineRecord]) -> ContentSection? {
    guard let first = lines.first else { return nil }
    return ContentSection(text: lines.map(\.text).joined(separator: "\n"), startOffset: first.startOffset)
}

private func splitLines(_ text: String, startOffset: Int) -> [LineRecord] {
    guard !text.isEmpty else { return [] }
    var records: [LineRecord] = []
    var lineStart = startOffset
    for line in text.split(separator: "\n", omittingEmptySubsequences: false).map(String.init) {
        records.append(LineRecord(text: line, startOffset: lineStart))
        lineStart += line.count + 1
    }
    if text.hasSuffix("\n") { records.removeLast() }
    return records
}

private func compileSegment(_ parsedSegment: ParsedSegmentInternal, baseWpm: Int, speedOffsets: [String: Int], analysis: DocumentAnalysis, diagnostics: inout [TpsDiagnostic]) -> SegmentCandidate {
    let segmentEmotion = resolveEmotion(parsedSegment.segment.emotion)
    let inherited = InheritedFormattingState(targetWpm: parsedSegment.segment.targetWpm!, emotion: segmentEmotion, speaker: parsedSegment.segment.speaker, archetype: parsedSegment.segment.archetype, speedOffsets: speedOffsets)
    let blocks = buildBlocks(parsedSegment).map { compileBlock($0, inherited: inherited, analysis: analysis, diagnostics: &diagnostics) }
    let segment = CompiledSegment(id: parsedSegment.segment.id, name: parsedSegment.segment.name, targetWpm: inherited.targetWpm, emotion: segmentEmotion, speaker: parsedSegment.segment.speaker, archetype: parsedSegment.segment.archetype, timing: parsedSegment.segment.timing, backgroundColor: parsedSegment.segment.backgroundColor!, textColor: parsedSegment.segment.textColor!, accentColor: parsedSegment.segment.accentColor!, startWordIndex: 0, endWordIndex: 0, startMs: 0, endMs: 0, blocks: [], words: [])
    return SegmentCandidate(segment: segment, blocks: blocks)
}

private func buildBlocks(_ parsedSegment: ParsedSegmentInternal) -> [(block: TpsBlock, isImplicit: Bool, content: ContentSection?, rangeStart: Int, rangeEnd: Int)] {
    var blocks: [(block: TpsBlock, isImplicit: Bool, content: ContentSection?, rangeStart: Int, rangeEnd: Int)] = []
    if let leadingText = parsedSegment.leadingContent?.text, !leadingText.isEmpty, !parsedSegment.parsedBlocks.isEmpty {
        let leadingContent = parsedSegment.leadingContent!
        blocks.append((TpsBlock(id: "\(parsedSegment.segment.id)-implicit-lead", name: "\(parsedSegment.segment.name) Lead", content: leadingText, targetWpm: parsedSegment.segment.targetWpm, emotion: parsedSegment.segment.emotion, speaker: parsedSegment.segment.speaker, archetype: parsedSegment.segment.archetype), true, leadingContent, leadingContent.startOffset, leadingContent.startOffset + leadingContent.text.count))
    }
    if parsedSegment.parsedBlocks.isEmpty {
        let start = parsedSegment.directContent?.startOffset ?? 0
        let end = start + (parsedSegment.directContent?.text.count ?? 0)
        blocks.append((TpsBlock(id: "\(parsedSegment.segment.id)-implicit-body", name: parsedSegment.segment.name, content: parsedSegment.directContent?.text ?? "", targetWpm: parsedSegment.segment.targetWpm, emotion: parsedSegment.segment.emotion, speaker: parsedSegment.segment.speaker, archetype: parsedSegment.segment.archetype), true, parsedSegment.directContent, start, end))
    }
    for parsedBlock in parsedSegment.parsedBlocks {
        let start = parsedBlock.content?.startOffset ?? 0
        let end = start + (parsedBlock.content?.text.count ?? 0)
        blocks.append((parsedBlock.block, false, parsedBlock.content, start, end))
    }
    return blocks
}

private func compileBlock(_ entry: (block: TpsBlock, isImplicit: Bool, content: ContentSection?, rangeStart: Int, rangeEnd: Int), inherited: InheritedFormattingState, analysis: DocumentAnalysis, diagnostics: inout [TpsDiagnostic]) -> BlockCandidate {
    let resolvedArchetype = entry.block.archetype ?? inherited.archetype
    let blockWpm = entry.block.targetWpm ?? resolveArchetypeWpm(resolvedArchetype) ?? inherited.targetWpm
    let blockInherited = InheritedFormattingState(targetWpm: blockWpm, emotion: resolveEmotion(entry.block.emotion, fallback: inherited.emotion), speaker: entry.block.speaker ?? inherited.speaker, archetype: resolvedArchetype, speedOffsets: inherited.speedOffsets)
    let content = compileContent(entry.content?.text ?? "", startOffset: entry.content?.startOffset ?? 0, inherited: blockInherited, lineStarts: analysis.lineStarts, diagnostics: &diagnostics)
    let block = CompiledBlock(id: entry.block.id, name: entry.block.name, targetWpm: blockInherited.targetWpm, emotion: blockInherited.emotion, speaker: blockInherited.speaker, archetype: resolvedArchetype, isImplicit: entry.isImplicit, startWordIndex: 0, endWordIndex: 0, startMs: 0, endMs: 0, phrases: [], words: [])
    return BlockCandidate(block: block, content: content, diagnosticTarget: ArchetypeDiagnosticTarget(rangeStart: entry.rangeStart, rangeEnd: entry.rangeEnd))
}

private func finalizeScript(metadata: [String: String], candidates: [SegmentCandidate]) -> CompiledScript {
    var segments: [CompiledSegment] = []
    var scriptWords: [CompiledWord] = []
    var elapsedMs = 0
    var wordIndex = 0
    for candidate in candidates {
        var segmentWords: [CompiledWord] = []
        var compiledBlocks: [CompiledBlock] = []
        for blockCandidate in candidate.blocks {
            let finalized = finalizeCompiledBlock(blockCandidate.block, seeds: blockCandidate.content.words, phraseSeeds: blockCandidate.content.phrases, segmentId: candidate.segment.id, elapsedMs: elapsedMs, wordIndex: wordIndex)
            blockCandidate.diagnosticTarget.block = finalized.block
            compiledBlocks.append(finalized.block)
            segmentWords.append(contentsOf: finalized.words)
            scriptWords.append(contentsOf: finalized.words)
            elapsedMs = finalized.elapsedMs
            wordIndex = finalized.nextWordIndex
        }
        let segment = finalizeSegmentRange(candidate.segment, blocks: compiledBlocks, words: segmentWords)
        segments.append(segment)
    }
    return CompiledScript(metadata: metadata, totalDurationMs: elapsedMs, segments: segments, words: scriptWords)
}

private func finalizeCompiledBlock(_ block: CompiledBlock, seeds: [WordSeed], phraseSeeds: [PhraseSeed], segmentId: String, elapsedMs: Int, wordIndex: Int) -> (block: CompiledBlock, words: [CompiledWord], phrases: [CompiledPhrase], elapsedMs: Int, nextWordIndex: Int) {
    var words: [CompiledWord] = []
    var elapsed = elapsedMs
    var nextWordIndex = wordIndex
    for seed in seeds {
        let compiledWord = CompiledWord(id: "word-\(nextWordIndex + 1)", index: nextWordIndex, kind: seed.kind, cleanText: seed.cleanText, characterCount: seed.characterCount, orpPosition: seed.orpPosition, displayDurationMs: seed.displayDurationMs, startMs: elapsed, endMs: elapsed + seed.displayDurationMs, metadata: seed.metadata, segmentId: segmentId, blockId: block.id, phraseId: "")
        words.append(compiledWord)
        elapsed = compiledWord.endMs
        nextWordIndex += 1
    }
    var phrases: [CompiledPhrase] = []
    let spokenWords = words.filter { $0.kind == "word" }
    var spokenWordCursor = 0
    for (index, seed) in phraseSeeds.enumerated() {
        let spokenWordCount = seed.words.filter { $0.kind == "word" }.count
        let phraseSlice = spokenWordCount > 0 && spokenWordCursor < spokenWords.count
            ? Array(spokenWords[spokenWordCursor..<min(spokenWordCursor + spokenWordCount, spokenWords.count)])
            : []
        let phraseWords = phraseSlice
        spokenWordCursor += phraseWords.count
        if phraseWords.isEmpty {
            phrases.append(CompiledPhrase(id: "\(block.id)-phrase-\(index + 1)", text: seed.text, startWordIndex: 0, endWordIndex: 0, startMs: 0, endMs: 0, words: []))
            continue
        }
        let phraseId = "\(block.id)-phrase-\(index + 1)"
        let normalizedWords = phraseWords.map { CompiledWord(id: $0.id, index: $0.index, kind: $0.kind, cleanText: $0.cleanText, characterCount: $0.characterCount, orpPosition: $0.orpPosition, displayDurationMs: $0.displayDurationMs, startMs: $0.startMs, endMs: $0.endMs, metadata: $0.metadata, segmentId: $0.segmentId, blockId: $0.blockId, phraseId: phraseId) }
        phrases.append(CompiledPhrase(id: phraseId, text: seed.text, startWordIndex: normalizedWords.first!.index, endWordIndex: normalizedWords.last!.index, startMs: normalizedWords.first!.startMs, endMs: normalizedWords.last!.endMs, words: normalizedWords))
    }
    let phraseWordById = Dictionary(uniqueKeysWithValues: phrases.flatMap(\.words).map { ($0.id, $0) })
    let canonicalWords = words.map { phraseWordById[$0.id] ?? $0 }
    let canonicalPhrases = phrases.map { phrase in
        CompiledPhrase(id: phrase.id, text: phrase.text, startWordIndex: phrase.startWordIndex, endWordIndex: phrase.endWordIndex, startMs: phrase.startMs, endMs: phrase.endMs, words: phrase.words.map { phraseWordById[$0.id] ?? $0 })
    }
    let rangedBlock = withRangeForBlock(block, words: canonicalWords, phrases: canonicalPhrases)
    return (rangedBlock, canonicalWords, canonicalPhrases, elapsed, nextWordIndex)
}

private func withRangeForBlock(_ block: CompiledBlock, words: [CompiledWord], phrases: [CompiledPhrase]) -> CompiledBlock {
    let startWordIndex = words.first?.index ?? 0
    let endWordIndex = words.last?.index ?? startWordIndex
    let startMs = words.first?.startMs ?? 0
    let endMs = words.last?.endMs ?? startMs
    return CompiledBlock(id: block.id, name: block.name, targetWpm: block.targetWpm, emotion: block.emotion, speaker: block.speaker, archetype: block.archetype, isImplicit: block.isImplicit, startWordIndex: startWordIndex, endWordIndex: endWordIndex, startMs: startMs, endMs: endMs, phrases: phrases, words: words)
}

private func finalizeSegmentRange(_ segment: CompiledSegment, blocks: [CompiledBlock], words: [CompiledWord]) -> CompiledSegment {
    let startWordIndex = words.first?.index ?? 0
    let endWordIndex = words.last?.index ?? startWordIndex
    let startMs = words.first?.startMs ?? 0
    let endMs = words.last?.endMs ?? startMs
    return CompiledSegment(id: segment.id, name: segment.name, targetWpm: segment.targetWpm, emotion: segment.emotion, speaker: segment.speaker, archetype: segment.archetype, timing: segment.timing, backgroundColor: segment.backgroundColor, textColor: segment.textColor, accentColor: segment.accentColor, startWordIndex: startWordIndex, endWordIndex: endWordIndex, startMs: startMs, endMs: endMs, blocks: blocks, words: words)
}

private func compileContent(_ rawText: String, startOffset: Int, inherited: InheritedFormattingState, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> ContentCompilationResult {
    let protectedText = protectEscapes(rawText)
    var words: [WordSeed] = []
    var phrases: [PhraseSeed] = []
    var currentPhrase: [WordSeed] = []
    var scopes: [InlineScope] = []
    var literalScopes: [LiteralScope] = []
    var builder = ""
    var token: TokenAccumulator? = nil
    var index = 0
    while index < protectedText.count {
        let character = characterAt(protectedText, index)
        if tryHandleMarkdownMarker(protectedText, index: index, scopes: &scopes) {
            (builder, token) = finalizeToken(words: &words, phrases: &phrases, currentPhrase: &currentPhrase, builder: builder, token: token, inherited: inherited)
            if index + 1 < protectedText.count, characterAt(protectedText, index + 1) == "*" { index += 1 }
            index += 1
            continue
        }
        if character == "[" {
            guard let tag = readTagToken(protectedText, index: index) else {
                diagnostics.append(createDiagnostic(TpsDiagnosticCodes.unterminatedTag, message: "Tag is missing a closing ] bracket.", start: startOffset + index, end: startOffset + protectedText.count, lineStarts: lineStarts))
                (builder, token) = appendLiteral(substring(protectedText, index), scopes: scopes, inherited: inherited, builder: builder, token: token)
                break
            }
            if requiresTokenBoundary(tag.name) {
                (builder, token) = finalizeToken(words: &words, phrases: &phrases, currentPhrase: &currentPhrase, builder: builder, token: token, inherited: inherited)
            }
            if handleTagToken(tag, literalScopes: &literalScopes, scopes: &scopes, words: &words, phrases: &phrases, currentPhrase: &currentPhrase, inherited: inherited, absoluteOffset: startOffset + index, lineStarts: lineStarts, diagnostics: &diagnostics) {
                index += tag.raw.count
                continue
            }
            (builder, token) = appendLiteral(tag.raw, scopes: scopes, inherited: inherited, builder: builder, token: token)
            index += tag.raw.count
            continue
        }
        if tryHandleSlashPause(protectedText, index: index, builder: builder, token: token) {
            (builder, token) = finalizeToken(words: &words, phrases: &phrases, currentPhrase: &currentPhrase, builder: builder, token: token, inherited: inherited)
            flushPhrase(phrases: &phrases, currentPhrase: &currentPhrase)
            words.append(createControlWord(kind: "pause", inherited: inherited, pauseDurationMs: substring(protectedText, index).hasPrefix("//") ? TpsSpec.mediumPauseDurationMs : TpsSpec.shortPauseDurationMs))
            if index + 1 < protectedText.count, characterAt(protectedText, index + 1) == "/" { index += 1 }
            index += 1
            continue
        }
        if isWhitespace(character) {
            (builder, token) = finalizeToken(words: &words, phrases: &phrases, currentPhrase: &currentPhrase, builder: builder, token: token, inherited: inherited)
            index += 1
            continue
        }
        (builder, token) = appendCharacter(character, scopes: scopes, inherited: inherited, builder: builder, token: token)
        index += 1
    }
    (builder, token) = finalizeToken(words: &words, phrases: &phrases, currentPhrase: &currentPhrase, builder: builder, token: token, inherited: inherited)
    flushPhrase(phrases: &phrases, currentPhrase: &currentPhrase)
    for scope in scopes {
        diagnostics.append(createDiagnostic(TpsDiagnosticCodes.unclosedTag, message: "Tag '\(scope.name)' was opened but never closed.", start: startOffset + rawText.count, end: startOffset + rawText.count, lineStarts: lineStarts))
    }
    return ContentCompilationResult(words: words, phrases: phrases)
}

private func handleTagToken(_ tag: TagToken, literalScopes: inout [LiteralScope], scopes: inout [InlineScope], words: inout [WordSeed], phrases: inout [PhraseSeed], currentPhrase: inout [WordSeed], inherited: InheritedFormattingState, absoluteOffset: Int, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> Bool {
    if tag.isClosing {
        return handleClosingTag(tag, literalScopes: &literalScopes, scopes: &scopes, absoluteOffset: absoluteOffset, lineStarts: lineStarts, diagnostics: &diagnostics)
    }
    if tag.name == TpsTags.pause {
        guard let pauseDuration = tryResolvePauseMilliseconds(tag.argument) else {
            diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidPause, message: "Pause duration must use Ns or Nms syntax.", start: absoluteOffset, end: absoluteOffset + tag.raw.count, lineStarts: lineStarts))
            return false
        }
        flushPhrase(phrases: &phrases, currentPhrase: &currentPhrase)
        words.append(createControlWord(kind: "pause", inherited: inherited, pauseDurationMs: pauseDuration))
        return true
    }
    if tag.name == TpsTags.breath { words.append(createControlWord(kind: "breath", inherited: inherited)); return true }
    if tag.name == TpsTags.editPoint {
        if let argument = tag.argument, !TpsSpec.editPointPriorities.contains(argument) {
            diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidTagArgument, message: "Edit point priority '\(argument)' is not supported.", start: absoluteOffset, end: absoluteOffset + tag.raw.count, lineStarts: lineStarts))
            return false
        }
        words.append(createControlWord(kind: "edit-point", inherited: inherited, editPointPriority: tag.argument))
        return true
    }
    guard let scope = createScope(tag, speedOffsets: inherited.speedOffsets, absoluteOffset: absoluteOffset, lineStarts: lineStarts, diagnostics: &diagnostics) else {
        if isPairedScope(tag.name) { literalScopes.append(LiteralScope(name: tag.name)) }
        return false
    }
    scopes.append(scope)
    return true
}

private func handleClosingTag(_ tag: TagToken, literalScopes: inout [LiteralScope], scopes: inout [InlineScope], absoluteOffset: Int, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> Bool {
    if let literalIndex = literalScopes.lastIndex(where: { $0.name == tag.name }) {
        literalScopes.remove(at: literalIndex)
        return false
    }
    guard let scopeIndex = scopes.lastIndex(where: { $0.name == tag.name }) else {
        diagnostics.append(createDiagnostic(TpsDiagnosticCodes.mismatchedClosingTag, message: "Closing tag '\(tag.name)' does not match any open scope.", start: absoluteOffset, end: absoluteOffset + tag.raw.count, lineStarts: lineStarts))
        return false
    }
    scopes.remove(at: scopeIndex)
    return true
}

private func createScope(_ tag: TagToken, speedOffsets: [String: Int], absoluteOffset: Int, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) -> InlineScope? {
    if tag.name == TpsTags.phonetic || tag.name == TpsTags.pronunciation {
        guard let argument = tag.argument else {
            diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidTagArgument, message: "Tag '\(tag.name)' requires a pronunciation parameter.", start: absoluteOffset, end: absoluteOffset + tag.raw.count, lineStarts: lineStarts))
            return nil
        }
        return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: tag.name == TpsTags.phonetic ? argument : nil, pronunciationGuide: tag.name == TpsTags.pronunciation ? argument : nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil)
    }
    if tag.name == TpsTags.stress { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: tag.argument, stressWrap: tag.argument == nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if tag.name == TpsTags.emphasis { return InlineScope(name: tag.name, emphasisLevel: 1, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if tag.name == TpsTags.highlight { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: true, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if TpsSpec.volumeLevels.contains(tag.name) { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: tag.name, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if TpsSpec.deliveryModes.contains(tag.name) { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: tag.name, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if TpsSpec.articulationStyles.contains(tag.name) { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: tag.name, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if tag.name == TpsTags.energy {
        guard let argument = tag.argument, let level = Int(argument), level >= TpsSpec.energyLevelMin && level <= TpsSpec.energyLevelMax else {
            diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidEnergyLevel, message: "Energy level must be an integer between \(TpsSpec.energyLevelMin) and \(TpsSpec.energyLevelMax).", start: absoluteOffset, end: absoluteOffset + tag.raw.count, lineStarts: lineStarts))
            return nil
        }
        return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: level, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil)
    }
    if tag.name == TpsTags.melody {
        guard let argument = tag.argument, let level = Int(argument), level >= TpsSpec.melodyLevelMin && level <= TpsSpec.melodyLevelMax else {
            diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidMelodyLevel, message: "Melody level must be an integer between \(TpsSpec.melodyLevelMin) and \(TpsSpec.melodyLevelMax).", start: absoluteOffset, end: absoluteOffset + tag.raw.count, lineStarts: lineStarts))
            return nil
        }
        return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: level, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil)
    }
    if TpsSpec.emotions.contains(tag.name) { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: tag.name, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if let absoluteSpeed = tryParseAbsoluteWpm(tag.name) { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: absoluteSpeed, relativeSpeedMultiplier: nil, resetSpeed: nil) }
    if let multiplier = resolveSpeedMultiplier(tag.name, speedOffsets: speedOffsets) { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: multiplier, resetSpeed: nil) }
    if tag.name == TpsTags.normal { return InlineScope(name: tag.name, emphasisLevel: nil, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: true) }
    diagnostics.append(createDiagnostic(TpsDiagnosticCodes.unknownTag, message: "Tag '\(tag.name)' is not part of the TPS specification.", start: absoluteOffset, end: absoluteOffset + tag.raw.count, lineStarts: lineStarts))
    return nil
}

private func tryHandleMarkdownMarker(_ text: String, index: Int, scopes: inout [InlineScope]) -> Bool {
    guard characterAt(text, index) == "*" else { return false }
    let markerLength = index + 1 < text.count && characterAt(text, index + 1) == "*" ? 2 : 1
    let marker = String(repeating: "*", count: markerLength)
    let scopeName = markerLength == 2 ? "__markdown-strong__" : TpsTags.emphasis
    if let existingIndex = scopes.lastIndex(where: { $0.name == scopeName }) {
        scopes.remove(at: existingIndex)
        return true
    }
    if substring(text, index + markerLength).range(of: marker) == nil { return false }
    scopes.append(InlineScope(name: scopeName, emphasisLevel: markerLength == 2 ? 2 : 1, highlight: nil, inlineEmotion: nil, volumeLevel: nil, deliveryMode: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, phoneticGuide: nil, pronunciationGuide: nil, stressGuide: nil, stressWrap: nil, absoluteSpeed: nil, relativeSpeedMultiplier: nil, resetSpeed: nil))
    return true
}

private func readTagToken(_ text: String, index: Int) -> TagToken? {
    guard let endIndex = substring(text, index + 1).firstIndex(of: "]") else { return nil }
    let offset = substring(text, index + 1).distance(from: substring(text, index + 1).startIndex, to: endIndex)
    let raw = substring(text, index, offset + 2)
    let inner = restoreEscapes(String(raw.dropFirst().dropLast())).trimmingCharacters(in: .whitespacesAndNewlines)
    let isClosing = inner.hasPrefix("/")
    let body = isClosing ? String(inner.dropFirst()).trimmingCharacters(in: .whitespacesAndNewlines) : inner
    let separatorIndex = (body as NSString).range(of: ":").location
    let name = (separatorIndex != NSNotFound ? substring(body, 0, separatorIndex) : body).trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    let argument = separatorIndex != NSNotFound ? normalizeValue(substring(body, separatorIndex + 1)) : nil
    return TagToken(raw: raw, inner: inner, name: name, argument: argument, isClosing: isClosing)
}

private func requiresTokenBoundary(_ tagName: String) -> Bool { [TpsTags.pause, TpsTags.breath, TpsTags.editPoint].contains(tagName) }

private func tryHandleSlashPause(_ text: String, index: Int, builder: String, token: TokenAccumulator?) -> Bool {
    let currentCharacter = characterAt(text, index)
    let nextCharacter = index + 1 < text.count ? characterAt(text, index + 1) : ""
    let previousCharacter = index > 0 ? characterAt(text, index - 1) : ""
    let nextIndex = nextCharacter == "/" ? index + 2 : index + 1
    let previousIsBoundary = index == 0 || isWhitespace(previousCharacter)
    let nextIsBoundary = nextIndex >= text.count || isWhitespace(characterAt(text, nextIndex))
    return currentCharacter == "/" && builder.isEmpty && token == nil && previousIsBoundary && nextIsBoundary
}

private func appendLiteral(_ literal: String, scopes: [InlineScope], inherited: InheritedFormattingState, builder: String, token: TokenAccumulator?) -> (String, TokenAccumulator?) {
    var activeBuilder = builder
    var activeToken = token
    for character in literal.map(String.init) {
        (activeBuilder, activeToken) = appendCharacter(character, scopes: scopes, inherited: inherited, builder: activeBuilder, token: activeToken)
    }
    return (activeBuilder, activeToken)
}

private func appendCharacter(_ character: String, scopes: [InlineScope], inherited: InheritedFormattingState, builder: String, token: TokenAccumulator?) -> (String, TokenAccumulator) {
    var nextToken = token ?? TokenAccumulator()
    nextToken.apply(resolveActiveState(scopes, inherited: inherited), character: character)
    return ("\(builder)\(character)", nextToken)
}

private func finalizeToken(words: inout [WordSeed], phrases: inout [PhraseSeed], currentPhrase: inout [WordSeed], builder: String, token: TokenAccumulator?, inherited: InheritedFormattingState) -> (String, TokenAccumulator?) {
    guard !builder.isEmpty, let token else { return ("", nil) }
    let text = restoreEscapes(builder).trimmingCharacters(in: .whitespacesAndNewlines)
    if text.isEmpty { return ("", nil) }
    if isStandalonePunctuationToken(text) {
        if attachStandalonePunctuation(words: &words, currentPhrase: &currentPhrase, punctuation: text), isSentenceEndingPunctuation(text) {
            flushPhrase(phrases: &phrases, currentPhrase: &currentPhrase)
        }
        return ("", nil)
    }
    let metadata = token.buildWordMetadata(inheritedWpm: inherited.targetWpm)
    let effectiveWpm = resolveEffectiveWpm(inherited.targetWpm, speedOverride: metadata.speedOverride, speedMultiplier: metadata.speedMultiplier)
    let word = WordSeed(kind: "word", cleanText: text, characterCount: text.count, orpPosition: calculateOrpIndex(text), displayDurationMs: calculateWordDurationMs(text, effectiveWpm: effectiveWpm), metadata: metadata)
    words.append(word)
    currentPhrase.append(word)
    if isSentenceEndingPunctuation(text) { flushPhrase(phrases: &phrases, currentPhrase: &currentPhrase) }
    return ("", nil)
}

private func attachStandalonePunctuation(words: inout [WordSeed], currentPhrase: inout [WordSeed], punctuation: String) -> Bool {
    if let currentIndex = currentPhrase.lastIndex(where: isSpokenWord) {
        currentPhrase[currentIndex].cleanText += buildStandalonePunctuationSuffix(punctuation)
        currentPhrase[currentIndex].characterCount = currentPhrase[currentIndex].cleanText.count
        currentPhrase[currentIndex].orpPosition = calculateOrpIndex(currentPhrase[currentIndex].cleanText)
        if let wordIndex = words.lastIndex(where: { $0.cleanText == currentPhrase[currentIndex].cleanText || ($0.cleanText + buildStandalonePunctuationSuffix(punctuation)) == currentPhrase[currentIndex].cleanText }) {
            words[wordIndex] = currentPhrase[currentIndex]
        }
        return true
    }
    guard let wordIndex = words.lastIndex(where: isSpokenWord) else { return false }
    words[wordIndex].cleanText += buildStandalonePunctuationSuffix(punctuation)
    words[wordIndex].characterCount = words[wordIndex].cleanText.count
    words[wordIndex].orpPosition = calculateOrpIndex(words[wordIndex].cleanText)
    return true
}

private func flushPhrase(phrases: inout [PhraseSeed], currentPhrase: inout [WordSeed]) {
    guard !currentPhrase.isEmpty else { return }
    phrases.append(PhraseSeed(words: currentPhrase, text: currentPhrase.filter(isSpokenWord).map(\.cleanText).joined(separator: " ")))
    currentPhrase.removeAll()
}

private func createControlWord(kind: String, inherited: InheritedFormattingState, pauseDurationMs: Int? = nil, editPointPriority: String? = nil) -> WordSeed {
    WordSeed(kind: kind, cleanText: "", characterCount: 0, orpPosition: 0, displayDurationMs: pauseDurationMs ?? 0, metadata: WordMetadata(isEmphasis: false, emphasisLevel: 0, isPause: kind == "pause", pauseDurationMs: pauseDurationMs, isHighlight: false, isBreath: kind == "breath", isEditPoint: kind == "edit-point", editPointPriority: editPointPriority, emotionHint: inherited.emotion, inlineEmotionHint: nil, volumeLevel: nil, deliveryMode: nil, phoneticGuide: nil, pronunciationGuide: nil, stressText: nil, stressGuide: nil, speedOverride: nil, speedMultiplier: nil, articulationStyle: nil, energyLevel: nil, melodyLevel: nil, speaker: inherited.speaker, headCue: TpsSpec.emotionHeadCues[inherited.emotion]))
}

private func resolveActiveState(_ scopes: [InlineScope], inherited: InheritedFormattingState) -> ActiveInlineState {
    var absoluteSpeed = inherited.targetWpm
    var hasAbsoluteSpeed = false
    var hasRelativeSpeed = false
    var relativeSpeedMultiplier = 1.0
    var emphasisLevel = 0
    var highlight = false
    var emotion = inherited.emotion
    var inlineEmotion: String? = nil
    var volumeLevel: String? = nil
    var deliveryMode: String? = nil
    var articulationStyle: String? = nil
    var energyLevel: Int? = nil
    var melodyLevel: Int? = nil
    var phoneticGuide: String? = nil
    var pronunciationGuide: String? = nil
    var stressGuide: String? = nil
    var stressWrap = false
    for scope in scopes {
        if let scopeAbsoluteSpeed = scope.absoluteSpeed {
            absoluteSpeed = scopeAbsoluteSpeed
            hasAbsoluteSpeed = true
            hasRelativeSpeed = false
            relativeSpeedMultiplier = 1
        }
        if scope.resetSpeed == true {
            hasRelativeSpeed = false
            relativeSpeedMultiplier = 1
        }
        if let multiplier = scope.relativeSpeedMultiplier {
            hasRelativeSpeed = true
            relativeSpeedMultiplier *= multiplier
        }
        emphasisLevel = max(emphasisLevel, scope.emphasisLevel ?? 0)
        highlight = highlight || (scope.highlight ?? false)
        if let scopeInlineEmotion = scope.inlineEmotion {
            emotion = scopeInlineEmotion
            inlineEmotion = scopeInlineEmotion
        }
        volumeLevel = scope.volumeLevel ?? volumeLevel
        deliveryMode = scope.deliveryMode ?? deliveryMode
        articulationStyle = scope.articulationStyle ?? articulationStyle
        if let scopeEnergyLevel = scope.energyLevel { energyLevel = scopeEnergyLevel }
        if let scopeMelodyLevel = scope.melodyLevel { melodyLevel = scopeMelodyLevel }
        phoneticGuide = scope.phoneticGuide ?? phoneticGuide
        pronunciationGuide = scope.pronunciationGuide ?? pronunciationGuide
        stressGuide = scope.stressGuide ?? stressGuide
        stressWrap = stressWrap || (scope.stressWrap ?? false)
    }
    return ActiveInlineState(emotion: emotion, inlineEmotion: inlineEmotion, speaker: inherited.speaker, emphasisLevel: emphasisLevel, highlight: highlight, volumeLevel: volumeLevel, deliveryMode: deliveryMode, articulationStyle: articulationStyle, energyLevel: energyLevel, melodyLevel: melodyLevel, phoneticGuide: phoneticGuide, pronunciationGuide: pronunciationGuide, stressGuide: stressGuide, stressWrap: stressWrap, hasAbsoluteSpeed: hasAbsoluteSpeed, absoluteSpeed: absoluteSpeed, hasRelativeSpeed: hasRelativeSpeed, relativeSpeedMultiplier: relativeSpeedMultiplier)
}

private func createWordView(_ word: CompiledWord, state: PlayerState) -> TpsPlaybackWordView {
    TpsPlaybackWordView(word: word, isActive: state.currentWord?.id == word.id, isRead: word.endMs <= state.elapsedMs, isUpcoming: word.startMs > state.elapsedMs, emotion: word.metadata.inlineEmotionHint ?? word.metadata.emotionHint ?? TpsSpec.defaultEmotion, speaker: word.metadata.speaker, emphasisLevel: word.metadata.emphasisLevel, isHighlighted: word.metadata.isHighlight, deliveryMode: word.metadata.deliveryMode, volumeLevel: word.metadata.volumeLevel)
}

private func normalizeLineEndings(_ value: String) -> String { value.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n") }
private func createLineStarts(_ text: String) -> [Int] {
    var starts = [0]
    for (index, character) in text.enumerated() where character == "\n" {
        starts.append(index + 1)
    }
    return starts
}
private func positionAt(_ offset: Int, lineStarts: [Int]) -> TpsPosition {
    var lineIndex = 0
    for index in 0..<lineStarts.count where lineStarts[index] <= offset { lineIndex = index }
    let lineStart = lineStarts[lineIndex]
    return TpsPosition(line: lineIndex + 1, column: offset - lineStart + 1, offset: offset)
}
private func createDiagnostic(_ code: String, message: String, start: Int, end: Int, lineStarts: [Int], suggestion: String? = nil) -> TpsDiagnostic {
    let severity = TpsSpec.warningDiagnosticCodes.contains(code) ? "warning" : "error"
    return TpsDiagnostic(code: code, severity: severity, message: message, suggestion: suggestion, range: TpsRange(start: positionAt(start, lineStarts: lineStarts), end: positionAt(end, lineStarts: lineStarts)))
}
private func createWarningDiagnostic(_ code: String, message: String, start: Int, end: Int, lineStarts: [Int], suggestion: String? = nil) -> TpsDiagnostic {
    TpsDiagnostic(code: code, severity: "warning", message: message, suggestion: suggestion, range: TpsRange(start: positionAt(start, lineStarts: lineStarts), end: positionAt(end, lineStarts: lineStarts)))
}
private func hasErrors(_ diagnostics: [TpsDiagnostic]) -> Bool { diagnostics.contains { $0.severity == "error" } }
private func normalizeValue(_ value: String?) -> String? { let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines); return trimmed?.isEmpty == false ? trimmed : nil }
private func isKnownEmotion(_ value: String) -> Bool { TpsSpec.emotions.contains(value.lowercased()) }
private func isKnownArchetype(_ value: String?) -> Bool { guard let value else { return false }; return TpsSpec.archetypes.contains(value.lowercased()) }
private func resolveArchetypeWpm(_ archetype: String?) -> Int? { guard let archetype else { return nil }; return TpsSpec.archetypeRecommendedWpm[archetype.lowercased()] }
private struct ArchetypeScopeMetrics { let averagePhraseLength: Double; let pauseFrequencyPer100Words: Double; let averagePauseDurationMs: Double?; let emphasisDensityPercent: Double; let speedVariationPer100Words: Double }
private func appendArchetypeDiagnostics(_ targets: [ArchetypeDiagnosticTarget], lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) {
    for target in targets {
        guard let block = target.block, let archetype = block.archetype?.lowercased(), let profile = TpsSpec.archetypeProfiles[archetype], let rhythm = TpsSpec.archetypeRhythmProfiles[archetype] else { continue }
        let spokenWords = block.words.filter { $0.kind == "word" && !$0.cleanText.isEmpty }
        guard !spokenWords.isEmpty else { continue }
        appendArchetypeProfileWarnings(target: target, block: block, archetype: archetype, profile: profile, spokenWords: spokenWords, lineStarts: lineStarts, diagnostics: &diagnostics)
        appendArchetypeRhythmWarnings(target: target, block: block, archetype: archetype, rhythm: rhythm, spokenWords: spokenWords, lineStarts: lineStarts, diagnostics: &diagnostics)
    }
}
private func appendArchetypeProfileWarnings(target: ArchetypeDiagnosticTarget, block: CompiledBlock, archetype: String, profile: TpsArchetypeProfile, spokenWords: [CompiledWord], lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) {
    if let articulationConflict = spokenWords.first(where: { isArticulationMismatch($0.metadata.articulationStyle, expectation: profile.articulation) }) {
        diagnostics.append(createWarningDiagnostic(TpsDiagnosticCodes.archetypeArticulationMismatch, message: buildArticulationMessage(archetype: archetype, blockName: block.name, actual: articulationConflict.metadata.articulationStyle ?? "unknown", expectation: profile.articulation), start: target.rangeStart, end: target.rangeEnd, lineStarts: lineStarts, suggestion: buildArticulationSuggestion(expectation: profile.articulation)))
    }
    if let energyConflict = spokenWords.first(where: { isOutOfRange($0.metadata.energyLevel, range: profile.energy) }), let energyLevel = energyConflict.metadata.energyLevel {
        diagnostics.append(createWarningDiagnostic(TpsDiagnosticCodes.archetypeEnergyMismatch, message: "Archetype '\(archetype)' expects energy between \(profile.energy.min) and \(profile.energy.max), but block '\(block.name)' uses \(energyLevel) on '\(energyConflict.cleanText)'.", start: target.rangeStart, end: target.rangeEnd, lineStarts: lineStarts, suggestion: "Keep [energy:N] between \(profile.energy.min) and \(profile.energy.max) for this archetype."))
    }
    if let melodyConflict = spokenWords.first(where: { isOutOfRange($0.metadata.melodyLevel, range: profile.melody) }), let melodyLevel = melodyConflict.metadata.melodyLevel {
        diagnostics.append(createWarningDiagnostic(TpsDiagnosticCodes.archetypeMelodyMismatch, message: "Archetype '\(archetype)' expects melody between \(profile.melody.min) and \(profile.melody.max), but block '\(block.name)' uses \(melodyLevel) on '\(melodyConflict.cleanText)'.", start: target.rangeStart, end: target.rangeEnd, lineStarts: lineStarts, suggestion: "Keep [melody:N] between \(profile.melody.min) and \(profile.melody.max) for this archetype."))
    }
    if let volumeConflict = spokenWords.first(where: { isVolumeMismatch($0.metadata.volumeLevel, expectation: profile.volume) }) {
        diagnostics.append(createWarningDiagnostic(TpsDiagnosticCodes.archetypeVolumeMismatch, message: buildVolumeMessage(archetype: archetype, blockName: block.name, actual: volumeConflict.metadata.volumeLevel ?? "default", expectation: profile.volume), start: target.rangeStart, end: target.rangeEnd, lineStarts: lineStarts, suggestion: buildVolumeSuggestion(expectation: profile.volume)))
    }
    if let speedConflict = spokenWords.first(where: { isSpeedMismatch($0, inheritedWpm: block.targetWpm, range: profile.speed) }) {
        diagnostics.append(createWarningDiagnostic(TpsDiagnosticCodes.archetypeSpeedMismatch, message: "Archetype '\(archetype)' expects inline speed changes to stay between \(profile.speed.min) and \(profile.speed.max) WPM, but block '\(block.name)' reaches \(resolveEffectiveWordWpm(speedConflict, inheritedWpm: block.targetWpm)) WPM on '\(speedConflict.cleanText)'.", start: target.rangeStart, end: target.rangeEnd, lineStarts: lineStarts, suggestion: "Prefer inline speed tags that keep this scope between \(profile.speed.min) and \(profile.speed.max) WPM."))
    }
}
private func appendArchetypeRhythmWarnings(target: ArchetypeDiagnosticTarget, block: CompiledBlock, archetype: String, rhythm: TpsArchetypeRhythmProfile, spokenWords: [CompiledWord], lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) {
    guard spokenWords.count >= TpsSpec.archetypeRhythmMinimumWords else { return }
    let phraseWordCounts = block.phrases.map { $0.words.filter { $0.kind == "word" && !$0.cleanText.isEmpty }.count }.filter { $0 > 0 }
    guard phraseWordCounts.count >= 2 else { return }
    let metrics = collectArchetypeScopeMetrics(block: block, spokenWords: spokenWords, phraseWordCounts: phraseWordCounts)
    pushArchetypeRhythmWarning(&diagnostics, code: TpsDiagnosticCodes.archetypeRhythmPhraseLength, target: target, lineStarts: lineStarts, condition: !isWithinRange(metrics.averagePhraseLength, range: rhythm.phraseLength), message: "Archetype '\(archetype)' expects average phrase length between \(rhythm.phraseLength.min) and \(rhythm.phraseLength.max) words, but block '\(block.name)' averages \(formatMetric(metrics.averagePhraseLength)).", suggestion: "Break phrases so this scope averages between \(rhythm.phraseLength.min) and \(rhythm.phraseLength.max) words.")
    pushArchetypeRhythmWarning(&diagnostics, code: TpsDiagnosticCodes.archetypeRhythmPauseFrequency, target: target, lineStarts: lineStarts, condition: !isWithinRange(metrics.pauseFrequencyPer100Words, range: rhythm.pauseFrequencyPer100Words), message: "Archetype '\(archetype)' expects \(rhythm.pauseFrequencyPer100Words.min) to \(rhythm.pauseFrequencyPer100Words.max) pauses per 100 words, but block '\(block.name)' has \(formatMetric(metrics.pauseFrequencyPer100Words)).", suggestion: "Adjust pause markers so this scope lands between \(rhythm.pauseFrequencyPer100Words.min) and \(rhythm.pauseFrequencyPer100Words.max) pauses per 100 words.")
    pushArchetypeRhythmWarning(&diagnostics, code: TpsDiagnosticCodes.archetypeRhythmPauseDuration, target: target, lineStarts: lineStarts, condition: metrics.averagePauseDurationMs.map { !isWithinRange($0, range: rhythm.averagePauseDurationMs) } ?? false, message: "Archetype '\(archetype)' expects average pause duration between \(rhythm.averagePauseDurationMs.min) and \(rhythm.averagePauseDurationMs.max) ms, but block '\(block.name)' averages \(formatMetric(metrics.averagePauseDurationMs)) ms.", suggestion: "Adjust explicit pauses so this scope averages between \(rhythm.averagePauseDurationMs.min) and \(rhythm.averagePauseDurationMs.max) ms.")
    pushArchetypeRhythmWarning(&diagnostics, code: TpsDiagnosticCodes.archetypeRhythmEmphasisDensity, target: target, lineStarts: lineStarts, condition: !isWithinRange(metrics.emphasisDensityPercent, range: rhythm.emphasisDensityPercent), message: "Archetype '\(archetype)' expects emphasis density between \(rhythm.emphasisDensityPercent.min)% and \(rhythm.emphasisDensityPercent.max)%, but block '\(block.name)' is \(formatMetric(metrics.emphasisDensityPercent))%.", suggestion: "Add or remove emphasis so this scope lands between \(rhythm.emphasisDensityPercent.min)% and \(rhythm.emphasisDensityPercent.max)%.")
    pushArchetypeRhythmWarning(&diagnostics, code: TpsDiagnosticCodes.archetypeRhythmSpeedVariation, target: target, lineStarts: lineStarts, condition: !isWithinRange(metrics.speedVariationPer100Words, range: rhythm.speedVariationPer100Words), message: "Archetype '\(archetype)' expects \(rhythm.speedVariationPer100Words.min) to \(rhythm.speedVariationPer100Words.max) inline speed changes per 100 words, but block '\(block.name)' has \(formatMetric(metrics.speedVariationPer100Words)).", suggestion: "Adjust inline speed tags so this scope lands between \(rhythm.speedVariationPer100Words.min) and \(rhythm.speedVariationPer100Words.max) changes per 100 words.")
}
private func collectArchetypeScopeMetrics(block: CompiledBlock, spokenWords: [CompiledWord], phraseWordCounts: [Int]) -> ArchetypeScopeMetrics {
    let pauses = block.words.filter { $0.kind == "pause" }
    let averagePauseDurationMs = pauses.isEmpty ? nil : Double(pauses.map(\.displayDurationMs).reduce(0, +)) / Double(pauses.count)
    let emphasisDensityPercent = Double(spokenWords.filter { $0.metadata.isEmphasis }.count) / Double(spokenWords.count) * 100
    let averagePhraseLength = Double(phraseWordCounts.reduce(0, +)) / Double(phraseWordCounts.count)
    var speedVariationRuns = 0
    var inVariation = false
    for word in spokenWords {
        let varied = hasInlineSpeedVariation(word, inheritedWpm: block.targetWpm)
        if varied && !inVariation { speedVariationRuns += 1 }
        inVariation = varied
    }
    return ArchetypeScopeMetrics(averagePhraseLength: averagePhraseLength, pauseFrequencyPer100Words: Double(pauses.count) / Double(spokenWords.count) * 100, averagePauseDurationMs: averagePauseDurationMs, emphasisDensityPercent: emphasisDensityPercent, speedVariationPer100Words: Double(speedVariationRuns) / Double(spokenWords.count) * 100)
}
private func pushArchetypeRhythmWarning(_ diagnostics: inout [TpsDiagnostic], code: String, target: ArchetypeDiagnosticTarget, lineStarts: [Int], condition: Bool, message: String, suggestion: String) {
    guard condition else { return }
    diagnostics.append(createWarningDiagnostic(code, message: message, start: target.rangeStart, end: target.rangeEnd, lineStarts: lineStarts, suggestion: suggestion))
}
private func isOutOfRange(_ value: Int?, range: TpsNumericRange) -> Bool { guard let value else { return false }; return value < range.min || value > range.max }
private func isWithinRange(_ value: Double, range: TpsNumericRange) -> Bool { value >= Double(range.min) && value <= Double(range.max) }
private func isArticulationMismatch(_ value: String?, expectation: String) -> Bool {
    if value == nil || expectation == TpsSpec.archetypeArticulationExpectations["flexible"] { return false }
    if expectation == TpsSpec.archetypeArticulationExpectations["neutral"] { return true }
    return value != expectation
}
private func isVolumeMismatch(_ value: String?, expectation: String) -> Bool {
    if expectation == TpsSpec.archetypeVolumeExpectations["flexible"] || value == nil { return false }
    if expectation == TpsSpec.archetypeVolumeExpectations["loudOnly"] { return value != TpsTags.loud }
    if expectation == TpsSpec.archetypeVolumeExpectations["defaultOnly"] { return true }
    return value != TpsTags.soft
}
private func hasInlineSpeedVariation(_ word: CompiledWord, inheritedWpm: Int) -> Bool { resolveEffectiveWordWpm(word, inheritedWpm: inheritedWpm) != inheritedWpm }
private func isSpeedMismatch(_ word: CompiledWord, inheritedWpm: Int, range: TpsNumericRange) -> Bool {
    guard word.metadata.speedOverride != nil || word.metadata.speedMultiplier != nil else { return false }
    let effectiveWpm = resolveEffectiveWordWpm(word, inheritedWpm: inheritedWpm)
    return effectiveWpm < range.min || effectiveWpm > range.max
}
private func resolveEffectiveWordWpm(_ word: CompiledWord, inheritedWpm: Int) -> Int {
    if let speedOverride = word.metadata.speedOverride { return speedOverride }
    if let speedMultiplier = word.metadata.speedMultiplier { return max(1, Int(round(Double(inheritedWpm) * speedMultiplier))) }
    return inheritedWpm
}
private func buildArticulationMessage(archetype: String, blockName: String, actual: String, expectation: String) -> String {
    if expectation == TpsSpec.archetypeArticulationExpectations["neutral"] {
        return "Archetype '\(archetype)' expects natural diction without articulation tags, but block '\(blockName)' uses '\(actual)'."
    }
    return "Archetype '\(archetype)' expects '\(expectation)' articulation, but block '\(blockName)' uses '\(actual)'."
}
private func buildArticulationSuggestion(expectation: String) -> String {
    if expectation == TpsSpec.archetypeArticulationExpectations["neutral"] { return "Remove [legato] or [staccato] tags from this archetype scope." }
    return "Prefer [\(expectation)]...[/\(expectation)] when you want to reinforce this archetype."
}
private func buildVolumeMessage(archetype: String, blockName: String, actual: String, expectation: String) -> String {
    if expectation == TpsSpec.archetypeVolumeExpectations["defaultOnly"] { return "Archetype '\(archetype)' expects default volume, but block '\(blockName)' uses '\(actual)'." }
    if expectation == TpsSpec.archetypeVolumeExpectations["softOrDefault"] { return "Archetype '\(archetype)' expects soft or default volume, but block '\(blockName)' uses '\(actual)'." }
    return "Archetype '\(archetype)' expects loud volume, but block '\(blockName)' uses '\(actual)'."
}
private func buildVolumeSuggestion(expectation: String) -> String {
    if expectation == TpsSpec.archetypeVolumeExpectations["defaultOnly"] { return "Remove explicit volume tags from this archetype scope." }
    if expectation == TpsSpec.archetypeVolumeExpectations["softOrDefault"] { return "Use [soft] sparingly or leave volume untagged in this scope." }
    return "Prefer [loud] when this archetype needs an explicit volume tag."
}
private func formatMetric(_ value: Double?) -> String {
    guard let value else { return "0" }
    let formatted = String(format: "%.1f", value)
    return formatted.hasSuffix(".0") ? String(formatted.dropLast(2)) : formatted
}
private func resolveEmotion(_ candidate: String?, fallback: String = TpsSpec.defaultEmotion) -> String { guard let normalized = normalizeValue(candidate)?.lowercased(), isKnownEmotion(normalized) else { return fallback }; return normalized }
private func resolvePalette(_ emotion: String?) -> [String: String] { TpsSpec.emotionPalettes[resolveEmotion(emotion)] ?? TpsSpec.emotionPalettes[TpsSpec.defaultEmotion]! }
private func resolveBaseWpm(_ metadata: [String: String]) -> Int { clampWpm(Int(metadata[TpsFrontMatterKeys.baseWpm] ?? "") ?? TpsSpec.defaultBaseWpm, fallback: TpsSpec.defaultBaseWpm) }
private func resolveSpeedOffsets(_ metadata: [String: String]) -> [String: Int] { [TpsTags.xslow: Int(metadata[TpsFrontMatterKeys.speedOffsetsXslow] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.xslow]!, TpsTags.slow: Int(metadata[TpsFrontMatterKeys.speedOffsetsSlow] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.slow]!, TpsTags.fast: Int(metadata[TpsFrontMatterKeys.speedOffsetsFast] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.fast]!, TpsTags.xfast: Int(metadata[TpsFrontMatterKeys.speedOffsetsXfast] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.xfast]! ] }
private func resolveSpeedMultiplier(_ tag: String, speedOffsets: [String: Int]) -> Double? { speedOffsets[tag].map { 1 + Double($0) / 100 } }
private func tryParseAbsoluteWpm(_ tag: String) -> Int? { tag.lowercased().hasSuffix(TpsSpec.wpmSuffix.lowercased()) ? Int(tag.dropLast(TpsSpec.wpmSuffix.count)) : nil }
private func isTimingToken(_ value: String) -> Bool { let parts = value.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: "-"); return !parts.isEmpty && parts.count <= 2 && parts.allSatisfy { $0.range(of: #"^\d{1,2}:\d{2}$"#, options: .regularExpression) != nil } }
private func isSentenceEndingPunctuation(_ text: String) -> Bool { [".", "!", "?"].contains(text.trimmingCharacters(in: .whitespaces).suffix(1)) }
private func tryResolvePauseMilliseconds(_ argument: String?) -> Int? { guard let trimmed = normalizeValue(argument) else { return nil }; if trimmed.lowercased().hasSuffix("ms") { return Int(trimmed.dropLast(2)) }; guard trimmed.lowercased().hasSuffix("s"), let seconds = Double(trimmed.dropLast()) else { return nil }; return Int(round(seconds * 1000)) }
private func calculateWordDurationMs(_ word: String, effectiveWpm: Int) -> Int { max(120, Int(round((60000 / Double(max(1, effectiveWpm))) * (0.8 + Double(word.count) * 0.04)))) }
private func calculateOrpIndex(_ word: String) -> Int { var cleanWord = word; while let last = cleanWord.last, [".", "!", "?", ",", ";", ":", "\"", "'", ")", "]", "}"].contains(String(last)) { cleanWord.removeLast() }; let length = cleanWord.count; if length <= 1 { return 0 }; let ratio = length <= 5 ? 0.3 : length <= 9 ? 0.35 : 0.4; return max(0, min(Int(floor(Double(length) * ratio)), length - 1)) }
private func resolveEffectiveWpm(_ inheritedWpm: Int, speedOverride: Int?, speedMultiplier: Double?) -> Int { if let speedOverride { return max(1, speedOverride) }; if let speedMultiplier { return max(1, Int(round(Double(inheritedWpm) * speedMultiplier))) }; return max(1, inheritedWpm) }
private func buildInvalidWpmMessage(_ value: String) -> String { "WPM '\(value)' must be between \(TpsSpec.minimumWpm) and \(TpsSpec.maximumWpm)." }
private func isInvalidWpm(_ value: Int) -> Bool { value < TpsSpec.minimumWpm || value > TpsSpec.maximumWpm }
private func protectEscapes(_ text: String) -> String { text.replacingOccurrences(of: "\\\\", with: "\u{E006}").replacingOccurrences(of: "\\[", with: "\u{E001}").replacingOccurrences(of: "\\]", with: "\u{E002}").replacingOccurrences(of: "\\|", with: "\u{E003}").replacingOccurrences(of: "\\/", with: "\u{E004}").replacingOccurrences(of: "\\*", with: "\u{E005}") }
private func restoreEscapes(_ text: String) -> String { text.replacingOccurrences(of: "\u{E001}", with: "[").replacingOccurrences(of: "\u{E002}", with: "]").replacingOccurrences(of: "\u{E003}", with: "|").replacingOccurrences(of: "\u{E004}", with: "/").replacingOccurrences(of: "\u{E005}", with: "*").replacingOccurrences(of: "\u{E006}", with: "\\") }
private func splitHeaderPartsDetailed(_ rawHeaderContent: String) -> [HeaderPart] {
    var parts: [HeaderPart] = []
    var current = ""
    var partStart = 0
    var index = 0
    while index < rawHeaderContent.count {
        let character = characterAt(rawHeaderContent, index)
        if character == "\\", index + 1 < rawHeaderContent.count {
            current += characterAt(rawHeaderContent, index + 1)
            index += 2
            continue
        }
        if character == "|" {
            parts.append(HeaderPart(value: current.trimmingCharacters(in: .whitespacesAndNewlines), start: partStart, end: index))
            current = ""
            partStart = index + 1
            index += 1
            continue
        }
        current += character
        index += 1
    }
    parts.append(HeaderPart(value: current.trimmingCharacters(in: .whitespacesAndNewlines), start: partStart, end: rawHeaderContent.count))
    return parts
}
private func isStandalonePunctuationToken(_ token: String?) -> Bool { guard let token, !token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }; return token.trimmingCharacters(in: .whitespacesAndNewlines).allSatisfy { [",", ".", ";", ":", "!", "?", "-", "—", "–", "…"].contains(String($0)) } }
private func buildStandalonePunctuationSuffix(_ token: String) -> String { let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines); return trimmed.allSatisfy { ["-", "—", "–"].contains(String($0)) } ? " \(trimmed)" : trimmed }
private func normalizeMetadataValue(_ value: String) -> String { let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines); return trimmed.hasPrefix("\"") && trimmed.hasSuffix("\"") && trimmed.count >= 2 ? String(trimmed.dropFirst().dropLast()) : trimmed }
private func findFrontMatterClosing(_ source: String) -> (Int, Int)? { if let blockClosingIndex = source.range(of: "\n---\n")?.lowerBound { return (source.distance(from: source.startIndex, to: blockClosingIndex), 5) }; if source.hasSuffix("\n---") { return (source.count - 4, 4) }; return nil }
private func validateMetadataEntry(key: String, value: String, start: Int, end: Int, lineStarts: [Int], diagnostics: inout [TpsDiagnostic]) { if key == TpsFrontMatterKeys.baseWpm { guard value.range(of: #"^-?\d+$"#, options: .regularExpression) != nil, let parsed = Int(value) else { diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, message: "Front matter field 'base_wpm' must be an integer.", start: start, end: end, lineStarts: lineStarts)); return }; if isInvalidWpm(parsed) { diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidWpm, message: buildInvalidWpmMessage(value), start: start, end: end, lineStarts: lineStarts)) }; return }; if key.hasPrefix("speed_offsets."), value.range(of: #"^-?\d+$"#, options: .regularExpression) == nil { diagnostics.append(createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, message: "Front matter field '\(key)' must be an integer.", start: start, end: end, lineStarts: lineStarts)) } }
private func isWhitespace(_ character: String) -> Bool { character.range(of: #"^\s$"#, options: .regularExpression) != nil }
private func isPairedScope(_ tagName: String) -> Bool { ![TpsTags.pause, TpsTags.breath, TpsTags.editPoint].contains(tagName) }
private func isSpokenWord(_ word: WordSeed) -> Bool { word.kind == "word" && !word.cleanText.isEmpty }
private func clamp(_ value: Int, minimum: Int, maximum: Int) -> Int { min(max(value, minimum), maximum) }
private func clampWpm(_ candidate: Int, fallback: Int) -> Int { clamp(candidate, minimum: TpsSpec.minimumWpm, maximum: TpsSpec.maximumWpm) }
private func normalizeBaseWpm(_ value: Int) -> Int { clampWpm(value, fallback: TpsSpec.defaultBaseWpm) }
private func normalizeTickInterval(_ value: Int?) -> Int { guard let value, value > 0 else { return TpsPlaybackDefaults.defaultTickIntervalMs }; return value }
private func normalizeSpeedStep(_ value: Int?) -> Int { guard let value, value > 0 else { return TpsPlaybackDefaults.defaultSpeedStepWpm }; return value }
private func normalizeSpeedOffset(_ baseWpm: Int, _ offset: Int) -> Int { clamp(baseWpm + offset, minimum: TpsSpec.minimumWpm, maximum: TpsSpec.maximumWpm) - baseWpm }
private func nowMs() -> Int { Int(Date().timeIntervalSince1970 * 1000) }
private func resolveStatusAfterSeek(_ current: TpsPlaybackStatus, totalDurationMs: Int, elapsedMs: Int) -> TpsPlaybackStatus { if totalDurationMs == 0 || elapsedMs >= totalDurationMs { return .completed }; if elapsedMs <= 0 && current == .idle { return .idle }; return .paused }
private func flattenBlocks(_ script: CompiledScript) -> [CompiledBlock] { script.segments.flatMap(\.blocks) }
private func validateWords(_ words: [CompiledWord], seenIds: inout Set<String>) throws { var previousWord: CompiledWord? = nil; for (index, word) in words.enumerated() { try validateIdentifier(word.id, scope: "word", seen: &seenIds); if word.index != index || word.segmentId.isEmpty || word.blockId.isEmpty || (word.kind == "word" && word.phraseId.isEmpty) || word.startMs < 0 || word.endMs < word.startMs || word.endMs - word.startMs != word.displayDurationMs || (previousWord != nil && word.startMs != previousWord!.endMs) { throw NSError(domain: "ManagedCodeTps", code: 9) }; previousWord = word } }
private func validateTimeRange(_ startWordIndex: Int, _ endWordIndex: Int, _ startMs: Int, _ endMs: Int, wordCount: Int) throws { if startWordIndex < 0 || endWordIndex < startWordIndex || startMs < 0 || endMs < startMs { throw NSError(domain: "ManagedCodeTps", code: 10) }; if wordCount == 0 { if startWordIndex != 0 || endWordIndex != 0 || startMs != 0 || endMs != 0 { throw NSError(domain: "ManagedCodeTps", code: 11) }; return }; if startWordIndex >= wordCount || endWordIndex >= wordCount { throw NSError(domain: "ManagedCodeTps", code: 12) } }
private func validateCanonicalScopeWords(_ scopeWords: [CompiledWord], startWordIndex: Int, endWordIndex: Int, startMs: Int, endMs: Int, canonicalWords: [CompiledWord], expectedSegmentId: String, expectedBlockId: String? = nil, expectedPhraseId: String? = nil) throws { if canonicalWords.isEmpty { if !scopeWords.isEmpty { throw NSError(domain: "ManagedCodeTps", code: 13) }; return }; if scopeWords.isEmpty { if startWordIndex != 0 || endWordIndex != 0 || startMs != 0 || endMs != 0 { throw NSError(domain: "ManagedCodeTps", code: 14) }; return }; let expectedWordCount = endWordIndex - startWordIndex + 1; if scopeWords.count != expectedWordCount || startMs != canonicalWords[startWordIndex].startMs || endMs != canonicalWords[endWordIndex].endMs { throw NSError(domain: "ManagedCodeTps", code: 15) }; for offset in 0..<scopeWords.count { let actualWord = scopeWords[offset]; let expectedWord = canonicalWords[startWordIndex + offset]; if actualWord.id != expectedWord.id || actualWord.index != expectedWord.index || actualWord.startMs != expectedWord.startMs || actualWord.endMs != expectedWord.endMs || actualWord.segmentId != expectedSegmentId || (expectedBlockId != nil && actualWord.blockId != expectedBlockId) || (expectedPhraseId != nil && actualWord.phraseId != expectedPhraseId) { throw NSError(domain: "ManagedCodeTps", code: 16) } } }
private func validateIdentifier(_ id: String, scope: String, seen: inout Set<String>) throws { if id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !seen.insert(id).inserted { throw NSError(domain: "ManagedCodeTps", code: 17) } }
private func characterAt(_ text: String, _ offset: Int) -> String { substring(text, offset, 1) }
private func substring(_ text: String, _ start: Int, _ length: Int? = nil) -> String { let ns = text as NSString; let safeStart = min(max(start, 0), ns.length); let safeLength = length.map { min($0, ns.length - safeStart) } ?? (ns.length - safeStart); return ns.substring(with: NSRange(location: safeStart, length: max(0, safeLength))) }
