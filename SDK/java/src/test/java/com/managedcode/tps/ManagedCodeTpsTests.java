package com.managedcode.tps;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

public final class ManagedCodeTpsTests {
    private static final Path ROOT = resolveRoot();
    private static final Path FIXTURES = ROOT.resolve("SDK/fixtures");
    private static final Path EXAMPLES = ROOT.resolve("examples");

    private ManagedCodeTpsTests() {
    }

    private static Path resolveRoot() {
        Path current = Path.of("").toAbsolutePath().normalize();
        if (Files.isDirectory(current.resolve("SDK/fixtures")) && Files.isDirectory(current.resolve("examples"))) {
            return current;
        }

        Path parent = current.getParent();
        if (parent != null) {
            Path repo = parent.getParent();
            if (repo != null && Files.isDirectory(repo.resolve("SDK/fixtures")) && Files.isDirectory(repo.resolve("examples"))) {
                return repo;
            }
        }

        throw new IllegalStateException("Unable to resolve repository root from " + current);
    }

    public static void main(String[] args) throws Exception {
        testSpecConstants();
        testCanonicalTransportFixture();
        testExampleSnapshots();
        testInvalidFixtures();
        testParseAndValidateApisCoverHeaderVariants();
        testAuthoringEdgeCasesAndPlayerGuardRails();
        testCompiledJsonGuardsAndPlaybackLifecycle();
        testPlaybackNavigationAndTimer();
        testLargeGeneratedScript();
        System.out.println("ManagedCode.Tps Java tests passed.");
    }

    private static void testSpecConstants() {
        assertEquals(140, ManagedCodeTps.TpsSpec.DEFAULT_BASE_WPM, "defaultBaseWpm");
        assertEquals("neutral", ManagedCodeTps.TpsSpec.DEFAULT_EMOTION, "defaultEmotion");
        assertEquals("pause", ManagedCodeTps.TpsKeywords.TAGS.get("pause"), "pause tag");
        assertTrue(ManagedCodeTps.TpsKeywords.EMOTIONS.contains("motivational"), "emotions should include motivational");
        assertTrue(ManagedCodeTps.TpsKeywords.DELIVERY_MODES.contains("building"), "delivery modes should include building");
    }

    private static void testCanonicalTransportFixture() throws IOException {
        ManagedCodeTps.TpsCompilationResult result = ManagedCodeTps.TpsRuntime.compileTps(readFixture("valid/runtime-parity.tps"));
        String actual = canonicalJson(ManagedCodeTps.TpsRuntime.toCompiledJson(result.script()));
        String expected = canonicalJson(readFixture("transport/runtime-parity.compiled.json"));
        assertTrue(result.ok(), "canonical fixture should compile");
        assertEquals(expected, actual, "compiled transport parity");

        ManagedCodeTps.TpsStandalonePlayer restored = ManagedCodeTps.TpsStandalonePlayer.fromCompiledJson(readFixture("transport/runtime-parity.compiled.json"));
        try {
            assertEquals("Call to Action", restored.snapshot().state().currentSegment().name(), "restored current segment");
        } finally {
            restored.dispose();
        }
    }

    private static void testExampleSnapshots() throws IOException {
        for (String example : List.of("basic.tps", "advanced.tps", "multi-segment.tps")) {
            ManagedCodeTps.TpsCompilationResult result = ManagedCodeTps.TpsRuntime.compileTps(readExample(example));
            assertTrue(result.ok(), "example should compile: " + example);
            String actual = canonicalJson(Json.write(normalizeExampleSnapshot(example, result.script())));
            String expected = canonicalJson(readFixture("examples/" + example.replace(".tps", ".snapshot.json")));
            assertEquals(expected, actual, "example snapshot parity: " + example);
        }
    }

    private static void testInvalidFixtures() throws IOException {
        Map<String, Object> expectations = castMap(new JsonReader(readFixture("runtime-expectations.json")).read());
        Map<String, Object> invalidDiagnostics = castMap(expectations.get("invalidDiagnostics"));
        for (Map.Entry<String, Object> entry : invalidDiagnostics.entrySet()) {
            ManagedCodeTps.TpsValidationResult result = ManagedCodeTps.TpsRuntime.validateTps(readFixture("invalid/" + entry.getKey()));
            List<String> expectedCodes = castList(entry.getValue()).stream().map(Object::toString).toList();
            assertEquals("header-parameter.tps".equals(entry.getKey()), result.ok(), "invalid fixture ok state: " + entry.getKey());
            assertEquals(expectedCodes, result.diagnostics().stream().map(ManagedCodeTps.TpsDiagnostic::code).toList(), "invalid fixture diagnostics: " + entry.getKey());
            assertTrue(result.diagnostics().stream().allMatch(diagnostic -> diagnostic.range().start().line() >= 1), "invalid fixture line numbers: " + entry.getKey());
        }
    }

    private static void testParseAndValidateApisCoverHeaderVariants() {
        ManagedCodeTps.TpsValidationResult invalid = ManagedCodeTps.TpsRuntime.validateTps("## []");
        assertTrue(!invalid.ok(), "invalid header should fail validation");
        assertEquals("invalid-header", invalid.diagnostics().get(0).code(), "invalid header diagnostic");

        ManagedCodeTps.TpsParseResult parsed = ManagedCodeTps.TpsRuntime.parseTps("""
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
            """);
        assertTrue(parsed.ok(), "header variant parse should succeed");
        assertEquals("Display", parsed.document().metadata().get("title"), "display title");
        assertEquals("Display", parsed.document().segments().get(0).name(), "implicit segment title");
        assertEquals("0:30-1:10", parsed.document().segments().get(parsed.document().segments().size() - 1).timing(), "timing token");
        assertEquals("Alex", parsed.document().segments().get(parsed.document().segments().size() - 1).speaker(), "speaker token");
        assertEquals(160, parsed.document().segments().get(parsed.document().segments().size() - 1).blocks().get(0).targetWpm(), "block wpm");

        ManagedCodeTps.TpsParseResult eofFrontMatter = ManagedCodeTps.TpsRuntime.parseTps("---\nbase_wpm: 150\n---");
        assertTrue(eofFrontMatter.ok(), "EOF front matter should parse");
        assertEquals("150", eofFrontMatter.document().metadata().get("base_wpm"), "EOF base_wpm");
    }

    private static void testAuthoringEdgeCasesAndPlayerGuardRails() {
        ManagedCodeTps.TpsCompilationResult source = ManagedCodeTps.TpsRuntime.compileTps("""
            ## [Signal|focused]
            ### [Body]
            [180WPM][slow]*beta*[/slow][normal]**gamma**[/normal][/180WPM] [phonetic:ˈkæməl]camel[/phonetic] literal \\/ slash \\[tag\\]
            """);
        assertTrue(source.ok(), "source authoring should compile");
        List<ManagedCodeTps.CompiledWord> words = spokenWords(source.script());
        assertEquals(144, words.stream().filter(word -> "beta".equals(word.cleanText())).findFirst().orElseThrow().metadata().speedOverride(), "beta speed override");
        assertEquals(1, words.stream().filter(word -> "beta".equals(word.cleanText())).findFirst().orElseThrow().metadata().emphasisLevel(), "beta emphasis");
        assertEquals(180, words.stream().filter(word -> "gamma".equals(word.cleanText())).findFirst().orElseThrow().metadata().speedOverride(), "gamma speed override");
        assertEquals(2, words.stream().filter(word -> "gamma".equals(word.cleanText())).findFirst().orElseThrow().metadata().emphasisLevel(), "gamma emphasis");
        assertEquals("ˈkæməl", words.stream().filter(word -> "camel".equals(word.cleanText())).findFirst().orElseThrow().metadata().phoneticGuide(), "phonetic guide");
        assertTrue(words.stream().anyMatch(word -> "/".equals(word.cleanText())), "slash literal");
        assertTrue(words.stream().anyMatch(word -> "[tag]".equals(word.cleanText())), "escaped tag literal");

        ManagedCodeTps.TpsCompilationResult malformed = ManagedCodeTps.TpsRuntime.compileTps("""
            ## [Broken|260WPM|Mystery]

            ### [Body]
            [unknown]tag[/unknown] [edit_point:critical] [slow]dangling
            """);
        assertTrue(!malformed.ok(), "malformed authoring should fail");
        assertEquals(
            List.of("invalid-wpm", "invalid-header-parameter", "unknown-tag", "invalid-tag-argument", "unclosed-tag"),
            malformed.diagnostics().stream().map(ManagedCodeTps.TpsDiagnostic::code).toList(),
            "malformed diagnostics"
        );
        assertTrue(spokenWords(malformed.script()).stream().anyMatch(word -> word.cleanText().contains("[unknown]tag[/unknown]")), "unknown tag stays literal");

        ManagedCodeTps.TpsCompilationResult punctuation = ManagedCodeTps.TpsRuntime.compileTps("""
            ## [Signal|neutral]
            ### [Body]
            A/b stays literal. [emphasis]Done[/emphasis], / dash - restored.
            """);
        List<String> punctuationWords = spokenWords(punctuation.script()).stream().map(ManagedCodeTps.CompiledWord::cleanText).toList();
        assertTrue(punctuationWords.contains("A/b"), "slash word literal");
        assertTrue(punctuationWords.contains("Done,"), "punctuation attached");
        assertTrue(punctuationWords.contains("dash -"), "dash suffix");
        assertEquals(1L, punctuation.script().words().stream().filter(word -> "pause".equals(word.kind())).count(), "single pause marker");

        ManagedCodeTps.TpsCompilationResult empty = ManagedCodeTps.TpsRuntime.compileTps("");
        assertTrue(empty.ok(), "empty source should compile");
        assertEquals(-1, new ManagedCodeTps.TpsPlayer(empty.script()).getState(0).currentWordIndex(), "empty player state");

        ManagedCodeTps.TpsPlayer player = new ManagedCodeTps.TpsPlayer(source.script());
        assertEquals(0, player.seek(0).elapsedMs(), "seek zero");
        assertThrows(IllegalArgumentException.class, () -> player.enumerateStates(0), "enumerateStates should reject zero step");
    }

    private static void testCompiledJsonGuardsAndPlaybackLifecycle() throws Exception {
        ManagedCodeTps.TpsCompilationResult compiled = ManagedCodeTps.TpsRuntime.compileTps("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.\n## [Wrap]\n### [Body]\nDone.");
        Map<String, Object> canonicalTransport = castMap(new JsonReader(readFixture("transport/runtime-parity.compiled.json")).read());

        assertThrows(IllegalArgumentException.class, () -> ManagedCodeTps.parseCompiledScriptJson(""), "empty compiled JSON");
        assertThrows(IllegalArgumentException.class, () -> ManagedCodeTps.parseCompiledScriptJson("[]"), "array compiled JSON");

        Map<String, Object> invalidTransport = new LinkedHashMap<>(canonicalTransport);
        invalidTransport.put("segments", List.of());
        assertThrows(IllegalArgumentException.class, () -> ManagedCodeTps.parseCompiledScriptJson(Json.write(invalidTransport)), "missing segments");

        ManagedCodeTps.TpsPlaybackSession session = new ManagedCodeTps.TpsPlaybackSession(compiled.script(), new ManagedCodeTps.TpsPlaybackSessionOptions(10, null, null, -10, false));
        ManagedCodeTps.TpsStandalonePlayer standalone = ManagedCodeTps.TpsStandalonePlayer.fromCompiledJson(Json.write(canonicalTransport));
        try {
            List<String> statuses = new ArrayList<>();
            List<String> words = new ArrayList<>();
            List<ManagedCodeTps.TpsPlaybackSnapshot> snapshots = new ArrayList<>();
            Consumer<Object> statusListener = event -> statuses.add(castMap(event).get("status").toString());
            Consumer<Object> wordListener = event -> words.add(((ManagedCodeTps.PlayerState) castMap(event).get("state")).currentWord() == null ? "" : ((ManagedCodeTps.PlayerState) castMap(event).get("state")).currentWord().cleanText());

            Runnable removeStatus = session.on("statusChanged", statusListener);
            Runnable removeWord = session.on("wordChanged", wordListener);
            Runnable removeSnapshot = session.observeSnapshot(snapshot -> snapshots.add(snapshot));

            assertEquals(0, session.seek(0).elapsedMs(), "seek zero");
            assertEquals(ManagedCodeTps.TpsPlaybackStatus.IDLE, session.status(), "idle status");
            assertEquals("Close", session.nextBlock().currentBlock().name(), "next block");
            assertEquals("Lead", session.previousBlock().currentBlock().name(), "previous block");
            assertEquals("Now.", session.nextWord().currentWord().cleanText(), "next word");
            assertEquals("Ready.", session.previousWord().currentWord().cleanText(), "previous word");
            assertEquals(150, session.increaseSpeed(20).tempo().effectiveBaseWpm(), "increase speed");
            assertEquals("Ready.", session.pause().currentWord().cleanText(), "pause from idle returns current word");
            assertEquals(0, session.stop().elapsedMs(), "stop resets elapsed");

            removeStatus.run();
            removeWord.run();
            removeSnapshot.run();

            CountDownLatch completed = new CountDownLatch(1);
            Runnable removeCompleted = session.on("completed", ignored -> completed.countDown());
            session.play();
            assertTrue(completed.await(3, TimeUnit.SECONDS), "session should complete after replay");
            removeCompleted.run();

            assertEquals(ManagedCodeTps.TpsPlaybackStatus.COMPLETED, session.status(), "completed status");
            assertEquals("Call to Action", standalone.snapshot().state().currentSegment().name(), "standalone restore");
            assertTrue(!statuses.isEmpty(), "statuses should be observed");
            assertTrue(words.contains("Ready."), "word change observed");
            assertEquals("Ready.", snapshots.get(0).state().currentWord().cleanText(), "initial snapshot");
        } finally {
            session.close();
            standalone.close();
        }
    }

    private static void testPlaybackNavigationAndTimer() throws InterruptedException {
        ManagedCodeTps.TpsCompilationResult compilation = ManagedCodeTps.TpsRuntime.compileTps("## [Signal]\n### [Body]\nReady now.");
        ManagedCodeTps.TpsPlaybackSession session = new ManagedCodeTps.TpsPlaybackSession(compilation.script(), new ManagedCodeTps.TpsPlaybackSessionOptions(10, null, null, null, false));
        try {
            assertEquals("Ready", session.snapshot().state().currentWord().cleanText(), "initial word");
            session.nextWord();
            assertEquals("now.", session.snapshot().state().currentWord().cleanText(), "nextWord");
            session.previousWord();
            assertEquals("Ready", session.snapshot().state().currentWord().cleanText(), "previousWord");
            session.increaseSpeed(20);
            assertEquals(160, session.snapshot().tempo().effectiveBaseWpm(), "increaseSpeed");
            CountDownLatch latch = new CountDownLatch(1);
            session.on("completed", ignored -> latch.countDown());
            session.play();
            assertTrue(latch.await(3, TimeUnit.SECONDS), "playback should complete");
            assertEquals(ManagedCodeTps.TpsPlaybackStatus.COMPLETED, session.status(), "status after completion");
        } finally {
            session.dispose();
        }
    }

    private static void testLargeGeneratedScript() {
        StringBuilder builder = new StringBuilder();
        builder.append("---\nbase_wpm: 140\n---\n\n");
        for (int segmentIndex = 1; segmentIndex <= 8; segmentIndex += 1) {
            builder.append("## [Segment ").append(segmentIndex).append("|focused|Speaker:Host]\n");
            for (int blockIndex = 1; blockIndex <= 10; blockIndex += 1) {
                builder.append("### [Block ").append(blockIndex).append("|150WPM]\n");
                for (int sentenceIndex = 1; sentenceIndex <= 6; sentenceIndex += 1) {
                    builder.append("[slow]Generated[/slow] script segment ").append(segmentIndex).append(" block ").append(blockIndex).append(" sentence ").append(sentenceIndex).append(" for performance coverage. //\n");
                }
                builder.append("[pause:1s]\n");
            }
        }
        ManagedCodeTps.TpsCompilationResult result = ManagedCodeTps.TpsRuntime.compileTps(builder.toString());
        assertTrue(result.ok(), "large script should compile");
        assertTrue(result.script().words().size() > 2000, "large script should contain many words");
        ManagedCodeTps.TpsPlayer player = new ManagedCodeTps.TpsPlayer(result.script());
        List<ManagedCodeTps.PlayerState> checkpoints = player.enumerateStates(Math.max(1, result.script().totalDurationMs() / 10));
        assertEquals("Segment 1", checkpoints.get(0).currentSegment().name(), "large script first segment");
        assertTrue(checkpoints.get(checkpoints.size() - 1).isComplete(), "large script should complete");
    }

    private static Map<String, Object> normalizeExampleSnapshot(String fileName, ManagedCodeTps.CompiledScript script) {
        ManagedCodeTps.TpsPlayer player = new ManagedCodeTps.TpsPlayer(script);
        ManagedCodeTps.TpsPlaybackSession session = new ManagedCodeTps.TpsPlaybackSession(script);
        ManagedCodeTps.TpsStandalonePlayer standalone = ManagedCodeTps.TpsStandalonePlayer.fromCompiledScript(script);
        try {
            List<Map<String, Object>> checkpoints = new ArrayList<>();
            for (Checkpoint checkpoint : checkpointTimes(script.totalDurationMs())) {
                checkpoints.add(normalizePlayerState(checkpoint.label(), player.getState(checkpoint.elapsedMs())));
            }
            Map<String, Object> playback = new LinkedHashMap<>();
            playback.put("session", playbackSequence(session));
            playback.put("standalone", playbackSequence(standalone));
            return Map.of(
                "fileName", fileName,
                "source", "examples/" + fileName,
                "compiled", normalizeCompiledSnapshot(script),
                "player", Map.of("checkpoints", checkpoints),
                "playback", playback
            );
        } finally {
            session.dispose();
            standalone.dispose();
        }
    }

    private static List<Checkpoint> checkpointTimes(int totalDurationMs) {
        List<Checkpoint> raw = List.of(
            new Checkpoint("start", 0),
            new Checkpoint("quarter", (int) Math.round(totalDurationMs * 0.25D)),
            new Checkpoint("middle", (int) Math.round(totalDurationMs * 0.5D)),
            new Checkpoint("threeQuarter", (int) Math.round(totalDurationMs * 0.75D)),
            new Checkpoint("complete", totalDurationMs)
        );
        Set<Integer> seen = new LinkedHashSet<>();
        List<Checkpoint> checkpoints = new ArrayList<>();
        for (Checkpoint checkpoint : raw) {
            if (seen.add(checkpoint.elapsedMs())) {
                checkpoints.add(checkpoint);
            }
        }
        return List.copyOf(checkpoints);
    }

    private record Checkpoint(String label, int elapsedMs) {
    }

    private static Map<String, Object> normalizeCompiledSnapshot(ManagedCodeTps.CompiledScript script) {
        return Map.of(
            "metadata", new LinkedHashMap<>(script.metadata()),
            "totalDurationMs", script.totalDurationMs(),
            "segments", script.segments().stream().map(ManagedCodeTpsTests::normalizeSegment).toList(),
            "words", script.words().stream().map(ManagedCodeTpsTests::normalizeWord).toList()
        );
    }

    private static Map<String, Object> normalizeSegment(ManagedCodeTps.CompiledSegment segment) {
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "id", segment.id());
        putCompact(result, "name", segment.name());
        putCompact(result, "targetWpm", segment.targetWpm());
        putCompact(result, "emotion", segment.emotion());
        putCompact(result, "speaker", segment.speaker());
        putCompact(result, "timing", segment.timing());
        putCompact(result, "backgroundColor", segment.backgroundColor());
        putCompact(result, "textColor", segment.textColor());
        putCompact(result, "accentColor", segment.accentColor());
        putCompact(result, "startWordIndex", segment.startWordIndex());
        putCompact(result, "endWordIndex", segment.endWordIndex());
        putCompact(result, "startMs", segment.startMs());
        putCompact(result, "endMs", segment.endMs());
        putCompact(result, "wordIds", segment.words().stream().map(ManagedCodeTps.CompiledWord::id).toList());
        putCompact(result, "blocks", segment.blocks().stream().map(ManagedCodeTpsTests::normalizeBlock).toList());
        return result;
    }

    private static Map<String, Object> normalizeBlock(ManagedCodeTps.CompiledBlock block) {
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "id", block.id());
        putCompact(result, "name", block.name());
        putCompact(result, "targetWpm", block.targetWpm());
        putCompact(result, "emotion", block.emotion());
        putCompact(result, "speaker", block.speaker());
        putCompact(result, "isImplicit", block.isImplicit());
        putCompact(result, "startWordIndex", block.startWordIndex());
        putCompact(result, "endWordIndex", block.endWordIndex());
        putCompact(result, "startMs", block.startMs());
        putCompact(result, "endMs", block.endMs());
        putCompact(result, "wordIds", block.words().stream().map(ManagedCodeTps.CompiledWord::id).toList());
        putCompact(result, "phrases", block.phrases().stream().map(ManagedCodeTpsTests::normalizePhrase).toList());
        return result;
    }

    private static Map<String, Object> normalizePhrase(ManagedCodeTps.CompiledPhrase phrase) {
        return Map.of(
            "id", phrase.id(),
            "text", phrase.text(),
            "startWordIndex", phrase.startWordIndex(),
            "endWordIndex", phrase.endWordIndex(),
            "startMs", phrase.startMs(),
            "endMs", phrase.endMs(),
            "wordIds", phrase.words().stream().map(ManagedCodeTps.CompiledWord::id).toList()
        );
    }

    private static Map<String, Object> normalizeWord(ManagedCodeTps.CompiledWord word) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        putCompact(metadata, "isEmphasis", word.metadata().isEmphasis());
        putCompact(metadata, "emphasisLevel", word.metadata().emphasisLevel());
        putCompact(metadata, "isPause", word.metadata().isPause());
        putCompact(metadata, "pauseDurationMs", word.metadata().pauseDurationMs());
        putCompact(metadata, "isHighlight", word.metadata().isHighlight());
        putCompact(metadata, "isBreath", word.metadata().isBreath());
        putCompact(metadata, "isEditPoint", word.metadata().isEditPoint());
        putCompact(metadata, "editPointPriority", word.metadata().editPointPriority());
        putCompact(metadata, "emotionHint", word.metadata().emotionHint());
        putCompact(metadata, "inlineEmotionHint", word.metadata().inlineEmotionHint());
        putCompact(metadata, "volumeLevel", word.metadata().volumeLevel());
        putCompact(metadata, "deliveryMode", word.metadata().deliveryMode());
        putCompact(metadata, "phoneticGuide", word.metadata().phoneticGuide());
        putCompact(metadata, "pronunciationGuide", word.metadata().pronunciationGuide());
        putCompact(metadata, "stressText", word.metadata().stressText());
        putCompact(metadata, "stressGuide", word.metadata().stressGuide());
        putCompact(metadata, "speedOverride", word.metadata().speedOverride());
        putCompact(metadata, "speedMultiplier", normalizeNumber(word.metadata().speedMultiplier()));
        putCompact(metadata, "speaker", word.metadata().speaker());
        putCompact(metadata, "headCue", word.metadata().headCue());
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "id", word.id());
        putCompact(result, "index", word.index());
        putCompact(result, "kind", word.kind());
        putCompact(result, "cleanText", word.cleanText());
        putCompact(result, "characterCount", word.characterCount());
        putCompact(result, "orpPosition", word.orpPosition());
        putCompact(result, "displayDurationMs", word.displayDurationMs());
        putCompact(result, "startMs", word.startMs());
        putCompact(result, "endMs", word.endMs());
        putCompact(result, "metadata", metadata);
        putCompact(result, "segmentId", word.segmentId());
        putCompact(result, "blockId", word.blockId());
        putCompact(result, "phraseId", word.phraseId());
        return result;
    }

    private static Map<String, Object> normalizePlayerState(String label, ManagedCodeTps.PlayerState state) {
        Map<String, Object> presentation = new LinkedHashMap<>();
        putCompact(presentation, "segmentName", state.presentation().segmentName());
        putCompact(presentation, "blockName", state.presentation().blockName());
        putCompact(presentation, "phraseText", state.presentation().phraseText());
        putCompact(presentation, "visibleWordIds", state.presentation().visibleWords().stream().map(ManagedCodeTps.CompiledWord::id).toList());
        putCompact(presentation, "visibleWordTexts", state.presentation().visibleWords().stream().map(ManagedCodeTps.CompiledWord::cleanText).toList());
        putCompact(presentation, "activeWordInPhrase", state.presentation().activeWordInPhrase());
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "label", label);
        putCompact(result, "elapsedMs", state.elapsedMs());
        putCompact(result, "remainingMs", state.remainingMs());
        putCompact(result, "progress", normalizeNumber(state.progress()));
        putCompact(result, "isComplete", state.isComplete());
        putCompact(result, "currentWordIndex", state.currentWordIndex());
        putCompact(result, "currentWordId", state.currentWord() == null ? null : state.currentWord().id());
        putCompact(result, "currentWordText", state.currentWord() == null ? null : state.currentWord().cleanText());
        putCompact(result, "currentWordKind", state.currentWord() == null ? null : state.currentWord().kind());
        putCompact(result, "previousWordId", state.previousWord() == null ? null : state.previousWord().id());
        putCompact(result, "nextWordId", state.nextWord() == null ? null : state.nextWord().id());
        putCompact(result, "currentSegmentId", state.currentSegment() == null ? null : state.currentSegment().id());
        putCompact(result, "currentBlockId", state.currentBlock() == null ? null : state.currentBlock().id());
        putCompact(result, "currentPhraseId", state.currentPhrase() == null ? null : state.currentPhrase().id());
        putCompact(result, "nextTransitionMs", state.nextTransitionMs());
        putCompact(result, "presentation", presentation);
        return result;
    }

    private static List<Map<String, Object>> playbackSequence(ManagedCodeTps.TpsPlaybackSession controller) {
        List<Map<String, Object>> snapshots = new ArrayList<>();
        snapshots.add(normalizePlaybackSnapshot("initial", controller.snapshot()));
        controller.nextWord();
        snapshots.add(normalizePlaybackSnapshot("afterNextWord", controller.snapshot()));
        controller.previousWord();
        snapshots.add(normalizePlaybackSnapshot("afterPreviousWord", controller.snapshot()));
        controller.nextBlock();
        snapshots.add(normalizePlaybackSnapshot("afterNextBlock", controller.snapshot()));
        controller.previousBlock();
        snapshots.add(normalizePlaybackSnapshot("afterPreviousBlock", controller.snapshot()));
        controller.increaseSpeed();
        snapshots.add(normalizePlaybackSnapshot("afterIncreaseSpeed", controller.snapshot()));
        controller.decreaseSpeed(controller.snapshot().tempo().speedStepWpm());
        snapshots.add(normalizePlaybackSnapshot("afterDecreaseSpeed", controller.snapshot()));
        return List.copyOf(snapshots);
    }

    private static List<Map<String, Object>> playbackSequence(ManagedCodeTps.TpsStandalonePlayer controller) {
        List<Map<String, Object>> snapshots = new ArrayList<>();
        snapshots.add(normalizePlaybackSnapshot("initial", controller.snapshot()));
        controller.nextWord();
        snapshots.add(normalizePlaybackSnapshot("afterNextWord", controller.snapshot()));
        controller.previousWord();
        snapshots.add(normalizePlaybackSnapshot("afterPreviousWord", controller.snapshot()));
        controller.nextBlock();
        snapshots.add(normalizePlaybackSnapshot("afterNextBlock", controller.snapshot()));
        controller.previousBlock();
        snapshots.add(normalizePlaybackSnapshot("afterPreviousBlock", controller.snapshot()));
        controller.increaseSpeed();
        snapshots.add(normalizePlaybackSnapshot("afterIncreaseSpeed", controller.snapshot()));
        controller.decreaseSpeed(controller.snapshot().tempo().speedStepWpm());
        snapshots.add(normalizePlaybackSnapshot("afterDecreaseSpeed", controller.snapshot()));
        return List.copyOf(snapshots);
    }

    private static Map<String, Object> normalizePlaybackSnapshot(String label, ManagedCodeTps.TpsPlaybackSnapshot snapshot) {
        Map<String, Object> tempo = new LinkedHashMap<>();
        putCompact(tempo, "baseWpm", snapshot.tempo().baseWpm());
        putCompact(tempo, "effectiveBaseWpm", snapshot.tempo().effectiveBaseWpm());
        putCompact(tempo, "speedOffsetWpm", snapshot.tempo().speedOffsetWpm());
        putCompact(tempo, "speedStepWpm", snapshot.tempo().speedStepWpm());
        putCompact(tempo, "playbackRate", normalizeNumber(snapshot.tempo().playbackRate()));
        Map<String, Object> controls = Map.of(
            "canPlay", snapshot.controls().canPlay(),
            "canPause", snapshot.controls().canPause(),
            "canStop", snapshot.controls().canStop(),
            "canNextWord", snapshot.controls().canNextWord(),
            "canPreviousWord", snapshot.controls().canPreviousWord(),
            "canNextBlock", snapshot.controls().canNextBlock(),
            "canPreviousBlock", snapshot.controls().canPreviousBlock(),
            "canIncreaseSpeed", snapshot.controls().canIncreaseSpeed(),
            "canDecreaseSpeed", snapshot.controls().canDecreaseSpeed()
        );
        List<Map<String, Object>> visibleWords = snapshot.visibleWords().stream().map(word -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            putCompact(entry, "id", word.word().id());
            putCompact(entry, "text", word.word().cleanText());
            putCompact(entry, "isActive", word.isActive());
            putCompact(entry, "isRead", word.isRead());
            putCompact(entry, "isUpcoming", word.isUpcoming());
            putCompact(entry, "emotion", word.emotion());
            putCompact(entry, "speaker", word.speaker());
            putCompact(entry, "emphasisLevel", word.emphasisLevel());
            putCompact(entry, "isHighlighted", word.isHighlighted());
            putCompact(entry, "deliveryMode", word.deliveryMode());
            putCompact(entry, "volumeLevel", word.volumeLevel());
            return entry;
        }).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "label", label);
        putCompact(result, "status", snapshot.status().wire());
        putCompact(result, "state", normalizePlayerState("state", snapshot.state()));
        putCompact(result, "tempo", tempo);
        putCompact(result, "controls", controls);
        putCompact(result, "focusedWordId", snapshot.focusedWord() == null ? null : snapshot.focusedWord().word().id());
        putCompact(result, "focusedWordText", snapshot.focusedWord() == null ? null : snapshot.focusedWord().word().cleanText());
        putCompact(result, "currentWordDurationMs", snapshot.currentWordDurationMs());
        putCompact(result, "currentWordRemainingMs", snapshot.currentWordRemainingMs());
        putCompact(result, "currentSegmentIndex", snapshot.currentSegmentIndex());
        putCompact(result, "currentBlockIndex", snapshot.currentBlockIndex());
        putCompact(result, "visibleWords", visibleWords);
        return result;
    }

    private static Object normalizeNumber(Double value) {
        if (value == null) return null;
        double rounded = Math.round(value * 1_000_000D) / 1_000_000D;
        return rounded;
    }

    private static String readFixture(String relativePath) throws IOException {
        return Files.readString(FIXTURES.resolve(relativePath));
    }

    private static String readExample(String fileName) throws IOException {
        return Files.readString(EXAMPLES.resolve(fileName));
    }

    private static List<ManagedCodeTps.CompiledWord> spokenWords(ManagedCodeTps.CompiledScript script) {
        return script.words().stream().filter(word -> "word".equals(word.kind())).toList();
    }

    private static String canonicalJson(String json) {
        return Json.write(new JsonReader(json).read());
    }

    private static void putCompact(Map<String, Object> map, String key, Object value) {
        if (value != null) map.put(key, value);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private static List<Object> castList(Object value) {
        return (List<Object>) value;
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    private static void assertEquals(Object expected, Object actual, String message) {
        if (!Objects.equals(expected, actual)) {
            throw new AssertionError(message + "\nExpected: " + expected + "\nActual:   " + actual);
        }
    }

    private static void assertThrows(Class<? extends Throwable> expectedType, ThrowingRunnable action, String message) {
        try {
            action.run();
        } catch (Throwable error) {
            if (expectedType.isInstance(error)) {
                return;
            }
            throw new AssertionError(message + "\nExpected exception: " + expectedType.getName() + "\nActual exception:   " + error.getClass().getName(), error);
        }
        throw new AssertionError(message + "\nExpected exception: " + expectedType.getName());
    }

    @FunctionalInterface
    private interface ThrowingRunnable {
        void run() throws Exception;
    }

    private static final class Json {
        private static String write(Object value) {
            StringBuilder builder = new StringBuilder();
            writeValue(builder, value);
            return builder.toString();
        }

        private static void writeValue(StringBuilder builder, Object value) {
            if (value == null) builder.append("null");
            else if (value instanceof String string) builder.append('"').append(escape(string)).append('"');
            else if (value instanceof Boolean || value instanceof Integer || value instanceof Long) builder.append(value);
            else if (value instanceof Double number) builder.append(Double.isFinite(number) ? normalizeJsonNumber(number) : "null");
            else if (value instanceof Map<?, ?> map) {
                builder.append('{');
                boolean first = true;
                List<String> keys = new ArrayList<>();
                for (Object key : map.keySet()) keys.add(key.toString());
                keys.sort(String::compareTo);
                for (String key : keys) {
                    if (!first) builder.append(',');
                    first = false;
                    builder.append('"').append(escape(key)).append('"').append(':');
                    writeValue(builder, map.get(key));
                }
                builder.append('}');
            } else if (value instanceof List<?> list) {
                builder.append('[');
                boolean first = true;
                for (Object item : list) {
                    if (!first) builder.append(',');
                    first = false;
                    writeValue(builder, item);
                }
                builder.append(']');
            } else builder.append('"').append(escape(value.toString())).append('"');
        }

        private static String escape(String value) {
            return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
        }

        private static String normalizeJsonNumber(double value) {
            long integer = Math.round(value);
            if (Math.abs(value - integer) < 0.0000001D) return Long.toString(integer);
            return Double.toString((Math.round(value * 1_000_000D)) / 1_000_000D);
        }
    }

    private static final class JsonReader {
        private final String text;
        private int index = 0;

        private JsonReader(String text) {
            this.text = text;
        }

        private Object read() {
            skipWhitespace();
            Object value = readValue();
            skipWhitespace();
            if (index != text.length()) throw new IllegalArgumentException("Unexpected trailing JSON content.");
            return value;
        }

        private Object readValue() {
            skipWhitespace();
            if (index >= text.length()) throw new IllegalArgumentException("Unexpected end of JSON.");
            char current = text.charAt(index);
            return switch (current) {
                case '{' -> readObject();
                case '[' -> readArray();
                case '"' -> readString();
                case 't' -> readLiteral("true", true);
                case 'f' -> readLiteral("false", false);
                case 'n' -> readLiteral("null", null);
                default -> readNumber();
            };
        }

        private Map<String, Object> readObject() {
            index += 1;
            skipWhitespace();
            Map<String, Object> map = new LinkedHashMap<>();
            if (peek('}')) { index += 1; return map; }
            while (true) {
                String key = readString();
                skipWhitespace();
                expect(':');
                map.put(key, readValue());
                skipWhitespace();
                if (peek('}')) { index += 1; return map; }
                expect(',');
            }
        }

        private List<Object> readArray() {
            index += 1;
            skipWhitespace();
            List<Object> list = new ArrayList<>();
            if (peek(']')) { index += 1; return list; }
            while (true) {
                list.add(readValue());
                skipWhitespace();
                if (peek(']')) { index += 1; return list; }
                expect(',');
            }
        }

        private String readString() {
            expect('"');
            StringBuilder builder = new StringBuilder();
            while (index < text.length()) {
                char current = text.charAt(index++);
                if (current == '"') return builder.toString();
                if (current == '\\') {
                    char escaped = text.charAt(index++);
                    builder.append(switch (escaped) {
                        case '"', '\\', '/' -> escaped;
                        case 'b' -> '\b';
                        case 'f' -> '\f';
                        case 'n' -> '\n';
                        case 'r' -> '\r';
                        case 't' -> '\t';
                        case 'u' -> (char) Integer.parseInt(text.substring(index, index += 4), 16);
                        default -> throw new IllegalArgumentException("Unsupported escape sequence.");
                    });
                } else builder.append(current);
            }
            throw new IllegalArgumentException("Unterminated JSON string.");
        }

        private Object readNumber() {
            int start = index;
            if (peek('-')) index += 1;
            while (index < text.length() && Character.isDigit(text.charAt(index))) index += 1;
            boolean isDouble = false;
            if (peek('.')) {
                isDouble = true;
                index += 1;
                while (index < text.length() && Character.isDigit(text.charAt(index))) index += 1;
            }
            if (peek('e') || peek('E')) {
                isDouble = true;
                index += 1;
                if (peek('+') || peek('-')) index += 1;
                while (index < text.length() && Character.isDigit(text.charAt(index))) index += 1;
            }
            String value = text.substring(start, index);
            return isDouble ? Double.parseDouble(value) : Integer.parseInt(value);
        }

        private Object readLiteral(String literal, Object value) {
            if (!text.startsWith(literal, index)) throw new IllegalArgumentException("Invalid JSON literal.");
            index += literal.length();
            return value;
        }

        private void skipWhitespace() {
            while (index < text.length() && Character.isWhitespace(text.charAt(index))) index += 1;
        }

        private void expect(char expected) {
            skipWhitespace();
            if (index >= text.length() || text.charAt(index) != expected) throw new IllegalArgumentException("Expected '" + expected + "'.");
            index += 1;
        }

        private boolean peek(char expected) {
            return index < text.length() && text.charAt(index) == expected;
        }
    }
}
