/**
 * Integration Manager - Orchestrates project compatibility validation, 
 * code quality checking, and file system integration
 */

import { ProjectCompatibilityValidator } from './project-compatibility-validator.js';
import { CodeQualityChecker } from './code-quality-checker.js';
import { FileSystemIntegration } from './file-system-integration.js';

import type { 
  ProjectConfig,
  GeneratedComponent,
  ValidationResult,
  CodeQualityResult,
  IntegrationResult,
  FileSystemResult
} from '../types/index.js';

export interface IntegrationManagerOptions {
  validateCompatibility?: boolean;
  checkCodeQuality?: boolean;
  integrateFileSystem?: boolean;
  strictMode?: boolean;
  continueOnWarnings?: boolean;
  continueOnErrors?: boolean;
}

export interface IntegrationManagerResult {
  success: boolean;
  compatibility?: ValidationResult;
  codeQuality?: CodeQualityResult;
  fileSystem?: IntegrationResult;
  finalComponent?: GeneratedComponent;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
    suggestions: string[];
  };
}

export interface BatchIntegrationResult {
  overall: {
    success: boolean;
    processedComponents: number;
    failedComponents: number;
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
    suggestions: string[];
  };
  individual: Map<string, IntegrationManagerResult>;
  fileSystemResult?: FileSystemResult;
}

/**
 * Main integration manager that coordinates all validation and integration steps
 */
export class IntegrationManager {
  private projectConfig: ProjectConfig;
  private options: IntegrationManagerOptions;
  private compatibilityValidator: ProjectCompatibilityValidator;
  private codeQualityChecker: CodeQualityChecker;
  private fileSystemIntegration: FileSystemIntegration;

  constructor(projectConfig: ProjectConfig, options: IntegrationManagerOptions = {}) {
    this.projectConfig = projectConfig;
    this.options = {
      validateCompatibility: true,
      checkCodeQuality: true,
      integrateFileSystem: true,
      strictMode: false,
      continueOnWarnings: true,
      continueOnErrors: false,
      ...options
    };

    // Initialize sub-components
    this.compatibilityValidator = new ProjectCompatibilityValidator(projectConfig, {
      strictMode: this.options.strictMode
    });

    this.codeQualityChecker = new CodeQualityChecker(projectConfig, {
      strictMode: this.options.strictMode
    });

    this.fileSystemIntegration = new FileSystemIntegration(projectConfig, '.', {
      resolveConflicts: true,
      validatePaths: true
    });
  }

  /**
   * Performs complete integration process for a single component
   */
  async integrateComponent(component: GeneratedComponent): Promise<IntegrationManagerResult> {
    const result: IntegrationManagerResult = {
      success: true,
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        warnings: 0,
        suggestions: []
      }
    };

    try {
      // Step 1: Validate project compatibility
      if (this.options.validateCompatibility) {
        result.compatibility = await this.compatibilityValidator.validateComponentCompatibility(component);
        
        if (!result.compatibility.isValid && !this.options.continueOnErrors) {
          result.success = false;
          this.updateSummary(result, result.compatibility);
          return result;
        }
        
        this.updateSummary(result, result.compatibility);
      }

      // Step 2: Check code quality
      if (this.options.checkCodeQuality) {
        result.codeQuality = await this.codeQualityChecker.analyzeComponent(component);
        
        if (!result.codeQuality.passed && !this.options.continueOnErrors) {
          result.success = false;
          this.updateSummaryFromQuality(result, result.codeQuality);
          return result;
        }
        
        this.updateSummaryFromQuality(result, result.codeQuality);
      }

      // Step 3: Integrate with file system
      if (this.options.integrateFileSystem) {
        result.fileSystem = await this.fileSystemIntegration.integrateComponent(component);
        
        if (!result.fileSystem.success && !this.options.continueOnErrors) {
          result.success = false;
          this.updateSummaryFromFileSystem(result, result.fileSystem);
          return result;
        }
        
        result.finalComponent = result.fileSystem.component || component;
        this.updateSummaryFromFileSystem(result, result.fileSystem);
      } else {
        result.finalComponent = component;
      }

      // Generate final suggestions
      result.summary.suggestions = this.generateIntegrationSuggestions(result);

      // Determine overall success
      result.success = result.summary.criticalIssues === 0 && 
        (this.options.continueOnWarnings || result.summary.warnings === 0);

    } catch (error) {
      result.success = false;
      result.summary.criticalIssues += 1;
      result.summary.totalIssues += 1;
      result.summary.suggestions.push(
        `Integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  /**
   * Performs batch integration for multiple components
   */
  async integrateComponents(components: GeneratedComponent[]): Promise<BatchIntegrationResult> {
    const individual = new Map<string, IntegrationManagerResult>();
    let processedComponents = 0;
    let failedComponents = 0;
    let totalIssues = 0;
    let criticalIssues = 0;
    let warnings = 0;
    const allSuggestions: string[] = [];

    // First, validate overall project compatibility
    if (this.options.validateCompatibility) {
      const projectCompatibility = await this.compatibilityValidator.validateProjectCompatibility();
      if (!projectCompatibility.isValid && !this.options.continueOnErrors) {
        return {
          overall: {
            success: false,
            processedComponents: 0,
            failedComponents: components.length,
            totalIssues: projectCompatibility.errors.length,
            criticalIssues: projectCompatibility.errors.length,
            warnings: projectCompatibility.warnings.length,
            suggestions: projectCompatibility.suggestions || []
          },
          individual
        };
      }
    }

    // Process each component
    for (const component of components) {
      try {
        const result = await this.integrateComponent(component);
        individual.set(component.name, result);
        
        processedComponents++;
        if (!result.success) {
          failedComponents++;
        }
        
        totalIssues += result.summary.totalIssues;
        criticalIssues += result.summary.criticalIssues;
        warnings += result.summary.warnings;
        allSuggestions.push(...result.summary.suggestions);
        
      } catch (error) {
        failedComponents++;
        individual.set(component.name, {
          success: false,
          summary: {
            totalIssues: 1,
            criticalIssues: 1,
            warnings: 0,
            suggestions: [`Failed to process component: ${error instanceof Error ? error.message : 'Unknown error'}`]
          }
        });
      }
    }

    // Perform file system integration for all components
    let fileSystemResult: FileSystemResult | undefined;
    if (this.options.integrateFileSystem && processedComponents > 0) {
      const successfulComponents = Array.from(individual.entries())
        .filter(([_, result]) => result.success && result.finalComponent)
        .map(([_, result]) => result.finalComponent!);
      
      if (successfulComponents.length > 0) {
        const fsIntegrationResult = await this.fileSystemIntegration.integrateComponents(successfulComponents);
        fileSystemResult = fsIntegrationResult.overall;
      }
    }

    return {
      overall: {
        success: criticalIssues === 0 && failedComponents === 0,
        processedComponents,
        failedComponents,
        totalIssues,
        criticalIssues,
        warnings,
        suggestions: [...new Set(allSuggestions)] // Remove duplicates
      },
      individual,
      fileSystemResult
    };
  }

  /**
   * Validates project setup before component generation
   */
  async validateProjectSetup(): Promise<ValidationResult> {
    return await this.compatibilityValidator.validateProjectCompatibility();
  }

  /**
   * Performs dry run to check what would happen without making changes
   */
  async dryRun(components: GeneratedComponent[]): Promise<BatchIntegrationResult> {
    // Create a copy of the integration manager with file system integration disabled
    const dryRunManager = new IntegrationManager(this.projectConfig, {
      ...this.options,
      integrateFileSystem: false
    });

    return await dryRunManager.integrateComponents(components);
  }

  /**
   * Gets integration statistics and recommendations
   */
  async getIntegrationReport(components: GeneratedComponent[]): Promise<{
    projectCompatibility: ValidationResult;
    estimatedIssues: number;
    recommendations: string[];
    estimatedFileChanges: number;
  }> {
    const projectCompatibility = await this.validateProjectSetup();
    const dryRunResult = await this.dryRun(components);
    
    const estimatedIssues = dryRunResult.overall.totalIssues;
    const estimatedFileChanges = components.length;
    
    const recommendations = [
      ...projectCompatibility.suggestions || [],
      ...dryRunResult.overall.suggestions
    ];

    // Add specific recommendations based on analysis
    if (projectCompatibility.errors.length > 0) {
      recommendations.unshift('Fix project compatibility issues before proceeding');
    }
    
    if (dryRunResult.overall.criticalIssues > 0) {
      recommendations.push('Address critical code quality issues in generated components');
    }
    
    if (dryRunResult.overall.warnings > 10) {
      recommendations.push('Consider reviewing and addressing code quality warnings');
    }

    return {
      projectCompatibility,
      estimatedIssues,
      recommendations: [...new Set(recommendations)],
      estimatedFileChanges
    };
  }

  // Private helper methods

  private updateSummary(result: IntegrationManagerResult, validation: ValidationResult): void {
    result.summary.totalIssues += validation.errors.length + validation.warnings.length;
    result.summary.criticalIssues += validation.errors.length;
    result.summary.warnings += validation.warnings.length;
    
    if (validation.suggestions) {
      result.summary.suggestions.push(...validation.suggestions);
    }
  }

  private updateSummaryFromQuality(result: IntegrationManagerResult, quality: CodeQualityResult): void {
    const errors = quality.issues.filter(issue => issue.severity === 'error').length;
    const warnings = quality.issues.filter(issue => issue.severity === 'warning').length;
    
    result.summary.totalIssues += quality.issues.length;
    result.summary.criticalIssues += errors;
    result.summary.warnings += warnings;
    result.summary.suggestions.push(...quality.suggestions);
  }

  private updateSummaryFromFileSystem(result: IntegrationManagerResult, fileSystem: IntegrationResult): void {
    const criticalConflicts = fileSystem.conflicts.filter(
      conflict => conflict.type !== 'NAME_COLLISION'
    ).length;
    
    result.summary.totalIssues += fileSystem.conflicts.length + fileSystem.warnings.length;
    result.summary.criticalIssues += criticalConflicts;
    result.summary.warnings += fileSystem.warnings.length;
    
    if (fileSystem.modifications) {
      result.summary.suggestions.push(...fileSystem.modifications);
    }
  }

  private generateIntegrationSuggestions(result: IntegrationManagerResult): string[] {
    const suggestions: string[] = [...result.summary.suggestions];
    
    // Add integration-specific suggestions
    if (result.summary.criticalIssues > 0) {
      suggestions.unshift('Address critical issues before deploying component');
    }
    
    if (result.summary.warnings > 5) {
      suggestions.push('Consider addressing warnings to improve code quality');
    }
    
    if (result.compatibility && !result.compatibility.isValid) {
      suggestions.push('Update project configuration to ensure compatibility');
    }
    
    if (result.codeQuality && result.codeQuality.metrics.maintainability < 70) {
      suggestions.push('Refactor component to improve maintainability');
    }
    
    if (result.fileSystem && result.fileSystem.conflicts.length > 0) {
      suggestions.push('Resolve file system conflicts before integration');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Creates a summary report for integration results
   */
  generateSummaryReport(result: BatchIntegrationResult): string {
    const { overall } = result;
    
    let report = `Integration Summary Report\n`;
    report += `========================\n\n`;
    
    report += `Overall Status: ${overall.success ? 'SUCCESS' : 'FAILED'}\n`;
    report += `Processed Components: ${overall.processedComponents}\n`;
    report += `Failed Components: ${overall.failedComponents}\n`;
    report += `Total Issues: ${overall.totalIssues}\n`;
    report += `Critical Issues: ${overall.criticalIssues}\n`;
    report += `Warnings: ${overall.warnings}\n\n`;
    
    if (overall.suggestions.length > 0) {
      report += `Recommendations:\n`;
      overall.suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion}\n`;
      });
      report += `\n`;
    }
    
    if (result.fileSystemResult) {
      report += `File System Integration:\n`;
      report += `- Created Files: ${result.fileSystemResult.createdFiles.length}\n`;
      report += `- Created Directories: ${result.fileSystemResult.createdDirectories.length}\n`;
      report += `- Conflicts: ${result.fileSystemResult.conflicts.length}\n\n`;
    }
    
    // Individual component details
    if (result.individual.size > 0) {
      report += `Component Details:\n`;
      result.individual.forEach((componentResult, componentName) => {
        report += `- ${componentName}: ${componentResult.success ? 'SUCCESS' : 'FAILED'}`;
        if (componentResult.summary.criticalIssues > 0) {
          report += ` (${componentResult.summary.criticalIssues} critical issues)`;
        }
        report += `\n`;
      });
    }
    
    return report;
  }
}