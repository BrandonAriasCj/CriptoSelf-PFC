/**
 * Error handling and validation for Figma element processing
 */

import type {
  ValidationError,
  ValidationResult,
  ErrorRecoveryStrategy,
  RecoveryResult,
  ErrorLocation
} from '../types/validation.js';
import type { FigmaElement } from '../types/core.js';
import type { GeneratedComponent } from '../types/component.js';

// Error codes for different validation scenarios
export const ERROR_CODES = {
  MISSING_REQUIRED_PROPERTY: 'MISSING_REQUIRED_PROPERTY',
  INVALID_PROPERTY_TYPE: 'INVALID_PROPERTY_TYPE',
  INVALID_ELEMENT_TYPE: 'INVALID_ELEMENT_TYPE',
  MALFORMED_STYLES: 'MALFORMED_STYLES',
  MISSING_CHILDREN: 'MISSING_CHILDREN',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
  UNSUPPORTED_FEATURE: 'UNSUPPORTED_FEATURE',
  TYPESCRIPT_ERROR: 'TYPESCRIPT_ERROR',
  ACCESSIBILITY_VIOLATION: 'ACCESSIBILITY_VIOLATION'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Main error handler for Figma element validation and processing
 */
export class FigmaElementErrorHandler {
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private errorLog: ValidationError[] = [];

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Validates a Figma element and returns validation result
   */
  validateElement(element: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    try {
      // Check if element exists
      if (!element) {
        errors.push(this.createError(
          ERROR_CODES.MISSING_REQUIRED_PROPERTY,
          'Element is null or undefined',
          'Provide a valid Figma element object'
        ));
        return { isValid: false, errors, warnings, suggestions };
      }

      // Validate required properties
      this.validateRequiredProperties(element, errors);
      
      // Validate element type
      this.validateElementType(element, errors);
      
      // Validate properties structure
      this.validateProperties(element, errors, warnings);
      
      // Validate styles
      this.validateStyles(element, errors, warnings);
      
      // Validate children if present
      this.validateChildren(element, errors, warnings);

      // Generate suggestions based on errors and warnings
      this.generateSuggestions(errors, warnings, suggestions);

    } catch (error) {
      errors.push(this.createError(
        ERROR_CODES.INVALID_ELEMENT_TYPE,
        `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Check element structure and try again'
      ));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Handles validation errors and attempts recovery
   */
  handleValidationError(error: ValidationError, element: any, context?: any): RecoveryResult {
    // Log the error
    this.logError(error);

    // Find appropriate recovery strategy
    const strategy = this.findRecoveryStrategy(error);
    
    if (strategy) {
      try {
        const result = strategy.action(error, { element, ...context });
        
        if (result.success) {
          console.log(`✅ Recovered from error: ${error.code} - ${error.message}`);
          return result;
        }
      } catch (recoveryError) {
        console.error(`❌ Recovery strategy failed for ${error.code}:`, recoveryError);
      }
    }

    // If no recovery strategy worked, return failure
    return {
      success: false,
      message: `Unable to recover from error: ${error.message}. ${error.suggestion || ''}`
    };
  }

  /**
   * Creates a standardized validation error
   */
  createError(
    code: ErrorCode,
    message: string,
    suggestion?: string,
    component?: string,
    property?: string,
    location?: ErrorLocation
  ): ValidationError {
    return {
      code,
      message,
      component,
      property,
      severity: this.getErrorSeverity(code),
      suggestion,
      location
    };
  }

  /**
   * Gets error logs for debugging
   */
  getErrorLog(): ValidationError[] {
    return [...this.errorLog];
  }

  /**
   * Clears error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Validates required properties of a Figma element
   */
  private validateRequiredProperties(element: any, errors: ValidationError[]): void {
    const requiredProps = ['id', 'type'];
    
    for (const prop of requiredProps) {
      if (!element[prop]) {
        errors.push(this.createError(
          ERROR_CODES.MISSING_REQUIRED_PROPERTY,
          `Missing required property: ${prop}`,
          `Add ${prop} property to the element`,
          undefined,
          prop
        ));
      }
    }
  }

  /**
   * Validates element type
   */
  private validateElementType(element: any, errors: ValidationError[]): void {
    const validTypes = ['component', 'frame', 'text', 'image', 'button', 'input', 'group'];
    
    if (element.type && !validTypes.includes(element.type)) {
      errors.push(this.createError(
        ERROR_CODES.INVALID_ELEMENT_TYPE,
        `Invalid element type: ${element.type}`,
        `Use one of: ${validTypes.join(', ')}`,
        undefined,
        'type'
      ));
    }
  }

  /**
   * Validates element properties
   */
  private validateProperties(element: any, errors: ValidationError[], warnings: ValidationError[]): void {
    if (element.properties) {
      const props = element.properties;
      
      // Validate dimensions
      if (typeof props.width === 'number' && props.width <= 0) {
        warnings.push(this.createError(
          ERROR_CODES.INVALID_DIMENSIONS,
          'Width should be greater than 0',
          'Set a positive width value',
          undefined,
          'properties.width'
        ));
      }
      
      if (typeof props.height === 'number' && props.height <= 0) {
        warnings.push(this.createError(
          ERROR_CODES.INVALID_DIMENSIONS,
          'Height should be greater than 0',
          'Set a positive height value',
          undefined,
          'properties.height'
        ));
      }

      // Validate name
      if (props.name && typeof props.name !== 'string') {
        errors.push(this.createError(
          ERROR_CODES.INVALID_PROPERTY_TYPE,
          'Element name must be a string',
          'Provide a valid string name',
          undefined,
          'properties.name'
        ));
      }
    }
  }

  /**
   * Validates element styles
   */
  private validateStyles(element: any, errors: ValidationError[], warnings: ValidationError[]): void {
    if (element.styles) {
      const styles = element.styles;
      
      // Validate color values
      if (styles.backgroundColor && !this.isValidColor(styles.backgroundColor)) {
        warnings.push(this.createError(
          ERROR_CODES.MALFORMED_STYLES,
          `Invalid background color: ${styles.backgroundColor}`,
          'Use valid hex, rgb, or named color values',
          undefined,
          'styles.backgroundColor'
        ));
      }

      // Validate border radius
      if (styles.borderRadius && (typeof styles.borderRadius !== 'number' || styles.borderRadius < 0)) {
        warnings.push(this.createError(
          ERROR_CODES.MALFORMED_STYLES,
          'Border radius must be a non-negative number',
          'Set border radius to a positive number or 0',
          undefined,
          'styles.borderRadius'
        ));
      }
    }
  }

  /**
   * Validates children elements
   */
  private validateChildren(element: any, errors: ValidationError[], warnings: ValidationError[]): void {
    if (element.children) {
      if (!Array.isArray(element.children)) {
        errors.push(this.createError(
          ERROR_CODES.INVALID_PROPERTY_TYPE,
          'Children must be an array',
          'Provide children as an array of elements',
          undefined,
          'children'
        ));
        return;
      }

      // Check for circular references
      const visited = new Set<string>();
      this.checkCircularReferences(element, visited, errors);
    }
  }

  /**
   * Checks for circular references in element hierarchy
   */
  private checkCircularReferences(element: any, visited: Set<string>, errors: ValidationError[]): void {
    if (!element.id) return;

    if (visited.has(element.id)) {
      errors.push(this.createError(
        ERROR_CODES.CIRCULAR_REFERENCE,
        `Circular reference detected for element: ${element.id}`,
        'Remove circular references in element hierarchy',
        element.id
      ));
      return;
    }

    visited.add(element.id);

    if (element.children) {
      for (const child of element.children) {
        this.checkCircularReferences(child, new Set(visited), errors);
      }
    }
  }

  /**
   * Generates helpful suggestions based on errors and warnings
   */
  private generateSuggestions(
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: string[]
  ): void {
    if (errors.length > 0) {
      suggestions.push('Fix all validation errors before proceeding with component generation');
    }

    if (warnings.length > 0) {
      suggestions.push('Consider addressing warnings to improve component quality');
    }

    // Specific suggestions based on error patterns
    const missingProps = errors.filter(e => e.code === ERROR_CODES.MISSING_REQUIRED_PROPERTY);
    if (missingProps.length > 0) {
      suggestions.push('Ensure all Figma elements have required properties: id, type');
    }

    const styleIssues = warnings.filter(e => e.code === ERROR_CODES.MALFORMED_STYLES);
    if (styleIssues.length > 0) {
      suggestions.push('Review style properties for valid color and dimension values');
    }
  }

  /**
   * Validates color value format
   */
  private isValidColor(color: string): boolean {
    // Check hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Check rgb/rgba colors
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
      return true;
    }
    
    // Check named colors (basic set)
    const namedColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'transparent'];
    return namedColors.includes(color.toLowerCase());
  }

  /**
   * Determines error severity based on error code
   */
  private getErrorSeverity(code: ErrorCode): 'error' | 'critical' {
    const criticalErrors = [
      ERROR_CODES.MISSING_REQUIRED_PROPERTY,
      ERROR_CODES.INVALID_ELEMENT_TYPE,
      ERROR_CODES.CIRCULAR_REFERENCE,
      ERROR_CODES.TYPESCRIPT_ERROR
    ];
    
    return criticalErrors.includes(code) ? 'critical' : 'error';
  }

  /**
   * Logs error for debugging purposes
   */
  private logError(error: ValidationError): void {
    this.errorLog.push(error);
    
    // Console logging with appropriate level
    const logLevel = error.severity === 'critical' ? 'error' : 'warn';
    console[logLevel](`🚨 ${error.code}: ${error.message}`, {
      component: error.component,
      property: error.property,
      suggestion: error.suggestion,
      location: error.location
    });
  }

  /**
   * Finds appropriate recovery strategy for an error
   */
  private findRecoveryStrategy(error: ValidationError): ErrorRecoveryStrategy | undefined {
    return this.recoveryStrategies
      .filter(strategy => strategy.condition(error))
      .sort((a, b) => b.priority - a.priority)[0];
  }

  /**
   * Initializes recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      // Missing required properties recovery
      {
        condition: (error) => error.code === ERROR_CODES.MISSING_REQUIRED_PROPERTY,
        action: (error, context) => this.recoverMissingProperty(error, context),
        priority: 10
      },
      
      // Invalid element type recovery
      {
        condition: (error) => error.code === ERROR_CODES.INVALID_ELEMENT_TYPE,
        action: (error, context) => this.recoverInvalidElementType(error, context),
        priority: 8
      },
      
      // Malformed styles recovery
      {
        condition: (error) => error.code === ERROR_CODES.MALFORMED_STYLES,
        action: (error, context) => this.recoverMalformedStyles(error, context),
        priority: 6
      },
      
      // Invalid dimensions recovery
      {
        condition: (error) => error.code === ERROR_CODES.INVALID_DIMENSIONS,
        action: (error, context) => this.recoverInvalidDimensions(error, context),
        priority: 5
      }
    ];
  }

  /**
   * Recovery strategy for missing required properties
   */
  private recoverMissingProperty(error: ValidationError, context: any): RecoveryResult {
    const { element } = context;
    
    if (error.property === 'id' && !element.id) {
      element.id = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        success: true,
        modifications: [`Added generated ID: ${element.id}`],
        message: 'Generated missing ID for element'
      };
    }
    
    if (error.property === 'type' && !element.type) {
      element.type = 'frame'; // Default to frame
      return {
        success: true,
        modifications: ['Set element type to "frame"'],
        message: 'Set default element type'
      };
    }
    
    return { success: false };
  }

  /**
   * Recovery strategy for invalid element types
   */
  private recoverInvalidElementType(error: ValidationError, context: any): RecoveryResult {
    const { element } = context;
    
    if (element.type) {
      element.type = 'frame'; // Fallback to frame
      return {
        success: true,
        modifications: [`Changed invalid type to "frame"`],
        message: 'Converted unknown element type to frame'
      };
    }
    
    return { success: false };
  }

  /**
   * Recovery strategy for malformed styles
   */
  private recoverMalformedStyles(error: ValidationError, context: any): RecoveryResult {
    const { element } = context;
    
    if (error.property === 'styles.backgroundColor' && element.styles?.backgroundColor) {
      delete element.styles.backgroundColor;
      return {
        success: true,
        modifications: ['Removed invalid background color'],
        message: 'Removed malformed background color'
      };
    }
    
    return { success: false };
  }

  /**
   * Recovery strategy for invalid dimensions
   */
  private recoverInvalidDimensions(error: ValidationError, context: any): RecoveryResult {
    const { element } = context;
    
    if (element.properties) {
      if (error.property === 'properties.width' && element.properties.width <= 0) {
        element.properties.width = 100; // Default width
        return {
          success: true,
          modifications: ['Set width to default value: 100'],
          message: 'Applied default width'
        };
      }
      
      if (error.property === 'properties.height' && element.properties.height <= 0) {
        element.properties.height = 50; // Default height
        return {
          success: true,
          modifications: ['Set height to default value: 50'],
          message: 'Applied default height'
        };
      }
    }
    
    return { success: false };
  }
}

/**
 * Utility function to create error handler instance
 */
export function createErrorHandler(): FigmaElementErrorHandler {
  return new FigmaElementErrorHandler();
}

/**
 * Utility function to validate multiple elements
 */
export function validateElements(elements: any[]): ValidationResult {
  const errorHandler = createErrorHandler();
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  const allSuggestions: string[] = [];

  for (const element of elements) {
    const result = errorHandler.validateElement(element);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    if (result.suggestions) {
      allSuggestions.push(...result.suggestions);
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: [...new Set(allSuggestions)] // Remove duplicates
  };
}