/**
 * Comprehensive error handling tests for malformed Figma input data,
 * fallback component generation edge cases, and error recovery scenarios
 * 
 * Requirements: 6.1, 6.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  FigmaElementErrorHandler, 
  ERROR_CODES 
} from '../error-handler.js';
import { 
  FallbackComponentGenerator,
  DEFAULT_FALLBACK_CONFIG 
} from '../fallback-generator.js';
import { 
  ErrorRecoverySystem,
  type ErrorRecoveryConfig 
} from '../error-recovery-system.js';
import type { ValidationError } from '../../types/validation.js';
import type { FigmaElement } from '../../types/core.js';
import type { GenerationContext } from '../../types/component.js';

// Mock console to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Handling with Malformed Figma Input Data', () => {
  let errorHandler: FigmaElementErrorHandler;

  beforeEach(() => {
    errorHandler = new FigmaElementErrorHandler();
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe('Completely malformed input data', () => {
    it('should handle null input gracefully', () => {
      const result = errorHandler.validateElement(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
      expect(result.errors[0].message).toContain('null or undefined');
    });

    it('should handle undefined input gracefully', () => {
      const result = errorHandler.validateElement(undefined);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
    });

    it('should handle empty object input', () => {
      const result = errorHandler.validateElement({});

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2); // Missing id and type
      expect(result.errors.some(e => e.property === 'id')).toBe(true);
      expect(result.errors.some(e => e.property === 'type')).toBe(true);
    });

    it('should handle non-object input', () => {
      const testCases = [
        'string',
        123,
        true,
        [],
        () => {}
      ];

      testCases.forEach(input => {
        const result = errorHandler.validateElement(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle circular JSON structures', () => {
      const circularElement: any = {
        id: 'circular-1',
        type: 'frame'
      };
      circularElement.self = circularElement;

      // Should not throw an error, but should detect issues
      expect(() => errorHandler.validateElement(circularElement)).not.toThrow();
    });
  });

  describe('Malformed properties', () => {
    it('should handle properties as non-object', () => {
      const malformedElement = {
        id: 'test-1',
        type: 'button',
        properties: 'not-an-object'
      };

      const result = errorHandler.validateElement(malformedElement);
      expect(result.isValid).toBe(false);
    });

    it('should handle properties with wrong data types', () => {
      const malformedElement = {
        id: 'test-1',
        type: 'button',
        properties: {
          name: 123, // Should be string
          width: 'not-a-number', // Should be number
          height: null, // Should be number
          visible: 'yes' // Should be boolean
        }
      };

      const result = errorHandler.validateElement(malformedElement);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_PROPERTY_TYPE)).toBe(true);
    });

    it('should handle extremely large dimension values', () => {
      const elementWithLargeDimensions = {
        id: 'large-1',
        type: 'frame',
        properties: {
          width: Number.MAX_SAFE_INTEGER,
          height: Number.MAX_SAFE_INTEGER,
          x: Number.POSITIVE_INFINITY,
          y: Number.NEGATIVE_INFINITY
        }
      };

      const result = errorHandler.validateElement(elementWithLargeDimensions);
      // Should handle without crashing
      expect(result).toBeDefined();
    });

    it('should handle NaN dimension values', () => {
      const elementWithNaN = {
        id: 'nan-1',
        type: 'frame',
        properties: {
          width: NaN,
          height: NaN,
          x: NaN,
          y: NaN
        }
      };

      const result = errorHandler.validateElement(elementWithNaN);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed styles', () => {
    it('should handle styles as non-object', () => {
      const malformedElement = {
        id: 'test-1',
        type: 'button',
        styles: 'not-an-object'
      };

      const result = errorHandler.validateElement(malformedElement);
      // Should not crash, may generate warnings
      expect(result).toBeDefined();
    });

    it('should handle invalid color formats', () => {
      const invalidColorFormats = [
        '#gggggg', // Invalid hex
        'rgb(300, 300, 300)', // Out of range RGB
        'rgba(255, 255, 255)', // Missing alpha
        'hsl(invalid)', // Invalid HSL
        123, // Number instead of string
        null, // Null color
        undefined, // Undefined color
        {}, // Object instead of string
        [] // Array instead of string
      ];

      invalidColorFormats.forEach(color => {
        const element = {
          id: 'color-test',
          type: 'button',
          styles: {
            backgroundColor: color
          }
        };

        const result = errorHandler.validateElement(element);
        // Should handle gracefully, may produce warnings
        expect(result).toBeDefined();
      });
    });

    it('should handle malformed padding/margin objects', () => {
      const malformedPadding = [
        'not-an-object',
        { top: 'invalid' },
        { left: null, right: undefined },
        { top: NaN, bottom: Infinity },
        []
      ];

      malformedPadding.forEach(padding => {
        const element = {
          id: 'padding-test',
          type: 'button',
          styles: {
            padding: padding
          }
        };

        const result = errorHandler.validateElement(element);
        expect(result).toBeDefined();
      });
    });

    it('should handle invalid border radius values', () => {
      const invalidBorderRadius = [
        'not-a-number',
        -10, // Negative value
        NaN,
        Infinity,
        null,
        {},
        []
      ];

      invalidBorderRadius.forEach(borderRadius => {
        const element = {
          id: 'border-test',
          type: 'button',
          styles: {
            borderRadius: borderRadius
          }
        };

        const result = errorHandler.validateElement(element);
        if (typeof borderRadius === 'number' && borderRadius < 0) {
          expect(result.warnings.some(w => w.code === ERROR_CODES.MALFORMED_STYLES)).toBe(true);
        }
      });
    });
  });

  describe('Malformed children structures', () => {
    it('should handle children as non-array', () => {
      const malformedElement = {
        id: 'test-1',
        type: 'frame',
        children: 'not-an-array'
      };

      const result = errorHandler.validateElement(malformedElement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_PROPERTY_TYPE)).toBe(true);
    });

    it('should handle deeply nested circular references', () => {
      const parent: any = {
        id: 'parent',
        type: 'frame',
        children: []
      };

      const child1: any = {
        id: 'child1',
        type: 'frame',
        children: []
      };

      const child2: any = {
        id: 'child2',
        type: 'frame',
        children: []
      };

      // Create circular reference: parent -> child1 -> child2 -> parent
      parent.children = [child1];
      child1.children = [child2];
      child2.children = [parent];

      const result = errorHandler.validateElement(parent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.CIRCULAR_REFERENCE)).toBe(true);
    });

    it('should handle children with malformed structure', () => {
      const elementWithBadChildren = {
        id: 'parent',
        type: 'frame',
        children: [
          null, // Null child
          undefined, // Undefined child
          'string-child', // String instead of object
          123, // Number instead of object
          { /* missing id and type */ }, // Incomplete child
          {
            id: 'valid-child',
            type: 'button'
          }
        ]
      };

      const result = errorHandler.validateElement(elementWithBadChildren);
      // Should handle gracefully without crashing
      expect(result).toBeDefined();
    });

    it('should handle extremely deep nesting', () => {
      // Create deeply nested structure
      let deepElement: any = {
        id: 'deep-0',
        type: 'frame',
        children: []
      };

      let current = deepElement;
      for (let i = 1; i < 100; i++) {
        const child = {
          id: `deep-${i}`,
          type: 'frame',
          children: []
        };
        current.children = [child];
        current = child;
      }

      // Should handle without stack overflow
      expect(() => errorHandler.validateElement(deepElement)).not.toThrow();
    });
  });

  describe('Corrupted element data', () => {
    it('should handle elements with prototype pollution attempts', () => {
      const maliciousElement = {
        id: 'malicious',
        type: 'button',
        '__proto__': { malicious: true },
        'constructor': { prototype: { polluted: true } }
      };

      const result = errorHandler.validateElement(maliciousElement);
      // Should handle safely
      expect(result).toBeDefined();
    });

    it('should handle elements with symbol properties', () => {
      const symbolKey = Symbol('test');
      const elementWithSymbols: any = {
        id: 'symbol-test',
        type: 'button',
        [symbolKey]: 'symbol-value'
      };

      const result = errorHandler.validateElement(elementWithSymbols);
      expect(result).toBeDefined();
    });

    it('should handle elements with getter/setter properties', () => {
      const elementWithGetters = {
        id: 'getter-test',
        type: 'button',
        get dynamicProperty() {
          throw new Error('Getter error');
        },
        set dynamicProperty(value) {
          throw new Error('Setter error');
        }
      };

      // Should not crash when accessing properties
      expect(() => errorHandler.validateElement(elementWithGetters)).not.toThrow();
    });
  });

  describe('Memory and performance edge cases', () => {
    it('should handle very large element objects', () => {
      const largeElement = {
        id: 'large-element',
        type: 'frame',
        properties: {
          name: 'A'.repeat(10000), // Very long name
          metadata: new Array(1000).fill('data').join('')
        },
        styles: {},
        children: new Array(100).fill(null).map((_, i) => ({
          id: `child-${i}`,
          type: 'frame',
          properties: {
            name: `Child ${i}`.repeat(100)
          }
        }))
      };

      const startTime = Date.now();
      const result = errorHandler.validateElement(largeElement);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle elements with many properties', () => {
      const elementWithManyProps: any = {
        id: 'many-props',
        type: 'frame'
      };

      // Add 1000 properties
      for (let i = 0; i < 1000; i++) {
        elementWithManyProps[`prop${i}`] = `value${i}`;
      }

      const result = errorHandler.validateElement(elementWithManyProps);
      expect(result).toBeDefined();
    });
  });
});

describe('Fallback Component Generation Edge Cases', () => {
  let fallbackGenerator: FallbackComponentGenerator;

  beforeEach(() => {
    fallbackGenerator = new FallbackComponentGenerator({
      generateComments: false, // Disable for cleaner test output
      includeDebugInfo: false
    });
  });

  describe('Extreme malformed input handling', () => {
    it('should generate fallback for completely empty input', () => {
      const result = fallbackGenerator.generateFallbackComponent({} as any);

      expect(result.name).toBeDefined();
      expect(result.jsx).toBeDefined();
      expect(result.jsx).toContain('Component placeholder');
    });

    it('should generate fallback for null input', () => {
      const result = fallbackGenerator.generateFallbackComponent(null as any);

      expect(result.name).toBeDefined();
      expect(result.jsx).toBeDefined();
      expect(result.jsx).toContain('Component placeholder');
    });

    it('should generate fallback for input with only invalid properties', () => {
      const invalidElement = {
        invalidProp1: 'test',
        invalidProp2: 123,
        invalidProp3: null
      } as any;

      const result = fallbackGenerator.generateFallbackComponent(invalidElement);

      expect(result.name).toBeDefined();
      expect(result.jsx).toContain('Component placeholder');
    });
  });

  describe('Complex layout fallback scenarios', () => {
    it('should handle elements with circular reference in children', () => {
      const circularElement: any = {
        id: 'circular',
        type: 'frame',
        properties: { name: 'Circular Element' },
        children: []
      };
      circularElement.children = [circularElement]; // Self-reference

      const result = fallbackGenerator.generateLayoutFallback(circularElement);

      expect(result.name).toBe('CircularElementLayout');
      expect(result.jsx).toContain('Layout Container');
    });

    it('should handle elements with extremely deep nesting', () => {
      let deepElement: any = {
        id: 'deep-root',
        type: 'frame',
        properties: { name: 'Deep Root' },
        children: []
      };

      let current = deepElement;
      for (let i = 0; i < 50; i++) {
        const child = {
          id: `deep-child-${i}`,
          type: 'frame',
          properties: { name: `Deep Child ${i}` },
          children: []
        };
        current.children = [child];
        current = child;
      }

      const result = fallbackGenerator.generateLayoutFallback(deepElement);

      expect(result.jsx).toContain('flex');
    });

    it('should handle elements with mixed valid and invalid children', () => {
      const mixedElement = {
        id: 'mixed-parent',
        type: 'frame',
        properties: { name: 'Mixed Parent' },
        children: [
          { id: 'valid-1', type: 'button', properties: { name: 'Valid Button' } },
          null, // Invalid child
          { /* missing required properties */ },
          { id: 'valid-2', type: 'input', properties: { name: 'Valid Input' } },
          'invalid-string-child' // Invalid child
        ]
      };

      const result = fallbackGenerator.generateLayoutFallback(mixedElement as any);

      expect(result.jsx).toContain('Layout Container');
    });
  });

  describe('Style handling edge cases', () => {
    it('should handle elements with malformed style objects', () => {
      const elementWithBadStyles = {
        id: 'bad-styles',
        type: 'button',
        properties: { name: 'Bad Styles' },
        styles: {
          backgroundColor: { invalid: 'object' }, // Should be string
          borderRadius: 'not-a-number', // Should be number
          padding: 'invalid-padding', // Should be object
          margin: null, // Null value
          fontSize: undefined, // Undefined value
          fontFamily: [], // Array instead of string
          boxShadow: 123 // Number instead of string
        }
      };

      const result = fallbackGenerator.generateGenericFallback(elementWithBadStyles as any);

      expect(result.jsx).toBeDefined();
      expect(result.jsx).toContain('min-h-[50px]'); // Should apply default classes
    });

    it('should handle elements with extreme style values', () => {
      const elementWithExtremeStyles = {
        id: 'extreme-styles',
        type: 'button',
        properties: { name: 'Extreme Styles' },
        styles: {
          backgroundColor: '#'.repeat(1000), // Extremely long color
          borderRadius: Number.MAX_SAFE_INTEGER, // Huge border radius
          padding: {
            top: -1000,
            right: Number.POSITIVE_INFINITY,
            bottom: NaN,
            left: Number.NEGATIVE_INFINITY
          }
        }
      };

      const result = fallbackGenerator.generateGenericFallback(elementWithExtremeStyles as any);

      expect(result.jsx).toBeDefined();
    });
  });

  describe('Naming edge cases', () => {
    it('should handle elements with extremely long names', () => {
      const longNameElement = {
        id: 'long-name',
        type: 'button' as const,
        properties: {
          name: 'A'.repeat(1000), // 1000 character name
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT' as const, vertical: 'TOP' as const }
        }
      };

      const result = fallbackGenerator.generateGenericFallback(longNameElement);

      expect(result.name).toBeDefined();
      expect(result.name.length).toBeLessThan(200); // Should be truncated/sanitized
    });

    it('should handle elements with special characters in names', () => {
      const specialCharElement = {
        id: 'special-chars',
        type: 'button' as const,
        properties: {
          name: '!@#$%^&*()[]{}|\\:";\'<>?,./',
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT' as const, vertical: 'TOP' as const }
        }
      };

      const result = fallbackGenerator.generateGenericFallback(specialCharElement);

      expect(result.name).toBeDefined();
      expect(result.name).toMatch(/^[A-Za-z][A-Za-z0-9]*$/); // Should be valid component name
    });

    it('should handle elements with unicode characters in names', () => {
      const unicodeElement = {
        id: 'unicode',
        type: 'button' as const,
        properties: {
          name: '测试按钮 🚀 émojis',
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT' as const, vertical: 'TOP' as const }
        }
      };

      const result = fallbackGenerator.generateGenericFallback(unicodeElement);

      expect(result.name).toBeDefined();
      expect(result.name).toMatch(/^[A-Za-z][A-Za-z0-9]*$/); // Should be sanitized to valid name
    });

    it('should handle elements with empty or whitespace-only names', () => {
      const emptyNameCases = [
        '',
        '   ',
        '\n\t\r',
        null,
        undefined
      ];

      emptyNameCases.forEach(name => {
        const element = {
          id: 'empty-name-test',
          type: 'button' as const,
          properties: {
            name: name,
            width: 100,
            height: 40,
            x: 0,
            y: 0,
            visible: true,
            constraints: { horizontal: 'LEFT' as const, vertical: 'TOP' as const }
          }
        };

        const result = fallbackGenerator.generateGenericFallback(element as any);

        expect(result.name).toBeDefined();
        expect(result.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Configuration edge cases', () => {
    it('should handle invalid fallback configuration gracefully', () => {
      const invalidConfig = {
        generateComments: 'not-a-boolean',
        includeDebugInfo: null,
        useGenericNames: undefined,
        defaultDimensions: 'invalid',
        defaultStyles: null
      };

      // Should not crash when creating generator with invalid config
      expect(() => new FallbackComponentGenerator(invalidConfig as any)).not.toThrow();
    });

    it('should handle missing default styles gracefully', () => {
      const configWithoutStyles = {
        defaultStyles: undefined
      };

      const generator = new FallbackComponentGenerator(configWithoutStyles as any);
      const result = generator.generateGenericFallback({ id: 'test' });

      expect(result.jsx).toBeDefined();
    });
  });

  describe('JSX generation edge cases', () => {
    it('should handle elements that would generate invalid JSX', () => {
      const problematicElement = {
        id: 'jsx-problem',
        type: 'button' as const,
        properties: {
          name: '<script>alert("xss")</script>', // Potential XSS
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT' as const, vertical: 'TOP' as const }
        },
        styles: {
          backgroundColor: 'javascript:alert("xss")' // Malicious CSS
        }
      };

      const result = fallbackGenerator.generateGenericFallback(problematicElement);

      expect(result.jsx).toBeDefined();
      expect(result.jsx).not.toContain('<script>');
      expect(result.jsx).not.toContain('javascript:');
    });

    it('should handle elements with properties that break JSX syntax', () => {
      const jsxBreakingElement = {
        id: 'jsx-breaking',
        type: 'button' as const,
        properties: {
          name: 'Button with "quotes" and \'apostrophes\' and {braces}',
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT' as const, vertical: 'TOP' as const }
        }
      };

      const result = fallbackGenerator.generateGenericFallback(jsxBreakingElement);

      expect(result.jsx).toBeDefined();
      // Should not contain unescaped quotes that would break JSX
      expect(() => eval(`(${result.jsx})`)).not.toThrow();
    });
  });
});

describe('Error Recovery Scenarios', () => {
  let recoverySystem: ErrorRecoverySystem;

  beforeEach(() => {
    recoverySystem = new ErrorRecoverySystem({
      logRecoveryAttempts: false,
      maxRecoveryAttempts: 5
    });
  });

  describe('Partial generation failures', () => {
    it('should recover when some elements succeed and others fail', async () => {
      const mixedElements = [
        { id: 'valid-1', type: 'button', properties: { name: 'Valid' } },
        null, // Will cause error
        { id: 'recoverable', /* missing type */ },
        { id: 'valid-2', type: 'input', properties: { name: 'Also Valid' } },
        { /* completely invalid */ }
      ];

      const result = await recoverySystem.processElementsWithRecovery(mixedElements);

      expect(result.summary.totalElements).toBe(5);
      expect(result.successful.length).toBeGreaterThan(0);
      expect(result.summary.successfulRecoveries + result.summary.failedRecoveries).toBe(5);
    });

    it('should handle cascading failures gracefully', async () => {
      // Create elements that depend on each other in a way that could cause cascading failures
      const dependentElements = [
        { id: 'parent', type: 'frame', children: ['child1', 'child2'] }, // Invalid children references
        { id: 'child1', type: 'button', parent: 'invalid-parent' },
        { id: 'child2', type: 'input', parent: 'parent' }
      ];

      const result = await recoverySystem.processElementsWithRecovery(dependentElements);

      expect(result.summary.totalElements).toBe(3);
      // Should handle each element independently without cascading failures
      expect(result.successful.length + result.failed.length).toBe(3);
    });

    it('should recover from memory-intensive operations', async () => {
      // Create an element that might cause memory issues during processing
      const memoryIntensiveElement = {
        id: 'memory-test',
        type: 'frame',
        properties: {
          name: 'Memory Test',
          metadata: new Array(10000).fill('data').join('') // Large metadata
        },
        children: new Array(1000).fill(null).map((_, i) => ({
          id: `child-${i}`,
          type: 'frame',
          properties: {
            name: `Child ${i}`,
            data: new Array(100).fill(`data-${i}`).join('')
          }
        }))
      };

      const startMemory = process.memoryUsage().heapUsed;
      const result = await recoverySystem.validateAndRecover(memoryIntensiveElement);
      const endMemory = process.memoryUsage().heapUsed;

      expect(result).toBeDefined();
      // Memory usage should not grow excessively (less than 100MB increase)
      expect(endMemory - startMemory).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Recovery attempt limits', () => {
    it('should respect maximum recovery attempts', async () => {
      const limitedRecoverySystem = new ErrorRecoverySystem({
        maxRecoveryAttempts: 2,
        logRecoveryAttempts: false
      });

      // Create an element with multiple recoverable errors
      const multiErrorElement = {
        // Missing id and type (2 errors)
        properties: {
          width: -10, // Invalid dimension (warning)
          height: 0 // Invalid dimension (warning)
        },
        styles: {
          backgroundColor: 'invalid-color' // Invalid color (warning)
        }
      };

      const result = await limitedRecoverySystem.validateAndRecover(multiErrorElement);

      expect(result.recoveryAttempts).toBeLessThanOrEqual(2);
    });

    it('should handle infinite recovery loops', async () => {
      // Create a scenario that could potentially cause infinite recovery attempts
      const problematicElement = {
        id: 'loop-test',
        type: 'frame',
        properties: {
          name: 'Loop Test'
        }
      };

      // Mock the error handler to always return the same error
      const mockErrorHandler = {
        validateElement: vi.fn().mockReturnValue({
          isValid: false,
          errors: [{
            code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
            message: 'Persistent error',
            severity: 'error'
          }],
          warnings: []
        }),
        handleValidationError: vi.fn().mockReturnValue({
          success: false // Always fail recovery
        })
      };

      const systemWithMockHandler = new ErrorRecoverySystem({
        maxRecoveryAttempts: 3,
        logRecoveryAttempts: false
      });

      // Replace the internal error handler (this is a test-only scenario)
      (systemWithMockHandler as any).errorHandler = mockErrorHandler;

      const result = await systemWithMockHandler.validateAndRecover(problematicElement);

      expect(result.recoveryAttempts).toBe(3); // Should stop at max attempts
      expect(mockErrorHandler.validateElement).toHaveBeenCalled();
    });
  });

  describe('Fallback generation under stress', () => {
    it('should generate fallbacks for batch processing failures', async () => {
      const batchElements = new Array(100).fill(null).map((_, i) => ({
        id: `batch-${i}`,
        type: i % 2 === 0 ? 'button' : ('unknown-type' as any), // Mix valid and invalid types
        properties: {
          name: `Batch Element ${i}`,
          width: i % 3 === 0 ? -10 : 100 // Some invalid dimensions
        }
      }));

      const result = await recoverySystem.processElementsWithRecovery(batchElements);

      expect(result.summary.totalElements).toBe(100);
      expect(result.summary.successfulRecoveries).toBeGreaterThan(50); // Most should succeed with fallbacks
      expect(result.summary.fallbacksGenerated).toBeGreaterThan(0);
    });

    it('should handle concurrent recovery operations', async () => {
      const concurrentElements = [
        { id: 'concurrent-1', type: 'unknown-1' as any },
        { id: 'concurrent-2', type: 'unknown-2' as any },
        { id: 'concurrent-3', type: 'unknown-3' as any }
      ];

      // Process elements concurrently
      const promises = concurrentElements.map(element => 
        recoverySystem.validateAndRecover(element)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.success).toBe(true); // Should succeed with fallbacks
      });
    });
  });

  describe('Error recovery statistics and logging', () => {
    it('should track recovery statistics accurately', async () => {
      // Perform various recovery operations
      await recoverySystem.validateAndRecover({ id: 'valid', type: 'button' }); // Valid
      await recoverySystem.validateAndRecover({ type: 'button' }); // Missing ID (recoverable)
      await recoverySystem.validateAndRecover({ id: 'invalid', type: 'unknown' }); // Invalid type (recoverable)

      const stats = recoverySystem.getRecoveryStats();

      expect(stats.totalAttempts).toBe(3);
      expect(stats.successfulRecoveries).toBe(3);
      expect(stats.successRate).toBe(100);
    });

    it('should handle recovery log overflow', async () => {
      // Perform many recovery operations to test log size limits
      const manyElements = new Array(150).fill(null).map((_, i) => ({
        id: `overflow-${i}`,
        type: 'button'
      }));

      await recoverySystem.processElementsWithRecovery(manyElements);

      const stats = recoverySystem.getRecoveryStats();
      
      // Should not exceed memory limits
      expect(stats.recentAttempts.length).toBeLessThanOrEqual(100);
    });

    it('should clear recovery logs properly', async () => {
      await recoverySystem.validateAndRecover({ type: 'button' });
      
      let stats = recoverySystem.getRecoveryStats();
      expect(stats.totalAttempts).toBeGreaterThan(0);

      recoverySystem.clearRecoveryLog();
      
      stats = recoverySystem.getRecoveryStats();
      expect(stats.totalAttempts).toBe(0);
      expect(stats.recentAttempts).toHaveLength(0);
    });
  });

  describe('Integration with other systems', () => {
    it('should handle errors from component generation system', async () => {
      // Simulate an element that would cause errors in the component generation phase
      const componentErrorElement = {
        id: 'component-error',
        type: 'button',
        properties: {
          name: 'Component Error Test'
        },
        // Add properties that might cause issues in component generation
        invalidGenerationProperty: 'causes-error'
      };

      const result = await recoverySystem.validateAndRecover(componentErrorElement);

      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Should recover with fallback
    });

    it('should handle errors from file system operations', async () => {
      // Test recovery when file system operations fail
      const fsErrorElement = {
        id: 'fs-error',
        type: 'button',
        properties: {
          name: 'File System Error Test'
        }
      };

      const context: Partial<GenerationContext> = {
        projectConfig: {
          // Invalid project config that might cause file system errors
          outputPath: '/invalid/path/that/does/not/exist'
        } as any,
        existingComponents: new Map(),
        uiLibrary: {
          name: 'test',
          components: [],
          utilities: { classNames: 'cn', variants: 'cva' }
        },
        namingConventions: {
          componentNaming: 'PascalCase',
          fileNaming: 'ComponentName.tsx',
          propsInterface: 'ComponentNameProps',
          exportPattern: 'default'
        }
      };

      const result = await recoverySystem.validateAndRecover(fsErrorElement, context as GenerationContext);

      expect(result).toBeDefined();
      // Should handle gracefully even if file operations fail
    });
  });

  describe('Edge case combinations', () => {
    it('should handle multiple edge cases simultaneously', async () => {
      const multiEdgeCaseElement = {
        id: null, // Null ID
        type: 'unknown-type', // Invalid type
        properties: {
          name: '', // Empty name
          width: -100, // Invalid dimension
          height: NaN, // NaN dimension
          visible: 'maybe' // Invalid boolean
        },
        styles: {
          backgroundColor: '#gggggg', // Invalid color
          borderRadius: 'round', // Invalid border radius
          padding: 'lots' // Invalid padding
        },
        children: 'not-an-array', // Invalid children
        invalidProperty: { circular: null }
      };

      // Create circular reference
      (multiEdgeCaseElement.invalidProperty as any).circular = multiEdgeCaseElement;

      const result = await recoverySystem.validateAndRecover(multiEdgeCaseElement as any);

      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Should recover with fallback
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle recovery system configuration edge cases', async () => {
      const edgeCaseConfig: Partial<ErrorRecoveryConfig> = {
        maxRecoveryAttempts: 0, // No recovery attempts
        enableFallbackGeneration: false, // No fallbacks
        enablePartialRecovery: false // No partial recovery
      };

      const strictRecoverySystem = new ErrorRecoverySystem(edgeCaseConfig);

      const problematicElement = {
        // Missing required properties
        properties: { name: 'Strict Test' }
      };

      const result = await strictRecoverySystem.validateAndRecover(problematicElement);

      expect(result.success).toBe(false); // Should fail with strict config
      expect(result.recoveryAttempts).toBe(0);
      expect(result.fallbackUsed).toBe(false);
    });
  });
});