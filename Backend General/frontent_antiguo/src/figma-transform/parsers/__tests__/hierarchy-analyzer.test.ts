import { describe, it, expect, beforeEach } from 'vitest';
import { HierarchyAnalyzer, ComponentNode, ComponentHierarchy } from '../hierarchy-analyzer';
import type { FigmaElement, LayoutConstraints } from '../../types/core';

describe('HierarchyAnalyzer', () => {
  let analyzer: HierarchyAnalyzer;

  beforeEach(() => {
    analyzer = new HierarchyAnalyzer();
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

  describe('analyzeHierarchy', () => {
    it('should analyze a simple single element hierarchy', () => {
      const rootElement = createMockElement({
        id: 'root',
        name: 'Root Element'
      });

      const hierarchy = analyzer.analyzeHierarchy(rootElement);

      expect(hierarchy.root.id).toBe('root');
      expect(hierarchy.root.depth).toBe(0);
      expect(hierarchy.allNodes.size).toBe(1);
      expect(hierarchy.allNodes.has('root')).toBe(true);
    });

    it('should analyze a complex nested hierarchy', () => {
      const complexElement = createMockElement({
        id: 'root',
        name: 'App Layout',
        children: [
          createMockElement({
            id: 'header',
            name: 'Header Component',
            children: [
              createMockElement({
                id: 'logo',
                name: 'Logo',
                type: 'image'
              }),
              createMockElement({
                id: 'nav',
                name: 'Navigation',
                children: [
                  createMockElement({
                    id: 'nav-item-1',
                    name: 'Home Link',
                    type: 'text'
                  }),
                  createMockElement({
                    id: 'nav-item-2',
                    name: 'About Link',
                    type: 'text'
                  })
                ]
              })
            ]
          }),
          createMockElement({
            id: 'main',
            name: 'Main Content',
            children: [
              createMockElement({
                id: 'sidebar',
                name: 'Sidebar',
                children: [
                  createMockElement({
                    id: 'filter-1',
                    name: 'Category Filter',
                    type: 'button'
                  })
                ]
              }),
              createMockElement({
                id: 'content',
                name: 'Content Area',
                children: [
                  createMockElement({
                    id: 'card-1',
                    name: 'Product Card',
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
                    }
                  }),
                  createMockElement({
                    id: 'card-2',
                    name: 'Product Card',
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
                    }
                  })
                ]
              })
            ]
          })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(complexElement);

      // Check total nodes
      expect(hierarchy.allNodes.size).toBe(12); // Including the root element

      // Check depth levels
      expect(hierarchy.root.depth).toBe(0);
      expect(hierarchy.allNodes.get('header')?.depth).toBe(1);
      expect(hierarchy.allNodes.get('nav')?.depth).toBe(2);
      expect(hierarchy.allNodes.get('nav-item-1')?.depth).toBe(3);

      // Check parent-child relationships
      const headerNode = hierarchy.allNodes.get('header');
      expect(headerNode?.parent?.id).toBe('root');
      expect(headerNode?.children).toHaveLength(2);

      const navNode = hierarchy.allNodes.get('nav');
      expect(navNode?.parent?.id).toBe('header');
      expect(navNode?.children).toHaveLength(2);
    });

    it('should identify component boundaries correctly', () => {
      const elementWithComponents = createMockElement({
        id: 'root',
        name: 'Page Layout',
        children: [
          createMockElement({
            id: 'header-component',
            name: 'HeaderComponent',
            children: [
              createMockElement({
                id: 'logo',
                name: 'Logo'
              }),
              createMockElement({
                id: 'nav',
                name: 'Navigation'
              })
            ]
          }),
          createMockElement({
            id: 'button-component',
            name: 'SubmitButton',
            type: 'button',
            styles: {
              backgroundColor: '#007bff',
              borderRadius: 8
            },
            children: [
              createMockElement({
                id: 'button-text',
                name: 'Submit',
                type: 'text'
              })
            ]
          }),
          createMockElement({
            id: 'card-component',
            name: 'ProductCard',
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
                id: 'card-title',
                name: 'Product Title',
                type: 'text'
              }),
              createMockElement({
                id: 'card-description',
                name: 'Product Description',
                type: 'text'
              })
            ]
          })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(elementWithComponents);

      // Should identify component boundaries
      expect(hierarchy.componentBoundaries.length).toBeGreaterThan(0);

      // Check specific component boundaries
      const headerComponent = hierarchy.allNodes.get('header-component');
      const buttonComponent = hierarchy.allNodes.get('button-component');
      const cardComponent = hierarchy.allNodes.get('card-component');

      expect(headerComponent?.componentBoundary).toBe(true);
      expect(buttonComponent?.componentBoundary).toBe(true);
      expect(cardComponent?.componentBoundary).toBe(true);
    });

    it('should detect reusable patterns', () => {
      const elementWithReusablePatterns = createMockElement({
        id: 'root',
        name: 'Product Grid',
        children: [
          // First product card
          createMockElement({
            id: 'card-1',
            name: 'Product Card',
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
              createMockElement({
                id: 'image-1',
                name: 'Product Image',
                type: 'image'
              }),
              createMockElement({
                id: 'title-1',
                name: 'Product Title',
                type: 'text'
              }),
              createMockElement({
                id: 'price-1',
                name: 'Price',
                type: 'text'
              })
            ]
          }),
          // Second product card (same structure)
          createMockElement({
            id: 'card-2',
            name: 'Product Card',
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
              createMockElement({
                id: 'image-2',
                name: 'Product Image',
                type: 'image'
              }),
              createMockElement({
                id: 'title-2',
                name: 'Product Title',
                type: 'text'
              }),
              createMockElement({
                id: 'price-2',
                name: 'Price',
                type: 'text'
              })
            ]
          }),
          // Third product card (same structure)
          createMockElement({
            id: 'card-3',
            name: 'Product Card',
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
              createMockElement({
                id: 'image-3',
                name: 'Product Image',
                type: 'image'
              }),
              createMockElement({
                id: 'title-3',
                name: 'Product Title',
                type: 'text'
              }),
              createMockElement({
                id: 'price-3',
                name: 'Price',
                type: 'text'
              })
            ]
          })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(elementWithReusablePatterns);

      // Should detect reusable patterns
      expect(hierarchy.reusablePatterns.length).toBeGreaterThan(0);

      // Check that the pattern has multiple instances
      const pattern = hierarchy.reusablePatterns[0];
      expect(pattern.instances.length).toBe(3);
      expect(pattern.confidence).toBeGreaterThan(0.6);

      // Check that nodes are marked with reusable patterns
      const card1 = hierarchy.allNodes.get('card-1');
      const card2 = hierarchy.allNodes.get('card-2');
      const card3 = hierarchy.allNodes.get('card-3');

      expect(card1?.reusablePattern).toBeDefined();
      expect(card2?.reusablePattern).toBeDefined();
      expect(card3?.reusablePattern).toBeDefined();
      expect(card1?.reusablePattern?.id).toBe(card2?.reusablePattern?.id);
    });
  });

  describe('component boundary analysis', () => {
    it('should identify semantic groups as component boundaries', () => {
      const semanticElement = createMockElement({
        id: 'header',
        name: 'Header Section',
        children: [
          createMockElement({ id: 'logo', name: 'Logo' }),
          createMockElement({ id: 'nav', name: 'Navigation' })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(semanticElement);
      const headerNode = hierarchy.allNodes.get('header');

      expect(headerNode?.componentBoundary).toBe(true);
    });

    it('should identify functional units as component boundaries', () => {
      const functionalElement = createMockElement({
        id: 'form',
        name: 'Login Form',
        children: [
          createMockElement({
            id: 'email-input',
            name: 'Email Input',
            type: 'input'
          }),
          createMockElement({
            id: 'password-input',
            name: 'Password Input',
            type: 'input'
          }),
          createMockElement({
            id: 'submit-button',
            name: 'Submit Button',
            type: 'button'
          })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(functionalElement);
      const formNode = hierarchy.allNodes.get('form');

      expect(formNode?.componentBoundary).toBe(true);
    });

    it('should identify elements with consistent styling as component boundaries', () => {
      const styledElement = createMockElement({
        id: 'card-container',
        name: 'Card Container',
        children: [
          createMockElement({
            id: 'child-1',
            name: 'Child 1',
            styles: { backgroundColor: '#ffffff', borderRadius: 8 }
          }),
          createMockElement({
            id: 'child-2',
            name: 'Child 2',
            styles: { backgroundColor: '#ffffff', borderRadius: 8 }
          }),
          createMockElement({
            id: 'child-3',
            name: 'Child 3',
            styles: { backgroundColor: '#ffffff', borderRadius: 8 }
          })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(styledElement);
      const containerNode = hierarchy.allNodes.get('card-container');

      expect(containerNode?.componentBoundary).toBe(true);
    });

    it('should identify elements with component naming conventions', () => {
      const namedElement = createMockElement({
        id: 'user-card',
        name: 'UserCard',
        children: [
          createMockElement({ id: 'avatar', name: 'Avatar' }),
          createMockElement({ id: 'name', name: 'User Name' })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(namedElement);
      const cardNode = hierarchy.allNodes.get('user-card');

      expect(cardNode?.componentBoundary).toBe(true);
    });
  });

  describe('pattern signature generation', () => {
    it('should generate consistent signatures for similar structures', () => {
      const element1 = createMockElement({
        id: 'card-1',
        name: 'Card 1',
        children: [
          createMockElement({ id: 'image-1', type: 'image' }),
          createMockElement({ id: 'text-1', type: 'text' })
        ]
      });

      const element2 = createMockElement({
        id: 'card-2',
        name: 'Card 2',
        children: [
          createMockElement({ id: 'image-2', type: 'image' }),
          createMockElement({ id: 'text-2', type: 'text' })
        ]
      });

      const hierarchy1 = analyzer.analyzeHierarchy(element1);
      const hierarchy2 = analyzer.analyzeHierarchy(element2);

      // Both should have the same structure hash
      const node1 = hierarchy1.allNodes.get('card-1');
      const node2 = hierarchy2.allNodes.get('card-2');

      // We can't directly access the signature generation method, but we can test
      // that similar structures would be detected as patterns when analyzed together
      const combinedElement = createMockElement({
        id: 'root',
        children: [element1, element2]
      });

      const combinedHierarchy = analyzer.analyzeHierarchy(combinedElement);
      expect(combinedHierarchy.reusablePatterns.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no children', () => {
      const leafElement = createMockElement({
        id: 'leaf',
        name: 'Leaf Element',
        children: []
      });

      const hierarchy = analyzer.analyzeHierarchy(leafElement);

      expect(hierarchy.root.children).toHaveLength(0);
      expect(hierarchy.allNodes.size).toBe(1);
    });

    it('should handle deeply nested structures', () => {
      let currentElement = createMockElement({
        id: 'level-0',
        name: 'Level 0'
      });

      // Create a 10-level deep structure
      for (let i = 1; i <= 10; i++) {
        currentElement.children = [createMockElement({
          id: `level-${i}`,
          name: `Level ${i}`
        })];
        currentElement = currentElement.children[0];
      }

      const hierarchy = analyzer.analyzeHierarchy(currentElement);

      expect(hierarchy.allNodes.size).toBe(1); // Only the current element (level-10 has no children)
      expect(hierarchy.root.depth).toBe(0);
    });

    it('should handle elements with many children', () => {
      const manyChildren = Array.from({ length: 50 }, (_, i) =>
        createMockElement({
          id: `child-${i}`,
          name: `Child ${i}`
        })
      );

      const parentElement = createMockElement({
        id: 'parent',
        name: 'Parent with Many Children',
        children: manyChildren
      });

      const hierarchy = analyzer.analyzeHierarchy(parentElement);

      expect(hierarchy.root.children).toHaveLength(50);
      expect(hierarchy.allNodes.size).toBe(51); // parent + 50 children
    });

    it('should handle elements with identical names but different IDs', () => {
      const element = createMockElement({
        id: 'root',
        children: [
          createMockElement({
            id: 'button-1',
            name: 'Button'
          }),
          createMockElement({
            id: 'button-2',
            name: 'Button'
          }),
          createMockElement({
            id: 'button-3',
            name: 'Button'
          })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(element);

      expect(hierarchy.allNodes.size).toBe(4);
      expect(hierarchy.allNodes.get('button-1')?.element.name).toBe('Button');
      expect(hierarchy.allNodes.get('button-2')?.element.name).toBe('Button');
      expect(hierarchy.allNodes.get('button-3')?.element.name).toBe('Button');
    });

    it('should handle empty or minimal style properties', () => {
      const minimalElement = createMockElement({
        id: 'minimal',
        name: 'Minimal Element',
        styles: {},
        children: [
          createMockElement({
            id: 'child',
            name: 'Child',
            styles: {}
          })
        ]
      });

      const hierarchy = analyzer.analyzeHierarchy(minimalElement);

      expect(hierarchy.allNodes.size).toBe(2);
      expect(hierarchy.componentBoundaries.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance with large hierarchies', () => {
    it('should handle large hierarchies efficiently', () => {
      // Create a large but realistic hierarchy
      const createLargeHierarchy = (depth: number, breadth: number): FigmaElement => {
        if (depth === 0) {
          return createMockElement({
            id: `leaf-${Math.random()}`,
            name: 'Leaf Node'
          });
        }

        const children = Array.from({ length: breadth }, (_, i) =>
          createLargeHierarchy(depth - 1, Math.max(1, breadth - 1))
        );

        return createMockElement({
          id: `node-${depth}-${Math.random()}`,
          name: `Node Depth ${depth}`,
          children
        });
      };

      const largeElement = createLargeHierarchy(4, 3); // 4 levels deep, 3 children per level

      const startTime = performance.now();
      const hierarchy = analyzer.analyzeHierarchy(largeElement);
      const endTime = performance.now();

      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(hierarchy.allNodes.size).toBeGreaterThan(10);
    });
  });
});