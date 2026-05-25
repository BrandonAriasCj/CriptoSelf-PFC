/**
 * Concrete pipeline steps that integrate with the FigmaToReactTransformer
 * Each step implements specific transformation logic with proper error handling
 */

import { FigmaElement } from '../types/core.js';
import { GeneratedComponent } from '../types/component.js';
import { ValidationResult } from '../types/validation.js';

import { FigmaToReactTransformer } from '../figma-to-react-transformer.js';
import { PipelineStep, PipelineContext, PipelineStepResult } from './transformation-pipeline.js';

import { VisualElementParser } from '../parsers/visual-element-parser.js';
import { HierarchyAnalyzer } from '../parsers/hierarchy-analyzer.js';
import { PatternMatcher } from '../parsers/pattern-matcher.js';
import { ReactComponentGenerator } from '../generators/react-component-generator.js';
import { IntegrationManager } from '../integration/integration-manager.js';
import { FigmaElementErrorHandler } from '../validation/error-handler.js';

/**
 * Step 1: Validate Input Elements
 */
export const validateInputStep: PipelineStep = {
  id: 'validate-input',
  name: 'Validate Input Elements',
  description: 'Validate Figma elements and check for required properties',
  retryable: true,
  timeout: 10000,
  
  execute: async (context: PipelineContext): Promise<PipelineStepResult> => {
    const startTime = Date.now();
    const errorHandler = new FigmaElementErrorHandler();
    const validationResults: ValidationResult[] = [];
    const errors: Error[] = [];
    const warnings: string[] = [];
    
    try {
      // Validate each element
      for (let i = 0; i < context.elements.length; i++) {
        const element = context.elements[i];
        
        try {
          const validationResult = errorHandler.validateElement(element);
          validationResults.push(validationResult);
          
          if (!validationResult.isValid) {
            const errorMessages = validationResult.errors.map(e => e.message);
            warnings.push(`Element ${element.id} validation issues: ${errorMessages.join(', ')}`);
          }
          
          // Update progress
          context.progress.elementsProcessed = i + 1;
          if (context.onProgress) {
            context.onProgress(context.progress);
          }
          
        } catch (error) {
          const validationError = new Error(`Failed to validate element ${element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errors.push(validationError);
          
          validationResults.push({
            isValid: false,
            errors: [{
              code: 'VALIDATION_ERROR',
              message: validationError.message,
              severity: 'critical' as const
            }],
            warnings: []
          });
        }
      }
      
      // Store validation results in context
      context.validationResults = validationResults;
      
      // Check if we should continue
      const criticalErrors = validationResults.filter(r => !r.isValid && r.errors.some(e => e.severity === 'critical'));
      const shouldContinue = criticalErrors.length === 0 || context.options.errorHandling?.continueOnErrors;
      
      if (!shouldContinue) {
        return {
          success: false,
          data: validationResults,
          errors: [new Error(`Critical validation errors found in ${criticalErrors.length} elements`)],
          warnings,
          metrics: {
            duration: Date.now() - startTime,
            resourcesAllocated: ['validation-results']
          }
        };
      }
      
      return {
        success: true,
        data: validationResults,
        errors,
        warnings,
        metrics: {
          duration: Date.now() - startTime,
          resourcesAllocated: ['validation-results']
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error : new Error('Validation step failed')],
        metrics: {
          duration: Date.now() - startTime
        }
      };
    }
  },
  
  cleanup: async (context: PipelineContext): Promise<void> => {
    // Clean up validation resources
    context.resources.delete('validation-results');
  }
};

/**
 * Step 2: Parse Figma Elements
 */
export const parseElementsStep: PipelineStep = {
  id: 'parse-elements',
  name: 'Parse Figma Elements',
  description: 'Parse visual elements and extract properties',
  retryable: true,
  timeout: 15000,
  
  execute: async (context: PipelineContext): Promise<PipelineStepResult> => {
    const startTime = Date.now();
    const parser = new VisualElementParser();
    const parsedElements: any[] = [];
    const errors: Error[] = [];
    const warnings: string[] = [];
    
    try {
      // Parse each element
      for (let i = 0; i < context.elements.length; i++) {
        const element = context.elements[i];
        
        try {
          const parsedElement = parser.parseElement(element);
          parsedElements.push(parsedElement);
          
          // Store in context state
          context.state.set(`parsed_${element.id}`, parsedElement);
          
          // Update progress
          context.progress.elementsProcessed = i + 1;
          if (context.onProgress) {
            context.onProgress(context.progress);
          }
          
        } catch (error) {
          const parseError = new Error(`Failed to parse element ${element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errors.push(parseError);
          warnings.push(`Skipping element ${element.id} due to parsing error`);
          
          // Create minimal parsed element for fallback
          if (context.options.errorHandling?.enableFallbacks) {
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
          }
        }
      }
      
      // Store parsed elements in context
      context.parsedElements = parsedElements;
      
      return {
        success: errors.length === 0 || context.options.errorHandling?.continueOnErrors === true,
        data: parsedElements,
        errors,
        warnings,
        metrics: {
          duration: Date.now() - startTime,
          resourcesAllocated: ['parsed-elements']
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error : new Error('Element parsing step failed')],
        metrics: {
          duration: Date.now() - startTime
        }
      };
    }
  },
  
  cleanup: async (context: PipelineContext): Promise<void> => {
    // Clean up parsing resources
    context.resources.delete('parsed-elements');
  }
};

/**
 * Step 3: Analyze Element Hierarchy
 */
export const analyzeHierarchyStep: PipelineStep = {
  id: 'analyze-hierarchy',
  name: 'Analyze Element Hierarchy',
  description: 'Build component hierarchy and relationships',
  retryable: false,
  timeout: 10000,
  
  execute: async (context: PipelineContext): Promise<PipelineStepResult> => {
    const startTime = Date.now();
    const analyzer = new HierarchyAnalyzer();
    
    try {
      if (!context.parsedElements) {
        throw new Error('Parsed elements not available for hierarchy analysis');
      }
      
      const elements = context.parsedElements.map((pe: any) => pe.element);
      const hierarchyResult = analyzer.analyzeHierarchy(elements);
      
      // Store hierarchy analysis in context
      context.hierarchyAnalysis = hierarchyResult;
      context.state.set('hierarchy_analysis', hierarchyResult);
      
      return {
        success: true,
        data: hierarchyResult,
        metrics: {
          duration: Date.now() - startTime,
          resourcesAllocated: ['hierarchy-analysis']
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error : new Error('Hierarchy analysis step failed')],
        metrics: {
          duration: Date.now() - startTime
        }
      };
    }
  },
  
  cleanup: async (context: PipelineContext): Promise<void> => {
    // Clean up hierarchy analysis resources
    context.resources.delete('hierarchy-analysis');
  }
};

/**
 * Step 4: Match UI Patterns
 */
export const matchPatternsStep: PipelineStep = {
  id: 'match-patterns',
  name: 'Match UI Patterns',
  description: 'Match elements to existing UI components',
  retryable: true,
  timeout: 10000,
  
  execute: async (context: PipelineContext): Promise<PipelineStepResult> => {
    const startTime = Date.now();
    const matcher = new PatternMatcher(context.projectConfig);
    const patternResults = new Map();
    const warnings: string[] = [];
    
    try {
      if (!context.parsedElements) {
        throw new Error('Parsed elements not available for pattern matching');
      }
      
      // Match patterns for each parsed element
      for (const parsedElement of context.parsedElements) {
        try {
          const matches = matcher.findMatches(parsedElement.element);
          patternResults.set(parsedElement.element.id, matches);
          
          if (matches.length === 0) {
            warnings.push(`No pattern matches found for element ${parsedElement.element.id}`);
          }
          
        } catch (error) {
          warnings.push(`Pattern matching failed for element ${parsedElement.element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          patternResults.set(parsedElement.element.id, []);
        }
      }
      
      // Store pattern matches in context
      context.patternMatches = patternResults;
      context.state.set('pattern_matches', patternResults);
      
      return {
        success: true,
        data: patternResults,
        warnings,
        metrics: {
          duration: Date.now() - startTime,
          resourcesAllocated: ['pattern-matches']
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error : new Error('Pattern matching step failed')],
        metrics: {
          duration: Date.now() - startTime
        }
      };
    }
  },
  
  cleanup: async (context: PipelineContext): Promise<void> => {
    // Clean up pattern matching resources
    context.resources.delete('pattern-matches');
  }
};

/**
 * Step 5: Generate React Components
 */
export const generateComponentsStep: PipelineStep = {
  id: 'generate-components',
  name: 'Generate React Components',
  description: 'Generate React components with TypeScript',
  retryable: true,
  timeout: 20000,
  
  execute: async (context: PipelineContext): Promise<PipelineStepResult> => {
    const startTime = Date.now();
    const generationContext = {
      projectConfig: context.projectConfig,
      existingComponents: new Map(),
      uiLibrary: context.projectConfig.uiLibrary
    };
    
    const generator = new ReactComponentGenerator(
      generationContext,
      context.options.importResolution || {},
      context.options.componentGeneration
    );
    
    const components: GeneratedComponent[] = [];
    const errors: Error[] = [];
    const warnings: string[] = [];
    
    try {
      if (!context.parsedElements) {
        throw new Error('Parsed elements not available for component generation');
      }
      
      // Generate components for each parsed element
      for (let i = 0; i < context.parsedElements.length; i++) {
        const parsedElement = context.parsedElements[i];
        
        try {
          const component = generator.generateComponent(parsedElement.element);
          components.push(component);
          
          // Store component in context state
          context.state.set(`component_${parsedElement.element.id}`, component);
          
          // Update progress
          context.progress.elementsProcessed = i + 1;
          if (context.onProgress) {
            context.onProgress(context.progress);
          }
          
        } catch (error) {
          const genError = new Error(`Failed to generate component for element ${parsedElement.element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errors.push(genError);
          
          // Use fallback component generation if enabled
          if (context.options.errorHandling?.enableFallbacks) {
            try {
              // Create a basic fallback component
              const fallbackComponent: GeneratedComponent = {
                name: `Fallback${parsedElement.element.id}`,
                filePath: `src/components/Fallback${parsedElement.element.id}.tsx`,
                imports: [
                  { source: 'react', specifiers: [{ name: 'React', isDefault: true }] }
                ],
                props: {
                  className: { type: 'string', required: false, defaultValue: '""' }
                },
                jsx: `<div className={className}>Fallback Component</div>`,
                exports: [{ name: `Fallback${parsedElement.element.id}`, isDefault: true }]
              };
              
              components.push(fallbackComponent);
              warnings.push(`Used fallback component for element ${parsedElement.element.id}`);
              
            } catch (fallbackError) {
              warnings.push(`Fallback component generation also failed for element ${parsedElement.element.id}`);
            }
          }
        }
      }
      
      // Store generated components in context
      context.generatedComponents = components;
      
      return {
        success: errors.length === 0 || context.options.errorHandling?.continueOnErrors === true,
        data: components,
        errors,
        warnings,
        metrics: {
          duration: Date.now() - startTime,
          resourcesAllocated: ['generated-components']
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error : new Error('Component generation step failed')],
        metrics: {
          duration: Date.now() - startTime
        }
      };
    }
  },
  
  cleanup: async (context: PipelineContext): Promise<void> => {
    // Clean up component generation resources
    context.resources.delete('generated-components');
  }
};

/**
 * Step 6: Integrate with Project
 */
export const integrateComponentsStep: PipelineStep = {
  id: 'integrate-components',
  name: 'Integrate with Project',
  description: 'Integrate generated components with existing project',
  retryable: true,
  timeout: 15000,
  
  execute: async (context: PipelineContext): Promise<PipelineStepResult> => {
    const startTime = Date.now();
    const integrationManager = new IntegrationManager(
      context.projectConfig,
      context.options.integration
    );
    
    try {
      if (!context.generatedComponents) {
        throw new Error('Generated components not available for integration');
      }
      
      const integrationResult = await integrationManager.integrateComponents(context.generatedComponents);
      
      // Store integration result in context
      context.integrationResult = integrationResult;
      context.state.set('integration_result', integrationResult);
      
      return {
        success: integrationResult.success,
        data: integrationResult,
        errors: integrationResult.success ? [] : [new Error('Integration failed')],
        warnings: integrationResult.warnings || [],
        metrics: {
          duration: Date.now() - startTime,
          resourcesAllocated: ['integration-result']
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error : new Error('Integration step failed')],
        metrics: {
          duration: Date.now() - startTime
        }
      };
    }
  },
  
  cleanup: async (context: PipelineContext): Promise<void> => {
    // Clean up integration resources
    context.resources.delete('integration-result');
  }
};

/**
 * Create complete pipeline steps array
 */
export function createPipelineSteps(): PipelineStep[] {
  return [
    validateInputStep,
    parseElementsStep,
    analyzeHierarchyStep,
    matchPatternsStep,
    generateComponentsStep,
    integrateComponentsStep
  ];
}

/**
 * Create pipeline step by ID
 */
export function createPipelineStep(stepId: string): PipelineStep | null {
  const steps = createPipelineSteps();
  return steps.find(step => step.id === stepId) || null;
}