/**
 * Pipeline module exports
 * Provides transformation pipeline functionality with progress tracking and resource management
 */

// Core pipeline classes
export {
  TransformationPipeline,
  type PipelineStep,
  type PipelineContext,
  type PipelineStepResult,
  type PipelineConfig,
  type PipelineExecutionResult,
  createDefaultPipelineConfig
} from './transformation-pipeline.js';

// Pipeline orchestrator
export {
  PipelineOrchestrator,
  type PipelineOrchestratorOptions,
  type PipelineStatus,
  createPipelineOrchestrator,
  transformWithPipeline,
  transformWithStreaming
} from './pipeline-orchestrator.js';

// Concrete pipeline steps
export {
  validateInputStep,
  parseElementsStep,
  analyzeHierarchyStep,
  matchPatternsStep,
  generateComponentsStep,
  integrateComponentsStep,
  createPipelineSteps,
  createPipelineStep
} from './pipeline-steps.js';

// Re-export transformation types for convenience
export type {
  TransformationProgress,
  TransformationStep,
  TransformationOptions,
  TransformationResult
} from '../figma-to-react-transformer.js';