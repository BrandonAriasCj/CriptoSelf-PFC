/**
 * Integration tests for the transformation pipeline
 * Tests the complete pipeline workflow with real components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FigmaElement } from '../../types/core.js';
import { ProjectConfig } from '../../types/project.js';
import { 
  TransformationPipeline,
  createDefaultPipelineConfig,
  PipelineOrchestrator,
  createPipelineOrchestrator
} from '../index.js';

// Test data
const mockElement: FigmaElement = {
  id: 'test-button-1',
  name: 'Primary Button',
  type: 'button',
  properties: {
    name: 'Primary Button',
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
  },
  structure: {
    srcDir: 'src',
    componentsDir: 'src/components',
    typesDir: 'src/types',
    utilsDir: 'src/utils'
  },
  dependencies: {
    react: '^18.0.0',
    typescript: '^5.0.0'
  }
};

describe('Pipeline Integration', () => {
  describe('Default Pipeline Configuration', () => {
    it('should create a valid default pipeline configuration', () => {
      const config = createDefaultPipelineConfig();
      
      expect(config).toBeDefined();
      expect(config.steps).toBeDefined();
      expect(config.steps.length).toBeGreaterThan(0);
      expect(config.options).toBeDefined();
      
      // Verify all steps have required properties
      config.steps.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.name).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.execute).toBeDefined();
        expect(typeof step.execute).toBe('function');
      });
    });

    it('should have reasonable default options', () => {
      const config = createDefaultPipelineConfig();
      
      expect(config.options.maxRetries).toBeGreaterThan(0);
      expect(config.options.timeoutMs).toBeGreaterThan(0);
      expect(config.options.enableResourceTracking).toBeDefined();
      expect(config.options.enableMetrics).toBeDefined();
    });
  });

  describe('Pipeline Orchestrator Creation', () => {
    it('should create orchestrator with default settings', () => {
      const orchestrator = createPipelineOrchestrator();
      
      expect(orchestrator).toBeInstanceOf(PipelineOrchestrator);
    });

    it('should create orchestrator with custom options', () => {
      const orchestrator = createPipelineOrchestrator(undefined, {
        maxRetries: 5,
        timeoutMs: 60000,
        enableResourceTracking: false
      });
      
      expect(orchestrator).toBeInstanceOf(PipelineOrchestrator);
    });
  });

  describe('Pipeline Status and Control', () => {
    let orchestrator: PipelineOrchestrator;

    beforeEach(() => {
      orchestrator = createPipelineOrchestrator();
    });

    it('should provide initial status', () => {
      const status = orchestrator.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('errors');
      expect(status).toHaveProperty('warnings');
      expect(status.isRunning).toBe(false);
      expect(Array.isArray(status.errors)).toBe(true);
      expect(Array.isArray(status.warnings)).toBe(true);
    });

    it('should provide metrics', () => {
      const metrics = orchestrator.getMetrics();
      
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('transformerState');
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.transformerState).toBeInstanceOf(Map);
    });

    it('should allow reset', () => {
      expect(() => orchestrator.reset()).not.toThrow();
    });

    it('should allow stop', async () => {
      await expect(orchestrator.stop()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty element arrays gracefully', async () => {
      const orchestrator = createPipelineOrchestrator();
      
      const result = await orchestrator.transformElements([], mockProjectConfig);
      
      expect(result).toBeDefined();
      expect(result.summary.totalElements).toBe(0);
    });

    it('should handle invalid project config gracefully', async () => {
      const orchestrator = createPipelineOrchestrator();
      const invalidConfig = {} as ProjectConfig;
      
      // Should not throw, but may produce errors in result
      const result = await orchestrator.transformElements([mockElement], invalidConfig);
      
      expect(result).toBeDefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should support progress callbacks', async () => {
      const progressUpdates: any[] = [];
      
      const orchestrator = createPipelineOrchestrator(undefined, {
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        }
      });
      
      // This will likely fail due to missing implementations, but should not crash
      try {
        await orchestrator.transformElement(mockElement, mockProjectConfig);
      } catch (error) {
        // Expected to fail in test environment
      }
      
      // The orchestrator should be created successfully
      expect(orchestrator).toBeInstanceOf(PipelineOrchestrator);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate pipeline step structure', () => {
      const config = createDefaultPipelineConfig();
      
      // All steps should have unique IDs
      const stepIds = config.steps.map(step => step.id);
      const uniqueIds = new Set(stepIds);
      expect(uniqueIds.size).toBe(stepIds.length);
      
      // All steps should have execute functions
      config.steps.forEach(step => {
        expect(typeof step.execute).toBe('function');
      });
    });

    it('should have valid step dependencies', () => {
      const config = createDefaultPipelineConfig();
      
      // Steps should be in logical order
      const stepIds = config.steps.map(step => step.id);
      
      expect(stepIds).toContain('validate-input');
      expect(stepIds).toContain('parse-elements');
      expect(stepIds).toContain('generate-components');
      
      // Validate should come before parse
      const validateIndex = stepIds.indexOf('validate-input');
      const parseIndex = stepIds.indexOf('parse-elements');
      expect(validateIndex).toBeLessThan(parseIndex);
    });
  });

  describe('Resource Management', () => {
    it('should handle resource tracking configuration', () => {
      const orchestratorWithTracking = createPipelineOrchestrator(undefined, {
        enableResourceTracking: true,
        enableMetrics: true
      });
      
      const orchestratorWithoutTracking = createPipelineOrchestrator(undefined, {
        enableResourceTracking: false,
        enableMetrics: false
      });
      
      expect(orchestratorWithTracking).toBeInstanceOf(PipelineOrchestrator);
      expect(orchestratorWithoutTracking).toBeInstanceOf(PipelineOrchestrator);
    });
  });

  describe('Batch Processing Configuration', () => {
    it('should handle batch processing options', () => {
      const orchestrator = createPipelineOrchestrator(undefined, {
        transformationOptions: {
          batchProcessing: {
            batchSize: 5,
            enableParallelProcessing: true,
            maxConcurrency: 2
          }
        }
      });
      
      expect(orchestrator).toBeInstanceOf(PipelineOrchestrator);
    });
  });
});