import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-code-snippet',
  standalone: true,
  imports: [CommonModule],
  template: `<pre><code [innerHTML]="codeSnippet"></code></pre>`,
  styleUrl: '../app.component.css',
})
export class CodeSnippetComponent {
  @Input()
  set code(val: string) {
    this.setCodeSnippet(val);
  }

  codeSnippet: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {
    this.setCodeSnippet('');
  }

  setCodeSnippet(code: string): void {
    const escapedHtml = this.escapeHtml(code);
    this.codeSnippet = this.sanitizer.bypassSecurityTrustHtml(escapedHtml);
  }

  escapeHtml(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
