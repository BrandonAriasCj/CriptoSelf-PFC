/**
 * Tests for SemanticHtmlGenerator
 */

import { SemanticHtmlGenerator } from '../semantic-html-generator';
import { FigmaElement } from '../../types/core';

describe('SemanticHtmlGenerator', () => {
  let generator: SemanticHtmlGenerator;

  beforeEach(() => {
    generator = new SemanticHtmlGenerator();
  });

  describe('generateSemanticElement', () => {
    it('should map header elements correctly', () => {
      const headerElement: FigmaElement = {
        id: 'header-1',
        type: 'frame',
        name: 'header-section',
        properties: {
          name: 'header-section',
          width: 1200,
          height: 80,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(headerElement);
      expect(semanticElement).toBe('header');
    });

    it('should map navigation elements correctly', () => {
      const navElement: FigmaElement = {
        id: 'nav-1',
        type: 'frame',
        name: 'navigation-menu',
        properties: {
          name: 'navigation-menu',
          width: 800,
          height: 60,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(navElement);
      expect(semanticElement).toBe('nav');
    });

    it('should map main content elements correctly', () => {
      const mainElement: FigmaElement = {
        id: 'main-1',
        type: 'frame',
        name: 'main-content',
        properties: {
          name: 'main-content',
          width: 1000,
          height: 600,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(mainElement);
      expect(semanticElement).toBe('main');
    });

    it('should map footer elements correctly', () => {
      const footerElement: FigmaElement = {
        id: 'footer-1',
        type: 'frame',
        name: 'footer-section',
        properties: {
          name: 'footer-section',
          width: 1200,
          height: 120,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(footerElement);
      expect(semanticElement).toBe('footer');
    });

    it('should map aside elements correctly', () => {
      const asideElement: FigmaElement = {
        id: 'aside-1',
        type: 'frame',
        name: 'sidebar-content',
        properties: {
          name: 'sidebar-content',
          width: 300,
          height: 500,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(asideElement);
      expect(semanticElement).toBe('aside');
    });

    it('should map section elements correctly', () => {
      const sectionElement: FigmaElement = {
        id: 'section-1',
        type: 'frame',
        name: 'section-content',
        properties: {
          name: 'section-content',
          width: 800,
          height: 400,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {},
        children: [
          {
            id: 'child-1',
            type: 'text',
            name: 'section-text',
            properties: {
              name: 'section-text',
              width: 200,
              height: 30,
              x: 0,
              y: 0,
              visible: true,
              constraints: { horizontal: 'LEFT', vertical: 'TOP' }
            },
            styles: {}
          }
        ]
      };

      const semanticElement = generator.generateSemanticElement(sectionElement);
      expect(semanticElement).toBe('section');
    });

    it('should fallback to div for unknown elements', () => {
      const unknownElement: FigmaElement = {
        id: 'unknown-1',
        type: 'frame',
        name: 'random-element',
        properties: {
          name: 'random-element',
          width: 200,
          height: 100,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(unknownElement);
      expect(semanticElement).toBe('div');
    });
  });

  describe('generateHeadingHierarchy', () => {
    it('should generate proper heading hierarchy', () => {
      const elements: FigmaElement[] = [
        {
          id: 'h1-1',
          type: 'text',
          name: 'main-title',
          properties: {
            name: 'main-title',
            width: 400,
            height: 50,
            x: 0,
            y: 0,
            visible: true,
            constraints: { horizontal: 'LEFT', vertical: 'TOP' }
          },
          styles: {
            typography: {
              fontSize: 32,
              fontWeight: 700
            }
          }
        },
        {
          id: 'h2-1',
          type: 'text',
          name: 'section-heading',
          properties: {
            name: 'section-heading',
            width: 300,
            height: 40,
            x: 0,
            y: 0,
            visible: true,
            constraints: { horizontal: 'LEFT', vertical: 'TOP' }
          },
          styles: {
            typography: {
              fontSize: 24,
              fontWeight: 600
            }
          }
        },
        {
          id: 'h3-1',
          type: 'text',
          name: 'subsection-heading',
          properties: {
            name: 'subsection-heading',
            width: 250,
            height: 30,
            x: 0,
            y: 0,
            visible: true,
            constraints: { horizontal: 'LEFT', vertical: 'TOP' }
          },
          styles: {
            typography: {
              fontSize: 20,
              fontWeight: 500
            }
          }
        }
      ];

      const headingMap = generator.generateHeadingHierarchy(elements);

      expect(headingMap.get('h1-1')).toBe(1);
      expect(headingMap.get('h2-1')).toBe(2);
      expect(headingMap.get('h3-1')).toBe(3);
    });

    it('should handle explicit heading levels in names', () => {
      const elements: FigmaElement[] = [
        {
          id: 'explicit-h1',
          type: 'text',
          name: 'h1-main-title',
          properties: {
            name: 'h1-main-title',
            width: 400,
            height: 50,
            x: 0,
            y: 0,
            visible: true,
            constraints: { horizontal: 'LEFT', vertical: 'TOP' }
          },
          styles: {}
        },
        {
          id: 'explicit-h3',
          type: 'text',
          name: 'h3-subtitle',
          properties: {
            name: 'h3-subtitle',
            width: 300,
            height: 30,
            x: 0,
            y: 0,
            visible: true,
            constraints: { horizontal: 'LEFT', vertical: 'TOP' }
          },
          styles: {}
        }
      ];

      const headingMap = generator.generateHeadingHierarchy(elements);

      expect(headingMap.get('explicit-h1')).toBe(1);
      expect(headingMap.get('explicit-h3')).toBe(3);
    });
  });

  describe('generateSemanticStructure', () => {
    it('should generate complete semantic structure with landmarks', () => {
      const pageElement: FigmaElement = {
        id: 'page-1',
        type: 'frame',
        name: 'page-wrapper',
        properties: {
          name: 'page-wrapper',
          width: 1200,
          height: 800,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {},
        children: [
          {
            id: 'header-1',
            type: 'frame',
            name: 'header-section',
            properties: {
              name: 'header-section',
              width: 1200,
              height: 80,
              x: 0,
              y: 0,
              visible: true,
              constraints: { horizontal: 'LEFT', vertical: 'TOP' }
            },
            styles: {}
          },
          {
            id: 'main-1',
            type: 'frame',
            name: 'main-content',
            properties: {
              name: 'main-content',
              width: 1000,
              height: 600,
              x: 0,
              y: 80,
              visible: true,
              constraints: { horizontal: 'LEFT', vertical: 'TOP' }
            },
            styles: {}
          }
        ]
      };

      const structure = generator.generateSemanticStructure(pageElement);

      expect(structure.element).toBe('section'); // Page wrapper with children becomes section
      expect(structure.children).toHaveLength(2);
      expect(structure.children![0].element).toBe('header');
      expect(structure.children![0].isLandmark).toBe(true);
      expect(structure.children![0].role).toBe('banner');
      expect(structure.children![1].element).toBe('main');
      expect(structure.children![1].isLandmark).toBe(true);
      expect(structure.children![1].role).toBe('main');
    });

    it('should handle heading elements with proper levels', () => {
      const headingElement: FigmaElement = {
        id: 'heading-1',
        type: 'text',
        name: 'title-text',
        properties: {
          name: 'title-text',
          width: 400,
          height: 50,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {
          typography: {
            fontSize: 32,
            fontWeight: 700
          }
        }
      };

      const structure = generator.generateSemanticStructure(headingElement);

      expect(structure.element).toBe('h1');
      expect(structure.headingLevel).toBe(1);
      expect(structure.isLandmark).toBe(false);
    });
  });

  describe('generateLandmarkRegions', () => {
    it('should collect all landmark regions from element tree', () => {
      const pageElement: FigmaElement = {
        id: 'page-1',
        type: 'frame',
        name: 'page-wrapper',
        properties: {
          name: 'page-wrapper',
          width: 1200,
          height: 800,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {},
        children: [
          {
            id: 'header-1',
            type: 'frame',
            name: 'header-section',
            properties: {
              name: 'header-section',
              width: 1200,
              height: 80,
              x: 0,
              y: 0,
              visible: true,
              constraints: { horizontal: 'LEFT', vertical: 'TOP' }
            },
            styles: {},
            children: [
              {
                id: 'nav-1',
                type: 'frame',
                name: 'navigation-menu',
                properties: {
                  name: 'navigation-menu',
                  width: 800,
                  height: 60,
                  x: 0,
                  y: 0,
                  visible: true,
                  constraints: { horizontal: 'LEFT', vertical: 'TOP' }
                },
                styles: {}
              }
            ]
          },
          {
            id: 'main-1',
            type: 'frame',
            name: 'main-content',
            properties: {
              name: 'main-content',
              width: 1000,
              height: 600,
              x: 0,
              y: 80,
              visible: true,
              constraints: { horizontal: 'LEFT', vertical: 'TOP' }
            },
            styles: {}
          },
          {
            id: 'footer-1',
            type: 'frame',
            name: 'footer-section',
            properties: {
              name: 'footer-section',
              width: 1200,
              height: 120,
              x: 0,
              y: 680,
              visible: true,
              constraints: { horizontal: 'LEFT', vertical: 'TOP' }
            },
            styles: {}
          }
        ]
      };

      const landmarks = generator.generateLandmarkRegions(pageElement);

      expect(landmarks).toContain('banner');
      expect(landmarks).toContain('navigation');
      expect(landmarks).toContain('main');
      expect(landmarks).toContain('contentinfo');
      expect(landmarks).toHaveLength(4);
    });
  });

  describe('text element semantic mapping', () => {
    it('should map text elements to paragraphs by default', () => {
      const textElement: FigmaElement = {
        id: 'text-1',
        type: 'text',
        name: 'paragraph-text',
        properties: {
          name: 'paragraph-text',
          width: 400,
          height: 20,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(textElement);
      expect(semanticElement).toBe('p');
    });

    it('should map strong text elements correctly', () => {
      const strongElement: FigmaElement = {
        id: 'strong-1',
        type: 'text',
        name: 'strong-text',
        properties: {
          name: 'strong-text',
          width: 200,
          height: 20,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(strongElement);
      expect(semanticElement).toBe('strong');
    });

    it('should map emphasis text elements correctly', () => {
      const emElement: FigmaElement = {
        id: 'em-1',
        type: 'text',
        name: 'italic-text',
        properties: {
          name: 'italic-text',
          width: 200,
          height: 20,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(emElement);
      expect(semanticElement).toBe('em');
    });
  });

  describe('list element mapping', () => {
    it('should map list elements correctly', () => {
      const listElement: FigmaElement = {
        id: 'list-1',
        type: 'frame',
        name: 'list-container',
        properties: {
          name: 'list-container',
          width: 300,
          height: 200,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {},
        children: [
          {
            id: 'item-1',
            type: 'frame',
            name: 'list-item',
            properties: {
              name: 'list-item',
              width: 300,
              height: 40,
              x: 0,
              y: 0,
              visible: true,
              constraints: { horizontal: 'LEFT', vertical: 'TOP' }
            },
            styles: {}
          }
        ]
      };

      const semanticElement = generator.generateSemanticElement(listElement);
      expect(semanticElement).toBe('ul');
    });

    it('should map list item elements correctly with parent constraint', () => {
      const listItemElement: FigmaElement = {
        id: 'item-1',
        type: 'frame',
        name: 'list-item',
        properties: {
          name: 'list-item',
          width: 300,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(listItemElement, 'ul');
      expect(semanticElement).toBe('li');
    });

    it('should not map list item without proper parent', () => {
      const listItemElement: FigmaElement = {
        id: 'item-1',
        type: 'frame',
        name: 'list-item',
        properties: {
          name: 'list-item',
          width: 300,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const semanticElement = generator.generateSemanticElement(listItemElement, 'div');
      expect(semanticElement).toBe('div'); // Fallback since parent is not ul/ol
    });
  });
});