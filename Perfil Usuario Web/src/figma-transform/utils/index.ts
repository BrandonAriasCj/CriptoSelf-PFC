/**
 * Utility functions export file for Figma to React transformation system
 */

// Naming utilities
export {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  generateComponentName,
  generatePropsInterfaceName,
  generateUniqueComponentName,
  isValidComponentName,
  sanitizeIdentifier
} from './naming.js';

// File path utilities
export {
  generateComponentFilePath,
  generateFileName,
  generateCategoryPath,
  generateTestFilePath,
  generateTypeFilePath,
  generateStoryFilePath,
  generateImportPath,
  generateAliasImportPath,
  ensureDirectoryPath,
  validateFilePath
} from './file-paths.js';

// Code formatting utilities
export {
  formatCode,
  applyIndentation,
  convertToSingleQuotes,
  ensureSemicolons,
  addTrailingCommas,
  trimTrailingWhitespace,
  formatJSXAttributes,
  formatImports,
  formatInterface,
  formatComponent,
  wrapLongLines,
  DEFAULT_FORMATTING_OPTIONS
} from './code-formatting.js';

export type { FormattingOptions } from './code-formatting.js';

// Project configuration utilities
export {
  loadProjectConfig,
  validateProjectConfig
} from './project-config.js';