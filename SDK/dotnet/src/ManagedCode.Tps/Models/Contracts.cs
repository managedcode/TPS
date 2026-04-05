using System.Text.Json.Serialization;

namespace ManagedCode.Tps.Models;

[JsonConverter(typeof(TpsSeverityJsonConverter))]
public enum TpsSeverity
{
    Info,
    Warning,
    Error
}

internal interface ICompiledTimeRange
{
    int StartWordIndex { get; set; }

    int EndWordIndex { get; set; }

    int StartMs { get; set; }

    int EndMs { get; set; }
}

public sealed record TpsPosition(
    [property: JsonPropertyName("line")] int Line,
    [property: JsonPropertyName("column")] int Column,
    [property: JsonPropertyName("offset")] int Offset);

public sealed record TpsRange(
    [property: JsonPropertyName("start")] TpsPosition Start,
    [property: JsonPropertyName("end")] TpsPosition End);

public sealed record TpsDiagnostic(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("severity")] TpsSeverity Severity,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("range")] TpsRange Range,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [property: JsonPropertyName("suggestion")] string? Suggestion = null);

public class TpsValidationResult
{
    [JsonPropertyName("ok")]
    public required bool Ok { get; init; }

    [JsonPropertyName("diagnostics")]
    public required IReadOnlyList<TpsDiagnostic> Diagnostics { get; init; }
}

public sealed class TpsParseResult : TpsValidationResult
{
    [JsonPropertyName("document")]
    public required TpsDocument Document { get; init; }
}

public sealed class TpsCompilationResult : TpsValidationResult
{
    [JsonPropertyName("document")]
    public required TpsDocument Document { get; init; }

    [JsonPropertyName("script")]
    public required CompiledScript Script { get; init; }
}

public sealed class TpsDocument
{
    [JsonPropertyName("metadata")]
    public IReadOnlyDictionary<string, string> Metadata { get; init; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    [JsonPropertyName("segments")]
    public IReadOnlyList<TpsSegment> Segments { get; init; } = Array.Empty<TpsSegment>();
}

public sealed class TpsSegment
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonInclude]
    [JsonPropertyName("content")]
    public string Content { get; internal set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("targetWpm")]
    public int? TargetWpm { get; init; }

    [JsonPropertyName("emotion")]
    public required string Emotion { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("speaker")]
    public string? Speaker { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("archetype")]
    public string? Archetype { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("timing")]
    public string? Timing { get; init; }

    [JsonPropertyName("backgroundColor")]
    public required string BackgroundColor { get; init; }

    [JsonPropertyName("textColor")]
    public required string TextColor { get; init; }

    [JsonPropertyName("accentColor")]
    public required string AccentColor { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonInclude]
    [JsonPropertyName("leadingContent")]
    public string? LeadingContent { get; internal set; }

    [JsonPropertyName("blocks")]
    public IReadOnlyList<TpsBlock> Blocks { get; init; } = Array.Empty<TpsBlock>();
}

public sealed class TpsBlock
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonInclude]
    [JsonPropertyName("content")]
    public string Content { get; internal set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("targetWpm")]
    public int? TargetWpm { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("emotion")]
    public string? Emotion { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("speaker")]
    public string? Speaker { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("archetype")]
    public string? Archetype { get; init; }
}

public sealed record WordMetadata
{
    [JsonPropertyName("isEmphasis")]
    public bool IsEmphasis { get; init; }

    [JsonPropertyName("emphasisLevel")]
    public int EmphasisLevel { get; init; }

    [JsonPropertyName("isPause")]
    public bool IsPause { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("pauseDurationMs")]
    public int? PauseDurationMs { get; init; }

    [JsonPropertyName("isHighlight")]
    public bool IsHighlight { get; init; }

    [JsonPropertyName("isBreath")]
    public bool IsBreath { get; init; }

    [JsonPropertyName("isEditPoint")]
    public bool IsEditPoint { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("editPointPriority")]
    public string? EditPointPriority { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("emotionHint")]
    public string? EmotionHint { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("inlineEmotionHint")]
    public string? InlineEmotionHint { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("volumeLevel")]
    public string? VolumeLevel { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("deliveryMode")]
    public string? DeliveryMode { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("articulationStyle")]
    public string? ArticulationStyle { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("energyLevel")]
    public int? EnergyLevel { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("melodyLevel")]
    public int? MelodyLevel { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("phoneticGuide")]
    public string? PhoneticGuide { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("pronunciationGuide")]
    public string? PronunciationGuide { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("stressText")]
    public string? StressText { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("stressGuide")]
    public string? StressGuide { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("speedOverride")]
    public int? SpeedOverride { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("speedMultiplier")]
    public double? SpeedMultiplier { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("speaker")]
    public string? Speaker { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("headCue")]
    public string? HeadCue { get; init; }
}

public sealed class CompiledWord
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("index")]
    public required int Index { get; init; }

    [JsonPropertyName("kind")]
    public required string Kind { get; init; }

    [JsonInclude]
    [JsonPropertyName("cleanText")]
    public string CleanText { get; internal set; } = string.Empty;

    [JsonInclude]
    [JsonPropertyName("characterCount")]
    public int CharacterCount { get; internal set; }

    [JsonInclude]
    [JsonPropertyName("orpPosition")]
    public int OrpPosition { get; internal set; }

    [JsonPropertyName("displayDurationMs")]
    public required int DisplayDurationMs { get; init; }

    [JsonPropertyName("startMs")]
    public required int StartMs { get; init; }

    [JsonPropertyName("endMs")]
    public required int EndMs { get; init; }

    [JsonPropertyName("metadata")]
    public required WordMetadata Metadata { get; init; }

    [JsonPropertyName("segmentId")]
    public required string SegmentId { get; init; }

    [JsonPropertyName("blockId")]
    public required string BlockId { get; init; }

    [JsonInclude]
    [JsonPropertyName("phraseId")]
    public string PhraseId { get; internal set; } = string.Empty;
}

public sealed class CompiledPhrase
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("text")]
    public required string Text { get; init; }

    [JsonPropertyName("startWordIndex")]
    public required int StartWordIndex { get; init; }

    [JsonPropertyName("endWordIndex")]
    public required int EndWordIndex { get; init; }

    [JsonPropertyName("startMs")]
    public required int StartMs { get; init; }

    [JsonPropertyName("endMs")]
    public required int EndMs { get; init; }

    [JsonPropertyName("words")]
    public required IReadOnlyList<CompiledWord> Words { get; init; }
}

public sealed class CompiledBlock : ICompiledTimeRange
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("targetWpm")]
    public required int TargetWpm { get; init; }

    [JsonPropertyName("emotion")]
    public required string Emotion { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("speaker")]
    public string? Speaker { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("archetype")]
    public string? Archetype { get; init; }

    [JsonPropertyName("isImplicit")]
    public required bool IsImplicit { get; init; }

    int ICompiledTimeRange.StartWordIndex
    {
        get => StartWordIndex;
        set => StartWordIndex = value;
    }

    [JsonInclude]
    [JsonPropertyName("startWordIndex")]
    public int StartWordIndex { get; internal set; }

    int ICompiledTimeRange.EndWordIndex
    {
        get => EndWordIndex;
        set => EndWordIndex = value;
    }

    [JsonInclude]
    [JsonPropertyName("endWordIndex")]
    public int EndWordIndex { get; internal set; }

    int ICompiledTimeRange.StartMs
    {
        get => StartMs;
        set => StartMs = value;
    }

    [JsonInclude]
    [JsonPropertyName("startMs")]
    public int StartMs { get; internal set; }

    int ICompiledTimeRange.EndMs
    {
        get => EndMs;
        set => EndMs = value;
    }

    [JsonInclude]
    [JsonPropertyName("endMs")]
    public int EndMs { get; internal set; }

    [JsonPropertyName("phrases")]
    public IReadOnlyList<CompiledPhrase> Phrases { get; init; } = Array.Empty<CompiledPhrase>();

    [JsonPropertyName("words")]
    public IReadOnlyList<CompiledWord> Words { get; init; } = Array.Empty<CompiledWord>();
}

public sealed class CompiledSegment : ICompiledTimeRange
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("targetWpm")]
    public required int TargetWpm { get; init; }

    [JsonPropertyName("emotion")]
    public required string Emotion { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("speaker")]
    public string? Speaker { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("archetype")]
    public string? Archetype { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("timing")]
    public string? Timing { get; init; }

    [JsonPropertyName("backgroundColor")]
    public required string BackgroundColor { get; init; }

    [JsonPropertyName("textColor")]
    public required string TextColor { get; init; }

    [JsonPropertyName("accentColor")]
    public required string AccentColor { get; init; }

    int ICompiledTimeRange.StartWordIndex
    {
        get => StartWordIndex;
        set => StartWordIndex = value;
    }

    [JsonInclude]
    [JsonPropertyName("startWordIndex")]
    public int StartWordIndex { get; internal set; }

    int ICompiledTimeRange.EndWordIndex
    {
        get => EndWordIndex;
        set => EndWordIndex = value;
    }

    [JsonInclude]
    [JsonPropertyName("endWordIndex")]
    public int EndWordIndex { get; internal set; }

    int ICompiledTimeRange.StartMs
    {
        get => StartMs;
        set => StartMs = value;
    }

    [JsonInclude]
    [JsonPropertyName("startMs")]
    public int StartMs { get; internal set; }

    int ICompiledTimeRange.EndMs
    {
        get => EndMs;
        set => EndMs = value;
    }

    [JsonInclude]
    [JsonPropertyName("endMs")]
    public int EndMs { get; internal set; }

    [JsonPropertyName("blocks")]
    public IReadOnlyList<CompiledBlock> Blocks { get; init; } = Array.Empty<CompiledBlock>();

    [JsonPropertyName("words")]
    public IReadOnlyList<CompiledWord> Words { get; init; } = Array.Empty<CompiledWord>();
}

public sealed class CompiledScript
{
    [JsonPropertyName("metadata")]
    public IReadOnlyDictionary<string, string> Metadata { get; init; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    [JsonInclude]
    [JsonPropertyName("totalDurationMs")]
    public int TotalDurationMs { get; internal set; }

    [JsonPropertyName("segments")]
    public IReadOnlyList<CompiledSegment> Segments { get; init; } = Array.Empty<CompiledSegment>();

    [JsonPropertyName("words")]
    public IReadOnlyList<CompiledWord> Words { get; init; } = Array.Empty<CompiledWord>();
}

public sealed class PlayerPresentationModel
{
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("segmentName")]
    public string? SegmentName { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("blockName")]
    public string? BlockName { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("phraseText")]
    public string? PhraseText { get; init; }

    [JsonPropertyName("visibleWords")]
    public required IReadOnlyList<CompiledWord> VisibleWords { get; init; }

    [JsonPropertyName("activeWordInPhrase")]
    public required int ActiveWordInPhrase { get; init; }
}

public sealed class PlayerState
{
    [JsonPropertyName("elapsedMs")]
    public required int ElapsedMs { get; init; }

    [JsonPropertyName("remainingMs")]
    public required int RemainingMs { get; init; }

    [JsonPropertyName("progress")]
    public required double Progress { get; init; }

    [JsonPropertyName("isComplete")]
    public required bool IsComplete { get; init; }

    [JsonPropertyName("currentWordIndex")]
    public required int CurrentWordIndex { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("currentWord")]
    public CompiledWord? CurrentWord { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("previousWord")]
    public CompiledWord? PreviousWord { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("nextWord")]
    public CompiledWord? NextWord { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("currentSegment")]
    public CompiledSegment? CurrentSegment { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("currentBlock")]
    public CompiledBlock? CurrentBlock { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("currentPhrase")]
    public CompiledPhrase? CurrentPhrase { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("nextTransitionMs")]
    public int? NextTransitionMs { get; init; }

    [JsonPropertyName("presentation")]
    public required PlayerPresentationModel Presentation { get; init; }
}
