/**
 * Error recovery system that integrates validation error handling and fallback generation
 */

import type { 
  ValidationError, 
  ValidationResult, 
  RecoveryResult,
  ErrorRecoveryStrategy 
} from '../types/validation.js';
import type { FigmaElement } from '../types/core.js';
import type { GeneratedComponent, GenerationContext } from '../types/component.js';

import { 
  FigmaElementErrorHandler, 
  ERROR_CODES 
} from './error-handler.js';
import { 
  FallbackComponentGenerator, 
  type FallbackConfig 
} from './fallback-generator.js';

/**
 * Configuration for the error recovery system
 */
export interface ErrorRecoveryConfig {
  maxRecoveryAttempts: number;
  enableFallbackGeneration: boolean;
  enablePartialRecovery: boolean;
  logRecoveryAttempts: boolean;
  fallbackConfig?: Partial<FallbackConfig>;
}

/**
 * Default error recovery configuration
 */
export const DEFAULT_RECOVERY_CONFIG: ErrorRecoveryConfig = {
  maxRecoveryAttempts: 3,
  enableFallbackGeneration: true,
  enablePartialRecovery: true,
  logRecoveryAttempts: true,
  fallbackConfig: {
    generateComments: true,
    includeDebugInfo: true
  }
};

/**
 * Result of error recovery process
 */
export interface ErrorRecoveryResult {
  success: boolean;
  component?: GeneratedComponent;
  recoveredErrors: ValidationError[];
  unrecoverableErrors: ValidationError[];
  recoveryAttempts: number;
  fallbackUsed: boolean;
  partialRecovery: boolean;
  message: string;
}

/**
 * Comprehensive error recovery system for Figma element processing
 */
export class ErrorRecoverySystem {
  private errorHandler: FigmaElementErrorHandler;
  private fallbackGenerator: FallbackComponentGenerator;
  private config: ErrorRecoveryConfig;
  private recoveryLog: Array<{
    timestamp: Date;
    element: any;
    errors: ValidationError[];
    result: ErrorRecoveryResult;
  }> = [];

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    this.errorHandler = new FigmaElementErrorHandler();
    this.fallbackGenerator = new FallbackComponentGenerator(this.config.fallbackConfig);
  }

  /**
   * Attempts to recover from validation errors and generate a component
   */
  async recoverFromErrors(
    element: any,
    validationResult: ValidationResult,
    context: GenerationContext = {}
  ): Promise<ErrorRecoveryResult> {
    const startTime = Date.now();
    let recoveryAttempts = 0;
    let recoveredErrors: ValidationError[] = [];
    let unrecoverableErrors: ValidationError[] = [...validationResult.errors];
    let modifiedElement = { ...element };
    let fallbackUsed = false;
    let partialRecovery = false;

    if (this.config.logRecoveryAttempts) {
      console.log(`🔧 Starting error recovery for element: ${element?.id || 'unknown'}`);
      console.log(`📋 Found ${validationResult.errors.length} errors to recover from`);
    }

    // Attempt to recover from each error
    while (
      unrecoverableErrors.length > 0 && 
      recoveryAttempts < this.config.maxRecoveryAttempts
    ) {
      recoveryAttempts++;
      const errorsToRecover = [...unrecoverableErrors];
      unrecoverableErrors = [];

      if (this.config.logRecoveryAttempts) {
        console.log(`🔄 Recovery attempt ${recoveryAttempts}/${this.config.maxRecoveryAttempts}`);
      }

      for (const error of errorsToRecover) {
        const recoveryResult = this.errorHandler.handleValidationError(
          error, 
          modifiedElement, 
          context
        );

        if (recoveryResult.success) {
          recoveredErrors.push(error);
          if (recoveryResult.modifications) {
            if (this.config.logRecoveryAttempts) {
              console.log(`✅ Recovered from ${error.code}: ${recoveryResult.modifications.join(', ')}`);
            }
          }
        } else {
          unrecoverableErrors.push(error);
        }
      }

      // Re-validate the modified element
      if (recoveredErrors.length > 0) {
        const revalidationResult = this.errorHandler.validateElement(modifiedElement);
        if (revalidationResult.errors.length < errorsToRecover.length) {
          // Some progress made
          unrecoverableErrors = revalidationResult.errors;
        }
      }
    }

    // Determine if we should use fallback generation
    const shouldUseFallback = this.shouldUseFallback(unrecoverableErrors, recoveredErrors);
    
    let component: GeneratedComponent | undefined;
    let success = false;
    let message = '';

    if (unrecoverableErrors.length === 0) {
      // Full recovery achieved
      success = true;
      message = `Successfully recovered from ${recoveredErrors.length} errors`;
    } else if (this.config.enablePartialRecovery && recoveredErrors.length > 0) {
      // Partial recovery
      partialRecovery = true;
      
      if (shouldUseFallback && this.config.enableFallbackGeneration) {
        component = this.generateFallbackComponent(
          modifiedElement, 
          context, 
          unrecoverableErrors
        );
        fallbackUsed = true;
        success = true;
        message = `Partial recovery: ${recoveredErrors.length} errors fixed, ${unrecoverableErrors.length} remaining. Fallback component generated.`;
      } else {
        success = false;
        message = `Partial recovery: ${recoveredErrors.length} errors fixed, but ${unrecoverableErrors.length} critical errors remain`;
      }
    } else if (shouldUseFallback && this.config.enableFallbackGeneration) {
      // No recovery possible, but fallback can be generated
      component = this.generateFallbackComponent(
        modifiedElement, 
        context, 
        unrecoverableErrors
      );
      fallbackUsed = true;
      success = true;
      message = `No errors could be recovered, but fallback component generated`;
    } else {
      // Complete failure
      success = false;
      message = `Recovery failed: ${unrecoverableErrors.length} unrecoverable errors`;
    }

    const result: ErrorRecoveryResult = {
      success,
      component,
      recoveredErrors,
      unrecoverableErrors,
      recoveryAttempts,
      fallbackUsed,
      partialRecovery,
      message
    };

    // Log the recovery attempt
    this.logRecoveryAttempt(element, validationResult.errors, result);

    if (this.config.logRecoveryAttempts) {
      const duration = Date.now() - startTime;
      console.log(`🏁 Recovery completed in ${duration}ms: ${message}`);
    }

    return result;
  }

  /**
   * Validates an element and attempts recovery if needed
   */
  async validateAndRecover(
    element: any,
    context: GenerationContext = {}
  ): Promise<ErrorRecoveryResult> {
    // First, validate the element
    const validationResult = this.errorHandler.validateElement(element);

    if (validationResult.isValid) {
      return {
        success: true,
        recoveredErrors: [],
        unrecoverableErrors: [],
        recoveryAttempts: 0,
        fallbackUsed: false,
        partialRecovery: false,
        message: 'Element is valid, no recovery needed'
      };
    }

    // If validation failed, attempt recovery
    return this.recoverFromErrors(element, validationResult, context);
  }

  /**
   * Processes multiple elements with error recovery
   */
  async processElementsWithRecovery(
    elements: any[],
    context: GenerationContext = {}
  ): Promise<{
    successful: ErrorRecoveryResult[];
    failed: ErrorRecoveryResult[];
    summary: {
      totalElements: number;
      successfulRecoveries: number;
      failedRecoveries: number;
      fallbacksGenerated: number;
      partialRecoveries: number;
    };
  }> {
    const successful: ErrorRecoveryResult[] = [];
    const failed: ErrorRecoveryResult[] = [];

    if (this.config.logRecoveryAttempts) {
      console.log(`🚀 Processing ${elements.length} elements with error recovery`);
    }

    for (const element of elements) {
      try {
        const result = await this.validateAndRecover(element, context);
        
        if (result.success) {
          successful.push(result);
        } else {
          failed.push(result);
        }
      } catch (error) {
        // Handle unexpected errors during recovery
        const errorResult: ErrorRecoveryResult = {
          success: false,
          recoveredErrors: [],
          unrecoverableErrors: [{
            code: 'RECOVERY_SYSTEM_ERROR',
            message: `Unexpected error during recovery: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'critical'
          }],
          recoveryAttempts: 0,
          fallbackUsed: false,
          partialRecovery: false,
          message: 'Recovery system encountered an unexpected error'
        };
        failed.push(errorResult);
      }
    }

    const summary = {
      totalElements: elements.length,
      successfulRecoveries: successful.length,
      failedRecoveries: failed.length,
      fallbacksGenerated: successful.filter(r => r.fallbackUsed).length,
      partialRecoveries: successful.filter(r => r.partialRecovery).length
    };

    if (this.config.logRecoveryAttempts) {
      console.log(`📊 Recovery Summary:`, summary);
    }

    return { successful, failed, summary };
  }

  /**
   * Gets recovery statistics and logs
   */
  getRecoveryStats() {
    const totalAttempts = this.recoveryLog.length;
    const successfulRecoveries = this.recoveryLog.filter(log => log.result.success).length;
    const fallbacksUsed = this.recoveryLog.filter(log => log.result.fallbackUsed).length;
    const partialRecoveries = this.recoveryLog.filter(log => log.result.partialRecovery).length;

    return {
      totalAttempts,
      successfulRecoveries,
      failedRecoveries: totalAttempts - successfulRecoveries,
      fallbacksUsed,
      partialRecoveries,
      successRate: totalAttempts > 0 ? (successfulRecoveries / totalAttempts) * 100 : 0,
      recentAttempts: this.recoveryLog.slice(-10) // Last 10 attempts
    };
  }

  /**
   * Clears recovery logs
   */
  clearRecoveryLog(): void {
    this.recoveryLog = [];
  }

  /**
   * Determines if fallback generation should be used
   */
  private shouldUseFallback(
    unrecoverableErrors: ValidationError[], 
    recoveredErrors: ValidationError[]
  ): boolean {
    // Don't use fallback for critical structural errors
    const criticalErrors = unrecoverableErrors.filter(error => 
      error.severity === 'critical' && 
      [ERROR_CODES.CIRCULAR_REFERENCE, ERROR_CODES.TYPESCRIPT_ERROR].includes(error.code as any)
    );

    if (criticalErrors.length > 0) {
      return false;
    }

    // Use fallback if we have some recoverable content or if explicitly enabled
    return this.config.enableFallbackGeneration && (
      recoveredErrors.length > 0 || 
      unrecoverableErrors.every(error => error.severity !== 'critical')
    );
  }

  /**
   * Generates a fallback component with error context
   */
  private generateFallbackComponent(
    element: any,
    context: GenerationContext,
    errors: ValidationError[]
  ): GeneratedComponent {
    const errorSummary = errors.map(e => `${e.code}: ${e.message}`).join('; ');
    const reason = `Error recovery fallback (${errors.length} errors: ${errorSummary})`;

    const component = this.fallbackGenerator.generateFallbackComponent(
      element,
      context,
      reason
    );

    // Add error information to metadata
    if (component.metadata) {
      component.metadata.recoveryErrors = errors;
      component.metadata.errorSummary = errorSummary;
    }

    return component;
  }

  /**
   * Logs a recovery attempt for debugging and analysis
   */
  private logRecoveryAttempt(
    element: any,
    originalErrors: ValidationError[],
    result: ErrorRecoveryResult
  ): void {
    this.recoveryLog.push({
      timestamp: new Date(),
      element: { id: element?.id, type: element?.type },
      errors: originalErrors,
      result
    });

    // Keep only the last 100 recovery attempts to prevent memory issues
    if (this.recoveryLog.length > 100) {
      this.recoveryLog = this.recoveryLog.slice(-100);
    }
  }
}

/**
 * Utility function to create error recovery system
 */
export function createErrorRecoverySystem(config?: Partial<ErrorRecoveryConfig>): ErrorRecoverySystem {
  return new ErrorRecoverySystem(config);
}

/**
 * Quick utility to validate and recover a single element
 */
export async function validateAndRecover(
  element: any,
  context?: GenerationContext
): Promise<ErrorRecoveryResult> {
  const system = createErrorRecoverySystem();
  return system.validateAndRecover(element, context);
}

/**
 * Quick utility to process multiple elements with recovery
 */
export async function processElementsWithRecovery(
  elements: any[],
  context?: GenerationContext
) {
  const system = createErrorRecoverySystem();
  return system.processElementsWithRecovery(elements, context);
}