/**
 * Simplified integration workflow tests
 * Tests the core integration functionality with minimal setup
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectCompatibilityValidator } from '../project-compatibility-validator.js';
import { FileSystemIntegration } from '../file-system-integration.js';
import { IntegrationManager } from '../integration-manager.js';
import type { ProjectConfig, GeneratedComponent } from '../../types/index.js';

describe('Integration Workflow Tests', () => {
  let projectConfig: ProjectConfig;
  let testComponent: GeneratedComponent;

  beforeEach(() => {
    projectConfig = {
      framework: 'react',
      typescript: true,
      bundler: 'vite',
      compiler: 'swc',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        typescript: '^5.0.0',
        '@types/react': '^18.0.0',
        '@vitejs/plugin-react-swc': '^3.0.0',
        tailwindcss: '^3.3.0'
      },
      uiLibrary: {
        name: 'radix-ui',
        components: ['@radix-ui/react-button'],
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
      structure: {
        srcDirectory: 'src',
        componentsDirectory: 'components',
        typesDirectory: 'types',
        utilsDirectory: 'utils',
        stylesDirectory: 'styles',
        testDirectory: '__tests__'
      },
      conventions: {
        componentNaming: 'PascalCase',
        fileNaming: 'ComponentName.tsx',
        propsInterface: 'ComponentNameProps',
        exportPattern: 'default'
      }
    };

    testComponent = {
      name: 'TestButton',
      filePath: 'src/components/TestButton.tsx',
      imports: [
        {
          imports: [{ name: 'React', isDefault: true }],
          source: 'react'
        }
      ],
      props: {
        children: { type: 'React.ReactNode', required: false },
        className: { type: 'string', required: false }
      },
      jsx: '<button className={className}>{children}</button>',
      exports: [{ name: 'TestButton', isDefault: true }]
    };
  });

  describe('Project Compatibility Validation', () => {
    it('should validate a properly configured project', async () => {
      const validator = new ProjectCompatibilityValidator(projectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate component compatibility', async () => {
      const validator = new ProjectCompatibilityValidator(projectConfig);
      
      const result = await validator.validateComponentCompatibility(testComponent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing dependencies', async () => {
      const configWithMissingDeps = {
        ...projectConfig,
        dependencies: {
          react: '^18.2.0'
          // Missing other required dependencies
        }
      };
      
      const validator = new ProjectCompatibilityValidator(configWithMissingDeps);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('File System Integration', () => {
    it('should integrate a component successfully', async () => {
      const fileSystem = new FileSystemIntegration(projectConfig);
      
      const result = await fileSystem.integrateComponent(testComponent);
      
      expect(result.success).toBe(true);
      expect(result.component?.name).toBe('TestButton');
      expect(result.component?.filePath).toBe('src/components/TestButton.tsx');
    });

    it('should generate proper file structure', () => {
      const fileSystem = new FileSystemIntegration(projectConfig);
      
      const structure = fileSystem.generateFileStructure(testComponent);
      
      expect(structure.mainFile).toBe('src/components/TestButton.tsx');
      expect(structure.testFile).toBe('src/components/__tests__/TestButton.test.tsx');
      expect(structure.indexFile).toBe('src/components/index.ts');
    });

    it('should resolve import paths correctly', () => {
      const componentWithImports = {
        ...testComponent,
        imports: [
          {
            imports: [{ name: 'Button', isDefault: false }],
            source: '@/components/ui/Button'
          }
        ]
      };
      
      const fileSystem = new FileSystemIntegration(projectConfig);
      const resolved = fileSystem.resolveImportPaths(componentWithImports);
      
      expect(resolved.imports[0].source).toBe('src/components/ui/Button');
    });
  });

  describe('End-to-End Integration Manager', () => {
    it('should complete full integration workflow', async () => {
      const manager = new IntegrationManager(projectConfig);
      
      const result = await manager.integrateComponent(testComponent);
      
      expect(result.success).toBe(true);
      expect(result.finalComponent).toBeDefined();
      expect(result.summary.criticalIssues).toBe(0);
    });

    it('should process multiple components', async () => {
      const manager = new IntegrationManager(projectConfig);
      
      const components = [
        testComponent,
        {
          ...testComponent,
          name: 'TestInput',
          filePath: 'src/components/TestInput.tsx'
        }
      ];
      
      const result = await manager.integrateComponents(components);
      
      expect(result.overall.success).toBe(true);
      expect(result.overall.processedComponents).toBe(2);
      expect(result.individual.size).toBe(2);
    });

    it('should provide integration report', async () => {
      const manager = new IntegrationManager(projectConfig);
      
      const report = await manager.getIntegrationReport([testComponent]);
      
      expect(report.projectCompatibility.isValid).toBe(true);
      expect(report.estimatedFileChanges).toBe(1);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should perform dry run without changes', async () => {
      const manager = new IntegrationManager(projectConfig);
      
      const result = await manager.dryRun([testComponent]);
      
      expect(result.overall.processedComponents).toBe(1);
      expect(result.fileSystemResult).toBeUndefined();
    });

    it('should validate project setup', async () => {
      const manager = new IntegrationManager(projectConfig);
      
      const result = await manager.validateProjectSetup();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid component gracefully', async () => {
      const invalidComponent = {
        ...testComponent,
        name: '', // Invalid name
        filePath: ''
      };
      
      const manager = new IntegrationManager(projectConfig);
      const result = await manager.integrateComponent(invalidComponent);
      
      expect(result.success).toBe(false);
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });

    it('should continue processing on warnings', async () => {
      const manager = new IntegrationManager(projectConfig, {
        continueOnWarnings: true
      });
      
      const componentWithWarnings = {
        ...testComponent,
        jsx: '' // Empty JSX might trigger warnings
      };
      
      const result = await manager.integrateComponent(componentWithWarnings);
      
      // Should succeed despite warnings
      expect(result.success).toBe(true);
    });

    it('should generate summary report', async () => {
      const manager = new IntegrationManager(projectConfig);
      const components = [testComponent];
      
      const result = await manager.integrateComponents(components);
      const report = manager.generateSummaryReport(result);
      
      expect(report).toContain('Integration Summary Report');
      expect(report).toContain('Overall Status:');
      expect(report).toContain('TestButton: SUCCESS');
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple components efficiently', async () => {
      const manager = new IntegrationManager(projectConfig);
      
      // Generate 10 test components
      const components = Array.from({ length: 10 }, (_, i) => ({
        ...testComponent,
        name: `Component${i}`,
        filePath: `src/components/Component${i}.tsx`
      }));
      
      const startTime = performance.now();
      const result = await manager.integrateComponents(components);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(result.overall.processedComponents).toBe(10);
    });
  });
});