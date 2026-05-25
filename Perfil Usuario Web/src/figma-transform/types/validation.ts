/**
 * Validation and error handling interfaces
 */

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: string[];
}

// Validation error
export interface ValidationError {
  code: string;
  message: string;
  component?: string;
  property?: string;
  severity: 'error' | 'critical';
  suggestion?: string;
  location?: ErrorLocation;
}

// Validation warning
export interface ValidationWarning {
  code: string;
  message: string;
  component?: string;
  property?: string;
  suggestion?: string;
  location?: ErrorLocation;
}

// Error location information
export interface ErrorLocation {
  file?: string;
  line?: number;
  column?: number;
  elementId?: string;
}

// Integration result
export interface IntegrationResult {
  success: boolean;
  component?: GeneratedComponent;
  conflicts: IntegrationConflict[];
  warnings: ValidationWarning[];
  modifications?: string[];
}

// Integration conflict
export interface IntegrationConflict {
  type: 'NAME_COLLISION' | 'IMPORT_CONFLICT' | 'TYPE_MISMATCH' | 'DEPENDENCY_MISSING';
  description: string;
  resolution?: ConflictResolution;
  affectedFiles?: string[];
}

// Conflict resolution strategy
export interface ConflictResolution {
  strategy: 'RENAME' | 'MERGE' | 'REPLACE' | 'SKIP' | 'MANUAL';
  newName?: string;
  backupPath?: string;
  instructions?: string;
}

// Error recovery strategy
export interface ErrorRecoveryStrategy {
  condition: (error: ValidationError) => boolean;
  action: (error: ValidationError, context: any) => RecoveryResult;
  priority: number;
}

// Recovery result
export interface RecoveryResult {
  success: boolean;
  fallbackComponent?: GeneratedComponent;
  modifications?: string[];
  message?: string;
}

// Fallback strategy
export interface FallbackStrategy {
  condition: (element: FigmaElement) => boolean;
  action: (element: FigmaElement, context: GenerationContext) => GeneratedComponent;
  description: string;
}

// Code quality check result
export interface CodeQualityResult {
  passed: boolean;
  issues: QualityIssue[];
  metrics: QualityMetrics;
  suggestions: string[];
}

// Quality issue
export interface QualityIssue {
  type: 'SYNTAX' | 'TYPE' | 'STYLE' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'SECURITY';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  rule?: string;
  fixable?: boolean;
}

// Quality metrics
export interface QualityMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  bundleSize?: number;
  performanceScore?: number;
  accessibilityScore?: number;
}

// Import from component.ts for type reference
import type { GeneratedComponent } from './component.js';
import type { FigmaElement } from './core.js';
import type { GenerationContext } from './component.js';