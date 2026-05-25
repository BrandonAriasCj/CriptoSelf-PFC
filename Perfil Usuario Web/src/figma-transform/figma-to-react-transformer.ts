/**
 * Main FigmaToReactTransformer class that coordinates all transformation components
 * Manages transformation state, progress tracking, and batch processing
 */

import { FigmaElement } from './types/core.js';
import { GeneratedComponent, GenerationContext } from './types/component.js';
import { ValidationResult } from './types/validation.js';
import { ProjectConfig } from './types/project.js';

import { VisualElementParser, ParsedElement } from './parsers/visual-element-parser.js';
import { HierarchyAnalyzer } from './parsers/hierarchy-analyzer.js';
import { PatternMatcher } from './parsers/pattern-matcher.js';

import { ReactComponentGenerator, ComponentGenerationOptions } from './generators/react-component-generator.js';
import { ImportResolutionOptions } from './generators/import-resolver.js';

import { IntegrationManager, IntegrationManagerOptions, IntegrationManagerResult, BatchIntegrationResult } from './integration/integration-manager.js';

import { FigmaElementErrorHandler } from './validation/error-handler.js';
import { FallbackGenerator } from './validation/fallback-generator.js';
import { ErrorRecoverySystem } from './validation/error-recovery-system.js';

import { loadProjectConfig } from './utils/project-config.js';

/**
 * Transformation progress tracking
 */
export interface TransformationProgress {
  currentStep: TransformationStep;
  totalSteps: number;
  completedSteps: number;
  currentElement?: string;
  elementsProcessed: number;
  totalElements: number;
  errors: number;
  warnings: number;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

/**
 * Transformation steps
 */
export type TransformationStep = 
  | 'INITIALIZING'
  | 'VALIDATING_INPUT'
  | 'PARSING_ELEMENTS'
  | 'ANALYZING_HIERARCHY'
  | 'MATCHING_PATTERNS'
  | 'GENERATING_COMPONENTS'
  | 'INTEGRATING_COMPONENTS'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED';

/**
 * Transformation options
 */
export interface TransformationOptions {
  // Component generation options
  componentGeneration?: Partial<ComponentGenerationOptions>;
  
  // Import resolution options
  importResolution?: Partial<ImportResolutionOptions>;
  
  // Integration options
  integration?: Partial<IntegrationManagerOptions>;
  
  // Error handling options
  errorHandling?: {
    continueOnErrors?: boolean;
    enableFallbacks?: boolean;
    enableRecovery?: boolean;
    maxRetries?: number;
  };
  
  // Progress tracking options
  progressTracking?: {
    enableProgressCallbacks?: boolean;
    progressCallback?: (progress: TransformationProgress) => void;
    enableDetailedLogging?: boolean;
  };
  
  // Batch processing options
  batchProcessing?: {
    batchSize?: number;
    enableParallelProcessing?: boolean;
    maxConcurrency?: number;
  };
}

/**
 * Transformation result
 */
export interface TransformationResult {
  success: boolean;
  components: GeneratedComponent[];
  errors: ValidationResult[];
  warnings: string[];
  progress: TransformationProgress;
  integrationResult?: BatchIntegrationResult;
  summary: {
    totalElements: number;
    processedElements: number;
    generatedComponents: number;
    failedElements: number;
    totalErrors: number;
    totalWarnings: number;
    processingTime: number;
  };
}

/**
 * Main transformer class that orchestrates the entire transformation process
 */
export class FigmaToReactTransformer {
  private projectConfig: ProjectConfig;
  private options: TransformationOptions;
  
  // Core components
  private elementParser: VisualElementParser;
  private hierarchyAnalyzer: HierarchyAnalyzer;
  private patternMatcher: PatternMatcher;
  private componentGenerator: ReactComponentGenerator;
  private integrationManager: IntegrationManager;
  
  // Error handling components
  private errorHandler: FigmaElementErrorHandler;
  private fallbackGenerator: FallbackGenerator;
  private recoverySystem: ErrorRecoverySystem;
  
  // State management
  private currentProgress: TransformationProgress;
  private transformationState: Map<string, any> = new Map();
  
  constructor(
    projectConfigPath?: string,
    options: TransformationOptions = {}
  ) {
    // Load project configuration
    this.projectConfig = projectConfigPath 
      ? loadProjectConfig(projectConfigPath)
      : this.getDefaultProjectConfig();
    
    this.options = this.mergeDefaultOptions(options);
    
    // Initialize progress tracking
    this.currentProgress = this.initializeProgress();
    
    // Initialize core components
    this.initializeComponents();
  }

  /**
   * Transform a single Figma element to React component
   */
  async transformElement(element: FigmaElement): Promise<TransformationResult> {
    return this.transformElements([element]);
  }

  /**
   * Transform multiple Figma elements to React components
   */
  async transformElements(elements: FigmaElement[]): Promise<TransformationResult> {
    const startTime = Date.now();
    
    try {
      // Initialize transformation
      this.updateProgress('INITIALIZING', 0, elements.length);
      
      // Validate input elements
      this.updateProgress('VALIDATING_INPUT');
      const validationResults = await this.validateInputElements(elements);
      
      if (validationResults.some(result => !result.isValid) && !this.options.errorHandling?.continueOnErrors) {
        return this.createFailureResult(elements, validationResults, startTime);
      }
      
      // Parse elements
      this.updateProgress('PARSING_ELEMENTS');
      const parsedElements = await this.parseElements(elements);
      
      // Analyze hierarchy
      this.updateProgress('ANALYZING_HIERARCHY');
      const hierarchyAnalysis = await this.analyzeHierarchy(parsedElements);
      
      // Match patterns
      this.updateProgress('MATCHING_PATTERNS');
      const patternMatches = await this.matchPatterns(parsedElements);
      
      // Generate components
      this.updateProgress('GENERATING_COMPONENTS');
      const generatedComponents = await this.generateComponents(parsedElements, hierarchyAnalysis, patternMatches);
      
      // Integrate components
      this.updateProgress('INTEGRATING_COMPONENTS');
      const integrationResult = await this.integrateComponents(generatedComponents);
      
      // Finalize
      this.updateProgress('FINALIZING');
      const result = this.createSuccessResult(
        elements,
        generatedComponents,
        validationResults,
        integrationResult,
        startTime
      );
      
      this.updateProgress('COMPLETED');
      
      return result;
      
    } catch (error) {
      this.updateProgress('FAILED');
      return this.createErrorResult(elements, error, startTime);
    }
  }

  /**
   * Transform elements in batches for better performance
   */
  async transformElementsBatch(elements: FigmaElement[]): Promise<TransformationResult> {
    const batchSize = this.options.batchProcessing?.batchSize || 10;
    const enableParallel = this.options.batchProcessing?.enableParallelProcessing || false;
    
    if (elements.length <= batchSize || !enableParallel) {
      return this.transformElements(elements);
    }
    
    // Process in batches
    const batches: FigmaElement[][] = [];
    for (let i = 0; i < elements.length; i += batchSize) {
      batches.push(elements.slice(i, i + batchSize));
    }
    
    const batchResults: TransformationResult[] = [];
    
    if (enableParallel) {
      // Process batches in parallel
      const maxConcurrency = this.options.batchProcessing?.maxConcurrency || 3;
      const promises: Promise<TransformationResult>[] = [];
      
      for (let i = 0; i < batches.length; i += maxConcurrency) {
        const concurrentBatches = batches.slice(i, i + maxConcurrency);
        const concurrentPromises = concurrentBatches.map(batch => this.transformElements(batch));
        
        const concurrentResults = await Promise.all(concurrentPromises);
        batchResults.push(...concurrentResults);
      }
    } else {
      // Process batches sequentially
      for (const batch of batches) {
        const batchResult = await this.transformElements(batch);
        batchResults.push(batchResult);
      }
    }
    
    // Merge batch results
    return this.mergeBatchResults(batchResults, elements);
  }

  /**
   * Get current transformation progress
   */
  getProgress(): TransformationProgress {
    return { ...this.currentProgress };
  }

  /**
   * Get transformation state for debugging
   */
  getTransformationState(): Map<string, any> {
    return new Map(this.transformationState);
  }

  /**
   * Reset transformer state
   */
  reset(): void {
    this.currentProgress = this.initializeProgress();
    this.transformationState.clear();
    this.errorHandler.clearErrorLog();
  }

  // Private methods

  /**
   * Initialize all transformation components
   */
  private initializeComponents(): void {
    // Initialize parsers
    this.elementParser = new VisualElementParser();
    this.hierarchyAnalyzer = new HierarchyAnalyzer();
    this.patternMatcher = new PatternMatcher(this.projectConfig);
    
    // Initialize generators
    const generationContext: GenerationContext = {
      projectConfig: this.projectConfig,
      existingComponents: new Map(),
      uiLibrary: this.projectConfig.uiLibrary
    };
    
    this.componentGenerator = new ReactComponentGenerator(
      generationContext,
      this.options.importResolution || {},
      this.options.componentGeneration
    );
    
    // Initialize integration manager
    this.integrationManager = new IntegrationManager(
      this.projectConfig,
      this.options.integration
    );
    
    // Initialize error handling components
    this.errorHandler = new FigmaElementErrorHandler();
    this.fallbackGenerator = new FallbackGenerator(generationContext);
    this.recoverySystem = new ErrorRecoverySystem(this.errorHandler, this.fallbackGenerator);
  }

  /**
   * Validate input elements
   */
  private async validateInputElements(elements: FigmaElement[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      this.updateProgress(undefined, i + 1);
      
      try {
        const validationResult = this.errorHandler.validateElement(element);
        results.push(validationResult);
        
        // Attempt recovery for invalid elements
        if (!validationResult.isValid && this.options.errorHandling?.enableRecovery) {
          for (const error of validationResult.errors) {
            const recoveryResult = this.errorHandler.handleValidationError(error, element);
            if (recoveryResult.success) {
              // Re-validate after recovery
              const revalidationResult = this.errorHandler.validateElement(element);
              results[results.length - 1] = revalidationResult;
            }
          }
        }
        
      } catch (error) {
        results.push({
          isValid: false,
          errors: [{
            code: 'VALIDATION_ERROR',
            message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'critical' as const
          }],
          warnings: []
        });
      }
    }
    
    return results;
  }

  /**
   * Parse Figma elements
   */
  private async parseElements(elements: FigmaElement[]): Promise<ParsedElement[]> {
    const parsedElements: ParsedElement[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      this.updateProgress(undefined, i + 1, undefined, element.name);
      
      try {
        const parsedElement = this.elementParser.parseElement(element);
        parsedElements.push(parsedElement);
        
        this.transformationState.set(`parsed_${element.id}`, parsedElement);
        
      } catch (error) {
        // Use fallback if parsing fails
        if (this.options.errorHandling?.enableFallbacks) {
          const fallbackComponent = this.fallbackGenerator.generateFallbackComponent(element);
          // Create a minimal parsed element for the fallback
          parsedElements.push({
            element,
            componentType: 'unknown',
            extractedProperties: {
              dimensions: { width: 100, height: 50, aspectRatio: 2 },
              position: { x: 0, y: 0 },
              visibility: { visible: true, opacity: 1 },
              constraints: { horizontal: 'LEFT', vertical: 'TOP' },
              interactive: false,
              hasText: false,
              hasChildren: false
            },
            styleAnalysis: {
              hasBackground: false,
              hasRoundedCorners: false,
              hasShadows: false,
              hasBorders: false,
              hasTypography: false,
              isCard: false,
              isButton: false,
              isInput: false,
              layoutType: 'static'
            }
          });
        } else {
          throw error;
        }
      }
    }
    
    return parsedElements;
  }

  /**
   * Analyze element hierarchy
   */
  private async analyzeHierarchy(parsedElements: ParsedElement[]): Promise<any> {
    const elements = parsedElements.map(pe => pe.element);
    const hierarchyResult = this.hierarchyAnalyzer.analyzeHierarchy(elements);
    
    this.transformationState.set('hierarchy_analysis', hierarchyResult);
    
    return hierarchyResult;
  }

  /**
   * Match patterns with existing components
   */
  private async matchPatterns(parsedElements: ParsedElement[]): Promise<any> {
    const patternResults = new Map();
    
    for (const parsedElement of parsedElements) {
      const matches = this.patternMatcher.findMatches(parsedElement.element);
      patternResults.set(parsedElement.element.id, matches);
    }
    
    this.transformationState.set('pattern_matches', patternResults);
    
    return patternResults;
  }

  /**
   * Generate React components
   */
  private async generateComponents(
    parsedElements: ParsedElement[],
    hierarchyAnalysis: any,
    patternMatches: any
  ): Promise<GeneratedComponent[]> {
    const components: GeneratedComponent[] = [];
    
    for (let i = 0; i < parsedElements.length; i++) {
      const parsedElement = parsedElements[i];
      this.updateProgress(undefined, i + 1, undefined, parsedElement.element.name);
      
      try {
        const component = this.componentGenerator.generateComponent(parsedElement.element);
        components.push(component);
        
        this.transformationState.set(`component_${parsedElement.element.id}`, component);
        
      } catch (error) {
        // Use fallback component generation
        if (this.options.errorHandling?.enableFallbacks) {
          const fallbackComponent = this.fallbackGenerator.generateFallbackComponent(parsedElement.element);
          components.push(fallbackComponent);
        } else if (!this.options.errorHandling?.continueOnErrors) {
          throw error;
        }
      }
    }
    
    return components;
  }

  /**
   * Integrate components with project
   */
  private async integrateComponents(components: GeneratedComponent[]): Promise<BatchIntegrationResult> {
    return await this.integrationManager.integrateComponents(components);
  }

  /**
   * Update transformation progress
   */
  private updateProgress(
    step?: TransformationStep,
    completedSteps?: number,
    totalElements?: number,
    currentElement?: string
  ): void {
    if (step) {
      this.currentProgress.currentStep = step;
    }
    
    if (completedSteps !== undefined) {
      this.currentProgress.completedSteps = completedSteps;
      this.currentProgress.elementsProcessed = completedSteps;
    }
    
    if (totalElements !== undefined) {
      this.currentProgress.totalElements = totalElements;
    }
    
    if (currentElement) {
      this.currentProgress.currentElement = currentElement;
    }
    
    // Calculate estimated time remaining
    if (this.currentProgress.elementsProcessed > 0) {
      const elapsed = Date.now() - this.currentProgress.startTime.getTime();
      const avgTimePerElement = elapsed / this.currentProgress.elementsProcessed;
      const remainingElements = this.currentProgress.totalElements - this.currentProgress.elementsProcessed;
      this.currentProgress.estimatedTimeRemaining = avgTimePerElement * remainingElements;
    }
    
    // Call progress callback if enabled
    if (this.options.progressTracking?.enableProgressCallbacks && this.options.progressTracking.progressCallback) {
      this.options.progressTracking.progressCallback({ ...this.currentProgress });
    }
    
    // Log progress if enabled
    if (this.options.progressTracking?.enableDetailedLogging) {
      console.log(`🔄 ${this.currentProgress.currentStep}: ${this.currentProgress.elementsProcessed}/${this.currentProgress.totalElements} elements processed`);
    }
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(): TransformationProgress {
    return {
      currentStep: 'INITIALIZING',
      totalSteps: 8, // Total transformation steps
      completedSteps: 0,
      elementsProcessed: 0,
      totalElements: 0,
      errors: 0,
      warnings: 0,
      startTime: new Date()
    };
  }

  /**
   * Create success result
   */
  private createSuccessResult(
    originalElements: FigmaElement[],
    components: GeneratedComponent[],
    validationResults: ValidationResult[],
    integrationResult: BatchIntegrationResult,
    startTime: number
  ): TransformationResult {
    const processingTime = Date.now() - startTime;
    const totalErrors = validationResults.reduce((sum, result) => sum + result.errors.length, 0);
    const totalWarnings = validationResults.reduce((sum, result) => sum + result.warnings.length, 0);
    
    return {
      success: true,
      components,
      errors: validationResults,
      warnings: [],
      progress: this.currentProgress,
      integrationResult,
      summary: {
        totalElements: originalElements.length,
        processedElements: originalElements.length,
        generatedComponents: components.length,
        failedElements: originalElements.length - components.length,
        totalErrors,
        totalWarnings,
        processingTime
      }
    };
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    originalElements: FigmaElement[],
    validationResults: ValidationResult[],
    startTime: number
  ): TransformationResult {
    const processingTime = Date.now() - startTime;
    const totalErrors = validationResults.reduce((sum, result) => sum + result.errors.length, 0);
    const totalWarnings = validationResults.reduce((sum, result) => sum + result.warnings.length, 0);
    
    return {
      success: false,
      components: [],
      errors: validationResults,
      warnings: ['Transformation failed due to validation errors'],
      progress: this.currentProgress,
      summary: {
        totalElements: originalElements.length,
        processedElements: 0,
        generatedComponents: 0,
        failedElements: originalElements.length,
        totalErrors,
        totalWarnings,
        processingTime
      }
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(
    originalElements: FigmaElement[],
    error: unknown,
    startTime: number
  ): TransformationResult {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      components: [],
      errors: [{
        isValid: false,
        errors: [{
          code: 'TRANSFORMATION_ERROR',
          message: errorMessage,
          severity: 'critical' as const
        }],
        warnings: []
      }],
      warnings: [errorMessage],
      progress: this.currentProgress,
      summary: {
        totalElements: originalElements.length,
        processedElements: this.currentProgress.elementsProcessed,
        generatedComponents: 0,
        failedElements: originalElements.length,
        totalErrors: 1,
        totalWarnings: 0,
        processingTime
      }
    };
  }

  /**
   * Merge batch transformation results
   */
  private mergeBatchResults(batchResults: TransformationResult[], originalElements: FigmaElement[]): TransformationResult {
    const allComponents: GeneratedComponent[] = [];
    const allErrors: ValidationResult[] = [];
    const allWarnings: string[] = [];
    let totalProcessingTime = 0;
    let totalProcessedElements = 0;
    let totalFailedElements = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    
    for (const result of batchResults) {
      allComponents.push(...result.components);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      totalProcessingTime += result.summary.processingTime;
      totalProcessedElements += result.summary.processedElements;
      totalFailedElements += result.summary.failedElements;
      totalErrors += result.summary.totalErrors;
      totalWarnings += result.summary.totalWarnings;
    }
    
    const overallSuccess = batchResults.every(result => result.success);
    
    return {
      success: overallSuccess,
      components: allComponents,
      errors: allErrors,
      warnings: allWarnings,
      progress: this.currentProgress,
      summary: {
        totalElements: originalElements.length,
        processedElements: totalProcessedElements,
        generatedComponents: allComponents.length,
        failedElements: totalFailedElements,
        totalErrors,
        totalWarnings,
        processingTime: totalProcessingTime
      }
    };
  }

  /**
   * Merge default options with provided options
   */
  private mergeDefaultOptions(options: TransformationOptions): TransformationOptions {
    return {
      componentGeneration: {
        useSemanticHTML: true,
        includeAccessibility: true,
        includeTypeScript: true,
        exportPattern: 'default',
        ...options.componentGeneration
      },
      importResolution: {
        resolveUIComponents: true,
        resolveUtilities: true,
        resolveIcons: true,
        ...options.importResolution
      },
      integration: {
        validateCompatibility: true,
        checkCodeQuality: true,
        integrateFileSystem: true,
        continueOnWarnings: true,
        ...options.integration
      },
      errorHandling: {
        continueOnErrors: false,
        enableFallbacks: true,
        enableRecovery: true,
        maxRetries: 3,
        ...options.errorHandling
      },
      progressTracking: {
        enableProgressCallbacks: false,
        enableDetailedLogging: false,
        ...options.progressTracking
      },
      batchProcessing: {
        batchSize: 10,
        enableParallelProcessing: false,
        maxConcurrency: 3,
        ...options.batchProcessing
      }
    };
  }

  /**
   * Get default project configuration
   */
  private getDefaultProjectConfig(): ProjectConfig {
    return {
      framework: 'react',
      typescript: true,
      bundler: 'vite',
      compiler: 'swc',
      uiLibrary: {
        name: 'radix-ui',
        components: ['Button', 'Input', 'Card', 'Dialog'],
        utilities: {
          classNames: 'cn',
          variants: 'cva'
        }
      },
      styling: {
        framework: 'tailwind',
        customClasses: false,
        responsiveBreakpoints: ['sm', 'md', 'lg', 'xl']
      },
      conventions: {
        componentNaming: 'PascalCase',
        fileNaming: 'ComponentName.tsx',
        propsInterface: 'ComponentNameProps',
        exportPattern: 'default'
      }
    };
  }
}

/**
 * Utility function to create transformer with default configuration
 */
export function createTransformer(options?: TransformationOptions): FigmaToReactTransformer {
  return new FigmaToReactTransformer(undefined, options);
}

/**
 * Utility function to transform a single element quickly
 */
export async function transformElement(
  element: FigmaElement,
  options?: TransformationOptions
): Promise<TransformationResult> {
  const transformer = createTransformer(options);
  return await transformer.transformElement(element);
}

/**
 * Utility function to transform multiple elements quickly
 */
export async function transformElements(
  elements: FigmaElement[],
  options?: TransformationOptions
): Promise<TransformationResult> {
  const transformer = createTransformer(options);
  return await transformer.transformElements(elements);
}

/**
 * Utility function to transform elements using the pipeline
 */
export async function transformElementsWithPipeline(
  elements: FigmaElement[],
  options?: TransformationOptions & {
    projectConfig?: ProjectConfig;
    enableStreaming?: boolean;
    onProgress?: (progress: TransformationProgress) => void;
  }
): Promise<TransformationResult> {
  // Dynamic import to avoid circular dependencies
  const { transformWithPipeline, transformWithStreaming } = await import('./pipeline/index.js');
  
  if (options?.enableStreaming && options?.onProgress) {
    const result = await transformWithStreaming(elements, options.onProgress, {
      transformationOptions: options,
      projectConfig: options.projectConfig
    });
    return result.transformationResult;
  } else {
    return await transformWithPipeline(elements, {
      transformationOptions: options,
      projectConfig: options.projectConfig
    });
  }
}