using System.Text;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Internal;

internal sealed class TpsContentCompiler
{
    public ContentCompilationResult Compile(
        string rawText,
        int startOffset,
        InheritedFormattingState inherited,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        var protectedText = TpsEscaping.Protect(rawText);
        var words = new List<WordSeed>();
        var phrases = new List<PhraseSeed>();
        var currentPhrase = new List<WordSeed>();
        var scopes = new List<InlineScope>();
        var literalScopes = new List<string>();
        var builder = new StringBuilder();
        TokenAccumulator? token = null;

        for (var index = 0; index < protectedText.Length; index++)
        {
            var currentCharacter = protectedText[index];
            if (TryHandleMarkdownMarker(protectedText, ref index, scopes))
            {
                FinalizeToken(words, phrases, currentPhrase, builder, ref token, inherited);
                continue;
            }

            if (currentCharacter == '[')
            {
                var tag = ReadTagToken(protectedText, index);
                if (tag is null)
                {
                    diagnostics.Add(TpsSupport.CreateDiagnostic(
                        TpsSpec.DiagnosticCodes.UnterminatedTag,
                        "Tag is missing a closing ] bracket.",
                        startOffset + index,
                        startOffset + protectedText.Length,
                        lineStarts));
                    AppendLiteral(protectedText[index..], scopes, inherited, builder, ref token);
                    break;
                }

                if (RequiresTokenBoundary(tag.Name))
                {
                    FinalizeToken(words, phrases, currentPhrase, builder, ref token, inherited);
                }

                if (HandleTagToken(tag, literalScopes, scopes, words, phrases, currentPhrase, inherited, startOffset + index, lineStarts, diagnostics))
                {
                    index += tag.Raw.Length - 1;
                    continue;
                }

                AppendLiteral(tag.Raw, scopes, inherited, builder, ref token);
                index += tag.Raw.Length - 1;
                continue;
            }

            if (TryHandleSlashPause(protectedText, index, builder, token))
            {
                FinalizeToken(words, phrases, currentPhrase, builder, ref token, inherited);
                FlushPhrase(phrases, currentPhrase);
                var pauseDuration = index + 1 < protectedText.Length && protectedText[index + 1] == '/'
                    ? TpsSpec.MediumPauseDurationMs
                    : TpsSpec.ShortPauseDurationMs;
                words.Add(CreateControlWord("pause", inherited, pauseDuration));
                if (pauseDuration == TpsSpec.MediumPauseDurationMs)
                {
                    index++;
                }

                continue;
            }

            if (char.IsWhiteSpace(currentCharacter))
            {
                FinalizeToken(words, phrases, currentPhrase, builder, ref token, inherited);
                continue;
            }

            AppendCharacter(currentCharacter, scopes, inherited, builder, ref token);
        }

        FinalizeToken(words, phrases, currentPhrase, builder, ref token, inherited);
        FlushPhrase(phrases, currentPhrase);
        foreach (var scope in scopes)
        {
            diagnostics.Add(TpsSupport.CreateDiagnostic(
                TpsSpec.DiagnosticCodes.UnclosedTag,
                $"Tag '{scope.Name}' was opened but never closed.",
                startOffset + rawText.Length,
                startOffset + rawText.Length,
                lineStarts));
        }

        return new ContentCompilationResult(words, phrases);
    }

    private static bool HandleTagToken(
        TagToken tag,
        List<string> literalScopes,
        List<InlineScope> scopes,
        List<WordSeed> words,
        List<PhraseSeed> phrases,
        List<WordSeed> currentPhrase,
        InheritedFormattingState inherited,
        int absoluteOffset,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        if (tag.IsClosing)
        {
            return HandleClosingTag(tag, literalScopes, scopes, absoluteOffset, lineStarts, diagnostics);
        }

        if (string.Equals(tag.Name, TpsSpec.Tags.Pause, StringComparison.Ordinal))
        {
            var pauseDuration = TpsSupport.TryResolvePauseMilliseconds(tag.Argument);
            if (pauseDuration is null)
            {
                diagnostics.Add(TpsSupport.CreateDiagnostic(
                    TpsSpec.DiagnosticCodes.InvalidPause,
                    "Pause duration must use Ns or Nms syntax.",
                    absoluteOffset,
                    absoluteOffset + tag.Raw.Length,
                    lineStarts));
                return false;
            }

            FlushPhrase(phrases, currentPhrase);
            words.Add(CreateControlWord("pause", inherited, pauseDuration));
            return true;
        }

        if (string.Equals(tag.Name, TpsSpec.Tags.Breath, StringComparison.Ordinal))
        {
            words.Add(CreateControlWord("breath", inherited));
            return true;
        }

        if (string.Equals(tag.Name, TpsSpec.Tags.EditPoint, StringComparison.Ordinal))
        {
            if (tag.Argument is not null && !TpsSpec.EditPointPriorities.Contains(tag.Argument, StringComparer.OrdinalIgnoreCase))
            {
                diagnostics.Add(TpsSupport.CreateDiagnostic(
                    TpsSpec.DiagnosticCodes.InvalidTagArgument,
                    $"Edit point priority '{tag.Argument}' is not supported.",
                    absoluteOffset,
                    absoluteOffset + tag.Raw.Length,
                    lineStarts));
                return false;
            }

            words.Add(CreateControlWord("edit-point", inherited, null, tag.Argument));
            return true;
        }

        var scope = CreateScope(tag, inherited.SpeedOffsets, absoluteOffset, lineStarts, diagnostics);
        if (scope is null)
        {
            literalScopes.Add(tag.Name);
            return false;
        }

        scopes.Add(scope);
        return true;
    }

    private static bool HandleClosingTag(
        TagToken tag,
        List<string> literalScopes,
        List<InlineScope> scopes,
        int absoluteOffset,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        var literalIndex = literalScopes.FindLastIndex(name => string.Equals(name, tag.Name, StringComparison.Ordinal));
        if (literalIndex >= 0)
        {
            literalScopes.RemoveAt(literalIndex);
            return false;
        }

        var scopeIndex = scopes.FindLastIndex(scope => string.Equals(scope.Name, tag.Name, StringComparison.Ordinal));
        if (scopeIndex < 0)
        {
            diagnostics.Add(TpsSupport.CreateDiagnostic(
                TpsSpec.DiagnosticCodes.MismatchedClosingTag,
                $"Closing tag '{tag.Name}' does not match any open scope.",
                absoluteOffset,
                absoluteOffset + tag.Raw.Length,
                lineStarts));
            return false;
        }

        scopes.RemoveAt(scopeIndex);
        return true;
    }

    private static InlineScope? CreateScope(
        TagToken tag,
        IReadOnlyDictionary<string, int> speedOffsets,
        int absoluteOffset,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        if (tag.Name is TpsSpec.Tags.Phonetic or TpsSpec.Tags.Pronunciation)
        {
            if (tag.Argument is null)
            {
                diagnostics.Add(TpsSupport.CreateDiagnostic(
                    TpsSpec.DiagnosticCodes.InvalidTagArgument,
                    $"Tag '{tag.Name}' requires a pronunciation parameter.",
                    absoluteOffset,
                    absoluteOffset + tag.Raw.Length,
                    lineStarts));
                return null;
            }

            return new InlineScope(
                tag.Name,
                PhoneticGuide: string.Equals(tag.Name, TpsSpec.Tags.Phonetic, StringComparison.Ordinal) ? tag.Argument : null,
                PronunciationGuide: string.Equals(tag.Name, TpsSpec.Tags.Pronunciation, StringComparison.Ordinal) ? tag.Argument : null);
        }

        if (string.Equals(tag.Name, TpsSpec.Tags.Stress, StringComparison.Ordinal))
        {
            return new InlineScope(tag.Name, StressGuide: tag.Argument, StressWrap: tag.Argument is null);
        }

        if (string.Equals(tag.Name, TpsSpec.Tags.Emphasis, StringComparison.Ordinal))
        {
            return new InlineScope(tag.Name, EmphasisLevel: 1);
        }

        if (string.Equals(tag.Name, TpsSpec.Tags.Highlight, StringComparison.Ordinal))
        {
            return new InlineScope(tag.Name, Highlight: true);
        }

        if (TpsSpec.VolumeLevels.Contains(tag.Name, StringComparer.OrdinalIgnoreCase))
        {
            return new InlineScope(tag.Name, VolumeLevel: tag.Name);
        }

        if (TpsSpec.DeliveryModes.Contains(tag.Name, StringComparer.OrdinalIgnoreCase))
        {
            return new InlineScope(tag.Name, DeliveryMode: tag.Name);
        }

        if (TpsSpec.Emotions.Contains(tag.Name, StringComparer.OrdinalIgnoreCase))
        {
            return new InlineScope(tag.Name, InlineEmotion: tag.Name);
        }

        if (TpsSupport.TryParseAbsoluteWpm(tag.Name) is int absoluteSpeed)
        {
            return new InlineScope(tag.Name, AbsoluteSpeed: absoluteSpeed);
        }

        if (TpsSupport.ResolveSpeedMultiplier(tag.Name, speedOffsets) is double multiplier)
        {
            return new InlineScope(tag.Name, RelativeSpeedMultiplier: multiplier);
        }

        if (string.Equals(tag.Name, TpsSpec.Tags.Normal, StringComparison.Ordinal))
        {
            return new InlineScope(tag.Name, ResetSpeed: true);
        }

        diagnostics.Add(TpsSupport.CreateDiagnostic(
            TpsSpec.DiagnosticCodes.UnknownTag,
            $"Tag '{tag.Name}' is not part of the TPS specification.",
            absoluteOffset,
            absoluteOffset + tag.Raw.Length,
            lineStarts));
        return null;
    }

    private static bool TryHandleMarkdownMarker(string text, ref int index, List<InlineScope> scopes)
    {
        if (text[index] != '*')
        {
            return false;
        }

        var markerLength = index + 1 < text.Length && text[index + 1] == '*' ? 2 : 1;
        var marker = new string('*', markerLength);
        var scopeName = markerLength == 2 ? "__markdown-strong__" : TpsSpec.Tags.Emphasis;
        var existingIndex = scopes.FindLastIndex(scope => string.Equals(scope.Name, scopeName, StringComparison.Ordinal));
        if (existingIndex >= 0)
        {
            scopes.RemoveAt(existingIndex);
            index += markerLength - 1;
            return true;
        }

        if (text.IndexOf(marker, index + markerLength, StringComparison.Ordinal) < 0)
        {
            return false;
        }

        scopes.Add(new InlineScope(scopeName, EmphasisLevel: markerLength == 2 ? 2 : 1));
        index += markerLength - 1;
        return true;
    }

    private static TagToken? ReadTagToken(string text, int index)
    {
        var endIndex = text.IndexOf(']', index + 1);
        if (endIndex < 0)
        {
            return null;
        }

        var raw = text[index..(endIndex + 1)];
        var inner = TpsEscaping.Restore(raw[1..^1]).Trim();
        var isClosing = inner.StartsWith("/", StringComparison.Ordinal);
        var body = isClosing ? inner[1..].Trim() : inner;
        var separatorIndex = body.IndexOf(':');
        var name = (separatorIndex >= 0 ? body[..separatorIndex] : body).Trim().ToLowerInvariant();
        var argument = separatorIndex >= 0 ? TpsSupport.NormalizeValue(body[(separatorIndex + 1)..]) : null;
        return new TagToken(raw, name, argument, isClosing);
    }

    private static bool RequiresTokenBoundary(string tagName) =>
        tagName is TpsSpec.Tags.Pause or TpsSpec.Tags.Breath or TpsSpec.Tags.EditPoint;

    private static bool TryHandleSlashPause(string text, int index, StringBuilder builder, TokenAccumulator? token)
    {
        var nextCharacter = index + 1 < text.Length ? text[index + 1] : '\0';
        var previousCharacter = index > 0 ? text[index - 1] : '\0';
        var nextIndex = nextCharacter == '/' ? index + 2 : index + 1;
        var previousIsBoundary = index == 0 || char.IsWhiteSpace(previousCharacter);
        var nextIsBoundary = nextIndex >= text.Length || char.IsWhiteSpace(text[nextIndex]);
        return text[index] == '/' && builder.Length == 0 && token is null && previousIsBoundary && nextIsBoundary;
    }

    private static void AppendLiteral(string literal, List<InlineScope> scopes, InheritedFormattingState inherited, StringBuilder builder, ref TokenAccumulator? token)
    {
        foreach (var character in literal)
        {
            AppendCharacter(character, scopes, inherited, builder, ref token);
        }
    }

    private static void AppendCharacter(char character, List<InlineScope> scopes, InheritedFormattingState inherited, StringBuilder builder, ref TokenAccumulator? token)
    {
        token ??= new TokenAccumulator();
        token.Apply(ResolveActiveState(scopes, inherited), character);
        builder.Append(character);
    }

    private static void FinalizeToken(
        List<WordSeed> words,
        List<PhraseSeed> phrases,
        List<WordSeed> currentPhrase,
        StringBuilder builder,
        ref TokenAccumulator? token,
        InheritedFormattingState inherited)
    {
        if (builder.Length == 0 || token is null)
        {
            builder.Clear();
            token = null;
            return;
        }

        var text = TpsEscaping.Restore(builder.ToString()).Trim();
        builder.Clear();
        if (TpsTextRules.IsStandalonePunctuationToken(text))
        {
            if (AttachStandalonePunctuation(words, currentPhrase, text) && TpsSupport.IsSentenceEndingPunctuation(text))
            {
                FlushPhrase(phrases, currentPhrase);
            }

            token = null;
            return;
        }

        var metadata = token.BuildWordMetadata(inherited.TargetWpm);
        var effectiveWpm = TpsSupport.ResolveEffectiveWpm(inherited.TargetWpm, metadata.SpeedOverride, metadata.SpeedMultiplier);
        var word = new WordSeed(
            "word",
            text,
            text.Length,
            TpsSupport.CalculateOrpIndex(text),
            TpsSupport.CalculateWordDurationMs(text, effectiveWpm),
            metadata);

        words.Add(word);
        currentPhrase.Add(word);
        if (TpsSupport.IsSentenceEndingPunctuation(text))
        {
            FlushPhrase(phrases, currentPhrase);
        }

        token = null;
    }

    private static bool AttachStandalonePunctuation(List<WordSeed> words, List<WordSeed> currentPhrase, string punctuation)
    {
        var target = currentPhrase.LastOrDefault(IsSpokenWord) ?? words.LastOrDefault(IsSpokenWord);
        if (target is null)
        {
            return false;
        }

        target.CleanText = string.Concat(target.CleanText, TpsTextRules.BuildStandalonePunctuationSuffix(punctuation));
        target.CharacterCount = target.CleanText.Length;
        target.OrpPosition = TpsSupport.CalculateOrpIndex(target.CleanText);
        return true;
    }

    private static void FlushPhrase(List<PhraseSeed> phrases, List<WordSeed> currentPhrase)
    {
        if (currentPhrase.Count == 0)
        {
            return;
        }

        phrases.Add(new PhraseSeed([.. currentPhrase], string.Join(' ', currentPhrase.Where(IsSpokenWord).Select(word => word.CleanText))));
        currentPhrase.Clear();
    }

    private static WordSeed CreateControlWord(string kind, InheritedFormattingState inherited, int? pauseDuration = null, string? editPointPriority = null)
    {
        var headCue = TpsSpec.EmotionHeadCues.TryGetValue(inherited.Emotion, out var cue)
            ? cue
            : TpsSpec.EmotionHeadCues[TpsSpec.DefaultEmotion];
        return new WordSeed(
            kind,
            string.Empty,
            0,
            0,
            pauseDuration ?? 0,
            new WordMetadata
            {
                IsPause = kind == "pause",
                PauseDurationMs = pauseDuration,
                IsBreath = kind == "breath",
                IsEditPoint = kind == "edit-point",
                EditPointPriority = editPointPriority,
                EmotionHint = inherited.Emotion,
                Speaker = inherited.Speaker,
                HeadCue = headCue
            });
    }

    private static ActiveInlineState ResolveActiveState(List<InlineScope> scopes, InheritedFormattingState inherited)
    {
        var absoluteSpeed = inherited.TargetWpm;
        var hasAbsoluteSpeed = false;
        var hasRelativeSpeed = false;
        var relativeSpeedMultiplier = 1d;
        var emphasisLevel = 0;
        var highlight = false;
        var emotion = inherited.Emotion;
        string? inlineEmotion = null;
        string? volumeLevel = null;
        string? deliveryMode = null;
        string? phoneticGuide = null;
        string? pronunciationGuide = null;
        string? stressGuide = null;
        var stressWrap = false;

        foreach (var scope in scopes)
        {
            if (scope.AbsoluteSpeed is int scopedAbsoluteSpeed)
            {
                absoluteSpeed = scopedAbsoluteSpeed;
                hasAbsoluteSpeed = true;
                hasRelativeSpeed = false;
                relativeSpeedMultiplier = 1d;
            }

            if (scope.ResetSpeed)
            {
                hasRelativeSpeed = false;
                relativeSpeedMultiplier = 1d;
            }

            if (scope.RelativeSpeedMultiplier is double scopedRelativeSpeed)
            {
                hasRelativeSpeed = true;
                relativeSpeedMultiplier *= scopedRelativeSpeed;
            }

            emphasisLevel = Math.Max(emphasisLevel, scope.EmphasisLevel);
            highlight |= scope.Highlight;
            if (scope.InlineEmotion is not null)
            {
                emotion = scope.InlineEmotion;
                inlineEmotion = scope.InlineEmotion;
            }

            volumeLevel = scope.VolumeLevel ?? volumeLevel;
            deliveryMode = scope.DeliveryMode ?? deliveryMode;
            phoneticGuide = scope.PhoneticGuide ?? phoneticGuide;
            pronunciationGuide = scope.PronunciationGuide ?? pronunciationGuide;
            stressGuide = scope.StressGuide ?? stressGuide;
            stressWrap |= scope.StressWrap;
        }

        return new ActiveInlineState(
            emotion,
            inlineEmotion,
            inherited.Speaker,
            emphasisLevel,
            highlight,
            volumeLevel,
            deliveryMode,
            phoneticGuide,
            pronunciationGuide,
            stressGuide,
            stressWrap,
            hasAbsoluteSpeed,
            absoluteSpeed,
            hasRelativeSpeed,
            relativeSpeedMultiplier);
    }

    private static bool IsSpokenWord(WordSeed word) =>
        string.Equals(word.Kind, "word", StringComparison.Ordinal) && !string.IsNullOrEmpty(word.CleanText);
}

internal sealed record InheritedFormattingState(int TargetWpm, string Emotion, string? Speaker, IReadOnlyDictionary<string, int> SpeedOffsets);

internal sealed record ContentCompilationResult(List<WordSeed> Words, List<PhraseSeed> Phrases);

internal sealed class WordSeed(string kind, string cleanText, int characterCount, int orpPosition, int displayDurationMs, WordMetadata metadata)
{
    public string Kind { get; } = kind;

    public string CleanText { get; set; } = cleanText;

    public int CharacterCount { get; set; } = characterCount;

    public int OrpPosition { get; set; } = orpPosition;

    public int DisplayDurationMs { get; } = displayDurationMs;

    public WordMetadata Metadata { get; } = metadata;
}

internal sealed record PhraseSeed(List<WordSeed> Words, string Text);

internal sealed record InlineScope(
    string Name,
    int EmphasisLevel = 0,
    bool Highlight = false,
    string? InlineEmotion = null,
    string? VolumeLevel = null,
    string? DeliveryMode = null,
    string? PhoneticGuide = null,
    string? PronunciationGuide = null,
    string? StressGuide = null,
    bool StressWrap = false,
    int? AbsoluteSpeed = null,
    double? RelativeSpeedMultiplier = null,
    bool ResetSpeed = false);

internal sealed record ActiveInlineState(
    string Emotion,
    string? InlineEmotion,
    string? Speaker,
    int EmphasisLevel,
    bool Highlight,
    string? VolumeLevel,
    string? DeliveryMode,
    string? PhoneticGuide,
    string? PronunciationGuide,
    string? StressGuide,
    bool StressWrap,
    bool HasAbsoluteSpeed,
    int AbsoluteSpeed,
    bool HasRelativeSpeed,
    double RelativeSpeedMultiplier);

internal sealed record TagToken(string Raw, string Name, string? Argument, bool IsClosing);

internal sealed class TokenAccumulator
{
    private readonly StringBuilder _stressText = new();

    public int EmphasisLevel { get; private set; }

    public bool IsHighlight { get; private set; }

    public string EmotionHint { get; private set; } = string.Empty;

    public string? InlineEmotionHint { get; private set; }

    public string? VolumeLevel { get; private set; }

    public string? DeliveryMode { get; private set; }

    public string? PhoneticGuide { get; private set; }

    public string? PronunciationGuide { get; private set; }

    public string? StressGuide { get; private set; }

    public bool HasAbsoluteSpeed { get; private set; }

    public int AbsoluteSpeed { get; private set; }

    public bool HasRelativeSpeed { get; private set; }

    public double RelativeSpeedMultiplier { get; private set; } = 1d;

    public string? Speaker { get; private set; }

    public void Apply(ActiveInlineState state, char character)
    {
        EmphasisLevel = Math.Max(EmphasisLevel, state.EmphasisLevel);
        IsHighlight |= state.Highlight;
        EmotionHint = state.Emotion;
        InlineEmotionHint = state.InlineEmotion ?? InlineEmotionHint;
        VolumeLevel = state.VolumeLevel ?? VolumeLevel;
        DeliveryMode = state.DeliveryMode ?? DeliveryMode;
        PhoneticGuide = state.PhoneticGuide ?? PhoneticGuide;
        PronunciationGuide = state.PronunciationGuide ?? PronunciationGuide;
        StressGuide = state.StressGuide ?? StressGuide;
        Speaker = state.Speaker;

        if (state.StressWrap)
        {
            _stressText.Append(character);
        }

        if (!char.IsWhiteSpace(character) && !TpsTextRules.IsStandalonePunctuationToken(character.ToString()))
        {
            HasAbsoluteSpeed = state.HasAbsoluteSpeed;
            AbsoluteSpeed = state.AbsoluteSpeed;
            HasRelativeSpeed = state.HasRelativeSpeed;
            RelativeSpeedMultiplier = state.RelativeSpeedMultiplier;
        }
    }

    public WordMetadata BuildWordMetadata(int inheritedWpm)
    {
        var headCue = TpsSpec.EmotionHeadCues.TryGetValue(EmotionHint, out var cue)
            ? cue
            : TpsSpec.EmotionHeadCues[TpsSpec.DefaultEmotion];
        var metadata = new WordMetadata
        {
            IsEmphasis = EmphasisLevel > 0,
            EmphasisLevel = EmphasisLevel,
            IsHighlight = IsHighlight,
            EmotionHint = EmotionHint,
            InlineEmotionHint = InlineEmotionHint,
            VolumeLevel = VolumeLevel,
            DeliveryMode = DeliveryMode,
            PhoneticGuide = PhoneticGuide,
            PronunciationGuide = PronunciationGuide,
            StressText = _stressText.Length > 0 ? _stressText.ToString() : null,
            StressGuide = StressGuide,
            Speaker = Speaker,
            HeadCue = headCue
        };

        if (HasAbsoluteSpeed)
        {
            var effectiveWpm = HasRelativeSpeed
                ? Math.Max(1, (int)Math.Round(AbsoluteSpeed * RelativeSpeedMultiplier, MidpointRounding.AwayFromZero))
                : AbsoluteSpeed;
            if (effectiveWpm != inheritedWpm)
            {
                metadata = metadata with { SpeedOverride = effectiveWpm };
            }
        }
        else if (HasRelativeSpeed && Math.Abs(RelativeSpeedMultiplier - 1d) > 0.0001d)
        {
            metadata = metadata with { SpeedMultiplier = RelativeSpeedMultiplier };
        }

        return metadata;
    }
}
