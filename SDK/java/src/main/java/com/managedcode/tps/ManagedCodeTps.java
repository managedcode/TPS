package com.managedcode.tps;

import java.io.Closeable;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import java.util.regex.Pattern;

public final class ManagedCodeTps {
    private ManagedCodeTps() {
    }

    public static final class TpsFrontMatterKeys {
        public static final String TITLE = "title";
        public static final String PROFILE = "profile";
        public static final String DURATION = "duration";
        public static final String BASE_WPM = "base_wpm";
        public static final String AUTHOR = "author";
        public static final String CREATED = "created";
        public static final String VERSION = "version";
        public static final String SPEED_OFFSETS_XSLOW = "speed_offsets.xslow";
        public static final String SPEED_OFFSETS_SLOW = "speed_offsets.slow";
        public static final String SPEED_OFFSETS_FAST = "speed_offsets.fast";
        public static final String SPEED_OFFSETS_XFAST = "speed_offsets.xfast";

        private TpsFrontMatterKeys() {
        }
    }

    public static final class TpsTags {
        public static final String ASIDE = "aside";
        public static final String BREATH = "breath";
        public static final String BUILDING = "building";
        public static final String EDIT_POINT = "edit_point";
        public static final String EMPHASIS = "emphasis";
        public static final String FAST = "fast";
        public static final String HIGHLIGHT = "highlight";
        public static final String LOUD = "loud";
        public static final String NORMAL = "normal";
        public static final String PAUSE = "pause";
        public static final String PHONETIC = "phonetic";
        public static final String PRONUNCIATION = "pronunciation";
        public static final String RHETORICAL = "rhetorical";
        public static final String SARCASM = "sarcasm";
        public static final String SLOW = "slow";
        public static final String SOFT = "soft";
        public static final String STRESS = "stress";
        public static final String WHISPER = "whisper";
        public static final String XFAST = "xfast";
        public static final String XSLOW = "xslow";
        public static final String ENERGY = "energy";
        public static final String LEGATO = "legato";
        public static final String MELODY = "melody";
        public static final String STACCATO = "staccato";

        private TpsTags() {
        }
    }

    public static final class TpsDiagnosticCodes {
        public static final String INVALID_FRONT_MATTER = "invalid-front-matter";
        public static final String INVALID_HEADER = "invalid-header";
        public static final String INVALID_HEADER_PARAMETER = "invalid-header-parameter";
        public static final String UNTERMINATED_TAG = "unterminated-tag";
        public static final String UNKNOWN_TAG = "unknown-tag";
        public static final String INVALID_PAUSE = "invalid-pause";
        public static final String INVALID_TAG_ARGUMENT = "invalid-tag-argument";
        public static final String INVALID_WPM = "invalid-wpm";
        public static final String MISMATCHED_CLOSING_TAG = "mismatched-closing-tag";
        public static final String UNCLOSED_TAG = "unclosed-tag";
        public static final String INVALID_ENERGY_LEVEL = "invalid-energy-level";
        public static final String INVALID_MELODY_LEVEL = "invalid-melody-level";
        public static final String UNKNOWN_ARCHETYPE = "unknown-archetype";

        private TpsDiagnosticCodes() {
        }
    }

    public static final class TpsSpec {
        public static final int DEFAULT_BASE_WPM = 140;
        public static final String DEFAULT_EMOTION = "neutral";
        public static final String DEFAULT_IMPLICIT_SEGMENT_NAME = "Content";
        public static final String DEFAULT_PROFILE = "Actor";
        public static final int MINIMUM_WPM = 80;
        public static final int MAXIMUM_WPM = 220;
        public static final int SHORT_PAUSE_DURATION_MS = 300;
        public static final int MEDIUM_PAUSE_DURATION_MS = 600;
        public static final String SPEAKER_PREFIX = "Speaker:";
        public static final String ARCHETYPE_PREFIX = "Archetype:";
        public static final String WPM_SUFFIX = "WPM";
        public static final List<String> EMOTIONS = List.of("neutral", "warm", "professional", "focused", "concerned", "urgent", "motivational", "excited", "happy", "sad", "calm", "energetic");
        public static final List<String> VOLUME_LEVELS = List.of(TpsTags.LOUD, TpsTags.SOFT, TpsTags.WHISPER);
        public static final List<String> DELIVERY_MODES = List.of(TpsTags.SARCASM, TpsTags.ASIDE, TpsTags.RHETORICAL, TpsTags.BUILDING);
        public static final List<String> ARTICULATION_STYLES = List.of(TpsTags.LEGATO, TpsTags.STACCATO);
        public static final List<String> RELATIVE_SPEED_TAGS = List.of(TpsTags.XSLOW, TpsTags.SLOW, TpsTags.FAST, TpsTags.XFAST, TpsTags.NORMAL);
        public static final List<String> EDIT_POINT_PRIORITIES = List.of("high", "medium", "low");
        public static final String ARCHETYPE_FRIEND = "friend";
        public static final String ARCHETYPE_MOTIVATOR = "motivator";
        public static final String ARCHETYPE_EDUCATOR = "educator";
        public static final String ARCHETYPE_COACH = "coach";
        public static final String ARCHETYPE_STORYTELLER = "storyteller";
        public static final String ARCHETYPE_ENTERTAINER = "entertainer";

        public static final List<String> ARCHETYPES = List.of(ARCHETYPE_FRIEND, ARCHETYPE_MOTIVATOR, ARCHETYPE_EDUCATOR, ARCHETYPE_COACH, ARCHETYPE_STORYTELLER, ARCHETYPE_ENTERTAINER);
        public static final Map<String, Integer> ARCHETYPE_RECOMMENDED_WPM = Map.of(
            ARCHETYPE_FRIEND, 135,
            ARCHETYPE_MOTIVATOR, 155,
            ARCHETYPE_EDUCATOR, 120,
            ARCHETYPE_COACH, 145,
            ARCHETYPE_STORYTELLER, 125,
            ARCHETYPE_ENTERTAINER, 150
        );
        public static final int ENERGY_LEVEL_MIN = 1;
        public static final int ENERGY_LEVEL_MAX = 10;
        public static final int MELODY_LEVEL_MIN = 1;
        public static final int MELODY_LEVEL_MAX = 10;
        public static final Map<String, Integer> DEFAULT_SPEED_OFFSETS = Map.of(
            TpsTags.XSLOW, -40,
            TpsTags.SLOW, -20,
            TpsTags.FAST, 25,
            TpsTags.XFAST, 50
        );
        public static final Map<String, Map<String, String>> EMOTION_PALETTES = Map.ofEntries(
            Map.entry("neutral", Map.of("accent", "#2563EB", "text", "#0F172A", "background", "#60A5FA")),
            Map.entry("warm", Map.of("accent", "#EA580C", "text", "#1C1917", "background", "#FDBA74")),
            Map.entry("professional", Map.of("accent", "#1D4ED8", "text", "#0F172A", "background", "#93C5FD")),
            Map.entry("focused", Map.of("accent", "#15803D", "text", "#052E16", "background", "#86EFAC")),
            Map.entry("concerned", Map.of("accent", "#B91C1C", "text", "#1F1111", "background", "#FCA5A5")),
            Map.entry("urgent", Map.of("accent", "#DC2626", "text", "#FFF7F7", "background", "#FCA5A5")),
            Map.entry("motivational", Map.of("accent", "#7C3AED", "text", "#FFFFFF", "background", "#C4B5FD")),
            Map.entry("excited", Map.of("accent", "#DB2777", "text", "#FFF7FB", "background", "#F9A8D4")),
            Map.entry("happy", Map.of("accent", "#D97706", "text", "#1C1917", "background", "#FCD34D")),
            Map.entry("sad", Map.of("accent", "#4F46E5", "text", "#EEF2FF", "background", "#A5B4FC")),
            Map.entry("calm", Map.of("accent", "#0F766E", "text", "#F0FDFA", "background", "#99F6E4")),
            Map.entry("energetic", Map.of("accent", "#C2410C", "text", "#FFF7ED", "background", "#FDBA74"))
        );
        public static final Map<String, String> EMOTION_HEAD_CUES = Map.ofEntries(
            Map.entry("neutral", "H0"), Map.entry("calm", "H0"), Map.entry("professional", "H9"), Map.entry("focused", "H5"),
            Map.entry("motivational", "H9"), Map.entry("urgent", "H4"), Map.entry("concerned", "H1"), Map.entry("sad", "H1"),
            Map.entry("warm", "H7"), Map.entry("happy", "H6"), Map.entry("excited", "H6"), Map.entry("energetic", "H8")
        );

        private TpsSpec() {
        }
    }

    public static final class TpsKeywords {
        public static final Map<String, String> TAGS = Map.ofEntries(
            Map.entry("aside", TpsTags.ASIDE),
            Map.entry("breath", TpsTags.BREATH),
            Map.entry("building", TpsTags.BUILDING),
            Map.entry("editPoint", TpsTags.EDIT_POINT),
            Map.entry("emphasis", TpsTags.EMPHASIS),
            Map.entry("energy", TpsTags.ENERGY),
            Map.entry("fast", TpsTags.FAST),
            Map.entry("highlight", TpsTags.HIGHLIGHT),
            Map.entry("legato", TpsTags.LEGATO),
            Map.entry("loud", TpsTags.LOUD),
            Map.entry("melody", TpsTags.MELODY),
            Map.entry("normal", TpsTags.NORMAL),
            Map.entry("pause", TpsTags.PAUSE),
            Map.entry("phonetic", TpsTags.PHONETIC),
            Map.entry("pronunciation", TpsTags.PRONUNCIATION),
            Map.entry("rhetorical", TpsTags.RHETORICAL),
            Map.entry("sarcasm", TpsTags.SARCASM),
            Map.entry("slow", TpsTags.SLOW),
            Map.entry("soft", TpsTags.SOFT),
            Map.entry("staccato", TpsTags.STACCATO),
            Map.entry("stress", TpsTags.STRESS),
            Map.entry("whisper", TpsTags.WHISPER),
            Map.entry("xfast", TpsTags.XFAST),
            Map.entry("xslow", TpsTags.XSLOW)
        );
        public static final List<String> EMOTIONS = TpsSpec.EMOTIONS;
        public static final List<String> VOLUME_LEVELS = TpsSpec.VOLUME_LEVELS;
        public static final List<String> DELIVERY_MODES = TpsSpec.DELIVERY_MODES;
        public static final List<String> ARTICULATION_STYLES = TpsSpec.ARTICULATION_STYLES;
        public static final List<String> RELATIVE_SPEED_TAGS = TpsSpec.RELATIVE_SPEED_TAGS;
        public static final List<String> EDIT_POINT_PRIORITIES = TpsSpec.EDIT_POINT_PRIORITIES;
        public static final List<String> ARCHETYPES = TpsSpec.ARCHETYPES;

        private TpsKeywords() {
        }
    }

    public enum TpsPlaybackStatus {
        IDLE("idle"),
        PLAYING("playing"),
        PAUSED("paused"),
        COMPLETED("completed");

        private final String wire;

        TpsPlaybackStatus(String wire) {
            this.wire = wire;
        }

        public String wire() {
            return wire;
        }
    }

    public record TpsPosition(int line, int column, int offset) {
    }

    public record TpsRange(TpsPosition start, TpsPosition end) {
    }

    public record TpsDiagnostic(String code, String severity, String message, String suggestion, TpsRange range) {
    }

    public record TpsValidationResult(boolean ok, List<TpsDiagnostic> diagnostics) {
        public TpsValidationResult {
            diagnostics = List.copyOf(diagnostics);
        }
    }

    public record TpsParseResult(boolean ok, List<TpsDiagnostic> diagnostics, TpsDocument document) {
        public TpsParseResult {
            diagnostics = List.copyOf(diagnostics);
        }
    }

    public record TpsCompilationResult(boolean ok, List<TpsDiagnostic> diagnostics, TpsDocument document, CompiledScript script) {
        public TpsCompilationResult {
            diagnostics = List.copyOf(diagnostics);
        }
    }

    public record TpsDocument(Map<String, String> metadata, List<TpsSegment> segments) {
        public TpsDocument {
            metadata = Map.copyOf(metadata);
            segments = List.copyOf(segments);
        }
    }

    public record TpsSegment(
        String id,
        String name,
        String content,
        Integer targetWpm,
        String emotion,
        String speaker,
        String archetype,
        String timing,
        String backgroundColor,
        String textColor,
        String accentColor,
        String leadingContent,
        List<TpsBlock> blocks
    ) {
        public TpsSegment {
            blocks = List.copyOf(blocks);
        }
    }

    public record TpsBlock(String id, String name, String content, Integer targetWpm, String emotion, String speaker, String archetype) {
    }

    public record WordMetadata(
        boolean isEmphasis,
        int emphasisLevel,
        boolean isPause,
        Integer pauseDurationMs,
        boolean isHighlight,
        boolean isBreath,
        boolean isEditPoint,
        String editPointPriority,
        String emotionHint,
        String inlineEmotionHint,
        String volumeLevel,
        String deliveryMode,
        String articulationStyle,
        Integer energyLevel,
        Integer melodyLevel,
        String phoneticGuide,
        String pronunciationGuide,
        String stressText,
        String stressGuide,
        Integer speedOverride,
        Double speedMultiplier,
        String speaker,
        String headCue
    ) {
    }

    public record CompiledWord(
        String id,
        int index,
        String kind,
        String cleanText,
        int characterCount,
        int orpPosition,
        int displayDurationMs,
        int startMs,
        int endMs,
        WordMetadata metadata,
        String segmentId,
        String blockId,
        String phraseId
    ) {
    }

    public record CompiledPhrase(String id, String text, int startWordIndex, int endWordIndex, int startMs, int endMs, List<CompiledWord> words) {
        public CompiledPhrase {
            words = List.copyOf(words);
        }
    }

    public record CompiledBlock(
        String id,
        String name,
        int targetWpm,
        String emotion,
        String speaker,
        String archetype,
        boolean isImplicit,
        int startWordIndex,
        int endWordIndex,
        int startMs,
        int endMs,
        List<CompiledPhrase> phrases,
        List<CompiledWord> words
    ) {
        public CompiledBlock {
            phrases = List.copyOf(phrases);
            words = List.copyOf(words);
        }
    }

    public record CompiledSegment(
        String id,
        String name,
        int targetWpm,
        String emotion,
        String speaker,
        String archetype,
        String timing,
        String backgroundColor,
        String textColor,
        String accentColor,
        int startWordIndex,
        int endWordIndex,
        int startMs,
        int endMs,
        List<CompiledBlock> blocks,
        List<CompiledWord> words
    ) {
        public CompiledSegment {
            blocks = List.copyOf(blocks);
            words = List.copyOf(words);
        }
    }

    public record CompiledScript(Map<String, String> metadata, int totalDurationMs, List<CompiledSegment> segments, List<CompiledWord> words) {
        public CompiledScript {
            metadata = Map.copyOf(metadata);
            segments = List.copyOf(segments);
            words = List.copyOf(words);
        }
    }

    public record PlayerPresentationModel(String segmentName, String blockName, String phraseText, List<CompiledWord> visibleWords, int activeWordInPhrase) {
        public PlayerPresentationModel {
            visibleWords = List.copyOf(visibleWords);
        }
    }

    public record PlayerState(
        int elapsedMs,
        int remainingMs,
        double progress,
        boolean isComplete,
        int currentWordIndex,
        CompiledWord currentWord,
        CompiledWord previousWord,
        CompiledWord nextWord,
        CompiledSegment currentSegment,
        CompiledBlock currentBlock,
        CompiledPhrase currentPhrase,
        Integer nextTransitionMs,
        PlayerPresentationModel presentation
    ) {
    }

    public static final class TpsPlaybackDefaults {
        public static final int DEFAULT_SPEED_STEP_WPM = 10;
        public static final int DEFAULT_TICK_INTERVAL_MS = 16;

        private TpsPlaybackDefaults() {
        }
    }

    public static final class TpsPlaybackEventNames {
        public static final String STATE_CHANGED = "stateChanged";
        public static final String WORD_CHANGED = "wordChanged";
        public static final String PHRASE_CHANGED = "phraseChanged";
        public static final String BLOCK_CHANGED = "blockChanged";
        public static final String SEGMENT_CHANGED = "segmentChanged";
        public static final String STATUS_CHANGED = "statusChanged";
        public static final String COMPLETED = "completed";
        public static final String SNAPSHOT_CHANGED = "snapshotChanged";

        private TpsPlaybackEventNames() {
        }
    }

    public static final class TpsPlaybackSessionOptions {
        public static final TpsPlaybackSessionOptions DEFAULT = new TpsPlaybackSessionOptions(null, null, null, null, false);

        public final Integer tickIntervalMs;
        public final Integer baseWpm;
        public final Integer speedStepWpm;
        public final Integer initialSpeedOffsetWpm;
        public final boolean autoPlay;

        public TpsPlaybackSessionOptions(Integer tickIntervalMs, Integer baseWpm, Integer speedStepWpm, Integer initialSpeedOffsetWpm, boolean autoPlay) {
            this.tickIntervalMs = tickIntervalMs;
            this.baseWpm = baseWpm;
            this.speedStepWpm = speedStepWpm;
            this.initialSpeedOffsetWpm = initialSpeedOffsetWpm;
            this.autoPlay = autoPlay;
        }

        public TpsPlaybackSessionOptions() {
            this(null, null, null, null, false);
        }
    }

    public record TpsPlaybackTempo(int baseWpm, int effectiveBaseWpm, int speedOffsetWpm, int speedStepWpm, double playbackRate) {
    }

    public record TpsPlaybackControls(boolean canPlay, boolean canPause, boolean canStop, boolean canNextWord, boolean canPreviousWord, boolean canNextBlock, boolean canPreviousBlock, boolean canIncreaseSpeed, boolean canDecreaseSpeed) {
    }

    public record TpsPlaybackWordView(CompiledWord word, boolean isActive, boolean isRead, boolean isUpcoming, String emotion, String speaker, int emphasisLevel, boolean isHighlighted, String deliveryMode, String volumeLevel) {
    }

    public record TpsPlaybackSnapshot(
        TpsPlaybackStatus status,
        PlayerState state,
        TpsPlaybackTempo tempo,
        TpsPlaybackControls controls,
        List<TpsPlaybackWordView> visibleWords,
        TpsPlaybackWordView focusedWord,
        Integer currentWordDurationMs,
        Integer currentWordRemainingMs,
        int currentSegmentIndex,
        int currentBlockIndex
    ) {
        public TpsPlaybackSnapshot {
            visibleWords = List.copyOf(visibleWords);
        }
    }

    public static final class TpsRuntime {
        private TpsRuntime() {
        }

        public static TpsValidationResult validateTps(String source) {
            DocumentAnalysis analysis = parseDocument(source);
            List<TpsDiagnostic> diagnostics = new ArrayList<>(analysis.diagnostics);
            compileAnalysis(analysis, diagnostics);
            return new TpsValidationResult(!hasErrors(diagnostics), diagnostics);
        }

        public static TpsParseResult parseTps(String source) {
            DocumentAnalysis analysis = parseDocument(source);
            List<TpsDiagnostic> diagnostics = new ArrayList<>(analysis.diagnostics);
            compileAnalysis(analysis, diagnostics);
            return new TpsParseResult(!hasErrors(diagnostics), diagnostics, analysis.document);
        }

        public static TpsCompilationResult compileTps(String source) {
            DocumentAnalysis analysis = parseDocument(source);
            List<TpsDiagnostic> diagnostics = new ArrayList<>(analysis.diagnostics);
            CompiledScript script = normalizeCompiledScript(compileAnalysis(analysis, diagnostics));
            return new TpsCompilationResult(!hasErrors(diagnostics), diagnostics, analysis.document, script);
        }

        public static String toCompiledJson(CompiledScript script) {
            return Json.write(compiledScriptToTransport(normalizeCompiledScript(script)));
        }

        public static CompiledScript fromCompiledJson(String json) {
            return parseCompiledScriptJson(json);
        }
    }

    public static final class TpsPlayer {
        private final CompiledScript compiledScript;
        private final Map<String, CompiledSegment> segmentById = new HashMap<>();
        private final Map<String, CompiledBlock> blockById = new HashMap<>();
        private final Map<String, CompiledPhrase> phraseById = new HashMap<>();

        public TpsPlayer(CompiledScript compiledScript) {
            this.compiledScript = normalizeCompiledScript(compiledScript);
            for (CompiledSegment segment : this.compiledScript.segments()) {
                segmentById.put(segment.id(), segment);
                for (CompiledBlock block : segment.blocks()) {
                    blockById.put(block.id(), block);
                    for (CompiledPhrase phrase : block.phrases()) {
                        phraseById.put(phrase.id(), phrase);
                    }
                }
            }
        }

        public CompiledScript script() {
            return compiledScript;
        }

        public PlayerState getState(int elapsedMs) {
            int clampedElapsed = clamp(elapsedMs, 0, compiledScript.totalDurationMs());
            CompiledWord currentWord = findCurrentWord(clampedElapsed);
            CompiledSegment currentSegment = currentWord != null ? segmentById.get(currentWord.segmentId()) : compiledScript.segments().isEmpty() ? null : compiledScript.segments().get(0);
            CompiledBlock currentBlock = currentWord != null ? blockById.get(currentWord.blockId()) : currentSegment == null || currentSegment.blocks().isEmpty() ? null : currentSegment.blocks().get(0);
            CompiledPhrase currentPhrase = currentWord != null ? phraseById.get(currentWord.phraseId()) : currentBlock == null || currentBlock.phrases().isEmpty() ? null : currentBlock.phrases().get(0);
            int currentWordIndex = currentWord == null ? -1 : currentWord.index();
            CompiledWord previousWord = currentWordIndex > 0 ? compiledScript.words().get(currentWordIndex - 1) : null;
            CompiledWord nextWord = currentWordIndex >= 0 && currentWordIndex + 1 < compiledScript.words().size() ? compiledScript.words().get(currentWordIndex + 1) : null;
            double progress = compiledScript.totalDurationMs() == 0 ? 1D : ((double) clampedElapsed) / compiledScript.totalDurationMs();
            int activeWordInPhrase = -1;
            if (currentPhrase != null) {
                for (int index = 0; index < currentPhrase.words().size(); index += 1) {
                    if (Objects.equals(currentPhrase.words().get(index).id(), currentWord == null ? null : currentWord.id())) {
                        activeWordInPhrase = index;
                        break;
                    }
                }
            }
            return new PlayerState(
                clampedElapsed,
                Math.max(0, compiledScript.totalDurationMs() - clampedElapsed),
                progress,
                clampedElapsed >= compiledScript.totalDurationMs(),
                currentWordIndex,
                currentWord,
                previousWord,
                nextWord,
                currentSegment,
                currentBlock,
                currentPhrase,
                currentWord == null ? compiledScript.totalDurationMs() : currentWord.endMs(),
                new PlayerPresentationModel(
                    currentSegment == null ? null : currentSegment.name(),
                    currentBlock == null ? null : currentBlock.name(),
                    currentPhrase == null ? null : currentPhrase.text(),
                    currentPhrase == null ? List.of() : currentPhrase.words(),
                    activeWordInPhrase
                )
            );
        }

        public PlayerState seek(int elapsedMs) {
            return getState(elapsedMs);
        }

        public List<PlayerState> enumerateStates(int stepMs) {
            if (stepMs <= 0) {
                throw new IllegalArgumentException("stepMs must be greater than 0.");
            }
            if (compiledScript.totalDurationMs() == 0) {
                return List.of(getState(0));
            }
            List<PlayerState> states = new ArrayList<>();
            for (int elapsedMs = 0; elapsedMs < compiledScript.totalDurationMs(); elapsedMs += stepMs) {
                states.add(getState(elapsedMs));
            }
            states.add(getState(compiledScript.totalDurationMs()));
            return List.copyOf(states);
        }

        private CompiledWord findCurrentWord(int elapsedMs) {
            if (compiledScript.words().isEmpty()) {
                return null;
            }
            int low = 0;
            int high = compiledScript.words().size() - 1;
            int candidateIndex = -1;
            while (low <= high) {
                int middle = low + ((high - low) / 2);
                CompiledWord word = compiledScript.words().get(middle);
                if (word.endMs() > elapsedMs) {
                    candidateIndex = middle;
                    high = middle - 1;
                } else {
                    low = middle + 1;
                }
            }
            if (candidateIndex >= 0) {
                for (int index = candidateIndex; index < compiledScript.words().size(); index += 1) {
                    CompiledWord word = compiledScript.words().get(index);
                    if (word.endMs() > elapsedMs && word.endMs() > word.startMs()) {
                        return word;
                    }
                }
            }
            return compiledScript.words().get(compiledScript.words().size() - 1);
        }
    }

    public static final class TpsPlaybackSession implements Closeable {
        private final TpsPlayer player;
        private final int tickIntervalMs;
        private final int baseWpm;
        private final int speedStepWpm;
        private final List<CompiledBlock> blocks;
        private final Map<String, Integer> segmentIndexById = new HashMap<>();
        private final Map<String, Integer> blockIndexById = new HashMap<>();
        private final Map<String, CopyOnWriteArrayList<Consumer<Object>>> listeners = new ConcurrentHashMap<>();
        private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

        private volatile PlayerState currentState;
        private volatile TpsPlaybackStatus status = TpsPlaybackStatus.IDLE;
        private volatile int playbackOffsetMs = 0;
        private volatile long playbackStartedAtMs = 0L;
        private volatile int speedOffsetWpm = 0;
        private volatile ScheduledFuture<?> timer;

        public TpsPlaybackSession(CompiledScript script) {
            this(script, TpsPlaybackSessionOptions.DEFAULT);
        }

        public TpsPlaybackSession(CompiledScript script, TpsPlaybackSessionOptions options) {
            this.player = new TpsPlayer(script);
            this.currentState = player.getState(0);
            this.tickIntervalMs = normalizeTickInterval(options.tickIntervalMs);
            this.baseWpm = normalizeBaseWpm(options.baseWpm == null ? resolveBaseWpm(player.script().metadata()) : options.baseWpm);
            this.speedStepWpm = normalizeSpeedStep(options.speedStepWpm);
            this.speedOffsetWpm = normalizeSpeedOffset(baseWpm, options.initialSpeedOffsetWpm == null ? 0 : options.initialSpeedOffsetWpm);
            this.blocks = flattenBlocks(player.script());
            for (int index = 0; index < player.script().segments().size(); index += 1) {
                segmentIndexById.put(player.script().segments().get(index).id(), index);
            }
            for (int index = 0; index < blocks.size(); index += 1) {
                blockIndexById.put(blocks.get(index).id(), index);
            }
        }

        public TpsPlayer player() {
            return player;
        }

        public PlayerState currentState() {
            return currentState;
        }

        public TpsPlaybackStatus status() {
            return status;
        }

        public boolean isPlaying() {
            return status == TpsPlaybackStatus.PLAYING;
        }

        public int baseWpm() {
            return baseWpm;
        }

        public int speedStepWpm() {
            return speedStepWpm;
        }

        public int speedOffset() {
            return speedOffsetWpm;
        }

        public int effectiveBaseWpm() {
            return clampWpm(baseWpm + speedOffsetWpm);
        }

        public double playbackRate() {
            return baseWpm <= 0 ? 1D : ((double) effectiveBaseWpm()) / baseWpm;
        }

        public TpsPlaybackSnapshot snapshot() {
            return createSnapshot();
        }

        public Runnable on(String eventName, Consumer<Object> listener) {
            listeners.computeIfAbsent(eventName, ignored -> new CopyOnWriteArrayList<>()).add(listener);
            return () -> listeners.getOrDefault(eventName, new CopyOnWriteArrayList<>()).remove(listener);
        }

        public Runnable observeSnapshot(Consumer<TpsPlaybackSnapshot> listener) {
            return observeSnapshot(listener, true);
        }

        public Runnable observeSnapshot(Consumer<TpsPlaybackSnapshot> listener, boolean emitCurrent) {
            Runnable unsubscribe = on(TpsPlaybackEventNames.SNAPSHOT_CHANGED, event -> listener.accept((TpsPlaybackSnapshot) event));
            if (emitCurrent) {
                listener.accept(snapshot());
            }
            return unsubscribe;
        }

        public synchronized PlayerState play() {
            if (status == TpsPlaybackStatus.PLAYING) {
                return currentState;
            }
            if (currentState.isComplete() && player.script().totalDurationMs() > 0) {
                seek(0);
            }
            if (player.script().totalDurationMs() == 0) {
                return updatePosition(0, TpsPlaybackStatus.COMPLETED);
            }
            playbackOffsetMs = currentState.elapsedMs();
            playbackStartedAtMs = nowMs();
            clearTimer();
            updateStatus(TpsPlaybackStatus.PLAYING, currentState);
            emitSnapshotChanged();
            scheduleNextTick();
            return currentState;
        }

        public synchronized PlayerState pause() {
            if (status != TpsPlaybackStatus.PLAYING) {
                return currentState;
            }
            PlayerState state = updatePosition(readLiveElapsedMs(), TpsPlaybackStatus.PAUSED);
            clearTimer();
            return state;
        }

        public synchronized PlayerState stop() {
            clearTimer();
            playbackOffsetMs = 0;
            playbackStartedAtMs = 0L;
            return updatePosition(0, TpsPlaybackStatus.IDLE);
        }

        public synchronized PlayerState seek(int elapsedMs) {
            TpsPlaybackStatus nextStatus = status == TpsPlaybackStatus.PLAYING
                ? TpsPlaybackStatus.PLAYING
                : resolveStatusAfterSeek(status, player.script().totalDurationMs(), elapsedMs);
            PlayerState state = updatePosition(elapsedMs, nextStatus);
            if (nextStatus == TpsPlaybackStatus.PLAYING) {
                playbackOffsetMs = state.elapsedMs();
                playbackStartedAtMs = nowMs();
                clearTimer();
                scheduleNextTick();
            }
            return state;
        }

        public PlayerState advanceBy(int deltaMs) {
            return seek(currentState.elapsedMs() + deltaMs);
        }

        public PlayerState nextWord() {
            List<CompiledWord> words = player.script().words();
            if (words.isEmpty()) {
                return currentState;
            }
            if (currentState.currentWord() == null) {
                return seek(words.get(0).startMs());
            }
            int nextIndex = Math.min(currentState.currentWord().index() + 1, words.size() - 1);
            return seek(words.get(nextIndex).startMs());
        }

        public PlayerState previousWord() {
            List<CompiledWord> words = player.script().words();
            if (words.isEmpty()) {
                return currentState;
            }
            CompiledWord currentWord = currentState.currentWord();
            if (currentWord == null) {
                return seek(0);
            }
            if (currentState.elapsedMs() > currentWord.startMs()) {
                return seek(currentWord.startMs());
            }
            int previousIndex = Math.max(0, currentWord.index() - 1);
            return seek(words.get(previousIndex).startMs());
        }

        public PlayerState nextBlock() {
            if (blocks.isEmpty()) {
                return currentState;
            }
            int currentIndex = currentState.currentBlock() == null ? -1 : blockIndexById.getOrDefault(currentState.currentBlock().id(), -1);
            int nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, blocks.size() - 1);
            return seek(blocks.get(nextIndex).startMs());
        }

        public PlayerState previousBlock() {
            if (blocks.isEmpty()) {
                return currentState;
            }
            CompiledBlock currentBlock = currentState.currentBlock();
            if (currentBlock == null) {
                return seek(0);
            }
            int currentIndex = blockIndexById.getOrDefault(currentBlock.id(), 0);
            if (currentState.elapsedMs() > currentBlock.startMs()) {
                return seek(currentBlock.startMs());
            }
            int previousIndex = Math.max(0, currentIndex - 1);
            return seek(blocks.get(previousIndex).startMs());
        }

        public TpsPlaybackSnapshot increaseSpeed() {
            return increaseSpeed(speedStepWpm);
        }

        public TpsPlaybackSnapshot increaseSpeed(int stepWpm) {
            return setSpeedOffsetWpm(speedOffsetWpm + stepWpm);
        }

        public TpsPlaybackSnapshot decreaseSpeed() {
            return decreaseSpeed(speedStepWpm);
        }

        public TpsPlaybackSnapshot decreaseSpeed(int stepWpm) {
            return setSpeedOffsetWpm(speedOffsetWpm - stepWpm);
        }

        public synchronized TpsPlaybackSnapshot setSpeedOffsetWpm(int offsetWpm) {
            int normalized = normalizeSpeedOffset(baseWpm, offsetWpm);
            if (normalized == speedOffsetWpm) {
                return snapshot();
            }
            int elapsedMs = status == TpsPlaybackStatus.PLAYING ? readLiveElapsedMs() : currentState.elapsedMs();
            speedOffsetWpm = normalized;
            PlayerState state = updatePosition(elapsedMs, status);
            if (status == TpsPlaybackStatus.PLAYING) {
                playbackOffsetMs = state.elapsedMs();
                playbackStartedAtMs = nowMs();
                clearTimer();
                scheduleNextTick();
            }
            return snapshot();
        }

        public TpsPlaybackSnapshot createSnapshot() {
            List<TpsPlaybackWordView> visibleWords = new ArrayList<>();
            if (currentState.currentPhrase() != null) {
                for (CompiledWord word : currentState.currentPhrase().words()) {
                    visibleWords.add(createWordView(word, currentState));
                }
            }
            Integer currentWordDurationMs = currentState.currentWord() == null ? null : Math.max(1, (int) Math.round(currentState.currentWord().displayDurationMs() / playbackRate()));
            Integer currentWordRemainingMs = currentState.currentWord() == null ? null : Math.max(0, (int) Math.round((currentState.currentWord().endMs() - currentState.elapsedMs()) / playbackRate()));
            int currentSegmentIndex = currentState.currentSegment() == null ? -1 : segmentIndexById.getOrDefault(currentState.currentSegment().id(), -1);
            int currentBlockIndex = currentState.currentBlock() == null ? -1 : blockIndexById.getOrDefault(currentState.currentBlock().id(), -1);
            TpsPlaybackWordView focusedWord = null;
            for (TpsPlaybackWordView view : visibleWords) {
                if (view.isActive()) {
                    focusedWord = view;
                    break;
                }
            }
            return new TpsPlaybackSnapshot(
                status,
                currentState,
                new TpsPlaybackTempo(baseWpm, effectiveBaseWpm(), speedOffsetWpm, speedStepWpm, playbackRate()),
                createControls(currentBlockIndex),
                visibleWords,
                focusedWord,
                currentWordDurationMs,
                currentWordRemainingMs,
                currentSegmentIndex,
                currentBlockIndex
            );
        }

        @Override
        public synchronized void close() {
            clearTimer();
            executor.shutdownNow();
        }

        public void dispose() {
            close();
        }

        private void emit(String eventName, Object event) {
            for (Consumer<Object> listener : listeners.getOrDefault(eventName, new CopyOnWriteArrayList<>())) {
                listener.accept(event);
            }
        }

        private void emitSnapshotChanged() {
            emit(TpsPlaybackEventNames.SNAPSHOT_CHANGED, createSnapshot());
        }

        private synchronized void scheduleNextTick() {
            if (status != TpsPlaybackStatus.PLAYING) {
                return;
            }
            timer = executor.schedule(() -> {
                PlayerState state = updatePosition(readLiveElapsedMs(), TpsPlaybackStatus.PLAYING);
                if (state.isComplete() || status != TpsPlaybackStatus.PLAYING) {
                    clearTimer();
                    return;
                }
                scheduleNextTick();
            }, tickIntervalMs, TimeUnit.MILLISECONDS);
        }

        private int readLiveElapsedMs() {
            long deltaMs = Math.max(0L, nowMs() - playbackStartedAtMs);
            return clamp(playbackOffsetMs + Math.max(0, (int) Math.round(deltaMs * playbackRate())), 0, player.script().totalDurationMs());
        }

        private synchronized PlayerState updatePosition(int elapsedMs, TpsPlaybackStatus requestedStatus) {
            PlayerState previousState = currentState;
            PlayerState nextState = player.getState(elapsedMs);
            TpsPlaybackStatus nextStatus = requestedStatus == TpsPlaybackStatus.PLAYING && nextState.isComplete() ? TpsPlaybackStatus.COMPLETED : requestedStatus;
            currentState = nextState;
            updateStatus(nextStatus, nextState);
            if (hasStateChanged(previousState, nextState)) {
                Map<String, Object> stateEvent = Map.of("state", nextState, "previousState", previousState, "status", status.wire());
                emit(TpsPlaybackEventNames.STATE_CHANGED, stateEvent);
                if (!Objects.equals(id(previousState.currentWord()), id(nextState.currentWord()))) {
                    emit(TpsPlaybackEventNames.WORD_CHANGED, stateEvent);
                }
                if (!Objects.equals(id(previousState.currentPhrase()), id(nextState.currentPhrase()))) {
                    emit(TpsPlaybackEventNames.PHRASE_CHANGED, stateEvent);
                }
                if (!Objects.equals(id(previousState.currentBlock()), id(nextState.currentBlock()))) {
                    emit(TpsPlaybackEventNames.BLOCK_CHANGED, stateEvent);
                }
                if (!Objects.equals(id(previousState.currentSegment()), id(nextState.currentSegment()))) {
                    emit(TpsPlaybackEventNames.SEGMENT_CHANGED, stateEvent);
                }
            }
            if (status == TpsPlaybackStatus.COMPLETED && !previousState.isComplete()) {
                emit(TpsPlaybackEventNames.COMPLETED, Map.of("state", nextState, "previousState", previousState, "status", status.wire()));
            }
            emitSnapshotChanged();
            return nextState;
        }

        private synchronized void updateStatus(TpsPlaybackStatus nextStatus, PlayerState nextState) {
            TpsPlaybackStatus previousStatus = status;
            status = nextStatus;
            if (previousStatus == nextStatus) {
                return;
            }
            emit(TpsPlaybackEventNames.STATUS_CHANGED, Map.of("state", nextState, "previousStatus", previousStatus.wire(), "status", nextStatus.wire()));
            if (nextStatus != TpsPlaybackStatus.PLAYING) {
                playbackOffsetMs = nextState.elapsedMs();
                playbackStartedAtMs = 0L;
            }
            if (nextStatus == TpsPlaybackStatus.COMPLETED && previousStatus == TpsPlaybackStatus.PLAYING) {
                clearTimer();
            }
        }

        private synchronized void clearTimer() {
            if (timer != null) {
                timer.cancel(false);
                timer = null;
            }
        }

        private TpsPlaybackControls createControls(int currentBlockIndex) {
            int wordCount = player.script().words().size();
            int currentWordIndex = currentState.currentWordIndex();
            boolean canRewindCurrentWord = currentState.currentWord() != null && currentState.elapsedMs() > currentState.currentWord().startMs();
            boolean canRewindCurrentBlock = currentState.currentBlock() != null && currentState.elapsedMs() > currentState.currentBlock().startMs();
            return new TpsPlaybackControls(
                status != TpsPlaybackStatus.PLAYING,
                status == TpsPlaybackStatus.PLAYING,
                status != TpsPlaybackStatus.IDLE || currentState.elapsedMs() > 0,
                wordCount > 0 && (currentState.currentWord() == null || currentWordIndex < wordCount - 1),
                wordCount > 0 && (currentWordIndex > 0 || canRewindCurrentWord),
                !blocks.isEmpty() && (currentState.currentBlock() == null || currentBlockIndex < blocks.size() - 1),
                !blocks.isEmpty() && (currentBlockIndex > 0 || canRewindCurrentBlock),
                effectiveBaseWpm() < TpsSpec.MAXIMUM_WPM,
                effectiveBaseWpm() > TpsSpec.MINIMUM_WPM
            );
        }
    }

    public static final class TpsStandalonePlayer implements Closeable {
        private final boolean ok;
        private final List<TpsDiagnostic> diagnostics;
        private final TpsDocument document;
        private final CompiledScript script;
        private final TpsPlaybackSession session;

        public TpsStandalonePlayer(TpsCompilationResult compilation) {
            this(compilation, TpsPlaybackSessionOptions.DEFAULT);
        }

        public TpsStandalonePlayer(TpsCompilationResult compilation, TpsPlaybackSessionOptions options) {
            this.ok = compilation.ok();
            this.diagnostics = compilation.diagnostics();
            this.document = compilation.document();
            this.script = normalizeCompiledScript(compilation.script());
            this.session = new TpsPlaybackSession(script, options);
            if (options.autoPlay) {
                play();
            }
        }

        private TpsStandalonePlayer(CompiledScript script, TpsPlaybackSessionOptions options) {
            this.ok = true;
            this.diagnostics = List.of();
            this.document = null;
            this.script = normalizeCompiledScript(script);
            this.session = new TpsPlaybackSession(this.script, options);
            if (options.autoPlay) {
                play();
            }
        }

        public static TpsStandalonePlayer compile(String source) {
            return compile(source, TpsPlaybackSessionOptions.DEFAULT);
        }

        public static TpsStandalonePlayer compile(String source, TpsPlaybackSessionOptions options) {
            return new TpsStandalonePlayer(TpsRuntime.compileTps(source), options);
        }

        public static TpsStandalonePlayer fromCompiledScript(CompiledScript script) {
            return fromCompiledScript(script, TpsPlaybackSessionOptions.DEFAULT);
        }

        public static TpsStandalonePlayer fromCompiledScript(CompiledScript script, TpsPlaybackSessionOptions options) {
            return new TpsStandalonePlayer(script, options);
        }

        public static TpsStandalonePlayer fromCompiledJson(String json) {
            return fromCompiledJson(json, TpsPlaybackSessionOptions.DEFAULT);
        }

        public static TpsStandalonePlayer fromCompiledJson(String json, TpsPlaybackSessionOptions options) {
            return new TpsStandalonePlayer(parseCompiledScriptJson(json), options);
        }

        public boolean ok() {
            return ok;
        }

        public List<TpsDiagnostic> diagnostics() {
            return diagnostics;
        }

        public TpsDocument document() {
            return document;
        }

        public CompiledScript script() {
            return script;
        }

        public PlayerState currentState() {
            return session.currentState();
        }

        public boolean isPlaying() {
            return session.isPlaying();
        }

        public TpsPlaybackSnapshot snapshot() {
            return session.snapshot();
        }

        public TpsPlaybackStatus status() {
            return session.status();
        }

        public Runnable on(String eventName, Consumer<Object> listener) {
            return session.on(eventName, listener);
        }

        public Runnable observeSnapshot(Consumer<TpsPlaybackSnapshot> listener) {
            return session.observeSnapshot(listener);
        }

        public Runnable observeSnapshot(Consumer<TpsPlaybackSnapshot> listener, boolean emitCurrent) {
            return session.observeSnapshot(listener, emitCurrent);
        }

        public PlayerState play() {
            return session.play();
        }

        public PlayerState pause() {
            return session.pause();
        }

        public PlayerState stop() {
            return session.stop();
        }

        public PlayerState seek(int elapsedMs) {
            return session.seek(elapsedMs);
        }

        public PlayerState advanceBy(int deltaMs) {
            return session.advanceBy(deltaMs);
        }

        public PlayerState nextWord() {
            return session.nextWord();
        }

        public PlayerState previousWord() {
            return session.previousWord();
        }

        public PlayerState nextBlock() {
            return session.nextBlock();
        }

        public PlayerState previousBlock() {
            return session.previousBlock();
        }

        public TpsPlaybackSnapshot increaseSpeed() {
            return session.increaseSpeed();
        }

        public TpsPlaybackSnapshot increaseSpeed(int stepWpm) {
            return session.increaseSpeed(stepWpm);
        }

        public TpsPlaybackSnapshot decreaseSpeed() {
            return session.decreaseSpeed();
        }

        public TpsPlaybackSnapshot decreaseSpeed(int stepWpm) {
            return session.decreaseSpeed(stepWpm);
        }

        public TpsPlaybackSnapshot setSpeedOffsetWpm(int offsetWpm) {
            return session.setSpeedOffsetWpm(offsetWpm);
        }

        @Override
        public void close() {
            session.close();
        }

        public void dispose() {
            close();
        }
    }

    private static final class ParsedBlockInternal {
        private TpsBlock block;
        private ContentSection content;

        private ParsedBlockInternal(TpsBlock block) {
            this.block = block;
        }
    }

    private static final class ParsedSegmentInternal {
        private TpsSegment segment;
        private ContentSection leadingContent;
        private ContentSection directContent;
        private final List<ParsedBlockInternal> parsedBlocks = new ArrayList<>();

        private ParsedSegmentInternal(TpsSegment segment) {
            this.segment = segment;
        }
    }

    private static final class ContentSection {
        private final String text;
        private final int startOffset;

        private ContentSection(String text, int startOffset) {
            this.text = text;
            this.startOffset = startOffset;
        }
    }

    private static final class DocumentAnalysis {
        private final String source;
        private final List<Integer> lineStarts;
        private final List<TpsDiagnostic> diagnostics;
        private final TpsDocument document;
        private final List<ParsedSegmentInternal> parsedSegments;

        private DocumentAnalysis(String source, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics, TpsDocument document, List<ParsedSegmentInternal> parsedSegments) {
            this.source = source;
            this.lineStarts = lineStarts;
            this.diagnostics = diagnostics;
            this.document = document;
            this.parsedSegments = parsedSegments;
        }
    }

    private static final class ParsedHeader {
        private final String name;
        private Integer targetWpm;
        private String emotion;
        private String timing;
        private String speaker;
        private String archetype;

        private ParsedHeader(String name) {
            this.name = name;
        }
    }

    private record SegmentCandidate(CompiledSegment segment, List<BlockCandidate> blocks) {
    }

    private record BlockCandidate(CompiledBlock block, ContentCompilationResult content) {
    }

    private record WordSeed(String kind, String cleanText, int characterCount, int orpPosition, int displayDurationMs, WordMetadata metadata) {
    }

    private record PhraseSeed(List<WordSeed> words, String text) {
    }

    private record InheritedFormattingState(int targetWpm, String emotion, String speaker, String archetype, Map<String, Integer> speedOffsets) {
    }

    private record ContentCompilationResult(List<WordSeed> words, List<PhraseSeed> phrases) {
    }

    private record InlineScope(String name, Integer emphasisLevel, Boolean highlight, String inlineEmotion, String volumeLevel, String deliveryMode, String articulationStyle, Integer energyLevel, Integer melodyLevel, String phoneticGuide, String pronunciationGuide, String stressGuide, Boolean stressWrap, Integer absoluteSpeed, Double relativeSpeedMultiplier, Boolean resetSpeed) {
    }

    private record LiteralScope(String name) {
    }

    private record ActiveInlineState(String emotion, String inlineEmotion, String speaker, int emphasisLevel, boolean highlight, String volumeLevel, String deliveryMode, String articulationStyle, Integer energyLevel, Integer melodyLevel, String phoneticGuide, String pronunciationGuide, String stressGuide, boolean stressWrap, boolean hasAbsoluteSpeed, int absoluteSpeed, boolean hasRelativeSpeed, double relativeSpeedMultiplier) {
    }

    private record TagToken(String raw, String inner, String name, String argument, boolean isClosing) {
    }

    private record HeaderPart(String value, int start, int end) {
    }

    private record FrontMatterExtraction(Map<String, String> metadata, String body, int bodyStartOffset) {
    }

    private record BodyExtraction(Map<String, String> metadata, String body, int startOffset) {
    }

    private record LineRecord(String text, int startOffset) {
    }

    private static final class TokenAccumulator {
        private final List<String> stressText = new ArrayList<>();
        private int emphasisLevel = 0;
        private boolean highlight = false;
        private String emotionHint = "";
        private String inlineEmotionHint;
        private String volumeLevel;
        private String deliveryMode;
        private String articulationStyle;
        private Integer energyLevel;
        private Integer melodyLevel;
        private String phoneticGuide;
        private String pronunciationGuide;
        private String stressGuide;
        private boolean hasAbsoluteSpeed = false;
        private int absoluteSpeed = 0;
        private boolean hasRelativeSpeed = false;
        private double relativeSpeedMultiplier = 1D;
        private String speaker;

        private void apply(ActiveInlineState state, String character) {
            emphasisLevel = Math.max(emphasisLevel, state.emphasisLevel());
            highlight = highlight || state.highlight();
            emotionHint = state.emotion();
            inlineEmotionHint = state.inlineEmotion() != null ? state.inlineEmotion() : inlineEmotionHint;
            volumeLevel = state.volumeLevel() != null ? state.volumeLevel() : volumeLevel;
            deliveryMode = state.deliveryMode() != null ? state.deliveryMode() : deliveryMode;
            articulationStyle = state.articulationStyle() != null ? state.articulationStyle() : articulationStyle;
            if (state.energyLevel() != null) {
                energyLevel = state.energyLevel();
            }
            if (state.melodyLevel() != null) {
                melodyLevel = state.melodyLevel();
            }
            phoneticGuide = state.phoneticGuide() != null ? state.phoneticGuide() : phoneticGuide;
            pronunciationGuide = state.pronunciationGuide() != null ? state.pronunciationGuide() : pronunciationGuide;
            stressGuide = state.stressGuide() != null ? state.stressGuide() : stressGuide;
            speaker = state.speaker();
            if (state.stressWrap()) {
                stressText.add(character);
            }
            if (!isWhitespace(character) && !isStandalonePunctuationToken(character)) {
                hasAbsoluteSpeed = state.hasAbsoluteSpeed();
                absoluteSpeed = state.absoluteSpeed();
                hasRelativeSpeed = state.hasRelativeSpeed();
                relativeSpeedMultiplier = state.relativeSpeedMultiplier();
            }
        }

        private WordMetadata buildWordMetadata(int inheritedWpm) {
            WordMetadata metadata = new WordMetadata(
                emphasisLevel > 0,
                emphasisLevel,
                false,
                null,
                highlight,
                false,
                false,
                null,
                emotionHint,
                inlineEmotionHint,
                volumeLevel,
                deliveryMode,
                articulationStyle,
                energyLevel,
                melodyLevel,
                phoneticGuide,
                pronunciationGuide,
                stressText.isEmpty() ? null : String.join("", stressText),
                stressGuide,
                null,
                null,
                speaker,
                TpsSpec.EMOTION_HEAD_CUES.getOrDefault(emotionHint.isEmpty() ? TpsSpec.DEFAULT_EMOTION : emotionHint, "H0")
            );
            if (hasAbsoluteSpeed) {
                int effectiveWpm = hasRelativeSpeed ? Math.max(1, (int) Math.round(absoluteSpeed * relativeSpeedMultiplier)) : absoluteSpeed;
                if (effectiveWpm != inheritedWpm) {
                    metadata = new WordMetadata(
                        metadata.isEmphasis(), metadata.emphasisLevel(), metadata.isPause(), metadata.pauseDurationMs(), metadata.isHighlight(), metadata.isBreath(),
                        metadata.isEditPoint(), metadata.editPointPriority(), metadata.emotionHint(), metadata.inlineEmotionHint(), metadata.volumeLevel(),
                        metadata.deliveryMode(), metadata.articulationStyle(), metadata.energyLevel(), metadata.melodyLevel(), metadata.phoneticGuide(), metadata.pronunciationGuide(), metadata.stressText(), metadata.stressGuide(),
                        effectiveWpm, metadata.speedMultiplier(), metadata.speaker(), metadata.headCue()
                    );
                }
            } else if (hasRelativeSpeed && Math.abs(relativeSpeedMultiplier - 1D) > 0.0001D) {
                metadata = new WordMetadata(
                    metadata.isEmphasis(), metadata.emphasisLevel(), metadata.isPause(), metadata.pauseDurationMs(), metadata.isHighlight(), metadata.isBreath(),
                    metadata.isEditPoint(), metadata.editPointPriority(), metadata.emotionHint(), metadata.inlineEmotionHint(), metadata.volumeLevel(),
                    metadata.deliveryMode(), metadata.articulationStyle(), metadata.energyLevel(), metadata.melodyLevel(), metadata.phoneticGuide(), metadata.pronunciationGuide(), metadata.stressText(), metadata.stressGuide(),
                    metadata.speedOverride(), relativeSpeedMultiplier, metadata.speaker(), metadata.headCue()
                );
            }
            return metadata;
        }
    }

    private static DocumentAnalysis parseDocument(String source) {
        String normalized = normalizeLineEndings(source);
        List<Integer> lineStarts = createLineStarts(normalized);
        List<TpsDiagnostic> diagnostics = new ArrayList<>();
        FrontMatterExtraction frontMatter = extractFrontMatter(normalized, lineStarts, diagnostics);
        BodyExtraction titledBody = extractTitleHeader(frontMatter.body(), frontMatter.bodyStartOffset(), frontMatter.metadata());
        List<ParsedSegmentInternal> parsedSegments = parseSegments(titledBody.body(), titledBody.startOffset(), titledBody.metadata(), lineStarts, diagnostics);
        TpsDocument document = new TpsDocument(titledBody.metadata(), parsedSegments.stream().map(entry -> entry.segment).toList());
        return new DocumentAnalysis(normalized, lineStarts, diagnostics, document, parsedSegments);
    }

    private static CompiledScript compileAnalysis(DocumentAnalysis analysis, List<TpsDiagnostic> diagnostics) {
        int baseWpm = resolveBaseWpm(analysis.document.metadata());
        Map<String, Integer> speedOffsets = resolveSpeedOffsets(analysis.document.metadata());
        List<SegmentCandidate> candidates = new ArrayList<>();
        for (ParsedSegmentInternal parsedSegment : analysis.parsedSegments) {
            candidates.add(compileSegment(parsedSegment, baseWpm, speedOffsets, analysis, diagnostics));
        }
        return finalizeScript(analysis.document.metadata(), candidates);
    }

    private static FrontMatterExtraction extractFrontMatter(String source, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        if (!source.startsWith("---\n")) {
            return new FrontMatterExtraction(Map.of(), source, 0);
        }
        int[] closing = findFrontMatterClosing(source);
        if (closing == null) {
            diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_FRONT_MATTER, "Front matter must be closed by a terminating --- line.", 0, Math.min(source.length(), 3), lineStarts, null));
            return new FrontMatterExtraction(Map.of(), source, 0);
        }
        Map<String, String> metadata = parseMetadata(source.substring(4, closing[0]), 4, lineStarts, diagnostics);
        return new FrontMatterExtraction(metadata, source.substring(closing[0] + closing[1]), closing[0] + closing[1]);
    }

    private static Map<String, String> parseMetadata(String frontMatterText, int startOffset, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        Map<String, String> metadata = new LinkedHashMap<>();
        String currentSection = null;
        int lineOffset = startOffset;
        for (String rawLine : frontMatterText.split("\n", -1)) {
            int entryStart = lineOffset;
            int entryEnd = lineOffset + rawLine.length();
            lineOffset = entryEnd + 1;
            if (rawLine.trim().isEmpty() || rawLine.stripLeading().startsWith("#")) {
                continue;
            }
            int indentation = rawLine.length() - rawLine.stripLeading().length();
            String line = rawLine.trim();
            int separatorIndex = line.indexOf(':');
            if (separatorIndex <= 0) {
                continue;
            }
            String key = line.substring(0, separatorIndex).trim();
            String value = normalizeMetadataValue(line.substring(separatorIndex + 1));
            if (indentation > 0 && currentSection != null) {
                String compositeKey = currentSection + "." + key;
                metadata.put(compositeKey, value);
                validateMetadataEntry(compositeKey, value, entryStart, entryEnd, lineStarts, diagnostics);
                continue;
            }
            currentSection = value.isEmpty() ? key : null;
            if (!value.isEmpty()) {
                metadata.put(key, value);
                validateMetadataEntry(key, value, entryStart, entryEnd, lineStarts, diagnostics);
            }
        }
        return Collections.unmodifiableMap(metadata);
    }

    private static BodyExtraction extractTitleHeader(String body, int bodyStartOffset, Map<String, String> metadata) {
        Map<String, String> nextMetadata = new LinkedHashMap<>(metadata);
        for (LineRecord line : splitLines(body, bodyStartOffset)) {
            if (line.text().trim().isEmpty()) {
                continue;
            }
            String trimmed = line.text().trim();
            if (!trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
                break;
            }
            nextMetadata.put(TpsFrontMatterKeys.TITLE, trimmed.substring(2).trim());
            int consumedLength = line.startOffset() - bodyStartOffset + line.text().length();
            int trailingNewlineLength = consumedLength < body.length() && body.charAt(consumedLength) == '\n' ? 1 : 0;
            int bodyOffset = consumedLength + trailingNewlineLength;
            return new BodyExtraction(Collections.unmodifiableMap(nextMetadata), body.substring(bodyOffset), bodyStartOffset + bodyOffset);
        }
        return new BodyExtraction(Collections.unmodifiableMap(nextMetadata), body, bodyStartOffset);
    }

    private static List<ParsedSegmentInternal> parseSegments(String body, int bodyStartOffset, Map<String, String> metadata, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        List<LineRecord> lines = splitLines(body, bodyStartOffset);
        List<ParsedSegmentInternal> segments = new ArrayList<>();
        List<LineRecord> preamble = new ArrayList<>();
        ParsedSegmentInternal current = null;
        ParsedBlockInternal currentBlock = null;
        List<LineRecord> segmentLeading = new ArrayList<>();
        List<LineRecord> blockLines = new ArrayList<>();
        for (LineRecord line : lines) {
            ParsedHeader segmentHeader = tryParseHeader(line, "segment", lineStarts, diagnostics);
            if (segmentHeader != null) {
                finalizeParsedBlock(current, currentBlock, blockLines);
                finalizeSegment(segments, current, segmentLeading);
                current = createSegment(segmentHeader, metadata, segments.size() + 1);
                currentBlock = null;
                if (!preamble.isEmpty()) {
                    segmentLeading = new ArrayList<>(preamble);
                    preamble.clear();
                }
                continue;
            }
            ParsedHeader blockHeader = tryParseHeader(line, "block", lineStarts, diagnostics);
            if (blockHeader != null) {
                if (current == null) {
                    current = createImplicitSegment(metadata, segments.size() + 1);
                }
                if (!preamble.isEmpty()) {
                    segmentLeading = new ArrayList<>(preamble);
                    preamble.clear();
                }
                finalizeParsedBlock(current, currentBlock, blockLines);
                currentBlock = createBlock(blockHeader, current.parsedBlocks.size() + 1, current.segment.id());
                blockLines = new ArrayList<>();
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
            ParsedSegmentInternal implicit = createImplicitSegment(metadata, 1);
            implicit.directContent = createContentSection(preamble);
            return List.of(implicit);
        }
        finalizeParsedBlock(current, currentBlock, blockLines);
        finalizeSegment(segments, current, segmentLeading);
        return List.copyOf(segments);
    }

    private static ParsedHeader tryParseHeader(LineRecord line, String level, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        String hashPrefix = "segment".equals(level) ? "##" : "###";
        String trimmedStart = line.text().stripLeading();
        if (!trimmedStart.startsWith(hashPrefix)) {
            return null;
        }
        String afterHashes = trimmedStart.substring(hashPrefix.length());
        if (!afterHashes.isEmpty() && !afterHashes.startsWith(" ")) {
            return null;
        }
        String headerContent = afterHashes.trim();
        if (headerContent.isEmpty()) {
            diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_HEADER, "Header cannot be empty.", line.startOffset(), line.startOffset() + line.text().length(), lineStarts, null));
            return null;
        }
        if (!headerContent.startsWith("[") || !headerContent.endsWith("]")) {
            return new ParsedHeader(headerContent);
        }
        return parseBracketHeader(headerContent.substring(1, headerContent.length() - 1), line.startOffset() + line.text().indexOf('[') + 1, lineStarts, diagnostics);
    }

    private static ParsedHeader parseBracketHeader(String headerContent, int contentOffset, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        List<HeaderPart> parts = splitHeaderPartsDetailed(headerContent);
        if (parts.isEmpty() || parts.get(0).value().isEmpty()) {
            diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_HEADER, "Header name is required.", contentOffset, contentOffset + headerContent.length(), lineStarts, null));
            return null;
        }
        ParsedHeader parsed = new ParsedHeader(parts.get(0).value());
        for (int index = 1; index < parts.size(); index += 1) {
            HeaderPart part = parts.get(index);
            String normalized = normalizeValue(part.value());
            if (normalized == null) {
                continue;
            }
            int tokenRangeStart = contentOffset + part.start();
            int tokenRangeEnd = contentOffset + part.end();
            if (normalized.toLowerCase(Locale.ROOT).startsWith(TpsSpec.SPEAKER_PREFIX.toLowerCase(Locale.ROOT))) {
                parsed.speaker = normalizeValue(normalized.substring(TpsSpec.SPEAKER_PREFIX.length()));
                continue;
            }
            if (normalized.toLowerCase(Locale.ROOT).startsWith(TpsSpec.ARCHETYPE_PREFIX.toLowerCase(Locale.ROOT))) {
                String archetypeValue = normalizeValue(normalized.substring(TpsSpec.ARCHETYPE_PREFIX.length()));
                if (archetypeValue != null && TpsSpec.ARCHETYPES.stream().anyMatch(a -> a.equalsIgnoreCase(archetypeValue))) {
                    parsed.archetype = archetypeValue.toLowerCase(Locale.ROOT);
                } else {
                    diagnostics.add(createDiagnostic(TpsDiagnosticCodes.UNKNOWN_ARCHETYPE, "Archetype '" + (archetypeValue == null ? "" : archetypeValue) + "' is not a known vocal archetype.", tokenRangeStart, tokenRangeEnd, lineStarts, "Use one of: Friend, Motivator, Educator, Coach, Storyteller, Entertainer."));
                }
                continue;
            }
            if (isTimingToken(normalized)) {
                parsed.timing = normalized;
                continue;
            }
            if (applyHeaderWpm(parsed, normalized, tokenRangeStart, tokenRangeEnd, lineStarts, diagnostics)) {
                continue;
            }
            if (isKnownEmotion(normalized)) {
                parsed.emotion = normalized.toLowerCase(Locale.ROOT);
                continue;
            }
            diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_HEADER_PARAMETER, "Header parameter '" + normalized + "' is not a known TPS header token.", tokenRangeStart, tokenRangeEnd, lineStarts, "Use a speaker, emotion, timing, or WPM value."));
        }
        return parsed;
    }

    private static boolean applyHeaderWpm(ParsedHeader parsed, String token, int start, int end, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        String normalized = token.replaceAll("\\s+", "");
        if (!normalized.matches("(?i)^\\d+(wpm)?$")) {
            return false;
        }
        int candidate = normalized.toLowerCase(Locale.ROOT).endsWith(TpsSpec.WPM_SUFFIX.toLowerCase(Locale.ROOT))
            ? Integer.parseInt(normalized.substring(0, normalized.length() - TpsSpec.WPM_SUFFIX.length()))
            : Integer.parseInt(normalized);
        if (isInvalidWpm(candidate)) {
            diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_WPM, buildInvalidWpmMessage(token), start, end, lineStarts, null));
            return true;
        }
        parsed.targetWpm = candidate;
        return true;
    }

    private static ParsedSegmentInternal createSegment(ParsedHeader header, Map<String, String> metadata, int index) {
        String emotion = resolveEmotion(header.emotion, TpsSpec.DEFAULT_EMOTION);
        Map<String, String> palette = resolvePalette(emotion);
        Integer archetypeWpm = resolveArchetypeWpm(header.archetype);
        return new ParsedSegmentInternal(new TpsSegment(
            "segment-" + index,
            header.name,
            "",
            header.targetWpm != null ? header.targetWpm : archetypeWpm != null ? archetypeWpm : resolveBaseWpm(metadata),
            emotion,
            header.speaker,
            header.archetype,
            header.timing,
            palette.get("background"),
            palette.get("text"),
            palette.get("accent"),
            null,
            List.of()
        ));
    }

    private static ParsedSegmentInternal createImplicitSegment(Map<String, String> metadata, int index) {
        ParsedHeader header = new ParsedHeader(metadata.getOrDefault(TpsFrontMatterKeys.TITLE, TpsSpec.DEFAULT_IMPLICIT_SEGMENT_NAME));
        header.targetWpm = resolveBaseWpm(metadata);
        header.emotion = TpsSpec.DEFAULT_EMOTION;
        return createSegment(header, metadata, index);
    }

    private static ParsedBlockInternal createBlock(ParsedHeader header, int blockIndex, String segmentId) {
        return new ParsedBlockInternal(new TpsBlock(segmentId + "-block-" + blockIndex, header.name, "", header.targetWpm, header.emotion, header.speaker, header.archetype));
    }

    private static void finalizeParsedBlock(ParsedSegmentInternal current, ParsedBlockInternal block, List<LineRecord> lines) {
        if (current == null || block == null) {
            return;
        }
        block.content = createContentSection(lines);
        block.block = new TpsBlock(block.block.id(), block.block.name(), block.content == null ? "" : block.content.text, block.block.targetWpm(), block.block.emotion(), block.block.speaker(), block.block.archetype());
        current.parsedBlocks.add(block);
    }

    private static void finalizeSegment(List<ParsedSegmentInternal> target, ParsedSegmentInternal segment, List<LineRecord> lines) {
        if (segment == null) {
            return;
        }
        segment.leadingContent = createContentSection(lines);
        List<TpsBlock> blocks = segment.parsedBlocks.stream().map(entry -> entry.block).toList();
        String content = segment.parsedBlocks.isEmpty() ? segment.leadingContent == null ? "" : segment.leadingContent.text : "";
        segment.segment = new TpsSegment(segment.segment.id(), segment.segment.name(), content, segment.segment.targetWpm(), segment.segment.emotion(), segment.segment.speaker(), segment.segment.archetype(), segment.segment.timing(), segment.segment.backgroundColor(), segment.segment.textColor(), segment.segment.accentColor(), segment.leadingContent == null ? null : segment.leadingContent.text, blocks);
        if (segment.parsedBlocks.isEmpty()) {
            segment.directContent = segment.leadingContent;
        }
        target.add(segment);
    }

    private static ContentSection createContentSection(List<LineRecord> lines) {
        if (lines.isEmpty()) {
            return null;
        }
        return new ContentSection(String.join("\n", lines.stream().map(LineRecord::text).toList()), lines.get(0).startOffset());
    }

    private static List<LineRecord> splitLines(String text, int startOffset) {
        if (text.isEmpty()) {
            return List.of();
        }
        List<LineRecord> lines = new ArrayList<>();
        int lineStart = startOffset;
        String[] rawLines = text.split("\n", -1);
        for (String line : rawLines) {
            lines.add(new LineRecord(line, lineStart));
            lineStart += line.length() + 1;
        }
        if (text.endsWith("\n")) {
            lines.remove(lines.size() - 1);
        }
        return List.copyOf(lines);
    }

    private static SegmentCandidate compileSegment(ParsedSegmentInternal parsedSegment, int baseWpm, Map<String, Integer> speedOffsets, DocumentAnalysis analysis, List<TpsDiagnostic> diagnostics) {
        String segmentEmotion = resolveEmotion(parsedSegment.segment.emotion(), TpsSpec.DEFAULT_EMOTION);
        InheritedFormattingState inherited = new InheritedFormattingState(parsedSegment.segment.targetWpm(), segmentEmotion, parsedSegment.segment.speaker(), parsedSegment.segment.archetype(), speedOffsets);
        List<BlockCandidate> blocks = new ArrayList<>();
        for (BlockEntry entry : buildBlocks(parsedSegment)) {
            blocks.add(compileBlock(entry, inherited, analysis, diagnostics));
        }
        CompiledSegment segment = new CompiledSegment(parsedSegment.segment.id(), parsedSegment.segment.name(), inherited.targetWpm(), segmentEmotion, parsedSegment.segment.speaker(), parsedSegment.segment.archetype(), parsedSegment.segment.timing(), parsedSegment.segment.backgroundColor(), parsedSegment.segment.textColor(), parsedSegment.segment.accentColor(), 0, 0, 0, 0, List.of(), List.of());
        return new SegmentCandidate(segment, blocks);
    }

    private record BlockEntry(TpsBlock block, boolean isImplicit, ContentSection content) {
    }

    private static List<BlockEntry> buildBlocks(ParsedSegmentInternal parsedSegment) {
        List<BlockEntry> blocks = new ArrayList<>();
        if (parsedSegment.leadingContent != null && !parsedSegment.leadingContent.text.isEmpty() && !parsedSegment.parsedBlocks.isEmpty()) {
            blocks.add(new BlockEntry(new TpsBlock(parsedSegment.segment.id() + "-implicit-lead", parsedSegment.segment.name() + " Lead", parsedSegment.leadingContent.text, parsedSegment.segment.targetWpm(), parsedSegment.segment.emotion(), parsedSegment.segment.speaker(), parsedSegment.segment.archetype()), true, parsedSegment.leadingContent));
        }
        if (parsedSegment.parsedBlocks.isEmpty()) {
            blocks.add(new BlockEntry(new TpsBlock(parsedSegment.segment.id() + "-implicit-body", parsedSegment.segment.name(), parsedSegment.directContent == null ? "" : parsedSegment.directContent.text, parsedSegment.segment.targetWpm(), parsedSegment.segment.emotion(), parsedSegment.segment.speaker(), parsedSegment.segment.archetype()), true, parsedSegment.directContent));
        }
        for (ParsedBlockInternal parsedBlock : parsedSegment.parsedBlocks) {
            blocks.add(new BlockEntry(parsedBlock.block, false, parsedBlock.content));
        }
        return List.copyOf(blocks);
    }

    private static BlockCandidate compileBlock(BlockEntry entry, InheritedFormattingState inherited, DocumentAnalysis analysis, List<TpsDiagnostic> diagnostics) {
        String resolvedArchetype = entry.block.archetype() != null ? entry.block.archetype() : inherited.archetype();
        Integer archetypeWpm = resolveArchetypeWpm(resolvedArchetype);
        int blockWpm = entry.block.targetWpm() != null ? entry.block.targetWpm() : archetypeWpm != null ? archetypeWpm : inherited.targetWpm();
        InheritedFormattingState blockInherited = new InheritedFormattingState(blockWpm, resolveEmotion(entry.block.emotion(), inherited.emotion()), entry.block.speaker() == null ? inherited.speaker() : entry.block.speaker(), resolvedArchetype, inherited.speedOffsets());
        ContentCompilationResult content = compileContent(entry.content == null ? "" : entry.content.text, entry.content == null ? 0 : entry.content.startOffset, blockInherited, analysis.lineStarts, diagnostics);
        CompiledBlock block = new CompiledBlock(entry.block.id(), entry.block.name(), blockInherited.targetWpm(), blockInherited.emotion(), blockInherited.speaker(), resolvedArchetype, entry.isImplicit, 0, 0, 0, 0, List.of(), List.of());
        return new BlockCandidate(block, content);
    }

    private static CompiledScript finalizeScript(Map<String, String> metadata, List<SegmentCandidate> candidates) {
        List<CompiledSegment> segments = new ArrayList<>();
        List<CompiledWord> scriptWords = new ArrayList<>();
        int elapsedMs = 0;
        int wordIndex = 0;
        for (SegmentCandidate candidate : candidates) {
            List<CompiledWord> segmentWords = new ArrayList<>();
            List<CompiledBlock> compiledBlocks = new ArrayList<>();
            for (BlockCandidate blockCandidate : candidate.blocks()) {
                BlockFinalizeResult finalized = finalizeCompiledBlock(blockCandidate.block(), blockCandidate.content().words(), blockCandidate.content().phrases(), candidate.segment().id(), elapsedMs, wordIndex);
                compiledBlocks.add(finalized.block());
                segmentWords.addAll(finalized.words());
                scriptWords.addAll(finalized.words());
                elapsedMs = finalized.elapsedMs();
                wordIndex = finalized.nextWordIndex();
            }
            segments.add(finalizeSegmentRange(candidate.segment(), compiledBlocks, segmentWords));
        }
        return new CompiledScript(metadata, elapsedMs, segments, scriptWords);
    }

    private record BlockFinalizeResult(CompiledBlock block, List<CompiledWord> words, List<CompiledPhrase> phrases, int elapsedMs, int nextWordIndex) {
    }

    private static BlockFinalizeResult finalizeCompiledBlock(CompiledBlock block, List<WordSeed> seeds, List<PhraseSeed> phraseSeeds, String segmentId, int elapsedMs, int wordIndex) {
        List<CompiledWord> words = new ArrayList<>();
        int elapsed = elapsedMs;
        int nextWordIndex = wordIndex;
        for (WordSeed seed : seeds) {
            CompiledWord compiledWord = new CompiledWord("word-" + (nextWordIndex + 1), nextWordIndex, seed.kind(), seed.cleanText(), seed.characterCount(), seed.orpPosition(), seed.displayDurationMs(), elapsed, elapsed + seed.displayDurationMs(), seed.metadata(), segmentId, block.id(), "");
            words.add(compiledWord);
            elapsed = compiledWord.endMs();
            nextWordIndex += 1;
        }
        List<CompiledWord> spokenWords = words.stream().filter(word -> "word".equals(word.kind())).toList();
        int spokenWordCursor = 0;
        List<CompiledPhrase> phrases = new ArrayList<>();
        for (int phraseIndex = 0; phraseIndex < phraseSeeds.size(); phraseIndex += 1) {
            PhraseSeed seed = phraseSeeds.get(phraseIndex);
            int spokenWordCount = (int) seed.words().stream().filter(word -> "word".equals(word.kind())).count();
            List<CompiledWord> phraseSlice = spokenWordCount > 0 && spokenWordCursor < spokenWords.size()
                ? new ArrayList<>(spokenWords.subList(spokenWordCursor, Math.min(spokenWordCursor + spokenWordCount, spokenWords.size())))
                : List.of();
            spokenWordCursor += phraseSlice.size();
            String phraseId = block.id() + "-phrase-" + (phraseIndex + 1);
            if (phraseSlice.isEmpty()) {
                phrases.add(new CompiledPhrase(phraseId, seed.text(), 0, 0, 0, 0, List.of()));
                continue;
            }
            List<CompiledWord> normalizedWords = new ArrayList<>();
            for (CompiledWord phraseWord : phraseSlice) {
                normalizedWords.add(new CompiledWord(phraseWord.id(), phraseWord.index(), phraseWord.kind(), phraseWord.cleanText(), phraseWord.characterCount(), phraseWord.orpPosition(), phraseWord.displayDurationMs(), phraseWord.startMs(), phraseWord.endMs(), phraseWord.metadata(), phraseWord.segmentId(), phraseWord.blockId(), phraseId));
            }
            phrases.add(new CompiledPhrase(phraseId, seed.text(), normalizedWords.get(0).index(), normalizedWords.get(normalizedWords.size() - 1).index(), normalizedWords.get(0).startMs(), normalizedWords.get(normalizedWords.size() - 1).endMs(), normalizedWords));
        }
        Map<String, CompiledWord> phraseWordById = new LinkedHashMap<>();
        for (CompiledPhrase phrase : phrases) {
            for (CompiledWord phraseWord : phrase.words()) {
                phraseWordById.put(phraseWord.id(), phraseWord);
            }
        }
        List<CompiledWord> canonicalWords = words.stream().map(word -> phraseWordById.getOrDefault(word.id(), word)).toList();
        List<CompiledPhrase> canonicalPhrases = phrases.stream().map(phrase -> new CompiledPhrase(phrase.id(), phrase.text(), phrase.startWordIndex(), phrase.endWordIndex(), phrase.startMs(), phrase.endMs(), phrase.words().stream().map(word -> phraseWordById.getOrDefault(word.id(), word)).toList())).toList();
        return new BlockFinalizeResult(withRangeForBlock(block, canonicalWords, canonicalPhrases), canonicalWords, canonicalPhrases, elapsed, nextWordIndex);
    }

    private static CompiledBlock withRangeForBlock(CompiledBlock block, List<CompiledWord> words, List<CompiledPhrase> phrases) {
        int startWordIndex = words.isEmpty() ? 0 : words.get(0).index();
        int endWordIndex = words.isEmpty() ? startWordIndex : words.get(words.size() - 1).index();
        int startMs = words.isEmpty() ? 0 : words.get(0).startMs();
        int endMs = words.isEmpty() ? startMs : words.get(words.size() - 1).endMs();
        return new CompiledBlock(block.id(), block.name(), block.targetWpm(), block.emotion(), block.speaker(), block.archetype(), block.isImplicit(), startWordIndex, endWordIndex, startMs, endMs, phrases, words);
    }

    private static CompiledSegment finalizeSegmentRange(CompiledSegment segment, List<CompiledBlock> blocks, List<CompiledWord> words) {
        int startWordIndex = words.isEmpty() ? 0 : words.get(0).index();
        int endWordIndex = words.isEmpty() ? startWordIndex : words.get(words.size() - 1).index();
        int startMs = words.isEmpty() ? 0 : words.get(0).startMs();
        int endMs = words.isEmpty() ? startMs : words.get(words.size() - 1).endMs();
        return new CompiledSegment(segment.id(), segment.name(), segment.targetWpm(), segment.emotion(), segment.speaker(), segment.archetype(), segment.timing(), segment.backgroundColor(), segment.textColor(), segment.accentColor(), startWordIndex, endWordIndex, startMs, endMs, blocks, words);
    }

    private static ContentCompilationResult compileContent(String rawText, int startOffset, InheritedFormattingState inherited, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        String protectedText = protectEscapes(rawText);
        List<WordSeed> words = new ArrayList<>();
        List<PhraseSeed> phrases = new ArrayList<>();
        List<WordSeed> currentPhrase = new ArrayList<>();
        List<InlineScope> scopes = new ArrayList<>();
        List<LiteralScope> literalScopes = new ArrayList<>();
        String builder = "";
        TokenAccumulator token = null;
        int index = 0;
        while (index < protectedText.length()) {
            String character = String.valueOf(protectedText.charAt(index));
            if (tryHandleMarkdownMarker(protectedText, index, scopes)) {
                var finalized = finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
                builder = finalized.builder();
                token = finalized.token();
                if (index + 1 < protectedText.length() && protectedText.charAt(index + 1) == '*') {
                    index += 1;
                }
                index += 1;
                continue;
            }
            if (!literalScopes.isEmpty() && literalScopes.stream().anyMatch(scope -> scope.name().equals(TpsTags.STRESS) || scope.name().equals(TpsTags.PHONETIC) || scope.name().equals(TpsTags.PRONUNCIATION)) && "]".equals(character)) {
                var appended = appendLiteral(character, scopes, inherited, builder, token);
                builder = appended.builder();
                token = appended.token();
                index += 1;
                continue;
            }
            if ("[".equals(character)) {
                TagToken tag = readTagToken(protectedText, index);
                if (tag == null) {
                    diagnostics.add(createDiagnostic(TpsDiagnosticCodes.UNTERMINATED_TAG, "Tag is missing a closing ] bracket.", startOffset + index, startOffset + protectedText.length(), lineStarts, null));
                    var appended = appendLiteral(protectedText.substring(index), scopes, inherited, builder, token);
                    builder = appended.builder();
                    token = appended.token();
                    break;
                }
                if (requiresTokenBoundary(tag.name())) {
                    var finalized = finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
                    builder = finalized.builder();
                    token = finalized.token();
                }
                if (handleTagToken(tag, literalScopes, scopes, words, phrases, currentPhrase, inherited, startOffset + index, lineStarts, diagnostics)) {
                    index += tag.raw().length();
                    continue;
                }
                var appended = appendLiteral(tag.raw(), scopes, inherited, builder, token);
                builder = appended.builder();
                token = appended.token();
                index += tag.raw().length();
                continue;
            }
            if (tryHandleSlashPause(protectedText, index, builder, token)) {
                var finalized = finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
                builder = finalized.builder();
                token = finalized.token();
                flushPhrase(phrases, currentPhrase);
                words.add(createControlWord("pause", inherited, protectedText.startsWith("//", index) ? TpsSpec.MEDIUM_PAUSE_DURATION_MS : TpsSpec.SHORT_PAUSE_DURATION_MS, null));
                if (index + 1 < protectedText.length() && protectedText.charAt(index + 1) == '/') {
                    index += 1;
                }
                index += 1;
                continue;
            }
            if (isWhitespace(character)) {
                var finalized = finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
                builder = finalized.builder();
                token = finalized.token();
                index += 1;
                continue;
            }
            var appended = appendCharacter(character, scopes, inherited, builder, token);
            builder = appended.builder();
            token = appended.token();
            index += 1;
        }
        var finalized = finalizeToken(words, phrases, currentPhrase, builder, token, inherited);
        flushPhrase(phrases, currentPhrase);
        for (InlineScope scope : scopes) {
            diagnostics.add(createDiagnostic(TpsDiagnosticCodes.UNCLOSED_TAG, "Tag '" + scope.name() + "' was opened but never closed.", startOffset + rawText.length(), startOffset + rawText.length(), lineStarts, null));
        }
        return new ContentCompilationResult(List.copyOf(words), List.copyOf(phrases));
    }

    private static boolean handleTagToken(TagToken tag, List<LiteralScope> literalScopes, List<InlineScope> scopes, List<WordSeed> words, List<PhraseSeed> phrases, List<WordSeed> currentPhrase, InheritedFormattingState inherited, int absoluteOffset, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        if (tag.isClosing()) {
            return handleClosingTag(tag, literalScopes, scopes, absoluteOffset, lineStarts, diagnostics);
        }
        if (TpsTags.PAUSE.equals(tag.name())) {
            Integer pauseDuration = tryResolvePauseMilliseconds(tag.argument());
            if (pauseDuration == null) {
                diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_PAUSE, "Pause duration must use Ns or Nms syntax.", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
                return false;
            }
            flushPhrase(phrases, currentPhrase);
            words.add(createControlWord("pause", inherited, pauseDuration, null));
            return true;
        }
        if (TpsTags.BREATH.equals(tag.name())) {
            words.add(createControlWord("breath", inherited, null, null));
            return true;
        }
        if (TpsTags.EDIT_POINT.equals(tag.name())) {
            if (tag.argument() != null && !TpsSpec.EDIT_POINT_PRIORITIES.contains(tag.argument())) {
                diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_TAG_ARGUMENT, "Edit point priority '" + tag.argument() + "' is not supported.", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
                return false;
            }
            words.add(createControlWord("edit-point", inherited, null, tag.argument()));
            return true;
        }
        InlineScope scope = createScope(tag, inherited.speedOffsets(), absoluteOffset, lineStarts, diagnostics);
        if (scope == null) {
            if (isPairedScope(tag.name())) {
                literalScopes.add(new LiteralScope(tag.name()));
            }
            return false;
        }
        scopes.add(scope);
        return true;
    }

    private static boolean handleClosingTag(TagToken tag, List<LiteralScope> literalScopes, List<InlineScope> scopes, int absoluteOffset, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        int literalIndex = lastIndexOf(literalScopes, scope -> scope.name().equals(tag.name()));
        if (literalIndex >= 0) {
            literalScopes.remove(literalIndex);
            return false;
        }
        int scopeIndex = lastIndexOf(scopes, scope -> scope.name().equals(tag.name()));
        if (scopeIndex < 0) {
            diagnostics.add(createDiagnostic(TpsDiagnosticCodes.MISMATCHED_CLOSING_TAG, "Closing tag '" + tag.name() + "' does not match any open scope.", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
            return false;
        }
        scopes.remove(scopeIndex);
        return true;
    }

    private static InlineScope createScope(TagToken tag, Map<String, Integer> speedOffsets, int absoluteOffset, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) {
        if (TpsTags.PHONETIC.equals(tag.name()) || TpsTags.PRONUNCIATION.equals(tag.name())) {
            if (tag.argument() == null) {
                diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_TAG_ARGUMENT, "Tag '" + tag.name() + "' requires a pronunciation parameter.", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
                return null;
            }
            return new InlineScope(tag.name(), null, null, null, null, null, null, null, null, TpsTags.PHONETIC.equals(tag.name()) ? tag.argument() : null, TpsTags.PRONUNCIATION.equals(tag.name()) ? tag.argument() : null, null, null, null, null, null);
        }
        if (TpsTags.STRESS.equals(tag.name())) {
            return new InlineScope(tag.name(), null, null, null, null, null, null, null, null, null, null, tag.argument(), tag.argument() == null, null, null, null);
        }
        if (TpsTags.EMPHASIS.equals(tag.name())) {
            return new InlineScope(tag.name(), 1, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        }
        if (TpsTags.HIGHLIGHT.equals(tag.name())) {
            return new InlineScope(tag.name(), null, true, null, null, null, null, null, null, null, null, null, null, null, null, null);
        }
        if (TpsSpec.VOLUME_LEVELS.contains(tag.name())) {
            return new InlineScope(tag.name(), null, null, null, tag.name(), null, null, null, null, null, null, null, null, null, null, null);
        }
        if (TpsSpec.DELIVERY_MODES.contains(tag.name())) {
            return new InlineScope(tag.name(), null, null, null, null, tag.name(), null, null, null, null, null, null, null, null, null, null);
        }
        if (TpsSpec.ARTICULATION_STYLES.contains(tag.name())) {
            return new InlineScope(tag.name(), null, null, null, null, null, tag.name(), null, null, null, null, null, null, null, null, null);
        }
        if (TpsTags.ENERGY.equals(tag.name())) {
            String arg = tag.argument();
            int level;
            try {
                level = Integer.parseInt(arg == null ? "" : arg.trim());
            } catch (NumberFormatException e) {
                diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_ENERGY_LEVEL, "Energy level must be an integer between " + TpsSpec.ENERGY_LEVEL_MIN + " and " + TpsSpec.ENERGY_LEVEL_MAX + ".", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
                return null;
            }
            if (level < TpsSpec.ENERGY_LEVEL_MIN || level > TpsSpec.ENERGY_LEVEL_MAX) {
                diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_ENERGY_LEVEL, "Energy level must be an integer between " + TpsSpec.ENERGY_LEVEL_MIN + " and " + TpsSpec.ENERGY_LEVEL_MAX + ".", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
                return null;
            }
            return new InlineScope(tag.name(), null, null, null, null, null, null, level, null, null, null, null, null, null, null, null);
        }
        if (TpsTags.MELODY.equals(tag.name())) {
            String arg = tag.argument();
            int level;
            try {
                level = Integer.parseInt(arg == null ? "" : arg.trim());
            } catch (NumberFormatException e) {
                diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_MELODY_LEVEL, "Melody level must be an integer between " + TpsSpec.MELODY_LEVEL_MIN + " and " + TpsSpec.MELODY_LEVEL_MAX + ".", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
                return null;
            }
            if (level < TpsSpec.MELODY_LEVEL_MIN || level > TpsSpec.MELODY_LEVEL_MAX) {
                diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_MELODY_LEVEL, "Melody level must be an integer between " + TpsSpec.MELODY_LEVEL_MIN + " and " + TpsSpec.MELODY_LEVEL_MAX + ".", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
                return null;
            }
            return new InlineScope(tag.name(), null, null, null, null, null, null, null, level, null, null, null, null, null, null, null);
        }
        if (TpsSpec.EMOTIONS.contains(tag.name())) {
            return new InlineScope(tag.name(), null, null, tag.name(), null, null, null, null, null, null, null, null, null, null, null, null);
        }
        Integer absoluteSpeed = tryParseAbsoluteWpm(tag.name());
        if (absoluteSpeed != null) {
            return new InlineScope(tag.name(), null, null, null, null, null, null, null, null, null, null, null, null, absoluteSpeed, null, null);
        }
        Double multiplier = resolveSpeedMultiplier(tag.name(), speedOffsets);
        if (multiplier != null) {
            return new InlineScope(tag.name(), null, null, null, null, null, null, null, null, null, null, null, null, null, multiplier, null);
        }
        if (TpsTags.NORMAL.equals(tag.name())) {
            return new InlineScope(tag.name(), null, null, null, null, null, null, null, null, null, null, null, null, null, null, true);
        }
        diagnostics.add(createDiagnostic(TpsDiagnosticCodes.UNKNOWN_TAG, "Tag '" + tag.name() + "' is not part of the TPS specification.", absoluteOffset, absoluteOffset + tag.raw().length(), lineStarts, null));
        return null;
    }

    private static boolean tryHandleMarkdownMarker(String text, int index, List<InlineScope> scopes) {
        if (text.charAt(index) != '*') {
            return false;
        }
        int markerLength = index + 1 < text.length() && text.charAt(index + 1) == '*' ? 2 : 1;
        String marker = markerLength == 2 ? "**" : "*";
        String scopeName = markerLength == 2 ? "__markdown-strong__" : TpsTags.EMPHASIS;
        int existingIndex = lastIndexOf(scopes, scope -> scope.name().equals(scopeName));
        if (existingIndex >= 0) {
            scopes.remove(existingIndex);
            return true;
        }
        if (!text.substring(index + markerLength).contains(marker)) {
            return false;
        }
        scopes.add(new InlineScope(scopeName, markerLength == 2 ? 2 : 1, null, null, null, null, null, null, null, null, null, null, null, null, null, null));
        return true;
    }

    private static TagToken readTagToken(String text, int index) {
        int endIndex = text.indexOf(']', index + 1);
        if (endIndex < 0) {
            return null;
        }
        String raw = text.substring(index, endIndex + 1);
        String inner = restoreEscapes(raw.substring(1, raw.length() - 1)).trim();
        boolean isClosing = inner.startsWith("/");
        String body = (isClosing ? inner.substring(1) : inner).trim();
        int separatorIndex = body.indexOf(':');
        String name = (separatorIndex >= 0 ? body.substring(0, separatorIndex) : body).trim().toLowerCase(Locale.ROOT);
        String argument = separatorIndex >= 0 ? normalizeValue(body.substring(separatorIndex + 1)) : null;
        return new TagToken(raw, inner, name, argument, isClosing);
    }

    private static boolean requiresTokenBoundary(String tagName) {
        return TpsTags.PAUSE.equals(tagName) || TpsTags.BREATH.equals(tagName) || TpsTags.EDIT_POINT.equals(tagName);
    }

    private static boolean tryHandleSlashPause(String text, int index, String builder, TokenAccumulator token) {
        String currentCharacter = String.valueOf(text.charAt(index));
        String nextCharacter = index + 1 < text.length() ? String.valueOf(text.charAt(index + 1)) : "";
        String previousCharacter = index > 0 ? String.valueOf(text.charAt(index - 1)) : "";
        int nextIndex = "/".equals(nextCharacter) ? index + 2 : index + 1;
        boolean previousIsBoundary = index == 0 || isWhitespace(previousCharacter);
        boolean nextIsBoundary = nextIndex >= text.length() || isWhitespace(String.valueOf(text.charAt(nextIndex)));
        return "/".equals(currentCharacter) && builder.isEmpty() && token == null && previousIsBoundary && nextIsBoundary;
    }

    private record BuilderToken(String builder, TokenAccumulator token) {
    }

    private static BuilderToken appendLiteral(String literal, List<InlineScope> scopes, InheritedFormattingState inherited, String builder, TokenAccumulator token) {
        String nextBuilder = builder;
        TokenAccumulator nextToken = token;
        for (int index = 0; index < literal.length(); index += 1) {
            BuilderToken appended = appendCharacter(String.valueOf(literal.charAt(index)), scopes, inherited, nextBuilder, nextToken);
            nextBuilder = appended.builder();
            nextToken = appended.token();
        }
        return new BuilderToken(nextBuilder, nextToken);
    }

    private static BuilderToken appendCharacter(String character, List<InlineScope> scopes, InheritedFormattingState inherited, String builder, TokenAccumulator token) {
        TokenAccumulator nextToken = token == null ? new TokenAccumulator() : token;
        nextToken.apply(resolveActiveState(scopes, inherited), character);
        return new BuilderToken(builder + character, nextToken);
    }

    private static BuilderToken finalizeToken(List<WordSeed> words, List<PhraseSeed> phrases, List<WordSeed> currentPhrase, String builder, TokenAccumulator token, InheritedFormattingState inherited) {
        if (builder.isEmpty() || token == null) {
            return new BuilderToken("", null);
        }
        String text = restoreEscapes(builder).trim();
        if (text.isEmpty()) {
            return new BuilderToken("", null);
        }
        if (isStandalonePunctuationToken(text)) {
            if (attachStandalonePunctuation(words, currentPhrase, text) && isSentenceEndingPunctuation(text)) {
                flushPhrase(phrases, currentPhrase);
            }
            return new BuilderToken("", null);
        }
        WordMetadata metadata = token.buildWordMetadata(inherited.targetWpm());
        int effectiveWpm = resolveEffectiveWpm(inherited.targetWpm(), metadata.speedOverride(), metadata.speedMultiplier());
        WordSeed word = new WordSeed("word", text, text.length(), calculateOrpIndex(text), calculateWordDurationMs(text, effectiveWpm), metadata);
        words.add(word);
        currentPhrase.add(word);
        if (isSentenceEndingPunctuation(text)) {
            flushPhrase(phrases, currentPhrase);
        }
        return new BuilderToken("", null);
    }

    private static boolean attachStandalonePunctuation(List<WordSeed> words, List<WordSeed> currentPhrase, String punctuation) {
        int currentIndex = lastIndexOf(currentPhrase, ManagedCodeTps::isSpokenWord);
        String suffix = buildStandalonePunctuationSuffix(punctuation);
        if (currentIndex >= 0) {
            WordSeed updated = new WordSeed(currentPhrase.get(currentIndex).kind(), currentPhrase.get(currentIndex).cleanText() + suffix, (currentPhrase.get(currentIndex).cleanText() + suffix).length(), calculateOrpIndex(currentPhrase.get(currentIndex).cleanText() + suffix), currentPhrase.get(currentIndex).displayDurationMs(), currentPhrase.get(currentIndex).metadata());
            currentPhrase.set(currentIndex, updated);
            int wordIndex = lastIndexOf(words, word -> word.cleanText().equals(updated.cleanText()) || (word.cleanText() + suffix).equals(updated.cleanText()));
            if (wordIndex >= 0) {
                words.set(wordIndex, updated);
            }
            return true;
        }
        int wordIndex = lastIndexOf(words, ManagedCodeTps::isSpokenWord);
        if (wordIndex < 0) {
            return false;
        }
        WordSeed updated = new WordSeed(words.get(wordIndex).kind(), words.get(wordIndex).cleanText() + suffix, (words.get(wordIndex).cleanText() + suffix).length(), calculateOrpIndex(words.get(wordIndex).cleanText() + suffix), words.get(wordIndex).displayDurationMs(), words.get(wordIndex).metadata());
        words.set(wordIndex, updated);
        return true;
    }

    private static void flushPhrase(List<PhraseSeed> phrases, List<WordSeed> currentPhrase) {
        if (currentPhrase.isEmpty()) {
            return;
        }
        List<WordSeed> phraseWords = List.copyOf(currentPhrase);
        phrases.add(new PhraseSeed(phraseWords, phraseWords.stream().filter(ManagedCodeTps::isSpokenWord).map(WordSeed::cleanText).reduce((left, right) -> left + " " + right).orElse("")));
        currentPhrase.clear();
    }

    private static WordSeed createControlWord(String kind, InheritedFormattingState inherited, Integer pauseDurationMs, String editPointPriority) {
        return new WordSeed(kind, "", 0, 0, pauseDurationMs == null ? 0 : pauseDurationMs, new WordMetadata(false, 0, "pause".equals(kind), pauseDurationMs, false, "breath".equals(kind), "edit-point".equals(kind), editPointPriority, inherited.emotion(), null, null, null, null, null, null, null, null, null, null, null, null, inherited.speaker(), TpsSpec.EMOTION_HEAD_CUES.get(inherited.emotion())));
    }

    private static ActiveInlineState resolveActiveState(List<InlineScope> scopes, InheritedFormattingState inherited) {
        int absoluteSpeed = inherited.targetWpm();
        boolean hasAbsoluteSpeed = false;
        boolean hasRelativeSpeed = false;
        double relativeSpeedMultiplier = 1D;
        int emphasisLevel = 0;
        boolean highlight = false;
        String emotion = inherited.emotion();
        String inlineEmotion = null;
        String volumeLevel = null;
        String deliveryMode = null;
        String articulationStyle = null;
        Integer energyLevel = null;
        Integer melodyLevel = null;
        String phoneticGuide = null;
        String pronunciationGuide = null;
        String stressGuide = null;
        boolean stressWrap = false;
        for (InlineScope scope : scopes) {
            if (scope.absoluteSpeed() != null) {
                absoluteSpeed = scope.absoluteSpeed();
                hasAbsoluteSpeed = true;
                hasRelativeSpeed = false;
                relativeSpeedMultiplier = 1D;
            }
            if (Boolean.TRUE.equals(scope.resetSpeed())) {
                hasRelativeSpeed = false;
                relativeSpeedMultiplier = 1D;
            }
            if (scope.relativeSpeedMultiplier() != null) {
                hasRelativeSpeed = true;
                relativeSpeedMultiplier *= scope.relativeSpeedMultiplier();
            }
            emphasisLevel = Math.max(emphasisLevel, scope.emphasisLevel() == null ? 0 : scope.emphasisLevel());
            highlight = highlight || Boolean.TRUE.equals(scope.highlight());
            if (scope.inlineEmotion() != null) {
                emotion = scope.inlineEmotion();
                inlineEmotion = scope.inlineEmotion();
            }
            volumeLevel = scope.volumeLevel() != null ? scope.volumeLevel() : volumeLevel;
            deliveryMode = scope.deliveryMode() != null ? scope.deliveryMode() : deliveryMode;
            articulationStyle = scope.articulationStyle() != null ? scope.articulationStyle() : articulationStyle;
            if (scope.energyLevel() != null) {
                energyLevel = scope.energyLevel();
            }
            if (scope.melodyLevel() != null) {
                melodyLevel = scope.melodyLevel();
            }
            phoneticGuide = scope.phoneticGuide() != null ? scope.phoneticGuide() : phoneticGuide;
            pronunciationGuide = scope.pronunciationGuide() != null ? scope.pronunciationGuide() : pronunciationGuide;
            stressGuide = scope.stressGuide() != null ? scope.stressGuide() : stressGuide;
            stressWrap = stressWrap || Boolean.TRUE.equals(scope.stressWrap());
        }
        return new ActiveInlineState(emotion, inlineEmotion, inherited.speaker(), emphasisLevel, highlight, volumeLevel, deliveryMode, articulationStyle, energyLevel, melodyLevel, phoneticGuide, pronunciationGuide, stressGuide, stressWrap, hasAbsoluteSpeed, absoluteSpeed, hasRelativeSpeed, relativeSpeedMultiplier);
    }

    private static TpsPlaybackWordView createWordView(CompiledWord word, PlayerState state) {
        String emotion = word.metadata().inlineEmotionHint() != null ? word.metadata().inlineEmotionHint() : word.metadata().emotionHint() != null ? word.metadata().emotionHint() : TpsSpec.DEFAULT_EMOTION;
        return new TpsPlaybackWordView(word, Objects.equals(word.id(), state.currentWord() == null ? null : state.currentWord().id()), word.endMs() <= state.elapsedMs(), word.startMs() > state.elapsedMs(), emotion, word.metadata().speaker(), word.metadata().emphasisLevel(), word.metadata().isHighlight(), word.metadata().deliveryMode(), word.metadata().volumeLevel());
    }

    private static List<CompiledBlock> flattenBlocks(CompiledScript script) {
        List<CompiledBlock> blocks = new ArrayList<>();
        for (CompiledSegment segment : script.segments()) {
            blocks.addAll(segment.blocks());
        }
        return List.copyOf(blocks);
    }

    private static boolean hasStateChanged(PlayerState previousState, PlayerState nextState) {
        return previousState.elapsedMs() != nextState.elapsedMs()
            || previousState.remainingMs() != nextState.remainingMs()
            || previousState.progress() != nextState.progress()
            || previousState.isComplete() != nextState.isComplete()
            || !Objects.equals(id(previousState.currentWord()), id(nextState.currentWord()))
            || !Objects.equals(id(previousState.currentPhrase()), id(nextState.currentPhrase()))
            || !Objects.equals(id(previousState.currentBlock()), id(nextState.currentBlock()))
            || !Objects.equals(id(previousState.currentSegment()), id(nextState.currentSegment()));
    }

    private static String id(Object value) {
        if (value instanceof CompiledWord word) return word.id();
        if (value instanceof CompiledPhrase phrase) return phrase.id();
        if (value instanceof CompiledBlock block) return block.id();
        if (value instanceof CompiledSegment segment) return segment.id();
        return null;
    }

    public static CompiledScript normalizeCompiledScript(CompiledScript script) {
        validateCompiledScript(script);
        List<CompiledWord> canonicalWords = script.words().stream().map(ManagedCodeTps::cloneWord).toList();
        Map<String, CompiledWord> wordById = new LinkedHashMap<>();
        for (CompiledWord word : canonicalWords) {
            wordById.put(word.id(), word);
        }
        List<CompiledSegment> segments = script.segments().stream().map(segment -> normalizeSegment(segment, wordById)).toList();
        return new CompiledScript(script.metadata(), script.totalDurationMs(), segments, canonicalWords);
    }

    public static CompiledScript parseCompiledScriptJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            throw new IllegalArgumentException("json must not be empty.");
        }
        Object parsed = new JsonReader(json).read();
        if (!(parsed instanceof Map<?, ?> map)) {
            throw new IllegalArgumentException("Compiled TPS JSON must be an object.");
        }
        return normalizeCompiledScript(compiledScriptFromTransport(castMap(map)));
    }

    private static void validateCompiledScript(CompiledScript script) {
        if (script.totalDurationMs() < 0) throw new IllegalArgumentException("Compiled script totalDurationMs must be non-negative.");
        if (script.segments().isEmpty()) throw new IllegalArgumentException("Compiled script must contain at least one segment.");
        if (script.words().isEmpty()) {
            if (script.totalDurationMs() != 0) throw new IllegalArgumentException("Empty compiled script must have zero duration.");
        } else if (script.totalDurationMs() != script.words().get(script.words().size() - 1).endMs()) {
            throw new IllegalArgumentException("Compiled script duration must match the final word end time.");
        }
        Set<String> segmentIds = new LinkedHashSet<>();
        Set<String> blockIds = new LinkedHashSet<>();
        Set<String> phraseIds = new LinkedHashSet<>();
        Set<String> wordIds = new LinkedHashSet<>();
        validateWords(script.words(), wordIds);
        int expectedSegmentStartWordIndex = 0;
        for (CompiledSegment segment : script.segments()) {
            validateIdentifier(segment.id(), "segment", segmentIds);
            validateTimeRange(segment.startWordIndex(), segment.endWordIndex(), segment.startMs(), segment.endMs(), script.words().size());
            validateCanonicalScopeWords(segment.words(), segment.startWordIndex(), segment.endWordIndex(), segment.startMs(), segment.endMs(), script.words(), segment.id(), null, null);
            if (!script.words().isEmpty() && segment.startWordIndex() != expectedSegmentStartWordIndex) {
                throw new IllegalArgumentException("Segment word ranges must be contiguous.");
            }
            int expectedBlockStartWordIndex = script.words().isEmpty() ? 0 : segment.startWordIndex();
            for (CompiledBlock block : segment.blocks()) {
                validateIdentifier(block.id(), "block", blockIds);
                validateTimeRange(block.startWordIndex(), block.endWordIndex(), block.startMs(), block.endMs(), script.words().size());
                validateCanonicalScopeWords(block.words(), block.startWordIndex(), block.endWordIndex(), block.startMs(), block.endMs(), script.words(), segment.id(), block.id(), null);
                int previousPhraseEndWordIndex = block.startWordIndex() - 1;
                for (CompiledPhrase phrase : block.phrases()) {
                    validateIdentifier(phrase.id(), "phrase", phraseIds);
                    validateTimeRange(phrase.startWordIndex(), phrase.endWordIndex(), phrase.startMs(), phrase.endMs(), script.words().size());
                    validateCanonicalScopeWords(phrase.words(), phrase.startWordIndex(), phrase.endWordIndex(), phrase.startMs(), phrase.endMs(), script.words(), segment.id(), block.id(), phrase.id());
                    if (!script.words().isEmpty() && !phrase.words().isEmpty() && phrase.startWordIndex() <= previousPhraseEndWordIndex) {
                        throw new IllegalArgumentException("Phrase word ranges must not overlap.");
                    }
                    if (!phrase.words().isEmpty()) {
                        previousPhraseEndWordIndex = phrase.endWordIndex();
                    }
                }
                if (!script.words().isEmpty() && !block.words().isEmpty() && block.startWordIndex() != expectedBlockStartWordIndex) {
                    throw new IllegalArgumentException("Block word ranges must be contiguous.");
                }
                if (!block.words().isEmpty()) {
                    expectedBlockStartWordIndex = block.endWordIndex() + 1;
                }
            }
            expectedSegmentStartWordIndex = segment.words().isEmpty() ? segment.startWordIndex() : segment.endWordIndex() + 1;
        }
    }

    private static void validateWords(List<CompiledWord> words, Set<String> seenIds) {
        int expectedIndex = 0;
        int previousEndMs = 0;
        for (CompiledWord word : words) {
            validateIdentifier(word.id(), "word", seenIds);
            if (word.index() != expectedIndex) throw new IllegalArgumentException("Word indexes must be contiguous.");
            if (word.startMs() < previousEndMs) throw new IllegalArgumentException("Word times must be monotonic.");
            if (word.endMs() < word.startMs()) throw new IllegalArgumentException("Word endMs must be >= startMs.");
            previousEndMs = word.endMs();
            expectedIndex += 1;
        }
    }

    private static void validateIdentifier(String id, String scope, Set<String> seenIds) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException(scope + " id is required.");
        if (!seenIds.add(id)) throw new IllegalArgumentException("Duplicate " + scope + " id: " + id);
    }

    private static void validateTimeRange(int startWordIndex, int endWordIndex, int startMs, int endMs, int wordCount) {
        if (startWordIndex < 0 || endWordIndex < startWordIndex) throw new IllegalArgumentException("Invalid word range.");
        if (startMs < 0 || endMs < startMs) throw new IllegalArgumentException("Invalid time range.");
        if (wordCount > 0 && endWordIndex >= wordCount) throw new IllegalArgumentException("Word range exceeds script bounds.");
    }

    private static void validateCanonicalScopeWords(List<CompiledWord> scopeWords, int startWordIndex, int endWordIndex, int startMs, int endMs, List<CompiledWord> canonicalWords, String expectedSegmentId, String expectedBlockId, String expectedPhraseId) {
        if (scopeWords.isEmpty()) {
            return;
        }
        if (scopeWords.get(0).index() != startWordIndex || scopeWords.get(scopeWords.size() - 1).index() != endWordIndex) throw new IllegalArgumentException("Scope word indexes must match declared range.");
        if (scopeWords.get(0).startMs() != startMs || scopeWords.get(scopeWords.size() - 1).endMs() != endMs) throw new IllegalArgumentException("Scope times must match declared range.");
        for (int index = 0; index < scopeWords.size(); index += 1) {
            CompiledWord scopeWord = scopeWords.get(index);
            CompiledWord canonicalWord = canonicalWords.get(scopeWord.index());
            if (!scopeWord.id().equals(canonicalWord.id())) throw new IllegalArgumentException("Scope words must reference canonical words.");
            if (!expectedSegmentId.equals(scopeWord.segmentId())) throw new IllegalArgumentException("Scope words must preserve segment ids.");
            if (expectedBlockId != null && !Objects.equals(expectedBlockId, scopeWord.blockId())) throw new IllegalArgumentException("Scope words must preserve block ids.");
            if (expectedPhraseId != null && !Objects.equals(expectedPhraseId, scopeWord.phraseId())) throw new IllegalArgumentException("Scope words must preserve phrase ids.");
        }
    }

    private static CompiledSegment normalizeSegment(CompiledSegment segment, Map<String, CompiledWord> wordById) {
        List<CompiledBlock> blocks = segment.blocks().stream().map(block -> normalizeBlock(block, wordById)).toList();
        List<CompiledWord> words = segment.words().stream().map(word -> wordById.get(word.id())).filter(Objects::nonNull).toList();
        return new CompiledSegment(segment.id(), segment.name(), segment.targetWpm(), segment.emotion(), segment.speaker(), segment.archetype(), segment.timing(), segment.backgroundColor(), segment.textColor(), segment.accentColor(), segment.startWordIndex(), segment.endWordIndex(), segment.startMs(), segment.endMs(), blocks, words);
    }

    private static CompiledBlock normalizeBlock(CompiledBlock block, Map<String, CompiledWord> wordById) {
        List<CompiledPhrase> phrases = block.phrases().stream().map(phrase -> normalizePhrase(phrase, wordById)).toList();
        List<CompiledWord> words = block.words().stream().map(word -> wordById.get(word.id())).filter(Objects::nonNull).toList();
        return new CompiledBlock(block.id(), block.name(), block.targetWpm(), block.emotion(), block.speaker(), block.archetype(), block.isImplicit(), block.startWordIndex(), block.endWordIndex(), block.startMs(), block.endMs(), phrases, words);
    }

    private static CompiledPhrase normalizePhrase(CompiledPhrase phrase, Map<String, CompiledWord> wordById) {
        List<CompiledWord> words = phrase.words().stream().map(word -> wordById.get(word.id())).filter(Objects::nonNull).toList();
        return new CompiledPhrase(phrase.id(), phrase.text(), phrase.startWordIndex(), phrase.endWordIndex(), phrase.startMs(), phrase.endMs(), words);
    }

    private static CompiledWord cloneWord(CompiledWord word) {
        return new CompiledWord(word.id(), word.index(), word.kind(), word.cleanText(), word.characterCount(), word.orpPosition(), word.displayDurationMs(), word.startMs(), word.endMs(), word.metadata(), word.segmentId(), word.blockId(), word.phraseId());
    }

    private static Map<String, Object> compiledScriptToTransport(CompiledScript script) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("metadata", new LinkedHashMap<>(script.metadata()));
        result.put("totalDurationMs", script.totalDurationMs());
        result.put("segments", script.segments().stream().map(ManagedCodeTps::segmentToTransport).toList());
        result.put("words", script.words().stream().map(ManagedCodeTps::wordToTransport).toList());
        return result;
    }

    private static Map<String, Object> segmentToTransport(CompiledSegment segment) {
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "id", segment.id()); putCompact(result, "name", segment.name()); putCompact(result, "targetWpm", segment.targetWpm());
        putCompact(result, "emotion", segment.emotion()); putCompact(result, "speaker", segment.speaker()); putCompact(result, "archetype", segment.archetype()); putCompact(result, "timing", segment.timing());
        putCompact(result, "backgroundColor", segment.backgroundColor()); putCompact(result, "textColor", segment.textColor()); putCompact(result, "accentColor", segment.accentColor());
        putCompact(result, "startWordIndex", segment.startWordIndex()); putCompact(result, "endWordIndex", segment.endWordIndex()); putCompact(result, "startMs", segment.startMs()); putCompact(result, "endMs", segment.endMs());
        putCompact(result, "blocks", segment.blocks().stream().map(ManagedCodeTps::blockToTransport).toList());
        putCompact(result, "words", segment.words().stream().map(ManagedCodeTps::wordToTransport).toList());
        return result;
    }

    private static Map<String, Object> blockToTransport(CompiledBlock block) {
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "id", block.id()); putCompact(result, "name", block.name()); putCompact(result, "targetWpm", block.targetWpm()); putCompact(result, "emotion", block.emotion()); putCompact(result, "speaker", block.speaker()); putCompact(result, "archetype", block.archetype());
        putCompact(result, "isImplicit", block.isImplicit()); putCompact(result, "startWordIndex", block.startWordIndex()); putCompact(result, "endWordIndex", block.endWordIndex()); putCompact(result, "startMs", block.startMs()); putCompact(result, "endMs", block.endMs());
        putCompact(result, "phrases", block.phrases().stream().map(ManagedCodeTps::phraseToTransport).toList());
        putCompact(result, "words", block.words().stream().map(ManagedCodeTps::wordToTransport).toList());
        return result;
    }

    private static Map<String, Object> phraseToTransport(CompiledPhrase phrase) {
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "id", phrase.id()); putCompact(result, "text", phrase.text()); putCompact(result, "startWordIndex", phrase.startWordIndex()); putCompact(result, "endWordIndex", phrase.endWordIndex()); putCompact(result, "startMs", phrase.startMs()); putCompact(result, "endMs", phrase.endMs());
        putCompact(result, "words", phrase.words().stream().map(ManagedCodeTps::wordToTransport).toList());
        return result;
    }

    private static Map<String, Object> wordToTransport(CompiledWord word) {
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "id", word.id()); putCompact(result, "index", word.index()); putCompact(result, "kind", word.kind()); putCompact(result, "cleanText", word.cleanText()); putCompact(result, "characterCount", word.characterCount());
        putCompact(result, "orpPosition", word.orpPosition()); putCompact(result, "displayDurationMs", word.displayDurationMs()); putCompact(result, "startMs", word.startMs()); putCompact(result, "endMs", word.endMs());
        putCompact(result, "metadata", metadataToTransport(word.metadata())); putCompact(result, "segmentId", word.segmentId()); putCompact(result, "blockId", word.blockId()); putCompact(result, "phraseId", word.phraseId());
        return result;
    }

    private static Map<String, Object> metadataToTransport(WordMetadata metadata) {
        Map<String, Object> result = new LinkedHashMap<>();
        putCompact(result, "isEmphasis", metadata.isEmphasis()); putCompact(result, "emphasisLevel", metadata.emphasisLevel()); putCompact(result, "isPause", metadata.isPause()); putCompact(result, "pauseDurationMs", metadata.pauseDurationMs()); putCompact(result, "isHighlight", metadata.isHighlight());
        putCompact(result, "isBreath", metadata.isBreath()); putCompact(result, "isEditPoint", metadata.isEditPoint()); putCompact(result, "editPointPriority", metadata.editPointPriority()); putCompact(result, "emotionHint", metadata.emotionHint()); putCompact(result, "inlineEmotionHint", metadata.inlineEmotionHint());
        putCompact(result, "volumeLevel", metadata.volumeLevel()); putCompact(result, "deliveryMode", metadata.deliveryMode()); putCompact(result, "articulationStyle", metadata.articulationStyle()); putCompact(result, "energyLevel", metadata.energyLevel()); putCompact(result, "melodyLevel", metadata.melodyLevel()); putCompact(result, "phoneticGuide", metadata.phoneticGuide()); putCompact(result, "pronunciationGuide", metadata.pronunciationGuide());
        putCompact(result, "stressText", metadata.stressText()); putCompact(result, "stressGuide", metadata.stressGuide()); putCompact(result, "speedOverride", metadata.speedOverride()); putCompact(result, "speedMultiplier", metadata.speedMultiplier()); putCompact(result, "speaker", metadata.speaker()); putCompact(result, "headCue", metadata.headCue());
        return result;
    }

    private static CompiledScript compiledScriptFromTransport(Map<String, Object> map) {
        Map<String, String> metadata = new LinkedHashMap<>();
        Map<String, Object> metadataMap = castMap(map.get("metadata"));
        for (Map.Entry<String, Object> entry : metadataMap.entrySet()) {
            metadata.put(entry.getKey(), asString(entry.getValue()));
        }
        int totalDurationMs = asInt(map.get("totalDurationMs"));
        List<CompiledSegment> segments = castList(map.get("segments")).stream().map(item -> segmentFromTransport(castMap(item))).toList();
        List<CompiledWord> words = castList(map.get("words")).stream().map(item -> wordFromTransport(castMap(item))).toList();
        return new CompiledScript(metadata, totalDurationMs, segments, words);
    }

    private static CompiledSegment segmentFromTransport(Map<String, Object> map) {
        return new CompiledSegment(asString(map.get("id")), asString(map.get("name")), asInt(map.get("targetWpm")), asString(map.get("emotion")), nullableString(map.get("speaker")), nullableString(map.get("archetype")), nullableString(map.get("timing")), asString(map.get("backgroundColor")), asString(map.get("textColor")), asString(map.get("accentColor")), asInt(map.get("startWordIndex")), asInt(map.get("endWordIndex")), asInt(map.get("startMs")), asInt(map.get("endMs")), castList(map.get("blocks")).stream().map(item -> blockFromTransport(castMap(item))).toList(), castList(map.get("words")).stream().map(item -> wordFromTransport(castMap(item))).toList());
    }

    private static CompiledBlock blockFromTransport(Map<String, Object> map) {
        return new CompiledBlock(asString(map.get("id")), asString(map.get("name")), asInt(map.get("targetWpm")), asString(map.get("emotion")), nullableString(map.get("speaker")), nullableString(map.get("archetype")), asBoolean(map.get("isImplicit")), asInt(map.get("startWordIndex")), asInt(map.get("endWordIndex")), asInt(map.get("startMs")), asInt(map.get("endMs")), castList(map.get("phrases")).stream().map(item -> phraseFromTransport(castMap(item))).toList(), castList(map.get("words")).stream().map(item -> wordFromTransport(castMap(item))).toList());
    }

    private static CompiledPhrase phraseFromTransport(Map<String, Object> map) {
        return new CompiledPhrase(asString(map.get("id")), asString(map.get("text")), asInt(map.get("startWordIndex")), asInt(map.get("endWordIndex")), asInt(map.get("startMs")), asInt(map.get("endMs")), castList(map.get("words")).stream().map(item -> wordFromTransport(castMap(item))).toList());
    }

    private static CompiledWord wordFromTransport(Map<String, Object> map) {
        return new CompiledWord(asString(map.get("id")), asInt(map.get("index")), asString(map.get("kind")), asString(map.get("cleanText")), asInt(map.get("characterCount")), asInt(map.get("orpPosition")), asInt(map.get("displayDurationMs")), asInt(map.get("startMs")), asInt(map.get("endMs")), metadataFromTransport(castMap(map.get("metadata"))), asString(map.get("segmentId")), asString(map.get("blockId")), asString(map.get("phraseId")));
    }

    private static WordMetadata metadataFromTransport(Map<String, Object> map) {
        return new WordMetadata(asBoolean(map.get("isEmphasis")), asInt(map.get("emphasisLevel")), asBoolean(map.get("isPause")), asNullableInt(map.get("pauseDurationMs")), asBoolean(map.get("isHighlight")), asBoolean(map.get("isBreath")), asBoolean(map.get("isEditPoint")), nullableString(map.get("editPointPriority")), nullableString(map.get("emotionHint")), nullableString(map.get("inlineEmotionHint")), nullableString(map.get("volumeLevel")), nullableString(map.get("deliveryMode")), nullableString(map.get("articulationStyle")), asNullableInt(map.get("energyLevel")), asNullableInt(map.get("melodyLevel")), nullableString(map.get("phoneticGuide")), nullableString(map.get("pronunciationGuide")), nullableString(map.get("stressText")), nullableString(map.get("stressGuide")), asNullableInt(map.get("speedOverride")), asNullableDouble(map.get("speedMultiplier")), nullableString(map.get("speaker")), nullableString(map.get("headCue")));
    }

    private static String normalizeLineEndings(String value) { return value.replace("\r\n", "\n").replace("\r", "\n"); }
    private static List<Integer> createLineStarts(String text) { List<Integer> lineStarts = new ArrayList<>(List.of(0)); for (int index = 0; index < text.length(); index += 1) if (text.charAt(index) == '\n') lineStarts.add(index + 1); return List.copyOf(lineStarts); }
    private static TpsDiagnostic createDiagnostic(String code, String message, int start, int end, List<Integer> lineStarts, String suggestion) { return new TpsDiagnostic(code, TpsDiagnosticCodes.INVALID_HEADER_PARAMETER.equals(code) ? "warning" : "error", message, suggestion, new TpsRange(positionFromOffset(start, lineStarts), positionFromOffset(end, lineStarts))); }
    private static boolean hasErrors(List<TpsDiagnostic> diagnostics) { return diagnostics.stream().anyMatch(diagnostic -> "error".equals(diagnostic.severity())); }
    private static String normalizeValue(String value) { if (value == null) return null; String trimmed = value.trim(); return trimmed.isEmpty() ? null : trimmed; }
    private static String resolveEmotion(String candidate, String fallback) { String normalized = normalizeValue(candidate); return normalized != null && isKnownEmotion(normalized.toLowerCase(Locale.ROOT)) ? normalized.toLowerCase(Locale.ROOT) : fallback; }
    private static Map<String, String> resolvePalette(String emotion) { return TpsSpec.EMOTION_PALETTES.getOrDefault(resolveEmotion(emotion, TpsSpec.DEFAULT_EMOTION), TpsSpec.EMOTION_PALETTES.get(TpsSpec.DEFAULT_EMOTION)); }
    private static int resolveBaseWpm(Map<String, String> metadata) { return clampWpm(parseIntOrDefault(metadata.get(TpsFrontMatterKeys.BASE_WPM), TpsSpec.DEFAULT_BASE_WPM)); }
    private static Map<String, Integer> resolveSpeedOffsets(Map<String, String> metadata) { return Map.of(TpsTags.XSLOW, parseIntOrDefault(metadata.get(TpsFrontMatterKeys.SPEED_OFFSETS_XSLOW), TpsSpec.DEFAULT_SPEED_OFFSETS.get(TpsTags.XSLOW)), TpsTags.SLOW, parseIntOrDefault(metadata.get(TpsFrontMatterKeys.SPEED_OFFSETS_SLOW), TpsSpec.DEFAULT_SPEED_OFFSETS.get(TpsTags.SLOW)), TpsTags.FAST, parseIntOrDefault(metadata.get(TpsFrontMatterKeys.SPEED_OFFSETS_FAST), TpsSpec.DEFAULT_SPEED_OFFSETS.get(TpsTags.FAST)), TpsTags.XFAST, parseIntOrDefault(metadata.get(TpsFrontMatterKeys.SPEED_OFFSETS_XFAST), TpsSpec.DEFAULT_SPEED_OFFSETS.get(TpsTags.XFAST))); }
    private static Double resolveSpeedMultiplier(String tag, Map<String, Integer> speedOffsets) { return speedOffsets.containsKey(tag) ? 1D + (speedOffsets.get(tag) / 100D) : null; }
    private static Integer tryParseAbsoluteWpm(String tag) { return tag.toLowerCase(Locale.ROOT).endsWith(TpsSpec.WPM_SUFFIX.toLowerCase(Locale.ROOT)) ? Integer.parseInt(tag.substring(0, tag.length() - TpsSpec.WPM_SUFFIX.length())) : null; }
    private static boolean isTimingToken(String value) { return value.matches("^\\d{1,2}:\\d{2}-\\d{1,2}:\\d{2}$"); }
    private static boolean isInvalidWpm(int value) { return value < TpsSpec.MINIMUM_WPM || value > TpsSpec.MAXIMUM_WPM; }
    private static String buildInvalidWpmMessage(String value) { return "WPM value '" + value + "' must be between " + TpsSpec.MINIMUM_WPM + " and " + TpsSpec.MAXIMUM_WPM + "."; }
    private static boolean isKnownEmotion(String value) { return TpsSpec.EMOTIONS.contains(value.toLowerCase(Locale.ROOT)); }
    private static boolean isKnownArchetype(String value) { return value != null && TpsSpec.ARCHETYPES.stream().anyMatch(a -> a.equalsIgnoreCase(value)); }
    private static Integer resolveArchetypeWpm(String archetype) { if (archetype == null) return null; return TpsSpec.ARCHETYPE_RECOMMENDED_WPM.get(archetype.toLowerCase(Locale.ROOT)); }
    private static boolean isWhitespace(String value) { return value != null && !value.isEmpty() && Character.isWhitespace(value.charAt(0)); }
    private static boolean isSentenceEndingPunctuation(String text) { String trimmed = text.trim(); return !trimmed.isEmpty() && List.of(".", "!", "?").contains(trimmed.substring(trimmed.length() - 1)); }
    private static Integer tryResolvePauseMilliseconds(String argument) { String trimmed = normalizeValue(argument); if (trimmed == null) return null; String normalized = trimmed.toLowerCase(Locale.ROOT); if (normalized.endsWith("ms")) return Integer.parseInt(normalized.substring(0, normalized.length() - 2)); if (!normalized.endsWith("s")) return null; return (int) Math.round(Double.parseDouble(normalized.substring(0, normalized.length() - 1)) * 1000D); }
    private static int calculateWordDurationMs(String word, int effectiveWpm) { return Math.max(120, (int) Math.round((60000D / Math.max(1, effectiveWpm)) * (0.8D + (word.length() * 0.04D)))); }
    private static int calculateOrpIndex(String word) { String cleanWord = word; while (!cleanWord.isEmpty() && List.of(".", "!", "?", ",", ";", ":", "\"", "'", ")", "]", "}").contains(cleanWord.substring(cleanWord.length() - 1))) cleanWord = cleanWord.substring(0, cleanWord.length() - 1); int length = cleanWord.length(); if (length <= 1) return 0; double ratio = length <= 5 ? 0.3D : length <= 9 ? 0.35D : 0.4D; return Math.max(0, Math.min((int) Math.floor(length * ratio), length - 1)); }
    private static int resolveEffectiveWpm(int inheritedWpm, Integer speedOverride, Double speedMultiplier) { if (speedOverride != null) return speedMultiplier == null ? speedOverride : Math.max(1, (int) Math.round(speedOverride * speedMultiplier)); return speedMultiplier == null ? inheritedWpm : Math.max(1, (int) Math.round(inheritedWpm * speedMultiplier)); }
    private static int clamp(int value, int minimum, int maximum) { return Math.min(Math.max(value, minimum), maximum); }
    private static int clampWpm(int value) { return clamp(Math.round(value), TpsSpec.MINIMUM_WPM, TpsSpec.MAXIMUM_WPM); }
    private static int normalizeBaseWpm(int value) { return clampWpm(value); }
    private static int normalizeSpeedOffset(int baseWpm, int offsetWpm) { return clampWpm(baseWpm + offsetWpm) - baseWpm; }
    private static int normalizeSpeedStep(Integer value) { if (value == null) return TpsPlaybackDefaults.DEFAULT_SPEED_STEP_WPM; if (value <= 0) throw new IllegalArgumentException("speedStepWpm must be greater than 0."); return Math.max(1, value); }
    private static int normalizeTickInterval(Integer value) { if (value == null) return TpsPlaybackDefaults.DEFAULT_TICK_INTERVAL_MS; if (value <= 0) throw new IllegalArgumentException("tickIntervalMs must be greater than 0."); return Math.max(1, value); }
    private static long nowMs() { return System.currentTimeMillis(); }
    private static String protectEscapes(String text) { return text.replace("\\\\", "\uE006").replace("\\[", "\uE001").replace("\\]", "\uE002").replace("\\|", "\uE003").replace("\\/", "\uE004").replace("\\*", "\uE005"); }
    private static String restoreEscapes(String text) { return text.replace("\uE001", "[").replace("\uE002", "]").replace("\uE003", "|").replace("\uE004", "/").replace("\uE005", "*").replace("\uE006", "\\"); }
    private static boolean isStandalonePunctuationToken(String token) { if (token == null || token.trim().isEmpty()) return false; for (char character : token.trim().toCharArray()) if (!List.of(",", ".", ";", ":", "!", "?", "-", "—", "–", "…").contains(String.valueOf(character))) return false; return true; }
    private static String buildStandalonePunctuationSuffix(String token) { String trimmed = token.trim(); boolean dashOnly = trimmed.chars().allMatch(character -> character == '-' || character == '—' || character == '–'); return dashOnly ? " " + trimmed : trimmed; }
    private static String normalizeMetadataValue(String value) { String trimmed = value.trim(); return trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2 ? trimmed.substring(1, trimmed.length() - 1) : trimmed; }
    private static int[] findFrontMatterClosing(String source) { int blockClosingIndex = source.indexOf("\n---\n"); if (blockClosingIndex >= 0) return new int[]{blockClosingIndex, 5}; if (source.endsWith("\n---")) return new int[]{source.length() - 4, 4}; return null; }
    private static void validateMetadataEntry(String key, String value, int start, int end, List<Integer> lineStarts, List<TpsDiagnostic> diagnostics) { if (TpsFrontMatterKeys.BASE_WPM.equals(key)) { if (!INTEGER_PATTERN.matcher(value).matches()) { diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_FRONT_MATTER, "Front matter field 'base_wpm' must be an integer.", start, end, lineStarts, null)); return; } int parsed = Integer.parseInt(value); if (isInvalidWpm(parsed)) diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_WPM, buildInvalidWpmMessage(value), start, end, lineStarts, null)); return; } if (key.startsWith("speed_offsets.") && !INTEGER_PATTERN.matcher(value).matches()) diagnostics.add(createDiagnostic(TpsDiagnosticCodes.INVALID_FRONT_MATTER, "Front matter field '" + key + "' must be an integer.", start, end, lineStarts, null)); }
    private static List<HeaderPart> splitHeaderPartsDetailed(String rawHeaderContent) { List<HeaderPart> parts = new ArrayList<>(); StringBuilder current = new StringBuilder(); int partStart = 0; for (int index = 0; index < rawHeaderContent.length(); index += 1) { char character = rawHeaderContent.charAt(index); if (character == '|' && (index == 0 || rawHeaderContent.charAt(index - 1) != '\\')) { parts.add(new HeaderPart(restoreEscapes(current.toString()).trim(), partStart, index)); current.setLength(0); partStart = index + 1; continue; } current.append(character); } parts.add(new HeaderPart(restoreEscapes(current.toString()).trim(), partStart, rawHeaderContent.length())); return List.copyOf(parts); }
    private static <T> int lastIndexOf(List<T> values, java.util.function.Predicate<T> predicate) { for (int index = values.size() - 1; index >= 0; index -= 1) if (predicate.test(values.get(index))) return index; return -1; }
    private static boolean isPairedScope(String name) { return !TpsTags.PAUSE.equals(name) && !TpsTags.BREATH.equals(name) && !TpsTags.EDIT_POINT.equals(name); }
    private static boolean isSpokenWord(WordSeed word) { return "word".equals(word.kind()) && word.cleanText() != null && !word.cleanText().isBlank(); }
    private static TpsPlaybackStatus resolveStatusAfterSeek(TpsPlaybackStatus previousStatus, int totalDurationMs, int elapsedMs) {
        if (totalDurationMs == 0 || elapsedMs >= totalDurationMs) {
            return TpsPlaybackStatus.COMPLETED;
        }
        if (elapsedMs <= 0 && previousStatus == TpsPlaybackStatus.IDLE) {
            return TpsPlaybackStatus.IDLE;
        }
        return TpsPlaybackStatus.PAUSED;
    }
    private static TpsPosition positionFromOffset(int offset, List<Integer> lineStarts) { int lineIndex = 0; for (int index = 0; index < lineStarts.size(); index += 1) { if (lineStarts.get(index) > offset) break; lineIndex = index; } return new TpsPosition(lineIndex + 1, (offset - lineStarts.get(lineIndex)) + 1, offset); }
    private static int parseIntOrDefault(String value, int fallback) { try { return value == null ? fallback : Integer.parseInt(value); } catch (NumberFormatException exception) { return fallback; } }
    private static void putCompact(Map<String, Object> map, String key, Object value) { if (value != null) map.put(key, value); }
    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) { return (Map<String, Object>) value; }

    @SuppressWarnings("unchecked")
    private static List<Object> castList(Object value) { return value == null ? List.of() : (List<Object>) value; }
    private static String asString(Object value) { return Objects.toString(value, ""); }
    private static String nullableString(Object value) { return value == null ? null : value.toString(); }
    private static boolean asBoolean(Object value) { return Boolean.TRUE.equals(value) || value instanceof Number number && number.intValue() != 0 || "true".equalsIgnoreCase(String.valueOf(value)); }
    private static int asInt(Object value) { return ((Number) value).intValue(); }
    private static Integer asNullableInt(Object value) { return value == null ? null : ((Number) value).intValue(); }
    private static Double asNullableDouble(Object value) { return value == null ? null : ((Number) value).doubleValue(); }

    private static final Pattern INTEGER_PATTERN = Pattern.compile("^-?\\d+$");

    private static final class Json {
        private Json() { }
        private static String write(Object value) { StringBuilder builder = new StringBuilder(); writeValue(builder, value); return builder.toString(); }
        private static void writeValue(StringBuilder builder, Object value) { if (value == null) builder.append("null"); else if (value instanceof String string) builder.append('"').append(escape(string)).append('"'); else if (value instanceof Boolean || value instanceof Integer || value instanceof Long) builder.append(value); else if (value instanceof Double number) builder.append(Double.isFinite(number) ? normalizeJsonNumber(number) : "null"); else if (value instanceof Map<?, ?> map) { builder.append('{'); boolean first = true; List<String> keys = new ArrayList<>(); for (Object key : map.keySet()) keys.add(key.toString()); Collections.sort(keys); for (String key : keys) { if (!first) builder.append(','); first = false; builder.append('"').append(escape(key)).append('"').append(':'); writeValue(builder, map.get(key)); } builder.append('}'); } else if (value instanceof List<?> list) { builder.append('['); boolean first = true; for (Object item : list) { if (!first) builder.append(','); first = false; writeValue(builder, item); } builder.append(']'); } else builder.append('"').append(escape(value.toString())).append('"'); }
        private static String escape(String value) { return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t"); }
        private static String normalizeJsonNumber(double value) { long integer = Math.round(value); if (Math.abs(value - integer) < 0.0000001D) return Long.toString(integer); return Double.toString(((double) Math.round(value * 1_000_000D)) / 1_000_000D); }
    }

    private static final class JsonReader {
        private final String text;
        private int index = 0;

        private JsonReader(String text) { this.text = text; }
        private Object read() { skipWhitespace(); Object value = readValue(); skipWhitespace(); if (index != text.length()) throw new IllegalArgumentException("Unexpected trailing JSON content."); return value; }
        private Object readValue() { skipWhitespace(); if (index >= text.length()) throw new IllegalArgumentException("Unexpected end of JSON."); char current = text.charAt(index); return switch (current) { case '{' -> readObject(); case '[' -> readArray(); case '"' -> readString(); case 't' -> readLiteral("true", true); case 'f' -> readLiteral("false", false); case 'n' -> readLiteral("null", null); default -> readNumber(); }; }
        private Map<String, Object> readObject() { index += 1; skipWhitespace(); Map<String, Object> map = new LinkedHashMap<>(); if (peek('}')) { index += 1; return map; } while (true) { String key = readString(); skipWhitespace(); expect(':'); Object value = readValue(); map.put(key, value); skipWhitespace(); if (peek('}')) { index += 1; return map; } expect(','); } }
        private List<Object> readArray() { index += 1; skipWhitespace(); List<Object> list = new ArrayList<>(); if (peek(']')) { index += 1; return list; } while (true) { list.add(readValue()); skipWhitespace(); if (peek(']')) { index += 1; return list; } expect(','); } }
        private String readString() { expect('"'); StringBuilder builder = new StringBuilder(); while (index < text.length()) { char current = text.charAt(index++); if (current == '"') return builder.toString(); if (current == '\\') { char escaped = text.charAt(index++); builder.append(switch (escaped) { case '"', '\\', '/' -> escaped; case 'b' -> '\b'; case 'f' -> '\f'; case 'n' -> '\n'; case 'r' -> '\r'; case 't' -> '\t'; case 'u' -> (char) Integer.parseInt(text.substring(index, index += 4), 16); default -> throw new IllegalArgumentException("Unsupported escape sequence."); }); } else builder.append(current); } throw new IllegalArgumentException("Unterminated JSON string."); }
        private Object readNumber() { int start = index; if (peek('-')) index += 1; while (index < text.length() && Character.isDigit(text.charAt(index))) index += 1; boolean isDouble = false; if (peek('.')) { isDouble = true; index += 1; while (index < text.length() && Character.isDigit(text.charAt(index))) index += 1; } if (peek('e') || peek('E')) { isDouble = true; index += 1; if (peek('+') || peek('-')) index += 1; while (index < text.length() && Character.isDigit(text.charAt(index))) index += 1; } String value = text.substring(start, index); return isDouble ? Double.parseDouble(value) : Integer.parseInt(value); }
        private Object readLiteral(String literal, Object value) { if (!text.startsWith(literal, index)) throw new IllegalArgumentException("Invalid JSON literal."); index += literal.length(); return value; }
        private void skipWhitespace() { while (index < text.length() && Character.isWhitespace(text.charAt(index))) index += 1; }
        private void expect(char expected) { skipWhitespace(); if (index >= text.length() || text.charAt(index) != expected) throw new IllegalArgumentException("Expected '" + expected + "'."); index += 1; }
        private boolean peek(char expected) { return index < text.length() && text.charAt(index) == expected; }
    }
}
