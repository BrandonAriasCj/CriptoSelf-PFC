/**
 * Transformation Pipeline - Step-by-step workflow from input to output
 * Implements progress callbacks, status reporting, and resource management
 */

import { FigmaElement } from '../types/core.js';
import { GeneratedComponent } from '../types/component.js';
import { ValidationResult } from '../types/validation.js';
import { ProjectConfig } from '../types/project.js';

import { 
  FigmaToReactTransformer, 
  TransformationOptions, 
  TransformationResult, 
  TransformationProgress,
  TransformationStep 
} from '../figma-to-react-transformer.js';

/**
 * Pipeline step definition
 */
export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  execute: (context: PipelineContext) => Promise<PipelineStepResult>;
  cleanup?: (context: PipelineContext) => Promise<void>;
  canSkip?: (context: PipelineContext) => boolean;
  retryable?: boolean;
  timeout?: number;
}

/**
 * Pipeline context shared across steps
 */
export interface PipelineContext {
  // Input data
  elements: FigmaElement[];
  projectConfig: ProjectConfig;
  options: TransformationOptions;
  
  // Intermediate results
  validationResults?: ValidationResult[];
  parsedElements?: any[];
  hierarchyAnalysis?: any;
  patternMatches?: any;
  generatedComponents?: GeneratedComponent[];
  integrationResult?: any;
  
  // State management
  state: Map<string, any>;
  resources: Map<string, any>;
  
  // Progress tracking
  progress: TransformationProgress;
  stepResults: Map<string, PipelineStepResult>;
  
  // Error handling
  errors: Error[];
  warnings: string[];
  
  // Callbacks
  onProgress?: (progress: TransformationProgress) => void;
  onStepComplete?: (stepId: string, result: PipelineStepResult) => void;
  onError?: (error: Error, stepId: string) => void;
}

/**
 * Pipeline step result
 */
export interface PipelineStepResult {
  success: boolean;
  data?: any;
  errors?: Error[];
  warnings?: string[];
  metrics?: {
    duration: number;
    memoryUsage?: number;
    resourcesAllocated?: string[];
  };
  nextStep?: string; // Optional step override
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  steps: PipelineStep[];
  options: {
    enableParallelSteps?: boolean;
    maxRetries?: number;
    timeoutMs?: number;
    enableResourceTracking?: boolean;
    enableMetrics?: boolean;
    continueOnStepFailure?: boolean;
  };
}

/**
 * Pipeline execution result
 */
export interface PipelineExecutionResult {
  success: boolean;
  transformationResult: TransformationResult;
  executedSteps: string[];
  skippedSteps: string[];
  failedSteps: string[];
  totalDuration: number;
  stepMetrics: Map<string, PipelineStepResult>;
  resourceUsage: {
    peakMemoryUsage: number;
    totalResourcesAllocated: number;
    resourcesNotCleaned: string[];
  };
}

/**
 * Main transformation pipeline class
 */
export class TransformationPipeline {
  private config: PipelineConfig;
  private transformer: FigmaToReactTransformer;
  private context: PipelineContext | null = null;
  
  constructor(config: PipelineConfig, transformer?: FigmaToReactTransformer) {
    this.config = config;
    this.transformer = transformer || new FigmaToReactTransformer();
  }

  /**
   * Execute the complete transformation pipeline
   */
  async execute(
    elements: FigmaElement[],
    projectConfig: ProjectConfig,
    options: TransformationOptions = {}
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    
    // Initialize pipeline context
    this.context = this.initializeContext(elements, projectConfig, options);
    
    const executedSteps: string[] = [];
    const skippedSteps: string[] = [];
    const failedSteps: string[] = [];
    
    try {
      // Execute pipeline steps
      for (const step of this.config.steps) {
        try {
          // Check if step can be skipped
          if (step.canSkip && step.canSkip(this.context)) {
            skippedSteps.push(step.id);
            this.updateProgress(`Skipped: ${step.name}`);
            continue;
          }
          
          // Execute step with timeout and retry logic
          const stepResult = await this.executeStepWithRetry(step, this.context);
          
          // Store step result
          this.context.stepResults.set(step.id, stepResult);
          
          if (stepResult.success) {
            executedSteps.push(step.id);
            
            // Call step completion callback
            if (this.context.onStepComplete) {
              this.context.onStepComplete(step.id, stepResult);
            }
            
            // Handle step data
            if (stepResult.data) {
              this.context.state.set(`${step.id}_result`, stepResult.data);
            }
            
            // Check for next step override
            if (stepResult.nextStep) {
              const nextStepIndex = this.config.steps.findIndex(s => s.id === stepResult.nextStep);
              if (nextStepIndex > -1) {
                // Skip to specified step
                continue;
              }
            }
            
          } else {
            failedSteps.push(step.id);
            
            // Handle step failure
            if (!this.config.options.continueOnStepFailure) {
              throw new Error(`Pipeline failed at step: ${step.id}`);
            }
            
            // Log errors and warnings
            if (stepResult.errors) {
              this.context.errors.push(...stepResult.errors);
            }
            if (stepResult.warnings) {
              this.context.warnings.push(...stepResult.warnings);
            }
          }
          
        } catch (error) {
          failedSteps.push(step.id);
          
          const stepError = error instanceof Error ? error : new Error(`Step ${step.id} failed`);
          this.context.errors.push(stepError);
          
          // Call error callback
          if (this.context.onError) {
            this.context.onError(stepError, step.id);
          }
          
          if (!this.config.options.continueOnStepFailure) {
            throw stepError;
          }
        }
      }
      
      // Create transformation result
      const transformationResult = this.createTransformationResult();
      
      // Cleanup resources
      await this.cleanup();
      
      const totalDuration = Date.now() - startTime;
      
      return {
        success: failedSteps.length === 0,
        transformationResult,
        executedSteps,
        skippedSteps,
        failedSteps,
        totalDuration,
        stepMetrics: new Map(this.context.stepResults),
        resourceUsage: this.calculateResourceUsage()
      };
      
    } catch (error) {
      // Ensure cleanup on failure
      await this.cleanup();
      
      const totalDuration = Date.now() - startTime;
      
      return {
        success: false,
        transformationResult: this.createFailureResult(error),
        executedSteps,
        skippedSteps,
        failedSteps,
        totalDuration,
        stepMetrics: new Map(this.context?.stepResults || []),
        resourceUsage: this.calculateResourceUsage()
      };
    }
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStepWithRetry(
    step: PipelineStep,
    context: PipelineContext
  ): Promise<PipelineStepResult> {
    const maxRetries = step.retryable ? (this.config.options.maxRetries || 3) : 1;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.updateProgress(`Executing: ${step.name} (attempt ${attempt}/${maxRetries})`);
        
        // Execute step with timeout
        const stepResult = await this.executeStepWithTimeout(step, context);
        
        // Track resources if enabled
        if (this.config.options.enableResourceTracking && stepResult.metrics?.resourcesAllocated) {
          stepResult.metrics.resourcesAllocated.forEach(resource => {
            context.resources.set(resource, { step: step.id, allocated: Date.now() });
          });
        }
        
        return stepResult;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(`Step execution failed: ${error}`);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      errors: lastError ? [lastError] : [new Error(`Step ${step.id} failed after ${maxRetries} attempts`)],
      metrics: {
        duration: 0
      }
    };
  }

  /**
   * Execute step with timeout
   */
  private async executeStepWithTimeout(
    step: PipelineStep,
    context: PipelineContext
  ): Promise<PipelineStepResult> {
    const timeout = step.timeout || this.config.options.timeoutMs || 30000;
    const startTime = Date.now();
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Step ${step.id} timed out after ${timeout}ms`)), timeout);
    });
    
    try {
      const result = await Promise.race([
        step.execute(context),
        timeoutPromise
      ]);
      
      // Add timing metrics
      const duration = Date.now() - startTime;
      result.metrics = {
        ...result.metrics,
        duration
      };
      
      return result;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize pipeline context
   */
  private initializeContext(
    elements: FigmaElement[],
    projectConfig: ProjectConfig,
    options: TransformationOptions
  ): PipelineContext {
    return {
      elements,
      projectConfig,
      options,
      state: new Map(),
      resources: new Map(),
      progress: {
        currentStep: 'INITIALIZING',
        totalSteps: this.config.steps.length,
        completedSteps: 0,
        elementsProcessed: 0,
        totalElements: elements.length,
        errors: 0,
        warnings: 0,
        startTime: new Date()
      },
      stepResults: new Map(),
      errors: [],
      warnings: [],
      onProgress: options.progressTracking?.progressCallback,
      onStepComplete: undefined, // Can be set by caller
      onError: undefined // Can be set by caller
    };
  }

  /**
   * Update progress and notify callbacks
   */
  private updateProgress(message: string): void {
    if (!this.context) return;
    
    this.context.progress.completedSteps++;
    
    // Call progress callback
    if (this.context.onProgress) {
      this.context.onProgress(this.context.progress);
    }
    
    // Log if enabled
    if (this.context.options.progressTracking?.enableDetailedLogging) {
      console.log(`🔄 Pipeline: ${message} (${this.context.progress.completedSteps}/${this.context.progress.totalSteps})`);
    }
  }

  /**
   * Create transformation result from context
   */
  private createTransformationResult(): TransformationResult {
    if (!this.context) {
      throw new Error('Pipeline context not initialized');
    }
    
    return {
      success: this.context.errors.length === 0,
      components: this.context.generatedComponents || [],
      errors: this.context.validationResults || [],
      warnings: this.context.warnings,
      progress: this.context.progress,
      integrationResult: this.context.integrationResult,
      summary: {
        totalElements: this.context.elements.length,
        processedElements: this.context.elements.length,
        generatedComponents: (this.context.generatedComponents || []).length,
        failedElements: this.context.errors.length,
        totalErrors: this.context.errors.length,
        totalWarnings: this.context.warnings.length,
        processingTime: Date.now() - this.context.progress.startTime.getTime()
      }
    };
  }

  /**
   * Create failure result
   */
  private createFailureResult(error: unknown): TransformationResult {
    const errorMessage = error instanceof Error ? error.message : 'Pipeline execution failed';
    
    return {
      success: false,
      components: [],
      errors: [{
        isValid: false,
        errors: [{
          code: 'PIPELINE_ERROR',
          message: errorMessage,
          severity: 'critical' as const
        }],
        warnings: []
      }],
      warnings: [errorMessage],
      progress: this.context?.progress || {
        currentStep: 'FAILED',
        totalSteps: 0,
        completedSteps: 0,
        elementsProcessed: 0,
        totalElements: 0,
        errors: 1,
        warnings: 0,
        startTime: new Date()
      },
      summary: {
        totalElements: this.context?.elements.length || 0,
        processedElements: 0,
        generatedComponents: 0,
        failedElements: this.context?.elements.length || 0,
        totalErrors: 1,
        totalWarnings: 0,
        processingTime: 0
      }
    };
  }

  /**
   * Calculate resource usage metrics
   */
  private calculateResourceUsage(): PipelineExecutionResult['resourceUsage'] {
    if (!this.context) {
      return {
        peakMemoryUsage: 0,
        totalResourcesAllocated: 0,
        resourcesNotCleaned: []
      };
    }
    
    const resourcesNotCleaned: string[] = [];
    let totalResourcesAllocated = 0;
    
    for (const [resourceId, resourceInfo] of this.context.resources) {
      totalResourcesAllocated++;
      if (resourceInfo && typeof resourceInfo === 'object' && 'allocated' in resourceInfo) {
        resourcesNotCleaned.push(resourceId);
      }
    }
    
    return {
      peakMemoryUsage: process.memoryUsage().heapUsed,
      totalResourcesAllocated,
      resourcesNotCleaned
    };
  }

  /**
   * Cleanup pipeline resources
   */
  private async cleanup(): Promise<void> {
    if (!this.context) return;
    
    // Execute cleanup for each step that has it
    for (const step of this.config.steps) {
      if (step.cleanup) {
        try {
          await step.cleanup(this.context);
        } catch (error) {
          console.warn(`Cleanup failed for step ${step.id}:`, error);
        }
      }
    }
    
    // Clear resources
    this.context.resources.clear();
    this.context.state.clear();
  }

  /**
   * Get current pipeline status
   */
  getStatus(): {
    isRunning: boolean;
    currentStep?: string;
    progress?: TransformationProgress;
    errors: Error[];
    warnings: string[];
  } {
    return {
      isRunning: this.context !== null,
      currentStep: this.context?.progress.currentStep,
      progress: this.context?.progress,
      errors: this.context?.errors || [],
      warnings: this.context?.warnings || []
    };
  }

  /**
   * Stop pipeline execution
   */
  async stop(): Promise<void> {
    if (this.context) {
      await this.cleanup();
      this.context = null;
    }
  }
}

/**
 * Create default pipeline configuration
 */
export function createDefaultPipelineConfig(): PipelineConfig {
  return {
    steps: [
      {
        id: 'validate-input',
        name: 'Validate Input Elements',
        description: 'Validate Figma elements and check for required properties',
        execute: async (context) => {
          // This will be implemented by the transformer
          return { success: true, data: null, metrics: { duration: 0 } };
        },
        retryable: true,
        timeout: 10000
      },
      {
        id: 'parse-elements',
        name: 'Parse Figma Elements',
        description: 'Parse visual elements and extract properties',
        execute: async (context) => {
          return { success: true, data: null, metrics: { duration: 0 } };
        },
        retryable: true,
        timeout: 15000
      },
      {
        id: 'analyze-hierarchy',
        name: 'Analyze Element Hierarchy',
        description: 'Build component hierarchy and relationships',
        execute: async (context) => {
          return { success: true, data: null, metrics: { duration: 0 } };
        },
        retryable: false,
        timeout: 10000
      },
      {
        id: 'match-patterns',
        name: 'Match UI Patterns',
        description: 'Match elements to existing UI components',
        execute: async (context) => {
          return { success: true, data: null, metrics: { duration: 0 } };
        },
        retryable: true,
        timeout: 10000
      },
      {
        id: 'generate-components',
        name: 'Generate React Components',
        description: 'Generate React components with TypeScript',
        execute: async (context) => {
          return { success: true, data: null, metrics: { duration: 0 } };
        },
        retryable: true,
        timeout: 20000
      },
      {
        id: 'integrate-components',
        name: 'Integrate with Project',
        description: 'Integrate generated components with existing project',
        execute: async (context) => {
          return { success: true, data: null, metrics: { duration: 0 } };
        },
        retryable: true,
        timeout: 15000
      }
    ],
    options: {
      enableParallelSteps: false,
      maxRetries: 3,
      timeoutMs: 30000,
      enableResourceTracking: true,
      enableMetrics: true,
      continueOnStepFailure: false
    }
  };
}

/**
 * Create pipeline with transformer integration
 */
export function createTransformationPipeline(
  transformer?: FigmaToReactTransformer,
  config?: Partial<PipelineConfig>
): TransformationPipeline {
  const defaultConfig = createDefaultPipelineConfig();
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    options: {
      ...defaultConfig.options,
      ...config?.options
    }
  };
  
  return new TransformationPipeline(mergedConfig, transformer);
}