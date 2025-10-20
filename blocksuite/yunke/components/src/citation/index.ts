import { CitationCard } from './citation';

export * from './citation';

export function effects() {
  customElements.define('yunke-citation-card', CitationCard);
}
