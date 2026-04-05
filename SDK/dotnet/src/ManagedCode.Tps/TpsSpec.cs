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

    public static class EmotionNames
    {
        public const string Neutral = DefaultEmotion;
        public const string Warm = "warm";
        public const string Professional = "professional";
        public const string Focused = "focused";
        public const string Concerned = "concerned";
        public const string Urgent = "urgent";
        public const string Motivational = "motivational";
        public const string Excited = "excited";
        public const string Happy = "happy";
        public const string Sad = "sad";
        public const string Calm = "calm";
        public const string Energetic = "energetic";
    }

    public static class EditPointPriorityNames
    {
        public const string High = "high";
        public const string Medium = "medium";
        public const string Low = "low";
    }

    public static class HeadCueCodes
    {
        public const string H0 = "H0";
        public const string H1 = "H1";
        public const string H4 = "H4";
        public const string H5 = "H5";
        public const string H6 = "H6";
        public const string H7 = "H7";
        public const string H8 = "H8";
        public const string H9 = "H9";
    }

    public static class PaletteHex
    {
        public const string AccentBlue = "#2563EB";
        public const string TextSlate900 = "#0F172A";
        public const string BackgroundBlue400 = "#60A5FA";
        public const string AccentOrange600 = "#EA580C";
        public const string TextStone900 = "#1C1917";
        public const string BackgroundOrange300 = "#FDBA74";
        public const string AccentBlue700 = "#1D4ED8";
        public const string BackgroundBlue300 = "#93C5FD";
        public const string AccentGreen700 = "#15803D";
        public const string TextGreen950 = "#052E16";
        public const string BackgroundGreen300 = "#86EFAC";
        public const string AccentRed700 = "#B91C1C";
        public const string TextRose950 = "#1F1111";
        public const string BackgroundRed300 = "#FCA5A5";
        public const string AccentRed600 = "#DC2626";
        public const string TextWhiteRose = "#FFF7F7";
        public const string AccentViolet600 = "#7C3AED";
        public const string TextWhite = "#FFFFFF";
        public const string BackgroundViolet300 = "#C4B5FD";
        public const string AccentPink600 = "#DB2777";
        public const string TextWhitePink = "#FFF7FB";
        public const string BackgroundPink300 = "#F9A8D4";
        public const string AccentAmber600 = "#D97706";
        public const string BackgroundAmber300 = "#FCD34D";
        public const string AccentIndigo600 = "#4F46E5";
        public const string TextIndigo50 = "#EEF2FF";
        public const string BackgroundIndigo300 = "#A5B4FC";
        public const string AccentTeal700 = "#0F766E";
        public const string TextTeal50 = "#F0FDFA";
        public const string BackgroundTeal200 = "#99F6E4";
        public const string AccentOrange700 = "#C2410C";
        public const string TextOrange50 = "#FFF7ED";
    }

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
        EmotionNames.Neutral,
        EmotionNames.Warm,
        EmotionNames.Professional,
        EmotionNames.Focused,
        EmotionNames.Concerned,
        EmotionNames.Urgent,
        EmotionNames.Motivational,
        EmotionNames.Excited,
        EmotionNames.Happy,
        EmotionNames.Sad,
        EmotionNames.Calm,
        EmotionNames.Energetic
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
        EditPointPriorityNames.High,
        EditPointPriorityNames.Medium,
        EditPointPriorityNames.Low
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
            [EmotionNames.Neutral] = new(PaletteHex.AccentBlue, PaletteHex.TextSlate900, PaletteHex.BackgroundBlue400),
            [EmotionNames.Warm] = new(PaletteHex.AccentOrange600, PaletteHex.TextStone900, PaletteHex.BackgroundOrange300),
            [EmotionNames.Professional] = new(PaletteHex.AccentBlue700, PaletteHex.TextSlate900, PaletteHex.BackgroundBlue300),
            [EmotionNames.Focused] = new(PaletteHex.AccentGreen700, PaletteHex.TextGreen950, PaletteHex.BackgroundGreen300),
            [EmotionNames.Concerned] = new(PaletteHex.AccentRed700, PaletteHex.TextRose950, PaletteHex.BackgroundRed300),
            [EmotionNames.Urgent] = new(PaletteHex.AccentRed600, PaletteHex.TextWhiteRose, PaletteHex.BackgroundRed300),
            [EmotionNames.Motivational] = new(PaletteHex.AccentViolet600, PaletteHex.TextWhite, PaletteHex.BackgroundViolet300),
            [EmotionNames.Excited] = new(PaletteHex.AccentPink600, PaletteHex.TextWhitePink, PaletteHex.BackgroundPink300),
            [EmotionNames.Happy] = new(PaletteHex.AccentAmber600, PaletteHex.TextStone900, PaletteHex.BackgroundAmber300),
            [EmotionNames.Sad] = new(PaletteHex.AccentIndigo600, PaletteHex.TextIndigo50, PaletteHex.BackgroundIndigo300),
            [EmotionNames.Calm] = new(PaletteHex.AccentTeal700, PaletteHex.TextTeal50, PaletteHex.BackgroundTeal200),
            [EmotionNames.Energetic] = new(PaletteHex.AccentOrange700, PaletteHex.TextOrange50, PaletteHex.BackgroundOrange300)
        };

    public static IReadOnlyDictionary<string, string> EmotionHeadCues { get; } =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [EmotionNames.Neutral] = HeadCueCodes.H0,
            [EmotionNames.Calm] = HeadCueCodes.H0,
            [EmotionNames.Professional] = HeadCueCodes.H9,
            [EmotionNames.Focused] = HeadCueCodes.H5,
            [EmotionNames.Motivational] = HeadCueCodes.H9,
            [EmotionNames.Urgent] = HeadCueCodes.H4,
            [EmotionNames.Concerned] = HeadCueCodes.H1,
            [EmotionNames.Sad] = HeadCueCodes.H1,
            [EmotionNames.Warm] = HeadCueCodes.H7,
            [EmotionNames.Happy] = HeadCueCodes.H6,
            [EmotionNames.Excited] = HeadCueCodes.H6,
            [EmotionNames.Energetic] = HeadCueCodes.H8
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
