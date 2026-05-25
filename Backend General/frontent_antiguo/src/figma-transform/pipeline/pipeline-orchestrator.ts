/**
 * Pipeline Orchestrator - High-level interface for transformation pipeline
 * Provides easy-to-use methods for running transformations with progress tracking
 */

import { FigmaElement } from '../types/core.js';
import { ProjectConfig } from '../types/project.js';
import { 
  FigmaToReactTransformer, 
  TransformationOptions, 
  TransformationResult,
  TransformationProgress 
} from '../figma-to-react-transformer.js';

import { 
  TransformationPipeline, 
  PipelineConfig, 
  PipelineExecutionResult,
  PipelineContext 
} from './transformation-pipeline.js';

import { createPipelineSteps } from './pipeline-steps.js';
import { loadProjectConfig } from '../utils/project-config.js';

/**
 * Pipeline orchestrator options
 */
export interface PipelineOrchestratorOptions {
  // Transformer options
  transformationOptions?: TransformationOptions;
  
  // Pipeline configuration
  pipelineConfig?: Partial<PipelineConfig>;
  
  // Progress tracking
  onProgress?: (progress: TransformationProgress) => void;
  onStepComplete?: (stepId: string, result: any) => void;
  onError?: (error: Error, stepId: string) => void;
  
  // Resource management
  enableResourceTracking?: boolean;
  enableMetrics?: boolean;
  
  // Execution options
  timeoutMs?: number;
  maxRetries?: number;
  continueOnStepFailure?: boolean;
}

/**
 * Pipeline execution status
 */
export interface PipelineStatus {
  isRunning: boolean;
  currentStep?: string;
  progress?: TransformationProgress;
  errors: Error[];
  warnings: string[];
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

/**
 * Main pipeline orchestrator class
 */
export class PipelineOrchestrator {
  private transformer: FigmaToReactTransformer;
  private pipeline: TransformationPipeline;
  private options: PipelineOrchestratorOptions;
  private currentExecution: Promise<PipelineExecutionResult> | null = null;
  
  constructor(
    projectConfigPath?: string,
    options: PipelineOrchestratorOptions = {}
  ) {
    this.options = options;
    
    // Initialize transformer
    this.transformer = new FigmaToReactTransformer(
      projectConfigPath,
      options.transformationOptions
    );
    
    // Create pipeline configuration
    const pipelineConfig = this.createPipelineConfig();
    
    // Initialize pipeline
    this.pipeline = new TransformationPipeline(pipelineConfig, this.transformer);
  }

  /**
   * Transform a single Figma element using the pipeline
   */
  async transformElement(
    element: FigmaElement,
    projectConfig?: ProjectConfig
  ): Promise<TransformationResult> {
    return this.transformElements([element], projectConfig);
  }

  /**
   * Transform multiple Figma elements using the pipeline
   */
  async transformElements(
    elements: FigmaElement[],
    projectConfig?: ProjectConfig
  ): Promise<TransformationResult> {
    // Load project config if not provided
    const config = projectConfig || this.getDefaultProjectConfig();
    
    // Execute pipeline
    const pipelineResult = await this.executePipeline(elements, config);
    
    // Return transformation result
    return pipelineResult.transformationResult;
  }

  /**
   * Execute the transformation pipeline with full control
   */
  async executePipeline(
    elements: FigmaElement[],
    projectConfig: ProjectConfig
  ): Promise<PipelineExecutionResult> {
    // Prevent concurrent executions
    if (this.currentExecution) {
      throw new Error('Pipeline is already running. Wait for completion or stop the current execution.');
    }
    
    try {
      // Start pipeline execution
      this.currentExecution = this.pipeline.execute(
        elements,
        projectConfig,
        this.options.transformationOptions || {}
      );
      
      const result = await this.currentExecution;
      
      return result;
      
    } finally {
      this.currentExecution = null;
    }
  }

  /**
   * Execute pipeline with streaming progress updates
   */
  async executeWithStreaming(
    elements: FigmaElement[],
    projectConfig: ProjectConfig,
    progressCallback: (progress: TransformationProgress) => void
  ): Promise<PipelineExecutionResult> {
    // Set up progress streaming
    const originalOptions = this.options.transformationOptions || {};
    const streamingOptions = {
      ...originalOptions,
      progressTracking: {
        ...originalOptions.progressTracking,
        enableProgressCallbacks: true,
        progressCallback: (progress: TransformationProgress) => {
          progressCallback(progress);
          
          // Call original callback if exists
          if (this.options.onProgress) {
            this.options.onProgress(progress);
          }
        }
      }
    };
    
    // Create temporary orchestrator with streaming options
    const streamingOrchestrator = new PipelineOrchestrator(undefined, {
      ...this.options,
      transformationOptions: streamingOptions
    });
    
    return streamingOrchestrator.executePipeline(elements, projectConfig);
  }

  /**
   * Execute pipeline in batch mode for large datasets
   */
  async executeBatch(
    elements: FigmaElement[],
    projectConfig: ProjectConfig,
    batchSize: number = 10
  ): Promise<PipelineExecutionResult[]> {
    const batches: FigmaElement[][] = [];
    
    // Split elements into batches
    for (let i = 0; i < elements.length; i += batchSize) {
      batches.push(elements.slice(i, i + batchSize));
    }
    
    const results: PipelineExecutionResult[] = [];
    
    // Execute batches sequentially
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Update progress for batch processing
      if (this.options.onProgress) {
        const progress: TransformationProgress = {
          currentStep: 'INITIALIZING',
          totalSteps: batches.length,
          completedSteps: i,
          elementsProcessed: i * batchSize,
          totalElements: elements.length,
          errors: 0,
          warnings: 0,
          startTime: new Date()
        };
        this.options.onProgress(progress);
      }
      
      try {
        const batchResult = await this.executePipeline(batch, projectConfig);
        results.push(batchResult);
        
      } catch (error) {
        // Handle batch failure
        if (this.options.onError) {
          this.options.onError(
            error instanceof Error ? error : new Error('Batch execution failed'),
            `batch-${i}`
          );
        }
        
        // Create failure result for this batch
        const failureResult: PipelineExecutionResult = {
          success: false,
          transformationResult: {
            success: false,
            components: [],
            errors: [{
              isValid: false,
              errors: [{
                code: 'BATCH_ERROR',
                message: error instanceof Error ? error.message : 'Batch execution failed',
                severity: 'critical' as const
              }],
              warnings: []
            }],
            warnings: [],
            progress: {
              currentStep: 'FAILED',
              totalSteps: 0,
              completedSteps: 0,
              elementsProcessed: 0,
              totalElements: batch.length,
              errors: 1,
              warnings: 0,
              startTime: new Date()
            },
            summary: {
              totalElements: batch.length,
              processedElements: 0,
              generatedComponents: 0,
              failedElements: batch.length,
              totalErrors: 1,
              totalWarnings: 0,
              processingTime: 0
            }
          },
          executedSteps: [],
          skippedSteps: [],
          failedSteps: ['batch-execution'],
          totalDuration: 0,
          stepMetrics: new Map(),
          resourceUsage: {
            peakMemoryUsage: 0,
            totalResourcesAllocated: 0,
            resourcesNotCleaned: []
          }
        };
        
        results.push(failureResult);
        
        // Continue with next batch if configured to do so
        if (!this.options.continueOnStepFailure) {
          break;
        }
      }
    }
    
    return results;
  }

  /**
   * Get current pipeline status
   */
  getStatus(): PipelineStatus {
    const pipelineStatus = this.pipeline.getStatus();
    
    return {
      isRunning: this.currentExecution !== null,
      currentStep: pipelineStatus.currentStep,
      progress: pipelineStatus.progress,
      errors: pipelineStatus.errors,
      warnings: pipelineStatus.warnings,
      startTime: pipelineStatus.progress?.startTime,
      estimatedTimeRemaining: pipelineStatus.progress?.estimatedTimeRemaining
    };
  }

  /**
   * Stop current pipeline execution
   */
  async stop(): Promise<void> {
    if (this.currentExecution) {
      await this.pipeline.stop();
      this.currentExecution = null;
    }
  }

  /**
   * Reset pipeline state
   */
  reset(): void {
    this.transformer.reset();
  }

  /**
   * Get transformation metrics
   */
  getMetrics(): {
    memoryUsage: NodeJS.MemoryUsage;
    transformerState: Map<string, any>;
  } {
    return {
      memoryUsage: process.memoryUsage(),
      transformerState: this.transformer.getTransformationState()
    };
  }

  // Private methods

  /**
   * Create pipeline configuration
   */
  private createPipelineConfig(): PipelineConfig {
    const defaultConfig: PipelineConfig = {
      steps: createPipelineSteps(),
      options: {
        enableParallelSteps: false,
        maxRetries: this.options.maxRetries || 3,
        timeoutMs: this.options.timeoutMs || 30000,
        enableResourceTracking: this.options.enableResourceTracking || true,
        enableMetrics: this.options.enableMetrics || true,
        continueOnStepFailure: this.options.continueOnStepFailure || false
      }
    };
    
    // Merge with provided config
    if (this.options.pipelineConfig) {
      return {
        ...defaultConfig,
        ...this.options.pipelineConfig,
        options: {
          ...defaultConfig.options,
          ...this.options.pipelineConfig.options
        }
      };
    }
    
    return defaultConfig;
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
      },
      structure: {
        srcDir: 'src',
        componentsDir: 'src/components',
        typesDir: 'src/types',
        utilsDir: 'src/utils'
      },
      dependencies: {
        react: '^18.0.0',
        typescript: '^5.0.0',
        '@radix-ui/react-button': '^1.0.0',
        'tailwindcss': '^3.0.0',
        'class-variance-authority': '^0.7.0',
        'clsx': '^2.0.0'
      }
    };
  }
}

/**
 * Utility function to create orchestrator with default settings
 */
export function createPipelineOrchestrator(
  projectConfigPath?: string,
  options?: PipelineOrchestratorOptions
): PipelineOrchestrator {
  return new PipelineOrchestrator(projectConfigPath, options);
}

/**
 * Utility function for quick transformation with pipeline
 */
export async function transformWithPipeline(
  elements: FigmaElement[],
  options?: PipelineOrchestratorOptions & {
    projectConfig?: ProjectConfig;
  }
): Promise<TransformationResult> {
  const orchestrator = createPipelineOrchestrator(undefined, options);
  
  const projectConfig = options?.projectConfig || orchestrator['getDefaultProjectConfig']();
  
  return orchestrator.transformElements(elements, projectConfig);
}

/**
 * Utility function for streaming transformation
 */
export async function transformWithStreaming(
  elements: FigmaElement[],
  progressCallback: (progress: TransformationProgress) => void,
  options?: PipelineOrchestratorOptions & {
    projectConfig?: ProjectConfig;
  }
): Promise<PipelineExecutionResult> {
  const orchestrator = createPipelineOrchestrator(undefined, options);
  
  const projectConfig = options?.projectConfig || orchestrator['getDefaultProjectConfig']();
  
  return orchestrator.executeWithStreaming(elements, projectConfig, progressCallback);
}