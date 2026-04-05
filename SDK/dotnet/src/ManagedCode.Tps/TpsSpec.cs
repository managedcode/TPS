namespace ManagedCode.Tps;

public static class TpsSpec
{
    public const int DefaultBaseWpm = 140;
    public const int MaximumWpm = 220;
    public const int MinimumWpm = 80;
    public const int MediumPauseDurationMs = 600;
    public const int ShortPauseDurationMs = 300;
    public const string DefaultEmotion = "neutral";
    public const string DefaultImplicitSegmentName = "Content";
    public const string DefaultProfile = "Actor";
    public const string ArchetypePrefix = "Archetype:";
    public const string SpeakerPrefix = "Speaker:";
    public const string WpmSuffix = "WPM";

    public static class FrontMatterKeys
    {
        public const string Author = "author";
        public const string BaseWpm = "base_wpm";
        public const string Created = "created";
        public const string Duration = "duration";
        public const string Profile = "profile";
        public const string SpeedOffsetsFast = "speed_offsets.fast";
        public const string SpeedOffsetsSlow = "speed_offsets.slow";
        public const string SpeedOffsetsXfast = "speed_offsets.xfast";
        public const string SpeedOffsetsXslow = "speed_offsets.xslow";
        public const string Title = "title";
        public const string Version = "version";
    }

    public static class LegacyKeys
    {
        public const string DisplayDuration = "display_duration";
        public const string FastOffset = "fast_offset";
        public const string PresetsFast = "presets.fast";
        public const string PresetsSlow = "presets.slow";
        public const string PresetsXfast = "presets.xfast";
        public const string PresetsXslow = "presets.xslow";
        public const string SlowOffset = "slow_offset";
        public const string XfastOffset = "xfast_offset";
        public const string XslowOffset = "xslow_offset";
    }

    public static class Tags
    {
        public const string Aside = "aside";
        public const string Breath = "breath";
        public const string Building = "building";
        public const string EditPoint = "edit_point";
        public const string Emphasis = "emphasis";
        public const string Energy = "energy";
        public const string Fast = "fast";
        public const string Highlight = "highlight";
        public const string Legato = "legato";
        public const string Loud = "loud";
        public const string Melody = "melody";
        public const string Normal = "normal";
        public const string Pause = "pause";
        public const string Phonetic = "phonetic";
        public const string Pronunciation = "pronunciation";
        public const string Rhetorical = "rhetorical";
        public const string Sarcasm = "sarcasm";
        public const string Slow = "slow";
        public const string Soft = "soft";
        public const string Staccato = "staccato";
        public const string Stress = "stress";
        public const string Whisper = "whisper";
        public const string Xfast = "xfast";
        public const string Xslow = "xslow";
    }

    public static class DiagnosticCodes
    {
        public const string ArchetypeArticulationMismatch = "archetype-articulation-mismatch";
        public const string ArchetypeEnergyMismatch = "archetype-energy-mismatch";
        public const string ArchetypeMelodyMismatch = "archetype-melody-mismatch";
        public const string ArchetypeRhythmEmphasisDensity = "archetype-rhythm-emphasis-density";
        public const string ArchetypeRhythmPauseDuration = "archetype-rhythm-pause-duration";
        public const string ArchetypeRhythmPauseFrequency = "archetype-rhythm-pause-frequency";
        public const string ArchetypeRhythmPhraseLength = "archetype-rhythm-phrase-length";
        public const string ArchetypeRhythmSpeedVariation = "archetype-rhythm-speed-variation";
        public const string ArchetypeSpeedMismatch = "archetype-speed-mismatch";
        public const string ArchetypeVolumeMismatch = "archetype-volume-mismatch";
        public const string InvalidEnergyLevel = "invalid-energy-level";
        public const string InvalidFrontMatter = "invalid-front-matter";
        public const string InvalidHeader = "invalid-header";
        public const string InvalidHeaderParameter = "invalid-header-parameter";
        public const string InvalidMelodyLevel = "invalid-melody-level";
        public const string InvalidPause = "invalid-pause";
        public const string InvalidTagArgument = "invalid-tag-argument";
        public const string InvalidWpm = "invalid-wpm";
        public const string MismatchedClosingTag = "mismatched-closing-tag";
        public const string UnclosedTag = "unclosed-tag";
        public const string UnknownArchetype = "unknown-archetype";
        public const string UnknownTag = "unknown-tag";
        public const string UnterminatedTag = "unterminated-tag";
    }

    public static IReadOnlySet<string> WarningDiagnosticCodes { get; } =
        new HashSet<string>(StringComparer.Ordinal)
        {
            DiagnosticCodes.InvalidHeaderParameter,
            DiagnosticCodes.ArchetypeArticulationMismatch,
            DiagnosticCodes.ArchetypeEnergyMismatch,
            DiagnosticCodes.ArchetypeMelodyMismatch,
            DiagnosticCodes.ArchetypeVolumeMismatch,
            DiagnosticCodes.ArchetypeSpeedMismatch,
            DiagnosticCodes.ArchetypeRhythmPhraseLength,
            DiagnosticCodes.ArchetypeRhythmPauseFrequency,
            DiagnosticCodes.ArchetypeRhythmPauseDuration,
            DiagnosticCodes.ArchetypeRhythmEmphasisDensity,
            DiagnosticCodes.ArchetypeRhythmSpeedVariation
        };

    public static IReadOnlyList<string> Emotions { get; } =
    [
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
        "energetic"
    ];

    public static IReadOnlyList<string> DeliveryModes { get; } =
    [
        Tags.Sarcasm,
        Tags.Aside,
        Tags.Rhetorical,
        Tags.Building
    ];

    public static IReadOnlyList<string> VolumeLevels { get; } =
    [
        Tags.Loud,
        Tags.Soft,
        Tags.Whisper
    ];

    public static IReadOnlyList<string> RelativeSpeedTags { get; } =
    [
        Tags.Xslow,
        Tags.Slow,
        Tags.Fast,
        Tags.Xfast,
        Tags.Normal
    ];

    public static IReadOnlyList<string> EditPointPriorities { get; } =
    [
        "high",
        "medium",
        "low"
    ];

    public static IReadOnlyList<string> ArticulationStyles { get; } = [Tags.Legato, Tags.Staccato];

    public static class ArchetypeNames
    {
        public const string Friend = "friend";
        public const string Motivator = "motivator";
        public const string Educator = "educator";
        public const string Coach = "coach";
        public const string Storyteller = "storyteller";
        public const string Entertainer = "entertainer";
    }

    public static IReadOnlyList<string> Archetypes { get; } =
    [
        ArchetypeNames.Friend,
        ArchetypeNames.Motivator,
        ArchetypeNames.Educator,
        ArchetypeNames.Coach,
        ArchetypeNames.Storyteller,
        ArchetypeNames.Entertainer
    ];

    public static IReadOnlyDictionary<string, int> ArchetypeRecommendedWpm { get; } =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            [ArchetypeNames.Friend] = 135,
            [ArchetypeNames.Motivator] = 155,
            [ArchetypeNames.Educator] = 120,
            [ArchetypeNames.Coach] = 145,
            [ArchetypeNames.Storyteller] = 125,
            [ArchetypeNames.Entertainer] = 150
        };

    public static class ArchetypeArticulationExpectations
    {
        public const string Flexible = "flexible";
        public const string Legato = "legato";
        public const string Neutral = "neutral";
        public const string Staccato = "staccato";
    }

    public static class ArchetypeVolumeExpectations
    {
        public const string DefaultOnly = "default-only";
        public const string Flexible = "flexible";
        public const string LoudOnly = "loud-only";
        public const string SoftOrDefault = "soft-or-default";
    }

    public static IReadOnlyDictionary<string, TpsArchetypeProfile> ArchetypeProfiles { get; } =
        new Dictionary<string, TpsArchetypeProfile>(StringComparer.OrdinalIgnoreCase)
        {
            [ArchetypeNames.Friend] = new(ArchetypeArticulationExpectations.Legato, new NumericRange(4, 6), new NumericRange(6, 8), ArchetypeVolumeExpectations.SoftOrDefault, new NumericRange(125, 150)),
            [ArchetypeNames.Motivator] = new(ArchetypeArticulationExpectations.Legato, new NumericRange(7, 10), new NumericRange(7, 9), ArchetypeVolumeExpectations.LoudOnly, new NumericRange(145, 170)),
            [ArchetypeNames.Educator] = new(ArchetypeArticulationExpectations.Neutral, new NumericRange(3, 5), new NumericRange(2, 4), ArchetypeVolumeExpectations.DefaultOnly, new NumericRange(110, 135)),
            [ArchetypeNames.Coach] = new(ArchetypeArticulationExpectations.Staccato, new NumericRange(7, 9), new NumericRange(1, 3), ArchetypeVolumeExpectations.LoudOnly, new NumericRange(135, 160)),
            [ArchetypeNames.Storyteller] = new(ArchetypeArticulationExpectations.Flexible, new NumericRange(4, 7), new NumericRange(8, 10), ArchetypeVolumeExpectations.Flexible, new NumericRange(100, 150)),
            [ArchetypeNames.Entertainer] = new(ArchetypeArticulationExpectations.Flexible, new NumericRange(6, 8), new NumericRange(7, 9), ArchetypeVolumeExpectations.Flexible, new NumericRange(140, 165))
        };

    public const int ArchetypeRhythmMinimumWords = 12;

    public static IReadOnlyDictionary<string, TpsArchetypeRhythmProfile> ArchetypeRhythmProfiles { get; } =
        new Dictionary<string, TpsArchetypeRhythmProfile>(StringComparer.OrdinalIgnoreCase)
        {
            [ArchetypeNames.Friend] = new(new NumericRange(8, 15), new NumericRange(4, 8), new NumericRange(300, 600), new NumericRange(3, 8), new NumericRange(0, 1)),
            [ArchetypeNames.Motivator] = new(new NumericRange(8, 20), new NumericRange(3, 6), new NumericRange(600, 2000), new NumericRange(10, 20), new NumericRange(0, 2)),
            [ArchetypeNames.Educator] = new(new NumericRange(10, 25), new NumericRange(6, 12), new NumericRange(400, 800), new NumericRange(3, 8), new NumericRange(0, 2)),
            [ArchetypeNames.Coach] = new(new NumericRange(3, 8), new NumericRange(8, 15), new NumericRange(200, 400), new NumericRange(15, 30), new NumericRange(0, 2)),
            [ArchetypeNames.Storyteller] = new(new NumericRange(5, 20), new NumericRange(4, 10), new NumericRange(500, 3000), new NumericRange(5, 12), new NumericRange(3, 6)),
            [ArchetypeNames.Entertainer] = new(new NumericRange(5, 15), new NumericRange(5, 10), new NumericRange(300, 2000), new NumericRange(5, 15), new NumericRange(2, 4))
        };

    public const int EnergyLevelMin = 1;
    public const int EnergyLevelMax = 10;
    public const int MelodyLevelMin = 1;
    public const int MelodyLevelMax = 10;

    public static IReadOnlyDictionary<string, int> DefaultSpeedOffsets { get; } =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            [Tags.Xslow] = -40,
            [Tags.Slow] = -20,
            [Tags.Fast] = 25,
            [Tags.Xfast] = 50
        };

    public static IReadOnlyDictionary<string, EmotionPalette> EmotionPalettes { get; } =
        new Dictionary<string, EmotionPalette>(StringComparer.OrdinalIgnoreCase)
        {
            [DefaultEmotion] = new("#2563EB", "#0F172A", "#60A5FA"),
            ["warm"] = new("#EA580C", "#1C1917", "#FDBA74"),
            ["professional"] = new("#1D4ED8", "#0F172A", "#93C5FD"),
            ["focused"] = new("#15803D", "#052E16", "#86EFAC"),
            ["concerned"] = new("#B91C1C", "#1F1111", "#FCA5A5"),
            ["urgent"] = new("#DC2626", "#FFF7F7", "#FCA5A5"),
            ["motivational"] = new("#7C3AED", "#FFFFFF", "#C4B5FD"),
            ["excited"] = new("#DB2777", "#FFF7FB", "#F9A8D4"),
            ["happy"] = new("#D97706", "#1C1917", "#FCD34D"),
            ["sad"] = new("#4F46E5", "#EEF2FF", "#A5B4FC"),
            ["calm"] = new("#0F766E", "#F0FDFA", "#99F6E4"),
            ["energetic"] = new("#C2410C", "#FFF7ED", "#FDBA74")
        };

    public static IReadOnlyDictionary<string, string> EmotionHeadCues { get; } =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [DefaultEmotion] = "H0",
            ["calm"] = "H0",
            ["professional"] = "H9",
            ["focused"] = "H5",
            ["motivational"] = "H9",
            ["urgent"] = "H4",
            ["concerned"] = "H1",
            ["sad"] = "H1",
            ["warm"] = "H7",
            ["happy"] = "H6",
            ["excited"] = "H6",
            ["energetic"] = "H8"
        };
}

public sealed record EmotionPalette(string Accent, string Text, string Background);

public sealed record NumericRange(int Min, int Max);

public sealed record TpsArchetypeProfile(
    string Articulation,
    NumericRange Energy,
    NumericRange Melody,
    string Volume,
    NumericRange Speed);

public sealed record TpsArchetypeRhythmProfile(
    NumericRange PhraseLength,
    NumericRange PauseFrequencyPer100Words,
    NumericRange AveragePauseDurationMs,
    NumericRange EmphasisDensityPercent,
    NumericRange SpeedVariationPer100Words);
