/**
 * Unit tests for FileSystemIntegration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FileSystemIntegration } from '../file-system-integration.js';
import type { ProjectConfig, GeneratedComponent } from '../../types/index.js';

describe('FileSystemIntegration', () => {
  let mockProjectConfig: ProjectConfig;
  let integration: FileSystemIntegration;

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
        stylesDirectory: 'styles',
        testDirectory: '__tests__'
      },
      dependencies: {
        react: '^18.2.0'
      }
    };

    integration = new FileSystemIntegration(mockProjectConfig);
  });

  describe('integrateComponent', () => {
    let validComponent: GeneratedComponent;

    beforeEach(() => {
      validComponent = {
        name: 'TestButton',
        filePath: 'TestButton.tsx',
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
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.success).toBe(true);
      expect(result.component).toBeDefined();
      expect(result.component?.filePath).toBe('src/components/TestButton.tsx');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should resolve component path according to project structure', async () => {
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.component?.filePath).toBe('src/components/TestButton.tsx');
    });

    it('should handle different file naming conventions', async () => {
      mockProjectConfig.conventions.fileNaming = 'component-name.tsx';
      integration = new FileSystemIntegration(mockProjectConfig);
      
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.component?.filePath).toBe('src/components/test-button.tsx');
    });

    it('should handle camelCase file naming convention', async () => {
      mockProjectConfig.conventions.fileNaming = 'componentName.tsx';
      integration = new FileSystemIntegration(mockProjectConfig);
      
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.component?.filePath).toBe('src/components/testButton.tsx');
    });

    it('should validate component structure', async () => {
      validComponent.name = '';
      
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.success).toBe(false);
      expect(result.conflicts).toContainEqual(
        expect.objectContaining({
          type: 'TYPE_MISMATCH',
          description: expect.stringContaining('Component name is required')
        })
      );
    });

    it('should validate required exports', async () => {
      validComponent.exports = [];
      
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.success).toBe(false);
      expect(result.conflicts).toContainEqual(
        expect.objectContaining({
          type: 'TYPE_MISMATCH',
          description: expect.stringContaining('must have at least one export')
        })
      );
    });

    it('should warn about empty JSX content', async () => {
      validComponent.jsx = '';
      
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'EMPTY_JSX'
        })
      );
    });

    it('should apply default export pattern when configured', async () => {
      mockProjectConfig.conventions.exportPattern = 'default';
      integration = new FileSystemIntegration(mockProjectConfig);
      
      const result = await integration.integrateComponent(validComponent);
      
      expect(result.component?.exports).toContainEqual(
        expect.objectContaining({
          name: 'TestButton',
          isDefault: true
        })
      );
    });
  });

  describe('integrateComponents', () => {
    it('should integrate multiple components', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'Component1',
          filePath: 'Component1.tsx',
          imports: [],
          props: {},
          jsx: '<div>Component 1</div>',
          exports: [{ name: 'Component1' }]
        },
        {
          name: 'Component2',
          filePath: 'Component2.tsx',
          imports: [],
          props: {},
          jsx: '<div>Component 2</div>',
          exports: [{ name: 'Component2' }]
        }
      ];
      
      const result = await integration.integrateComponents(components);
      
      expect(result.overall.success).toBe(true);
      expect(result.individual.size).toBe(2);
      expect(result.overall.createdFiles).toHaveLength(2);
      expect(result.overall.createdDirectories).toContain('src/components');
    });

    it('should sort components by dependencies', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'DependentComponent',
          filePath: 'DependentComponent.tsx',
          imports: [
            {
              source: './BaseComponent',
              imports: [{ name: 'BaseComponent' }]
            }
          ],
          props: {},
          jsx: '<BaseComponent />',
          exports: [{ name: 'DependentComponent' }]
        },
        {
          name: 'BaseComponent',
          filePath: 'BaseComponent.tsx',
          imports: [],
          props: {},
          jsx: '<div>Base</div>',
          exports: [{ name: 'BaseComponent' }]
        }
      ];
      
      const result = await integration.integrateComponents(components);
      
      expect(result.overall.success).toBe(true);
      // BaseComponent should be processed before DependentComponent
      const createdFiles = result.overall.createdFiles;
      const baseIndex = createdFiles.findIndex(f => f.includes('BaseComponent'));
      const dependentIndex = createdFiles.findIndex(f => f.includes('DependentComponent'));
      expect(baseIndex).toBeLessThan(dependentIndex);
    });
  });

  describe('generateFileStructure', () => {
    it('should generate proper file structure', () => {
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: '',
        imports: [],
        props: { prop1: { type: 'string', required: false } },
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const structure = integration.generateFileStructure(component);
      
      expect(structure.mainFile).toBe('src/components/TestComponent.tsx');
      expect(structure.testFile).toBe('src/components/__tests__/TestComponent.test.tsx');
    });

    it('should generate index file for default exports', () => {
      mockProjectConfig.conventions.exportPattern = 'default';
      integration = new FileSystemIntegration(mockProjectConfig);
      
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: '',
        imports: [],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const structure = integration.generateFileStructure(component);
      
      expect(structure.indexFile).toBe('src/components/index.ts');
    });

    it('should generate type file when component has props', () => {
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: '',
        imports: [],
        props: {
          prop1: { type: 'string', required: false },
          prop2: { type: 'number', required: true }
        },
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const structure = integration.generateFileStructure(component);
      
      expect(structure.typeFile).toBe('src/types/TestComponent.types.ts');
    });
  });

  describe('resolveImportPaths', () => {
    it('should resolve alias-based imports', () => {
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [
          {
            source: '@/utils/helpers',
            imports: [{ name: 'helper' }]
          }
        ],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const resolved = integration.resolveImportPaths(component);
      
      expect(resolved.imports[0].source).toBe('src/utils/helpers');
    });

    it('should resolve relative imports', () => {
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [
          {
            source: '../utils/helper',
            imports: [{ name: 'helper' }]
          }
        ],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const resolved = integration.resolveImportPaths(component);
      
      expect(resolved.imports[0].source).toBe('src/utils/helper');
    });

    it('should leave external imports unchanged', () => {
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [
          {
            source: 'react',
            imports: [{ name: 'React' }]
          },
          {
            source: 'lodash',
            imports: [{ name: 'debounce' }]
          }
        ],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const resolved = integration.resolveImportPaths(component);
      
      expect(resolved.imports[0].source).toBe('react');
      expect(resolved.imports[1].source).toBe('lodash');
    });
  });

  describe('resolveDependencies', () => {
    it('should resolve component dependencies', () => {
      const components: GeneratedComponent[] = [
        {
          name: 'BaseComponent',
          filePath: 'src/components/BaseComponent.tsx',
          imports: [],
          props: {},
          jsx: '<div>Base</div>',
          exports: [{ name: 'BaseComponent' }]
        },
        {
          name: 'DerivedComponent',
          filePath: 'src/components/DerivedComponent.tsx',
          imports: [
            {
              source: 'BaseComponent',
              imports: [{ name: 'BaseComponent' }]
            }
          ],
          props: {},
          jsx: '<BaseComponent />',
          exports: [{ name: 'DerivedComponent' }]
        }
      ];
      
      const result = integration.resolveDependencies(components);
      
      expect(result.resolved).toHaveLength(2);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.missingDependencies).toHaveLength(0);
      
      // Check that import path was updated
      const derivedComponent = result.resolved.find(c => c.name === 'DerivedComponent');
      expect(derivedComponent?.imports[0].source).toBe('./BaseComponent');
    });

    it('should detect circular dependencies', () => {
      const components: GeneratedComponent[] = [
        {
          name: 'ComponentA',
          filePath: 'src/components/ComponentA.tsx',
          imports: [
            {
              source: 'ComponentB',
              imports: [{ name: 'ComponentB' }]
            }
          ],
          props: {},
          jsx: '<ComponentB />',
          exports: [{ name: 'ComponentA' }]
        },
        {
          name: 'ComponentB',
          filePath: 'src/components/ComponentB.tsx',
          imports: [
            {
              source: 'ComponentA',
              imports: [{ name: 'ComponentA' }]
            }
          ],
          props: {},
          jsx: '<ComponentA />',
          exports: [{ name: 'ComponentB' }]
        }
      ];
      
      const result = integration.resolveDependencies(components);
      
      expect(result.circularDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('file system options', () => {
    it('should handle overwrite existing option', async () => {
      integration = new FileSystemIntegration(mockProjectConfig, '.', {
        overwriteExisting: true
      });
      
      const component: GeneratedComponent = {
        name: 'ExistingComponent',
        filePath: 'src/components/ExistingComponent.tsx',
        imports: [],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'ExistingComponent' }]
      };
      
      const result = await integration.integrateComponent(component);
      
      expect(result.success).toBe(true);
    });

    it('should validate paths when enabled', async () => {
      integration = new FileSystemIntegration(mockProjectConfig, '.', {
        validatePaths: true
      });
      
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'invalid<>path',
        imports: [],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const result = await integration.integrateComponent(component);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_PATH_CHARACTERS'
        })
      );
    });

    it('should resolve conflicts when enabled', async () => {
      integration = new FileSystemIntegration(mockProjectConfig, '.', {
        resolveConflicts: true
      });
      
      const component: GeneratedComponent = {
        name: 'ConflictingComponent',
        filePath: 'src/components/ConflictingComponent.tsx',
        imports: [],
        props: {},
        jsx: '<div>Test</div>',
        exports: [{ name: 'ConflictingComponent' }]
      };
      
      const result = await integration.integrateComponent(component);
      
      expect(result.success).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should convert PascalCase to kebab-case', () => {
      const integration = new FileSystemIntegration(mockProjectConfig);
      const toKebabCase = (integration as any).toKebabCase;
      
      expect(toKebabCase('TestComponent')).toBe('test-component');
      expect(toKebabCase('MyLongComponentName')).toBe('my-long-component-name');
    });

    it('should convert PascalCase to camelCase', () => {
      const integration = new FileSystemIntegration(mockProjectConfig);
      const toCamelCase = (integration as any).toCamelCase;
      
      expect(toCamelCase('TestComponent')).toBe('testComponent');
      expect(toCamelCase('MyLongComponentName')).toBe('myLongComponentName');
    });

    it('should calculate relative paths correctly', () => {
      const integration = new FileSystemIntegration(mockProjectConfig);
      const calculateRelativePath = (integration as any).calculateRelativePath;
      
      expect(calculateRelativePath(
        'src/components/Button.tsx',
        'src/utils/helpers.ts'
      )).toBe('./utils/helpers');
      
      expect(calculateRelativePath(
        'src/components/forms/Input.tsx',
        'src/components/Button.tsx'
      )).toBe('./Button');
      
      expect(calculateRelativePath(
        'src/components/Button.tsx',
        'src/components/forms/Input.tsx'
      )).toBe('./forms/Input');
    });

    it('should resolve relative paths correctly', () => {
      const integration = new FileSystemIntegration(mockProjectConfig);
      const resolveRelativePath = (integration as any).resolveRelativePath;
      
      expect(resolveRelativePath(
        'src/components/Button.tsx',
        './utils/helper'
      )).toBe('src/components/utils/helper');
      
      expect(resolveRelativePath(
        'src/components/forms/Input.tsx',
        '../Button'
      )).toBe('src/components/Button');
      
      expect(resolveRelativePath(
        'src/components/forms/Input.tsx',
        '../../utils/helper'
      )).toBe('src/utils/helper');
    });
  });
});