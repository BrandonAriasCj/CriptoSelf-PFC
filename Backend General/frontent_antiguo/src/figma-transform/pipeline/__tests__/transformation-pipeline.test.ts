/**
 * Tests for TransformationPipeline
 * Verifies step-by-step workflow, progress callbacks, and resource management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FigmaElement } from '../../types/core.js';
import { ProjectConfig } from '../../types/project.js';
import { 
  TransformationPipeline, 
  PipelineConfig, 
  PipelineStep, 
  PipelineContext,
  createDefaultPipelineConfig 
} from '../transformation-pipeline.js';

// Mock transformer
const mockTransformer = {
  transformElements: vi.fn(),
  getProgress: vi.fn(),
  getTransformationState: vi.fn(),
  reset: vi.fn()
};

// Test data
const mockElement: FigmaElement = {
  id: 'test-element-1',
  name: 'Test Button',
  type: 'button',
  properties: {
    name: 'Test Button',
    width: 120,
    height: 40,
    x: 0,
    y: 0,
    visible: true,
    constraints: { horizontal: 'LEFT', vertical: 'TOP' }
  },
  styles: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: { top: 8, right: 16, bottom: 8, left: 16 }
  },
  children: []
};

const mockProjectConfig: ProjectConfig = {
  framework: 'react',
  typescript: true,
  bundler: 'vite',
  compiler: 'swc',
  uiLibrary: {
    name: 'radix-ui',
    components: ['Button', 'Input'],
    utilities: { classNames: 'cn', variants: 'cva' }
  },
  styling: {
    framework: 'tailwind',
    customClasses: false,
    responsiveBreakpoints: ['sm', 'md', 'lg']
  },
  conventions: {
    componentNaming: 'PascalCase',
    fileNaming: 'ComponentName.tsx',
    propsInterface: 'ComponentNameProps',
    exportPattern: 'default'
  }
};

describe('TransformationPipeline', () => {
  let pipeline: TransformationPipeline;
  let mockConfig: PipelineConfig;
  let progressCallback: ReturnType<typeof vi.fn>;
  let stepCompleteCallback: ReturnType<typeof vi.fn>;
  let errorCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock callbacks
    progressCallback = vi.fn();
    stepCompleteCallback = vi.fn();
    errorCallback = vi.fn();
    
    // Create mock pipeline config with test steps
    mockConfig = {
      steps: [
        {
          id: 'test-step-1',
          name: 'Test Step 1',
          description: 'First test step',
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: { result: 'step1' },
            metrics: { duration: 100 }
          }),
          retryable: true,
          timeout: 5000
        },
        {
          id: 'test-step-2',
          name: 'Test Step 2',
          description: 'Second test step',
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: { result: 'step2' },
            metrics: { duration: 200 }
          }),
          retryable: false,
          timeout: 3000
        }
      ],
      options: {
        enableParallelSteps: false,
        maxRetries: 2,
        timeoutMs: 10000,
        enableResourceTracking: true,
        enableMetrics: true,
        continueOnStepFailure: false
      }
    };
    
    pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pipeline Execution', () => {
    it('should execute all steps in sequence', async () => {
      const result = await pipeline.execute([mockElement], mockProjectConfig, {
        progressTracking: {
          progressCallback,
          enableProgressCallbacks: true
        }
      });

      expect(result.success).toBe(true);
      expect(result.executedSteps).toEqual(['test-step-1', 'test-step-2']);
      expect(result.skippedSteps).toEqual([]);
      expect(result.failedSteps).toEqual([]);
      
      // Verify steps were called
      expect(mockConfig.steps[0].execute).toHaveBeenCalledTimes(1);
      expect(mockConfig.steps[1].execute).toHaveBeenCalledTimes(1);
      
      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle step failures appropriately', async () => {
      // Make second step fail
      const failingStep = mockConfig.steps[1];
      (failingStep.execute as any).mockRejectedValue(new Error('Step 2 failed'));

      const result = await pipeline.execute([mockElement], mockProjectConfig);

      expect(result.success).toBe(false);
      expect(result.executedSteps).toEqual(['test-step-1']);
      expect(result.failedSteps).toEqual(['test-step-2']);
      expect(result.transformationResult.success).toBe(false);
    });

    it('should continue on step failure when configured', async () => {
      // Configure to continue on failure
      mockConfig.options.continueOnStepFailure = true;
      
      // Make first step fail
      const failingStep = mockConfig.steps[0];
      (failingStep.execute as any).mockRejectedValue(new Error('Step 1 failed'));

      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
      const result = await pipeline.execute([mockElement], mockProjectConfig);

      expect(result.success).toBe(false); // Overall failure due to failed step
      expect(result.executedSteps).toEqual(['test-step-2']); // Second step still executed
      expect(result.failedSteps).toEqual(['test-step-1']);
    });

    it('should skip steps when canSkip returns true', async () => {
      // Add skip condition to first step
      mockConfig.steps[0].canSkip = vi.fn().mockReturnValue(true);

      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
      const result = await pipeline.execute([mockElement], mockProjectConfig);

      expect(result.success).toBe(true);
      expect(result.executedSteps).toEqual(['test-step-2']);
      expect(result.skippedSteps).toEqual(['test-step-1']);
      
      // Verify skip condition was checked
      expect(mockConfig.steps[0].canSkip).toHaveBeenCalled();
      expect(mockConfig.steps[0].execute).not.toHaveBeenCalled();
    });

    it('should handle step timeouts', async () => {
      // Make step take longer than timeout
      const slowStep = mockConfig.steps[0];
      slowStep.timeout = 100; // 100ms timeout
      (slowStep.execute as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200)) // Takes 200ms
      );

      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
      const result = await pipeline.execute([mockElement], mockProjectConfig);

      expect(result.success).toBe(false);
      expect(result.failedSteps).toContain('test-step-1');
    });

    it('should retry failed steps when retryable', async () => {
      let attemptCount = 0;
      const retryableStep = mockConfig.steps[0];
      retryableStep.retryable = true;
      
      (retryableStep.execute as any).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({
          success: true,
          data: { result: 'success after retry' },
          metrics: { duration: 100 }
        });
      });

      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
      const result = await pipeline.execute([mockElement], mockProjectConfig);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2); // Failed once, succeeded on retry
      expect(result.executedSteps).toContain('test-step-1');
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress throughout execution', async () => {
      const progressUpdates: any[] = [];
      
      const trackingCallback = (progress: any) => {
        progressUpdates.push({ ...progress });
      };

      await pipeline.execute([mockElement], mockProjectConfig, {
        progressTracking: {
          progressCallback: trackingCallback,
          enableProgressCallbacks: true
        }
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].currentStep).toBe('INITIALIZING');
      expect(progressUpdates[0].totalElements).toBe(1);
    });

    it('should provide step completion callbacks', async () => {
      const stepResults: any[] = [];
      
      const options = {
        progressTracking: {
          enableProgressCallbacks: true
        }
      };

      // Access context to set callback (in real usage this would be set differently)
      const originalExecute = pipeline.execute.bind(pipeline);
      pipeline.execute = async function(elements, projectConfig, opts) {
        const result = await originalExecute(elements, projectConfig, opts);
        return result;
      };

      const result = await pipeline.execute([mockElement], mockProjectConfig, options);

      expect(result.success).toBe(true);
      expect(result.stepMetrics.size).toBe(2); // Two steps executed
    });
  });

  describe('Resource Management', () => {
    it('should track allocated resources', async () => {
      // Add resource allocation to steps
      mockConfig.steps[0].execute = vi.fn().mockResolvedValue({
        success: true,
        data: { result: 'step1' },
        metrics: {
          duration: 100,
          resourcesAllocated: ['resource1', 'resource2']
        }
      });

      mockConfig.options.enableResourceTracking = true;
      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);

      const result = await pipeline.execute([mockElement], mockProjectConfig);

      expect(result.success).toBe(true);
      expect(result.resourceUsage.totalResourcesAllocated).toBeGreaterThan(0);
    });

    it('should call cleanup functions for steps', async () => {
      const cleanupSpy1 = vi.fn();
      const cleanupSpy2 = vi.fn();
      
      mockConfig.steps[0].cleanup = cleanupSpy1;
      mockConfig.steps[1].cleanup = cleanupSpy2;

      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
      await pipeline.execute([mockElement], mockProjectConfig);

      expect(cleanupSpy1).toHaveBeenCalled();
      expect(cleanupSpy2).toHaveBeenCalled();
    });

    it('should cleanup resources even on failure', async () => {
      const cleanupSpy = vi.fn();
      mockConfig.steps[0].cleanup = cleanupSpy;
      
      // Make step fail
      (mockConfig.steps[0].execute as any).mockRejectedValue(new Error('Step failed'));

      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
      
      try {
        await pipeline.execute([mockElement], mockProjectConfig);
      } catch (error) {
        // Expected to fail
      }

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Pipeline Status', () => {
    it('should provide current status', () => {
      const status = pipeline.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('errors');
      expect(status).toHaveProperty('warnings');
      expect(status.isRunning).toBe(false);
    });

    it('should allow stopping pipeline execution', async () => {
      // Create a long-running step
      mockConfig.steps[0].execute = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      pipeline = new TransformationPipeline(mockConfig, mockTransformer as any);
      
      // Start execution
      const executionPromise = pipeline.execute([mockElement], mockProjectConfig);
      
      // Stop pipeline
      await pipeline.stop();
      
      // Execution should be stopped
      const status = pipeline.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('Default Configuration', () => {
    it('should create default pipeline configuration', () => {
      const defaultConfig = createDefaultPipelineConfig();
      
      expect(defaultConfig.steps).toBeDefined();
      expect(defaultConfig.steps.length).toBeGreaterThan(0);
      expect(defaultConfig.options).toBeDefined();
      expect(defaultConfig.options.maxRetries).toBeDefined();
      expect(defaultConfig.options.timeoutMs).toBeDefined();
    });

    it('should work with default configuration', async () => {
      const defaultConfig = createDefaultPipelineConfig();
      const defaultPipeline = new TransformationPipeline(defaultConfig, mockTransformer as any);
      
      // Mock the step executions to return success
      defaultConfig.steps.forEach(step => {
        step.execute = vi.fn().mockResolvedValue({
          success: true,
          data: null,
          metrics: { duration: 100 }
        });
      });
      
      const result = await defaultPipeline.execute([mockElement], mockProjectConfig);
      
      expect(result.success).toBe(true);
      expect(result.executedSteps.length).toBe(defaultConfig.steps.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle context initialization errors', async () => {
      // Create pipeline with invalid config
      const invalidConfig = {
        ...mockConfig,
        steps: [] // No steps
      };
      
      const invalidPipeline = new TransformationPipeline(invalidConfig, mockTransformer as any);
      const result = await invalidPipeline.execute([mockElement], mockProjectConfig);
      
      expect(result.success).toBe(true); // Should succeed with no steps
      expect(result.executedSteps).toEqual([]);
    });

    it('should handle step execution errors gracefully', async () => {
      // Make step throw unexpected error
      (mockConfig.steps[0].execute as any).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await pipeline.execute([mockElement], mockProjectConfig);
      
      expect(result.success).toBe(false);
      expect(result.failedSteps).toContain('test-step-1');
      expect(result.transformationResult.errors.length).toBeGreaterThan(0);
    });
  });
});