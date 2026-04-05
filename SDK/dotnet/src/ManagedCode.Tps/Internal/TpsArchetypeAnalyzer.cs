using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Internal;

internal static class TpsArchetypeAnalyzer
{
    public static void AppendDiagnostics(IEnumerable<ArchetypeDiagnosticTarget> targets, IReadOnlyList<int> lineStarts, List<TpsDiagnostic> diagnostics)
    {
        foreach (var target in targets)
        {
            var archetype = target.Block.Archetype?.ToLowerInvariant();
            if (archetype is null ||
                !TpsSpec.ArchetypeProfiles.TryGetValue(archetype, out var profile) ||
                !TpsSpec.ArchetypeRhythmProfiles.TryGetValue(archetype, out var rhythm))
            {
                continue;
            }

            var spokenWords = target.Block.Words.Where(IsSpokenWord).ToArray();
            if (spokenWords.Length == 0)
            {
                continue;
            }

            AppendProfileWarnings(target, archetype, profile, spokenWords, lineStarts, diagnostics);
            AppendRhythmWarnings(target, archetype, rhythm, spokenWords, lineStarts, diagnostics);
        }
    }

    private static void AppendProfileWarnings(
        ArchetypeDiagnosticTarget target,
        string archetype,
        TpsArchetypeProfile profile,
        IReadOnlyList<CompiledWord> spokenWords,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        var articulationConflict = spokenWords.FirstOrDefault(word => IsArticulationMismatch(word.Metadata.ArticulationStyle, profile.Articulation));
        if (articulationConflict is not null)
        {
            diagnostics.Add(TpsSupport.CreateWarningDiagnostic(
                TpsSpec.DiagnosticCodes.ArchetypeArticulationMismatch,
                BuildArticulationMessage(archetype, target.Block.Name, articulationConflict.Metadata.ArticulationStyle ?? "unknown", profile.Articulation),
                target.RangeStart,
                target.RangeEnd,
                lineStarts,
                BuildArticulationSuggestion(profile.Articulation)));
        }

        var energyConflict = spokenWords.FirstOrDefault(word => IsOutOfRange(word.Metadata.EnergyLevel, profile.Energy));
        if (energyConflict is not null && energyConflict.Metadata.EnergyLevel is int energyLevel)
        {
            diagnostics.Add(TpsSupport.CreateWarningDiagnostic(
                TpsSpec.DiagnosticCodes.ArchetypeEnergyMismatch,
                $"Archetype '{archetype}' expects energy between {profile.Energy.Min} and {profile.Energy.Max}, but block '{target.Block.Name}' uses {energyLevel} on '{energyConflict.CleanText}'.",
                target.RangeStart,
                target.RangeEnd,
                lineStarts,
                $"Keep [energy:N] between {profile.Energy.Min} and {profile.Energy.Max} for this archetype."));
        }

        var melodyConflict = spokenWords.FirstOrDefault(word => IsOutOfRange(word.Metadata.MelodyLevel, profile.Melody));
        if (melodyConflict is not null && melodyConflict.Metadata.MelodyLevel is int melodyLevel)
        {
            diagnostics.Add(TpsSupport.CreateWarningDiagnostic(
                TpsSpec.DiagnosticCodes.ArchetypeMelodyMismatch,
                $"Archetype '{archetype}' expects melody between {profile.Melody.Min} and {profile.Melody.Max}, but block '{target.Block.Name}' uses {melodyLevel} on '{melodyConflict.CleanText}'.",
                target.RangeStart,
                target.RangeEnd,
                lineStarts,
                $"Keep [melody:N] between {profile.Melody.Min} and {profile.Melody.Max} for this archetype."));
        }

        var volumeConflict = spokenWords.FirstOrDefault(word => IsVolumeMismatch(word.Metadata.VolumeLevel, profile.Volume));
        if (volumeConflict is not null)
        {
            diagnostics.Add(TpsSupport.CreateWarningDiagnostic(
                TpsSpec.DiagnosticCodes.ArchetypeVolumeMismatch,
                BuildVolumeMessage(archetype, target.Block.Name, volumeConflict.Metadata.VolumeLevel ?? "default", profile.Volume),
                target.RangeStart,
                target.RangeEnd,
                lineStarts,
                BuildVolumeSuggestion(profile.Volume)));
        }

        var speedConflict = spokenWords.FirstOrDefault(word => IsSpeedMismatch(word, target.Block.TargetWpm, profile.Speed));
        if (speedConflict is not null)
        {
            var effectiveWpm = ResolveEffectiveWordWpm(speedConflict, target.Block.TargetWpm);
            diagnostics.Add(TpsSupport.CreateWarningDiagnostic(
                TpsSpec.DiagnosticCodes.ArchetypeSpeedMismatch,
                $"Archetype '{archetype}' expects inline speed changes to stay between {profile.Speed.Min} and {profile.Speed.Max} WPM, but block '{target.Block.Name}' reaches {effectiveWpm} WPM on '{speedConflict.CleanText}'.",
                target.RangeStart,
                target.RangeEnd,
                lineStarts,
                $"Prefer inline speed tags that keep this scope between {profile.Speed.Min} and {profile.Speed.Max} WPM."));
        }
    }

    private static void AppendRhythmWarnings(
        ArchetypeDiagnosticTarget target,
        string archetype,
        TpsArchetypeRhythmProfile rhythm,
        IReadOnlyList<CompiledWord> spokenWords,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        if (spokenWords.Count < TpsSpec.ArchetypeRhythmMinimumWords)
        {
            return;
        }

        var phraseWordCounts = target.Block.Phrases
            .Select(phrase => phrase.Words.Count(IsSpokenWord))
            .Where(count => count > 0)
            .ToArray();
        if (phraseWordCounts.Length < 2)
        {
            return;
        }

        var metrics = CollectScopeMetrics(target.Block, spokenWords, phraseWordCounts);

        PushRhythmWarning(
            diagnostics,
            TpsSpec.DiagnosticCodes.ArchetypeRhythmPhraseLength,
            target,
            lineStarts,
            !IsWithinRange(metrics.AveragePhraseLength, rhythm.PhraseLength),
            $"Archetype '{archetype}' expects average phrase length between {rhythm.PhraseLength.Min} and {rhythm.PhraseLength.Max} words, but block '{target.Block.Name}' averages {FormatMetric(metrics.AveragePhraseLength)}.",
            $"Break phrases so this scope averages between {rhythm.PhraseLength.Min} and {rhythm.PhraseLength.Max} words.");

        PushRhythmWarning(
            diagnostics,
            TpsSpec.DiagnosticCodes.ArchetypeRhythmPauseFrequency,
            target,
            lineStarts,
            !IsWithinRange(metrics.PauseFrequencyPer100Words, rhythm.PauseFrequencyPer100Words),
            $"Archetype '{archetype}' expects {rhythm.PauseFrequencyPer100Words.Min} to {rhythm.PauseFrequencyPer100Words.Max} pauses per 100 words, but block '{target.Block.Name}' has {FormatMetric(metrics.PauseFrequencyPer100Words)}.",
            $"Adjust pause markers so this scope lands between {rhythm.PauseFrequencyPer100Words.Min} and {rhythm.PauseFrequencyPer100Words.Max} pauses per 100 words.");

        PushRhythmWarning(
            diagnostics,
            TpsSpec.DiagnosticCodes.ArchetypeRhythmPauseDuration,
            target,
            lineStarts,
            metrics.AveragePauseDurationMs is double averagePauseDuration &&
            !IsWithinRange(averagePauseDuration, rhythm.AveragePauseDurationMs),
            $"Archetype '{archetype}' expects average pause duration between {rhythm.AveragePauseDurationMs.Min} and {rhythm.AveragePauseDurationMs.Max} ms, but block '{target.Block.Name}' averages {FormatMetric(metrics.AveragePauseDurationMs)} ms.",
            $"Adjust explicit pauses so this scope averages between {rhythm.AveragePauseDurationMs.Min} and {rhythm.AveragePauseDurationMs.Max} ms.");

        PushRhythmWarning(
            diagnostics,
            TpsSpec.DiagnosticCodes.ArchetypeRhythmEmphasisDensity,
            target,
            lineStarts,
            !IsWithinRange(metrics.EmphasisDensityPercent, rhythm.EmphasisDensityPercent),
            $"Archetype '{archetype}' expects emphasis density between {rhythm.EmphasisDensityPercent.Min}% and {rhythm.EmphasisDensityPercent.Max}%, but block '{target.Block.Name}' is {FormatMetric(metrics.EmphasisDensityPercent)}%.",
            $"Add or remove emphasis so this scope lands between {rhythm.EmphasisDensityPercent.Min}% and {rhythm.EmphasisDensityPercent.Max}%.");

        PushRhythmWarning(
            diagnostics,
            TpsSpec.DiagnosticCodes.ArchetypeRhythmSpeedVariation,
            target,
            lineStarts,
            !IsWithinRange(metrics.SpeedVariationPer100Words, rhythm.SpeedVariationPer100Words),
            $"Archetype '{archetype}' expects {rhythm.SpeedVariationPer100Words.Min} to {rhythm.SpeedVariationPer100Words.Max} inline speed changes per 100 words, but block '{target.Block.Name}' has {FormatMetric(metrics.SpeedVariationPer100Words)}.",
            $"Adjust inline speed tags so this scope lands between {rhythm.SpeedVariationPer100Words.Min} and {rhythm.SpeedVariationPer100Words.Max} changes per 100 words.");
    }

    private static ArchetypeScopeMetrics CollectScopeMetrics(CompiledBlock block, IReadOnlyList<CompiledWord> spokenWords, IReadOnlyList<int> phraseWordCounts)
    {
        var pauses = block.Words.Where(word => word.Kind == "pause").ToArray();
        var speedVariationRuns = 0;
        var inVariation = false;

        foreach (var word in spokenWords)
        {
            var varied = HasInlineSpeedVariation(word, block.TargetWpm);
            if (varied && !inVariation)
            {
                speedVariationRuns++;
            }

            inVariation = varied;
        }

        return new ArchetypeScopeMetrics(
            AveragePhraseLength: phraseWordCounts.Average(),
            PauseFrequencyPer100Words: pauses.Length / (double)spokenWords.Count * 100d,
            AveragePauseDurationMs: pauses.Length > 0 ? pauses.Average(word => word.DisplayDurationMs) : null,
            EmphasisDensityPercent: spokenWords.Count(word => word.Metadata.IsEmphasis) / (double)spokenWords.Count * 100d,
            SpeedVariationPer100Words: speedVariationRuns / (double)spokenWords.Count * 100d);
    }

    private static void PushRhythmWarning(
        List<TpsDiagnostic> diagnostics,
        string code,
        ArchetypeDiagnosticTarget target,
        IReadOnlyList<int> lineStarts,
        bool condition,
        string message,
        string suggestion)
    {
        if (!condition)
        {
            return;
        }

        diagnostics.Add(TpsSupport.CreateWarningDiagnostic(code, message, target.RangeStart, target.RangeEnd, lineStarts, suggestion));
    }

    private static bool IsArticulationMismatch(string? value, string expectation)
    {
        if (value is null || string.Equals(expectation, TpsSpec.ArchetypeArticulationExpectations.Flexible, StringComparison.Ordinal))
        {
            return false;
        }

        if (string.Equals(expectation, TpsSpec.ArchetypeArticulationExpectations.Neutral, StringComparison.Ordinal))
        {
            return true;
        }

        return !string.Equals(value, expectation, StringComparison.Ordinal);
    }

    private static bool IsOutOfRange(int? value, NumericRange range) =>
        value is int numeric && (numeric < range.Min || numeric > range.Max);

    private static bool IsWithinRange(double value, NumericRange range) =>
        value >= range.Min && value <= range.Max;

    private static bool IsVolumeMismatch(string? value, string expectation)
    {
        if (string.Equals(expectation, TpsSpec.ArchetypeVolumeExpectations.Flexible, StringComparison.Ordinal) || value is null)
        {
            return false;
        }

        if (string.Equals(expectation, TpsSpec.ArchetypeVolumeExpectations.LoudOnly, StringComparison.Ordinal))
        {
            return !string.Equals(value, TpsSpec.Tags.Loud, StringComparison.Ordinal);
        }

        if (string.Equals(expectation, TpsSpec.ArchetypeVolumeExpectations.DefaultOnly, StringComparison.Ordinal))
        {
            return true;
        }

        return !string.Equals(value, TpsSpec.Tags.Soft, StringComparison.Ordinal);
    }

    private static bool HasInlineSpeedVariation(CompiledWord word, int inheritedWpm) =>
        ResolveEffectiveWordWpm(word, inheritedWpm) != inheritedWpm;

    private static bool IsSpeedMismatch(CompiledWord word, int inheritedWpm, NumericRange range)
    {
        if (word.Metadata.SpeedOverride is null && word.Metadata.SpeedMultiplier is null)
        {
            return false;
        }

        var effectiveWpm = ResolveEffectiveWordWpm(word, inheritedWpm);
        return effectiveWpm < range.Min || effectiveWpm > range.Max;
    }

    private static int ResolveEffectiveWordWpm(CompiledWord word, int inheritedWpm)
    {
        if (word.Metadata.SpeedOverride is int speedOverride)
        {
            return speedOverride;
        }

        if (word.Metadata.SpeedMultiplier is double speedMultiplier)
        {
            return Math.Max(1, (int)Math.Round(inheritedWpm * speedMultiplier, MidpointRounding.AwayFromZero));
        }

        return inheritedWpm;
    }

    private static bool IsSpokenWord(CompiledWord word) =>
        word.Kind == "word" && !string.IsNullOrWhiteSpace(word.CleanText);

    private static string BuildArticulationMessage(string archetype, string blockName, string actual, string expectation) =>
        string.Equals(expectation, TpsSpec.ArchetypeArticulationExpectations.Neutral, StringComparison.Ordinal)
            ? $"Archetype '{archetype}' expects natural diction without articulation tags, but block '{blockName}' uses '{actual}'."
            : $"Archetype '{archetype}' expects '{expectation}' articulation, but block '{blockName}' uses '{actual}'.";

    private static string BuildArticulationSuggestion(string expectation) =>
        string.Equals(expectation, TpsSpec.ArchetypeArticulationExpectations.Neutral, StringComparison.Ordinal)
            ? "Remove [legato] or [staccato] tags from this archetype scope."
            : $"Prefer [{expectation}]...[/{expectation}] when you want to reinforce this archetype.";

    private static string BuildVolumeMessage(string archetype, string blockName, string actual, string expectation)
    {
        if (string.Equals(expectation, TpsSpec.ArchetypeVolumeExpectations.DefaultOnly, StringComparison.Ordinal))
        {
            return $"Archetype '{archetype}' expects default volume, but block '{blockName}' uses '{actual}'.";
        }

        if (string.Equals(expectation, TpsSpec.ArchetypeVolumeExpectations.SoftOrDefault, StringComparison.Ordinal))
        {
            return $"Archetype '{archetype}' expects soft or default volume, but block '{blockName}' uses '{actual}'.";
        }

        return $"Archetype '{archetype}' expects loud volume, but block '{blockName}' uses '{actual}'.";
    }

    private static string BuildVolumeSuggestion(string expectation)
    {
        if (string.Equals(expectation, TpsSpec.ArchetypeVolumeExpectations.DefaultOnly, StringComparison.Ordinal))
        {
            return "Remove explicit volume tags from this archetype scope.";
        }

        if (string.Equals(expectation, TpsSpec.ArchetypeVolumeExpectations.SoftOrDefault, StringComparison.Ordinal))
        {
            return "Use [soft] sparingly or leave volume untagged in this scope.";
        }

        return "Prefer [loud] when this archetype needs an explicit volume tag.";
    }

    private static string FormatMetric(double? value) =>
        value is double numeric
            ? numeric.ToString("0.#", System.Globalization.CultureInfo.InvariantCulture)
            : "0";
}

internal sealed record ArchetypeDiagnosticTarget(CompiledBlock Block, int RangeStart, int RangeEnd);

internal sealed record ArchetypeScopeMetrics(
    double AveragePhraseLength,
    double PauseFrequencyPer100Words,
    double? AveragePauseDurationMs,
    double EmphasisDensityPercent,
    double SpeedVariationPer100Words);
