import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OUTPUT_FORMAT_OPTIONS } from '../../../core/constants/conversion.constants';
import { OutputFormat } from '../../../core/models/conversion-format.model';

@Component({
  selector: 'app-format-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="format-selector">
      <label class="format-selector__label" for="output-format">Output format</label>
      <select
        id="output-format"
        class="format-selector__select"
        [disabled]="disabled()"
        [ngModel]="selectedFormat()"
        (ngModelChange)="onFormatChange($event)"
      >
        @for (option of formatOptions; track option.value) {
          <option [ngValue]="option.value">{{ option.label }}</option>
        }
      </select>
    </div>
  `,
  styles: `
    .format-selector {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .format-selector__label {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text, #0f172a);
    }

    .format-selector__select {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: 8px;
      font-size: 1rem;
      background: var(--surface-elevated, #fff);
      color: var(--text, #0f172a);
      cursor: pointer;
    }

    .format-selector__select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .format-selector__select:focus {
      outline: 2px solid var(--primary, #6366f1);
      outline-offset: 2px;
      border-color: var(--primary, #6366f1);
    }
  `,
})
export class FormatSelectorComponent {
  readonly disabled = input(false);
  readonly selectedFormat = model<OutputFormat>('mp4');

  readonly formatOptions = OUTPUT_FORMAT_OPTIONS;

  onFormatChange(value: OutputFormat): void {
    this.selectedFormat.set(value);
  }
}
