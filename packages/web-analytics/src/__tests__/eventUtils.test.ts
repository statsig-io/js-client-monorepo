import { _gatherEventData, _getMetadataFromElement } from '../utils/eventUtils';

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
      name: null,
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
    element.setAttribute('name', '');
    const metadata = _getMetadataFromElement(element);
    expect(metadata).toEqual({
      ariaLabel: null,
      class: '',
      classList: null,
      id: null,
      selector: 'div',
      name: null,
    });
  });

  it('preserves short attributes without truncation', () => {
    element.setAttribute('class', 'short-class');
    element.setAttribute('id', 'short-id');
    element.setAttribute('name', 'short-name');
    const metadata = _getMetadataFromElement(element);
    expect(metadata).toEqual({
      ariaLabel: null,
      class: 'short-class',
      classList: ['short-class'],
      id: 'short-id',
      selector: '#short-id',
      name: 'short-name',
    });
  });
});

describe('Sensitive Element Blocking', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('_gatherEventData with sensitive elements', () => {
    it('captures correct metadata for input elements with sensitive types', () => {
      const inputTypes = ['button', 'checkbox', 'submit', 'reset'];

      inputTypes.forEach((type) => {
        const input = document.createElement('input');
        input.setAttribute('type', type);
        input.setAttribute('id', 'test-input');
        input.setAttribute('class', 'test-class');
        input.setAttribute('aria-label', 'Test Label');
        input.setAttribute('name', 'test-name');
        input.setAttribute('value', 'sensitive-value');
        container.appendChild(input);

        const result = _gatherEventData(input);
        expect(result.value).toBe(window.location.href.split(/[?#]/)[0]);
        expect(result.metadata).toEqual({
          class: 'test-class',
          id: 'test-input',
          ariaLabel: 'Test Label',
          name: 'test-name',
        });
      });
    });

    it('captures correct metadata for textarea elements', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'sensitive content';
      textarea.setAttribute('id', 'test-textarea');
      textarea.setAttribute('class', 'textarea-class');
      container.appendChild(textarea);

      const result = _gatherEventData(textarea);
      expect(result.value).toBe(window.location.href.split(/[?#]/)[0]);
      expect(result.metadata).toEqual({
        class: 'textarea-class',
        id: 'test-textarea',
        ariaLabel: null,
        name: null,
      });
    });

    it('captures correct metadata for select elements', () => {
      const select = document.createElement('select');
      select.setAttribute('id', 'test-select');
      select.setAttribute('name', 'test-select-name');
      select.setAttribute('aria-label', 'Test Label');
      select.setAttribute('title', 'sensitive title');
      container.appendChild(select);

      const result = _gatherEventData(select);
      expect(result.value).toBe(window.location.href.split(/[?#]/)[0]);
      expect(result.metadata).toEqual({
        class: '',
        id: 'test-select',
        ariaLabel: 'Test Label',
        name: 'test-select-name',
      });
    });

    it('captures correct metadata for contenteditable elements', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      div.textContent = 'sensitive content';
      div.setAttribute('id', 'test-div');
      div.setAttribute('class', 'editable-div');
      container.appendChild(div);

      const result = _gatherEventData(div);
      expect(result.value).toBe(window.location.href.split(/[?#]/)[0]);
      expect(result.metadata).toEqual({
        class: 'editable-div',
        id: 'test-div',
        ariaLabel: null,
        name: null,
      });
    });

    it('allows non-sensitive input types', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.value = 'safe content';
      container.appendChild(input);

      const result = _gatherEventData(input);
      expect(result.value).not.toBeNull();
      expect(result.metadata['tagName']).toBe('input');
      expect(result.metadata['content']).toBe('safe content');
    });

    it('handles input with null type attribute', () => {
      const input = document.createElement('input');
      container.appendChild(input);

      const result = _gatherEventData(input);
      expect(result.value).not.toBeNull();
      expect(result.metadata['tagName']).toBe('input');
    });

    it('handles input with empty type attribute', () => {
      const input = document.createElement('input');
      input.setAttribute('type', '');
      container.appendChild(input);

      const result = _gatherEventData(input);
      expect(result.value).not.toBeNull();
      expect(result.metadata['tagName']).toBe('input');
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

describe('Outbound Link Detection', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('detects outbound links with statsig-ctr-capture class', () => {
    const button = document.createElement('button');
    button.className = 'btn statsig-ctr-capture primary';
    container.appendChild(button);

    const result = _gatherEventData(button);
    expect(result.metadata['isOutbound']).toBe('true');
  });

  it('detects outbound links with href attribute to different domain', () => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', 'https://example.com');
    container.appendChild(anchor);

    const result = _gatherEventData(anchor);
    expect(result.metadata['isOutbound']).toBe('true');
    expect(result.metadata['href']).toBe('https://example.com');
  });

  it('detects outbound links when button is inside anchor with href to different domain', () => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', 'https://example.com');
    container.appendChild(anchor);

    const button = document.createElement('button');
    button.textContent = 'Click me';
    anchor.appendChild(button);

    const result = _gatherEventData(button);
    expect(result.metadata['isOutbound']).toBe('true');
    expect(result.metadata['href']).toBe('https://example.com');
  });

  it('detects outbound links when element has both statsig-ctr-capture class and href to different domain', () => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', 'https://example.com');
    anchor.className = 'link statsig-ctr-capture';
    container.appendChild(anchor);

    const result = _gatherEventData(anchor);
    expect(result.metadata['isOutbound']).toBe('true');
    expect(result.metadata['href']).toBe('https://example.com');
  });

  it('does not mark as outbound when element has neither statsig-ctr-capture class nor href', () => {
    const button = document.createElement('button');
    button.className = 'btn primary';
    button.textContent = 'Regular button';
    container.appendChild(button);

    const result = _gatherEventData(button);
    expect(result.metadata['isOutbound']).toBeUndefined();
  });

  it('does not mark as outbound for same-domain links', () => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', window.location.href);
    container.appendChild(anchor);

    const result = _gatherEventData(anchor);
    expect(result.metadata['isOutbound']).toBeUndefined();
    expect(result.metadata['href']).toBe(window.location.href);
  });

  it('does not mark as outbound for relative links', () => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', window.location.href + '/some-page');
    container.appendChild(anchor);

    const result = _gatherEventData(anchor);
    expect(result.metadata['isOutbound']).toBeUndefined();
    expect(result.metadata['href']).toBe(window.location.href + '/some-page');
  });

  it('handles anchor with empty href', () => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', '');
    container.appendChild(anchor);

    const result = _gatherEventData(anchor);
    expect(result.metadata['isOutbound']).toBeUndefined();
    expect(result.metadata['href']).toBe('');
  });

  it('handles anchor with null href', () => {
    const anchor = document.createElement('a');
    // No href attribute set
    container.appendChild(anchor);

    const result = _gatherEventData(anchor);
    expect(result.metadata['isOutbound']).toBeUndefined();
    expect(result.metadata['href']).toBeNull();
  });
});
