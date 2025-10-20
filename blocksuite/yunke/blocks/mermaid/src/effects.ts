import { MermaidBlockComponent } from './mermaid-block.js';

declare global {
  namespace BlockSuite {
    interface CustomElements {
      'yunke-mermaid': MermaidBlockComponent;
    }
  }
}

export function effects() {
  customElements.define('yunke-mermaid', MermaidBlockComponent);
}