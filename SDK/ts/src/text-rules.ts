const standaloneDashCharacters = new Set(["-", "—", "–"]);
const standalonePunctuationCharacters = new Set([",", ".", ";", ":", "!", "?", "-", "—", "–", "…"]);

export function isStandalonePunctuationToken(token: string | undefined): boolean {
  if (!token || !token.trim()) {
    return false;
  }

  for (const character of token.trim()) {
    if (!standalonePunctuationCharacters.has(character)) {
      return false;
    }
  }

  return true;
}

export function buildStandalonePunctuationSuffix(token: string): string {
  const trimmed = token.trim();
  return usesLeadingSeparator(trimmed) ? ` ${trimmed}` : trimmed;
}

function usesLeadingSeparator(token: string): boolean {
  if (!token) {
    return false;
  }

  for (const character of token) {
    if (!standaloneDashCharacters.has(character)) {
      return false;
    }
  }

  return true;
}
