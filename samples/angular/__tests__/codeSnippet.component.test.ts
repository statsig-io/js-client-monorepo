import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeSnippetComponent } from '../src/app/codeSnippet/codeSnippet.component';

describe('CodeSnippetComponent', () => {
  let component: CodeSnippetComponent;
  let fixture: ComponentFixture<CodeSnippetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeSnippetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeSnippetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
