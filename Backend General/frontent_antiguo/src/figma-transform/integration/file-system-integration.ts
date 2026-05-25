/**
 * File system integration for component placement and naming
 * Handles proper file structure following project conventions
 */

import type { 
  GeneratedComponent,
  ProjectConfig,
  ProjectStructure,
  NamingConventions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  IntegrationResult,
  IntegrationConflict,
  ConflictResolution
} from '../types/index.js';

export interface FileSystemOptions {
  createDirectories?: boolean;
  overwriteExisting?: boolean;
  backupExisting?: boolean;
  validatePaths?: boolean;
  resolveConflicts?: boolean;
}

export interface FileSystemResult {
  success: boolean;
  createdFiles: string[];
  createdDirectories: string[];
  conflicts: IntegrationConflict[];
  warnings: ValidationWarning[];
  backupPaths?: string[];
}

export class FileSystemIntegration {
  private projectConfig: ProjectConfig;
  private options: FileSystemOptions;
  private projectRoot: string;

  constructor(
    projectConfig: ProjectConfig, 
    projectRoot: string = '.',
    options: FileSystemOptions = {}
  ) {
    this.projectConfig = projectConfig;
    this.projectRoot = projectRoot;
    this.options = {
      createDirectories: true,
      overwriteExisting: false,
      backupExisting: true,
      validatePaths: true,
      resolveConflicts: true,
      ...options
    };
  }

  /**
   * Integrates a single component into the file system
   */
  async integrateComponent(component: GeneratedComponent): Promise<IntegrationResult> {
    const conflicts: IntegrationConflict[] = [];
    const warnings: ValidationWarning[] = [];
    const modifications: string[] = [];

    try {
      // Validate component structure
      const validationResult = this.validateComponentStructure(component);
      if (!validationResult.isValid) {
        return {
          success: false,
          conflicts: validationResult.errors.map(error => ({
            type: 'TYPE_MISMATCH',
            description: error.message,
            affectedFiles: [component.filePath]
          })),
          warnings: validationResult.warnings
        };
      }

      // Generate proper file path
      const resolvedPath = this.resolveComponentPath(component);
      const updatedComponent = { ...component, filePath: resolvedPath };

      // Check for naming conflicts
      const namingConflicts = await this.checkNamingConflicts(updatedComponent);
      conflicts.push(...namingConflicts);

      // Check for import path conflicts
      const importConflicts = await this.checkImportConflicts(updatedComponent);
      conflicts.push(...importConflicts);

      // Resolve conflicts if enabled
      if (this.options.resolveConflicts && conflicts.length > 0) {
        const resolutionResult = await this.resolveConflicts(updatedComponent, conflicts);
        conflicts.splice(0, conflicts.length, ...resolutionResult.remainingConflicts);
        modifications.push(...resolutionResult.modifications);
      }

      // Validate file system paths
      if (this.options.validatePaths) {
        const pathValidation = this.validateFilePaths(updatedComponent);
        warnings.push(...pathValidation.warnings);
      }

      // Generate final component structure
      const finalComponent = this.applyFileSystemConventions(updatedComponent);

      return {
        success: conflicts.filter(c => c.type !== 'NAME_COLLISION').length === 0,
        component: finalComponent,
        conflicts,
        warnings,
        modifications
      };

    } catch (error) {
      return {
        success: false,
        conflicts: [{
          type: 'DEPENDENCY_MISSING',
          description: `File system integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          affectedFiles: [component.filePath]
        }],
        warnings: []
      };
    }
  }

  /**
   * Integrates multiple components with dependency resolution
   */
  async integrateComponents(components: GeneratedComponent[]): Promise<{
    overall: FileSystemResult;
    individual: Map<string, IntegrationResult>;
  }> {
    const individual = new Map<string, IntegrationResult>();
    const createdFiles: string[] = [];
    const createdDirectories: string[] = [];
    const allConflicts: IntegrationConflict[] = [];
    const allWarnings: ValidationWarning[] = [];

    // Sort components by dependency order
    const sortedComponents = this.sortComponentsByDependencies(components);

    // Process each component
    for (const component of sortedComponents) {
      const result = await this.integrateComponent(component);
      individual.set(component.name, result);

      if (result.success && result.component) {
        createdFiles.push(result.component.filePath);
        
        // Track created directories
        const directory = this.getDirectoryPath(result.component.filePath);
        if (!createdDirectories.includes(directory)) {
          createdDirectories.push(directory);
        }
      }

      allConflicts.push(...result.conflicts);
      allWarnings.push(...result.warnings);
    }

    return {
      overall: {
        success: allConflicts.filter(c => c.type !== 'NAME_COLLISION').length === 0,
        createdFiles,
        createdDirectories,
        conflicts: allConflicts,
        warnings: allWarnings
      },
      individual
    };
  }

  /**
   * Generates proper file structure for a component
   */
  generateFileStructure(component: GeneratedComponent): {
    mainFile: string;
    indexFile?: string;
    testFile?: string;
    storyFile?: string;
    typeFile?: string;
  } {
    const structure = this.projectConfig.structure;
    const conventions = this.projectConfig.conventions;
    
    const componentDir = this.getComponentDirectory(component.name);
    const fileName = this.generateFileName(component.name, conventions.fileNaming);
    
    const result = {
      mainFile: `${componentDir}/${fileName}`
    };

    // Generate additional files based on project structure
    if (structure.testDirectory) {
      const testFileName = fileName.replace('.tsx', '.test.tsx');
      result.testFile = `${componentDir}/__tests__/${testFileName}`;
    }

    // Generate index file for barrel exports
    if (conventions.exportPattern === 'default' || conventions.exportPattern === 'both') {
      result.indexFile = `${componentDir}/index.ts`;
    }

    // Generate type definitions if separate types directory exists
    if (structure.typesDirectory && Object.keys(component.props).length > 0) {
      const typeFileName = fileName.replace('.tsx', '.types.ts');
      result.typeFile = `${structure.srcDirectory}/${structure.typesDirectory}/${typeFileName}`;
    }

    return result;
  }

  /**
   * Resolves import paths based on project structure
   */
  resolveImportPaths(component: GeneratedComponent): GeneratedComponent {
    const resolvedImports = component.imports.map(importStmt => {
      if (importStmt.source.startsWith('@/')) {
        // Resolve alias-based imports
        const relativePath = importStmt.source.replace('@/', '');
        const resolvedSource = this.resolveAliasPath(relativePath);
        return { ...importStmt, source: resolvedSource };
      } else if (importStmt.source.startsWith('./') || importStmt.source.startsWith('../')) {
        // Resolve relative imports
        const resolvedSource = this.resolveRelativePath(component.filePath, importStmt.source);
        return { ...importStmt, source: resolvedSource };
      }
      return importStmt;
    });

    return { ...component, imports: resolvedImports };
  }

  /**
   * Manages component dependencies and import resolution
   */
  resolveDependencies(components: GeneratedComponent[]): {
    resolved: GeneratedComponent[];
    circularDependencies: string[];
    missingDependencies: string[];
  } {
    const componentMap = new Map(components.map(c => [c.name, c]));
    const resolved: GeneratedComponent[] = [];
    const circularDependencies: string[] = [];
    const missingDependencies: string[] = [];

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(components);

    // Detect circular dependencies
    const circular = this.detectCircularDependencies(dependencyGraph);
    circularDependencies.push(...circular);

    // Resolve each component's dependencies
    for (const component of components) {
      const resolvedComponent = this.resolveSingleComponentDependencies(
        component, 
        componentMap, 
        missingDependencies
      );
      resolved.push(resolvedComponent);
    }

    return {
      resolved,
      circularDependencies,
      missingDependencies
    };
  }

  // Private helper methods

  private validateComponentStructure(component: GeneratedComponent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate component name
    if (!component.name || component.name.trim().length === 0) {
      errors.push({
        code: 'INVALID_COMPONENT_NAME',
        message: 'Component name is required',
        severity: 'error'
      });
    }

    // Validate file path
    if (!component.filePath || component.filePath.trim().length === 0) {
      errors.push({
        code: 'INVALID_FILE_PATH',
        message: 'Component file path is required',
        severity: 'error'
      });
    }

    // Validate exports
    if (!component.exports || component.exports.length === 0) {
      errors.push({
        code: 'NO_EXPORTS',
        message: 'Component must have at least one export',
        severity: 'error'
      });
    }

    // Validate JSX content
    if (!component.jsx || component.jsx.trim().length === 0) {
      warnings.push({
        code: 'EMPTY_JSX',
        message: 'Component has empty JSX content'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private resolveComponentPath(component: GeneratedComponent): string {
    const structure = this.projectConfig.structure;
    const conventions = this.projectConfig.conventions;
    
    // Generate proper file name
    const fileName = this.generateFileName(component.name, conventions.fileNaming);
    
    // Generate component directory path
    const componentDir = this.getComponentDirectory(component.name);
    
    return `${componentDir}/${fileName}`;
  }

  private getComponentDirectory(componentName: string): string {
    const structure = this.projectConfig.structure;
    
    // Use project structure to determine component directory
    const baseDir = `${structure.srcDirectory}/${structure.componentsDirectory}`;
    
    // For now, place all components in the main components directory
    // In a more sophisticated implementation, we might categorize components
    return baseDir;
  }

  private generateFileName(componentName: string, convention: string): string {
    switch (convention) {
      case 'ComponentName.tsx':
        return `${componentName}.tsx`;
      case 'component-name.tsx':
        return `${this.toKebabCase(componentName)}.tsx`;
      case 'componentName.tsx':
        return `${this.toCamelCase(componentName)}.tsx`;
      default:
        return `${componentName}.tsx`;
    }
  }

  private async checkNamingConflicts(component: GeneratedComponent): Promise<IntegrationConflict[]> {
    const conflicts: IntegrationConflict[] = [];

    // Check for file name conflicts
    // In a real implementation, this would check the actual file system
    const existingFiles = await this.getExistingFiles();
    
    if (existingFiles.includes(component.filePath)) {
      conflicts.push({
        type: 'NAME_COLLISION',
        description: `File already exists: ${component.filePath}`,
        resolution: {
          strategy: this.options.overwriteExisting ? 'REPLACE' : 'RENAME',
          backupPath: this.options.backupExisting ? `${component.filePath}.backup` : undefined
        },
        affectedFiles: [component.filePath]
      });
    }

    // Check for component name conflicts
    const existingComponents = await this.getExistingComponents();
    
    if (existingComponents.includes(component.name)) {
      conflicts.push({
        type: 'NAME_COLLISION',
        description: `Component name already exists: ${component.name}`,
        resolution: {
          strategy: 'RENAME',
          newName: `${component.name}Generated`
        },
        affectedFiles: [component.filePath]
      });
    }

    return conflicts;
  }

  private async checkImportConflicts(component: GeneratedComponent): Promise<IntegrationConflict[]> {
    const conflicts: IntegrationConflict[] = [];

    // Check for import path conflicts
    for (const importStmt of component.imports) {
      if (importStmt.source.startsWith('./') || importStmt.source.startsWith('../')) {
        // Validate relative import paths
        const resolvedPath = this.resolveRelativePath(component.filePath, importStmt.source);
        const pathExists = await this.pathExists(resolvedPath);
        
        if (!pathExists) {
          conflicts.push({
            type: 'IMPORT_CONFLICT',
            description: `Import path does not exist: ${importStmt.source}`,
            resolution: {
              strategy: 'MANUAL',
              instructions: `Create missing file or update import path: ${importStmt.source}`
            },
            affectedFiles: [component.filePath, resolvedPath]
          });
        }
      }
    }

    return conflicts;
  }

  private async resolveConflicts(
    component: GeneratedComponent, 
    conflicts: IntegrationConflict[]
  ): Promise<{
    remainingConflicts: IntegrationConflict[];
    modifications: string[];
  }> {
    const remainingConflicts: IntegrationConflict[] = [];
    const modifications: string[] = [];

    for (const conflict of conflicts) {
      if (conflict.resolution) {
        switch (conflict.resolution.strategy) {
          case 'RENAME':
            if (conflict.type === 'NAME_COLLISION' && conflict.resolution.newName) {
              component.name = conflict.resolution.newName;
              component.filePath = this.resolveComponentPath(component);
              modifications.push(`Renamed component to ${conflict.resolution.newName}`);
            } else {
              remainingConflicts.push(conflict);
            }
            break;
            
          case 'REPLACE':
            if (this.options.overwriteExisting) {
              modifications.push(`Will overwrite existing file: ${component.filePath}`);
            } else {
              remainingConflicts.push(conflict);
            }
            break;
            
          case 'SKIP':
            modifications.push(`Skipped conflicting component: ${component.name}`);
            break;
            
          default:
            remainingConflicts.push(conflict);
        }
      } else {
        remainingConflicts.push(conflict);
      }
    }

    return { remainingConflicts, modifications };
  }

  private validateFilePaths(component: GeneratedComponent): ValidationResult {
    const warnings: ValidationWarning[] = [];

    // Validate path length
    if (component.filePath.length > 260) { // Windows path limit
      warnings.push({
        code: 'PATH_TOO_LONG',
        message: 'File path exceeds maximum length limit'
      });
    }

    // Validate path characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(component.filePath)) {
      warnings.push({
        code: 'INVALID_PATH_CHARACTERS',
        message: 'File path contains invalid characters'
      });
    }

    // Validate directory structure
    const expectedStructure = this.projectConfig.structure;
    if (!component.filePath.includes(expectedStructure.componentsDirectory)) {
      warnings.push({
        code: 'UNEXPECTED_DIRECTORY',
        message: 'Component is not in the expected components directory'
      });
    }

    return {
      isValid: true,
      errors: [],
      warnings
    };
  }

  private applyFileSystemConventions(component: GeneratedComponent): GeneratedComponent {
    // Apply project-specific file system conventions
    const conventions = this.projectConfig.conventions;
    
    // Ensure proper export pattern
    if (conventions.exportPattern === 'default' && !component.exports.some(exp => exp.isDefault)) {
      component.exports = [{ name: component.name, isDefault: true }];
    }

    // Resolve all import paths
    const resolvedComponent = this.resolveImportPaths(component);

    return resolvedComponent;
  }

  private sortComponentsByDependencies(components: GeneratedComponent[]): GeneratedComponent[] {
    // Simple topological sort based on import dependencies
    const sorted: GeneratedComponent[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (component: GeneratedComponent) => {
      if (visiting.has(component.name)) {
        // Circular dependency detected - add to end
        return;
      }
      
      if (visited.has(component.name)) {
        return;
      }

      visiting.add(component.name);

      // Visit dependencies first (simplified - would need more sophisticated analysis)
      component.imports.forEach(importStmt => {
        if (importStmt.source.startsWith('./') || importStmt.source.startsWith('../')) {
          // Find dependent component
          const dependentComponent = components.find(c => 
            importStmt.source.includes(c.name)
          );
          if (dependentComponent && !visited.has(dependentComponent.name)) {
            visit(dependentComponent);
          }
        }
      });

      visiting.delete(component.name);
      visited.add(component.name);
      sorted.push(component);
    };

    components.forEach(component => {
      if (!visited.has(component.name)) {
        visit(component);
      }
    });

    return sorted;
  }

  private buildDependencyGraph(components: GeneratedComponent[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    components.forEach(component => {
      const dependencies: string[] = [];
      
      component.imports.forEach(importStmt => {
        // Extract component dependencies from imports
        const dependentComponent = components.find(c => 
          importStmt.source.includes(c.name) || 
          importStmt.imports.some(imp => imp.name === c.name)
        );
        
        if (dependentComponent) {
          dependencies.push(dependentComponent.name);
        }
      });

      graph.set(component.name, dependencies);
    });

    return graph;
  }

  private detectCircularDependencies(graph: Map<string, string[]>): string[] {
    const circular: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          circular.push(`${node} -> ${dep}`);
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        hasCycle(node);
      }
    }

    return circular;
  }

  private resolveSingleComponentDependencies(
    component: GeneratedComponent,
    componentMap: Map<string, GeneratedComponent>,
    missingDependencies: string[]
  ): GeneratedComponent {
    const resolvedImports = component.imports.map(importStmt => {
      // Check if import refers to another generated component
      const referencedComponent = Array.from(componentMap.values()).find(c =>
        importStmt.imports.some(imp => imp.name === c.name)
      );

      if (referencedComponent) {
        // Update import path to reference the generated component
        const relativePath = this.calculateRelativePath(
          component.filePath,
          referencedComponent.filePath
        );
        return { ...importStmt, source: relativePath };
      }

      return importStmt;
    });

    return { ...component, imports: resolvedImports };
  }

  // Utility methods

  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
  }

  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private getDirectoryPath(filePath: string): string {
    return filePath.substring(0, filePath.lastIndexOf('/'));
  }

  private resolveAliasPath(aliasPath: string): string {
    // Resolve @/ alias to src directory
    return `${this.projectConfig.structure.srcDirectory}/${aliasPath}`;
  }

  private resolveRelativePath(fromPath: string, relativePath: string): string {
    // Simple relative path resolution
    const fromDir = this.getDirectoryPath(fromPath);
    
    if (relativePath.startsWith('./')) {
      return `${fromDir}/${relativePath.slice(2)}`;
    } else if (relativePath.startsWith('../')) {
      const upLevels = (relativePath.match(/\.\.\//g) || []).length;
      const pathParts = fromDir.split('/');
      const resolvedDir = pathParts.slice(0, -upLevels).join('/');
      const remainingPath = relativePath.replace(/\.\.\//g, '');
      return `${resolvedDir}/${remainingPath}`;
    }
    
    return relativePath;
  }

  private calculateRelativePath(fromPath: string, toPath: string): string {
    const fromParts = this.getDirectoryPath(fromPath).split('/');
    const toParts = this.getDirectoryPath(toPath).split('/');
    
    // Find common base
    let commonLength = 0;
    while (
      commonLength < fromParts.length &&
      commonLength < toParts.length &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }
    
    // Calculate relative path
    const upLevels = fromParts.length - commonLength;
    const downPath = toParts.slice(commonLength);
    
    const relativeParts = Array(upLevels).fill('..').concat(downPath);
    const fileName = toPath.substring(toPath.lastIndexOf('/') + 1, toPath.lastIndexOf('.'));
    
    return relativeParts.length > 0 
      ? `./${relativeParts.join('/')}/${fileName}`
      : `./${fileName}`;
  }

  // Mock methods for file system operations (in real implementation, these would use fs)

  private async getExistingFiles(): Promise<string[]> {
    // Mock implementation - in reality, would scan file system
    return [];
  }

  private async getExistingComponents(): Promise<string[]> {
    // Mock implementation - in reality, would scan for existing components
    return [];
  }

  private async pathExists(path: string): Promise<boolean> {
    // Mock implementation - in reality, would check if path exists
    return true;
  }
}