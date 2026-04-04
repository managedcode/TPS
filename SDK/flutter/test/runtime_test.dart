import "dart:async";
import "dart:convert";
import "dart:io";

import "package:managedcode_tps/managedcode_tps.dart";
import "package:test/test.dart";

void main() {
  final rootDir = Directory.current.parent.parent.path;
  final fixturesDir = "$rootDir/SDK/fixtures";
  final examplesDir = "$rootDir/examples";

  String readFixture(List<String> parts) => File([fixturesDir, ...parts].join(Platform.pathSeparator)).readAsStringSync();
  String readExample(String name) => File("$examplesDir${Platform.pathSeparator}$name").readAsStringSync();
  List<CompiledWord> spokenWords(CompiledScript script) => script.words.where((word) => word.kind == "word").toList(growable: false);

  test("publishes spec constants and keyword catalog", () {
    expect(TpsSpec.defaultBaseWpm, 140);
    expect(TpsSpec.defaultEmotion, "neutral");
    expect(TpsKeywords.tags["pause"], "pause");
    expect(TpsKeywords.emotions, contains("motivational"));
    expect(TpsKeywords.deliveryModes, contains("building"));
  });

  test("matches canonical transport fixture", () {
    final result = compileTps(readFixture(["valid", "runtime-parity.tps"]));
    final expected = jsonDecode(readFixture(["transport", "runtime-parity.compiled.json"]));
    expect(result.ok, isTrue);
    expect(jsonDecode(jsonEncode(result.script.toJson())), equals(expected));

    final restored = TpsStandalonePlayer.fromCompiledJson(jsonEncode(expected));
    expect(restored.snapshot.state.currentSegment?.name, "Call to Action");
    restored.dispose();
  });

  test("matches shared example snapshots for compile, player, and playback layers", () {
    for (final example in ["basic.tps", "advanced.tps", "multi-segment.tps"]) {
      final result = compileTps(readExample(example));
      final expected = jsonDecode(
        File("$fixturesDir${Platform.pathSeparator}examples${Platform.pathSeparator}${example.replaceAll(".tps", ".snapshot.json")}").readAsStringSync(),
      );
      expect(result.ok, isTrue, reason: example);
      expect(normalizeExampleSnapshot(example, result.script), equals(expected), reason: example);
    }
  });

  test("reports invalid fixtures with actionable diagnostics", () {
    final expectations = jsonDecode(readFixture(["runtime-expectations.json"])) as Map<String, Object?>;
    final invalidDiagnostics = Map<String, Object?>.from(expectations["invalidDiagnostics"] as Map);
    for (final entry in invalidDiagnostics.entries) {
      final result = validateTps(readFixture(["invalid", entry.key]));
      final expectedCodes = List<String>.from(entry.value as List);
      expect(result.ok, entry.key == "header-parameter.tps");
      expect(result.diagnostics.map((diagnostic) => diagnostic.code).toList(growable: false), equals(expectedCodes), reason: entry.key);
      expect(result.diagnostics.every((diagnostic) => diagnostic.range.start.line >= 1), isTrue, reason: entry.key);
    }
  });

  test("serializes diagnostics, compiled scripts, player states, and playback snapshots", () {
    final invalid = validateTps("## []");
    expect(invalid.ok, isFalse);
    final diagnosticJson = invalid.diagnostics.first.toJson();
    expect(diagnosticJson["code"], "invalid-header");
    expect(diagnosticJson["range"], isA<Map<String, Object?>>());

    final compiled = compileTps(readFixture(["valid", "runtime-parity.tps"]));
    final player = TpsPlayer(compiled.script);
    final session = TpsPlaybackSession(compiled.script, const TpsPlaybackSessionOptions(initialSpeedOffsetWpm: 5));
    final stateJson = player.getState(0).toJson();
    final snapshotJson = session.snapshot.toJson();

    expect(jsonDecode(jsonEncode(compiled.script.toJson())), isA<Map<String, Object?>>());
    expect(stateJson["presentation"], isA<Map<String, Object?>>());
    expect(snapshotJson["tempo"], isA<Map<String, Object?>>());
    expect(snapshotJson["controls"], isA<Map<String, Object?>>());
    expect(snapshotJson["visibleWords"], isA<List<Object?>>());
    session.dispose();
  });

  test("parses header variants, timing hints, punctuation, and malformed authoring", () {
    final parsed = parseTps(
      "---\n"
      'title: "Front"\n'
      "base_wpm: 150\n"
      "---\n\n"
      "# Display\n\n"
      "Intro words.\n\n"
      "### Body\n"
      "Now read this.\n\n"
      "## [Signal|0:30-1:10|Warm|Speaker:Alex]\n"
      "### [Callout|160WPM]\n"
      "Message.",
    );
    expect(parsed.ok, isTrue);
    expect(parsed.document.metadata["title"], "Display");
    expect(parsed.document.segments.first.name, "Display");
    expect(parsed.document.segments.last.timing, "0:30-1:10");
    expect(parsed.document.segments.last.speaker, "Alex");
    expect(parsed.document.segments.last.blocks.first.targetWpm, 160);

    final eofFrontMatter = parseTps("---\nbase_wpm: 150\n---");
    expect(eofFrontMatter.ok, isTrue);
    expect(eofFrontMatter.document.metadata["base_wpm"], "150");

    final source = compileTps(
      "## [Signal|focused]\n"
      "### [Body]\n"
      "[180WPM][slow]*beta*[/slow][normal]**gamma**[/normal][/180WPM] "
      "[phonetic:ˈkæməl]camel[/phonetic] literal \\/ slash \\[tag\\]",
    );
    final words = spokenWords(source.script);
    final beta = words.firstWhere((word) => word.cleanText == "beta");
    final gamma = words.firstWhere((word) => word.cleanText == "gamma");
    final camel = words.firstWhere((word) => word.cleanText == "camel");
    expect(beta.metadata.speedOverride, 144);
    expect(beta.metadata.emphasisLevel, 1);
    expect(gamma.metadata.speedOverride, 180);
    expect(gamma.metadata.emphasisLevel, 2);
    expect(camel.metadata.phoneticGuide, "ˈkæməl");
    expect(words.any((word) => word.cleanText == "/"), isTrue);
    expect(words.any((word) => word.cleanText == "[tag]"), isTrue);

    final malformed = compileTps(
      "## [Broken|260WPM|Mystery]\n\n"
      "### [Body]\n"
      "[unknown]tag[/unknown] [edit_point:critical] [slow]dangling",
    );
    expect(malformed.ok, isFalse);
    expect(
      malformed.diagnostics.map((diagnostic) => diagnostic.code).toList(growable: false),
      equals(["invalid-wpm", "invalid-header-parameter", "unknown-tag", "invalid-tag-argument", "unclosed-tag"]),
    );
    expect(spokenWords(malformed.script).any((word) => word.cleanText.contains("[unknown]tag[/unknown]")), isTrue);

    final punctuation = compileTps(
      "## [Signal|neutral]\n"
      "### [Body]\n"
      "A/b stays literal. [emphasis]Done[/emphasis], / dash - restored.",
    );
    final punctuationWords = spokenWords(punctuation.script).map((word) => word.cleanText).toList(growable: false);
    expect(punctuationWords, contains("A/b"));
    expect(punctuationWords, contains("Done,"));
    expect(punctuationWords, contains("dash -"));
    expect(punctuation.script.words.where((word) => word.kind == "pause").length, 1);
  });

  test("guards compiled JSON restore and playback session control flow", () async {
    final compiled = compileTps("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.\n## [Wrap]\n### [Body]\nDone.");
    final canonicalTransport = jsonDecode(readFixture(["transport", "runtime-parity.compiled.json"])) as Map<String, Object?>;

    expect(() => parseCompiledScriptJson(""), throwsA(isA<TypeError>()));
    expect(() => parseCompiledScriptJson("[]"), throwsA(isA<TypeError>()));

    final invalidTransport = Map<String, Object?>.from(canonicalTransport);
    invalidTransport["segments"] = const [];
    expect(() => parseCompiledScriptJson(jsonEncode(invalidTransport)), throwsA(isA<StateError>()));

    final session = TpsPlaybackSession(
      compiled.script,
      const TpsPlaybackSessionOptions(tickIntervalMs: 10, initialSpeedOffsetWpm: -10),
    );
    final standalone = TpsStandalonePlayer.fromCompiledJson(jsonEncode(canonicalTransport));
    final statuses = <String>[];
    final words = <String>[];
    final observedSnapshots = <TpsPlaybackSnapshot>[];
    final statusListener = (Object? event) => statuses.add(((event as Map<String, Object?>)["status"] as TpsPlaybackStatus).name);
    final wordListener = (Object? event) => words.add(((event as Map<String, Object?>)["state"] as PlayerState).currentWord?.cleanText ?? "");

    final unsubscribeStatus = session.on("statusChanged", statusListener);
    session.on("wordChanged", wordListener);
    final stopObserving = session.observeSnapshot((snapshot) => observedSnapshots.add(snapshot));

    expect(session.seek(0).elapsedMs, 0);
    expect(session.status, TpsPlaybackStatus.idle);
    expect(session.nextBlock().currentBlock?.name, "Close");
    expect(session.previousBlock().currentBlock?.name, "Lead");
    expect(session.nextWord().currentWord?.cleanText, "Now.");
    expect(session.previousWord().currentWord?.cleanText, "Ready.");
    expect(session.increaseSpeed(20).tempo.effectiveBaseWpm, 150);
    expect(session.pause().currentWord?.cleanText, "Ready.");
    expect(session.stop().elapsedMs, 0);
    session.off("statusChanged", statusListener);
    unsubscribeStatus();
    stopObserving();

    final completer = Completer<void>();
    session.on("completed", (_) {
      if (!completer.isCompleted) {
        completer.complete();
      }
    });
    session.play();
    await completer.future.timeout(const Duration(seconds: 3));

    expect(session.status, TpsPlaybackStatus.completed);
    expect(words, contains("Ready."));
    expect(observedSnapshots.first.state.currentWord?.cleanText, "Ready.");
    expect(standalone.snapshot.state.currentSegment?.name, "Call to Action");

    session.dispose();
    standalone.dispose();
  });

  test("supports deterministic playback navigation and timed completion", () async {
    final compilation = compileTps("## [Signal]\n### [Body]\nReady now.");
    final session = TpsPlaybackSession(compilation.script, const TpsPlaybackSessionOptions(tickIntervalMs: 10));
    expect(session.snapshot.state.currentWord?.cleanText, "Ready");

    session.nextWord();
    expect(session.snapshot.state.currentWord?.cleanText, "now.");

    session.previousWord();
    expect(session.snapshot.state.currentWord?.cleanText, "Ready");

    session.increaseSpeed(20);
    expect(session.snapshot.tempo.effectiveBaseWpm, 160);

    final completer = Completer<void>();
    session.on("completed", (_) {
      if (!completer.isCompleted) {
        completer.complete();
      }
    });
    session.play();
    await completer.future.timeout(const Duration(seconds: 3));
    expect(session.status, TpsPlaybackStatus.completed);
    session.dispose();
  });

  test("compiles and navigates a large generated script", () {
    final buffer = StringBuffer()
      ..writeln("---")
      ..writeln("base_wpm: 140")
      ..writeln("---")
      ..writeln();

    for (var segmentIndex = 1; segmentIndex <= 8; segmentIndex += 1) {
      buffer.writeln("## [Segment $segmentIndex|focused|Speaker:Host]");
      for (var blockIndex = 1; blockIndex <= 10; blockIndex += 1) {
        buffer.writeln("### [Block $blockIndex|150WPM]");
        for (var sentenceIndex = 1; sentenceIndex <= 6; sentenceIndex += 1) {
          buffer.writeln("[slow]Generated[/slow] script segment $segmentIndex block $blockIndex sentence $sentenceIndex for performance coverage. //");
        }
        buffer.writeln("[pause:1s]");
      }
    }

    final result = compileTps(buffer.toString());
    expect(result.ok, isTrue);
    expect(result.script.words.length, greaterThan(2000));
    final player = TpsPlayer(result.script);
    final checkpoints = player.enumerateStates((result.script.totalDurationMs / 10).round()).toList(growable: false);
    expect(checkpoints.first.currentSegment?.name, "Segment 1");
    expect(checkpoints.last.isComplete, isTrue);
  });
}

Map<String, Object?> normalizeExampleSnapshot(String fileName, CompiledScript script) {
  final player = TpsPlayer(script);
  final session = TpsPlaybackSession(script);
  final standalone = TpsStandalonePlayer.fromCompiledScript(script);
  try {
    final checkpoints = buildCheckpointTimes(script.totalDurationMs)
        .map((checkpoint) => normalizePlayerState(checkpoint.$1, player.getState(checkpoint.$2)))
        .toList(growable: false);
    return {
      "fileName": fileName,
      "source": "examples/$fileName",
      "compiled": normalizeCompiledSnapshot(script),
      "player": {
        "checkpoints": checkpoints,
      },
      "playback": {
        "session": normalizePlaybackSequence(session),
        "standalone": normalizePlaybackSequence(standalone),
      },
    };
  } finally {
    session.dispose();
    standalone.dispose();
  }
}

List<(String, int)> buildCheckpointTimes(int totalDurationMs) {
  final raw = <(String, int)>[
    ("start", 0),
    ("quarter", (totalDurationMs * 0.25).round()),
    ("middle", (totalDurationMs * 0.5).round()),
    ("threeQuarter", (totalDurationMs * 0.75).round()),
    ("complete", totalDurationMs),
  ];
  final seen = <int>{};
  return raw.where((checkpoint) => seen.add(checkpoint.$2)).toList(growable: false);
}

Map<String, Object?> normalizeCompiledScriptJson(CompiledScript script) => normalizeCompiledSnapshot(script);

Map<String, Object?> normalizeCompiledSnapshot(CompiledScript script) => {
      "metadata": sortRecord(script.metadata),
      "totalDurationMs": script.totalDurationMs,
      "segments": script.segments.map(normalizeSegment).toList(growable: false),
      "words": script.words.map(normalizeWord).toList(growable: false),
    };

Map<String, Object?> normalizeSegment(CompiledSegment segment) => compact({
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
      "wordIds": segment.words.map((word) => word.id).toList(growable: false),
      "blocks": segment.blocks.map(normalizeBlock).toList(growable: false),
    });

Map<String, Object?> normalizeBlock(CompiledBlock block) => compact({
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
      "wordIds": block.words.map((word) => word.id).toList(growable: false),
      "phrases": block.phrases.map(normalizePhrase).toList(growable: false),
    });

Map<String, Object?> normalizePhrase(CompiledPhrase phrase) => {
      "id": phrase.id,
      "text": phrase.text,
      "startWordIndex": phrase.startWordIndex,
      "endWordIndex": phrase.endWordIndex,
      "startMs": phrase.startMs,
      "endMs": phrase.endMs,
      "wordIds": phrase.words.map((word) => word.id).toList(growable: false),
    };

Map<String, Object?> normalizeWord(CompiledWord word) => compact({
      "id": word.id,
      "index": word.index,
      "kind": word.kind,
      "cleanText": word.cleanText,
      "characterCount": word.characterCount,
      "orpPosition": word.orpPosition,
      "displayDurationMs": word.displayDurationMs,
      "startMs": word.startMs,
      "endMs": word.endMs,
      "metadata": compact({
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
        "headCue": word.metadata.headCue,
      }),
      "segmentId": word.segmentId,
      "blockId": word.blockId,
      "phraseId": word.phraseId,
    });

Map<String, Object?> normalizePlayerState(String label, PlayerState state) => compact({
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
      "presentation": compact({
        "segmentName": state.presentation.segmentName,
        "blockName": state.presentation.blockName,
        "phraseText": state.presentation.phraseText,
        "visibleWordIds": state.presentation.visibleWords.map((word) => word.id).toList(growable: false),
        "visibleWordTexts": state.presentation.visibleWords.map((word) => word.cleanText).toList(growable: false),
        "activeWordInPhrase": state.presentation.activeWordInPhrase,
      }),
    });

List<Map<String, Object?>> normalizePlaybackSequence(dynamic controller) {
  final snapshots = <Map<String, Object?>>[];
  snapshots.add(normalizePlaybackSnapshot("initial", controller.snapshot as TpsPlaybackSnapshot));
  controller.nextWord();
  snapshots.add(normalizePlaybackSnapshot("afterNextWord", controller.snapshot as TpsPlaybackSnapshot));
  controller.previousWord();
  snapshots.add(normalizePlaybackSnapshot("afterPreviousWord", controller.snapshot as TpsPlaybackSnapshot));
  controller.nextBlock();
  snapshots.add(normalizePlaybackSnapshot("afterNextBlock", controller.snapshot as TpsPlaybackSnapshot));
  controller.previousBlock();
  snapshots.add(normalizePlaybackSnapshot("afterPreviousBlock", controller.snapshot as TpsPlaybackSnapshot));
  controller.increaseSpeed();
  snapshots.add(normalizePlaybackSnapshot("afterIncreaseSpeed", controller.snapshot as TpsPlaybackSnapshot));
  controller.decreaseSpeed((controller.snapshot as TpsPlaybackSnapshot).tempo.speedStepWpm);
  snapshots.add(normalizePlaybackSnapshot("afterDecreaseSpeed", controller.snapshot as TpsPlaybackSnapshot));
  return snapshots;
}

Map<String, Object?> normalizePlaybackSnapshot(String label, TpsPlaybackSnapshot snapshot) => compact({
      "label": label,
      "status": snapshot.status.name,
      "state": normalizePlayerState("state", snapshot.state),
      "tempo": compact({
        "baseWpm": snapshot.tempo.baseWpm,
        "effectiveBaseWpm": snapshot.tempo.effectiveBaseWpm,
        "speedOffsetWpm": snapshot.tempo.speedOffsetWpm,
        "speedStepWpm": snapshot.tempo.speedStepWpm,
        "playbackRate": normalizeNumber(snapshot.tempo.playbackRate),
      }),
      "controls": snapshot.controls.toJson(),
      "focusedWordId": snapshot.focusedWord?.word.id,
      "focusedWordText": snapshot.focusedWord?.word.cleanText,
      "currentWordDurationMs": snapshot.currentWordDurationMs,
      "currentWordRemainingMs": snapshot.currentWordRemainingMs,
      "currentSegmentIndex": snapshot.currentSegmentIndex,
      "currentBlockIndex": snapshot.currentBlockIndex,
      "visibleWords": snapshot.visibleWords
          .map((word) => compact({
                "id": word.word.id,
                "text": word.word.cleanText,
                "isActive": word.isActive,
                "isRead": word.isRead,
                "isUpcoming": word.isUpcoming,
                "emotion": word.emotion,
                "speaker": word.speaker,
                "emphasisLevel": word.emphasisLevel,
                "isHighlighted": word.isHighlighted,
                "deliveryMode": word.deliveryMode,
                "volumeLevel": word.volumeLevel,
              }))
          .toList(growable: false),
    });

Object? normalizeNumber(num? value) => value == null ? null : double.parse(value.toStringAsFixed(6));
Map<String, String> sortRecord(Map<String, String> record) => Map.fromEntries(record.entries.toList(growable: false)..sort((left, right) => left.key.compareTo(right.key)));
Map<String, Object?> compact(Map<String, Object?> value) => Map.fromEntries(value.entries.where((entry) => entry.value != null));
