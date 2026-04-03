const placeholders = Object.freeze({
  bracketOpen: "\uE001",
  bracketClose: "\uE002",
  pipe: "\uE003",
  slash: "\uE004",
  asterisk: "\uE005",
  backslash: "\uE006"
});

export function protectEscapes(text: string): string {
  return text
    .replaceAll("\\\\", placeholders.backslash)
    .replaceAll("\\[", placeholders.bracketOpen)
    .replaceAll("\\]", placeholders.bracketClose)
    .replaceAll("\\|", placeholders.pipe)
    .replaceAll("\\/", placeholders.slash)
    .replaceAll("\\*", placeholders.asterisk);
}

export function restoreEscapes(text: string): string {
  return text
    .replaceAll(placeholders.bracketOpen, "[")
    .replaceAll(placeholders.bracketClose, "]")
    .replaceAll(placeholders.pipe, "|")
    .replaceAll(placeholders.slash, "/")
    .replaceAll(placeholders.asterisk, "*")
    .replaceAll(placeholders.backslash, "\\");
}

export interface HeaderPart {
  value: string;
  start: number;
  end: number;
}

export function splitHeaderParts(rawHeaderContent: string): string[] {
  return splitHeaderPartsDetailed(rawHeaderContent).map((part) => part.value);
}

export function splitHeaderPartsDetailed(rawHeaderContent: string): HeaderPart[] {
  const detailedParts: HeaderPart[] = [];
  let current = "";
  let partStart = 0;

  for (let index = 0; index < rawHeaderContent.length; index += 1) {
    const character = rawHeaderContent[index];
    if (character === "\\" && index + 1 < rawHeaderContent.length) {
      current += rawHeaderContent[index + 1];
      index += 1;
      continue;
    }

    if (character === "|") {
      const value = current.trim();
      detailedParts.push({
        value,
        start: partStart,
        end: index
      });
      current = "";
      partStart = index + 1;
      continue;
    }

    current += character;
  }

  const value = current.trim();
  detailedParts.push({
    value,
    start: partStart,
    end: rawHeaderContent.length
  });
  return detailedParts;
}
