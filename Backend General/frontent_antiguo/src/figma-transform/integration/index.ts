/**
 * Integration module exports
 * Provides project compatibility validation, code quality checking, and file system integration
 */

export { ProjectCompatibilityValidator } from './project-compatibility-validator.js';
export type { CompatibilityValidationOptions } from './project-compatibility-validator.js';

export { CodeQualityChecker } from './code-quality-checker.js';
export type { CodeQualityOptions } from './code-quality-checker.js';

export { FileSystemIntegration } from './file-system-integration.js';
export type { 
  FileSystemOptions, 
  FileSystemResult 
} from './file-system-integration.js';

export { IntegrationManager } from './integration-manager.js';
export type { 
  IntegrationManagerOptions,
  IntegrationManagerResult,
  BatchIntegrationResult
} from './integration-manager.js';