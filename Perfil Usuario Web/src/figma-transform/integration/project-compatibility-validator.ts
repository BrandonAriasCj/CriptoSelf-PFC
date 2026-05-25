/**
 * Project compatibility validator for Vite + React + TypeScript + SWC
 * Validates generated code compatibility with existing project configuration
 */

import type { 
  ProjectConfig, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  GeneratedComponent,
  CodeQualityConfig
} from '../types/index.js';

export interface CompatibilityValidationOptions {
  strictMode?: boolean;
  checkDependencies?: boolean;
  validateTypeScript?: boolean;
  checkBuildCompatibility?: boolean;
}

export class ProjectCompatibilityValidator {
  private projectConfig: ProjectConfig;
  private options: CompatibilityValidationOptions;

  constructor(projectConfig: ProjectConfig, options: CompatibilityValidationOptions = {}) {
    this.projectConfig = projectConfig;
    this.options = {
      strictMode: false,
      checkDependencies: true,
      validateTypeScript: true,
      checkBuildCompatibility: true,
      ...options
    };
  }

  /**
   * Validates overall project compatibility
   */
  async validateProjectCompatibility(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate framework compatibility
    const frameworkResult = this.validateFrameworkCompatibility();
    errors.push(...frameworkResult.errors);
    warnings.push(...frameworkResult.warnings);

    // Validate build system compatibility
    if (this.options.checkBuildCompatibility) {
      const buildResult = this.validateBuildSystemCompatibility();
      errors.push(...buildResult.errors);
      warnings.push(...buildResult.warnings);
    }

    // Validate TypeScript configuration
    if (this.options.validateTypeScript && this.projectConfig.typescript) {
      const tsResult = this.validateTypeScriptCompatibility();
      errors.push(...tsResult.errors);
      warnings.push(...tsResult.warnings);
    }

    // Validate dependencies
    if (this.options.checkDependencies) {
      const depsResult = this.validateDependencyCompatibility();
      errors.push(...depsResult.errors);
      warnings.push(...depsResult.warnings);
    }

    // Validate UI library integration
    const uiResult = this.validateUILibraryCompatibility();
    errors.push(...uiResult.errors);
    warnings.push(...uiResult.warnings);

    // Generate suggestions based on findings
    suggestions.push(...this.generateCompatibilitySuggestions(errors, warnings));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validates compatibility of a specific generated component
   */
  async validateComponentCompatibility(component: GeneratedComponent): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate imports compatibility
    const importResult = this.validateComponentImports(component);
    errors.push(...importResult.errors);
    warnings.push(...importResult.warnings);

    // Validate TypeScript types
    if (this.projectConfig.typescript) {
      const typeResult = this.validateComponentTypes(component);
      errors.push(...typeResult.errors);
      warnings.push(...typeResult.warnings);
    }

    // Validate styling compatibility
    const styleResult = this.validateComponentStyling(component);
    errors.push(...styleResult.errors);
    warnings.push(...styleResult.warnings);

    // Validate naming conventions
    const namingResult = this.validateNamingConventions(component);
    errors.push(...namingResult.errors);
    warnings.push(...namingResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates React framework compatibility
   */
  private validateFrameworkCompatibility(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check React version compatibility
    const reactVersion = this.projectConfig.dependencies.react;
    if (!reactVersion) {
      errors.push({
        code: 'REACT_MISSING',
        message: 'React is not installed in the project',
        severity: 'critical',
        suggestion: 'Install React: npm install react react-dom'
      });
    } else {
      const majorVersion = this.extractMajorVersion(reactVersion);
      if (majorVersion < 18) {
        warnings.push({
          code: 'REACT_VERSION_OLD',
          message: `React version ${reactVersion} is older than recommended (18+)`,
          suggestion: 'Consider upgrading to React 18+ for better compatibility'
        });
      }
    }

    // Check React DOM
    const reactDomVersion = this.projectConfig.dependencies['react-dom'];
    if (!reactDomVersion && reactVersion) {
      errors.push({
        code: 'REACT_DOM_MISSING',
        message: 'React DOM is required but not installed',
        severity: 'error',
        suggestion: 'Install React DOM: npm install react-dom'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates Vite + SWC build system compatibility
   */
  private validateBuildSystemCompatibility(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check Vite configuration
    if (this.projectConfig.bundler !== 'vite') {
      warnings.push({
        code: 'BUNDLER_NOT_VITE',
        message: `Project uses ${this.projectConfig.bundler} instead of Vite`,
        suggestion: 'Generated code is optimized for Vite. Consider migration or manual adjustments.'
      });
    }

    // Check SWC compiler
    if (this.projectConfig.compiler !== 'swc') {
      warnings.push({
        code: 'COMPILER_NOT_SWC',
        message: `Project uses ${this.projectConfig.compiler} instead of SWC`,
        suggestion: 'Generated code is optimized for SWC. Performance may vary with other compilers.'
      });
    }

    // Check SWC plugin for Vite
    if (this.projectConfig.bundler === 'vite' && this.projectConfig.compiler === 'swc') {
      const hasSwcPlugin = this.projectConfig.dependencies['@vitejs/plugin-react-swc'];
      if (!hasSwcPlugin) {
        errors.push({
          code: 'VITE_SWC_PLUGIN_MISSING',
          message: 'Vite SWC plugin is required but not installed',
          severity: 'error',
          suggestion: 'Install Vite SWC plugin: npm install -D @vitejs/plugin-react-swc'
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates TypeScript configuration compatibility
   */
  private validateTypeScriptCompatibility(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check TypeScript installation
    const tsVersion = this.projectConfig.dependencies.typescript;
    if (!tsVersion) {
      errors.push({
        code: 'TYPESCRIPT_MISSING',
        message: 'TypeScript is configured but not installed',
        severity: 'error',
        suggestion: 'Install TypeScript: npm install -D typescript @types/react @types/react-dom'
      });
    }

    // Check React type definitions
    const reactTypes = this.projectConfig.dependencies['@types/react'];
    if (!reactTypes && this.projectConfig.dependencies.react) {
      errors.push({
        code: 'REACT_TYPES_MISSING',
        message: 'React type definitions are missing',
        severity: 'error',
        suggestion: 'Install React types: npm install -D @types/react @types/react-dom'
      });
    }

    // Validate TypeScript configuration requirements
    // Note: In a real implementation, this would read and parse tsconfig.json
    const requiredCompilerOptions = {
      jsx: 'react-jsx',
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      isolatedModules: true,
      noEmit: true
    };

    // For now, we'll assume the configuration is correct
    // In a real implementation, we would validate against actual tsconfig.json

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates dependency compatibility
   */
  private validateDependencyCompatibility(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for conflicting dependencies
    const conflicts = this.checkDependencyConflicts();
    errors.push(...conflicts);

    // Check for missing peer dependencies
    const missingPeers = this.checkMissingPeerDependencies();
    warnings.push(...missingPeers);

    // Validate version compatibility
    const versionIssues = this.validateDependencyVersions();
    warnings.push(...versionIssues);

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates Radix UI and Tailwind CSS integration
   */
  private validateUILibraryCompatibility(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check Tailwind CSS
    if (this.projectConfig.styling.framework === 'tailwind') {
      const tailwindVersion = this.projectConfig.dependencies.tailwindcss;
      if (!tailwindVersion) {
        errors.push({
          code: 'TAILWIND_MISSING',
          message: 'Tailwind CSS is configured but not installed',
          severity: 'error',
          suggestion: 'Install Tailwind CSS: npm install -D tailwindcss postcss autoprefixer'
        });
      }

      // Check for required Tailwind utilities
      const requiredUtils = ['clsx', 'tailwind-merge'];
      requiredUtils.forEach(util => {
        if (!this.projectConfig.dependencies[util]) {
          warnings.push({
            code: 'TAILWIND_UTIL_MISSING',
            message: `Recommended utility ${util} is not installed`,
            suggestion: `Install ${util}: npm install ${util}`
          });
        }
      });
    }

    // Check Radix UI components
    if (this.projectConfig.uiLibrary.name === 'radix-ui') {
      const radixComponents = this.projectConfig.dependencies.radixUI || [];
      if (radixComponents.length === 0) {
        warnings.push({
          code: 'RADIX_COMPONENTS_MISSING',
          message: 'No Radix UI components detected',
          suggestion: 'Install Radix UI components as needed: npm install @radix-ui/react-button @radix-ui/react-input'
        });
      }

      // Check for class-variance-authority if using variants
      const cvaVersion = this.projectConfig.dependencies['class-variance-authority'];
      if (!cvaVersion) {
        warnings.push({
          code: 'CVA_MISSING',
          message: 'class-variance-authority is recommended for component variants',
          suggestion: 'Install CVA: npm install class-variance-authority'
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates component imports against project dependencies
   */
  private validateComponentImports(component: GeneratedComponent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    component.imports.forEach(importStmt => {
      // Check if import source is available
      if (importStmt.source.startsWith('@/')) {
        // Internal import - validate path exists
        const relativePath = importStmt.source.replace('@/', '');
        // In a real implementation, we would check if the file exists
      } else if (!importStmt.source.startsWith('.')) {
        // External dependency - check if installed
        const packageName = this.extractPackageName(importStmt.source);
        if (!this.projectConfig.dependencies[packageName]) {
          errors.push({
            code: 'IMPORT_DEPENDENCY_MISSING',
            message: `Component imports ${packageName} but it's not installed`,
            component: component.name,
            severity: 'error',
            suggestion: `Install dependency: npm install ${packageName}`
          });
        }
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates component TypeScript types
   */
  private validateComponentTypes(component: GeneratedComponent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate props interface naming
    const expectedPropsName = this.generatePropsInterfaceName(component.name);
    // In a real implementation, we would parse the JSX and validate type usage

    // Check for proper prop types
    Object.entries(component.props).forEach(([propName, propDef]) => {
      if (!this.isValidTypeScriptType(propDef.type)) {
        errors.push({
          code: 'INVALID_PROP_TYPE',
          message: `Invalid TypeScript type for prop ${propName}: ${propDef.type}`,
          component: component.name,
          property: propName,
          severity: 'error',
          suggestion: 'Use valid TypeScript types (string, number, boolean, etc.)'
        });
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates component styling compatibility
   */
  private validateComponentStyling(component: GeneratedComponent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for Tailwind class usage
    if (this.projectConfig.styling.framework === 'tailwind') {
      // In a real implementation, we would parse JSX and validate Tailwind classes
      const hasClassNameProp = 'className' in component.props;
      if (!hasClassNameProp) {
        warnings.push({
          code: 'MISSING_CLASSNAME_PROP',
          message: 'Component should accept className prop for Tailwind compatibility',
          component: component.name,
          suggestion: 'Add className?: string to component props'
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates naming conventions
   */
  private validateNamingConventions(component: GeneratedComponent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const conventions = this.projectConfig.conventions;

    // Validate component name
    if (!this.validateComponentName(component.name, conventions.componentNaming)) {
      errors.push({
        code: 'INVALID_COMPONENT_NAME',
        message: `Component name ${component.name} doesn't follow ${conventions.componentNaming} convention`,
        component: component.name,
        severity: 'error',
        suggestion: `Use ${conventions.componentNaming} naming convention`
      });
    }

    // Validate file name
    const expectedFileName = this.generateFileName(component.name, conventions.fileNaming);
    if (!component.filePath.endsWith(expectedFileName)) {
      warnings.push({
        code: 'INCONSISTENT_FILE_NAME',
        message: `File name doesn't follow project convention: expected ${expectedFileName}`,
        component: component.name,
        suggestion: `Rename file to follow ${conventions.fileNaming} convention`
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // Helper methods

  private extractMajorVersion(version: string): number {
    const match = version.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private extractPackageName(importPath: string): string {
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      return `${parts[0]}/${parts[1]}`;
    }
    return importPath.split('/')[0];
  }

  private generatePropsInterfaceName(componentName: string): string {
    const convention = this.projectConfig.conventions.propsInterface;
    return convention.replace('ComponentName', componentName);
  }

  private isValidTypeScriptType(type: string): boolean {
    const validTypes = [
      'string', 'number', 'boolean', 'object', 'function', 'undefined', 'null',
      'any', 'unknown', 'never', 'void', 'React.ReactNode', 'React.ComponentProps'
    ];
    
    // Check basic types
    if (validTypes.includes(type)) return true;
    
    // Check for array types
    if (type.endsWith('[]')) return true;
    
    // Check for union types
    if (type.includes('|')) return true;
    
    // Check for generic types
    if (type.includes('<') && type.includes('>')) return true;
    
    return false;
  }

  private validateComponentName(name: string, convention: string): boolean {
    switch (convention) {
      case 'PascalCase':
        return /^[A-Z][a-zA-Z0-9]*$/.test(name);
      case 'camelCase':
        return /^[a-z][a-zA-Z0-9]*$/.test(name);
      default:
        return true;
    }
  }

  private generateFileName(componentName: string, convention: string): string {
    switch (convention) {
      case 'ComponentName.tsx':
        return `${componentName}.tsx`;
      case 'component-name.tsx':
        return `${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}.tsx`;
      case 'componentName.tsx':
        return `${componentName.charAt(0).toLowerCase() + componentName.slice(1)}.tsx`;
      default:
        return `${componentName}.tsx`;
    }
  }

  private checkDependencyConflicts(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for known conflicting packages
    const conflicts = [
      { packages: ['@vitejs/plugin-react', '@vitejs/plugin-react-swc'], message: 'Multiple Vite React plugins detected' }
    ];

    conflicts.forEach(conflict => {
      const installedConflicts = conflict.packages.filter(pkg => 
        this.projectConfig.dependencies[pkg]
      );
      
      if (installedConflicts.length > 1) {
        errors.push({
          code: 'DEPENDENCY_CONFLICT',
          message: conflict.message,
          severity: 'error',
          suggestion: `Remove conflicting packages: ${installedConflicts.slice(1).join(', ')}`
        });
      }
    });

    return errors;
  }

  private checkMissingPeerDependencies(): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Check common peer dependency requirements
    const peerDeps = [
      { package: 'tailwindcss', peers: ['postcss', 'autoprefixer'] },
      { package: '@radix-ui/react-button', peers: ['react', 'react-dom'] }
    ];

    peerDeps.forEach(({ package: pkg, peers }) => {
      if (this.projectConfig.dependencies[pkg]) {
        peers.forEach(peer => {
          if (!this.projectConfig.dependencies[peer]) {
            warnings.push({
              code: 'MISSING_PEER_DEPENDENCY',
              message: `${pkg} requires peer dependency ${peer}`,
              suggestion: `Install peer dependency: npm install ${peer}`
            });
          }
        });
      }
    });

    return warnings;
  }

  private validateDependencyVersions(): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Check for known version compatibility issues
    const versionChecks = [
      {
        package: 'react',
        minVersion: '18.0.0',
        message: 'React 18+ is recommended for optimal compatibility'
      },
      {
        package: 'typescript',
        minVersion: '5.0.0',
        message: 'TypeScript 5+ is recommended for better type inference'
      }
    ];

    versionChecks.forEach(check => {
      const version = this.projectConfig.dependencies[check.package];
      if (version && this.isVersionLower(version, check.minVersion)) {
        warnings.push({
          code: 'VERSION_OUTDATED',
          message: `${check.package} version ${version} is below recommended ${check.minVersion}`,
          suggestion: check.message
        });
      }
    });

    return warnings;
  }

  private isVersionLower(current: string, minimum: string): boolean {
    // Simple version comparison - in a real implementation, use semver library
    const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
    const minimumParts = minimum.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const minimumPart = minimumParts[i] || 0;
      
      if (currentPart < minimumPart) return true;
      if (currentPart > minimumPart) return false;
    }
    
    return false;
  }

  private generateCompatibilitySuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.length > 0) {
      suggestions.push('Fix critical compatibility issues before proceeding with component generation');
    }
    
    if (warnings.length > 0) {
      suggestions.push('Consider addressing compatibility warnings for optimal integration');
    }
    
    // Add specific suggestions based on project configuration
    if (this.projectConfig.bundler !== 'vite') {
      suggestions.push('Consider migrating to Vite for optimal performance with generated components');
    }
    
    if (this.projectConfig.compiler !== 'swc') {
      suggestions.push('Consider using SWC compiler for faster build times');
    }
    
    return suggestions;
  }
}