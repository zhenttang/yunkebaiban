import { FlowchartBlockComponent } from './flowchart-block.js';

declare global {
  namespace BlockSuite {
    interface CustomElements {
      'yunke-flowchart': FlowchartBlockComponent;
    }
  }
}

export function effects() {
  customElements.define('yunke-flowchart', FlowchartBlockComponent);
}

