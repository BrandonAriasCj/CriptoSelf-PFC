/**
 * File path generation utilities following project conventions
 */

import { toKebabCase, toPascalCase } from './naming.js';
import type { ProjectStructure, NamingConventions } from '../types/index.js';

/**
 * Generates component file path based on naming conventions
 * @param componentName - Component name in PascalCase
 * @param conventions - Project naming conventions
 * @param structure - Project structure configuration
 * @returns Complete file path for the component
 */
export function generateComponentFilePath(
  componentName: string,
  conventions: NamingConventions,
  structure: ProjectStructure
): string {
  const fileName = generateFileName(componentName, conventions.fileNaming);
  return joinPaths(structure.srcDirectory, structure.componentsDirectory, fileName);
}

/**
 * Generates file name based on naming convention
 * @param componentName - Component name in PascalCase
 * @param convention - File naming convention
 * @returns File name with extension
 */
export function generateFileName(
  componentName: string,
  convention: 'ComponentName.tsx' | 'component-name.tsx' | 'componentName.tsx'
): string {
  switch (convention) {
    case 'ComponentName.tsx':
      return `${componentName}.tsx`; // Assume componentName is already in PascalCase
    case 'component-name.tsx':
      return `${toKebabCase(componentName)}.tsx`;
    case 'componentName.tsx':
      return `${componentName.charAt(0).toLowerCase() + componentName.slice(1)}.tsx`;
    default:
      return `${componentName}.tsx`;
  }
}

/**
 * Generates directory path for component category
 * @param category - Component category (e.g., 'ui', 'forms', 'layout')
 * @param structure - Project structure configuration
 * @returns Directory path for the category
 */
export function generateCategoryPath(
  category: string,
  structure: ProjectStructure
): string {
  const categoryDir = toKebabCase(category);
  return joinPaths(structure.srcDirectory, structure.componentsDirectory, categoryDir);
}

/**
 * Generates test file path for a component
 * @param componentName - Component name in PascalCase
 * @param conventions - Project naming conventions
 * @param structure - Project structure configuration
 * @returns Test file path
 */
export function generateTestFilePath(
  componentName: string,
  conventions: NamingConventions,
  structure: ProjectStructure
): string {
  const baseFileName = generateFileName(componentName, conventions.fileNaming);
  const testFileName = baseFileName.replace('.tsx', '.test.tsx');
  
  if (structure.testDirectory) {
    return joinPaths(structure.testDirectory, 'components', testFileName);
  }
  
  // Co-locate tests with components if no test directory
  const componentDir = generateCategoryPath('', structure);
  return joinPaths(componentDir, testFileName);
}

/**
 * Generates type definition file path
 * @param componentName - Component name in PascalCase
 * @param structure - Project structure configuration
 * @returns Type definition file path
 */
export function generateTypeFilePath(
  componentName: string,
  structure: ProjectStructure
): string {
  const fileName = `${toKebabCase(componentName)}.types.ts`;
  return joinPaths(structure.srcDirectory, structure.typesDirectory, fileName);
}

/**
 * Generates story file path for Storybook
 * @param componentName - Component name in PascalCase
 * @param conventions - Project naming conventions
 * @param structure - Project structure configuration
 * @returns Story file path
 */
export function generateStoryFilePath(
  componentName: string,
  conventions: NamingConventions,
  structure: ProjectStructure
): string {
  const baseFileName = generateFileName(componentName, conventions.fileNaming);
  const storyFileName = baseFileName.replace('.tsx', '.stories.tsx');
  
  return joinPaths(structure.srcDirectory, structure.componentsDirectory, storyFileName);
}

/**
 * Generates import path for a component relative to another file
 * @param fromPath - Path of the file importing the component
 * @param toPath - Path of the component being imported
 * @returns Relative import path
 */
export function generateImportPath(fromPath: string, toPath: string): string {
  const relativePath = getRelativePath(fromPath, toPath);
  
  // Remove file extension for imports
  return relativePath.replace(/\.tsx?$/, '');
}

/**
 * Generates absolute import path using project aliases
 * @param componentPath - Component file path
 * @param structure - Project structure configuration
 * @param alias - Import alias (e.g., '@', '@/components')
 * @returns Absolute import path with alias
 */
export function generateAliasImportPath(
  componentPath: string,
  structure: ProjectStructure,
  alias: string = '@'
): string {
  // Remove src directory from path if using @ alias
  if (alias === '@' && componentPath.startsWith(structure.srcDirectory)) {
    const relativePath = componentPath.substring(structure.srcDirectory.length + 1);
    return `${alias}/${relativePath}`.replace(/\.tsx?$/, '');
  }
  
  return componentPath.replace(/\.tsx?$/, '');
}

/**
 * Ensures directory exists in the path structure
 * @param filePath - Complete file path
 * @returns Directory path that should be created
 */
export function ensureDirectoryPath(filePath: string): string {
  const pathParts = filePath.split('/');
  pathParts.pop(); // Remove file name
  return pathParts.join('/');
}

/**
 * Validates if a file path follows project conventions
 * @param filePath - File path to validate
 * @param structure - Project structure configuration
 * @returns Validation result with suggestions
 */
export function validateFilePath(
  filePath: string,
  structure: ProjectStructure
): { isValid: boolean; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check if path starts with src directory
  if (!filePath.startsWith(structure.srcDirectory)) {
    issues.push('File path should start with src directory');
    suggestions.push(`Move file to ${structure.srcDirectory} directory`);
  }
  
  // Check file extension
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
    issues.push('File should have .tsx or .ts extension');
    suggestions.push('Use .tsx for components, .ts for utilities');
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9\/\-_.]+$/.test(filePath)) {
    issues.push('File path contains invalid characters');
    suggestions.push('Use only letters, numbers, hyphens, underscores, and dots');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Utility function to join path segments
 * @param segments - Path segments to join
 * @returns Joined path
 */
function joinPaths(...segments: string[]): string {
  return segments
    .filter(segment => segment && segment.length > 0)
    .join('/')
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Utility function to get relative path between two paths
 * @param from - Source path
 * @param to - Target path
 * @returns Relative path
 */
function getRelativePath(from: string, to: string): string {
  const fromParts = from.split('/').filter(part => part.length > 0);
  const toParts = to.split('/').filter(part => part.length > 0);
  
  // Remove file name from 'from' path
  fromParts.pop();
  
  // Find common base
  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength++;
  }
  
  // Build relative path
  const upLevels = fromParts.length - commonLength;
  const relativeParts = Array(upLevels).fill('..').concat(toParts.slice(commonLength));
  
  const relativePath = relativeParts.join('/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}