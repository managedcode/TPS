import "dart:async";
import "dart:convert";
import "dart:math" as math;

enum TpsPlaybackStatus { idle, playing, paused, completed }

abstract final class TpsPlaybackDefaults {
  static const defaultSpeedStepWpm = 10;
  static const defaultTickIntervalMs = 16;
}

abstract final class TpsPlaybackEventNames {
  static const stateChanged = "stateChanged";
  static const wordChanged = "wordChanged";
  static const phraseChanged = "phraseChanged";
  static const blockChanged = "blockChanged";
  static const segmentChanged = "segmentChanged";
  static const statusChanged = "statusChanged";
  static const completed = "completed";
  static const snapshotChanged = "snapshotChanged";
}

class TpsPosition {
  const TpsPosition({
    required this.line,
    required this.column,
    required this.offset,
  });

  final int line;
  final int column;
  final int offset;

  Map<String, Object?> toJson() => {
        "line": line,
        "column": column,
        "offset": offset,
      };
}

class TpsRange {
  const TpsRange({
    required this.start,
    required this.end,
  });

  final TpsPosition start;
  final TpsPosition end;

  Map<String, Object?> toJson() => {
        "start": start.toJson(),
        "end": end.toJson(),
      };
}

class TpsDiagnostic {
  const TpsDiagnostic({
    required this.code,
    required this.severity,
    required this.message,
    required this.range,
    this.suggestion,
  });

  final String code;
  final String severity;
  final String message;
  final String? suggestion;
  final TpsRange range;

  Map<String, Object?> toJson() => _compact({
        "code": code,
        "severity": severity,
        "message": message,
        "suggestion": suggestion,
        "range": range.toJson(),
      });
}

class TpsValidationResult {
  const TpsValidationResult({
    required this.ok,
    required this.diagnostics,
  });

  final bool ok;
  final List<TpsDiagnostic> diagnostics;
}

class TpsParseResult extends TpsValidationResult {
  const TpsParseResult({
    required super.ok,
    required super.diagnostics,
    required this.document,
  });

  final TpsDocument document;
}

class TpsCompilationResult extends TpsValidationResult {
  const TpsCompilationResult({
    required super.ok,
    required super.diagnostics,
    required this.document,
    required this.script,
  });

  final TpsDocument document;
  final CompiledScript script;
}

class TpsDocument {
  const TpsDocument({
    required this.metadata,
    required this.segments,
  });

  final Map<String, String> metadata;
  final List<TpsSegment> segments;
}

class TpsSegment {
  const TpsSegment({
    required this.id,
    required this.name,
    required this.content,
    required this.blocks,
    this.targetWpm,
    this.emotion,
    this.speaker,
    this.archetype,
    this.timing,
    this.backgroundColor,
    this.textColor,
    this.accentColor,
    this.leadingContent,
  });

  final String id;
  final String name;
  final String content;
  final int? targetWpm;
  final String? emotion;
  final String? speaker;
  final String? archetype;
  final String? timing;
  final String? backgroundColor;
  final String? textColor;
  final String? accentColor;
  final String? leadingContent;
  final List<TpsBlock> blocks;
}

class TpsBlock {
  const TpsBlock({
    required this.id,
    required this.name,
    required this.content,
    this.targetWpm,
    this.emotion,
    this.speaker,
    this.archetype,
  });

  final String id;
  final String name;
  final String content;
  final int? targetWpm;
  final String? emotion;
  final String? speaker;
  final String? archetype;
}

class WordMetadata {
  const WordMetadata({
    required this.isEmphasis,
    required this.emphasisLevel,
    required this.isPause,
    required this.isHighlight,
    required this.isBreath,
    required this.isEditPoint,
    this.pauseDurationMs,
    this.editPointPriority,
    this.emotionHint,
    this.inlineEmotionHint,
    this.volumeLevel,
    this.deliveryMode,
    this.phoneticGuide,
    this.pronunciationGuide,
    this.stressText,
    this.stressGuide,
    this.speedOverride,
    this.speedMultiplier,
    this.speaker,
    this.headCue,
    this.articulationStyle,
    this.energyLevel,
    this.melodyLevel,
  });

  final bool isEmphasis;
  final int emphasisLevel;
  final bool isPause;
  final int? pauseDurationMs;
  final bool isHighlight;
  final bool isBreath;
  final bool isEditPoint;
  final String? editPointPriority;
  final String? emotionHint;
  final String? inlineEmotionHint;
  final String? volumeLevel;
  final String? deliveryMode;
  final String? phoneticGuide;
  final String? pronunciationGuide;
  final String? stressText;
  final String? stressGuide;
  final int? speedOverride;
  final double? speedMultiplier;
  final String? speaker;
  final String? headCue;
  final String? articulationStyle;
  final int? energyLevel;
  final int? melodyLevel;

  WordMetadata copyWith({
    bool? isEmphasis,
    int? emphasisLevel,
    bool? isPause,
    int? pauseDurationMs,
    bool? isHighlight,
    bool? isBreath,
    bool? isEditPoint,
    String? editPointPriority,
    String? emotionHint,
    String? inlineEmotionHint,
    String? volumeLevel,
    String? deliveryMode,
    String? phoneticGuide,
    String? pronunciationGuide,
    String? stressText,
    String? stressGuide,
    int? speedOverride,
    double? speedMultiplier,
    String? speaker,
    String? headCue,
    String? articulationStyle,
    int? energyLevel,
    int? melodyLevel,
  }) =>
      WordMetadata(
        isEmphasis: isEmphasis ?? this.isEmphasis,
        emphasisLevel: emphasisLevel ?? this.emphasisLevel,
        isPause: isPause ?? this.isPause,
        pauseDurationMs: pauseDurationMs ?? this.pauseDurationMs,
        isHighlight: isHighlight ?? this.isHighlight,
        isBreath: isBreath ?? this.isBreath,
        isEditPoint: isEditPoint ?? this.isEditPoint,
        editPointPriority: editPointPriority ?? this.editPointPriority,
        emotionHint: emotionHint ?? this.emotionHint,
        inlineEmotionHint: inlineEmotionHint ?? this.inlineEmotionHint,
        volumeLevel: volumeLevel ?? this.volumeLevel,
        deliveryMode: deliveryMode ?? this.deliveryMode,
        phoneticGuide: phoneticGuide ?? this.phoneticGuide,
        pronunciationGuide: pronunciationGuide ?? this.pronunciationGuide,
        stressText: stressText ?? this.stressText,
        stressGuide: stressGuide ?? this.stressGuide,
        speedOverride: speedOverride ?? this.speedOverride,
        speedMultiplier: speedMultiplier ?? this.speedMultiplier,
        speaker: speaker ?? this.speaker,
        headCue: headCue ?? this.headCue,
        articulationStyle: articulationStyle ?? this.articulationStyle,
        energyLevel: energyLevel ?? this.energyLevel,
        melodyLevel: melodyLevel ?? this.melodyLevel,
      );

  Map<String, Object?> toJson() => _compact({
        "isEmphasis": isEmphasis,
        "emphasisLevel": emphasisLevel,
        "isPause": isPause,
        "pauseDurationMs": pauseDurationMs,
        "isHighlight": isHighlight,
        "isBreath": isBreath,
        "isEditPoint": isEditPoint,
        "editPointPriority": editPointPriority,
        "emotionHint": emotionHint,
        "inlineEmotionHint": inlineEmotionHint,
        "volumeLevel": volumeLevel,
        "deliveryMode": deliveryMode,
        "phoneticGuide": phoneticGuide,
        "pronunciationGuide": pronunciationGuide,
        "stressText": stressText,
        "stressGuide": stressGuide,
        "speedOverride": speedOverride,
        "speedMultiplier": speedMultiplier,
        "speaker": speaker,
        "headCue": headCue,
        "articulationStyle": articulationStyle,
        "energyLevel": energyLevel,
        "melodyLevel": melodyLevel,
      });
}

class CompiledWord {
  const CompiledWord({
    required this.id,
    required this.index,
    required this.kind,
    required this.cleanText,
    required this.characterCount,
    required this.orpPosition,
    required this.displayDurationMs,
    required this.startMs,
    required this.endMs,
    required this.metadata,
    required this.segmentId,
    required this.blockId,
    required this.phraseId,
  });

  final String id;
  final int index;
  final String kind;
  final String cleanText;
  final int characterCount;
  final int orpPosition;
  final int displayDurationMs;
  final int startMs;
  final int endMs;
  final WordMetadata metadata;
  final String segmentId;
  final String blockId;
  final String phraseId;

  CompiledWord copyWith({
    String? id,
    int? index,
    String? kind,
    String? cleanText,
    int? characterCount,
    int? orpPosition,
    int? displayDurationMs,
    int? startMs,
    int? endMs,
    WordMetadata? metadata,
    String? segmentId,
    String? blockId,
    String? phraseId,
  }) =>
      CompiledWord(
        id: id ?? this.id,
        index: index ?? this.index,
        kind: kind ?? this.kind,
        cleanText: cleanText ?? this.cleanText,
        characterCount: characterCount ?? this.characterCount,
        orpPosition: orpPosition ?? this.orpPosition,
        displayDurationMs: displayDurationMs ?? this.displayDurationMs,
        startMs: startMs ?? this.startMs,
        endMs: endMs ?? this.endMs,
        metadata: metadata ?? this.metadata,
        segmentId: segmentId ?? this.segmentId,
        blockId: blockId ?? this.blockId,
        phraseId: phraseId ?? this.phraseId,
      );

  Map<String, Object?> toJson() => {
        "id": id,
        "index": index,
        "kind": kind,
        "cleanText": cleanText,
        "characterCount": characterCount,
        "orpPosition": orpPosition,
        "displayDurationMs": displayDurationMs,
        "startMs": startMs,
        "endMs": endMs,
        "metadata": metadata.toJson(),
        "segmentId": segmentId,
        "blockId": blockId,
        "phraseId": phraseId,
      };
}

class CompiledPhrase {
  const CompiledPhrase({
    required this.id,
    required this.text,
    required this.startWordIndex,
    required this.endWordIndex,
    required this.startMs,
    required this.endMs,
    required this.words,
  });

  final String id;
  final String text;
  final int startWordIndex;
  final int endWordIndex;
  final int startMs;
  final int endMs;
  final List<CompiledWord> words;

  Map<String, Object?> toJson() => {
        "id": id,
        "text": text,
        "startWordIndex": startWordIndex,
        "endWordIndex": endWordIndex,
        "startMs": startMs,
        "endMs": endMs,
        "words": words.map((word) => word.toJson()).toList(growable: false),
      };
}

class CompiledBlock {
  const CompiledBlock({
    required this.id,
    required this.name,
    required this.targetWpm,
    required this.emotion,
    required this.isImplicit,
    required this.startWordIndex,
    required this.endWordIndex,
    required this.startMs,
    required this.endMs,
    required this.phrases,
    required this.words,
    this.speaker,
    this.archetype,
  });

  final String id;
  final String name;
  final int targetWpm;
  final String emotion;
  final String? speaker;
  final String? archetype;
  final bool isImplicit;
  final int startWordIndex;
  final int endWordIndex;
  final int startMs;
  final int endMs;
  final List<CompiledPhrase> phrases;
  final List<CompiledWord> words;

  Map<String, Object?> toJson() => _compact({
        "id": id,
        "name": name,
        "targetWpm": targetWpm,
        "emotion": emotion,
        "speaker": speaker,
        "archetype": archetype,
        "isImplicit": isImplicit,
        "startWordIndex": startWordIndex,
        "endWordIndex": endWordIndex,
        "startMs": startMs,
        "endMs": endMs,
        "phrases": phrases.map((phrase) => phrase.toJson()).toList(growable: false),
        "words": words.map((word) => word.toJson()).toList(growable: false),
      });
}

class CompiledSegment {
  const CompiledSegment({
    required this.id,
    required this.name,
    required this.targetWpm,
    required this.emotion,
    required this.backgroundColor,
    required this.textColor,
    required this.accentColor,
    required this.startWordIndex,
    required this.endWordIndex,
    required this.startMs,
    required this.endMs,
    required this.blocks,
    required this.words,
    this.speaker,
    this.archetype,
    this.timing,
  });

  final String id;
  final String name;
  final int targetWpm;
  final String emotion;
  final String? speaker;
  final String? archetype;
  final String? timing;
  final String backgroundColor;
  final String textColor;
  final String accentColor;
  final int startWordIndex;
  final int endWordIndex;
  final int startMs;
  final int endMs;
  final List<CompiledBlock> blocks;
  final List<CompiledWord> words;

  Map<String, Object?> toJson() => _compact({
        "id": id,
        "name": name,
        "targetWpm": targetWpm,
        "emotion": emotion,
        "speaker": speaker,
        "archetype": archetype,
        "timing": timing,
        "backgroundColor": backgroundColor,
        "textColor": textColor,
        "accentColor": accentColor,
        "startWordIndex": startWordIndex,
        "endWordIndex": endWordIndex,
        "startMs": startMs,
        "endMs": endMs,
        "blocks": blocks.map((block) => block.toJson()).toList(growable: false),
        "words": words.map((word) => word.toJson()).toList(growable: false),
      });
}

class CompiledScript {
  const CompiledScript({
    required this.metadata,
    required this.totalDurationMs,
    required this.segments,
    required this.words,
  });

  final Map<String, String> metadata;
  final int totalDurationMs;
  final List<CompiledSegment> segments;
  final List<CompiledWord> words;

  Map<String, Object?> toJson() => {
        "metadata": Map<String, String>.from(metadata),
        "totalDurationMs": totalDurationMs,
        "segments": segments.map((segment) => segment.toJson()).toList(growable: false),
        "words": words.map((word) => word.toJson()).toList(growable: false),
      };
}

class PlayerPresentationModel {
  const PlayerPresentationModel({
    required this.visibleWords,
    required this.activeWordInPhrase,
    this.segmentName,
    this.blockName,
    this.phraseText,
  });

  final String? segmentName;
  final String? blockName;
  final String? phraseText;
  final List<CompiledWord> visibleWords;
  final int activeWordInPhrase;

  Map<String, Object?> toJson() => _compact({
        "segmentName": segmentName,
        "blockName": blockName,
        "phraseText": phraseText,
        "visibleWords": visibleWords.map((word) => word.toJson()).toList(growable: false),
        "activeWordInPhrase": activeWordInPhrase,
      });
}

class PlayerState {
  const PlayerState({
    required this.elapsedMs,
    required this.remainingMs,
    required this.progress,
    required this.isComplete,
    required this.currentWordIndex,
    required this.presentation,
    this.currentWord,
    this.previousWord,
    this.nextWord,
    this.currentSegment,
    this.currentBlock,
    this.currentPhrase,
    this.nextTransitionMs,
  });

  final int elapsedMs;
  final int remainingMs;
  final double progress;
  final bool isComplete;
  final int currentWordIndex;
  final CompiledWord? currentWord;
  final CompiledWord? previousWord;
  final CompiledWord? nextWord;
  final CompiledSegment? currentSegment;
  final CompiledBlock? currentBlock;
  final CompiledPhrase? currentPhrase;
  final int? nextTransitionMs;
  final PlayerPresentationModel presentation;

  Map<String, Object?> toJson() => _compact({
        "elapsedMs": elapsedMs,
        "remainingMs": remainingMs,
        "progress": double.parse(progress.toStringAsFixed(6)),
        "isComplete": isComplete,
        "currentWordIndex": currentWordIndex,
        "currentWord": currentWord?.toJson(),
        "previousWord": previousWord?.toJson(),
        "nextWord": nextWord?.toJson(),
        "currentSegment": currentSegment?.toJson(),
        "currentBlock": currentBlock?.toJson(),
        "currentPhrase": currentPhrase?.toJson(),
        "nextTransitionMs": nextTransitionMs,
        "presentation": presentation.toJson(),
      });
}

class TpsPlaybackSessionOptions {
  const TpsPlaybackSessionOptions({
    this.tickIntervalMs,
    this.baseWpm,
    this.speedStepWpm,
    this.initialSpeedOffsetWpm,
    this.autoPlay = false,
  });

  final int? tickIntervalMs;
  final int? baseWpm;
  final int? speedStepWpm;
  final int? initialSpeedOffsetWpm;
  final bool autoPlay;
}

class TpsPlaybackTempo {
  const TpsPlaybackTempo({
    required this.baseWpm,
    required this.effectiveBaseWpm,
    required this.speedOffsetWpm,
    required this.speedStepWpm,
    required this.playbackRate,
  });

  final int baseWpm;
  final int effectiveBaseWpm;
  final int speedOffsetWpm;
  final int speedStepWpm;
  final double playbackRate;

  Map<String, Object?> toJson() => {
        "baseWpm": baseWpm,
        "effectiveBaseWpm": effectiveBaseWpm,
        "speedOffsetWpm": speedOffsetWpm,
        "speedStepWpm": speedStepWpm,
        "playbackRate": double.parse(playbackRate.toStringAsFixed(6)),
      };
}

class TpsPlaybackControls {
  const TpsPlaybackControls({
    required this.canPlay,
    required this.canPause,
    required this.canStop,
    required this.canNextWord,
    required this.canPreviousWord,
    required this.canNextBlock,
    required this.canPreviousBlock,
    required this.canIncreaseSpeed,
    required this.canDecreaseSpeed,
  });

  final bool canPlay;
  final bool canPause;
  final bool canStop;
  final bool canNextWord;
  final bool canPreviousWord;
  final bool canNextBlock;
  final bool canPreviousBlock;
  final bool canIncreaseSpeed;
  final bool canDecreaseSpeed;

  Map<String, Object?> toJson() => {
        "canPlay": canPlay,
        "canPause": canPause,
        "canStop": canStop,
        "canNextWord": canNextWord,
        "canPreviousWord": canPreviousWord,
        "canNextBlock": canNextBlock,
        "canPreviousBlock": canPreviousBlock,
        "canIncreaseSpeed": canIncreaseSpeed,
        "canDecreaseSpeed": canDecreaseSpeed,
      };
}

class TpsPlaybackWordView {
  const TpsPlaybackWordView({
    required this.word,
    required this.isActive,
    required this.isRead,
    required this.isUpcoming,
    required this.emotion,
    required this.emphasisLevel,
    required this.isHighlighted,
    this.speaker,
    this.deliveryMode,
    this.volumeLevel,
  });

  final CompiledWord word;
  final bool isActive;
  final bool isRead;
  final bool isUpcoming;
  final String emotion;
  final String? speaker;
  final int emphasisLevel;
  final bool isHighlighted;
  final String? deliveryMode;
  final String? volumeLevel;

  Map<String, Object?> toJson() => _compact({
        "word": word.toJson(),
        "isActive": isActive,
        "isRead": isRead,
        "isUpcoming": isUpcoming,
        "emotion": emotion,
        "speaker": speaker,
        "emphasisLevel": emphasisLevel,
        "isHighlighted": isHighlighted,
        "deliveryMode": deliveryMode,
        "volumeLevel": volumeLevel,
      });
}

class TpsPlaybackSnapshot {
  const TpsPlaybackSnapshot({
    required this.status,
    required this.state,
    required this.tempo,
    required this.controls,
    required this.visibleWords,
    required this.currentSegmentIndex,
    required this.currentBlockIndex,
    this.focusedWord,
    this.currentWordDurationMs,
    this.currentWordRemainingMs,
  });

  final TpsPlaybackStatus status;
  final PlayerState state;
  final TpsPlaybackTempo tempo;
  final TpsPlaybackControls controls;
  final List<TpsPlaybackWordView> visibleWords;
  final TpsPlaybackWordView? focusedWord;
  final int? currentWordDurationMs;
  final int? currentWordRemainingMs;
  final int currentSegmentIndex;
  final int currentBlockIndex;

  Map<String, Object?> toJson() => _compact({
        "status": status.name,
        "state": state.toJson(),
        "tempo": tempo.toJson(),
        "controls": controls.toJson(),
        "visibleWords": visibleWords.map((word) => word.toJson()).toList(growable: false),
        "focusedWord": focusedWord?.toJson(),
        "currentWordDurationMs": currentWordDurationMs,
        "currentWordRemainingMs": currentWordRemainingMs,
        "currentSegmentIndex": currentSegmentIndex,
        "currentBlockIndex": currentBlockIndex,
      });
}

abstract final class TpsFrontMatterKeys {
  static const title = "title";
  static const profile = "profile";
  static const duration = "duration";
  static const baseWpm = "base_wpm";
  static const author = "author";
  static const created = "created";
  static const version = "version";
  static const speedOffsetsXslow = "speed_offsets.xslow";
  static const speedOffsetsSlow = "speed_offsets.slow";
  static const speedOffsetsFast = "speed_offsets.fast";
  static const speedOffsetsXfast = "speed_offsets.xfast";
}

abstract final class TpsTags {
  static const aside = "aside";
  static const breath = "breath";
  static const building = "building";
  static const editPoint = "edit_point";
  static const emphasis = "emphasis";
  static const energy = "energy";
  static const fast = "fast";
  static const highlight = "highlight";
  static const legato = "legato";
  static const loud = "loud";
  static const melody = "melody";
  static const normal = "normal";
  static const pause = "pause";
  static const phonetic = "phonetic";
  static const pronunciation = "pronunciation";
  static const rhetorical = "rhetorical";
  static const sarcasm = "sarcasm";
  static const slow = "slow";
  static const soft = "soft";
  static const staccato = "staccato";
  static const stress = "stress";
  static const whisper = "whisper";
  static const xfast = "xfast";
  static const xslow = "xslow";
}

abstract final class TpsDiagnosticCodes {
  static const invalidFrontMatter = "invalid-front-matter";
  static const invalidHeader = "invalid-header";
  static const invalidHeaderParameter = "invalid-header-parameter";
  static const unterminatedTag = "unterminated-tag";
  static const unknownTag = "unknown-tag";
  static const invalidPause = "invalid-pause";
  static const invalidTagArgument = "invalid-tag-argument";
  static const invalidWpm = "invalid-wpm";
  static const invalidEnergyLevel = "invalid-energy-level";
  static const invalidMelodyLevel = "invalid-melody-level";
  static const unknownArchetype = "unknown-archetype";
  static const mismatchedClosingTag = "mismatched-closing-tag";
  static const unclosedTag = "unclosed-tag";
}

abstract final class TpsSpec {
  static const defaultBaseWpm = 140;
  static const defaultEmotion = "neutral";
  static const defaultImplicitSegmentName = "Content";
  static const defaultProfile = "Actor";
  static const minimumWpm = 80;
  static const maximumWpm = 220;
  static const shortPauseDurationMs = 300;
  static const mediumPauseDurationMs = 600;
  static const speakerPrefix = "Speaker:";
  static const archetypePrefix = "Archetype:";
  static const wpmSuffix = "WPM";
  static const emotions = [
    "neutral",
    "warm",
    "professional",
    "focused",
    "concerned",
    "urgent",
    "motivational",
    "excited",
    "happy",
    "sad",
    "calm",
    "energetic",
  ];
  static const volumeLevels = [TpsTags.loud, TpsTags.soft, TpsTags.whisper];
  static const deliveryModes = [TpsTags.sarcasm, TpsTags.aside, TpsTags.rhetorical, TpsTags.building];
  static const articulationStyles = [TpsTags.legato, TpsTags.staccato];
  static const archetypeFriend = "friend";
  static const archetypeMotivator = "motivator";
  static const archetypeEducator = "educator";
  static const archetypeCoach = "coach";
  static const archetypeStoryteller = "storyteller";
  static const archetypeEntertainer = "entertainer";

  static const archetypes = [archetypeFriend, archetypeMotivator, archetypeEducator, archetypeCoach, archetypeStoryteller, archetypeEntertainer];
  static const archetypeRecommendedWpm = {
    archetypeFriend: 135,
    archetypeMotivator: 155,
    archetypeEducator: 120,
    archetypeCoach: 145,
    archetypeStoryteller: 125,
    archetypeEntertainer: 150,
  };
  static const energyLevelMin = 1;
  static const energyLevelMax = 10;
  static const melodyLevelMin = 1;
  static const melodyLevelMax = 10;
  static const relativeSpeedTags = [TpsTags.xslow, TpsTags.slow, TpsTags.fast, TpsTags.xfast, TpsTags.normal];
  static const editPointPriorities = ["high", "medium", "low"];
  static const defaultSpeedOffsets = {
    TpsTags.xslow: -40,
    TpsTags.slow: -20,
    TpsTags.fast: 25,
    TpsTags.xfast: 50,
  };
  static const emotionPalettes = {
    "neutral": {"accent": "#2563EB", "text": "#0F172A", "background": "#60A5FA"},
    "warm": {"accent": "#EA580C", "text": "#1C1917", "background": "#FDBA74"},
    "professional": {"accent": "#1D4ED8", "text": "#0F172A", "background": "#93C5FD"},
    "focused": {"accent": "#15803D", "text": "#052E16", "background": "#86EFAC"},
    "concerned": {"accent": "#B91C1C", "text": "#1F1111", "background": "#FCA5A5"},
    "urgent": {"accent": "#DC2626", "text": "#FFF7F7", "background": "#FCA5A5"},
    "motivational": {"accent": "#7C3AED", "text": "#FFFFFF", "background": "#C4B5FD"},
    "excited": {"accent": "#DB2777", "text": "#FFF7FB", "background": "#F9A8D4"},
    "happy": {"accent": "#D97706", "text": "#1C1917", "background": "#FCD34D"},
    "sad": {"accent": "#4F46E5", "text": "#EEF2FF", "background": "#A5B4FC"},
    "calm": {"accent": "#0F766E", "text": "#F0FDFA", "background": "#99F6E4"},
    "energetic": {"accent": "#C2410C", "text": "#FFF7ED", "background": "#FDBA74"},
  };
  static const emotionHeadCues = {
    "neutral": "H0",
    "calm": "H0",
    "professional": "H9",
    "focused": "H5",
    "motivational": "H9",
    "urgent": "H4",
    "concerned": "H1",
    "sad": "H1",
    "warm": "H7",
    "happy": "H6",
    "excited": "H6",
    "energetic": "H8",
  };
}

abstract final class TpsKeywords {
  static const tags = {
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
  };
  static const emotions = TpsSpec.emotions;
  static const volumeLevels = TpsSpec.volumeLevels;
  static const deliveryModes = TpsSpec.deliveryModes;
  static const articulationStyles = TpsSpec.articulationStyles;
  static const archetypes = TpsSpec.archetypes;
  static const relativeSpeedTags = TpsSpec.relativeSpeedTags;
  static const editPointPriorities = TpsSpec.editPointPriorities;
}

TpsValidationResult validateTps(String source) => TpsRuntime.validateTps(source);
TpsParseResult parseTps(String source) => TpsRuntime.parseTps(source);
TpsCompilationResult compileTps(String source) => TpsRuntime.compileTps(source);

abstract final class TpsRuntime {
  static TpsValidationResult validateTps(String source) {
    final analysis = _parseDocument(source);
    _compileAnalysis(analysis);
    return TpsValidationResult(ok: !_hasErrors(analysis.diagnostics), diagnostics: List.unmodifiable(analysis.diagnostics));
  }

  static TpsParseResult parseTps(String source) {
    final analysis = _parseDocument(source);
    _compileAnalysis(analysis);
    return TpsParseResult(
      ok: !_hasErrors(analysis.diagnostics),
      diagnostics: List.unmodifiable(analysis.diagnostics),
      document: analysis.document,
    );
  }

  static TpsCompilationResult compileTps(String source) {
    final analysis = _parseDocument(source);
    final script = _compileAnalysis(analysis);
    return TpsCompilationResult(
      ok: !_hasErrors(analysis.diagnostics),
      diagnostics: List.unmodifiable(analysis.diagnostics),
      document: analysis.document,
      script: normalizeCompiledScript(script),
    );
  }
}

class TpsPlayer {
  TpsPlayer(CompiledScript compiledScript) : _script = normalizeCompiledScript(compiledScript) {
    for (final segment in _script.segments) {
      _segmentById[segment.id] = segment;
      for (final block in segment.blocks) {
        _blockById[block.id] = block;
        for (final phrase in block.phrases) {
          _phraseById[phrase.id] = phrase;
        }
      }
    }
  }

  final CompiledScript _script;
  final Map<String, CompiledSegment> _segmentById = {};
  final Map<String, CompiledBlock> _blockById = {};
  final Map<String, CompiledPhrase> _phraseById = {};

  CompiledScript get script => _script;

  PlayerState getState(int elapsedMs) {
    final clampedElapsed = _clamp(elapsedMs, 0, _script.totalDurationMs);
    final currentWord = _findCurrentWord(clampedElapsed);
    final currentSegment = currentWord != null ? _segmentById[currentWord.segmentId] : (_script.segments.isEmpty ? null : _script.segments.first);
    final currentBlock = currentWord != null
        ? _blockById[currentWord.blockId]
        : (currentSegment == null || currentSegment.blocks.isEmpty ? null : currentSegment.blocks.first);
    final currentPhrase = currentWord != null
        ? _phraseById[currentWord.phraseId]
        : (currentBlock == null || currentBlock.phrases.isEmpty ? null : currentBlock.phrases.first);
    final currentWordIndex = currentWord?.index ?? -1;
    final previousWord = currentWordIndex > 0 ? _script.words[currentWordIndex - 1] : null;
    final nextWord = currentWordIndex >= 0 && currentWordIndex + 1 < _script.words.length ? _script.words[currentWordIndex + 1] : null;
    final progress = _script.totalDurationMs == 0 ? 1.0 : clampedElapsed / _script.totalDurationMs;
    final activeWordInPhrase = currentPhrase == null ? -1 : currentPhrase.words.indexWhere((word) => word.id == currentWord?.id);
    return PlayerState(
      elapsedMs: clampedElapsed,
      remainingMs: math.max(0, _script.totalDurationMs - clampedElapsed),
      progress: progress,
      isComplete: clampedElapsed >= _script.totalDurationMs,
      currentWordIndex: currentWordIndex,
      currentWord: currentWord,
      previousWord: previousWord,
      nextWord: nextWord,
      currentSegment: currentSegment,
      currentBlock: currentBlock,
      currentPhrase: currentPhrase,
      nextTransitionMs: currentWord?.endMs ?? _script.totalDurationMs,
      presentation: PlayerPresentationModel(
        segmentName: currentSegment?.name,
        blockName: currentBlock?.name,
        phraseText: currentPhrase?.text,
        visibleWords: currentPhrase?.words ?? const [],
        activeWordInPhrase: activeWordInPhrase,
      ),
    );
  }

  PlayerState seek(int elapsedMs) => getState(elapsedMs);

  Iterable<PlayerState> enumerateStates([int stepMs = 100]) sync* {
    if (stepMs <= 0) {
      throw RangeError("stepMs must be greater than 0.");
    }

    if (_script.totalDurationMs == 0) {
      yield getState(0);
      return;
    }

    for (var elapsedMs = 0; elapsedMs < _script.totalDurationMs; elapsedMs += stepMs) {
      yield getState(elapsedMs);
    }

    yield getState(_script.totalDurationMs);
  }

  CompiledWord? _findCurrentWord(int elapsedMs) {
    if (_script.words.isEmpty) {
      return null;
    }

    var low = 0;
    var high = _script.words.length - 1;
    var candidateIndex = -1;
    while (low <= high) {
      final middle = low + ((high - low) ~/ 2);
      final word = _script.words[middle];
      if (word.endMs > elapsedMs) {
        candidateIndex = middle;
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    }

    if (candidateIndex >= 0) {
      for (var index = candidateIndex; index < _script.words.length; index += 1) {
        final word = _script.words[index];
        if (word.endMs > elapsedMs && word.endMs > word.startMs) {
          return word;
        }
      }
    }

    return _script.words.last;
  }
}

class TpsPlaybackSession {
  TpsPlaybackSession(CompiledScript scriptOrPlayer, [TpsPlaybackSessionOptions options = const TpsPlaybackSessionOptions()])
      : player = TpsPlayer(scriptOrPlayer),
        tickIntervalMs = options.tickIntervalMs ?? TpsPlaybackDefaults.defaultTickIntervalMs,
        baseWpm = _normalizeBaseWpm(options.baseWpm),
        speedStepWpm = _normalizeSpeedStep(options.speedStepWpm),
        speedOffsetWpm = 0 {
    currentState = player.getState(0);
    speedOffsetWpm = _normalizeSpeedOffset(baseWpm, options.initialSpeedOffsetWpm ?? 0);
    _blocks = _flattenBlocks(player.script);
    for (var index = 0; index < player.script.segments.length; index += 1) {
      _segmentIndexById[player.script.segments[index].id] = index;
    }
    for (var index = 0; index < _blocks.length; index += 1) {
      _blockIndexById[_blocks[index].id] = index;
    }
  }

  final TpsPlayer player;
  final int tickIntervalMs;
  final int baseWpm;
  final int speedStepWpm;
  final Map<String, List<void Function(Object?)>> _listeners = {};
  final Map<String, int> _segmentIndexById = {};
  final Map<String, int> _blockIndexById = {};
  late final List<CompiledBlock> _blocks;
  Timer? _timer;
  PlayerState currentState = const PlayerState(
    elapsedMs: 0,
    remainingMs: 0,
    progress: 1,
    isComplete: true,
    currentWordIndex: -1,
    presentation: PlayerPresentationModel(visibleWords: [], activeWordInPhrase: -1),
  );
  TpsPlaybackStatus status = TpsPlaybackStatus.idle;
  int speedOffsetWpm;
  int _playbackOffsetMs = 0;
  int _playbackStartedAtMs = 0;

  bool get isPlaying => status == TpsPlaybackStatus.playing;
  int get effectiveBaseWpm => _clamp(baseWpm + speedOffsetWpm, TpsSpec.minimumWpm, TpsSpec.maximumWpm);
  double get playbackRate => baseWpm <= 0 ? 1 : effectiveBaseWpm / baseWpm;
  int get speedOffset => speedOffsetWpm;
  TpsPlaybackSnapshot get snapshot => createSnapshot();

  VoidCallback on(String eventName, void Function(Object?) listener) {
    (_listeners[eventName] ??= []).add(listener);
    return () => off(eventName, listener);
  }

  void off(String eventName, void Function(Object?) listener) {
    _listeners[eventName]?.remove(listener);
  }

  VoidCallback observeSnapshot(void Function(TpsPlaybackSnapshot) listener, [bool emitCurrent = true]) {
    final unsubscribe = on(TpsPlaybackEventNames.snapshotChanged, (event) => listener(event as TpsPlaybackSnapshot));
    if (emitCurrent) {
      listener(snapshot);
    }

    return unsubscribe;
  }

  PlayerState play() {
    if (status == TpsPlaybackStatus.playing) {
      return currentState;
    }

    if (currentState.isComplete && player.script.totalDurationMs > 0) {
      seek(0);
    }

    if (player.script.totalDurationMs == 0) {
      return _updatePosition(0, TpsPlaybackStatus.completed);
    }

    _playbackOffsetMs = currentState.elapsedMs;
    _playbackStartedAtMs = _nowMs();
    _clearTimer();
    _updateStatus(TpsPlaybackStatus.playing);
    _emitSnapshotChanged();
    _scheduleNextTick();
    return currentState;
  }

  PlayerState pause() {
    if (status != TpsPlaybackStatus.playing) {
      return currentState;
    }

    final state = _updatePosition(_readLiveElapsedMs(), TpsPlaybackStatus.paused);
    _clearTimer();
    return state;
  }

  PlayerState stop() {
    _clearTimer();
    _playbackOffsetMs = 0;
    _playbackStartedAtMs = 0;
    return _updatePosition(0, TpsPlaybackStatus.idle);
  }

  PlayerState seek(int elapsedMs) {
    final nextStatus = status == TpsPlaybackStatus.playing
        ? TpsPlaybackStatus.playing
        : _resolveStatusAfterSeek(status, player.script.totalDurationMs, elapsedMs);
    final state = _updatePosition(elapsedMs, nextStatus);
    if (nextStatus == TpsPlaybackStatus.playing) {
      _playbackOffsetMs = state.elapsedMs;
      _playbackStartedAtMs = _nowMs();
      _clearTimer();
      _scheduleNextTick();
    }
    return state;
  }

  PlayerState advanceBy(int deltaMs) => seek(currentState.elapsedMs + deltaMs);

  PlayerState nextWord() {
    final words = player.script.words;
    if (words.isEmpty) {
      return currentState;
    }

    if (currentState.currentWord == null) {
      return seek(words.first.startMs);
    }

    final nextIndex = math.min(currentState.currentWord!.index + 1, words.length - 1);
    return seek(words[nextIndex].startMs);
  }

  PlayerState previousWord() {
    final words = player.script.words;
    if (words.isEmpty) {
      return currentState;
    }

    final currentWord = currentState.currentWord;
    if (currentWord == null) {
      return seek(0);
    }

    if (currentState.elapsedMs > currentWord.startMs) {
      return seek(currentWord.startMs);
    }

    final previousIndex = math.max(0, currentWord.index - 1);
    return seek(words[previousIndex].startMs);
  }

  PlayerState nextBlock() {
    if (_blocks.isEmpty) {
      return currentState;
    }

    final currentIndex = currentState.currentBlock == null ? -1 : (_blockIndexById[currentState.currentBlock!.id] ?? -1);
    final nextIndex = currentIndex < 0 ? 0 : math.min(currentIndex + 1, _blocks.length - 1);
    return seek(_blocks[nextIndex].startMs);
  }

  PlayerState previousBlock() {
    if (_blocks.isEmpty) {
      return currentState;
    }

    final currentBlock = currentState.currentBlock;
    if (currentBlock == null) {
      return seek(0);
    }

    final currentIndex = _blockIndexById[currentBlock.id] ?? 0;
    if (currentState.elapsedMs > currentBlock.startMs) {
      return seek(currentBlock.startMs);
    }

    final previousIndex = math.max(0, currentIndex - 1);
    return seek(_blocks[previousIndex].startMs);
  }

  TpsPlaybackSnapshot increaseSpeed([int? stepWpm]) => setSpeedOffsetWpm(speedOffsetWpm + (stepWpm ?? speedStepWpm));
  TpsPlaybackSnapshot decreaseSpeed([int? stepWpm]) => setSpeedOffsetWpm(speedOffsetWpm - (stepWpm ?? speedStepWpm));

  TpsPlaybackSnapshot setSpeedOffsetWpm(int offsetWpm) {
    final normalized = _normalizeSpeedOffset(baseWpm, offsetWpm);
    if (normalized == speedOffsetWpm) {
      return snapshot;
    }

    final elapsedMs = status == TpsPlaybackStatus.playing ? _readLiveElapsedMs() : currentState.elapsedMs;
    speedOffsetWpm = normalized;
    final state = _updatePosition(elapsedMs, status);
    if (status == TpsPlaybackStatus.playing) {
      _playbackOffsetMs = state.elapsedMs;
      _playbackStartedAtMs = _nowMs();
      _clearTimer();
      _scheduleNextTick();
    }
    return snapshot;
  }

  TpsPlaybackSnapshot createSnapshot() {
    final visibleWords = (currentState.currentPhrase?.words ?? const <CompiledWord>[])
        .map((word) => _createWordView(word, currentState))
        .toList(growable: false);
    final currentWord = currentState.currentWord;
    final currentSegmentIndex = currentState.currentSegment == null ? -1 : (_segmentIndexById[currentState.currentSegment!.id] ?? -1);
    final currentBlockIndex = currentState.currentBlock == null ? -1 : (_blockIndexById[currentState.currentBlock!.id] ?? -1);
    final currentWordDurationMs = currentWord == null ? null : math.max(1, (currentWord.displayDurationMs / playbackRate).round());
    final currentWordRemainingMs = currentWord == null ? null : math.max(0, ((currentWord.endMs - currentState.elapsedMs) / playbackRate).round());
    return TpsPlaybackSnapshot(
      status: status,
      state: currentState,
      tempo: TpsPlaybackTempo(
        baseWpm: baseWpm,
        effectiveBaseWpm: effectiveBaseWpm,
        speedOffsetWpm: speedOffsetWpm,
        speedStepWpm: speedStepWpm,
        playbackRate: playbackRate,
      ),
      controls: _createControls(currentBlockIndex),
      visibleWords: visibleWords,
      focusedWord: visibleWords.where((view) => view.isActive).cast<TpsPlaybackWordView?>().firstWhere((view) => view != null, orElse: () => null),
      currentWordDurationMs: currentWordDurationMs,
      currentWordRemainingMs: currentWordRemainingMs,
      currentSegmentIndex: currentSegmentIndex,
      currentBlockIndex: currentBlockIndex,
    );
  }

  void dispose() => _clearTimer();

  void _emit(String eventName, Object? event) {
    for (final listener in List<void Function(Object?)>.from(_listeners[eventName] ?? const [])) {
      listener(event);
    }
  }

  void _emitSnapshotChanged() => _emit(TpsPlaybackEventNames.snapshotChanged, createSnapshot());

  int _readLiveElapsedMs() {
    final deltaMs = ((_nowMs() - _playbackStartedAtMs) * playbackRate).round();
    return _clamp(_playbackOffsetMs + deltaMs, 0, player.script.totalDurationMs);
  }

  void _scheduleNextTick() {
    if (status != TpsPlaybackStatus.playing) {
      return;
    }

    _timer = Timer(Duration(milliseconds: tickIntervalMs), () {
      final state = _updatePosition(_readLiveElapsedMs(), TpsPlaybackStatus.playing);
      if (state.isComplete || status != TpsPlaybackStatus.playing) {
        _clearTimer();
        return;
      }
      _scheduleNextTick();
    });
  }

  void _clearTimer() {
    _timer?.cancel();
    _timer = null;
  }

  void _updateStatus(TpsPlaybackStatus nextStatus) {
    final previousStatus = status;
    if (previousStatus == nextStatus) {
      return;
    }
    status = nextStatus;
    if (nextStatus != TpsPlaybackStatus.playing) {
      _playbackOffsetMs = currentState.elapsedMs;
      _playbackStartedAtMs = 0;
    }
    if (nextStatus == TpsPlaybackStatus.completed && previousStatus == TpsPlaybackStatus.playing) {
      _clearTimer();
    }
    _emit(TpsPlaybackEventNames.statusChanged, {
      "state": currentState,
      "previousStatus": previousStatus,
      "status": nextStatus,
    });
  }

  PlayerState _updatePosition(int elapsedMs, TpsPlaybackStatus nextStatus) {
    final previousState = currentState;
    final nextState = player.getState(elapsedMs);
    final previousStatus = status;
    final resolvedStatus = nextStatus == TpsPlaybackStatus.playing && nextState.isComplete
        ? TpsPlaybackStatus.completed
        : nextStatus;
    currentState = nextState;
    _updateStatus(resolvedStatus);
    if (nextState.currentWord?.id != previousState.currentWord?.id) {
      _emit(TpsPlaybackEventNames.wordChanged, {"state": nextState, "previousState": previousState, "status": status});
    }
    if (nextState.currentPhrase?.id != previousState.currentPhrase?.id) {
      _emit(TpsPlaybackEventNames.phraseChanged, {"state": nextState, "previousState": previousState, "status": status});
    }
    if (nextState.currentBlock?.id != previousState.currentBlock?.id) {
      _emit(TpsPlaybackEventNames.blockChanged, {"state": nextState, "previousState": previousState, "status": status});
    }
    if (nextState.currentSegment?.id != previousState.currentSegment?.id) {
      _emit(TpsPlaybackEventNames.segmentChanged, {"state": nextState, "previousState": previousState, "status": status});
    }
    if (nextState.elapsedMs != previousState.elapsedMs || status != previousStatus) {
      _emit(TpsPlaybackEventNames.stateChanged, {"state": nextState, "previousState": previousState, "status": status});
    }
    if (!previousState.isComplete && resolvedStatus == TpsPlaybackStatus.completed) {
      _emit(TpsPlaybackEventNames.completed, {"state": nextState, "previousState": previousState, "status": status});
    }
    _emitSnapshotChanged();
    return nextState;
  }

  TpsPlaybackControls _createControls(int currentBlockIndex) {
    final wordCount = player.script.words.length;
    final currentWordIndex = currentState.currentWordIndex;
    final canRewindCurrentWord = currentState.currentWord != null && currentState.elapsedMs > currentState.currentWord!.startMs;
    final canRewindCurrentBlock = currentState.currentBlock != null && currentState.elapsedMs > currentState.currentBlock!.startMs;
    return TpsPlaybackControls(
      canPlay: status != TpsPlaybackStatus.playing,
      canPause: status == TpsPlaybackStatus.playing,
      canStop: status != TpsPlaybackStatus.idle || currentState.elapsedMs > 0,
      canNextWord: wordCount > 0 && (currentState.currentWord == null || currentWordIndex < wordCount - 1),
      canPreviousWord: wordCount > 0 && (currentWordIndex > 0 || canRewindCurrentWord),
      canNextBlock: _blocks.isNotEmpty && (currentState.currentBlock == null || currentBlockIndex < _blocks.length - 1),
      canPreviousBlock: _blocks.isNotEmpty && (currentBlockIndex > 0 || canRewindCurrentBlock),
      canIncreaseSpeed: effectiveBaseWpm < TpsSpec.maximumWpm,
      canDecreaseSpeed: effectiveBaseWpm > TpsSpec.minimumWpm,
    );
  }
}

class TpsStandalonePlayer {
  TpsStandalonePlayer._({
    required this.ok,
    required this.diagnostics,
    required this.script,
    required this.session,
    this.document,
  });

  factory TpsStandalonePlayer(TpsCompilationResult compilation, [TpsPlaybackSessionOptions options = const TpsPlaybackSessionOptions()]) {
    final player = TpsStandalonePlayer._(
      ok: compilation.ok,
      diagnostics: compilation.diagnostics,
      document: compilation.document,
      script: normalizeCompiledScript(compilation.script),
      session: TpsPlaybackSession(compilation.script, options),
    );
    if (options.autoPlay) {
      player.play();
    }
    return player;
  }

  factory TpsStandalonePlayer.fromCompiledScript(CompiledScript script, [TpsPlaybackSessionOptions options = const TpsPlaybackSessionOptions()]) {
    final normalized = normalizeCompiledScript(script);
    final player = TpsStandalonePlayer._(
      ok: true,
      diagnostics: const [],
      script: normalized,
      session: TpsPlaybackSession(normalized, options),
    );
    if (options.autoPlay) {
      player.play();
    }
    return player;
  }

  factory TpsStandalonePlayer.fromCompiledJson(String json, [TpsPlaybackSessionOptions options = const TpsPlaybackSessionOptions()]) {
    return TpsStandalonePlayer.fromCompiledScript(parseCompiledScriptJson(json), options);
  }

  static TpsStandalonePlayer compile(String source, [TpsPlaybackSessionOptions options = const TpsPlaybackSessionOptions()]) {
    return TpsStandalonePlayer(TpsRuntime.compileTps(source), options);
  }

  final bool ok;
  final List<TpsDiagnostic> diagnostics;
  final TpsDocument? document;
  final CompiledScript script;
  final TpsPlaybackSession session;

  PlayerState get currentState => session.currentState;
  bool get isPlaying => session.isPlaying;
  TpsPlaybackSnapshot get snapshot => session.snapshot;
  TpsPlaybackStatus get status => session.status;

  VoidCallback on(String eventName, void Function(Object?) listener) => session.on(eventName, listener);
  void off(String eventName, void Function(Object?) listener) => session.off(eventName, listener);
  VoidCallback observeSnapshot(void Function(TpsPlaybackSnapshot) listener, [bool emitCurrent = true]) => session.observeSnapshot(listener, emitCurrent);
  VoidCallback onSnapshotChanged(void Function(TpsPlaybackSnapshot) listener) => session.on(TpsPlaybackEventNames.snapshotChanged, (event) => listener(event as TpsPlaybackSnapshot));
  PlayerState play() => session.play();
  PlayerState pause() => session.pause();
  PlayerState stop() => session.stop();
  PlayerState seek(int elapsedMs) => session.seek(elapsedMs);
  PlayerState advanceBy(int deltaMs) => session.advanceBy(deltaMs);
  PlayerState nextWord() => session.nextWord();
  PlayerState previousWord() => session.previousWord();
  PlayerState nextBlock() => session.nextBlock();
  PlayerState previousBlock() => session.previousBlock();
  TpsPlaybackSnapshot increaseSpeed([int? stepWpm]) => session.increaseSpeed(stepWpm);
  TpsPlaybackSnapshot decreaseSpeed([int? stepWpm]) => session.decreaseSpeed(stepWpm);
  TpsPlaybackSnapshot setSpeedOffsetWpm(int offsetWpm) => session.setSpeedOffsetWpm(offsetWpm);
  void dispose() => session.dispose();
}

CompiledScript parseCompiledScriptJson(String json) {
  if (json.trim().isEmpty) {
    throw TypeError();
  }
  final parsed = jsonDecode(json);
  if (parsed is! Map<String, Object?>) {
    throw TypeError();
  }
  return normalizeCompiledScript(_compiledScriptFromJson(parsed));
}

CompiledScript normalizeCompiledScript(CompiledScript script) {
  _validateCompiledScript(script);
  final canonicalWords = script.words.map((word) => _cloneWord(word)).toList(growable: false);
  final wordById = {for (final word in canonicalWords) word.id: word};
  final segments = script.segments.map((segment) => _normalizeSegment(segment, wordById)).toList(growable: false);
  return CompiledScript(
    metadata: Map.unmodifiable(Map<String, String>.from(script.metadata)),
    totalDurationMs: script.totalDurationMs,
    segments: List.unmodifiable(segments),
    words: List.unmodifiable(canonicalWords),
  );
}

class _LineRecord {
  _LineRecord(this.text, this.startOffset);
  final String text;
  final int startOffset;
}

class _ContentSection {
  _ContentSection(this.text, this.startOffset);
  final String text;
  final int startOffset;
}

class _ParsedBlockInternal {
  _ParsedBlockInternal({required this.block});
  TpsBlock block;
  _ContentSection? content;
}

class _ParsedSegmentInternal {
  _ParsedSegmentInternal({
    required this.segment,
    required this.parsedBlocks,
  });

  TpsSegment segment;
  _ContentSection? leadingContent;
  _ContentSection? directContent;
  final List<_ParsedBlockInternal> parsedBlocks;
}

class _DocumentAnalysis {
  _DocumentAnalysis({
    required this.source,
    required this.lineStarts,
    required this.diagnostics,
    required this.document,
    required this.parsedSegments,
  });

  final String source;
  final List<int> lineStarts;
  final List<TpsDiagnostic> diagnostics;
  final TpsDocument document;
  final List<_ParsedSegmentInternal> parsedSegments;
}

class _ParsedHeader {
  _ParsedHeader({
    required this.name,
    this.targetWpm,
    this.emotion,
    this.timing,
    this.speaker,
    this.archetype,
  });
  final String name;
  final int? targetWpm;
  final String? emotion;
  final String? timing;
  final String? speaker;
  final String? archetype;

  _ParsedHeader copyWith({
    String? name,
    int? targetWpm,
    String? emotion,
    String? timing,
    String? speaker,
    String? archetype,
  }) =>
      _ParsedHeader(
        name: name ?? this.name,
        targetWpm: targetWpm ?? this.targetWpm,
        emotion: emotion ?? this.emotion,
        timing: timing ?? this.timing,
        speaker: speaker ?? this.speaker,
        archetype: archetype ?? this.archetype,
      );
}

class _WordSeed {
  _WordSeed({
    required this.kind,
    required this.cleanText,
    required this.characterCount,
    required this.orpPosition,
    required this.displayDurationMs,
    required this.metadata,
  });

  final String kind;
  String cleanText;
  int characterCount;
  int orpPosition;
  final int displayDurationMs;
  final WordMetadata metadata;
}

class _PhraseSeed {
  _PhraseSeed({
    required this.words,
    required this.text,
  });
  final List<_WordSeed> words;
  final String text;
}

class _InheritedFormattingState {
  _InheritedFormattingState({
    required this.targetWpm,
    required this.emotion,
    required this.speedOffsets,
    this.speaker,
    this.archetype,
  });
  final int targetWpm;
  final String emotion;
  final String? speaker;
  final String? archetype;
  final Map<String, int> speedOffsets;
}

class _ContentCompilationResult {
  _ContentCompilationResult({required this.words, required this.phrases});
  final List<_WordSeed> words;
  final List<_PhraseSeed> phrases;
}

class _InlineScope {
  _InlineScope({
    required this.name,
    this.emphasisLevel,
    this.highlight,
    this.inlineEmotion,
    this.volumeLevel,
    this.deliveryMode,
    this.phoneticGuide,
    this.pronunciationGuide,
    this.stressGuide,
    this.stressWrap,
    this.absoluteSpeed,
    this.relativeSpeedMultiplier,
    this.resetSpeed,
    this.articulationStyle,
    this.energyLevel,
    this.melodyLevel,
  });

  final String name;
  final int? emphasisLevel;
  final bool? highlight;
  final String? inlineEmotion;
  final String? volumeLevel;
  final String? deliveryMode;
  final String? phoneticGuide;
  final String? pronunciationGuide;
  final String? stressGuide;
  final bool? stressWrap;
  final int? absoluteSpeed;
  final double? relativeSpeedMultiplier;
  final bool? resetSpeed;
  final String? articulationStyle;
  final int? energyLevel;
  final int? melodyLevel;
}

class _LiteralScope {
  _LiteralScope(this.name);
  final String name;
}

class _TagToken {
  _TagToken({
    required this.raw,
    required this.inner,
    required this.name,
    required this.isClosing,
    this.argument,
  });
  final String raw;
  final String inner;
  final String name;
  final String? argument;
  final bool isClosing;
}

class _ActiveInlineState {
  _ActiveInlineState({
    required this.emotion,
    required this.emphasisLevel,
    required this.highlight,
    required this.stressWrap,
    required this.hasAbsoluteSpeed,
    required this.absoluteSpeed,
    required this.hasRelativeSpeed,
    required this.relativeSpeedMultiplier,
    this.inlineEmotion,
    this.speaker,
    this.volumeLevel,
    this.deliveryMode,
    this.phoneticGuide,
    this.pronunciationGuide,
    this.stressGuide,
    this.articulationStyle,
    this.energyLevel,
    this.melodyLevel,
  });

  final String emotion;
  final String? inlineEmotion;
  final String? speaker;
  final int emphasisLevel;
  final bool highlight;
  final String? volumeLevel;
  final String? deliveryMode;
  final String? phoneticGuide;
  final String? pronunciationGuide;
  final String? stressGuide;
  final bool stressWrap;
  final bool hasAbsoluteSpeed;
  final int absoluteSpeed;
  final bool hasRelativeSpeed;
  final double relativeSpeedMultiplier;
  final String? articulationStyle;
  final int? energyLevel;
  final int? melodyLevel;
}

class _TokenAccumulator {
  final List<String> _stressText = [];
  int emphasisLevel = 0;
  bool isHighlight = false;
  String emotionHint = "";
  String? inlineEmotionHint;
  String? volumeLevel;
  String? deliveryMode;
  String? phoneticGuide;
  String? pronunciationGuide;
  String? stressGuide;
  bool hasAbsoluteSpeed = false;
  int absoluteSpeed = 0;
  bool hasRelativeSpeed = false;
  double relativeSpeedMultiplier = 1;
  String? speaker;
  String? articulationStyle;
  int? energyLevel;
  int? melodyLevel;

  void apply(_ActiveInlineState state, String character) {
    emphasisLevel = math.max(emphasisLevel, state.emphasisLevel);
    isHighlight = isHighlight || state.highlight;
    emotionHint = state.emotion;
    inlineEmotionHint = state.inlineEmotion ?? inlineEmotionHint;
    volumeLevel = state.volumeLevel ?? volumeLevel;
    deliveryMode = state.deliveryMode ?? deliveryMode;
    phoneticGuide = state.phoneticGuide ?? phoneticGuide;
    pronunciationGuide = state.pronunciationGuide ?? pronunciationGuide;
    stressGuide = state.stressGuide ?? stressGuide;
    speaker = state.speaker;
    articulationStyle = state.articulationStyle ?? articulationStyle;
    if (state.energyLevel != null) {
      energyLevel = state.energyLevel;
    }
    if (state.melodyLevel != null) {
      melodyLevel = state.melodyLevel;
    }
    if (state.stressWrap) {
      _stressText.add(character);
    }
    if (!_isWhitespace(character) && !_isStandalonePunctuationToken(character)) {
      hasAbsoluteSpeed = state.hasAbsoluteSpeed;
      absoluteSpeed = state.absoluteSpeed;
      hasRelativeSpeed = state.hasRelativeSpeed;
      relativeSpeedMultiplier = state.relativeSpeedMultiplier;
    }
  }

  WordMetadata buildWordMetadata(int inheritedWpm) {
    final metadata = WordMetadata(
      isEmphasis: emphasisLevel > 0,
      emphasisLevel: emphasisLevel,
      isPause: false,
      isHighlight: isHighlight,
      isBreath: false,
      isEditPoint: false,
      emotionHint: emotionHint,
      inlineEmotionHint: inlineEmotionHint,
      volumeLevel: volumeLevel,
      deliveryMode: deliveryMode,
      phoneticGuide: phoneticGuide,
      pronunciationGuide: pronunciationGuide,
      stressText: _stressText.isEmpty ? null : _stressText.join(),
      stressGuide: stressGuide,
      speaker: speaker,
      headCue: TpsSpec.emotionHeadCues[(emotionHint.isEmpty ? TpsSpec.defaultEmotion : emotionHint)],
      articulationStyle: articulationStyle,
      energyLevel: energyLevel,
      melodyLevel: melodyLevel,
    );
    if (hasAbsoluteSpeed) {
      final effectiveWpm = hasRelativeSpeed ? math.max(1, (absoluteSpeed * relativeSpeedMultiplier).round()) : absoluteSpeed;
      if (effectiveWpm != inheritedWpm) {
        return metadata.copyWith(speedOverride: effectiveWpm);
      }
    } else if (hasRelativeSpeed && (relativeSpeedMultiplier - 1).abs() > 0.0001) {
      return metadata.copyWith(speedMultiplier: relativeSpeedMultiplier);
    }
    return metadata;
  }
}

_DocumentAnalysis _parseDocument(String source) {
  final normalized = _normalizeLineEndings(source);
  final lineStarts = _createLineStarts(normalized);
  final diagnostics = <TpsDiagnostic>[];
  final frontMatter = _extractFrontMatter(normalized, lineStarts, diagnostics);
  final titled = _extractTitleHeader(frontMatter.body, frontMatter.bodyStartOffset, frontMatter.metadata);
  final parsedSegments = _parseSegments(titled.body, titled.startOffset, frontMatter.metadata, lineStarts, diagnostics);
  final document = TpsDocument(
    metadata: Map.unmodifiable(frontMatter.metadata),
    segments: List.unmodifiable(parsedSegments.map((entry) => entry.segment)),
  );
  return _DocumentAnalysis(
    source: normalized,
    lineStarts: lineStarts,
    diagnostics: diagnostics,
    document: document,
    parsedSegments: parsedSegments,
  );
}

CompiledScript _compileAnalysis(_DocumentAnalysis analysis) {
  final baseWpm = _resolveBaseWpm(analysis.document.metadata);
  final speedOffsets = _resolveSpeedOffsets(analysis.document.metadata);
  final candidates = analysis.parsedSegments.map((segment) => _compileSegment(segment, baseWpm, speedOffsets, analysis)).toList(growable: false);
  return _finalizeScript(analysis.document.metadata, candidates);
}

class _FrontMatterExtraction {
  _FrontMatterExtraction(this.metadata, this.body, this.bodyStartOffset);
  final Map<String, String> metadata;
  final String body;
  final int bodyStartOffset;
}

class _BodyExtraction {
  _BodyExtraction(this.body, this.startOffset);
  final String body;
  final int startOffset;
}

class _SegmentCandidate {
  _SegmentCandidate(this.segment, this.blocks);
  final CompiledSegment segment;
  final List<_BlockCandidate> blocks;
}

class _BlockCandidate {
  _BlockCandidate(this.block, this.content);
  final CompiledBlock block;
  final _ContentCompilationResult content;
}

_FrontMatterExtraction _extractFrontMatter(String source, List<int> lineStarts, List<TpsDiagnostic> diagnostics) {
  if (!source.startsWith("---\n")) {
    return _FrontMatterExtraction({}, source, 0);
  }
  final closing = _findFrontMatterClosing(source);
  if (closing == null) {
    diagnostics.add(_createDiagnostic(
      TpsDiagnosticCodes.invalidFrontMatter,
      "Front matter must be closed by a terminating --- line.",
      0,
      math.min(source.length, 3),
      lineStarts,
    ));
    return _FrontMatterExtraction({}, source, 0);
  }
  final metadata = _parseMetadata(source.substring(4, closing.$1), 4, lineStarts, diagnostics);
  return _FrontMatterExtraction(metadata, source.substring(closing.$1 + closing.$2), closing.$1 + closing.$2);
}

Map<String, String> _parseMetadata(String frontMatterText, int startOffset, List<int> lineStarts, List<TpsDiagnostic> diagnostics) {
  final metadata = <String, String>{};
  String? currentSection;
  var lineOffset = startOffset;
  for (final rawLine in frontMatterText.split("\n")) {
    final entryStart = lineOffset;
    final entryEnd = lineOffset + rawLine.length;
    lineOffset = entryEnd + 1;
    if (rawLine.trim().isEmpty || rawLine.trimLeft().startsWith("#")) {
      continue;
    }
    final indentation = rawLine.length - rawLine.trimLeft().length;
    final line = rawLine.trim();
    final separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      continue;
    }
    final key = line.substring(0, separatorIndex).trim();
    final value = _normalizeMetadataValue(line.substring(separatorIndex + 1));
    if (indentation > 0 && currentSection != null) {
      final compositeKey = "$currentSection.$key";
      metadata[compositeKey] = value;
      _validateMetadataEntry(compositeKey, value, entryStart, entryEnd, lineStarts, diagnostics);
      continue;
    }
    currentSection = value.isEmpty ? key : null;
    if (value.isNotEmpty) {
      metadata[key] = value;
      _validateMetadataEntry(key, value, entryStart, entryEnd, lineStarts, diagnostics);
    }
  }
  return metadata;
}

_BodyExtraction _extractTitleHeader(String body, int bodyStartOffset, Map<String, String> metadata) {
  final lines = _splitLines(body, bodyStartOffset);
  for (final line in lines) {
    if (line.text.trim().isEmpty) {
      continue;
    }
    final trimmed = line.text.trim();
    if (!trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      break;
    }
    metadata[TpsFrontMatterKeys.title] = trimmed.substring(2).trim();
    final consumedLength = line.startOffset - bodyStartOffset + line.text.length;
    final trailingNewlineLength = consumedLength < body.length && body[consumedLength] == "\n" ? 1 : 0;
    final bodyOffset = consumedLength + trailingNewlineLength;
    return _BodyExtraction(body.substring(bodyOffset), bodyStartOffset + bodyOffset);
  }
  return _BodyExtraction(body, bodyStartOffset);
}

List<_ParsedSegmentInternal> _parseSegments(
  String body,
  int bodyStartOffset,
  Map<String, String> metadata,
  List<int> lineStarts,
  List<TpsDiagnostic> diagnostics,
) {
  final lines = _splitLines(body, bodyStartOffset);
  final segments = <_ParsedSegmentInternal>[];
  final preamble = <_LineRecord>[];
  _ParsedSegmentInternal? current;
  _ParsedBlockInternal? currentBlock;
  var segmentLeading = <_LineRecord>[];
  var blockLines = <_LineRecord>[];

  for (final line in lines) {
    final segmentHeader = _tryParseHeader(line, "segment", lineStarts, diagnostics);
    if (segmentHeader != null) {
      _finalizeParsedBlock(current, currentBlock, blockLines);
      _finalizeSegment(segments, current, segmentLeading);
      current = _createSegment(segmentHeader, metadata, segments.length + 1);
      currentBlock = null;
      if (preamble.isNotEmpty) {
        segmentLeading = List<_LineRecord>.from(preamble);
        preamble.clear();
      }
      continue;
    }
    final blockHeader = _tryParseHeader(line, "block", lineStarts, diagnostics);
    if (blockHeader != null) {
      current ??= _createImplicitSegment(metadata, segments.length + 1);
      if (preamble.isNotEmpty) {
        segmentLeading = List<_LineRecord>.from(preamble);
        preamble.clear();
      }
      _finalizeParsedBlock(current, currentBlock, blockLines);
      currentBlock = _createBlock(blockHeader, current.parsedBlocks.length + 1, current.segment.id);
      blockLines = [];
      continue;
    }
    if (currentBlock != null) {
      blockLines.add(line);
    } else if (current != null) {
      segmentLeading.add(line);
    } else {
      preamble.add(line);
    }
  }

  if (current == null) {
    final implicit = _createImplicitSegment(metadata, 1);
    implicit.directContent = _createContentSection(preamble);
    return [implicit];
  }

  _finalizeParsedBlock(current, currentBlock, blockLines);
  _finalizeSegment(segments, current, segmentLeading);
  return segments;
}

_ParsedHeader? _tryParseHeader(_LineRecord line, String level, List<int> lineStarts, List<TpsDiagnostic> diagnostics) {
  final hashPrefix = level == "segment" ? "##" : "###";
  final trimmedStart = line.text.trimLeft();
  if (!trimmedStart.startsWith(hashPrefix)) {
    return null;
  }
  final afterHashes = trimmedStart.substring(hashPrefix.length);
  if (afterHashes.isNotEmpty && !afterHashes.startsWith(" ")) {
    return null;
  }
  final headerContent = afterHashes.trim();
  if (headerContent.isEmpty) {
    diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidHeader, "Header cannot be empty.", line.startOffset, line.startOffset + line.text.length, lineStarts));
    return null;
  }
  if (!headerContent.startsWith("[") || !headerContent.endsWith("]")) {
    return _ParsedHeader(name: headerContent);
  }
  return _parseBracketHeader(headerContent.substring(1, headerContent.length - 1), line.startOffset + line.text.indexOf("[") + 1, lineStarts, diagnostics);
}

_ParsedHeader? _parseBracketHeader(String headerContent, int contentOffset, List<int> lineStarts, List<TpsDiagnostic> diagnostics) {
  final parts = _splitHeaderPartsDetailed(headerContent);
  if (parts.isEmpty || parts.first.value.isEmpty) {
    diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidHeader, "Header name is required.", contentOffset, contentOffset + headerContent.length, lineStarts));
    return null;
  }
  var parsed = _ParsedHeader(name: parts.first.value);
  for (final part in parts.skip(1)) {
    final normalized = _normalizeValue(part.value);
    if (normalized == null) {
      continue;
    }
    final tokenStart = contentOffset + part.start;
    final tokenEnd = contentOffset + part.end;
    if (normalized.toLowerCase().startsWith(TpsSpec.speakerPrefix.toLowerCase())) {
      parsed = parsed.copyWith(speaker: _normalizeValue(normalized.substring(TpsSpec.speakerPrefix.length)));
      continue;
    }
    if (normalized.toLowerCase().startsWith(TpsSpec.archetypePrefix.toLowerCase())) {
      final archetypeValue = _normalizeValue(normalized.substring(TpsSpec.archetypePrefix.length));
      if (archetypeValue != null && TpsSpec.archetypes.contains(archetypeValue.toLowerCase())) {
        parsed = parsed.copyWith(archetype: archetypeValue.toLowerCase());
      } else {
        diagnostics.add(_createDiagnostic(
          TpsDiagnosticCodes.unknownArchetype,
          "Archetype '${archetypeValue ?? ""}' is not a known vocal archetype.",
          tokenStart,
          tokenEnd,
          lineStarts,
          "Use one of: ${TpsSpec.archetypes.join(", ")}.",
        ));
      }
      continue;
    }
    if (_isTimingToken(normalized)) {
      parsed = parsed.copyWith(timing: normalized);
      continue;
    }
    final appliedWpm = _applyHeaderWpm(parsed, normalized, tokenStart, tokenEnd, lineStarts, diagnostics);
    if (appliedWpm != null) {
      parsed = appliedWpm;
      continue;
    }
    if (_isKnownEmotion(normalized)) {
      parsed = parsed.copyWith(emotion: normalized.toLowerCase());
      continue;
    }
    diagnostics.add(_createDiagnostic(
      TpsDiagnosticCodes.invalidHeaderParameter,
      "Header parameter '$normalized' is not a known TPS header token.",
      tokenStart,
      tokenEnd,
      lineStarts,
      "Use a speaker, emotion, timing, or WPM value.",
    ));
  }
  return parsed;
}

_ParsedHeader? _applyHeaderWpm(_ParsedHeader parsed, String token, int start, int end, List<int> lineStarts, List<TpsDiagnostic> diagnostics) {
  final normalized = token.replaceAll(RegExp(r"\s+"), "");
  if (!RegExp(r"^\d+(wpm)?$", caseSensitive: false).hasMatch(normalized)) {
    return null;
  }
  final candidate = normalized.toLowerCase().endsWith(TpsSpec.wpmSuffix.toLowerCase())
      ? int.parse(normalized.substring(0, normalized.length - TpsSpec.wpmSuffix.length))
      : int.parse(normalized);
  if (_isInvalidWpm(candidate)) {
    diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidWpm, _buildInvalidWpmMessage(token), start, end, lineStarts));
    return parsed;
  }
  return parsed.copyWith(targetWpm: candidate);
}

_ParsedSegmentInternal _createSegment(_ParsedHeader header, Map<String, String> metadata, int index) {
  final emotion = _resolveEmotion(header.emotion);
  final palette = _resolvePalette(emotion);
  final archetypeWpm = _resolveArchetypeWpm(header.archetype);
  return _ParsedSegmentInternal(
    segment: TpsSegment(
      id: "segment-$index",
      name: header.name,
      content: "",
      targetWpm: header.targetWpm ?? archetypeWpm ?? _resolveBaseWpm(metadata),
      emotion: emotion,
      speaker: header.speaker,
      archetype: header.archetype,
      timing: header.timing,
      backgroundColor: palette["background"],
      textColor: palette["text"],
      accentColor: palette["accent"],
      blocks: const [],
    ),
    parsedBlocks: [],
  );
}

_ParsedSegmentInternal _createImplicitSegment(Map<String, String> metadata, int index) {
  return _createSegment(
    _ParsedHeader(
      name: metadata[TpsFrontMatterKeys.title] ?? TpsSpec.defaultImplicitSegmentName,
      targetWpm: _resolveBaseWpm(metadata),
      emotion: TpsSpec.defaultEmotion,
    ),
    metadata,
    index,
  );
}

_ParsedBlockInternal _createBlock(_ParsedHeader header, int blockIndex, String segmentId) {
  return _ParsedBlockInternal(
    block: TpsBlock(
      id: "$segmentId-block-$blockIndex",
      name: header.name,
      content: "",
      targetWpm: header.targetWpm,
      emotion: header.emotion,
      speaker: header.speaker,
      archetype: header.archetype,
    ),
  );
}

void _finalizeParsedBlock(_ParsedSegmentInternal? current, _ParsedBlockInternal? block, List<_LineRecord> lines) {
  if (current == null || block == null) {
    return;
  }
  block.content = _createContentSection(lines);
  block.block = TpsBlock(
    id: block.block.id,
    name: block.block.name,
    content: block.content?.text ?? "",
    targetWpm: block.block.targetWpm,
    emotion: block.block.emotion,
    speaker: block.block.speaker,
    archetype: block.block.archetype,
  );
  current.parsedBlocks.add(block);
}

void _finalizeSegment(List<_ParsedSegmentInternal> target, _ParsedSegmentInternal? segment, List<_LineRecord> lines) {
  if (segment == null) {
    return;
  }
  segment.leadingContent = _createContentSection(lines);
  final blocks = List<TpsBlock>.from(segment.parsedBlocks.map((entry) => entry.block), growable: false);
  final content = segment.parsedBlocks.isEmpty ? (segment.leadingContent?.text ?? "") : "";
  segment.segment = TpsSegment(
    id: segment.segment.id,
    name: segment.segment.name,
    content: content,
    targetWpm: segment.segment.targetWpm,
    emotion: segment.segment.emotion,
    speaker: segment.segment.speaker,
    archetype: segment.segment.archetype,
    timing: segment.segment.timing,
    backgroundColor: segment.segment.backgroundColor,
    textColor: segment.segment.textColor,
    accentColor: segment.segment.accentColor,
    leadingContent: segment.leadingContent?.text,
    blocks: blocks,
  );
  if (segment.parsedBlocks.isEmpty) {
    segment.directContent = segment.leadingContent;
  }
  target.add(segment);
}

_ContentSection? _createContentSection(List<_LineRecord> lines) {
  if (lines.isEmpty) {
    return null;
  }
  return _ContentSection(lines.map((line) => line.text).join("\n"), lines.first.startOffset);
}

List<_LineRecord> _splitLines(String text, int startOffset) {
  if (text.isEmpty) {
    return const [];
  }
  final records = <_LineRecord>[];
  var lineStart = startOffset;
  for (final line in text.split("\n")) {
    records.add(_LineRecord(line, lineStart));
    lineStart += line.length + 1;
  }
  if (text.endsWith("\n")) {
    records.removeLast();
  }
  return records;
}

_SegmentCandidate _compileSegment(_ParsedSegmentInternal parsedSegment, int baseWpm, Map<String, int> speedOffsets, _DocumentAnalysis analysis) {
  final segmentEmotion = _resolveEmotion(parsedSegment.segment.emotion);
  final inherited = _InheritedFormattingState(
    targetWpm: parsedSegment.segment.targetWpm!,
    emotion: segmentEmotion,
    speaker: parsedSegment.segment.speaker,
    archetype: parsedSegment.segment.archetype,
    speedOffsets: speedOffsets,
  );
  final blocks = _buildBlocks(parsedSegment).map((entry) => _compileBlock(entry, inherited, analysis)).toList(growable: false);
  return _SegmentCandidate(
    CompiledSegment(
      id: parsedSegment.segment.id,
      name: parsedSegment.segment.name,
      targetWpm: inherited.targetWpm,
      emotion: segmentEmotion,
      speaker: parsedSegment.segment.speaker,
      archetype: parsedSegment.segment.archetype,
      timing: parsedSegment.segment.timing,
      backgroundColor: parsedSegment.segment.backgroundColor!,
      textColor: parsedSegment.segment.textColor!,
      accentColor: parsedSegment.segment.accentColor!,
      startWordIndex: 0,
      endWordIndex: 0,
      startMs: 0,
      endMs: 0,
      blocks: const [],
      words: const [],
    ),
    blocks,
  );
}

List<({TpsBlock block, bool isImplicit, _ContentSection? content})> _buildBlocks(_ParsedSegmentInternal parsedSegment) {
  final blocks = <({TpsBlock block, bool isImplicit, _ContentSection? content})>[];
  if (parsedSegment.leadingContent?.text.isNotEmpty == true && parsedSegment.parsedBlocks.isNotEmpty) {
    blocks.add((
      block: TpsBlock(
        id: "${parsedSegment.segment.id}-implicit-lead",
        name: "${parsedSegment.segment.name} Lead",
        content: parsedSegment.leadingContent!.text,
        targetWpm: parsedSegment.segment.targetWpm,
        emotion: parsedSegment.segment.emotion,
        speaker: parsedSegment.segment.speaker,
        archetype: parsedSegment.segment.archetype,
      ),
      isImplicit: true,
      content: parsedSegment.leadingContent,
    ));
  }
  if (parsedSegment.parsedBlocks.isEmpty) {
    blocks.add((
      block: TpsBlock(
        id: "${parsedSegment.segment.id}-implicit-body",
        name: parsedSegment.segment.name,
        content: parsedSegment.directContent?.text ?? "",
        targetWpm: parsedSegment.segment.targetWpm,
        emotion: parsedSegment.segment.emotion,
        speaker: parsedSegment.segment.speaker,
        archetype: parsedSegment.segment.archetype,
      ),
      isImplicit: true,
      content: parsedSegment.directContent,
    ));
  }
  for (final parsedBlock in parsedSegment.parsedBlocks) {
    blocks.add((block: parsedBlock.block, isImplicit: false, content: parsedBlock.content));
  }
  return blocks;
}

_BlockCandidate _compileBlock(({TpsBlock block, bool isImplicit, _ContentSection? content}) entry, _InheritedFormattingState inherited, _DocumentAnalysis analysis) {
  final resolvedArchetype = entry.block.archetype ?? inherited.archetype;
  final blockWpm = entry.block.targetWpm ?? _resolveArchetypeWpm(resolvedArchetype) ?? inherited.targetWpm;
  final blockInherited = _InheritedFormattingState(
    targetWpm: blockWpm,
    emotion: _resolveEmotion(entry.block.emotion, inherited.emotion),
    speaker: entry.block.speaker ?? inherited.speaker,
    archetype: resolvedArchetype,
    speedOffsets: inherited.speedOffsets,
  );
  final content = _compileContent(entry.content?.text ?? "", entry.content?.startOffset ?? 0, blockInherited, analysis.lineStarts, analysis.diagnostics);
  return _BlockCandidate(
    CompiledBlock(
      id: entry.block.id,
      name: entry.block.name,
      targetWpm: blockInherited.targetWpm,
      emotion: blockInherited.emotion,
      speaker: blockInherited.speaker,
      archetype: resolvedArchetype,
      isImplicit: entry.isImplicit,
      startWordIndex: 0,
      endWordIndex: 0,
      startMs: 0,
      endMs: 0,
      phrases: const [],
      words: const [],
    ),
    content,
  );
}

CompiledScript _finalizeScript(Map<String, String> metadata, List<_SegmentCandidate> candidates) {
  final segments = <CompiledSegment>[];
  final scriptWords = <CompiledWord>[];
  var elapsedMs = 0;
  var wordIndex = 0;

  for (final candidate in candidates) {
    final segmentWords = <CompiledWord>[];
    final compiledBlocks = <CompiledBlock>[];
    for (final blockCandidate in candidate.blocks) {
      final finalized = _finalizeCompiledBlock(blockCandidate.block, blockCandidate.content.words, blockCandidate.content.phrases, candidate.segment.id, elapsedMs, wordIndex);
      compiledBlocks.add(finalized.block);
      segmentWords.addAll(finalized.words);
      scriptWords.addAll(finalized.words);
      elapsedMs = finalized.elapsedMs;
      wordIndex = finalized.nextWordIndex;
    }
    segments.add(_finalizeSegmentRange(candidate.segment, compiledBlocks, segmentWords));
  }

  return CompiledScript(
    metadata: Map.unmodifiable(Map<String, String>.from(metadata)),
    totalDurationMs: elapsedMs,
    segments: List.unmodifiable(segments),
    words: List.unmodifiable(scriptWords),
  );
}

({CompiledBlock block, List<CompiledWord> words, List<CompiledPhrase> phrases, int elapsedMs, int nextWordIndex}) _finalizeCompiledBlock(
  CompiledBlock block,
  List<_WordSeed> seeds,
  List<_PhraseSeed> phraseSeeds,
  String segmentId,
  int elapsedMs,
  int wordIndex,
) {
  final wordMap = <_WordSeed, CompiledWord>{};
  final words = <CompiledWord>[];
  for (final seed in seeds) {
    final compiledWord = CompiledWord(
      id: "word-${wordIndex + 1}",
      index: wordIndex,
      kind: seed.kind,
      cleanText: seed.cleanText,
      characterCount: seed.characterCount,
      orpPosition: seed.orpPosition,
      displayDurationMs: seed.displayDurationMs,
      startMs: elapsedMs,
      endMs: elapsedMs + seed.displayDurationMs,
      metadata: seed.metadata,
      segmentId: segmentId,
      blockId: block.id,
      phraseId: "",
    );
    wordMap[seed] = compiledWord;
    words.add(compiledWord);
    elapsedMs = compiledWord.endMs;
    wordIndex += 1;
  }
  final phrases = <CompiledPhrase>[];
  for (var index = 0; index < phraseSeeds.length; index += 1) {
    final seed = phraseSeeds[index];
    final phraseWords = seed.words.map((word) => wordMap[word]).whereType<CompiledWord>().toList(growable: false);
    if (phraseWords.isEmpty) {
      phrases.add(CompiledPhrase(
        id: "${block.id}-phrase-${index + 1}",
        text: seed.text,
        startWordIndex: 0,
        endWordIndex: 0,
        startMs: 0,
        endMs: 0,
        words: const [],
      ));
      continue;
    }
    final phrase = CompiledPhrase(
      id: "${block.id}-phrase-${index + 1}",
      text: seed.text,
      startWordIndex: phraseWords.first.index,
      endWordIndex: phraseWords.last.index,
      startMs: phraseWords.first.startMs,
      endMs: phraseWords.last.endMs,
      words: phraseWords.map((word) => word.copyWith(phraseId: "${block.id}-phrase-${index + 1}")).toList(growable: false),
    );
    phrases.add(phrase);
  }
  final phraseWordById = {
    for (final phrase in phrases)
      for (final word in phrase.words) word.id: word,
  };
  final canonicalWords = words.map((word) => phraseWordById[word.id] ?? word).toList(growable: false);
  final canonicalPhrases = phrases
      .map((phrase) => CompiledPhrase(
            id: phrase.id,
            text: phrase.text,
            startWordIndex: phrase.startWordIndex,
            endWordIndex: phrase.endWordIndex,
            startMs: phrase.startMs,
            endMs: phrase.endMs,
            words: phrase.words.map((word) => phraseWordById[word.id]!).toList(growable: false),
          ))
      .toList(growable: false);
  final rangedBlock = _withRangeForBlock(block, canonicalWords, canonicalPhrases);
  return (block: rangedBlock, words: canonicalWords, phrases: canonicalPhrases, elapsedMs: elapsedMs, nextWordIndex: wordIndex);
}

CompiledBlock _withRangeForBlock(CompiledBlock block, List<CompiledWord> words, List<CompiledPhrase> phrases) {
  final startWordIndex = words.isEmpty ? 0 : words.first.index;
  final endWordIndex = words.isEmpty ? 0 : words.last.index;
  final startMs = words.isEmpty ? 0 : words.first.startMs;
  final endMs = words.isEmpty ? 0 : words.last.endMs;
  return CompiledBlock(
    id: block.id,
    name: block.name,
    targetWpm: block.targetWpm,
    emotion: block.emotion,
    speaker: block.speaker,
    archetype: block.archetype,
    isImplicit: block.isImplicit,
    startWordIndex: startWordIndex,
    endWordIndex: endWordIndex,
    startMs: startMs,
    endMs: endMs,
    phrases: List.unmodifiable(phrases),
    words: List.unmodifiable(words),
  );
}

CompiledSegment _finalizeSegmentRange(CompiledSegment segment, List<CompiledBlock> blocks, List<CompiledWord> words) {
  final startWordIndex = words.isEmpty ? 0 : words.first.index;
  final endWordIndex = words.isEmpty ? 0 : words.last.index;
  final startMs = words.isEmpty ? 0 : words.first.startMs;
  final endMs = words.isEmpty ? 0 : words.last.endMs;
  return CompiledSegment(
    id: segment.id,
    name: segment.name,
    targetWpm: segment.targetWpm,
    emotion: segment.emotion,
    speaker: segment.speaker,
    archetype: segment.archetype,
    timing: segment.timing,
    backgroundColor: segment.backgroundColor,
    textColor: segment.textColor,
    accentColor: segment.accentColor,
    startWordIndex: startWordIndex,
    endWordIndex: endWordIndex,
    startMs: startMs,
    endMs: endMs,
    blocks: List.unmodifiable(blocks),
    words: List.unmodifiable(words),
  );
}

_ContentCompilationResult _compileContent(
  String rawText,
  int startOffset,
  _InheritedFormattingState inherited,
  List<int> lineStarts,
  List<TpsDiagnostic> diagnostics,
) {
  final protectedText = _protectEscapes(rawText);
  final words = <_WordSeed>[];
  final phrases = <_PhraseSeed>[];
  final currentPhrase = <_WordSeed>[];
  final scopes = <_InlineScope>[];
  final literalScopes = <_LiteralScope>[];
  var builder = "";
  _TokenAccumulator? token;

  for (var index = 0; index < protectedText.length; index += 1) {
    final character = protectedText[index];
    if (_tryHandleMarkdownMarker(protectedText, index, scopes)) {
      final finalized = _finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
      builder = finalized.$1;
      token = finalized.$2;
      if (index + 1 < protectedText.length && protectedText[index + 1] == "*") {
        index += 1;
      }
      continue;
    }
    if (character == "[") {
      final tag = _readTagToken(protectedText, index);
      if (tag == null) {
        diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.unterminatedTag, "Tag is missing a closing ] bracket.", startOffset + index, startOffset + protectedText.length, lineStarts));
        final appended = _appendLiteral(protectedText.substring(index), scopes, inherited, builder, token);
        builder = appended.$1;
        token = appended.$2;
        break;
      }
      if (_requiresTokenBoundary(tag.name)) {
        final finalized = _finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
        builder = finalized.$1;
        token = finalized.$2;
      }
      if (_handleTagToken(tag, literalScopes, scopes, words, phrases, currentPhrase, inherited, startOffset + index, lineStarts, diagnostics)) {
        index += tag.raw.length - 1;
        continue;
      }
      final appended = _appendLiteral(tag.raw, scopes, inherited, builder, token);
      builder = appended.$1;
      token = appended.$2;
      index += tag.raw.length - 1;
      continue;
    }
    if (_tryHandleSlashPause(protectedText, index, builder, token)) {
      final finalized = _finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
      builder = finalized.$1;
      token = finalized.$2;
      _flushPhrase(phrases, currentPhrase);
      words.add(_createControlWord("pause", inherited, protectedText.substring(index).startsWith("//") ? TpsSpec.mediumPauseDurationMs : TpsSpec.shortPauseDurationMs));
      if (index + 1 < protectedText.length && protectedText[index + 1] == "/") {
        index += 1;
      }
      continue;
    }
    if (_isWhitespace(character)) {
      final finalized = _finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
      builder = finalized.$1;
      token = finalized.$2;
      continue;
    }
    final appended = _appendCharacter(character, scopes, inherited, builder, token);
    builder = appended.$1;
    token = appended.$2;
  }
  final finalized = _finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
  builder = finalized.$1;
  token = finalized.$2;
  _flushPhrase(phrases, currentPhrase);
  for (final scope in scopes) {
    diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.unclosedTag, "Tag '${scope.name}' was opened but never closed.", startOffset + rawText.length, startOffset + rawText.length, lineStarts));
  }
  return _ContentCompilationResult(words: words, phrases: phrases);
}

bool _handleTagToken(
  _TagToken tag,
  List<_LiteralScope> literalScopes,
  List<_InlineScope> scopes,
  List<_WordSeed> words,
  List<_PhraseSeed> phrases,
  List<_WordSeed> currentPhrase,
  _InheritedFormattingState inherited,
  int absoluteOffset,
  List<int> lineStarts,
  List<TpsDiagnostic> diagnostics,
) {
  if (tag.isClosing) {
    return _handleClosingTag(tag, literalScopes, scopes, absoluteOffset, lineStarts, diagnostics);
  }
  if (tag.name == TpsTags.pause) {
    final pauseDuration = _tryResolvePauseMilliseconds(tag.argument);
    if (pauseDuration == null) {
      diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidPause, "Pause duration must use Ns or Nms syntax.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
      return false;
    }
    _flushPhrase(phrases, currentPhrase);
    words.add(_createControlWord("pause", inherited, pauseDuration));
    return true;
  }
  if (tag.name == TpsTags.breath) {
    words.add(_createControlWord("breath", inherited));
    return true;
  }
  if (tag.name == TpsTags.editPoint) {
    if (tag.argument != null && !TpsSpec.editPointPriorities.contains(tag.argument)) {
      diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidTagArgument, "Edit point priority '${tag.argument}' is not supported.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
      return false;
    }
    words.add(_createControlWord("edit-point", inherited, null, tag.argument));
    return true;
  }
  final scope = _createScope(tag, inherited.speedOffsets, absoluteOffset, lineStarts, diagnostics);
  if (scope == null) {
    if (_isPairedScope(tag.name)) {
      literalScopes.add(_LiteralScope(tag.name));
    }
    return false;
  }
  scopes.add(scope);
  return true;
}

bool _handleClosingTag(
  _TagToken tag,
  List<_LiteralScope> literalScopes,
  List<_InlineScope> scopes,
  int absoluteOffset,
  List<int> lineStarts,
  List<TpsDiagnostic> diagnostics,
) {
  final literalIndex = literalScopes.lastIndexWhere((scope) => scope.name == tag.name);
  if (literalIndex >= 0) {
    literalScopes.removeAt(literalIndex);
    return false;
  }
  final scopeIndex = scopes.lastIndexWhere((scope) => scope.name == tag.name);
  if (scopeIndex < 0) {
    diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.mismatchedClosingTag, "Closing tag '${tag.name}' does not match any open scope.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
    return false;
  }
  scopes.removeAt(scopeIndex);
  return true;
}

_InlineScope? _createScope(_TagToken tag, Map<String, int> speedOffsets, int absoluteOffset, List<int> lineStarts, List<TpsDiagnostic> diagnostics) {
  if (tag.name == TpsTags.phonetic || tag.name == TpsTags.pronunciation) {
    if (tag.argument == null) {
      diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidTagArgument, "Tag '${tag.name}' requires a pronunciation parameter.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
      return null;
    }
    return _InlineScope(name: tag.name, phoneticGuide: tag.name == TpsTags.phonetic ? tag.argument : null, pronunciationGuide: tag.name == TpsTags.pronunciation ? tag.argument : null);
  }
  if (tag.name == TpsTags.stress) {
    return _InlineScope(name: tag.name, stressGuide: tag.argument, stressWrap: tag.argument == null);
  }
  if (tag.name == TpsTags.emphasis) {
    return _InlineScope(name: tag.name, emphasisLevel: 1);
  }
  if (tag.name == TpsTags.highlight) {
    return _InlineScope(name: tag.name, highlight: true);
  }
  if (TpsSpec.volumeLevels.contains(tag.name)) {
    return _InlineScope(name: tag.name, volumeLevel: tag.name);
  }
  if (TpsSpec.deliveryModes.contains(tag.name)) {
    return _InlineScope(name: tag.name, deliveryMode: tag.name);
  }
  if (TpsSpec.articulationStyles.contains(tag.name)) {
    return _InlineScope(name: tag.name, articulationStyle: tag.name);
  }
  if (tag.name == TpsTags.energy) {
    final level = int.tryParse(tag.argument ?? "");
    if (level == null || level < TpsSpec.energyLevelMin || level > TpsSpec.energyLevelMax) {
      diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidEnergyLevel, "Energy level must be an integer between ${TpsSpec.energyLevelMin} and ${TpsSpec.energyLevelMax}.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
      return null;
    }
    return _InlineScope(name: tag.name, energyLevel: level);
  }
  if (tag.name == TpsTags.melody) {
    final level = int.tryParse(tag.argument ?? "");
    if (level == null || level < TpsSpec.melodyLevelMin || level > TpsSpec.melodyLevelMax) {
      diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidMelodyLevel, "Melody level must be an integer between ${TpsSpec.melodyLevelMin} and ${TpsSpec.melodyLevelMax}.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
      return null;
    }
    return _InlineScope(name: tag.name, melodyLevel: level);
  }
  if (TpsSpec.emotions.contains(tag.name)) {
    return _InlineScope(name: tag.name, inlineEmotion: tag.name);
  }
  final absoluteSpeed = _tryParseAbsoluteWpm(tag.name);
  if (absoluteSpeed != null) {
    return _InlineScope(name: tag.name, absoluteSpeed: absoluteSpeed);
  }
  final multiplier = _resolveSpeedMultiplier(tag.name, speedOffsets);
  if (multiplier != null) {
    return _InlineScope(name: tag.name, relativeSpeedMultiplier: multiplier);
  }
  if (tag.name == TpsTags.normal) {
    return _InlineScope(name: tag.name, resetSpeed: true);
  }
  diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.unknownTag, "Tag '${tag.name}' is not part of the TPS specification.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
  return null;
}

bool _tryHandleMarkdownMarker(String text, int index, List<_InlineScope> scopes) {
  if (text[index] != "*") {
    return false;
  }
  final markerLength = index + 1 < text.length && text[index + 1] == "*" ? 2 : 1;
  final marker = "*" * markerLength;
  final scopeName = markerLength == 2 ? "__markdown-strong__" : TpsTags.emphasis;
  final existingIndex = scopes.lastIndexWhere((scope) => scope.name == scopeName);
  if (existingIndex >= 0) {
    scopes.removeAt(existingIndex);
    return true;
  }
  if (text.indexOf(marker, index + markerLength) < 0) {
    return false;
  }
  scopes.add(_InlineScope(name: scopeName, emphasisLevel: markerLength == 2 ? 2 : 1));
  return true;
}

_TagToken? _readTagToken(String text, int index) {
  final endIndex = text.indexOf("]", index + 1);
  if (endIndex < 0) {
    return null;
  }
  final raw = text.substring(index, endIndex + 1);
  final inner = _restoreEscapes(raw.substring(1, raw.length - 1)).trim();
  final isClosing = inner.startsWith("/");
  final body = isClosing ? inner.substring(1).trim() : inner;
  final separatorIndex = body.indexOf(":");
  final name = (separatorIndex >= 0 ? body.substring(0, separatorIndex) : body).trim().toLowerCase();
  final argument = separatorIndex >= 0 ? _normalizeValue(body.substring(separatorIndex + 1)) : null;
  return _TagToken(raw: raw, inner: inner, name: name, argument: argument, isClosing: isClosing);
}

bool _requiresTokenBoundary(String tagName) => const [TpsTags.pause, TpsTags.breath, TpsTags.editPoint].contains(tagName);

bool _tryHandleSlashPause(String text, int index, String builder, _TokenAccumulator? token) {
  final currentCharacter = text[index];
  final nextCharacter = index + 1 < text.length ? text[index + 1] : "";
  final previousCharacter = index > 0 ? text[index - 1] : "";
  final nextIndex = nextCharacter == "/" ? index + 2 : index + 1;
  final previousIsBoundary = index == 0 || _isWhitespace(previousCharacter);
  final nextIsBoundary = nextIndex >= text.length || _isWhitespace(text[nextIndex]);
  return currentCharacter == "/" && builder.isEmpty && token == null && previousIsBoundary && nextIsBoundary;
}

(String, _TokenAccumulator?) _appendLiteral(String literal, List<_InlineScope> scopes, _InheritedFormattingState inherited, String builder, _TokenAccumulator? token) {
  var activeBuilder = builder;
  var activeToken = token;
  for (final character in literal.split("")) {
    final appended = _appendCharacter(character, scopes, inherited, activeBuilder, activeToken);
    activeBuilder = appended.$1;
    activeToken = appended.$2;
  }
  return (activeBuilder, activeToken);
}

(String, _TokenAccumulator) _appendCharacter(String character, List<_InlineScope> scopes, _InheritedFormattingState inherited, String builder, _TokenAccumulator? token) {
  final nextToken = token ?? _TokenAccumulator();
  nextToken.apply(_resolveActiveState(scopes, inherited), character);
  return ("$builder$character", nextToken);
}

(String, _TokenAccumulator?) _finalizeToken(
  List<_WordSeed> words,
  List<_PhraseSeed> phrases,
  List<_WordSeed> currentPhrase,
  String builder,
  _TokenAccumulator? token,
  _InheritedFormattingState inherited,
) {
  if (builder.isEmpty || token == null) {
    return ("", null);
  }
  final text = _restoreEscapes(builder).trim();
  if (text.isEmpty) {
    return ("", null);
  }
  if (_isStandalonePunctuationToken(text)) {
    if (_attachStandalonePunctuation(words, currentPhrase, text) && _isSentenceEndingPunctuation(text)) {
      _flushPhrase(phrases, currentPhrase);
    }
    return ("", null);
  }
  final metadata = token.buildWordMetadata(inherited.targetWpm);
  final effectiveWpm = _resolveEffectiveWpm(inherited.targetWpm, metadata.speedOverride, metadata.speedMultiplier);
  final word = _WordSeed(
    kind: "word",
    cleanText: text,
    characterCount: text.length,
    orpPosition: _calculateOrpIndex(text),
    displayDurationMs: _calculateWordDurationMs(text, effectiveWpm),
    metadata: metadata,
  );
  words.add(word);
  currentPhrase.add(word);
  if (_isSentenceEndingPunctuation(text)) {
    _flushPhrase(phrases, currentPhrase);
  }
  return ("", null);
}

bool _attachStandalonePunctuation(List<_WordSeed> words, List<_WordSeed> currentPhrase, String punctuation) {
  _WordSeed? target;
  for (final word in currentPhrase.reversed) {
    if (_isSpokenWord(word)) {
      target = word;
      break;
    }
  }
  target ??= words.reversed.cast<_WordSeed?>().firstWhere((word) => word != null && _isSpokenWord(word), orElse: () => null);
  if (target == null) {
    return false;
  }
  target.cleanText = "${target.cleanText}${_buildStandalonePunctuationSuffix(punctuation)}";
  target.characterCount = target.cleanText.length;
  target.orpPosition = _calculateOrpIndex(target.cleanText);
  return true;
}

void _flushPhrase(List<_PhraseSeed> phrases, List<_WordSeed> currentPhrase) {
  if (currentPhrase.isEmpty) {
    return;
  }
  phrases.add(_PhraseSeed(
    words: List<_WordSeed>.from(currentPhrase),
    text: currentPhrase.where(_isSpokenWord).map((word) => word.cleanText).join(" "),
  ));
  currentPhrase.clear();
}

_WordSeed _createControlWord(String kind, _InheritedFormattingState inherited, [int? pauseDurationMs, String? editPointPriority]) {
  return _WordSeed(
    kind: kind,
    cleanText: "",
    characterCount: 0,
    orpPosition: 0,
    displayDurationMs: pauseDurationMs ?? 0,
    metadata: WordMetadata(
      isEmphasis: false,
      emphasisLevel: 0,
      isPause: kind == "pause",
      pauseDurationMs: pauseDurationMs,
      isHighlight: false,
      isBreath: kind == "breath",
      isEditPoint: kind == "edit-point",
      editPointPriority: editPointPriority,
      emotionHint: inherited.emotion,
      speaker: inherited.speaker,
      headCue: TpsSpec.emotionHeadCues[inherited.emotion],
    ),
  );
}

_ActiveInlineState _resolveActiveState(List<_InlineScope> scopes, _InheritedFormattingState inherited) {
  var absoluteSpeed = inherited.targetWpm;
  var hasAbsoluteSpeed = false;
  var hasRelativeSpeed = false;
  var relativeSpeedMultiplier = 1.0;
  var emphasisLevel = 0;
  var highlight = false;
  var emotion = inherited.emotion;
  String? inlineEmotion;
  String? volumeLevel;
  String? deliveryMode;
  String? phoneticGuide;
  String? pronunciationGuide;
  String? stressGuide;
  var stressWrap = false;
  String? articulationStyle;
  int? energyLevel;
  int? melodyLevel;
  for (final scope in scopes) {
    if (scope.absoluteSpeed != null) {
      absoluteSpeed = scope.absoluteSpeed!;
      hasAbsoluteSpeed = true;
      hasRelativeSpeed = false;
      relativeSpeedMultiplier = 1;
    }
    if (scope.resetSpeed == true) {
      hasRelativeSpeed = false;
      relativeSpeedMultiplier = 1;
    }
    if (scope.relativeSpeedMultiplier != null) {
      hasRelativeSpeed = true;
      relativeSpeedMultiplier *= scope.relativeSpeedMultiplier!;
    }
    emphasisLevel = math.max(emphasisLevel, scope.emphasisLevel ?? 0);
    highlight = highlight || (scope.highlight ?? false);
    if (scope.inlineEmotion != null) {
      emotion = scope.inlineEmotion!;
      inlineEmotion = scope.inlineEmotion;
    }
    volumeLevel = scope.volumeLevel ?? volumeLevel;
    deliveryMode = scope.deliveryMode ?? deliveryMode;
    phoneticGuide = scope.phoneticGuide ?? phoneticGuide;
    pronunciationGuide = scope.pronunciationGuide ?? pronunciationGuide;
    stressGuide = scope.stressGuide ?? stressGuide;
    stressWrap = stressWrap || (scope.stressWrap ?? false);
    articulationStyle = scope.articulationStyle ?? articulationStyle;
    if (scope.energyLevel != null) {
      energyLevel = scope.energyLevel;
    }
    if (scope.melodyLevel != null) {
      melodyLevel = scope.melodyLevel;
    }
  }
  return _ActiveInlineState(
    emotion: emotion,
    inlineEmotion: inlineEmotion,
    speaker: inherited.speaker,
    emphasisLevel: emphasisLevel,
    highlight: highlight,
    volumeLevel: volumeLevel,
    deliveryMode: deliveryMode,
    phoneticGuide: phoneticGuide,
    pronunciationGuide: pronunciationGuide,
    stressGuide: stressGuide,
    stressWrap: stressWrap,
    hasAbsoluteSpeed: hasAbsoluteSpeed,
    absoluteSpeed: absoluteSpeed,
    hasRelativeSpeed: hasRelativeSpeed,
    relativeSpeedMultiplier: relativeSpeedMultiplier,
    articulationStyle: articulationStyle,
    energyLevel: energyLevel,
    melodyLevel: melodyLevel,
  );
}

TpsPlaybackWordView _createWordView(CompiledWord word, PlayerState state) {
  return TpsPlaybackWordView(
    word: word,
    isActive: state.currentWord?.id == word.id,
    isRead: word.endMs <= state.elapsedMs,
    isUpcoming: word.startMs > state.elapsedMs,
    emotion: word.metadata.inlineEmotionHint ?? word.metadata.emotionHint ?? TpsSpec.defaultEmotion,
    speaker: word.metadata.speaker,
    emphasisLevel: word.metadata.emphasisLevel,
    isHighlighted: word.metadata.isHighlight,
    deliveryMode: word.metadata.deliveryMode,
    volumeLevel: word.metadata.volumeLevel,
  );
}

List<CompiledBlock> _flattenBlocks(CompiledScript script) => [
      for (final segment in script.segments) ...segment.blocks,
    ];

CompiledSegment _normalizeSegment(CompiledSegment segment, Map<String, CompiledWord> wordById) {
  final blocks = segment.blocks.map((block) => _normalizeBlock(block, wordById)).toList(growable: false);
  final words = segment.words.map((word) => wordById[word.id]!).toList(growable: false);
  return CompiledSegment(
    id: segment.id,
    name: segment.name,
    targetWpm: segment.targetWpm,
    emotion: segment.emotion,
    speaker: segment.speaker,
    archetype: segment.archetype,
    timing: segment.timing,
    backgroundColor: segment.backgroundColor,
    textColor: segment.textColor,
    accentColor: segment.accentColor,
    startWordIndex: segment.startWordIndex,
    endWordIndex: segment.endWordIndex,
    startMs: segment.startMs,
    endMs: segment.endMs,
    blocks: List.unmodifiable(blocks),
    words: List.unmodifiable(words),
  );
}

CompiledBlock _normalizeBlock(CompiledBlock block, Map<String, CompiledWord> wordById) {
  final phrases = block.phrases.map((phrase) => _normalizePhrase(phrase, wordById)).toList(growable: false);
  final words = block.words.map((word) => wordById[word.id]!).toList(growable: false);
  return CompiledBlock(
    id: block.id,
    name: block.name,
    targetWpm: block.targetWpm,
    emotion: block.emotion,
    speaker: block.speaker,
    archetype: block.archetype,
    isImplicit: block.isImplicit,
    startWordIndex: block.startWordIndex,
    endWordIndex: block.endWordIndex,
    startMs: block.startMs,
    endMs: block.endMs,
    phrases: List.unmodifiable(phrases),
    words: List.unmodifiable(words),
  );
}

CompiledPhrase _normalizePhrase(CompiledPhrase phrase, Map<String, CompiledWord> wordById) {
  final words = phrase.words.map((word) => wordById[word.id]!).toList(growable: false);
  return CompiledPhrase(
    id: phrase.id,
    text: phrase.text,
    startWordIndex: phrase.startWordIndex,
    endWordIndex: phrase.endWordIndex,
    startMs: phrase.startMs,
    endMs: phrase.endMs,
    words: List.unmodifiable(words),
  );
}

CompiledWord _cloneWord(CompiledWord word) => CompiledWord(
      id: word.id,
      index: word.index,
      kind: word.kind,
      cleanText: word.cleanText,
      characterCount: word.characterCount,
      orpPosition: word.orpPosition,
      displayDurationMs: word.displayDurationMs,
      startMs: word.startMs,
      endMs: word.endMs,
      metadata: WordMetadata(
        isEmphasis: word.metadata.isEmphasis,
        emphasisLevel: word.metadata.emphasisLevel,
        isPause: word.metadata.isPause,
        pauseDurationMs: word.metadata.pauseDurationMs,
        isHighlight: word.metadata.isHighlight,
        isBreath: word.metadata.isBreath,
        isEditPoint: word.metadata.isEditPoint,
        editPointPriority: word.metadata.editPointPriority,
        emotionHint: word.metadata.emotionHint,
        inlineEmotionHint: word.metadata.inlineEmotionHint,
        volumeLevel: word.metadata.volumeLevel,
        deliveryMode: word.metadata.deliveryMode,
        phoneticGuide: word.metadata.phoneticGuide,
        pronunciationGuide: word.metadata.pronunciationGuide,
        stressText: word.metadata.stressText,
        stressGuide: word.metadata.stressGuide,
        speedOverride: word.metadata.speedOverride,
        speedMultiplier: word.metadata.speedMultiplier,
        speaker: word.metadata.speaker,
        headCue: word.metadata.headCue,
        articulationStyle: word.metadata.articulationStyle,
        energyLevel: word.metadata.energyLevel,
        melodyLevel: word.metadata.melodyLevel,
      ),
      segmentId: word.segmentId,
      blockId: word.blockId,
      phraseId: word.phraseId,
    );

void _validateCompiledScript(CompiledScript script) {
  if (script.totalDurationMs < 0) {
    throw RangeError("Compiled TPS script cannot have a negative total duration.");
  }
  if (script.segments.isEmpty) {
    throw StateError("Compiled TPS script must contain at least one segment.");
  }
  if (script.words.isEmpty) {
    if (script.totalDurationMs != 0) {
      throw RangeError("Compiled TPS script with no words must have zero total duration.");
    }
  } else if (script.totalDurationMs != script.words.last.endMs) {
    throw RangeError("Compiled TPS script total duration must match the end of the final word.");
  }
  final segmentIds = <String>{};
  final blockIds = <String>{};
  final phraseIds = <String>{};
  final wordIds = <String>{};
  _validateWords(script.words, wordIds);
  var expectedSegmentStartWordIndex = 0;
  for (final segment in script.segments) {
    _validateIdentifier(segment.id, "segment", segmentIds);
    _validateTimeRange("segment", segment.startWordIndex, segment.endWordIndex, segment.startMs, segment.endMs, script.words.length);
    _validateCanonicalScopeWords("segment", segment.id, segment.words, segment.startWordIndex, segment.endWordIndex, segment.startMs, segment.endMs, script.words, segment.id);
    if (script.words.isNotEmpty && segment.startWordIndex != expectedSegmentStartWordIndex) {
      throw RangeError("Compiled TPS segments must be ordered by their canonical timeline.");
    }
    var expectedBlockStartWordIndex = script.words.isEmpty ? 0 : segment.startWordIndex;
    for (final block in segment.blocks) {
      _validateIdentifier(block.id, "block", blockIds);
      _validateTimeRange("block", block.startWordIndex, block.endWordIndex, block.startMs, block.endMs, script.words.length);
      _validateCanonicalScopeWords("block", block.id, block.words, block.startWordIndex, block.endWordIndex, block.startMs, block.endMs, script.words, segment.id, block.id);
      var previousPhraseEndWordIndex = block.startWordIndex - 1;
      for (final phrase in block.phrases) {
        _validateIdentifier(phrase.id, "phrase", phraseIds);
        _validateTimeRange("phrase", phrase.startWordIndex, phrase.endWordIndex, phrase.startMs, phrase.endMs, script.words.length);
        _validateCanonicalScopeWords("phrase", phrase.id, phrase.words, phrase.startWordIndex, phrase.endWordIndex, phrase.startMs, phrase.endMs, script.words, segment.id, block.id, phrase.id);
        if (script.words.isNotEmpty && phrase.words.isNotEmpty && phrase.startWordIndex <= previousPhraseEndWordIndex) {
          throw RangeError("Compiled TPS phrases must be ordered by their canonical timeline.");
        }
        if (phrase.words.isNotEmpty) {
          previousPhraseEndWordIndex = phrase.endWordIndex;
        }
      }
      if (script.words.isNotEmpty && block.words.isNotEmpty && block.startWordIndex != expectedBlockStartWordIndex) {
        throw RangeError("Compiled TPS blocks must be ordered by their canonical timeline.");
      }
      if (block.words.isNotEmpty) {
        expectedBlockStartWordIndex = block.endWordIndex + 1;
      }
    }
    expectedSegmentStartWordIndex = segment.words.isEmpty ? segment.startWordIndex : segment.endWordIndex + 1;
  }
  _validateWordReferences(script.words, segmentIds, blockIds, phraseIds);
}

void _validateWords(List<CompiledWord> words, Set<String> seenIds) {
  CompiledWord? previousWord;
  for (var index = 0; index < words.length; index += 1) {
    final word = words[index];
    _validateIdentifier(word.id, "word", seenIds);
    if (word.index != index) {
      throw RangeError("Compiled TPS words must have sequential indexes that match their order.");
    }
    if (word.segmentId.isEmpty || word.blockId.isEmpty) {
      throw StateError("Compiled TPS words must reference a segment and block.");
    }
    if (word.kind == "word" && word.phraseId.isEmpty) {
      throw StateError("Compiled TPS spoken words must reference a phrase.");
    }
    if (word.startMs < 0 || word.endMs < word.startMs) {
      throw RangeError("Compiled TPS words must define a non-negative time range.");
    }
    if (word.endMs - word.startMs != word.displayDurationMs) {
      throw RangeError("Compiled TPS words must keep display duration aligned with their start and end timestamps.");
    }
    if (previousWord != null && word.startMs != previousWord.endMs) {
      throw RangeError("Compiled TPS words must form a contiguous timeline.");
    }
    previousWord = word;
  }
}

void _validateTimeRange(String scope, int startWordIndex, int endWordIndex, int startMs, int endMs, int wordCount) {
  if (startWordIndex < 0 || endWordIndex < startWordIndex || startMs < 0 || endMs < startMs) {
    throw RangeError("Compiled TPS $scope ranges must be non-negative and ordered.");
  }
  if (wordCount == 0) {
    if (startWordIndex != 0 || endWordIndex != 0 || startMs != 0 || endMs != 0) {
      throw RangeError("Compiled TPS empty $scope ranges must stay at zero.");
    }
    return;
  }
  if (startWordIndex >= wordCount || endWordIndex >= wordCount) {
    throw RangeError("Compiled TPS $scope ranges must reference words inside the canonical timeline.");
  }
}

void _validateCanonicalScopeWords(
  String scope,
  String ownerId,
  List<CompiledWord> scopeWords,
  int startWordIndex,
  int endWordIndex,
  int startMs,
  int endMs,
  List<CompiledWord> canonicalWords,
  String expectedSegmentId, [
  String? expectedBlockId,
  String? expectedPhraseId,
]) {
  if (canonicalWords.isEmpty) {
    if (scopeWords.isNotEmpty) {
      throw StateError("Compiled TPS $scope '$ownerId' cannot reference words when the canonical timeline is empty.");
    }
    return;
  }
  if (scopeWords.isEmpty) {
    if (startWordIndex != 0 || endWordIndex != 0 || startMs != 0 || endMs != 0) {
      throw RangeError("Compiled TPS empty $scope '$ownerId' ranges must stay at zero.");
    }
    return;
  }
  final expectedWordCount = endWordIndex - startWordIndex + 1;
  if (scopeWords.length != expectedWordCount) {
    throw StateError("Compiled TPS $scope '$ownerId' words must match the canonical range they claim to cover.");
  }
  if (startMs != canonicalWords[startWordIndex].startMs || endMs != canonicalWords[endWordIndex].endMs) {
    throw RangeError("Compiled TPS $scope '$ownerId' timestamps must match the canonical word range they claim to cover.");
  }
  for (var offset = 0; offset < scopeWords.length; offset += 1) {
    final actualWord = scopeWords[offset];
    final expectedWord = canonicalWords[startWordIndex + offset];
    if (actualWord.id != expectedWord.id || actualWord.index != expectedWord.index || actualWord.startMs != expectedWord.startMs || actualWord.endMs != expectedWord.endMs) {
      throw StateError("Compiled TPS $scope '$ownerId' words must stay aligned with the canonical word timeline.");
    }
    if (actualWord.segmentId != expectedSegmentId) {
      throw StateError("Compiled TPS $scope '$ownerId' words must reference segment '$expectedSegmentId'.");
    }
    if (expectedBlockId != null && actualWord.blockId != expectedBlockId) {
      throw StateError("Compiled TPS $scope '$ownerId' words must reference block '$expectedBlockId'.");
    }
    if (expectedPhraseId != null && actualWord.phraseId != expectedPhraseId) {
      throw StateError("Compiled TPS $scope '$ownerId' words must reference phrase '$expectedPhraseId'.");
    }
  }
}

void _validateWordReferences(List<CompiledWord> words, Set<String> segmentIds, Set<String> blockIds, Set<String> phraseIds) {
  for (final word in words) {
    if (!segmentIds.contains(word.segmentId)) {
      throw StateError("Compiled TPS word '${word.id}' references an unknown segment '${word.segmentId}'.");
    }
    if (!blockIds.contains(word.blockId)) {
      throw StateError("Compiled TPS word '${word.id}' references an unknown block '${word.blockId}'.");
    }
    if (word.phraseId.isNotEmpty && !phraseIds.contains(word.phraseId)) {
      throw StateError("Compiled TPS word '${word.id}' references an unknown phrase '${word.phraseId}'.");
    }
  }
}

void _validateIdentifier(String id, String scope, Set<String> seen) {
  if (id.trim().isEmpty) {
    throw StateError("Compiled TPS $scope identifiers cannot be empty.");
  }
  if (!seen.add(id)) {
    throw StateError("Compiled TPS $scope identifiers must be unique.");
  }
}

CompiledScript _compiledScriptFromJson(Map<String, Object?> json) {
  final metadata = Map<String, String>.from((json["metadata"] as Map).map((key, value) => MapEntry("$key", "$value")));
  final words = (json["words"] as List).cast<Map>().map((entry) => _compiledWordFromJson(Map<String, Object?>.from(entry))).toList(growable: false);
  final wordById = {for (final word in words) word.id: word};
  final segments = (json["segments"] as List)
      .cast<Map>()
      .map((entry) => _compiledSegmentFromJson(Map<String, Object?>.from(entry), wordById))
      .toList(growable: false);
  return CompiledScript(
    metadata: metadata,
    totalDurationMs: (json["totalDurationMs"] as num).toInt(),
    segments: segments,
    words: words,
  );
}

CompiledWord _compiledWordFromJson(Map<String, Object?> json) {
  final metadataJson = Map<String, Object?>.from(json["metadata"] as Map);
  return CompiledWord(
    id: json["id"]! as String,
    index: (json["index"] as num).toInt(),
    kind: json["kind"]! as String,
    cleanText: json["cleanText"]! as String,
    characterCount: (json["characterCount"] as num).toInt(),
    orpPosition: (json["orpPosition"] as num).toInt(),
    displayDurationMs: (json["displayDurationMs"] as num).toInt(),
    startMs: (json["startMs"] as num).toInt(),
    endMs: (json["endMs"] as num).toInt(),
    metadata: WordMetadata(
      isEmphasis: metadataJson["isEmphasis"] as bool? ?? false,
      emphasisLevel: (metadataJson["emphasisLevel"] as num?)?.toInt() ?? 0,
      isPause: metadataJson["isPause"] as bool? ?? false,
      pauseDurationMs: (metadataJson["pauseDurationMs"] as num?)?.toInt(),
      isHighlight: metadataJson["isHighlight"] as bool? ?? false,
      isBreath: metadataJson["isBreath"] as bool? ?? false,
      isEditPoint: metadataJson["isEditPoint"] as bool? ?? false,
      editPointPriority: metadataJson["editPointPriority"] as String?,
      emotionHint: metadataJson["emotionHint"] as String?,
      inlineEmotionHint: metadataJson["inlineEmotionHint"] as String?,
      volumeLevel: metadataJson["volumeLevel"] as String?,
      deliveryMode: metadataJson["deliveryMode"] as String?,
      phoneticGuide: metadataJson["phoneticGuide"] as String?,
      pronunciationGuide: metadataJson["pronunciationGuide"] as String?,
      stressText: metadataJson["stressText"] as String?,
      stressGuide: metadataJson["stressGuide"] as String?,
      speedOverride: (metadataJson["speedOverride"] as num?)?.toInt(),
      speedMultiplier: (metadataJson["speedMultiplier"] as num?)?.toDouble(),
      speaker: metadataJson["speaker"] as String?,
      headCue: metadataJson["headCue"] as String?,
      articulationStyle: metadataJson["articulationStyle"] as String?,
      energyLevel: (metadataJson["energyLevel"] as num?)?.toInt(),
      melodyLevel: (metadataJson["melodyLevel"] as num?)?.toInt(),
    ),
    segmentId: json["segmentId"]! as String,
    blockId: json["blockId"]! as String,
    phraseId: json["phraseId"]! as String,
  );
}

CompiledSegment _compiledSegmentFromJson(Map<String, Object?> json, Map<String, CompiledWord> wordById) {
  final blocks = (json["blocks"] as List).cast<Map>().map((entry) => _compiledBlockFromJson(Map<String, Object?>.from(entry), wordById)).toList(growable: false);
  final words = (json["words"] as List).cast<Map>().map((entry) => wordById[(entry["id"] ?? entry["wordId"] ?? (entry as Object?).toString())!]!).toList(growable: false);
  return CompiledSegment(
    id: json["id"]! as String,
    name: json["name"]! as String,
    targetWpm: (json["targetWpm"] as num).toInt(),
    emotion: json["emotion"]! as String,
    speaker: json["speaker"] as String?,
    archetype: json["archetype"] as String?,
    timing: json["timing"] as String?,
    backgroundColor: json["backgroundColor"]! as String,
    textColor: json["textColor"]! as String,
    accentColor: json["accentColor"]! as String,
    startWordIndex: (json["startWordIndex"] as num).toInt(),
    endWordIndex: (json["endWordIndex"] as num).toInt(),
    startMs: (json["startMs"] as num).toInt(),
    endMs: (json["endMs"] as num).toInt(),
    blocks: blocks,
    words: words,
  );
}

CompiledBlock _compiledBlockFromJson(Map<String, Object?> json, Map<String, CompiledWord> wordById) {
  final phrases = (json["phrases"] as List).cast<Map>().map((entry) => _compiledPhraseFromJson(Map<String, Object?>.from(entry), wordById)).toList(growable: false);
  final words = (json["words"] as List).cast<Map>().map((entry) => wordById[(entry["id"] ?? entry["wordId"] ?? (entry as Object?).toString())!]!).toList(growable: false);
  return CompiledBlock(
    id: json["id"]! as String,
    name: json["name"]! as String,
    targetWpm: (json["targetWpm"] as num).toInt(),
    emotion: json["emotion"]! as String,
    speaker: json["speaker"] as String?,
    archetype: json["archetype"] as String?,
    isImplicit: json["isImplicit"] as bool? ?? false,
    startWordIndex: (json["startWordIndex"] as num).toInt(),
    endWordIndex: (json["endWordIndex"] as num).toInt(),
    startMs: (json["startMs"] as num).toInt(),
    endMs: (json["endMs"] as num).toInt(),
    phrases: phrases,
    words: words,
  );
}

CompiledPhrase _compiledPhraseFromJson(Map<String, Object?> json, Map<String, CompiledWord> wordById) {
  final words = (json["words"] as List).cast<Map>().map((entry) => wordById[(entry["id"] ?? entry["wordId"] ?? (entry as Object?).toString())!]!).toList(growable: false);
  return CompiledPhrase(
    id: json["id"]! as String,
    text: json["text"]! as String,
    startWordIndex: (json["startWordIndex"] as num).toInt(),
    endWordIndex: (json["endWordIndex"] as num).toInt(),
    startMs: (json["startMs"] as num).toInt(),
    endMs: (json["endMs"] as num).toInt(),
    words: words,
  );
}

String _normalizeLineEndings(String value) => value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
List<int> _createLineStarts(String text) {
  final starts = <int>[0];
  for (var index = 0; index < text.length; index += 1) {
    if (text[index] == "\n") {
      starts.add(index + 1);
    }
  }
  return starts;
}

TpsPosition _positionAt(int offset, List<int> lineStarts) {
  var lineIndex = 0;
  for (var index = 0; index < lineStarts.length; index += 1) {
    if (lineStarts[index] > offset) {
      break;
    }
    lineIndex = index;
  }
  final lineStart = lineStarts[lineIndex];
  return TpsPosition(line: lineIndex + 1, column: offset - lineStart + 1, offset: offset);
}

TpsDiagnostic _createDiagnostic(String code, String message, int start, int end, List<int> lineStarts, [String? suggestion]) {
  final severity = code == TpsDiagnosticCodes.invalidHeaderParameter ? "warning" : "error";
  return TpsDiagnostic(
    code: code,
    severity: severity,
    message: message,
    suggestion: suggestion,
    range: TpsRange(start: _positionAt(start, lineStarts), end: _positionAt(end, lineStarts)),
  );
}

bool _hasErrors(List<TpsDiagnostic> diagnostics) => diagnostics.any((diagnostic) => diagnostic.severity == "error");
String? _normalizeValue(String? value) {
  final trimmed = value?.trim();
  return trimmed == null || trimmed.isEmpty ? null : trimmed;
}

bool _isKnownEmotion(String value) => TpsSpec.emotions.contains(value.toLowerCase());
int? _resolveArchetypeWpm(String? archetype) {
  if (archetype == null) {
    return null;
  }
  return TpsSpec.archetypeRecommendedWpm[archetype.toLowerCase()];
}
String _resolveEmotion(String? candidate, [String fallback = TpsSpec.defaultEmotion]) {
  final normalized = _normalizeValue(candidate)?.toLowerCase();
  return normalized != null && _isKnownEmotion(normalized) ? normalized : fallback;
}

Map<String, String> _resolvePalette(String? emotion) {
  final key = _resolveEmotion(emotion);
  return Map<String, String>.from(TpsSpec.emotionPalettes[key]!);
}

int _resolveBaseWpm(Map<String, String> metadata) {
  final value = metadata[TpsFrontMatterKeys.baseWpm];
  return _clampWpm(int.tryParse(value ?? "") ?? TpsSpec.defaultBaseWpm, TpsSpec.defaultBaseWpm);
}

Map<String, int> _resolveSpeedOffsets(Map<String, String> metadata) => {
      TpsTags.xslow: int.tryParse(metadata[TpsFrontMatterKeys.speedOffsetsXslow] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.xslow]!,
      TpsTags.slow: int.tryParse(metadata[TpsFrontMatterKeys.speedOffsetsSlow] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.slow]!,
      TpsTags.fast: int.tryParse(metadata[TpsFrontMatterKeys.speedOffsetsFast] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.fast]!,
      TpsTags.xfast: int.tryParse(metadata[TpsFrontMatterKeys.speedOffsetsXfast] ?? "") ?? TpsSpec.defaultSpeedOffsets[TpsTags.xfast]!,
    };

double? _resolveSpeedMultiplier(String tag, Map<String, int> speedOffsets) => speedOffsets.containsKey(tag) ? 1 + (speedOffsets[tag]! / 100) : null;
int? _tryParseAbsoluteWpm(String tag) {
  final lower = tag.toLowerCase();
  if (!lower.endsWith(TpsSpec.wpmSuffix.toLowerCase())) {
    return null;
  }
  return int.tryParse(tag.substring(0, tag.length - TpsSpec.wpmSuffix.length));
}

bool _isTimingToken(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    return false;
  }
  final parts = trimmed.split("-");
  if (parts.length > 2) {
    return false;
  }
  return parts.every((part) => RegExp(r"^\d{1,2}:\d{2}$").hasMatch(part.trim()));
}

bool _isSentenceEndingPunctuation(String text) {
  final trimmed = text.trimRight();
  if (trimmed.isEmpty) {
    return false;
  }
  return [".", "!", "?"].contains(trimmed.substring(trimmed.length - 1));
}

int? _tryResolvePauseMilliseconds(String? argument) {
  final trimmed = _normalizeValue(argument);
  if (trimmed == null) {
    return null;
  }
  if (trimmed.toLowerCase().endsWith("ms")) {
    return int.tryParse(trimmed.substring(0, trimmed.length - 2));
  }
  if (!trimmed.toLowerCase().endsWith("s")) {
    return null;
  }
  final seconds = double.tryParse(trimmed.substring(0, trimmed.length - 1));
  return seconds == null ? null : (seconds * 1000).round();
}

int _calculateWordDurationMs(String word, int effectiveWpm) {
  final baseMilliseconds = 60000 / math.max(1, effectiveWpm);
  return math.max(120, (baseMilliseconds * (0.8 + (word.length * 0.04))).round());
}

int _calculateOrpIndex(String word) {
  if (word.isEmpty) {
    return 0;
  }
  var cleanWord = word;
  while (cleanWord.isNotEmpty && const [".", "!", "?", ",", ";", ":", "\"", "'", ")", "]", "}"].contains(cleanWord.substring(cleanWord.length - 1))) {
    cleanWord = cleanWord.substring(0, cleanWord.length - 1);
  }
  final length = cleanWord.length;
  if (length <= 1) {
    return 0;
  }
  final ratio = length <= 5 ? 0.3 : length <= 9 ? 0.35 : 0.4;
  return math.max(0, math.min((length * ratio).floor(), length - 1));
}

int _resolveEffectiveWpm(int inheritedWpm, int? speedOverride, double? speedMultiplier) {
  if (speedOverride != null) {
    return math.max(1, speedOverride);
  }
  if (speedMultiplier != null) {
    return math.max(1, (inheritedWpm * speedMultiplier).round());
  }
  return math.max(1, inheritedWpm);
}

String _buildInvalidWpmMessage(String value) => "WPM '$value' must be between ${TpsSpec.minimumWpm} and ${TpsSpec.maximumWpm}.";
bool _isInvalidWpm(int value) => value < TpsSpec.minimumWpm || value > TpsSpec.maximumWpm;

String _protectEscapes(String text) => text
    .replaceAll("\\\\", "\uE006")
    .replaceAll("\\[", "\uE001")
    .replaceAll("\\]", "\uE002")
    .replaceAll("\\|", "\uE003")
    .replaceAll("\\/", "\uE004")
    .replaceAll("\\*", "\uE005");

String _restoreEscapes(String text) => text
    .replaceAll("\uE001", "[")
    .replaceAll("\uE002", "]")
    .replaceAll("\uE003", "|")
    .replaceAll("\uE004", "/")
    .replaceAll("\uE005", "*")
    .replaceAll("\uE006", "\\");

class _HeaderPart {
  _HeaderPart(this.value, this.start, this.end);
  final String value;
  final int start;
  final int end;
}

List<_HeaderPart> _splitHeaderPartsDetailed(String rawHeaderContent) {
  final detailedParts = <_HeaderPart>[];
  var current = "";
  var partStart = 0;
  for (var index = 0; index < rawHeaderContent.length; index += 1) {
    final character = rawHeaderContent[index];
    if (character == "\\" && index + 1 < rawHeaderContent.length) {
      current += rawHeaderContent[index + 1];
      index += 1;
      continue;
    }
    if (character == "|") {
      detailedParts.add(_HeaderPart(current.trim(), partStart, index));
      current = "";
      partStart = index + 1;
      continue;
    }
    current += character;
  }
  detailedParts.add(_HeaderPart(current.trim(), partStart, rawHeaderContent.length));
  return detailedParts;
}

bool _isStandalonePunctuationToken(String? token) {
  if (token == null || token.trim().isEmpty) {
    return false;
  }
  const characters = {",", ".", ";", ":", "!", "?", "-", "—", "–", "…"};
  for (final character in token.trim().split("")) {
    if (!characters.contains(character)) {
      return false;
    }
  }
  return true;
}

String _buildStandalonePunctuationSuffix(String token) {
  final trimmed = token.trim();
  if (trimmed.split("").every((character) => const {"-", "—", "–"}.contains(character))) {
    return " $trimmed";
  }
  return trimmed;
}

String _normalizeMetadataValue(String value) {
  final trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.substring(1, trimmed.length - 1)
      : trimmed;
}

(int, int)? _findFrontMatterClosing(String source) {
  final blockClosingIndex = source.indexOf("\n---\n", 4);
  if (blockClosingIndex >= 0) {
    return (blockClosingIndex, 5);
  }
  if (source.endsWith("\n---")) {
    return (source.length - 4, 4);
  }
  return null;
}

void _validateMetadataEntry(String key, String value, int start, int end, List<int> lineStarts, List<TpsDiagnostic> diagnostics) {
  if (key == TpsFrontMatterKeys.baseWpm) {
    final parsed = int.tryParse(value);
    if (!RegExp(r"^-?\d+$").hasMatch(value)) {
      diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, "Front matter field 'base_wpm' must be an integer.", start, end, lineStarts));
      return;
    }
    if (parsed != null && _isInvalidWpm(parsed)) {
      diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidWpm, _buildInvalidWpmMessage(value), start, end, lineStarts));
    }
    return;
  }
  if (key.startsWith("speed_offsets.") && !RegExp(r"^-?\d+$").hasMatch(value)) {
    diagnostics.add(_createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, "Front matter field '$key' must be an integer.", start, end, lineStarts));
  }
}

bool _isWhitespace(String character) => RegExp(r"\s").hasMatch(character);
bool _isPairedScope(String tagName) => !const [TpsTags.pause, TpsTags.breath, TpsTags.editPoint].contains(tagName);
bool _isSpokenWord(_WordSeed word) => word.kind == "word" && word.cleanText.isNotEmpty;
int _clamp(int value, int minimum, int maximum) => math.min(math.max(value, minimum), maximum);
int _clampWpm(int candidate, int fallback) => candidate.isFinite ? _clamp(candidate, TpsSpec.minimumWpm, TpsSpec.maximumWpm) : fallback;
int _normalizeBaseWpm(int? value) => _clampWpm(value ?? TpsSpec.defaultBaseWpm, TpsSpec.defaultBaseWpm);
int _normalizeSpeedStep(int? value) => value == null || value <= 0 ? TpsPlaybackDefaults.defaultSpeedStepWpm : value;
int _normalizeSpeedOffset(int baseWpm, int offset) => _clamp(baseWpm + offset, TpsSpec.minimumWpm, TpsSpec.maximumWpm) - baseWpm;
int _nowMs() => DateTime.now().millisecondsSinceEpoch;
TpsPlaybackStatus _resolveStatusAfterSeek(TpsPlaybackStatus current, int totalDurationMs, int elapsedMs) {
  if (totalDurationMs == 0 || elapsedMs >= totalDurationMs) {
    return TpsPlaybackStatus.completed;
  }
  if (elapsedMs <= 0 && current == TpsPlaybackStatus.idle) {
    return TpsPlaybackStatus.idle;
  }
  return TpsPlaybackStatus.paused;
}

typedef VoidCallback = void Function();

Map<String, Object?> _compact(Map<String, Object?> input) {
  final result = <String, Object?>{};
  for (final entry in input.entries) {
    if (entry.value != null) {
      result[entry.key] = entry.value;
    }
  }
  return result;
}
