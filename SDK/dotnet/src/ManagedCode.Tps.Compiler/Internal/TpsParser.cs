using System.Globalization;
using ManagedCode.Tps.Compiler.Models;

namespace ManagedCode.Tps.Compiler.Internal;

internal sealed class TpsParser
{
    public DocumentAnalysis Parse(string source)
    {
        var normalized = TpsSupport.NormalizeLineEndings(source);
        var lineStarts = TpsSupport.CreateLineStarts(normalized);
        var diagnostics = new List<TpsDiagnostic>();
        var frontMatter = ExtractFrontMatter(normalized, lineStarts, diagnostics);
        var titleBody = ExtractTitleHeader(frontMatter.Body, frontMatter.BodyStartOffset, frontMatter.Metadata);
        var parsedSegments = ParseSegments(titleBody.Body, titleBody.BodyStartOffset, frontMatter.Metadata, lineStarts, diagnostics);

        return new DocumentAnalysis(
            normalized,
            lineStarts,
            diagnostics,
            new TpsDocument
            {
                Metadata = frontMatter.Metadata,
                Segments = parsedSegments.Select(segment => segment.Segment).ToList()
            },
            parsedSegments);
    }

    private static FrontMatterResult ExtractFrontMatter(string source, IReadOnlyList<int> lineStarts, List<TpsDiagnostic> diagnostics)
    {
        if (!source.StartsWith("---\n", StringComparison.Ordinal))
        {
            return new FrontMatterResult(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase), source, 0);
        }

        var closingIndex = source.IndexOf("\n---\n", 4, StringComparison.Ordinal);
        if (closingIndex < 0)
        {
            diagnostics.Add(TpsSupport.CreateDiagnostic(
                TpsSpec.DiagnosticCodes.InvalidFrontMatter,
                "Front matter must be closed by a terminating --- line.",
                0,
                Math.Min(source.Length, 3),
                lineStarts));
            return new FrontMatterResult(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase), source, 0);
        }

        return new FrontMatterResult(ParseMetadata(source[4..closingIndex]), source[(closingIndex + 5)..], closingIndex + 5);
    }

    private static Dictionary<string, string> ParseMetadata(string frontMatterText)
    {
        var metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string? currentSection = null;

        foreach (var rawLine in frontMatterText.Split('\n'))
        {
            if (string.IsNullOrWhiteSpace(rawLine) || rawLine.TrimStart().StartsWith('#'))
            {
                continue;
            }

            var indentation = rawLine.Length - rawLine.TrimStart().Length;
            var line = rawLine.Trim();
            var separatorIndex = line.IndexOf(':');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = NormalizeMetadataValue(line[(separatorIndex + 1)..]);
            if (indentation > 0 && currentSection is not null)
            {
                var compositeKey = $"{currentSection}.{key}";
                if (!TpsSupport.IsLegacyMetadataKey(compositeKey))
                {
                    metadata[compositeKey] = value;
                }

                continue;
            }

            currentSection = value.Length == 0 ? key : null;
            if (value.Length > 0 && !TpsSupport.IsLegacyMetadataKey(key))
            {
                metadata[key] = value;
            }
        }

        return metadata;
    }

    private static TitleBodyResult ExtractTitleHeader(string body, int bodyStartOffset, Dictionary<string, string> metadata)
    {
        foreach (var line in SplitLines(body, bodyStartOffset))
        {
            if (string.IsNullOrWhiteSpace(line.Text))
            {
                continue;
            }

            var trimmed = line.Text.Trim();
            if (!trimmed.StartsWith("# ", StringComparison.Ordinal) || trimmed.StartsWith("##", StringComparison.Ordinal))
            {
                break;
            }

            metadata[TpsSpec.FrontMatterKeys.Title] = trimmed[2..].Trim();
            var prefixLength = line.Text.Length + 1;
            return new TitleBodyResult(body[prefixLength..], line.StartOffset + prefixLength);
        }

        return new TitleBodyResult(body, bodyStartOffset);
    }

    private static List<ParsedSegmentInternal> ParseSegments(
        string body,
        int bodyStartOffset,
        Dictionary<string, string> metadata,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        var segments = new List<ParsedSegmentInternal>();
        var preamble = new List<LineRecord>();
        ParsedSegmentInternal? current = null;
        ParsedBlockInternal? currentBlock = null;
        var segmentLeading = new List<LineRecord>();
        var blockLines = new List<LineRecord>();

        foreach (var line in SplitLines(body, bodyStartOffset))
        {
            var segmentHeader = TryParseHeader(line, HeaderLevel.Segment, lineStarts, diagnostics);
            if (segmentHeader is not null)
            {
                FinalizeBlock(current, currentBlock, blockLines);
                FinalizeSegment(segments, current, segmentLeading);
                current = CreateSegment(segmentHeader, metadata, segments.Count + 1);
                currentBlock = null;
                if (preamble.Count > 0)
                {
                    segmentLeading = [.. preamble];
                    preamble.Clear();
                }

                continue;
            }

            var blockHeader = TryParseHeader(line, HeaderLevel.Block, lineStarts, diagnostics);
            if (blockHeader is not null)
            {
                if (current is null)
                {
                    current = CreateImplicitSegment(metadata, segments.Count + 1);
                    if (preamble.Count > 0)
                    {
                        segmentLeading = [.. preamble];
                        preamble.Clear();
                    }
                }

                FinalizeBlock(current, currentBlock, blockLines);
                currentBlock = CreateBlock(blockHeader, current.ParsedBlocks.Count + 1, current.Segment.Id);
                blockLines = [];
                continue;
            }

            PushContentLine(current, currentBlock, line, preamble, segmentLeading, blockLines);
        }

        if (current is null)
        {
            var implicitSegment = CreateImplicitSegment(metadata, 1);
            implicitSegment.DirectContent = CreateContentSection(preamble);
            implicitSegment.Segment.LeadingContent = implicitSegment.DirectContent?.Text;
            implicitSegment.Segment.Content = implicitSegment.DirectContent?.Text ?? string.Empty;
            return [implicitSegment];
        }

        FinalizeBlock(current, currentBlock, blockLines);
        FinalizeSegment(segments, current, segmentLeading);
        return segments;
    }

    private static void FinalizeBlock(ParsedSegmentInternal? current, ParsedBlockInternal? block, List<LineRecord> lines)
    {
        if (current is null || block is null)
        {
            return;
        }

        block.Content = CreateContentSection(lines);
        block.Block.Content = block.Content?.Text ?? string.Empty;
        current.Segment.Blocks.Add(block.Block);
        current.ParsedBlocks.Add(block);
    }

    private static void FinalizeSegment(List<ParsedSegmentInternal> target, ParsedSegmentInternal? segment, List<LineRecord> lines)
    {
        if (segment is null)
        {
            return;
        }

        segment.LeadingContent = CreateContentSection(lines);
        segment.Segment.LeadingContent = segment.LeadingContent?.Text;
        segment.Segment.Content = segment.ParsedBlocks.Count == 0 ? segment.LeadingContent?.Text ?? string.Empty : string.Empty;
        if (segment.ParsedBlocks.Count == 0)
        {
            segment.DirectContent = segment.LeadingContent;
        }

        target.Add(segment);
    }

    private static void PushContentLine(
        ParsedSegmentInternal? current,
        ParsedBlockInternal? currentBlock,
        LineRecord line,
        List<LineRecord> preamble,
        List<LineRecord> segmentLeading,
        List<LineRecord> blockLines)
    {
        if (currentBlock is not null)
        {
            blockLines.Add(line);
        }
        else if (current is not null)
        {
            segmentLeading.Add(line);
        }
        else
        {
            preamble.Add(line);
        }
    }

    private static ParsedHeader? TryParseHeader(LineRecord line, HeaderLevel level, IReadOnlyList<int> lineStarts, List<TpsDiagnostic> diagnostics)
    {
        var hashPrefix = level == HeaderLevel.Segment ? "##" : "###";
        var trimmedStart = line.Text.TrimStart();
        if (!trimmedStart.StartsWith(hashPrefix, StringComparison.Ordinal))
        {
            return null;
        }

        var afterHashes = trimmedStart[hashPrefix.Length..];
        if (afterHashes.Length > 0 && !afterHashes.StartsWith(' '))
        {
            return null;
        }

        var headerContent = afterHashes.Trim();
        if (headerContent.Length == 0)
        {
            diagnostics.Add(TpsSupport.CreateDiagnostic(
                TpsSpec.DiagnosticCodes.InvalidHeader,
                "Header cannot be empty.",
                line.StartOffset,
                line.StartOffset + line.Text.Length,
                lineStarts));
            return null;
        }

        if (!headerContent.StartsWith("[", StringComparison.Ordinal) || !headerContent.EndsWith("]", StringComparison.Ordinal))
        {
            return new ParsedHeader(headerContent);
        }

        return ParseBracketHeader(headerContent[1..^1], line.StartOffset + line.Text.IndexOf('[', StringComparison.Ordinal) + 1, lineStarts, diagnostics);
    }

    private static ParsedHeader? ParseBracketHeader(string content, int contentOffset, IReadOnlyList<int> lineStarts, List<TpsDiagnostic> diagnostics)
    {
        var parts = TpsEscaping.SplitHeaderPartsDetailed(content);
        if (string.IsNullOrWhiteSpace(parts[0].Value))
        {
            diagnostics.Add(TpsSupport.CreateDiagnostic(
                TpsSpec.DiagnosticCodes.InvalidHeader,
                "Header name is required.",
                contentOffset,
                contentOffset + content.Length,
                lineStarts));
            return null;
        }

        var header = new ParsedHeader(parts[0].Value);
        foreach (var part in parts.Skip(1))
        {
            var normalized = TpsSupport.NormalizeValue(part.Value);
            if (normalized is null)
            {
                continue;
            }

            var tokenStart = contentOffset + part.Start;
            var tokenEnd = contentOffset + part.End;
            if (normalized.StartsWith(TpsSpec.SpeakerPrefix, StringComparison.OrdinalIgnoreCase))
            {
                header = header with { Speaker = TpsSupport.NormalizeValue(normalized[TpsSpec.SpeakerPrefix.Length..]) };
                continue;
            }

            if (TpsSupport.IsTimingToken(normalized))
            {
                header = header with { Timing = normalized };
                continue;
            }

            if (ApplyHeaderWpm(ref header, normalized, tokenStart, tokenEnd, lineStarts, diagnostics))
            {
                continue;
            }

            if (TpsSupport.IsKnownEmotion(normalized.ToLowerInvariant()))
            {
                header = header with { Emotion = normalized.ToLowerInvariant() };
                continue;
            }

            diagnostics.Add(TpsSupport.CreateDiagnostic(
                TpsSpec.DiagnosticCodes.InvalidHeaderParameter,
                $"Header parameter '{normalized}' is not a known TPS header token.",
                tokenStart,
                tokenEnd,
                lineStarts,
                "Use a speaker, emotion, timing, or WPM value."));
        }

        return header;
    }

    private static bool ApplyHeaderWpm(
        ref ParsedHeader header,
        string token,
        int start,
        int end,
        IReadOnlyList<int> lineStarts,
        List<TpsDiagnostic> diagnostics)
    {
        var normalized = string.Concat(token.Where(character => !char.IsWhiteSpace(character)));
        if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, @"^\d+(wpm)?$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
        {
            return false;
        }

        var candidate = normalized.EndsWith(TpsSpec.WpmSuffix, StringComparison.OrdinalIgnoreCase)
            ? int.Parse(normalized[..^TpsSpec.WpmSuffix.Length], CultureInfo.InvariantCulture)
            : int.Parse(normalized, CultureInfo.InvariantCulture);
        if (candidate < TpsSpec.MinimumWpm || candidate > TpsSpec.MaximumWpm)
        {
            diagnostics.Add(TpsSupport.CreateDiagnostic(
                TpsSpec.DiagnosticCodes.InvalidWpm,
                $"WPM '{token}' must be between {TpsSpec.MinimumWpm} and {TpsSpec.MaximumWpm}.",
                start,
                end,
                lineStarts));
            return true;
        }

        header = header with { TargetWpm = candidate };
        return true;
    }

    private static ParsedSegmentInternal CreateSegment(ParsedHeader header, IReadOnlyDictionary<string, string> metadata, int index)
    {
        var emotion = TpsSupport.ResolveEmotion(header.Emotion);
        var palette = TpsSupport.ResolvePalette(emotion);
        return new ParsedSegmentInternal(
            new TpsSegment
            {
                Id = $"segment-{index}",
                Name = header.Name,
                TargetWpm = header.TargetWpm ?? TpsSupport.ResolveBaseWpm(metadata),
                Emotion = emotion,
                Speaker = header.Speaker,
                Timing = header.Timing,
                BackgroundColor = palette.Background,
                TextColor = palette.Text,
                AccentColor = palette.Accent
            });
    }

    private static ParsedSegmentInternal CreateImplicitSegment(IReadOnlyDictionary<string, string> metadata, int index) =>
        CreateSegment(new ParsedHeader(metadata.TryGetValue(TpsSpec.FrontMatterKeys.Title, out var title) ? title : TpsSpec.DefaultImplicitSegmentName)
        {
            TargetWpm = TpsSupport.ResolveBaseWpm(metadata),
            Emotion = TpsSpec.DefaultEmotion
        }, metadata, index);

    private static ParsedBlockInternal CreateBlock(ParsedHeader header, int blockIndex, string segmentId) =>
        new(new TpsBlock
        {
            Id = $"{segmentId}-block-{blockIndex}",
            Name = header.Name,
            TargetWpm = header.TargetWpm,
            Emotion = header.Emotion,
            Speaker = header.Speaker
        });

    private static ContentSection? CreateContentSection(IReadOnlyList<LineRecord> lines)
    {
        if (lines.Count == 0)
        {
            return null;
        }

        return new ContentSection(string.Join('\n', lines.Select(line => line.Text)), lines[0].StartOffset);
    }

    private static IEnumerable<LineRecord> SplitLines(string text, int startOffset)
    {
        if (text.Length == 0)
        {
            yield break;
        }

        var lineStart = startOffset;
        foreach (var line in text.Split('\n'))
        {
            yield return new LineRecord(line, lineStart);
            lineStart += line.Length + 1;
        }
    }

    private static string NormalizeMetadataValue(string value) =>
        value.Trim().Trim('"');
}

internal enum HeaderLevel
{
    Segment,
    Block
}

internal sealed record ParsedHeader(
    string Name,
    int? TargetWpm = null,
    string? Emotion = null,
    string? Timing = null,
    string? Speaker = null);

internal sealed record LineRecord(string Text, int StartOffset);

internal sealed record ContentSection(string Text, int StartOffset);

internal sealed class ParsedBlockInternal(TpsBlock block)
{
    public TpsBlock Block { get; } = block;

    public ContentSection? Content { get; set; }
}

internal sealed class ParsedSegmentInternal(TpsSegment segment)
{
    public TpsSegment Segment { get; } = segment;

    public ContentSection? LeadingContent { get; set; }

    public ContentSection? DirectContent { get; set; }

    public List<ParsedBlockInternal> ParsedBlocks { get; } = [];
}

internal sealed record DocumentAnalysis(
    string Source,
    IReadOnlyList<int> LineStarts,
    List<TpsDiagnostic> Diagnostics,
    TpsDocument Document,
    List<ParsedSegmentInternal> ParsedSegments);

internal sealed record FrontMatterResult(Dictionary<string, string> Metadata, string Body, int BodyStartOffset);

internal sealed record TitleBodyResult(string Body, int BodyStartOffset);
