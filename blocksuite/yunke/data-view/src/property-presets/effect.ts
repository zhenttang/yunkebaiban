import { CheckboxCell } from './checkbox/cell-renderer.js';
import { DateCell } from './date/cell-renderer.js';
import { ImageCell } from './image/cell-renderer.js';
import { MultiSelectCell } from './multi-select/cell-renderer.js';
import { NumberCell } from './number/cell-renderer.js';
import { ProgressCell } from './progress/cell-renderer.js';
import { RatingCell } from './rating/cell-renderer.js';
import { SelectCell } from './select/cell-renderer.js';
import { TextCell } from './text/cell-renderer.js';
import { UrlCell } from './url/cell-renderer.js';

export function propertyPresetsEffects() {
  customElements.define('yunke-database-checkbox-cell', CheckboxCell);
  customElements.define('yunke-database-date-cell', DateCell);
  customElements.define('yunke-database-image-cell', ImageCell);
  customElements.define('yunke-database-multi-select-cell', MultiSelectCell);
  customElements.define('yunke-database-number-cell', NumberCell);
  customElements.define('yunke-database-progress-cell', ProgressCell);
  customElements.define('yunke-database-rating-cell', RatingCell);
  customElements.define('yunke-database-select-cell', SelectCell);
  customElements.define('yunke-database-text-cell', TextCell);
  customElements.define('yunke-database-url-cell', UrlCell);
}
