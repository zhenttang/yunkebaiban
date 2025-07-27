import { MermaidBlockComponent } from './mermaid-block.js';

declare global {
  namespace BlockSuite {
    interface CustomElements {
      'affine-mermaid': MermaidBlockComponent;
    }
  }
}

export function effects() {
  customElements.define('affine-mermaid', MermaidBlockComponent);
}