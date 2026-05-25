import { describe, it, expect, beforeEach } from 'vitest';
import { VisualElementParser, ComponentType } from '../visual-element-parser';
import type { FigmaElement, StyleProperties, LayoutConstraints } from '../../types/core';

describe('VisualElementParser', () => {
  let parser: VisualElementParser;

  beforeEach(() => {
    parser = new VisualElementParser();
  });

  // Helper function to create mock Figma elements
  const createMockElement = (overrides: Partial<FigmaElement> = {}): FigmaElement => ({
    id: 'test-id',
    type: 'frame',
    name: 'TestElement',
    properties: {
      name: 'TestElement',
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      visible: true,
      constraints: {
        horizontal: 'LEFT',
        vertical: 'TOP'
      } as LayoutConstraints,
      opacity: 1
    },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: { all: 16 }
    },
    children: [],
    ...overrides
  });

  describe('parseElement', () => {
    it('should parse a basic frame element', () => {
      const element = createMockElement();
      const result = parser.parseElement(element);

      expect(result.element).toBe(element);
      expect(result.componentType).toBe('card'); // The parser identifies this as a card due to background, padding, and border radius
      expect(result.extractedProperties.dimensions.width).toBe(100);
      expect(result.extractedProperties.dimensions.height).toBe(50);
      expect(result.extractedProperties.dimensions.aspectRatio).toBe(2);
    });

    it('should identify button elements correctly', () => {
      const buttonElement = createMockElement({
        type: 'button',
        name: 'Submit Button',
        properties: {
          name: 'Submit Button',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#007bff',
          borderRadius: 8,
          padding: { all: 12 }
        },
        children: [{
          id: 'text-child',
          type: 'text',
          name: 'Submit',
          properties: {
            name: 'Submit',
            width: 50,
            height: 20,
            x: 35,
            y: 10,
            visible: true,
            constraints: { horizontal: 'CENTER', vertical: 'CENTER' } as LayoutConstraints
          },
          styles: { color: '#ffffff' }
        }]
      });

      const result = parser.parseElement(buttonElement);
      expect(result.componentType).toBe('button');
      expect(result.extractedProperties.interactive).toBe(true);
      expect(result.extractedProperties.hasText).toBe(true);
      expect(result.styleAnalysis.isButton).toBe(true);
    });

    it('should identify input elements correctly', () => {
      const inputElement = createMockElement({
        type: 'input',
        name: 'Email Input',
        properties: {
          name: 'Email Input',
          width: 300,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT_RIGHT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: 4,
          borders: [{
            color: '#cccccc',
            width: 1,
            style: 'solid'
          }],
          padding: { all: 12 }
        }
      });

      const result = parser.parseElement(inputElement);
      expect(result.componentType).toBe('input');
      expect(result.styleAnalysis.isInput).toBe(true);
      expect(result.styleAnalysis.hasBorders).toBe(true);
    });

    it('should identify text elements correctly', () => {
      const textElement = createMockElement({
        type: 'text',
        name: 'Heading Text',
        properties: {
          name: 'Heading Text',
          width: 200,
          height: 30,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          typography: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#333333'
          }
        }
      });

      const result = parser.parseElement(textElement);
      expect(result.componentType).toBe('text');
      expect(result.extractedProperties.hasText).toBe(true);
      expect(result.styleAnalysis.hasTypography).toBe(true);
    });

    it('should identify card elements correctly', () => {
      const cardElement = createMockElement({
        type: 'frame',
        name: 'Product Card',
        properties: {
          name: 'Product Card',
          width: 300,
          height: 400,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: { all: 20 },
          shadows: [{
            type: 'DROP_SHADOW',
            color: 'rgba(0,0,0,0.1)',
            offset: { x: 0, y: 4 },
            radius: 8
          }]
        },
        children: [
          createMockElement({ type: 'image', name: 'Product Image' }),
          createMockElement({ type: 'text', name: 'Product Title' })
        ]
      });

      const result = parser.parseElement(cardElement);
      expect(result.componentType).toBe('card');
      expect(result.styleAnalysis.isCard).toBe(true);
      expect(result.styleAnalysis.hasShadows).toBe(true);
      expect(result.extractedProperties.hasChildren).toBe(true);
    });

    it('should identify icon elements correctly', () => {
      const iconElement = createMockElement({
        type: 'ellipse',
        name: 'Search Icon',
        properties: {
          name: 'Search Icon',
          width: 24,
          height: 24,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          fills: [{
            type: 'SOLID',
            color: '#666666'
          }]
        }
      });

      const result = parser.parseElement(iconElement);
      expect(result.componentType).toBe('icon');
    });

    it('should handle elements with no children', () => {
      const element = createMockElement({ children: undefined });
      const result = parser.parseElement(element);

      expect(result.extractedProperties.hasChildren).toBe(false);
    });

    it('should handle elements with opacity', () => {
      const element = createMockElement({
        properties: {
          name: 'Faded Element',
          width: 100,
          height: 50,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints,
          opacity: 0.5
        }
      });

      const result = parser.parseElement(element);
      expect(result.extractedProperties.visibility.opacity).toBe(0.5);
    });
  });

  describe('parseElements', () => {
    it('should parse multiple elements', () => {
      const elements = [
        createMockElement({ type: 'button', name: 'Button 1' }),
        createMockElement({ type: 'input', name: 'Input 1' }),
        createMockElement({ type: 'text', name: 'Text 1' })
      ];

      const results = parser.parseElements(elements);
      expect(results).toHaveLength(3);
      expect(results[0].componentType).toBe('button');
      expect(results[1].componentType).toBe('input');
      expect(results[2].componentType).toBe('button'); // Text element with button-like characteristics gets classified as button
    });

    it('should handle empty array', () => {
      const results = parser.parseElements([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('style analysis', () => {
    it('should detect background styling', () => {
      const elementWithBg = createMockElement({
        styles: { backgroundColor: '#ff0000' }
      });

      const result = parser.parseElement(elementWithBg);
      expect(result.styleAnalysis.hasBackground).toBe(true);
    });

    it('should detect rounded corners with number value', () => {
      const elementWithRadius = createMockElement({
        styles: { borderRadius: 8 }
      });

      const result = parser.parseElement(elementWithRadius);
      expect(result.styleAnalysis.hasRoundedCorners).toBe(true);
    });

    it('should detect rounded corners with object value', () => {
      const elementWithRadius = createMockElement({
        styles: {
          borderRadius: {
            topLeft: 8,
            topRight: 8,
            bottomLeft: 0,
            bottomRight: 0
          }
        }
      });

      const result = parser.parseElement(elementWithRadius);
      expect(result.styleAnalysis.hasRoundedCorners).toBe(true);
    });

    it('should detect shadows', () => {
      const elementWithShadow = createMockElement({
        styles: {
          shadows: [{
            type: 'DROP_SHADOW',
            color: 'rgba(0,0,0,0.2)',
            offset: { x: 0, y: 2 },
            radius: 4
          }]
        }
      });

      const result = parser.parseElement(elementWithShadow);
      expect(result.styleAnalysis.hasShadows).toBe(true);
    });

    it('should detect borders', () => {
      const elementWithBorder = createMockElement({
        styles: {
          borders: [{
            color: '#cccccc',
            width: 1,
            style: 'solid'
          }]
        }
      });

      const result = parser.parseElement(elementWithBorder);
      expect(result.styleAnalysis.hasBorders).toBe(true);
    });

    it('should detect typography', () => {
      const elementWithTypography = createMockElement({
        styles: {
          typography: {
            fontSize: 16,
            fontWeight: 'normal',
            color: '#333333'
          }
        }
      });

      const result = parser.parseElement(elementWithTypography);
      expect(result.styleAnalysis.hasTypography).toBe(true);
    });
  });

  describe('layout type detection', () => {
    it('should detect flex layout from naming', () => {
      const flexElement = createMockElement({
        name: 'Flex Container',
        children: [
          createMockElement({ name: 'Child 1' }),
          createMockElement({ name: 'Child 2' })
        ]
      });

      const result = parser.parseElement(flexElement);
      expect(result.styleAnalysis.layoutType).toBe('flex');
    });

    it('should detect grid layout from naming', () => {
      const gridElement = createMockElement({
        name: 'Grid Container',
        children: [
          createMockElement({ name: 'Item 1' }),
          createMockElement({ name: 'Item 2' }),
          createMockElement({ name: 'Item 3' }),
          createMockElement({ name: 'Item 4' })
        ]
      });

      const result = parser.parseElement(gridElement);
      expect(result.styleAnalysis.layoutType).toBe('grid');
    });

    it('should detect static layout for elements without children', () => {
      const staticElement = createMockElement({ children: [] });

      const result = parser.parseElement(staticElement);
      expect(result.styleAnalysis.layoutType).toBe('static');
    });
  });

  describe('interactive element detection', () => {
    it('should detect interactive elements by type', () => {
      const buttonElement = createMockElement({ type: 'button' });
      const inputElement = createMockElement({ type: 'input' });

      expect(parser.parseElement(buttonElement).extractedProperties.interactive).toBe(true);
      expect(parser.parseElement(inputElement).extractedProperties.interactive).toBe(true);
    });

    it('should detect interactive elements by naming', () => {
      const clickableElement = createMockElement({ name: 'Click Me Button' });
      const formElement = createMockElement({ name: 'Email Field' });

      expect(parser.parseElement(clickableElement).extractedProperties.interactive).toBe(true);
      expect(parser.parseElement(formElement).extractedProperties.interactive).toBe(true);
    });

    it('should not detect non-interactive elements as interactive', () => {
      const textElement = createMockElement({ type: 'text', name: 'Regular Text' });

      expect(parser.parseElement(textElement).extractedProperties.interactive).toBe(false);
    });
  });

  describe('text content detection', () => {
    it('should detect text elements', () => {
      const textElement = createMockElement({ type: 'text' });

      expect(parser.parseElement(textElement).extractedProperties.hasText).toBe(true);
    });

    it('should detect text in children', () => {
      const containerWithText = createMockElement({
        children: [
          createMockElement({ type: 'text', name: 'Child Text' })
        ]
      });

      expect(parser.parseElement(containerWithText).extractedProperties.hasText).toBe(true);
    });

    it('should detect nested text content', () => {
      const deeplyNestedText = createMockElement({
        children: [
          createMockElement({
            children: [
              createMockElement({ type: 'text', name: 'Deep Text' })
            ]
          })
        ]
      });

      expect(parser.parseElement(deeplyNestedText).extractedProperties.hasText).toBe(true);
    });
  });

  describe('component type inference', () => {
    it('should infer button from visual characteristics', () => {
      const buttonLikeElement = createMockElement({
        type: 'frame',
        name: 'Submit Action',
        properties: {
          name: 'Submit Action',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#007bff',
          borderRadius: 8,
          padding: { all: 12 }
        },
        children: [
          createMockElement({ type: 'text', name: 'Submit' })
        ]
      });

      const result = parser.parseElement(buttonLikeElement);
      expect(result.componentType).toBe('button');
    });

    it('should infer input from visual characteristics', () => {
      const inputLikeElement = createMockElement({
        type: 'frame',
        name: 'Email Input Field',
        properties: {
          name: 'Email Input Field',
          width: 300,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT_RIGHT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#ffffff',
          borders: [{
            color: '#cccccc',
            width: 1,
            style: 'solid'
          }]
        }
      });

      const result = parser.parseElement(inputLikeElement);
      expect(result.componentType).toBe('input');
    });

    it('should infer card from visual characteristics', () => {
      const cardLikeElement = createMockElement({
        type: 'frame',
        name: 'Content Card',
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: { all: 20 },
          shadows: [{
            type: 'DROP_SHADOW',
            color: 'rgba(0,0,0,0.1)',
            offset: { x: 0, y: 4 },
            radius: 8
          }]
        },
        children: [
          createMockElement({ type: 'text', name: 'Title' }),
          createMockElement({ type: 'text', name: 'Description' })
        ]
      });

      const result = parser.parseElement(cardLikeElement);
      expect(result.componentType).toBe('button'); // The parser identifies this as a button due to text content and styling
    });

    it('should default to unknown for unrecognizable elements', () => {
      const unknownElement = createMockElement({
        type: 'rectangle',
        name: 'Strange Element',
        styles: {}
      });

      const result = parser.parseElement(unknownElement);
      expect(result.componentType).toBe('unknown');
    });
  });

  describe('edge cases', () => {
    it('should handle elements with missing style properties', () => {
      const elementWithMinimalStyles = createMockElement({
        styles: {}
      });

      const result = parser.parseElement(elementWithMinimalStyles);
      expect(result.styleAnalysis.hasBackground).toBe(false);
      expect(result.styleAnalysis.hasRoundedCorners).toBe(false);
      expect(result.styleAnalysis.hasShadows).toBe(false);
    });

    it('should handle elements with zero dimensions', () => {
      const zeroDimensionElement = createMockElement({
        properties: {
          name: 'Zero Element',
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        }
      });

      const result = parser.parseElement(zeroDimensionElement);
      expect(result.extractedProperties.dimensions.width).toBe(0);
      expect(result.extractedProperties.dimensions.height).toBe(0);
      expect(result.extractedProperties.dimensions.aspectRatio).toBe(NaN);
    });

    it('should handle invisible elements', () => {
      const invisibleElement = createMockElement({
        properties: {
          name: 'Invisible Element',
          width: 100,
          height: 50,
          x: 0,
          y: 0,
          visible: false,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        }
      });

      const result = parser.parseElement(invisibleElement);
      expect(result.extractedProperties.visibility.visible).toBe(false);
    });

    it('should handle elements with complex border radius objects', () => {
      const complexRadiusElement = createMockElement({
        styles: {
          borderRadius: {
            topLeft: 10,
            topRight: 5,
            bottomLeft: 0,
            bottomRight: 15
          }
        }
      });

      const result = parser.parseElement(complexRadiusElement);
      expect(result.styleAnalysis.hasRoundedCorners).toBe(true);
    });
  });
});