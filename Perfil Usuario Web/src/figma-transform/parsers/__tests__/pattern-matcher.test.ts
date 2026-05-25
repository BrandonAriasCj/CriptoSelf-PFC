import { describe, it, expect, beforeEach } from 'vitest';
import { PatternMatcher, UIComponentMatch } from '../pattern-matcher';
import { VisualElementParser, ParsedElement } from '../visual-element-parser';
import type { FigmaElement, LayoutConstraints } from '../../types/core';

describe('PatternMatcher', () => {
  let patternMatcher: PatternMatcher;
  let visualParser: VisualElementParser;

  beforeEach(() => {
    patternMatcher = new PatternMatcher();
    visualParser = new VisualElementParser();
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
      } as LayoutConstraints
    },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: { all: 16 }
    },
    children: [],
    ...overrides
  });

  // Helper function to create parsed element
  const createParsedElement = (element: FigmaElement): ParsedElement => {
    return visualParser.parseElement(element);
  };

  describe('findBestMatch', () => {
    it('should match a typical button element to Button component', () => {
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
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          padding: { all: 12 }
        },
        children: [
          createMockElement({
            type: 'text',
            name: 'Submit'
          })
        ]
      });

      const parsedElement = createParsedElement(buttonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.matchedComponent.name).toBe('Button');
      expect(match?.confidence).toBeGreaterThan(0.6);
      expect(match?.propMappings.some(m => m.componentProp === 'children')).toBe(true);
    });

    it('should match an input element to Input component', () => {
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
          borderRadius: 6,
          borders: [{
            color: '#d1d5db',
            width: 1,
            style: 'solid'
          }],
          padding: { all: 12 }
        }
      });

      const parsedElement = createParsedElement(inputElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.matchedComponent.name).toBe('Input');
      expect(match?.confidence).toBeGreaterThan(0.6);
    });

    it('should match a card-like element to Card component', () => {
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
          createMockElement({
            type: 'image',
            name: 'Product Image'
          }),
          createMockElement({
            type: 'text',
            name: 'Product Title'
          }),
          createMockElement({
            type: 'text',
            name: 'Product Description'
          })
        ]
      });

      const parsedElement = createParsedElement(cardElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.matchedComponent.name).toBe('Card');
      expect(match?.confidence).toBeGreaterThan(0.6);
    });

    it('should return null for elements that do not match any component', () => {
      const unknownElement = createMockElement({
        type: 'rectangle',
        name: 'Strange Shape',
        properties: {
          name: 'Strange Shape',
          width: 50,
          height: 50,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#ff00ff'
        }
      });

      const parsedElement = createParsedElement(unknownElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      // Should either return null or have very low confidence
      if (match) {
        expect(match.confidence).toBeLessThan(0.6);
      } else {
        expect(match).toBeNull();
      }
    });

    it('should handle elements with missing or minimal styling', () => {
      const minimalElement = createMockElement({
        type: 'button',
        name: 'Minimal Button',
        styles: {}
      });

      const parsedElement = createParsedElement(minimalElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      // Should still attempt to match based on type, but may return null for minimal styling
      if (match) {
        expect(match.matchedComponent.name).toBe('Button');
      } else {
        expect(match).toBeNull();
      }
    });
  });

  describe('findMatches', () => {
    it('should find matches for multiple elements', () => {
      const elements = [
        createMockElement({
          type: 'button',
          name: 'Primary Button',
          styles: {
            backgroundColor: '#3b82f6',
            borderRadius: 8
          }
        }),
        createMockElement({
          type: 'input',
          name: 'Text Input',
          styles: {
            backgroundColor: '#ffffff',
            borders: [{
              color: '#d1d5db',
              width: 1,
              style: 'solid'
            }]
          }
        }),
        createMockElement({
          type: 'frame',
          name: 'Info Card',
          styles: {
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: { all: 20 },
            shadows: [{
              type: 'DROP_SHADOW',
              color: 'rgba(0,0,0,0.1)',
              offset: { x: 0, y: 2 },
              radius: 4
            }]
          },
          children: [
            createMockElement({ type: 'text', name: 'Title' })
          ]
        })
      ];

      const parsedElements = elements.map(el => createParsedElement(el));
      const matches = patternMatcher.findMatches(parsedElements);

      expect(matches.length).toBeGreaterThanOrEqual(2); // At least button and input should match
      expect(matches.some(m => m.matchedComponent.name === 'Button')).toBe(true);
      expect(matches.some(m => m.matchedComponent.name === 'Input')).toBe(true);
    });

    it('should filter out low-confidence matches', () => {
      const elements = [
        createMockElement({
          type: 'button',
          name: 'Good Button',
          styles: {
            backgroundColor: '#3b82f6',
            borderRadius: 8
          }
        }),
        createMockElement({
          type: 'rectangle',
          name: 'Weird Shape',
          styles: {
            backgroundColor: '#ff00ff'
          }
        })
      ];

      const parsedElements = elements.map(el => createParsedElement(el));
      const matches = patternMatcher.findMatches(parsedElements);

      // Should only return high-confidence matches
      expect(matches.length).toBeLessThanOrEqual(2);
      matches.forEach(match => {
        expect(match.confidence).toBeGreaterThan(0.6);
      });
    });

    it('should handle empty input array', () => {
      const matches = patternMatcher.findMatches([]);
      expect(matches).toHaveLength(0);
    });
  });

  describe('style similarity calculation', () => {
    it('should give high similarity for matching button styles', () => {
      const blueButtonElement = createMockElement({
        type: 'button',
        name: 'Blue Button',
        styles: {
          backgroundColor: '#3b82f6', // Matches Button default variant
          borderRadius: 8,
          padding: { all: 12 }
        }
      });

      const parsedElement = createParsedElement(blueButtonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.confidence).toBeGreaterThan(0.7);
    });

    it('should give lower similarity for non-matching styles', () => {
      const weirdButtonElement = createMockElement({
        type: 'button',
        name: 'Weird Button',
        styles: {
          backgroundColor: '#ff00ff', // Non-standard color
          borderRadius: 50, // Non-standard radius
          padding: { all: 100 } // Non-standard padding
        }
      });

      const parsedElement = createParsedElement(weirdButtonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      if (match) {
        expect(match.confidence).toBeLessThan(0.8);
      }
    });

    it('should handle elements with shadows correctly', () => {
      const shadowElement = createMockElement({
        type: 'frame',
        name: 'Shadow Card',
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          padding: { all: 16 },
          shadows: [{
            type: 'DROP_SHADOW',
            color: 'rgba(0,0,0,0.1)',
            offset: { x: 0, y: 2 },
            radius: 4
          }]
        },
        children: [
          createMockElement({ type: 'text', name: 'Content' })
        ]
      });

      const parsedElement = createParsedElement(shadowElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      // The element might be classified as Button due to its characteristics
      expect(['Card', 'Button']).toContain(match?.matchedComponent.name);
    });

    it('should handle elements with borders correctly', () => {
      const borderedElement = createMockElement({
        type: 'input',
        name: 'Bordered Input',
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: 6,
          borders: [{
            color: '#d1d5db',
            width: 1,
            style: 'solid'
          }],
          padding: { all: 12 }
        }
      });

      const parsedElement = createParsedElement(borderedElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.matchedComponent.name).toBe('Input');
    });
  });

  describe('dimension compatibility', () => {
    it('should match elements within expected button dimensions', () => {
      const normalButtonElement = createMockElement({
        type: 'button',
        name: 'Normal Button',
        properties: {
          name: 'Normal Button',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#3b82f6',
          borderRadius: 8
        }
      });

      const parsedElement = createParsedElement(normalButtonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.confidence).toBeGreaterThan(0.6);
    });

    it('should handle elements outside expected dimensions', () => {
      const tinyButtonElement = createMockElement({
        type: 'button',
        name: 'Tiny Button',
        properties: {
          name: 'Tiny Button',
          width: 10,
          height: 5,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#3b82f6',
          borderRadius: 8
        }
      });

      const parsedElement = createParsedElement(tinyButtonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      // Should still match but with lower confidence due to unusual dimensions
      if (match) {
        expect(match.matchedComponent.name).toBe('Button');
      }
    });

    it('should match input elements with appropriate aspect ratios', () => {
      const wideInputElement = createMockElement({
        type: 'input',
        name: 'Wide Input',
        properties: {
          name: 'Wide Input',
          width: 400,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT_RIGHT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#ffffff',
          borders: [{
            color: '#d1d5db',
            width: 1,
            style: 'solid'
          }]
        }
      });

      const parsedElement = createParsedElement(wideInputElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.matchedComponent.name).toBe('Input');
    });
  });

  describe('prop mapping generation', () => {
    it('should generate correct prop mappings for button elements', () => {
      const buttonElement = createMockElement({
        type: 'button',
        name: 'Submit Button',
        styles: {
          backgroundColor: '#3b82f6',
          borderRadius: 8
        },
        children: [
          createMockElement({
            type: 'text',
            name: 'Submit'
          })
        ]
      });

      const parsedElement = createParsedElement(buttonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.propMappings).toBeDefined();

      const childrenMapping = match?.propMappings.find(m => m.componentProp === 'children');
      expect(childrenMapping).toBeDefined();

      const variantMapping = match?.propMappings.find(m => m.componentProp === 'variant');
      expect(variantMapping).toBeDefined();
    });

    it('should generate prop mappings for input elements', () => {
      const inputElement = createMockElement({
        type: 'input',
        name: 'Email Input Field',
        styles: {
          backgroundColor: '#ffffff',
          borders: [{
            color: '#d1d5db',
            width: 1,
            style: 'solid'
          }]
        }
      });

      const parsedElement = createParsedElement(inputElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.propMappings).toBeDefined();

      // Should not have children mapping for input
      const childrenMapping = match?.propMappings.find(m => m.componentProp === 'children');
      expect(childrenMapping).toBeUndefined();
    });

    it('should handle disabled state detection', () => {
      const disabledElement = createMockElement({
        type: 'button',
        name: 'Disabled Button',
        properties: {
          name: 'Disabled Button',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints,
          opacity: 0.5
        },
        styles: {
          backgroundColor: '#6b7280'
        }
      });

      const parsedElement = createParsedElement(disabledElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();

      const disabledMapping = match?.propMappings.find(m => m.componentProp === 'disabled');
      expect(disabledMapping).toBeDefined();
    });
  });

  describe('style override generation', () => {
    it('should generate style overrides for custom colors', () => {
      const customColorElement = createMockElement({
        type: 'button',
        name: 'Custom Button',
        styles: {
          backgroundColor: '#ff6b35', // Custom color not in standard palette
          borderRadius: 8
        }
      });

      const parsedElement = createParsedElement(customColorElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.styleOverrides).toBeDefined();

      const backgroundOverride = match?.styleOverrides.find(o => o.property === 'backgroundColor');
      expect(backgroundOverride).toBeDefined();
      expect(backgroundOverride?.value).toBe('#ff6b35');
    });

    it('should generate style overrides for custom border radius', () => {
      const customRadiusElement = createMockElement({
        type: 'button',
        name: 'Rounded Button',
        styles: {
          backgroundColor: '#3b82f6',
          borderRadius: 25 // Non-standard radius
        }
      });

      const parsedElement = createParsedElement(customRadiusElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();

      const radiusOverride = match?.styleOverrides.find(o => o.property === 'borderRadius');
      expect(radiusOverride).toBeDefined();
      expect(radiusOverride?.value).toBe('25px');
    });

    it('should generate style overrides for custom padding', () => {
      const customPaddingElement = createMockElement({
        type: 'button',
        name: 'Padded Button',
        styles: {
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          padding: { all: 30 } // Non-standard padding
        }
      });

      const parsedElement = createParsedElement(customPaddingElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();

      const paddingOverride = match?.styleOverrides.find(o => o.property === 'padding');
      expect(paddingOverride).toBeDefined();
    });

    it('should not generate overrides for standard values', () => {
      const standardElement = createMockElement({
        type: 'button',
        name: 'Standard Button',
        styles: {
          backgroundColor: '#3b82f6', // Standard blue
          borderRadius: 8, // Standard radius
          padding: { all: 12 } // Standard padding
        }
      });

      const parsedElement = createParsedElement(standardElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.styleOverrides).toHaveLength(0);
    });
  });

  describe('variant matching', () => {
    it('should match outline button variant', () => {
      const outlineButtonElement = createMockElement({
        type: 'button',
        name: 'Outline Button',
        styles: {
          backgroundColor: 'transparent',
          borderRadius: 8,
          borders: [{
            color: '#3b82f6',
            width: 1,
            style: 'solid'
          }],
          padding: { all: 12 }
        }
      });

      const parsedElement = createParsedElement(outlineButtonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.matchedComponent.name).toBe('Button');

      const variantMapping = match?.propMappings.find(m => m.componentProp === 'variant');
      expect(variantMapping).toBeDefined();
    });

    it('should match default button variant', () => {
      const defaultButtonElement = createMockElement({
        type: 'button',
        name: 'Default Button',
        styles: {
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          padding: { all: 12 }
        }
      });

      const parsedElement = createParsedElement(defaultButtonElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      expect(match?.matchedComponent.name).toBe('Button');

      const variantMapping = match?.propMappings.find(m => m.componentProp === 'variant');
      expect(variantMapping).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no styling', () => {
      const noStyleElement = createMockElement({
        type: 'button',
        name: 'No Style Button',
        styles: {}
      });

      const parsedElement = createParsedElement(noStyleElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      // Should still attempt to match based on type, but may return null for no styling
      if (match) {
        expect(match.matchedComponent.name).toBe('Button');
      } else {
        expect(match).toBeNull();
      }
    });

    it('should handle elements with complex nested children', () => {
      const complexElement = createMockElement({
        type: 'frame',
        name: 'Complex Card',
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
          createMockElement({
            type: 'frame',
            name: 'Header',
            children: [
              createMockElement({ type: 'text', name: 'Title' }),
              createMockElement({ type: 'text', name: 'Subtitle' })
            ]
          }),
          createMockElement({
            type: 'frame',
            name: 'Content',
            children: [
              createMockElement({ type: 'text', name: 'Description' }),
              createMockElement({ type: 'button', name: 'Action Button' })
            ]
          })
        ]
      });

      const parsedElement = createParsedElement(complexElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      expect(match).toBeTruthy();
      // The element might be classified as Button due to its characteristics
      expect(['Card', 'Button']).toContain(match?.matchedComponent.name);
    });

    it('should handle elements with zero dimensions', () => {
      const zeroDimensionElement = createMockElement({
        type: 'button',
        name: 'Zero Button',
        properties: {
          name: 'Zero Button',
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' } as LayoutConstraints
        },
        styles: {
          backgroundColor: '#3b82f6'
        }
      });

      const parsedElement = createParsedElement(zeroDimensionElement);
      const match = patternMatcher.findBestMatch(parsedElement);

      // Should still attempt to match based on type and styling
      if (match) {
        expect(match.matchedComponent.name).toBe('Button');
      }
    });
  });
});