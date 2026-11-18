export const CACHE_KEYS = {
  lotDetails: (id: string) => `lots:details:${id}`,
} as const;

export const CACHE_TTL = {
  LOT_DETAILS: 10_000,
} as const;
