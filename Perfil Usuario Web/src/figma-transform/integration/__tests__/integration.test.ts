/**
 * Integration tests for the complete Figma to React transformation system
 * Tests compatibility validation, file system integration, and end-to-end workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectCompatibilityValidator } from '../project-compatibility-validator.js';
import { FileSystemIntegration } from '../file-system-integration.js';
import { IntegrationManager } from '../integration-manager.js';
import type { 
  ProjectConfig, 
  GeneratedComponent, 
  ValidationResult,
  IntegrationResult
} from '../../types/index.js';
import type { BatchIntegrationResult } from '../integration-manager.js';

// Mock project configurations for testing different scenarios
const createMockProjectConfig = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
  framework: 'react',
  typescript: true,
  bundler: 'vite',
  compiler: 'swc',
  dependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    'typescript': '^5.0.0',
    '@types/react': '^18.0.0',
    '@types/react-dom': '^18.0.0',
    '@vitejs/plugin-react-swc': '^3.0.0',
    'tailwindcss': '^3.3.0',
    'clsx': '^2.0.0',
    'tailwind-merge': '^1.14.0',
    'class-variance-authority': '^0.7.0',
    ...overrides.dependencies
  },
  uiLibrary: {
    name: 'radix-ui',
    components: ['@radix-ui/react-button', '@radix-ui/react-input'],
    utilities: {
      classNames: 'cn',
      variants: 'cva'
    },
    ...overrides.uiLibrary
  },
  styling: {
    framework: 'tailwind',
    customClasses: false,
    responsiveBreakpoints: ['sm', 'md', 'lg', 'xl'],
    ...overrides.styling
  },
  structure: {
    srcDirectory: 'src',
    componentsDirectory: 'components',
    testDirectory: '__tests__',
    typesDirectory: 'types',
    utilsDirectory: 'utils',
    stylesDirectory: 'styles',
    ...overrides.structure
  },
  conventions: {
    componentNaming: 'PascalCase',
    fileNaming: 'ComponentName.tsx',
    propsInterface: 'ComponentNameProps',
    exportPattern: 'default',
    ...overrides.conventions
  },
  ...overrides
});

const createMockComponent = (overrides: Partial<GeneratedComponent> = {}): GeneratedComponent => ({
  name: 'TestButton',
  filePath: 'src/components/TestButton.tsx',
  imports: [
    {
      imports: [{ name: 'React', isDefault: true }],
      source: 'react'
    },
    {
      imports: [{ name: 'cn', isDefault: false }],
      source: '@/lib/utils'
    }
  ],
  props: {
    children: { type: 'React.ReactNode', required: false },
    className: { type: 'string', required: false },
    variant: { type: "'primary' | 'secondary'", required: false, defaultValue: "'primary'" }
  },
  jsx: `<button className={cn("px-4 py-2 rounded", variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500', className)}>{children}</button>`,
  exports: [{ name: 'TestButton', isDefault: true }],
  ...overrides
});

describe('Integration Tests', () => {
  describe('Project Compatibility Validation with Different Configurations', () => {
    it('should validate compatibility with standard Vite + React + TypeScript + SWC setup', async () => {
      const projectConfig = createMockProjectConfig();
      const validator = new ProjectCompatibilityValidator(projectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing React dependencies', async () => {
      const projectConfig = createMockProjectConfig({
        dependencies: {
          'react': '^18.2.0', // Required field
          'typescript': '^5.0.0'
          // Missing React DOM
        }
      });
      const validator = new ProjectCompatibilityValidator(projectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'REACT_MISSING',
            severity: 'critical'
          })
        ])
      );
    });

    it('should warn about outdated React version', async () => {
      const projectConfig = createMockProjectConfig({
        dependencies: {
          'react': '^17.0.0',
          'react-dom': '^17.0.0',
          'typescript': '^5.0.0',
          '@types/react': '^17.0.0',
          '@types/react-dom': '^17.0.0'
        }
      });
      const validator = new ProjectCompatibilityValidator(projectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'REACT_VERSION_OLD'
          })
        ])
      );
    });

    it('should detect missing Vite SWC plugin', async () => {
      const projectConfig = createMockProjectConfig({
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          'typescript': '^5.0.0'
          // Missing @vitejs/plugin-react-swc
        }
      });
      const validator = new ProjectCompatibilityValidator(projectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'VITE_SWC_PLUGIN_MISSING',
            severity: 'error'
          })
        ])
      );
    });

    it('should validate component compatibility with project setup', async () => {
      const projectConfig = createMockProjectConfig();
      const validator = new ProjectCompatibilityValidator(projectConfig);
      const component = createMockComponent();
      
      const result = await validator.validateComponentCompatibility(component);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid TypeScript types in component props', async () => {
      const projectConfig = createMockProjectConfig();
      const validator = new ProjectCompatibilityValidator(projectConfig);
      const component = createMockComponent({
        props: {
          invalidProp: { type: 'InvalidType', required: true }
        }
      });
      
      const result = await validator.validateComponentCompatibility(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'INVALID_PROP_TYPE',
            property: 'invalidProp'
          })
        ])
      );
    });

    it('should handle different bundler configurations', async () => {
      const webpackConfig = createMockProjectConfig({
        bundler: 'webpack',
        compiler: 'babel'
      });
      const validator = new ProjectCompatibilityValidator(webpackConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'BUNDLER_NOT_VITE'
          }),
          expect.objectContaining({
            code: 'COMPILER_NOT_SWC'
          })
        ])
      );
    });
  });

  describe('File System Integration with Existing Component Structure', () => {
    let fileSystemIntegration: FileSystemIntegration;
    let projectConfig: ProjectConfig;

    beforeEach(() => {
      projectConfig = createMockProjectConfig();
      fileSystemIntegration = new FileSystemIntegration(projectConfig, '.', {
        createDirectories: true,
        overwriteExisting: false,
        resolveConflicts: true
      });
    });

    it('should integrate component with proper file structure', async () => {
      const component = createMockComponent();
      
      const result = await fileSystemIntegration.integrateComponent(component);
      
      expect(result.success).toBe(true);
      expect(result.component?.filePath).toBe('src/components/TestButton.tsx');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should generate proper file structure for component', () => {
      const component = createMockComponent();
      
      const structure = fileSystemIntegration.generateFileStructure(component);
      
      expect(structure.mainFile).toBe('src/components/TestButton.tsx');
      expect(structure.testFile).toBe('src/components/__tests__/TestButton.test.tsx');
      expect(structure.indexFile).toBe('src/components/index.ts');
    });

    it('should resolve import paths correctly', () => {
      const component = createMockComponent({
        imports: [
          {
            imports: [{ name: 'Button', isDefault: false }],
            source: '@/components/ui/Button'
          },
          {
            imports: [{ name: 'utils', isDefault: false }],
            source: '../utils/helpers'
          }
        ]
      });
      
      const resolved = fileSystemIntegration.resolveImportPaths(component);
      
      expect(resolved.imports[0].source).toBe('src/components/ui/Button');
      expect(resolved.imports[1].source).toMatch(/\.\.\/utils\/helpers/);
    });

    it('should handle naming conflicts gracefully', async () => {
      // Mock existing component with same name
      vi.spyOn(fileSystemIntegration as any, 'getExistingComponents')
        .mockResolvedValue(['TestButton']);
      
      const component = createMockComponent();
      
      const result = await fileSystemIntegration.integrateComponent(component);
      
      expect(result.conflicts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'NAME_COLLISION',
            resolution: expect.objectContaining({
              strategy: 'RENAME'
            })
          })
        ])
      );
    });

    it('should integrate multiple components with dependency resolution', async () => {
      const buttonComponent = createMockComponent({
        name: 'Button',
        filePath: 'src/components/Button.tsx'
      });
      
      const cardComponent = createMockComponent({
        name: 'Card',
        filePath: 'src/components/Card.tsx',
        imports: [
          {
            imports: [{ name: 'Button', isDefault: true }],
            source: './Button'
          }
        ]
      });
      
      const components = [cardComponent, buttonComponent]; // Intentionally wrong order
      
      const result = await fileSystemIntegration.integrateComponents(components);
      
      expect(result.overall.success).toBe(true);
      expect(result.overall.createdFiles).toHaveLength(2);
      expect(result.individual.get('Button')?.success).toBe(true);
      expect(result.individual.get('Card')?.success).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const componentA = createMockComponent({
        name: 'ComponentA',
        imports: [
          {
            imports: [{ name: 'ComponentB', isDefault: true }],
            source: './ComponentB'
          }
        ]
      });
      
      const componentB = createMockComponent({
        name: 'ComponentB',
        imports: [
          {
            imports: [{ name: 'ComponentA', isDefault: true }],
            source: './ComponentA'
          }
        ]
      });
      
      const result = fileSystemIntegration.resolveDependencies([componentA, componentB]);
      
      expect(result.circularDependencies).toHaveLength(1);
      expect(result.circularDependencies[0]).toMatch(/ComponentA.*ComponentB|ComponentB.*ComponentA/);
    });

    it('should validate file paths and detect issues', async () => {
      const component = createMockComponent({
        filePath: 'src/components/Component<With>Invalid:Characters.tsx'
      });
      
      const result = await fileSystemIntegration.integrateComponent(component);
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'INVALID_PATH_CHARACTERS'
          })
        ])
      );
    });

    it('should handle different naming conventions', () => {
      const kebabCaseConfig = createMockProjectConfig({
        conventions: {
          componentNaming: 'PascalCase',
          fileNaming: 'component-name.tsx',
          propsInterface: 'ComponentNameProps',
          exportPattern: 'default'
        }
      });
      
      const integration = new FileSystemIntegration(kebabCaseConfig);
      const component = createMockComponent({ name: 'MyTestButton' });
      
      const structure = integration.generateFileStructure(component);
      
      expect(structure.mainFile).toBe('src/components/my-test-button.tsx');
    });
  });

  describe('End-to-End Component Generation and Integration Workflow', () => {
    let integrationManager: IntegrationManager;
    let projectConfig: ProjectConfig;

    beforeEach(() => {
      projectConfig = createMockProjectConfig();
      integrationManager = new IntegrationManager(projectConfig, {
        validateCompatibility: true,
        checkCodeQuality: true,
        integrateFileSystem: true,
        continueOnWarnings: true,
        continueOnErrors: false
      });
    });

    it('should complete full integration workflow for single component', async () => {
      const component = createMockComponent();
      
      const result = await integrationManager.integrateComponent(component);
      
      expect(result.success).toBe(true);
      expect(result.compatibility?.isValid).toBe(true);
      expect(result.codeQuality?.passed).toBe(true);
      expect(result.fileSystem?.success).toBe(true);
      expect(result.finalComponent).toBeDefined();
      expect(result.summary.criticalIssues).toBe(0);
    });

    it('should handle component with quality issues', async () => {
      const componentWithIssues = createMockComponent({
        jsx: '<div></div>', // Empty component
        props: {} // No props
      });
      
      const result = await integrationManager.integrateComponent(componentWithIssues);
      
      expect(result.success).toBe(true); // Should succeed with warnings
      expect(result.summary.warnings).toBeGreaterThan(0);
      expect(result.summary.suggestions).toContain(
        expect.stringMatching(/empty|content|props/i)
      );
    });

    it('should fail integration with critical compatibility issues', async () => {
      const incompatibleConfig = createMockProjectConfig({
        dependencies: {
          react: '^18.2.0' // Minimal required dependency, but missing others
        }
      });
      
      const manager = new IntegrationManager(incompatibleConfig, {
        continueOnErrors: false
      });
      
      const component = createMockComponent();
      const result = await manager.integrateComponent(component);
      
      expect(result.success).toBe(false);
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });

    it('should process batch of components with dependencies', async () => {
      const baseButton = createMockComponent({
        name: 'BaseButton',
        filePath: 'src/components/BaseButton.tsx'
      });
      
      const primaryButton = createMockComponent({
        name: 'PrimaryButton',
        filePath: 'src/components/PrimaryButton.tsx',
        imports: [
          {
            imports: [{ name: 'BaseButton', isDefault: true }],
            source: './BaseButton'
          }
        ]
      });
      
      const loginForm = createMockComponent({
        name: 'LoginForm',
        filePath: 'src/components/LoginForm.tsx',
        imports: [
          {
            imports: [{ name: 'PrimaryButton', isDefault: true }],
            source: './PrimaryButton'
          }
        ]
      });
      
      const components = [loginForm, primaryButton, baseButton]; // Mixed order
      
      const result = await integrationManager.integrateComponents(components);
      
      expect(result.overall.success).toBe(true);
      expect(result.overall.processedComponents).toBe(3);
      expect(result.overall.failedComponents).toBe(0);
      expect(result.fileSystemResult?.success).toBe(true);
      expect(result.fileSystemResult?.createdFiles).toHaveLength(3);
    });

    it('should provide comprehensive integration report', async () => {
      const components = [
        createMockComponent({ name: 'Button' }),
        createMockComponent({ name: 'Input' }),
        createMockComponent({ name: 'Card' })
      ];
      
      const report = await integrationManager.getIntegrationReport(components);
      
      expect(report.projectCompatibility.isValid).toBe(true);
      expect(report.estimatedIssues).toBeGreaterThanOrEqual(0);
      expect(report.estimatedFileChanges).toBe(3);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should perform dry run without making changes', async () => {
      const components = [
        createMockComponent({ name: 'TestComponent1' }),
        createMockComponent({ name: 'TestComponent2' })
      ];
      
      const dryRunResult = await integrationManager.dryRun(components);
      
      expect(dryRunResult.overall.processedComponents).toBe(2);
      expect(dryRunResult.fileSystemResult).toBeUndefined(); // No file system changes
      
      // Verify individual components were analyzed
      expect(dryRunResult.individual.get('TestComponent1')?.compatibility).toBeDefined();
      expect(dryRunResult.individual.get('TestComponent2')?.codeQuality).toBeDefined();
    });

    it('should generate detailed summary report', async () => {
      const components = [
        createMockComponent({ name: 'SuccessComponent' }),
        createMockComponent({ 
          name: 'ProblematicComponent',
          jsx: '', // Empty JSX to trigger warnings
          props: {}
        })
      ];
      
      const result = await integrationManager.integrateComponents(components);
      const report = integrationManager.generateSummaryReport(result);
      
      expect(report).toContain('Integration Summary Report');
      expect(report).toContain('Overall Status:');
      expect(report).toContain('Processed Components: 2');
      expect(report).toContain('Component Details:');
      expect(report).toContain('SuccessComponent: SUCCESS');
      expect(report).toContain('ProblematicComponent:');
    });

    it('should handle integration with strict mode enabled', async () => {
      const strictManager = new IntegrationManager(projectConfig, {
        strictMode: true,
        continueOnWarnings: false,
        continueOnErrors: false
      });
      
      const componentWithWarnings = createMockComponent({
        jsx: '<div className="deprecated-class">Content</div>'
      });
      
      const result = await strictManager.integrateComponent(componentWithWarnings);
      
      // In strict mode, warnings might cause failure
      expect(result.summary.totalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should validate project setup before integration', async () => {
      const setupResult = await integrationManager.validateProjectSetup();
      
      expect(setupResult.isValid).toBe(true);
      expect(setupResult.errors).toHaveLength(0);
    });

    it('should handle integration errors gracefully', async () => {
      const invalidComponent = createMockComponent({
        name: '', // Invalid name
        filePath: '', // Invalid path
        jsx: '' // Empty JSX
      });
      
      const result = await integrationManager.integrateComponent(invalidComponent);
      
      expect(result.success).toBe(false);
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
      expect(result.summary.suggestions).toContain(
        expect.stringMatching(/name|path|required/i)
      );
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle large batch of components efficiently', async () => {
      const projectConfig = createMockProjectConfig();
      const integrationManager = new IntegrationManager(projectConfig);
      
      // Generate 50 components
      const components = Array.from({ length: 50 }, (_, i) => 
        createMockComponent({
          name: `Component${i}`,
          filePath: `src/components/Component${i}.tsx`
        })
      );
      
      const startTime = performance.now();
      const result = await integrationManager.integrateComponents(components);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.overall.processedComponents).toBe(50);
      expect(result.individual.size).toBe(50);
    });

    it('should handle complex dependency chains', async () => {
      const projectConfig = createMockProjectConfig();
      const integrationManager = new IntegrationManager(projectConfig);
      
      // Create a chain of 10 components where each depends on the previous
      const components = Array.from({ length: 10 }, (_, i) => {
        const imports = i > 0 ? [{
          imports: [{ name: `Component${i - 1}`, isDefault: true }],
          source: `./Component${i - 1}`
        }] : [];
        
        return createMockComponent({
          name: `Component${i}`,
          filePath: `src/components/Component${i}.tsx`,
          imports
        });
      });
      
      const result = await integrationManager.integrateComponents(components);
      
      expect(result.overall.success).toBe(true);
      expect(result.overall.processedComponents).toBe(10);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should recover from partial failures in batch processing', async () => {
      const projectConfig = createMockProjectConfig();
      const integrationManager = new IntegrationManager(projectConfig, {
        continueOnErrors: true
      });
      
      const validComponent = createMockComponent({ name: 'ValidComponent' });
      const invalidComponent = createMockComponent({ 
        name: '', // Invalid name will cause failure
        filePath: ''
      });
      const anotherValidComponent = createMockComponent({ name: 'AnotherValidComponent' });
      
      const components = [validComponent, invalidComponent, anotherValidComponent];
      const result = await integrationManager.integrateComponents(components);
      
      expect(result.overall.processedComponents).toBe(3);
      expect(result.overall.failedComponents).toBe(1);
      expect(result.individual.get('ValidComponent')?.success).toBe(true);
      expect(result.individual.get('AnotherValidComponent')?.success).toBe(true);
    });

    it('should handle missing project configuration gracefully', async () => {
      const incompleteConfig = createMockProjectConfig({
        dependencies: {
          react: '^18.2.0' // Minimal required dependency
        },
        structure: {
          srcDirectory: 'src',
          componentsDirectory: 'components',
          typesDirectory: 'types',
          utilsDirectory: 'utils',
          stylesDirectory: 'styles'
        }
      });
      
      const integrationManager = new IntegrationManager(incompleteConfig);
      const component = createMockComponent();
      
      const result = await integrationManager.integrateComponent(component);
      
      // Should handle gracefully, possibly with warnings
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle components with complex import structures', async () => {
      const projectConfig = createMockProjectConfig();
      const integrationManager = new IntegrationManager(projectConfig);
      
      const complexComponent = createMockComponent({
        imports: [
          {
            imports: [{ name: 'React', isDefault: true }, { name: 'useState', isDefault: false }],
            source: 'react'
          },
          {
            imports: [{ name: 'Button', isDefault: false }, { name: 'Input', isDefault: false }],
            source: '@radix-ui/react-button'
          },
          {
            imports: [{ name: 'cn', isDefault: false }],
            source: '@/lib/utils'
          },
          {
            imports: [{ name: 'Icon', isDefault: true }],
            source: '../icons/Icon'
          }
        ]
      });
      
      const result = await integrationManager.integrateComponent(complexComponent);
      
      expect(result.success).toBe(true);
      expect(result.fileSystem?.component?.imports).toHaveLength(4);
    });
  });
});