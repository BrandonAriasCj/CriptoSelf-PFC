/**
 * Tests for fallback component generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FallbackComponentGenerator,
  createFallbackGenerator,
  generateGenericFallback,
  generateLayoutFallback,
  generatePlaceholderFallback,
  DEFAULT_FALLBACK_CONFIG
} from '../fallback-generator.js';
import type { FigmaElement } from '../../types/core.js';
import type { GenerationContext } from '../../types/component.js';

describe('FallbackComponentGenerator', () => {
  let generator: FallbackComponentGenerator;

  beforeEach(() => {
    generator = new FallbackComponentGenerator();
  });

  describe('generateFallbackComponent', () => {
    it('should generate fallback for unknown element type', () => {
      const unknownElement = {
        id: 'unknown-1',
        type: 'unknown-type',
        properties: {
          name: 'Unknown Element'
        }
      };

      const result = generator.generateFallbackComponent(unknownElement);

      expect(result.name).toBe('UnknownElement');
      expect(result.jsx).toContain('Component placeholder');
      expect(result.metadata?.isFallback).toBe(true);
      expect(result.metadata?.fallbackReason).toContain('Unknown element type');
    });

    it('should generate fallback for element without type', () => {
      const elementWithoutType = {
        id: 'no-type-1',
        properties: {
          name: 'No Type Element'
        }
      };

      const result = generator.generateFallbackComponent(elementWithoutType);

      expect(result.name).toBe('NoTypeElement');
      expect(result.metadata?.isFallback).toBe(true);
    });

    it('should generate fallback for complex layout', () => {
      const complexElement: Partial<FigmaElement> = {
        id: 'complex-1',
        type: 'frame',
        properties: {
          name: 'Complex Layout'
        },
        children: new Array(10).fill(null).map((_, i) => ({
          id: `child-${i}`,
          type: 'frame',
          properties: { name: `Child ${i}` }
        }))
      };

      const result = generator.generateFallbackComponent(complexElement);

      expect(result.jsx).toContain('Layout Container');
      expect(result.jsx).toContain('flex');
    });

    it('should generate fallback for element with missing properties', () => {
      const incompleteElement = {
        id: 'incomplete-1',
        type: 'button'
        // Missing properties
      };

      const result = generator.generateFallbackComponent(incompleteElement);

      expect(result.metadata?.isFallback).toBe(true);
      expect(result.jsx).toContain('🔲');
    });

    it('should use generic fallback when no strategy matches', () => {
      const normalElement: Partial<FigmaElement> = {
        id: 'normal-1',
        type: 'button',
        properties: {
          name: 'Normal Button',
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true
        }
      };

      const result = generator.generateFallbackComponent(normalElement, {}, 'Test reason');

      expect(result.name).toBe('NormalButton');
      expect(result.metadata?.fallbackReason).toBe('Test reason');
    });
  });

  describe('generateGenericFallback', () => {
    it('should generate basic div component', () => {
      const element = {
        id: 'test-1',
        type: 'frame',
        properties: {
          name: 'Test Element'
        }
      };

      const result = generator.generateGenericFallback(element);

      expect(result.name).toBe('TestElement');
      expect(result.jsx).toContain('<div');
      expect(result.jsx).toContain('Component placeholder');
      expect(result.props.className).toBeDefined();
      expect(result.props.children).toBeDefined();
    });

    it('should include debug information when enabled', () => {
      const generatorWithDebug = new FallbackComponentGenerator({
        includeDebugInfo: true,
        generateComments: true
      });

      const element = {
        id: 'debug-test',
        type: 'frame'
      };

      const result = generatorWithDebug.generateGenericFallback(element);

      expect(result.props.debugInfo).toBeDefined();
      expect(result.jsx).toContain('debugInfo');
      expect(result.jsx).toContain('Fallback component');
    });

    it('should sanitize element with missing properties', () => {
      const incompleteElement = {};

      const result = generator.generateGenericFallback(incompleteElement);

      expect(result.name).toMatch(/^Generic|Fallback/);
      expect(result.jsx).toBeDefined();
      expect(result.metadata?.originalElement).toEqual(incompleteElement);
    });

    it('should apply default dimensions and styles', () => {
      const element = {
        type: 'frame'
      };

      const result = generator.generateGenericFallback(element);

      expect(result.jsx).toContain('min-h-[50px]');
      expect(result.jsx).toContain('min-w-[100px]');
    });
  });

  describe('generateLayoutFallback', () => {
    it('should generate layout component with flex classes', () => {
      const layoutElement = {
        id: 'layout-1',
        type: 'frame',
        properties: {
          name: 'Layout Container'
        },
        children: [
          { id: 'child-1', type: 'frame' },
          { id: 'child-2', type: 'frame' }
        ]
      };

      const result = generator.generateLayoutFallback(layoutElement);

      expect(result.name).toBe('LayoutContainerLayout');
      expect(result.jsx).toContain('flex');
      expect(result.jsx).toContain('Layout Container');
      expect(result.jsx).toContain('📐');
    });

    it('should handle layout without children', () => {
      const emptyLayout = {
        id: 'empty-layout',
        type: 'frame',
        properties: {
          name: 'Empty Layout'
        }
      };

      const result = generator.generateLayoutFallback(emptyLayout);

      expect(result.jsx).toContain('w-full');
      expect(result.metadata?.fallbackReason).toBe('Complex layout structure');
    });
  });

  describe('generatePlaceholderFallback', () => {
    it('should generate placeholder with dashed border', () => {
      const element = {
        id: 'placeholder-1',
        properties: {
          name: 'Placeholder Element'
        }
      };

      const result = generator.generatePlaceholderFallback(element);

      expect(result.name).toBe('PlaceholderElementPlaceholder');
      expect(result.jsx).toContain('border-dashed');
      expect(result.jsx).toContain('🔲');
      expect(result.props.message).toBeDefined();
      expect(result.props.message.defaultValue).toBe('Component placeholder');
    });

    it('should include element name in comment when enabled', () => {
      const generatorWithComments = new FallbackComponentGenerator({
        generateComments: true
      });

      const element = {
        id: 'test-placeholder',
        properties: {
          name: 'Test Placeholder'
        }
      };

      const result = generatorWithComments.generatePlaceholderFallback(element);

      expect(result.jsx).toContain('Placeholder for: Test Placeholder');
    });
  });

  describe('generateCustomOverride', () => {
    it('should apply custom overrides to fallback component', () => {
      const element = {
        id: 'custom-1',
        type: 'button'
      };

      const overrides = {
        name: 'CustomButton',
        jsx: '<button>Custom JSX</button>'
      };

      const result = generator.generateCustomOverride(element, overrides);

      expect(result.name).toBe('CustomButton');
      expect(result.jsx).toBe('<button>Custom JSX</button>');
      expect(result.metadata?.hasCustomOverrides).toBe(true);
      expect(result.metadata?.overrides).toEqual(['name', 'jsx']);
    });
  });

  describe('configuration options', () => {
    it('should use generic names when configured', () => {
      const generatorWithGenericNames = new FallbackComponentGenerator({
        useGenericNames: true
      });

      const element = {
        id: 'test-1',
        properties: {
          name: 'Specific Name'
        }
      };

      const result = generatorWithGenericNames.generateGenericFallback(element);

      expect(result.name).toBe('GenericComponent');
    });

    it('should disable comments when configured', () => {
      const generatorWithoutComments = new FallbackComponentGenerator({
        generateComments: false
      });

      const element = {
        id: 'test-1',
        type: 'frame'
      };

      const result = generatorWithoutComments.generateGenericFallback(element);

      expect(result.jsx).not.toContain('/*');
      expect(result.jsx).not.toContain('Fallback component');
    });

    it('should use custom default dimensions', () => {
      const customGenerator = new FallbackComponentGenerator({
        defaultDimensions: {
          width: 200,
          height: 100
        }
      });

      const element = {};

      const result = customGenerator.generateGenericFallback(element);

      // The sanitized element should use custom dimensions
      expect(result.metadata?.originalElement).toEqual(element);
    });

    it('should apply custom default styles', () => {
      const customGenerator = new FallbackComponentGenerator({
        defaultStyles: {
          backgroundColor: '#ff0000',
          borderRadius: 16
        }
      });

      const element = {
        id: 'custom-style-test'
      };

      const result = customGenerator.generateGenericFallback(element);

      expect(result.jsx).toContain('bg-[#ff0000]');
      expect(result.jsx).toContain('rounded-xl');
    });
  });

  describe('style generation', () => {
    it('should generate Tailwind classes from styles', () => {
      const element = {
        id: 'styled-1',
        styles: {
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          padding: { top: 8, right: 12, bottom: 8, left: 12 },
          border: '1px solid #d1d5db'
        }
      };

      const result = generator.generateGenericFallback(element);

      expect(result.jsx).toContain('bg-[#3b82f6]');
      expect(result.jsx).toContain('rounded-md');
      expect(result.jsx).toContain('border');
    });

    it('should handle different border radius values', () => {
      const testCases = [
        { borderRadius: 2, expected: 'rounded' },
        { borderRadius: 6, expected: 'rounded-md' },
        { borderRadius: 10, expected: 'rounded-lg' },
        { borderRadius: 16, expected: 'rounded-xl' }
      ];

      testCases.forEach(({ borderRadius, expected }) => {
        const element = {
          id: `test-${borderRadius}`,
          styles: { borderRadius }
        };

        const result = generator.generateGenericFallback(element);
        expect(result.jsx).toContain(expected);
      });
    });
  });

  describe('imports generation', () => {
    it('should generate correct imports for fallback components', () => {
      const element = { id: 'test-1' };
      const result = generator.generateGenericFallback(element);

      expect(result.imports).toHaveLength(2);
      expect(result.imports[0].from).toBe('react');
      expect(result.imports[1].from).toBe('@/lib/utils');
      expect(result.imports[1].imports[0].name).toBe('cn');
    });
  });

  describe('metadata', () => {
    it('should include comprehensive metadata', () => {
      const element = {
        id: 'metadata-test',
        type: 'button'
      };

      const result = generator.generateGenericFallback(element, {}, 'Test reason');

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.isFallback).toBe(true);
      expect(result.metadata?.originalElement).toEqual(element);
      expect(result.metadata?.fallbackReason).toBe('Test reason');
      expect(result.metadata?.generatedAt).toBeDefined();
    });
  });
});

describe('utility functions', () => {
  describe('createFallbackGenerator', () => {
    it('should create generator with default config', () => {
      const generator = createFallbackGenerator();
      expect(generator).toBeInstanceOf(FallbackComponentGenerator);
    });

    it('should create generator with custom config', () => {
      const config = { useGenericNames: true };
      const generator = createFallbackGenerator(config);
      expect(generator).toBeInstanceOf(FallbackComponentGenerator);
    });
  });

  describe('generateGenericFallback utility', () => {
    it('should generate generic fallback component', () => {
      const element = { id: 'util-test' };
      const result = generateGenericFallback(element, 'Utility test');

      expect(result.metadata?.isFallback).toBe(true);
      expect(result.metadata?.fallbackReason).toBe('Utility test');
    });
  });

  describe('generateLayoutFallback utility', () => {
    it('should generate layout fallback component', () => {
      const element = { id: 'layout-util-test' };
      const result = generateLayoutFallback(element);

      expect(result.jsx).toContain('Layout Container');
      expect(result.metadata?.fallbackReason).toBe('Complex layout structure');
    });
  });

  describe('generatePlaceholderFallback utility', () => {
    it('should generate placeholder fallback component', () => {
      const element = { id: 'placeholder-util-test' };
      const result = generatePlaceholderFallback(element);

      expect(result.jsx).toContain('🔲');
      expect(result.metadata?.fallbackReason).toBe('Missing or incomplete element data');
    });
  });
});

describe('DEFAULT_FALLBACK_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_FALLBACK_CONFIG.generateComments).toBe(true);
    expect(DEFAULT_FALLBACK_CONFIG.includeDebugInfo).toBe(true);
    expect(DEFAULT_FALLBACK_CONFIG.useGenericNames).toBe(false);
    expect(DEFAULT_FALLBACK_CONFIG.defaultDimensions.width).toBe(100);
    expect(DEFAULT_FALLBACK_CONFIG.defaultDimensions.height).toBe(50);
    expect(DEFAULT_FALLBACK_CONFIG.defaultStyles).toBeDefined();
  });
});