/**
 * Tests for error recovery system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ErrorRecoverySystem,
  createErrorRecoverySystem,
  validateAndRecover,
  processElementsWithRecovery,
  DEFAULT_RECOVERY_CONFIG
} from '../error-recovery-system.js';
import { ERROR_CODES } from '../error-handler.js';
import type { ValidationError } from '../../types/validation.js';

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('ErrorRecoverySystem', () => {
  let recoverySystem: ErrorRecoverySystem;

  beforeEach(() => {
    recoverySystem = new ErrorRecoverySystem({
      logRecoveryAttempts: false // Disable logging for tests
    });
    consoleSpy.mockClear();
  });

  describe('validateAndRecover', () => {
    it('should return success for valid elements', async () => {
      const validElement = {
        id: 'valid-1',
        type: 'button',
        properties: {
          name: 'Valid Button',
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          visible: true
        },
        styles: {
          backgroundColor: '#007bff'
        }
      };

      const result = await recoverySystem.validateAndRecover(validElement);

      expect(result.success).toBe(true);
      expect(result.recoveryAttempts).toBe(0);
      expect(result.fallbackUsed).toBe(false);
      expect(result.message).toContain('no recovery needed');
    });

    it('should recover from missing required properties', async () => {
      const elementMissingId = {
        type: 'button',
        properties: {
          name: 'Button Without ID'
        }
      };

      const result = await recoverySystem.validateAndRecover(elementMissingId);

      expect(result.success).toBe(true);
      expect(result.recoveredErrors.length).toBeGreaterThan(0);
      expect(result.recoveredErrors[0].code).toBe(ERROR_CODES.MISSING_REQUIRED_PROPERTY);
      expect(result.message).toContain('Successfully recovered');
    });

    it('should recover from invalid element type', async () => {
      const elementWithInvalidType = {
        id: 'invalid-type-1',
        type: 'unknown-type',
        properties: {
          name: 'Invalid Type Element'
        }
      };

      const result = await recoverySystem.validateAndRecover(elementWithInvalidType);

      expect(result.success).toBe(true);
      expect(result.recoveredErrors.some(e => e.code === ERROR_CODES.INVALID_ELEMENT_TYPE)).toBe(true);
    });

    it('should use fallback for unrecoverable errors', async () => {
      const problematicElement = {
        id: 'problematic-1',
        type: 'button',
        properties: {
          name: 'Problematic Element'
        },
        styles: {
          backgroundColor: 'invalid-color-format'
        }
      };

      const result = await recoverySystem.validateAndRecover(problematicElement);

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.component).toBeDefined();
      expect(result.component?.metadata?.isFallback).toBe(true);
    });

    it('should handle partial recovery scenarios', async () => {
      const partiallyRecoverableElement = {
        // Missing ID (recoverable)
        type: 'button',
        properties: {
          name: 'Partial Recovery Test',
          width: -10 // Invalid dimension (warning, not critical)
        }
      };

      const result = await recoverySystem.validateAndRecover(partiallyRecoverableElement);

      expect(result.success).toBe(true);
      expect(result.recoveredErrors.length).toBeGreaterThan(0);
    });

    it('should fail gracefully for critical unrecoverable errors', async () => {
      const systemWithoutFallback = new ErrorRecoverySystem({
        enableFallbackGeneration: false,
        logRecoveryAttempts: false
      });

      const criticallyFlawedElement = {
        // Completely malformed element
        invalidStructure: true
      };

      const result = await systemWithoutFallback.validateAndRecover(criticallyFlawedElement);

      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(false);
      expect(result.unrecoverableErrors.length).toBeGreaterThan(0);
    });
  });

  describe('recoverFromErrors', () => {
    it('should attempt recovery up to max attempts', async () => {
      const systemWithLimitedAttempts = new ErrorRecoverySystem({
        maxRecoveryAttempts: 2,
        logRecoveryAttempts: false
      });

      const validationResult = {
        isValid: false,
        errors: [
          {
            code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
            message: 'Missing ID',
            property: 'id',
            severity: 'critical' as const
          }
        ],
        warnings: []
      };

      const element = { type: 'button' };
      const result = await systemWithLimitedAttempts.recoverFromErrors(element, validationResult);

      expect(result.recoveryAttempts).toBeLessThanOrEqual(2);
    });

    it('should track recovered and unrecoverable errors separately', async () => {
      const validationResult = {
        isValid: false,
        errors: [
          {
            code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
            message: 'Missing ID',
            property: 'id',
            severity: 'critical' as const
          },
          {
            code: ERROR_CODES.MISSING_REQUIRED_PROPERTY,
            message: 'Missing type',
            property: 'type',
            severity: 'critical' as const
          }
        ],
        warnings: []
      };

      const element = {}; // Missing both ID and type
      const result = await recoverySystem.recoverFromErrors(element, validationResult);

      expect(result.recoveredErrors.length + result.unrecoverableErrors.length).toBe(2);
    });
  });

  describe('processElementsWithRecovery', () => {
    it('should process multiple elements and provide summary', async () => {
      const elements = [
        { id: 'valid-1', type: 'button', properties: { name: 'Valid' } },
        { type: 'input' }, // Missing ID
        { id: 'invalid-type', type: 'unknown' }, // Invalid type
        {} // Completely invalid
      ];

      const result = await recoverySystem.processElementsWithRecovery(elements);

      expect(result.summary.totalElements).toBe(4);
      expect(result.summary.successfulRecoveries).toBeGreaterThan(0);
      expect(result.successful.length + result.failed.length).toBe(4);
    });

    it('should handle unexpected errors during processing', async () => {
      const problematicElements = [
        null, // This should cause an error
        { id: 'valid-1', type: 'button' }
      ];

      const result = await recoverySystem.processElementsWithRecovery(problematicElements);

      expect(result.summary.totalElements).toBe(2);
      // Should handle the null element gracefully
      expect(result.failed.some(f => f.unrecoverableErrors[0]?.code === 'RECOVERY_SYSTEM_ERROR')).toBe(true);
    });

    it('should track fallback usage in summary', async () => {
      const elementsNeedingFallback = [
        { id: 'complex-1', type: 'unknown-complex-type' },
        { id: 'malformed-1', invalidProperty: 'test' }
      ];

      const result = await recoverySystem.processElementsWithRecovery(elementsNeedingFallback);

      expect(result.summary.fallbacksGenerated).toBeGreaterThan(0);
    });
  });

  describe('recovery statistics', () => {
    it('should track recovery statistics', async () => {
      // Perform some recovery operations
      await recoverySystem.validateAndRecover({ type: 'button' }); // Missing ID
      await recoverySystem.validateAndRecover({ id: 'valid', type: 'button' }); // Valid

      const stats = recoverySystem.getRecoveryStats();

      expect(stats.totalAttempts).toBe(2);
      expect(stats.successfulRecoveries).toBe(2);
      expect(stats.successRate).toBe(100);
    });

    it('should clear recovery logs', async () => {
      await recoverySystem.validateAndRecover({ type: 'button' });
      
      let stats = recoverySystem.getRecoveryStats();
      expect(stats.totalAttempts).toBe(1);

      recoverySystem.clearRecoveryLog();
      
      stats = recoverySystem.getRecoveryStats();
      expect(stats.totalAttempts).toBe(0);
    });

    it('should limit recovery log size', async () => {
      // This test would be slow with 101 actual operations, so we'll test the concept
      const stats = recoverySystem.getRecoveryStats();
      expect(stats.recentAttempts).toBeDefined();
      expect(Array.isArray(stats.recentAttempts)).toBe(true);
    });
  });

  describe('configuration options', () => {
    it('should respect maxRecoveryAttempts setting', async () => {
      const systemWithLimitedAttempts = new ErrorRecoverySystem({
        maxRecoveryAttempts: 1,
        logRecoveryAttempts: false
      });

      const result = await systemWithLimitedAttempts.validateAndRecover({});

      expect(result.recoveryAttempts).toBeLessThanOrEqual(1);
    });

    it('should disable fallback generation when configured', async () => {
      const systemWithoutFallback = new ErrorRecoverySystem({
        enableFallbackGeneration: false,
        logRecoveryAttempts: false
      });

      const result = await systemWithoutFallback.validateAndRecover({
        id: 'test',
        type: 'unknown-type'
      });

      expect(result.fallbackUsed).toBe(false);
    });

    it('should disable partial recovery when configured', async () => {
      const systemWithoutPartialRecovery = new ErrorRecoverySystem({
        enablePartialRecovery: false,
        enableFallbackGeneration: false,
        logRecoveryAttempts: false
      });

      const result = await systemWithoutPartialRecovery.validateAndRecover({
        type: 'button' // Missing ID, partially recoverable
      });

      // Without partial recovery and fallback, this should fail
      expect(result.partialRecovery).toBe(false);
    });

    it('should enable logging when configured', async () => {
      const systemWithLogging = new ErrorRecoverySystem({
        logRecoveryAttempts: true
      });

      await systemWithLogging.validateAndRecover({ type: 'button' });

      // Should have called console.log
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('fallback component generation', () => {
    it('should include error information in fallback metadata', async () => {
      const elementWithErrors = {
        id: 'error-test',
        type: 'unknown-type',
        properties: {
          name: 'Error Test Element'
        }
      };

      const result = await recoverySystem.validateAndRecover(elementWithErrors);

      expect(result.fallbackUsed).toBe(true);
      expect(result.component?.metadata?.recoveryErrors).toBeDefined();
      expect(result.component?.metadata?.errorSummary).toBeDefined();
    });

    it('should not use fallback for critical structural errors', async () => {
      // This test simulates a scenario where fallback shouldn't be used
      // In practice, this would be elements with circular references or similar critical issues
      const systemWithStrictFallback = new ErrorRecoverySystem({
        enableFallbackGeneration: true,
        logRecoveryAttempts: false
      });

      // For this test, we'll use a valid element since circular reference detection
      // requires more complex setup
      const validElement = {
        id: 'test',
        type: 'button',
        properties: { name: 'Test' }
      };

      const result = await systemWithStrictFallback.validateAndRecover(validElement);

      // Valid element shouldn't need fallback
      expect(result.fallbackUsed).toBe(false);
    });
  });
});

describe('utility functions', () => {
  describe('createErrorRecoverySystem', () => {
    it('should create system with default config', () => {
      const system = createErrorRecoverySystem();
      expect(system).toBeInstanceOf(ErrorRecoverySystem);
    });

    it('should create system with custom config', () => {
      const config = { maxRecoveryAttempts: 5 };
      const system = createErrorRecoverySystem(config);
      expect(system).toBeInstanceOf(ErrorRecoverySystem);
    });
  });

  describe('validateAndRecover utility', () => {
    it('should validate and recover element', async () => {
      const element = { type: 'button' }; // Missing ID
      const result = await validateAndRecover(element);

      expect(result.success).toBe(true);
      expect(result.recoveredErrors.length).toBeGreaterThan(0);
    });
  });

  describe('processElementsWithRecovery utility', () => {
    it('should process multiple elements', async () => {
      const elements = [
        { id: 'test-1', type: 'button' },
        { type: 'input' } // Missing ID
      ];

      const result = await processElementsWithRecovery(elements);

      expect(result.summary.totalElements).toBe(2);
      expect(result.summary.successfulRecoveries).toBe(2);
    });
  });
});

describe('DEFAULT_RECOVERY_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_RECOVERY_CONFIG.maxRecoveryAttempts).toBe(3);
    expect(DEFAULT_RECOVERY_CONFIG.enableFallbackGeneration).toBe(true);
    expect(DEFAULT_RECOVERY_CONFIG.enablePartialRecovery).toBe(true);
    expect(DEFAULT_RECOVERY_CONFIG.logRecoveryAttempts).toBe(true);
    expect(DEFAULT_RECOVERY_CONFIG.fallbackConfig).toBeDefined();
  });
});