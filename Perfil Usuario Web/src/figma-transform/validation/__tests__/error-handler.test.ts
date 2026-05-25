/**
 * Tests for Figma element error handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FigmaElementErrorHandler, 
  createErrorHandler, 
  validateElements,
  ERROR_CODES 
} from '../error-handler.js';
import type { ValidationError } from '../../types/validation.js';

describe('FigmaElementErrorHandler', () => {
  let errorHandler: FigmaElementErrorHandler;

  beforeEach(() => {
    errorHandler = new FigmaElementErrorHandler();
  });

  describe('validateElement', () => {
    it('should validate a valid element successfully', () => {
      const validElement = {
        id: 'test-1',
        type: 'button',
        properties: {
          name: 'Test Button',
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true
        },
        styles: {
          backgroundColor: '#007bff',
          borderRadius: 8
        }
      };

      const result = errorHandler.validateElement(validElement);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing required properties', () => {
      const invalidElement = {
        // Missing id and type
        properties: {
          name: 'Test'
        }
      };

      const result = errorHandler.validateElement(invalidElement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
      expect(result.errors[0].property).toBe('id');
      expect(result.errors[1].code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
      expect(result.errors[1].property).toBe('type');
    });

    it('should detect invalid element type', () => {
      const invalidElement = {
        id: 'test-1',
        type: 'invalid-type',
        properties: {}
      };

      const result = errorHandler.validateElement(invalidElement);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_ELEMENT_TYPE)).toBe(true);
    });

    it('should detect invalid dimensions as warnings', () => {
      const elementWithInvalidDimensions = {
        id: 'test-1',
        type: 'button',
        properties: {
          width: -10,
          height: 0,
          name: 'Test'
        }
      };

      const result = errorHandler.validateElement(elementWithInvalidDimensions);

      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0].code).toBe(ERROR_CODES.INVALID_DIMENSIONS);
      expect(result.warnings[1].code).toBe(ERROR_CODES.INVALID_DIMENSIONS);
    });

    it('should detect malformed styles as warnings', () => {
      const elementWithBadStyles = {
        id: 'test-1',
        type: 'button',
        properties: {},
        styles: {
          backgroundColor: 'invalid-color',
          borderRadius: -5
        }
      };

      const result = errorHandler.validateElement(elementWithBadStyles);

      expect(result.warnings).toHaveLength(2);
      expect(result.warnings.some(w => w.code === ERROR_CODES.MALFORMED_STYLES)).toBe(true);
    });

    it('should detect circular references', () => {
      const parentElement = {
        id: 'parent',
        type: 'frame',
        children: []
      };

      const childElement = {
        id: 'child',
        type: 'frame',
        children: [parentElement] // Circular reference
      };

      parentElement.children = [childElement];

      const result = errorHandler.validateElement(parentElement);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.CIRCULAR_REFERENCE)).toBe(true);
    });

    it('should handle null/undefined elements', () => {
      const result1 = errorHandler.validateElement(null);
      const result2 = errorHandler.validateElement(undefined);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors[0].code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
      expect(result2.errors[0].code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
    });

    it('should validate children array structure', () => {
      const elementWithInvalidChildren = {
        id: 'test-1',
        type: 'frame',
        children: 'not-an-array' // Should be array
      };

      const result = errorHandler.validateElement(elementWithInvalidChildren);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_PROPERTY_TYPE)).toBe(true);
    });

    it('should generate helpful suggestions', () => {
      const invalidElement = {
        // Missing required properties
        properties: {
          width: -10 // Invalid dimension
        },
        styles: {
          backgroundColor: 'invalid-color' // Invalid color
        }
      };

      const result = errorHandler.validateElement(invalidElement);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions!.some(s => s.includes('required properties'))).toBe(true);
    });
  });

  describe('handleValidationError', () => {
    it('should recover from missing ID error', () => {
      const error: ValidationError = {
        code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Missing required property: id',
        property: 'id',
        severity: 'critical'
      };

      const element = { type: 'button' };
      const result = errorHandler.handleValidationError(error, element);

      expect(result.success).toBe(true);
      expect(element.id).toBeDefined();
      expect(result.modifications).toContain(`Added generated ID: ${element.id}`);
    });

    it('should recover from missing type error', () => {
      const error: ValidationError = {
        code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Missing required property: type',
        property: 'type',
        severity: 'critical'
      };

      const element = { id: 'test-1' };
      const result = errorHandler.handleValidationError(error, element);

      expect(result.success).toBe(true);
      expect(element.type).toBe('frame');
      expect(result.modifications).toContain('Set element type to "frame"');
    });

    it('should recover from invalid element type', () => {
      const error: ValidationError = {
        code: ERROR_CODES.INVALID_ELEMENT_TYPE,
        message: 'Invalid element type: unknown',
        severity: 'error'
      };

      const element = { id: 'test-1', type: 'unknown' };
      const result = errorHandler.handleValidationError(error, element);

      expect(result.success).toBe(true);
      expect(element.type).toBe('frame');
    });

    it('should recover from invalid dimensions', () => {
      const error: ValidationError = {
        code: ERROR_CODES.INVALID_DIMENSIONS,
        message: 'Width should be greater than 0',
        property: 'properties.width',
        severity: 'error'
      };

      const element = {
        id: 'test-1',
        type: 'button',
        properties: { width: -10 }
      };

      const result = errorHandler.handleValidationError(error, element);

      expect(result.success).toBe(true);
      expect(element.properties.width).toBe(100);
    });

    it('should recover from malformed styles', () => {
      const error: ValidationError = {
        code: ERROR_CODES.MALFORMED_STYLES,
        message: 'Invalid background color',
        property: 'styles.backgroundColor',
        severity: 'error'
      };

      const element = {
        id: 'test-1',
        type: 'button',
        styles: { backgroundColor: 'invalid-color' }
      };

      const result = errorHandler.handleValidationError(error, element);

      expect(result.success).toBe(true);
      expect(element.styles.backgroundColor).toBeUndefined();
    });

    it('should fail gracefully for unrecoverable errors', () => {
      const error: ValidationError = {
        code: ERROR_CODES.CIRCULAR_REFERENCE,
        message: 'Circular reference detected',
        severity: 'critical'
      };

      const element = { id: 'test-1' };
      const result = errorHandler.handleValidationError(error, element);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unable to recover');
    });
  });

  describe('createError', () => {
    it('should create properly formatted error', () => {
      const error = errorHandler.createError(
        ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        'Test message',
        'Test suggestion',
        'TestComponent',
        'testProperty'
      );

      expect(error.code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
      expect(error.message).toBe('Test message');
      expect(error.suggestion).toBe('Test suggestion');
      expect(error.component).toBe('TestComponent');
      expect(error.property).toBe('testProperty');
      expect(error.severity).toBe('critical');
    });

    it('should assign correct severity levels', () => {
      const criticalError = errorHandler.createError(
        ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        'Critical error'
      );

      const regularError = errorHandler.createError(
        ERROR_CODES.MALFORMED_STYLES,
        'Regular error'
      );

      expect(criticalError.severity).toBe('critical');
      expect(regularError.severity).toBe('error');
    });
  });

  describe('error logging', () => {
    it('should log errors for debugging', () => {
      const error: ValidationError = {
        code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Test error',
        severity: 'error'
      };

      errorHandler.handleValidationError(error, {});
      const log = errorHandler.getErrorLog();

      expect(log).toHaveLength(1);
      expect(log[0]).toEqual(error);
    });

    it('should clear error log', () => {
      const error: ValidationError = {
        code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        message: 'Test error',
        severity: 'error'
      };

      errorHandler.handleValidationError(error, {});
      expect(errorHandler.getErrorLog()).toHaveLength(1);

      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });
  });

  describe('color validation', () => {
    it('should validate hex colors correctly', () => {
      const validElement = {
        id: 'test-1',
        type: 'button',
        styles: {
          backgroundColor: '#ff0000'
        }
      };

      const result = errorHandler.validateElement(validElement);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate rgb colors correctly', () => {
      const validElement = {
        id: 'test-1',
        type: 'button',
        styles: {
          backgroundColor: 'rgb(255, 0, 0)'
        }
      };

      const result = errorHandler.validateElement(validElement);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate named colors correctly', () => {
      const validElement = {
        id: 'test-1',
        type: 'button',
        styles: {
          backgroundColor: 'red'
        }
      };

      const result = errorHandler.validateElement(validElement);
      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('utility functions', () => {
  describe('createErrorHandler', () => {
    it('should create error handler instance', () => {
      const handler = createErrorHandler();
      expect(handler).toBeInstanceOf(FigmaElementErrorHandler);
    });
  });

  describe('validateElements', () => {
    it('should validate multiple elements', () => {
      const elements = [
        { id: 'test-1', type: 'button' },
        { id: 'test-2', type: 'input' },
        { /* missing id and type */ }
      ];

      const result = validateElements(elements);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should remove duplicate suggestions', () => {
      const elements = [
        { /* missing id and type */ },
        { /* missing id and type */ }
      ];

      const result = validateElements(elements);

      // Should have suggestions but no duplicates
      expect(result.suggestions).toBeDefined();
      const uniqueSuggestions = new Set(result.suggestions);
      expect(uniqueSuggestions.size).toBe(result.suggestions!.length);
    });
  });
});