import { _getMetadataFromElement } from '../utils/eventUtils';

describe('_getMetadataFromElement', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  it('handles empty element', () => {
    const metadata = _getMetadataFromElement(element);
    expect(metadata).toEqual({
      ariaLabel: null,
      class: '',
      classList: null,
      id: null,
      selector: 'div',
    });
  });

  it('truncates long class attribute', () => {
    const longClass = 'a'.repeat(2000);
    element.setAttribute('class', longClass);
    const metadata = _getMetadataFromElement(element);
    expect(metadata['class']).toBe('a'.repeat(1000) + '...');
  });

  it('truncates long id attribute', () => {
    const longId = 'b'.repeat(2000);
    element.setAttribute('id', longId);
    const metadata = _getMetadataFromElement(element);
    expect(metadata['id']).toBe('b'.repeat(1000) + '...');
  });

  it('truncates long aria-label attribute', () => {
    const longAriaLabel = 'c'.repeat(2000);
    element.setAttribute('aria-label', longAriaLabel);
    const metadata = _getMetadataFromElement(element);
    expect(metadata['ariaLabel']).toBe('c'.repeat(1000) + '...');
  });

  it('limits number of classes in classList', () => {
    // Add 150 classes
    for (let i = 0; i < 150; i++) {
      element.classList.add(`class-${i}`);
    }
    const metadata = _getMetadataFromElement(element);
    const classNames = metadata['classList'] as string[];
    expect(classNames).toHaveLength(100);
    expect(classNames[0]).toBe('class-0');
    expect(classNames[99]).toBe('class-99');
  });

  it('handles null attributes', () => {
    element.setAttribute('aria-label', '');
    element.setAttribute('id', '');
    const metadata = _getMetadataFromElement(element);
    expect(metadata).toEqual({
      ariaLabel: null,
      class: '',
      classList: null,
      id: null,
      selector: 'div',
    });
  });

  it('preserves short attributes without truncation', () => {
    element.setAttribute('class', 'short-class');
    element.setAttribute('id', 'short-id');
    const metadata = _getMetadataFromElement(element);
    expect(metadata).toEqual({
      ariaLabel: null,
      class: 'short-class',
      classList: ['short-class'],
      id: 'short-id',
      selector: '#short-id',
    });
  });
});

describe('CSS Selector Generation', () => {
  let container: HTMLElement;
  let target: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'container-class';
    document.body.appendChild(container);

    target = document.createElement('button');
    target.id = 'test-button';
    target.className = 'btn primary';
    target.setAttribute('type', 'submit');
    target.setAttribute('aria-label', 'Submit form');
    container.appendChild(target);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('generates selectors with ID', () => {
    const metadata = _getMetadataFromElement(target);
    const selector = metadata['selector'] as string;
    expect(selector).toBe('#test-button');
  });

  it('generates selectors with classes', () => {
    target.id = ''; // Remove ID to test class-based selection
    const metadata = _getMetadataFromElement(target);
    const selector = metadata['selector'] as string;
    expect(selector).toBe('div.container-class > button.btn.primary');
  });

  it('generates selectors with nth-child when needed', () => {
    target.id = '';
    target.className = '';
    const button2 = document.createElement('button');
    container.appendChild(button2);

    const metadata = _getMetadataFromElement(target);
    const selector = metadata['selector'] as string;
    expect(selector).toBe(
      'div.container-class > button:nth-child(1):nth-of-type(1)',
    );
  });

  it('generates selectors with nth-child and nth-of-type when needed', () => {
    target.id = '';
    target.className = '';

    // Add a div between buttons to affect nth-child but not nth-of-type
    const div = document.createElement('div');
    container.appendChild(div);

    const button2 = document.createElement('button');
    container.appendChild(button2);

    const metadata = _getMetadataFromElement(button2);
    const selector = metadata['selector'] as string;
    expect(selector).toBe(
      'div.container-class > button:nth-child(3):nth-of-type(2)',
    );
  });

  it('stops at body element', () => {
    target.id = '';
    target.className = '';
    const metadata = _getMetadataFromElement(target);
    const selector = metadata['selector'] as string;
    expect(selector).toBe('div.container-class > button');
  });

  it('handles nested elements with same classes', () => {
    target.id = '';
    const nestedContainer = document.createElement('div');
    nestedContainer.className = 'container-class';
    container.appendChild(nestedContainer);

    const nestedButton = document.createElement('button');
    nestedButton.className = 'btn primary';
    nestedContainer.appendChild(nestedButton);

    const metadata = _getMetadataFromElement(nestedButton);
    const selector = metadata['selector'] as string;
    expect(selector).toBe(
      'div.container-class > div.container-class:nth-child(2) > button.btn.primary',
    );
  });

  it('handles elements with no parent', () => {
    const orphanedElement = document.createElement('div');
    const metadata = _getMetadataFromElement(orphanedElement);
    const selector = metadata['selector'] as string;
    expect(selector).toBe('div');
  });

  it('stops at max depth', () => {
    target.id = '';
    target.className = '';

    // Create deeply nested structure beyond MAX_SELECTOR_DEPTH
    let currentContainer = container;
    for (let i = 0; i < 50 + 5; i++) {
      const newContainer = document.createElement('div');
      newContainer.className = `depth-${i}`;
      currentContainer.appendChild(newContainer);
      currentContainer = newContainer;
    }

    // Move target into deepest container
    currentContainer.appendChild(target);

    const metadata = _getMetadataFromElement(target);
    const selector = metadata['selector'] as string;

    // Should only include MAX_SELECTOR_DEPTH levels
    const expectedLevels = selector.split(' > ').length;
    expect(expectedLevels).toBeLessThanOrEqual(50);
  });
});
