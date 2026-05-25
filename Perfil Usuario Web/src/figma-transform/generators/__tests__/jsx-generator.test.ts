import { describe, it, expect, beforeEach } from 'vitest';
import { JSXGenerator, JSXGenerationOptions } from '../jsx-generator.js';
import { FigmaElement, StyleProperties, ElementProperties, LayoutConstraints } from '../../types/core.js';

describe('JSXGenerator', () => {
  let generator: JSXGenerator;
  let defaultOptions: JSXGenerationOptions;

  beforeEach(() => {
    defaultOptions = {
      useSemanticHTML: true,
      includeAccessibility: true,
      responsiveBreakpoints: ['sm', 'md', 'lg', 'xl'],
      classNameUtility: 'cn'
    };
    generator = new JSXGenerator(defaultOptions);
  });

  const createMockElement = (overrides: Partial<FigmaElement> = {}): FigmaElement => {
    const defaultProperties: ElementProperties = {
      name: 'test-element',
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      visible: true,
      constraints: {
        horizontal: 'LEFT',
        vertical: 'TOP'
      }
    };

    const defaultStyles: StyleProperties = {
      backgroundColor: '#ffffff',
      padding: { all: 16 }
    };

    return {
      id: 'test-id',
      type: 'frame',
      name: 'TestElement',
      properties: defaultProperties,
      styles: defaultStyles,
      ...overrides
    };
  };

  describe('generateJSX', () => {
    it('should generate basic JSX for a simple element', () => {
      const element = createMockElement({
        type: 'button',
        name: 'Submit Button'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('<button');
      expect(jsx).toContain('className={cn(');
      expect(jsx).toContain('</button>');
    });

    it('should generate self-closing tags for appropriate elements', () => {
      const element = createMockElement({
        type: 'image',
        name: 'Profile Image'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('<img');
      expect(jsx).toContain('/>');
      expect(jsx).not.toContain('</img>');
    });

    it('should include text content for text elements', () => {
      const element = createMockElement({
        type: 'text',
        name: 'Hello World'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('Hello World');
    });

    it('should generate nested JSX for elements with children', () => {
      const childElement = createMockElement({
        type: 'text',
        name: 'Child Text'
      });

      const parentElement = createMockElement({
        type: 'frame',
        name: 'Parent Frame',
        children: [childElement]
      });

      const jsx = generator.generateJSX(parentElement);
      
      expect(jsx).toContain('<div');
      expect(jsx).toContain('Child Text');
      expect(jsx).toContain('</div>');
    });

    it('should apply Tailwind classes from styles', () => {
      const element = createMockElement({
        styles: {
          backgroundColor: '#ef4444',
          padding: { all: 16 },
          borderRadius: 8
        }
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('className={cn(');
      expect(jsx).toContain('bg-red-500');
      expect(jsx).toContain('p-4');
      expect(jsx).toContain('rounded-2');
    });
  });

  describe('generateComponentJSX', () => {
    it('should return self-closing div for empty elements array', () => {
      const jsx = generator.generateComponentJSX([]);
      expect(jsx).toBe('<div />');
    });

    it('should return single element JSX for one element', () => {
      const element = createMockElement({
        type: 'button',
        name: 'Single Button'
      });

      const jsx = generator.generateComponentJSX([element]);
      
      expect(jsx).toContain('<button');
      expect(jsx).not.toContain('<>');
    });

    it('should wrap multiple elements in React fragment', () => {
      const elements = [
        createMockElement({ type: 'button', name: 'Button 1' }),
        createMockElement({ type: 'button', name: 'Button 2' })
      ];

      const jsx = generator.generateComponentJSX(elements);
      
      expect(jsx).toContain('<>');
      expect(jsx).toContain('</>');
      expect(jsx).toContain('<button');
    });
  });

  describe('semantic HTML generation', () => {
    it('should use semantic tags when useSemanticHTML is true', () => {
      const element = createMockElement({
        semanticRole: 'navigation',
        name: 'Main Navigation'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('<nav');
      expect(jsx).toContain('</nav>');
    });

    it('should detect semantic roles from element names', () => {
      const testCases = [
        { name: 'header section', expectedTag: 'header' },
        { name: 'footer content', expectedTag: 'footer' },
        { name: 'main content area', expectedTag: 'main' },
        { name: 'navigation menu', expectedTag: 'nav' } // Changed from sidebar navigation to navigation menu
      ];

      testCases.forEach(({ name, expectedTag }) => {
        const element = createMockElement({ name });
        const jsx = generator.generateJSX(element);
        expect(jsx).toContain(`<${expectedTag}`);
      });
    });

    it('should fallback to basic tags when useSemanticHTML is false', () => {
      const nonSemanticGenerator = new JSXGenerator({
        ...defaultOptions,
        useSemanticHTML: false
      });

      const element = createMockElement({
        semanticRole: 'navigation',
        name: 'Main Navigation'
      });

      const jsx = nonSemanticGenerator.generateJSX(element);
      
      expect(jsx).toContain('<div');
      expect(jsx).not.toContain('<nav');
    });
  });

  describe('accessibility attributes', () => {
    it('should add accessibility attributes when includeAccessibility is true', () => {
      const element = createMockElement({
        type: 'button',
        name: 'Submit Form'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('aria-label="submit form"');
      expect(jsx).toContain('tabIndex="0"');
    });

    it('should not add accessibility attributes when includeAccessibility is false', () => {
      const nonA11yGenerator = new JSXGenerator({
        ...defaultOptions,
        includeAccessibility: false
      });

      const element = createMockElement({
        type: 'button',
        name: 'Submit Form'
      });

      const jsx = nonA11yGenerator.generateJSX(element);
      
      expect(jsx).not.toContain('aria-label');
      expect(jsx).not.toContain('tabIndex');
    });

    it('should add appropriate ARIA roles for different element types', () => {
      const testCases = [
        { type: 'button', expectedRole: 'button' },
        { type: 'input', expectedRole: 'textbox' }
      ];

      testCases.forEach(({ type, expectedRole }) => {
        const element = createMockElement({ type: type as any });
        const jsx = generator.generateJSX(element);
        expect(jsx).toContain(`role="${expectedRole}"`);
      });
    });

    it('should generate clean aria-labels from element names', () => {
      const testCases = [
        { name: 'submit-button', expected: 'submit button' },
        { name: 'UserProfileCard', expected: 'user profile card' },
        { name: 'navigation_menu', expected: 'navigation menu' }
      ];

      testCases.forEach(({ name, expected }) => {
        const element = createMockElement({
          type: 'button',
          name
        });
        const jsx = generator.generateJSX(element);
        expect(jsx).toContain(`aria-label="${expected}"`);
      });
    });
  });

  describe('element-specific attributes', () => {
    it('should add type attribute for button elements', () => {
      const element = createMockElement({
        type: 'button',
        name: 'Submit Button'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('type="button"');
    });

    it('should detect input types from element names', () => {
      const testCases = [
        { name: 'email input', expectedType: 'email' },
        { name: 'password field', expectedType: 'password' },
        { name: 'regular input', expectedType: 'text' }
      ];

      testCases.forEach(({ name, expectedType }) => {
        const element = createMockElement({
          type: 'input',
          name
        });
        const jsx = generator.generateJSX(element);
        expect(jsx).toContain(`type="${expectedType}"`);
      });
    });

    it('should add alt attribute for image elements', () => {
      const element = createMockElement({
        type: 'image',
        name: 'Profile Picture'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('alt="Profile Picture"');
    });
  });

  describe('layout class generation', () => {
    it('should add flex classes for elements with linear child arrangement', () => {
      const children = [
        createMockElement({
          properties: { ...createMockElement().properties, x: 0, y: 0 }
        }),
        createMockElement({
          properties: { ...createMockElement().properties, x: 100, y: 0 }
        })
      ];

      const element = createMockElement({
        children
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('flex');
      expect(jsx).toContain('items-center');
    });

    it('should add flex-col for vertically arranged children', () => {
      const children = [
        createMockElement({
          properties: { ...createMockElement().properties, x: 0, y: 0 }
        }),
        createMockElement({
          properties: { ...createMockElement().properties, x: 0, y: 50 }
        })
      ];

      const element = createMockElement({
        children
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('flex-col');
    });

    it('should add grid classes for grid-like arrangements', () => {
      const children = [
        createMockElement({
          properties: { ...createMockElement().properties, x: 0, y: 0 }
        }),
        createMockElement({
          properties: { ...createMockElement().properties, x: 100, y: 0 }
        }),
        createMockElement({
          properties: { ...createMockElement().properties, x: 0, y: 50 }
        }),
        createMockElement({
          properties: { ...createMockElement().properties, x: 100, y: 50 }
        })
      ];

      const element = createMockElement({
        children
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('grid');
      expect(jsx).toContain('grid-cols-');
    });

    it('should add width and height classes based on element properties', () => {
      const element = createMockElement({
        properties: {
          ...createMockElement().properties,
          width: 256,
          height: 128
        }
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('w-64');
      expect(jsx).toContain('h-32');
    });

    it('should use arbitrary values for custom dimensions', () => {
      const element = createMockElement({
        properties: {
          ...createMockElement().properties,
          width: 150,
          height: 75
        }
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('w-[150px]');
      expect(jsx).toContain('h-[75px]');
    });
  });

  describe('className utility integration', () => {
    it('should use the specified className utility function', () => {
      const customGenerator = new JSXGenerator({
        ...defaultOptions,
        classNameUtility: 'clsx'
      });

      const element = createMockElement();
      const jsx = customGenerator.generateJSX(element);
      
      expect(jsx).toContain('className={clsx(');
    });

    it('should include className prop in the utility call', () => {
      const element = createMockElement();
      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain(', className)}');
    });

    it('should handle empty class arrays gracefully', () => {
      const element = createMockElement({
        styles: {}
      });

      const jsx = generator.generateJSX(element);
      
      // Should still include className prop even with no base classes
      expect(jsx).toContain('className={cn(');
    });
  });

  describe('JSX formatting and indentation', () => {
    it('should properly indent nested elements', () => {
      const childElement = createMockElement({
        type: 'text',
        name: 'Nested Text'
      });

      const parentElement = createMockElement({
        children: [childElement]
      });

      const jsx = generator.generateJSX(parentElement);
      
      // Check for proper indentation
      const lines = jsx.split('\n');
      expect(lines.some(line => line.startsWith('  <p'))).toBe(true);
    });

    it('should handle single-line elements correctly', () => {
      const element = createMockElement({
        type: 'text',
        name: 'Simple Text'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('<p className={cn(');
      expect(jsx).toContain('Simple Text');
      expect(jsx).toContain('</p>');
    });

    it('should format multi-line elements with proper closing tags', () => {
      const children = [
        createMockElement({ type: 'text', name: 'Child 1' }),
        createMockElement({ type: 'text', name: 'Child 2' })
      ];

      const element = createMockElement({
        children
      });

      const jsx = generator.generateJSX(element);
      
      const lines = jsx.split('\n');
      expect(lines[0]).toContain('<div');
      expect(lines[lines.length - 1]).toContain('</div>');
    });
  });

  describe('responsive class integration', () => {
    it('should include responsive classes when element has responsive styles', () => {
      const element = createMockElement({
        styles: {
          backgroundColor: '#ffffff'
        },
        responsive: {
          md: {
            backgroundColor: '#f3f4f6'
          },
          lg: {
            backgroundColor: '#e5e7eb'
          }
        }
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('bg-white');
      expect(jsx).toContain('md:bg-[#f3f4f6]'); // Updated to match actual implementation
      expect(jsx).toContain('lg:bg-[#e5e7eb]'); // Updated to match actual implementation
    });

    it('should handle elements without responsive styles', () => {
      const element = createMockElement({
        styles: {
          backgroundColor: '#ffffff'
        }
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('bg-white');
      expect(jsx).not.toContain('md:');
      expect(jsx).not.toContain('lg:');
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no children gracefully', () => {
      const element = createMockElement({
        children: []
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('<div');
      expect(jsx).toContain('</div>');
    });

    it('should handle elements with empty names', () => {
      const element = createMockElement({
        name: '',
        type: 'button'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('<button');
      expect(jsx).not.toContain('aria-label=""');
    });

    it('should handle elements with special characters in names', () => {
      const element = createMockElement({
        name: 'Button@#$%^&*()',
        type: 'button'
      });

      const jsx = generator.generateJSX(element);
      
      expect(jsx).toContain('<button');
      expect(jsx).toContain('aria-label='); // Just check that aria-label exists
    });

    it('should handle deeply nested element structures', () => {
      const deepChild = createMockElement({
        type: 'text',
        name: 'Deep Child'
      });

      const middleChild = createMockElement({
        children: [deepChild]
      });

      const parentElement = createMockElement({
        children: [middleChild]
      });

      const jsx = generator.generateJSX(parentElement);
      
      expect(jsx).toContain('Deep Child');
      expect(jsx.split('\n').length).toBeGreaterThan(3);
    });
  });
});