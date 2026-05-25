/**
 * Unit tests for IntegrationManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegrationManager } from '../integration-manager.js';
import type { ProjectConfig, GeneratedComponent } from '../../types/index.js';

// Mock the sub-components
vi.mock('../project-compatibility-validator.js');
vi.mock('../code-quality-checker.js');
vi.mock('../file-system-integration.js');

describe('IntegrationManager', () => {
  let mockProjectConfig: ProjectConfig;
  let manager: IntegrationManager;

  beforeEach(() => {
    mockProjectConfig = {
      framework: 'react',
      typescript: true,
      bundler: 'vite',
      compiler: 'swc',
      uiLibrary: {
        name: 'radix-ui',
        components: [],
        utilities: { classNames: 'cn', variants: 'cva' }
      },
      styling: {
        framework: 'tailwind',
        customClasses: true,
        responsiveBreakpoints: ['sm', 'md', 'lg', 'xl']
      },
      conventions: {
        componentNaming: 'PascalCase',
        fileNaming: 'ComponentName.tsx',
        propsInterface: 'ComponentNameProps',
        exportPattern: 'named'
      },
      structure: {
        srcDirectory: 'src',
        componentsDirectory: 'components',
        typesDirectory: 'types',
        utilsDirectory: 'utils',
        stylesDirectory: 'styles'
      },
      dependencies: {
        react: '^18.2.0'
      }
    };

    manager = new IntegrationManager(mockProjectConfig);
  });

  describe('integrateComponent', () => {
    let validComponent: GeneratedComponent;

    beforeEach(() => {
      validComponent = {
        name: 'TestButton',
        filePath: 'src/components/TestButton.tsx',
        imports: [
          {
            source: 'react',
            imports: [{ name: 'React', isDefault: true }]
          }
        ],
        props: {
          variant: { type: 'string', required: false },
          children: { type: 'React.ReactNode', required: true }
        },
        jsx: '<button>{children}</button>',
        exports: [{ name: 'TestButton', isDefault: false }]
      };
    });

    it('should successfully integrate a valid component', async () => {
      const result = await manager.integrateComponent(validComponent);
      
      expect(result.success).toBe(true);
      expect(result.finalComponent).toBeDefined();
      expect(result.summary.criticalIssues).toBe(0);
    });

    it('should perform all integration steps by default', async () => {
      const result = await manager.integrateComponent(validComponent);
      
      expect(result.compatibility).toBeDefined();
      expect(result.codeQuality).toBeDefined();
      expect(result.fileSystem).toBeDefined();
    });

    it('should skip steps when disabled in options', async () => {
      manager = new IntegrationManager(mockProjectConfig, {
        validateCompatibility: false,
        checkCodeQuality: false,
        integrateFileSystem: false
      });
      
      const result = await manager.integrateComponent(validComponent);
      
      expect(result.compatibility).toBeUndefined();
      expect(result.codeQuality).toBeUndefined();
      expect(result.fileSystem).toBeUndefined();
      expect(result.finalComponent).toEqual(validComponent);
    });

    it('should handle errors gracefully', async () => {
      // Create a component that will cause validation errors
      const invalidComponent: GeneratedComponent = {
        name: '', // Invalid name
        filePath: '',
        imports: [],
        props: {},
        jsx: '',
        exports: []
      };
      
      const result = await manager.integrateComponent(invalidComponent);
      
      expect(result.success).toBe(false);
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });

    it('should continue on warnings when configured', async () => {
      manager = new IntegrationManager(mockProjectConfig, {
        continueOnWarnings: true
      });
      
      const result = await manager.integrateComponent(validComponent);
      
      // Should succeed even if there are warnings
      expect(result.success).toBe(true);
    });

    it('should stop on errors when configured', async () => {
      manager = new IntegrationManager(mockProjectConfig, {
        continueOnErrors: false
      });
      
      const invalidComponent: GeneratedComponent = {
        name: '', // This will cause an error
        filePath: '',
        imports: [],
        props: {},
        jsx: '',
        exports: []
      };
      
      const result = await manager.integrateComponent(invalidComponent);
      
      expect(result.success).toBe(false);
    });

    it('should generate appropriate suggestions', async () => {
      const result = await manager.integrateComponent(validComponent);
      
      expect(result.summary.suggestions).toBeDefined();
      expect(Array.isArray(result.summary.suggestions)).toBe(true);
    });

    it('should calculate summary statistics correctly', async () => {
      const result = await manager.integrateComponent(validComponent);
      
      expect(result.summary.totalIssues).toBeGreaterThanOrEqual(0);
      expect(result.summary.criticalIssues).toBeGreaterThanOrEqual(0);
      expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalIssues).toBeGreaterThanOrEqual(
        result.summary.criticalIssues + result.summary.warnings
      );
    });
  });

  describe('integrateComponents', () => {
    let components: GeneratedComponent[];

    beforeEach(() => {
      components = [
        {
          name: 'Component1',
          filePath: 'src/components/Component1.tsx',
          imports: [],
          props: {},
          jsx: '<div>Component 1</div>',
          exports: [{ name: 'Component1' }]
        },
        {
          name: 'Component2',
          filePath: 'src/components/Component2.tsx',
          imports: [],
          props: {},
          jsx: '<div>Component 2</div>',
          exports: [{ name: 'Component2' }]
        }
      ];
    });

    it('should integrate multiple components', async () => {
      const result = await manager.integrateComponents(components);
      
      expect(result.overall.processedComponents).toBe(2);
      expect(result.individual.size).toBe(2);
      expect(result.individual.has('Component1')).toBe(true);
      expect(result.individual.has('Component2')).toBe(true);
    });

    it('should calculate aggregate statistics', async () => {
      const result = await manager.integrateComponents(components);
      
      expect(result.overall.totalIssues).toBeGreaterThanOrEqual(0);
      expect(result.overall.criticalIssues).toBeGreaterThanOrEqual(0);
      expect(result.overall.warnings).toBeGreaterThanOrEqual(0);
      expect(result.overall.suggestions).toBeDefined();
    });

    it('should handle mixed success and failure', async () => {
      const mixedComponents: GeneratedComponent[] = [
        ...components,
        {
          name: '', // Invalid component
          filePath: '',
          imports: [],
          props: {},
          jsx: '',
          exports: []
        }
      ];
      
      const result = await manager.integrateComponents(mixedComponents);
      
      expect(result.overall.processedComponents).toBe(3);
      expect(result.overall.failedComponents).toBeGreaterThan(0);
      expect(result.overall.success).toBe(false);
    });

    it('should provide file system integration results', async () => {
      const result = await manager.integrateComponents(components);
      
      expect(result.fileSystemResult).toBeDefined();
    });

    it('should remove duplicate suggestions', async () => {
      // Create components that would generate similar suggestions
      const duplicateComponents: GeneratedComponent[] = [
        {
          name: 'component1', // Invalid naming (will generate same suggestion)
          filePath: 'src/components/component1.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'component1' }]
        },
        {
          name: 'component2', // Invalid naming (will generate same suggestion)
          filePath: 'src/components/component2.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'component2' }]
        }
      ];
      
      const result = await manager.integrateComponents(duplicateComponents);
      
      // Should have unique suggestions
      const uniqueSuggestions = new Set(result.overall.suggestions);
      expect(uniqueSuggestions.size).toBe(result.overall.suggestions.length);
    });
  });

  describe('validateProjectSetup', () => {
    it('should validate project setup', async () => {
      const result = await manager.validateProjectSetup();
      
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('dryRun', () => {
    it('should perform dry run without file system changes', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'TestComponent',
          filePath: 'src/components/TestComponent.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'TestComponent' }]
        }
      ];
      
      const result = await manager.dryRun(components);
      
      expect(result.overall.processedComponents).toBe(1);
      expect(result.fileSystemResult).toBeUndefined();
    });

    it('should provide same validation results as regular run', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'TestComponent',
          filePath: 'src/components/TestComponent.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'TestComponent' }]
        }
      ];
      
      const dryRunResult = await manager.dryRun(components);
      const regularResult = await manager.integrateComponents(components);
      
      // Should have similar issue counts (may differ due to file system integration)
      expect(dryRunResult.overall.processedComponents).toBe(regularResult.overall.processedComponents);
    });
  });

  describe('getIntegrationReport', () => {
    it('should generate integration report', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'TestComponent',
          filePath: 'src/components/TestComponent.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'TestComponent' }]
        }
      ];
      
      const report = await manager.getIntegrationReport(components);
      
      expect(report.projectCompatibility).toBeDefined();
      expect(report.estimatedIssues).toBeGreaterThanOrEqual(0);
      expect(report.recommendations).toBeDefined();
      expect(report.estimatedFileChanges).toBe(1);
    });

    it('should provide recommendations based on analysis', async () => {
      const components: GeneratedComponent[] = [
        {
          name: '', // Invalid component to trigger recommendations
          filePath: '',
          imports: [],
          props: {},
          jsx: '',
          exports: []
        }
      ];
      
      const report = await manager.getIntegrationReport(components);
      
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateSummaryReport', () => {
    it('should generate readable summary report', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'TestComponent',
          filePath: 'src/components/TestComponent.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'TestComponent' }]
        }
      ];
      
      const result = await manager.integrateComponents(components);
      const report = manager.generateSummaryReport(result);
      
      expect(typeof report).toBe('string');
      expect(report).toContain('Integration Summary Report');
      expect(report).toContain('Overall Status');
      expect(report).toContain('Processed Components');
    });

    it('should include component details in report', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'Component1',
          filePath: 'src/components/Component1.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test 1</div>',
          exports: [{ name: 'Component1' }]
        },
        {
          name: 'Component2',
          filePath: 'src/components/Component2.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test 2</div>',
          exports: [{ name: 'Component2' }]
        }
      ];
      
      const result = await manager.integrateComponents(components);
      const report = manager.generateSummaryReport(result);
      
      expect(report).toContain('Component1');
      expect(report).toContain('Component2');
      expect(report).toContain('Component Details');
    });

    it('should show file system integration details when available', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'TestComponent',
          filePath: 'src/components/TestComponent.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'TestComponent' }]
        }
      ];
      
      const result = await manager.integrateComponents(components);
      const report = manager.generateSummaryReport(result);
      
      if (result.fileSystemResult) {
        expect(report).toContain('File System Integration');
        expect(report).toContain('Created Files');
        expect(report).toContain('Created Directories');
      }
    });
  });

  describe('configuration options', () => {
    it('should respect strict mode option', () => {
      const strictManager = new IntegrationManager(mockProjectConfig, {
        strictMode: true
      });
      
      expect(strictManager).toBeDefined();
    });

    it('should handle continue on errors option', async () => {
      const manager = new IntegrationManager(mockProjectConfig, {
        continueOnErrors: true
      });
      
      const invalidComponent: GeneratedComponent = {
        name: '',
        filePath: '',
        imports: [],
        props: {},
        jsx: '',
        exports: []
      };
      
      const result = await manager.integrateComponent(invalidComponent);
      
      // Should continue processing even with errors
      expect(result).toBeDefined();
    });

    it('should handle continue on warnings option', async () => {
      const manager = new IntegrationManager(mockProjectConfig, {
        continueOnWarnings: false
      });
      
      const result = await manager.integrateComponent({
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      });
      
      expect(result).toBeDefined();
    });
  });
});