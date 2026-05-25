/**
 * Unit tests for ProjectCompatibilityValidator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectCompatibilityValidator } from '../project-compatibility-validator.js';
import type { ProjectConfig, GeneratedComponent } from '../../types/index.js';

describe('ProjectCompatibilityValidator', () => {
  let mockProjectConfig: ProjectConfig;
  let validator: ProjectCompatibilityValidator;

  beforeEach(() => {
    mockProjectConfig = {
      framework: 'react',
      typescript: true,
      bundler: 'vite',
      compiler: 'swc',
      uiLibrary: {
        name: 'radix-ui',
        components: [
          {
            name: 'Button',
            importPath: '@radix-ui/react-button',
            props: {
              variant: { type: 'string', required: false },
              size: { type: 'string', required: false }
            }
          }
        ],
        utilities: {
          classNames: 'cn',
          variants: 'cva'
        }
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
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        typescript: '^5.0.2',
        '@vitejs/plugin-react-swc': '^3.3.2',
        tailwindcss: '^3.3.0',
        clsx: '^2.0.0',
        'tailwind-merge': '^1.14.0',
        '@types/react': '^18.2.15',
        '@types/react-dom': '^18.2.7',
        radixUI: ['@radix-ui/react-button'],
        'class-variance-authority': '^0.7.0'
      }
    };

    validator = new ProjectCompatibilityValidator(mockProjectConfig);
  });

  describe('validateProjectCompatibility', () => {
    it('should pass validation for a properly configured project', async () => {
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing React dependency', async () => {
      delete mockProjectConfig.dependencies.react;
      validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'REACT_MISSING',
          severity: 'critical'
        })
      );
    });

    it('should detect missing TypeScript types', async () => {
      delete mockProjectConfig.dependencies['@types/react'];
      validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'REACT_TYPES_MISSING',
          severity: 'error'
        })
      );
    });

    it('should warn about old React version', async () => {
      mockProjectConfig.dependencies.react = '^17.0.0';
      validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'REACT_VERSION_OLD'
        })
      );
    });

    it('should detect missing Vite SWC plugin', async () => {
      delete mockProjectConfig.dependencies['@vitejs/plugin-react-swc'];
      validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'VITE_SWC_PLUGIN_MISSING',
          severity: 'error'
        })
      );
    });

    it('should detect missing Tailwind CSS', async () => {
      delete mockProjectConfig.dependencies.tailwindcss;
      validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'TAILWIND_MISSING',
          severity: 'error'
        })
      );
    });

    it('should warn about non-Vite bundler', async () => {
      mockProjectConfig.bundler = 'webpack';
      validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'BUNDLER_NOT_VITE'
        })
      );
    });

    it('should warn about non-SWC compiler', async () => {
      mockProjectConfig.compiler = 'babel';
      validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'COMPILER_NOT_SWC'
        })
      );
    });
  });

  describe('validateComponentCompatibility', () => {
    let mockComponent: GeneratedComponent;

    beforeEach(() => {
      mockComponent = {
        name: 'TestButton',
        filePath: 'src/components/TestButton.tsx',
        imports: [
          {
            source: 'react',
            imports: [{ name: 'React', isDefault: true }]
          },
          {
            source: '@radix-ui/react-button',
            imports: [{ name: 'Button' }]
          },
          {
            source: '@/utils/cn',
            imports: [{ name: 'cn' }]
          }
        ],
        props: {
          variant: { type: 'string', required: false },
          size: { type: 'string', required: false },
          className: { type: 'string', required: false },
          children: { type: 'React.ReactNode', required: true }
        },
        jsx: '<Button className={cn("base-styles", className)}>{children}</Button>',
        exports: [{ name: 'TestButton', isDefault: false }]
      };
    });

    it('should pass validation for a properly structured component', async () => {
      const result = await validator.validateComponentCompatibility(mockComponent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing dependency for import', async () => {
      mockComponent.imports.push({
        source: 'missing-package',
        imports: [{ name: 'MissingComponent' }]
      });
      
      const result = await validator.validateComponentCompatibility(mockComponent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'IMPORT_DEPENDENCY_MISSING',
          component: 'TestButton'
        })
      );
    });

    it('should detect invalid TypeScript prop type', async () => {
      mockComponent.props.invalidProp = { type: 'invalidType', required: false };
      
      const result = await validator.validateComponentCompatibility(mockComponent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_PROP_TYPE',
          property: 'invalidProp'
        })
      );
    });

    it('should validate component naming convention', async () => {
      mockComponent.name = 'testButton'; // camelCase instead of PascalCase
      
      const result = await validator.validateComponentCompatibility(mockComponent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_COMPONENT_NAME'
        })
      );
    });

    it('should warn about missing className prop for Tailwind', async () => {
      delete mockComponent.props.className;
      
      const result = await validator.validateComponentCompatibility(mockComponent);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_CLASSNAME_PROP'
        })
      );
    });

    it('should validate file naming convention', async () => {
      mockComponent.filePath = 'src/components/test-button.tsx'; // kebab-case instead of PascalCase
      
      const result = await validator.validateComponentCompatibility(mockComponent);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INCONSISTENT_FILE_NAME'
        })
      );
    });

    it('should accept valid TypeScript types', async () => {
      mockComponent.props = {
        stringProp: { type: 'string', required: true },
        numberProp: { type: 'number', required: false },
        booleanProp: { type: 'boolean', required: false },
        arrayProp: { type: 'string[]', required: false },
        unionProp: { type: 'string | number', required: false },
        genericProp: { type: 'Array<string>', required: false },
        reactNodeProp: { type: 'React.ReactNode', required: false },
        functionProp: { type: '() => void', required: false }
      };
      
      const result = await validator.validateComponentCompatibility(mockComponent);
      
      const typeErrors = result.errors.filter(error => error.code === 'INVALID_PROP_TYPE');
      expect(typeErrors).toHaveLength(0);
    });
  });

  describe('configuration options', () => {
    it('should skip dependency checks when disabled', async () => {
      delete mockProjectConfig.dependencies.react;
      validator = new ProjectCompatibilityValidator(mockProjectConfig, {
        checkDependencies: false
      });
      
      const result = await validator.validateProjectCompatibility();
      
      const reactErrors = result.errors.filter(error => error.code === 'REACT_MISSING');
      expect(reactErrors).toHaveLength(0);
    });

    it('should skip TypeScript validation when disabled', async () => {
      delete mockProjectConfig.dependencies['@types/react'];
      validator = new ProjectCompatibilityValidator(mockProjectConfig, {
        validateTypeScript: false
      });
      
      const result = await validator.validateProjectCompatibility();
      
      const tsErrors = result.errors.filter(error => error.code === 'REACT_TYPES_MISSING');
      expect(tsErrors).toHaveLength(0);
    });

    it('should skip build compatibility checks when disabled', async () => {
      delete mockProjectConfig.dependencies['@vitejs/plugin-react-swc'];
      validator = new ProjectCompatibilityValidator(mockProjectConfig, {
        checkBuildCompatibility: false
      });
      
      const result = await validator.validateProjectCompatibility();
      
      const buildErrors = result.errors.filter(error => error.code === 'VITE_SWC_PLUGIN_MISSING');
      expect(buildErrors).toHaveLength(0);
    });

    it('should provide more strict validation in strict mode', async () => {
      mockProjectConfig.dependencies.react = '^17.0.0';
      validator = new ProjectCompatibilityValidator(mockProjectConfig, {
        strictMode: true
      });
      
      const result = await validator.validateProjectCompatibility();
      
      // In strict mode, warnings might be elevated to errors
      // This is a placeholder for more strict validation logic
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('helper methods', () => {
    it('should correctly extract package names from import paths', () => {
      const validator = new ProjectCompatibilityValidator(mockProjectConfig);
      
      // Access private method for testing (in real implementation, make it public or test through public interface)
      const extractPackageName = (validator as any).extractPackageName;
      
      expect(extractPackageName('react')).toBe('react');
      expect(extractPackageName('@radix-ui/react-button')).toBe('@radix-ui/react-button');
      expect(extractPackageName('lodash/debounce')).toBe('lodash');
    });

    it('should validate component names correctly', () => {
      const validator = new ProjectCompatibilityValidator(mockProjectConfig);
      const validateComponentName = (validator as any).validateComponentName;
      
      expect(validateComponentName('TestComponent', 'PascalCase')).toBe(true);
      expect(validateComponentName('testComponent', 'PascalCase')).toBe(false);
      expect(validateComponentName('testComponent', 'camelCase')).toBe(true);
      expect(validateComponentName('TestComponent', 'camelCase')).toBe(false);
    });

    it('should generate correct file names based on conventions', () => {
      const validator = new ProjectCompatibilityValidator(mockProjectConfig);
      const generateFileName = (validator as any).generateFileName;
      
      expect(generateFileName('TestComponent', 'ComponentName.tsx')).toBe('TestComponent.tsx');
      expect(generateFileName('TestComponent', 'component-name.tsx')).toBe('test-component.tsx');
      expect(generateFileName('TestComponent', 'componentName.tsx')).toBe('testComponent.tsx');
    });
  });
});