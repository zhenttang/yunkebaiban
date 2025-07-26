/**
 * URL resolution utilities for converting relative URLs to absolute URLs
 */

/**
 * Resolves a relative URL to an absolute URL using the provided base URL
 * @param relativeUrl - The relative URL (e.g., "/uploads/avatars/file.png")
 * @param baseUrl - The base URL (e.g., "http://localhost:8080")
 * @returns The absolute URL
 */
export function resolveUrl(relativeUrl: string | null | undefined, baseUrl: string): string | null {
  if (!relativeUrl) {
    return null;
  }
  
  try {
    // If the URL is already absolute, return it as is
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    
    // Resolve relative URL against base URL
    const url = new URL(relativeUrl, baseUrl);
    return url.toString();
  } catch (error) {
    console.error('Failed to resolve URL:', { relativeUrl, baseUrl, error });
    return null;
  }
}