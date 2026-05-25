/**
 * Code quality checker for syntax validation and best practices
 * Validates TypeScript syntax and adherence to project coding conventions
 */

import type { 
  GeneratedComponent,
  CodeQualityResult,
  QualityIssue,
  QualityMetrics,
  ProjectConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types/index.js';

export interface CodeQualityOptions {
  checkSyntax?: boolean;
  checkTypes?: boolean;
  checkStyle?: boolean;
  checkPerformance?: boolean;
  checkAccessibility?: boolean;
  checkSecurity?: boolean;
  strictMode?: boolean;
}

export class CodeQualityChecker {
  private projectConfig: ProjectConfig;
  private options: CodeQualityOptions;

  constructor(projectConfig: ProjectConfig, options: CodeQualityOptions = {}) {
    this.projectConfig = projectConfig;
    this.options = {
      checkSyntax: true,
      checkTypes: true,
      checkStyle: true,
      checkPerformance: true,
      checkAccessibility: true,
      checkSecurity: true,
      strictMode: false,
      ...options
    };
  }

  /**
   * Performs comprehensive code quality analysis on generated component
   */
  async analyzeComponent(component: GeneratedComponent): Promise<CodeQualityResult> {
    const issues: QualityIssue[] = [];
    const suggestions: string[] = [];

    // Syntax validation
    if (this.options.checkSyntax) {
      const syntaxIssues = this.validateSyntax(component);
      issues.push(...syntaxIssues);
    }

    // TypeScript type validation
    if (this.options.checkTypes && this.projectConfig.typescript) {
      const typeIssues = this.validateTypes(component);
      issues.push(...typeIssues);
    }

    // Code style validation
    if (this.options.checkStyle) {
      const styleIssues = this.validateCodeStyle(component);
      issues.push(...styleIssues);
    }

    // Performance checks
    if (this.options.checkPerformance) {
      const performanceIssues = this.validatePerformance(component);
      issues.push(...performanceIssues);
    }

    // Accessibility checks
    if (this.options.checkAccessibility) {
      const a11yIssues = this.validateAccessibility(component);
      issues.push(...a11yIssues);
    }

    // Security checks
    if (this.options.checkSecurity) {
      const securityIssues = this.validateSecurity(component);
      issues.push(...securityIssues);
    }

    // Calculate quality metrics
    const metrics = this.calculateQualityMetrics(component, issues);

    // Generate suggestions
    suggestions.push(...this.generateQualitySuggestions(issues, metrics));

    return {
      passed: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      metrics,
      suggestions
    };
  }

  /**
   * Validates multiple components and provides aggregate results
   */
  async analyzeComponents(components: GeneratedComponent[]): Promise<{
    overall: CodeQualityResult;
    individual: Map<string, CodeQualityResult>;
  }> {
    const individual = new Map<string, CodeQualityResult>();
    const allIssues: QualityIssue[] = [];
    const allSuggestions: string[] = [];

    // Analyze each component
    for (const component of components) {
      const result = await this.analyzeComponent(component);
      individual.set(component.name, result);
      allIssues.push(...result.issues);
      allSuggestions.push(...result.suggestions);
    }

    // Calculate overall metrics
    const overallMetrics = this.calculateAggregateMetrics(Array.from(individual.values()));

    return {
      overall: {
        passed: allIssues.filter(issue => issue.severity === 'error').length === 0,
        issues: allIssues,
        metrics: overallMetrics,
        suggestions: [...new Set(allSuggestions)] // Remove duplicates
      },
      individual
    };
  }

  /**
   * Validates TypeScript syntax and JSX structure
   */
  private validateSyntax(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Validate JSX syntax
    const jsxIssues = this.validateJSXSyntax(component.jsx);
    issues.push(...jsxIssues);

    // Validate import statements
    const importIssues = this.validateImportSyntax(component.imports);
    issues.push(...importIssues);

    // Validate export statements
    const exportIssues = this.validateExportSyntax(component.exports);
    issues.push(...exportIssues);

    // Validate component structure
    const structureIssues = this.validateComponentStructure(component);
    issues.push(...structureIssues);

    return issues;
  }

  /**
   * Validates TypeScript types and interfaces
   */
  private validateTypes(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Validate prop types
    Object.entries(component.props).forEach(([propName, propDef]) => {
      if (!this.isValidTypeScriptType(propDef.type)) {
        issues.push({
          type: 'TYPE',
          severity: 'error',
          message: `Invalid TypeScript type for prop '${propName}': ${propDef.type}`,
          file: component.filePath,
          rule: 'valid-prop-types',
          fixable: true
        });
      }

      // Check for missing required prop documentation
      if (propDef.required && !propDef.description) {
        issues.push({
          type: 'TYPE',
          severity: 'warning',
          message: `Required prop '${propName}' should have a description`,
          file: component.filePath,
          rule: 'prop-documentation'
        });
      }
    });

    // Validate React component type
    if (!this.hasValidReactComponentType(component)) {
      issues.push({
        type: 'TYPE',
        severity: 'error',
        message: 'Component should have proper React component type annotation',
        file: component.filePath,
        rule: 'react-component-type',
        fixable: true
      });
    }

    // Check for proper children prop typing
    if ('children' in component.props) {
      const childrenType = component.props.children.type;
      if (!['React.ReactNode', 'ReactNode', 'React.PropsWithChildren'].some(validType => 
        childrenType.includes(validType)
      )) {
        issues.push({
          type: 'TYPE',
          severity: 'warning',
          message: 'Children prop should use React.ReactNode type',
          file: component.filePath,
          rule: 'children-prop-type',
          fixable: true
        });
      }
    }

    return issues;
  }

  /**
   * Validates code style and formatting
   */
  private validateCodeStyle(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check naming conventions
    const namingIssues = this.validateNamingConventions(component);
    issues.push(...namingIssues);

    // Check JSX formatting
    const formattingIssues = this.validateJSXFormatting(component.jsx);
    issues.push(...formattingIssues);

    // Check import organization
    const importOrganizationIssues = this.validateImportOrganization(component.imports);
    issues.push(...importOrganizationIssues);

    // Check for consistent indentation
    const indentationIssues = this.validateIndentation(component.jsx);
    issues.push(...indentationIssues);

    return issues;
  }

  /**
   * Validates performance best practices
   */
  private validatePerformance(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for unnecessary re-renders
    if (this.hasUnnecessaryReRenders(component)) {
      issues.push({
        type: 'PERFORMANCE',
        severity: 'warning',
        message: 'Component may cause unnecessary re-renders',
        file: component.filePath,
        rule: 'avoid-unnecessary-rerenders',
        fixable: true
      });
    }

    // Check for missing React.memo opportunities
    if (this.shouldUseMemo(component)) {
      issues.push({
        type: 'PERFORMANCE',
        severity: 'info',
        message: 'Consider wrapping component with React.memo for performance',
        file: component.filePath,
        rule: 'consider-memo'
      });
    }

    // Check for large bundle size contributors
    const bundleSizeIssues = this.validateBundleSize(component);
    issues.push(...bundleSizeIssues);

    // Check for inefficient CSS class usage
    const cssEfficiencyIssues = this.validateCSSEfficiency(component);
    issues.push(...cssEfficiencyIssues);

    return issues;
  }

  /**
   * Validates accessibility compliance
   */
  private validateAccessibility(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for missing ARIA attributes
    const ariaIssues = this.validateARIAAttributes(component.jsx);
    issues.push(...ariaIssues);

    // Check for semantic HTML usage
    const semanticIssues = this.validateSemanticHTML(component.jsx);
    issues.push(...semanticIssues);

    // Check for keyboard navigation support
    const keyboardIssues = this.validateKeyboardNavigation(component.jsx);
    issues.push(...keyboardIssues);

    // Check for color contrast (if color information is available)
    const contrastIssues = this.validateColorContrast(component);
    issues.push(...contrastIssues);

    return issues;
  }

  /**
   * Validates security best practices
   */
  private validateSecurity(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for XSS vulnerabilities
    const xssIssues = this.validateXSSPrevention(component.jsx);
    issues.push(...xssIssues);

    // Check for unsafe HTML usage
    const unsafeHTMLIssues = this.validateUnsafeHTML(component.jsx);
    issues.push(...unsafeHTMLIssues);

    // Check for secure prop handling
    const propSecurityIssues = this.validatePropSecurity(component);
    issues.push(...propSecurityIssues);

    return issues;
  }

  // Syntax validation helpers

  private validateJSXSyntax(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for unclosed tags
    const openTags = jsx.match(/<[^/][^>]*>/g) || [];
    const closeTags = jsx.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      issues.push({
        type: 'SYNTAX',
        severity: 'error',
        message: 'Mismatched JSX tags detected',
        file: '',
        rule: 'jsx-tag-matching',
        fixable: false
      });
    }

    // Check for proper JSX attribute syntax
    const invalidAttributes = jsx.match(/\s[a-zA-Z-]+=[^"'{]/g);
    if (invalidAttributes) {
      issues.push({
        type: 'SYNTAX',
        severity: 'error',
        message: 'JSX attributes must be properly quoted',
        file: '',
        rule: 'jsx-attribute-quotes',
        fixable: true
      });
    }

    // Check for self-closing tags
    const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    voidElements.forEach(element => {
      const regex = new RegExp(`<${element}[^>]*(?<!/)>`, 'g');
      if (regex.test(jsx)) {
        issues.push({
          type: 'SYNTAX',
          severity: 'warning',
          message: `${element} should be self-closing in JSX`,
          file: '',
          rule: 'jsx-self-closing',
          fixable: true
        });
      }
    });

    return issues;
  }

  private validateImportSyntax(imports: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    imports.forEach(importStmt => {
      // Check for valid import syntax
      if (!importStmt.source || !importStmt.imports) {
        issues.push({
          type: 'SYNTAX',
          severity: 'error',
          message: 'Invalid import statement structure',
          file: '',
          rule: 'valid-import-syntax',
          fixable: false
        });
      }

      // Check for unused imports (simplified check)
      importStmt.imports.forEach((imp: any) => {
        if (!imp.name) {
          issues.push({
            type: 'SYNTAX',
            severity: 'error',
            message: 'Import must have a name',
            file: '',
            rule: 'import-name-required',
            fixable: false
          });
        }
      });
    });

    return issues;
  }

  private validateExportSyntax(exports: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    if (exports.length === 0) {
      issues.push({
        type: 'SYNTAX',
        severity: 'error',
        message: 'Component must have at least one export',
        file: '',
        rule: 'export-required',
        fixable: false
      });
    }

    exports.forEach(exp => {
      if (!exp.name) {
        issues.push({
          type: 'SYNTAX',
          severity: 'error',
          message: 'Export must have a name',
          file: '',
          rule: 'export-name-required',
          fixable: false
        });
      }
    });

    return issues;
  }

  private validateComponentStructure(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check if component has props interface
    if (Object.keys(component.props).length > 0) {
      // In a real implementation, we would check if the props interface is properly defined
      // For now, we'll assume it's correct if props exist
    }

    // Check for proper component naming
    if (!component.name || component.name.length === 0) {
      issues.push({
        type: 'SYNTAX',
        severity: 'error',
        message: 'Component must have a valid name',
        file: component.filePath,
        rule: 'component-name-required',
        fixable: false
      });
    }

    return issues;
  }

  // Type validation helpers

  private isValidTypeScriptType(type: string): boolean {
    const validTypes = [
      'string', 'number', 'boolean', 'object', 'function', 'undefined', 'null',
      'any', 'unknown', 'never', 'void', 'React.ReactNode', 'React.ComponentProps',
      'ReactNode', 'ComponentProps', 'HTMLElement', 'HTMLDivElement'
    ];
    
    // Check basic types
    if (validTypes.includes(type)) return true;
    
    // Check for array types
    if (type.endsWith('[]')) return true;
    
    // Check for union types
    if (type.includes('|')) return true;
    
    // Check for generic types
    if (type.includes('<') && type.includes('>')) return true;
    
    // Check for function types
    if (type.includes('=>') || type.startsWith('(')) return true;
    
    return false;
  }

  private hasValidReactComponentType(component: GeneratedComponent): boolean {
    // In a real implementation, we would parse the component code
    // For now, we'll assume it's valid if it has proper structure
    return component.jsx.length > 0 && component.name.length > 0;
  }

  // Style validation helpers

  private validateNamingConventions(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const conventions = this.projectConfig.conventions;

    // Validate component name
    if (!this.validateComponentName(component.name, conventions.componentNaming)) {
      issues.push({
        type: 'STYLE',
        severity: 'error',
        message: `Component name should follow ${conventions.componentNaming} convention`,
        file: component.filePath,
        rule: 'component-naming-convention',
        fixable: true
      });
    }

    // Validate prop names (should be camelCase)
    Object.keys(component.props).forEach(propName => {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(propName) && propName !== 'className') {
        issues.push({
          type: 'STYLE',
          severity: 'warning',
          message: `Prop name '${propName}' should use camelCase`,
          file: component.filePath,
          rule: 'prop-naming-convention',
          fixable: true
        });
      }
    });

    return issues;
  }

  private validateJSXFormatting(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for proper spacing around JSX expressions
    const improperSpacing = jsx.match(/\{[^ ]|[^ ]\}/g);
    if (improperSpacing) {
      issues.push({
        type: 'STYLE',
        severity: 'warning',
        message: 'JSX expressions should have proper spacing',
        file: '',
        rule: 'jsx-expression-spacing',
        fixable: true
      });
    }

    // Check for consistent quote usage
    const mixedQuotes = jsx.includes('"') && jsx.includes("'");
    if (mixedQuotes) {
      issues.push({
        type: 'STYLE',
        severity: 'warning',
        message: 'Use consistent quotes in JSX attributes',
        file: '',
        rule: 'jsx-quote-consistency',
        fixable: true
      });
    }

    return issues;
  }

  private validateImportOrganization(imports: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check import order (React first, then third-party, then local)
    let lastImportType = 0; // 0: React, 1: third-party, 2: local
    
    imports.forEach((importStmt, index) => {
      let currentType = 2; // default to local
      
      if (importStmt.source === 'react') {
        currentType = 0;
      } else if (!importStmt.source.startsWith('.') && !importStmt.source.startsWith('@/')) {
        currentType = 1;
      }
      
      if (currentType < lastImportType) {
        issues.push({
          type: 'STYLE',
          severity: 'warning',
          message: 'Imports should be ordered: React, third-party, local',
          file: '',
          rule: 'import-order',
          fixable: true
        });
      }
      
      lastImportType = Math.max(lastImportType, currentType);
    });

    return issues;
  }

  private validateIndentation(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for consistent indentation (simplified check)
    const lines = jsx.split('\n');
    let expectedIndent = 0;
    
    lines.forEach((line, index) => {
      if (line.trim().length === 0) return;
      
      const actualIndent = line.length - line.trimStart().length;
      
      // This is a simplified check - in reality, we'd need more sophisticated parsing
      if (line.includes('<') && !line.includes('</')) {
        expectedIndent += 2;
      }
      if (line.includes('</')) {
        expectedIndent -= 2;
      }
    });

    return issues;
  }

  // Performance validation helpers

  private hasUnnecessaryReRenders(component: GeneratedComponent): boolean {
    // Check for inline object/function creation in JSX
    const jsx = component.jsx;
    return jsx.includes('{}') || jsx.includes('=>') || jsx.includes('function');
  }

  private shouldUseMemo(component: GeneratedComponent): boolean {
    // Suggest memo for components with many props or complex rendering
    return Object.keys(component.props).length > 5;
  }

  private validateBundleSize(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for large imports that might affect bundle size
    const heavyImports = ['lodash', 'moment', 'date-fns'];
    
    component.imports.forEach(importStmt => {
      if (heavyImports.some(heavy => importStmt.source.includes(heavy))) {
        issues.push({
          type: 'PERFORMANCE',
          severity: 'warning',
          message: `Consider tree-shaking or alternatives for ${importStmt.source}`,
          file: component.filePath,
          rule: 'bundle-size-optimization'
        });
      }
    });

    return issues;
  }

  private validateCSSEfficiency(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for redundant Tailwind classes
    const jsx = component.jsx;
    const classNameMatches = jsx.match(/className="([^"]*)"/g);
    
    if (classNameMatches) {
      classNameMatches.forEach(match => {
        const classes = match.replace(/className="|"/g, '').split(' ');
        const duplicates = classes.filter((cls, index) => classes.indexOf(cls) !== index);
        
        if (duplicates.length > 0) {
          issues.push({
            type: 'PERFORMANCE',
            severity: 'warning',
            message: 'Duplicate CSS classes detected',
            file: component.filePath,
            rule: 'no-duplicate-classes',
            fixable: true
          });
        }
      });
    }

    return issues;
  }

  // Accessibility validation helpers

  private validateARIAAttributes(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for interactive elements without proper ARIA
    const interactiveElements = ['button', 'input', 'select', 'textarea'];
    
    interactiveElements.forEach(element => {
      const regex = new RegExp(`<${element}[^>]*>`, 'g');
      const matches = jsx.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          if (!match.includes('aria-label') && !match.includes('aria-labelledby')) {
            issues.push({
              type: 'ACCESSIBILITY',
              severity: 'warning',
              message: `${element} should have aria-label or aria-labelledby`,
              file: '',
              rule: 'interactive-aria-label'
            });
          }
        });
      }
    });

    return issues;
  }

  private validateSemanticHTML(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for div soup (too many nested divs)
    const divCount = (jsx.match(/<div/g) || []).length;
    const totalElements = (jsx.match(/<[^/]/g) || []).length;
    
    if (divCount / totalElements > 0.7) {
      issues.push({
        type: 'ACCESSIBILITY',
        severity: 'warning',
        message: 'Consider using semantic HTML elements instead of divs',
        file: '',
        rule: 'semantic-html-usage'
      });
    }

    return issues;
  }

  private validateKeyboardNavigation(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for onClick without onKeyDown
    if (jsx.includes('onClick') && !jsx.includes('onKeyDown')) {
      issues.push({
        type: 'ACCESSIBILITY',
        severity: 'warning',
        message: 'Interactive elements should support keyboard navigation',
        file: '',
        rule: 'keyboard-navigation'
      });
    }

    return issues;
  }

  private validateColorContrast(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // This would require color analysis - placeholder for now
    // In a real implementation, we would extract colors and check contrast ratios

    return issues;
  }

  // Security validation helpers

  private validateXSSPrevention(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for dangerouslySetInnerHTML usage
    if (jsx.includes('dangerouslySetInnerHTML')) {
      issues.push({
        type: 'SECURITY',
        severity: 'error',
        message: 'Avoid dangerouslySetInnerHTML to prevent XSS attacks',
        file: '',
        rule: 'no-dangerous-html'
      });
    }

    return issues;
  }

  private validateUnsafeHTML(jsx: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for eval usage (should never be in JSX, but good to check)
    if (jsx.includes('eval(')) {
      issues.push({
        type: 'SECURITY',
        severity: 'error',
        message: 'Never use eval() in React components',
        file: '',
        rule: 'no-eval'
      });
    }

    return issues;
  }

  private validatePropSecurity(component: GeneratedComponent): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for props that might contain sensitive data
    const sensitiveProps = ['password', 'token', 'secret', 'key'];
    
    Object.keys(component.props).forEach(propName => {
      if (sensitiveProps.some(sensitive => propName.toLowerCase().includes(sensitive))) {
        issues.push({
          type: 'SECURITY',
          severity: 'warning',
          message: `Prop '${propName}' might contain sensitive data`,
          file: component.filePath,
          rule: 'sensitive-prop-handling'
        });
      }
    });

    return issues;
  }

  // Metrics calculation

  private calculateQualityMetrics(component: GeneratedComponent, issues: QualityIssue[]): QualityMetrics {
    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    
    // Calculate complexity based on component structure
    const complexity = this.calculateComplexity(component);
    
    // Calculate maintainability score (0-100)
    const maintainability = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5) - (complexity * 2));
    
    // Calculate accessibility score based on a11y issues
    const a11yIssues = issues.filter(issue => issue.type === 'ACCESSIBILITY').length;
    const accessibilityScore = Math.max(0, 100 - (a11yIssues * 15));
    
    // Estimate bundle size impact
    const bundleSize = this.estimateBundleSize(component);
    
    return {
      complexity,
      maintainability,
      accessibilityScore,
      bundleSize
    };
  }

  private calculateAggregateMetrics(results: CodeQualityResult[]): QualityMetrics {
    if (results.length === 0) {
      return { complexity: 0, maintainability: 100, accessibilityScore: 100 };
    }

    const avgComplexity = results.reduce((sum, r) => sum + r.metrics.complexity, 0) / results.length;
    const avgMaintainability = results.reduce((sum, r) => sum + r.metrics.maintainability, 0) / results.length;
    const avgAccessibility = results.reduce((sum, r) => sum + (r.metrics.accessibilityScore || 100), 0) / results.length;
    const totalBundleSize = results.reduce((sum, r) => sum + (r.metrics.bundleSize || 0), 0);

    return {
      complexity: Math.round(avgComplexity),
      maintainability: Math.round(avgMaintainability),
      accessibilityScore: Math.round(avgAccessibility),
      bundleSize: totalBundleSize
    };
  }

  private calculateComplexity(component: GeneratedComponent): number {
    let complexity = 1; // Base complexity
    
    // Add complexity for props
    complexity += Object.keys(component.props).length * 0.5;
    
    // Add complexity for imports
    complexity += component.imports.length * 0.2;
    
    // Add complexity for JSX nesting (simplified)
    const nestingLevel = (component.jsx.match(/</g) || []).length;
    complexity += nestingLevel * 0.1;
    
    return Math.round(complexity);
  }

  private estimateBundleSize(component: GeneratedComponent): number {
    // Rough estimation based on component structure
    let size = 1000; // Base size in bytes
    
    // Add size for props
    size += Object.keys(component.props).length * 50;
    
    // Add size for imports
    size += component.imports.length * 100;
    
    // Add size for JSX content
    size += component.jsx.length;
    
    return size;
  }

  private generateQualitySuggestions(issues: QualityIssue[], metrics: QualityMetrics): string[] {
    const suggestions: string[] = [];
    
    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    
    if (errorCount > 0) {
      suggestions.push(`Fix ${errorCount} critical error${errorCount > 1 ? 's' : ''} before deployment`);
    }
    
    if (warningCount > 5) {
      suggestions.push('Consider addressing warnings to improve code quality');
    }
    
    if (metrics.complexity > 10) {
      suggestions.push('Consider breaking down complex components into smaller ones');
    }
    
    if (metrics.maintainability < 70) {
      suggestions.push('Improve code maintainability by addressing style and structure issues');
    }
    
    if (metrics.accessibilityScore && metrics.accessibilityScore < 80) {
      suggestions.push('Improve accessibility by adding proper ARIA attributes and semantic HTML');
    }
    
    return suggestions;
  }

  // Helper methods

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
}