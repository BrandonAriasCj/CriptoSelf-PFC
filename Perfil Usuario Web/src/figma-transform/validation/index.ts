/**
 * Validation module exports
 * 
 * This module provides comprehensive error handling, validation, and fallback generation
 * for Figma element processing and React component generation.
 */

// Error handling
export {
  FigmaElementErrorHandler,
  createErrorHandler,
  validateElements,
  ERROR_CODES,
  type ErrorCode
} from './error-handler.js';

// Fallback generation
export {
  FallbackComponentGenerator,
  createFallbackGenerator,
  generateGenericFallback,
  generateLayoutFallback,
  generatePlaceholderFallback,
  DEFAULT_FALLBACK_CONFIG,
  type FallbackConfig
} from './fallback-generator.js';

// Error recovery system
export {
  ErrorRecoverySystem,
  createErrorRecoverySystem,
  validateAndRecover,
  processElementsWithRecovery,
  DEFAULT_RECOVERY_CONFIG,
  type ErrorRecoveryConfig,
  type ErrorRecoveryResult
} from './error-recovery-system.js';

// Re-export validation types for convenience
export type {
  ValidationError,
  ValidationResult,
  ValidationWarning,
  ErrorLocation,
  ErrorRecoveryStrategy,
  RecoveryResult,
  FallbackStrategy
} from '../types/validation.js';