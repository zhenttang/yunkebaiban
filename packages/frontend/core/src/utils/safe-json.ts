export interface SafeJsonParseOptions<T> {
  fallback?: T;
  onError?: (error: Error) => void;
}

export function safeJsonParse<T>(
  value: string | null | undefined,
  options: SafeJsonParseOptions<T> = {}
): T | undefined {
  if (value == null || value === '') {
    return options.fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    options.onError?.(error as Error);
    return options.fallback;
  }
}
