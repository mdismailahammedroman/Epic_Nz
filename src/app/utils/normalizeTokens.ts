export const normalizeTokens = (tokenOrTokens: unknown): string[] => {
  const arr = Array.isArray(tokenOrTokens) ? tokenOrTokens : [tokenOrTokens];

  return Array.from(
    new Set(
      arr
        .filter((t) => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );
};
