/**
 * Tests for compatibility validation with different project configurations
 * Covers various project setups and dependency combinations
 */

import { describe, it, expect } from 'vitest';
import { ProjectCompatibilityValidator } from '../project-compatibility-validator.js';
import type { ProjectConfig } from '../../types/index.js';

describe('Project Configuration Compatibility Tests', () => {
  const baseConfig: ProjectConfig = {
    framework: 'react',
    typescript: true,
    bundler: 'vite',
    compiler: 'swc',
    dependencies: {
      react: '^18.2.0'
    },
    uiLibrary: {
      name: 'radix-ui',
      components: [],
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
      stylesDirectory: 'styles'
    },
    conventions: {
      componentNaming: 'PascalCase',
      fileNaming: 'ComponentName.tsx',
      propsInterface: 'ComponentNameProps',
      exportPattern: 'default'
    }
  };

  describe('React Version Compatibility', () => {
    it('should validate React 18+ as compatible', async () => {
      const config = {
        ...baseConfig,
        dependencies: {
          ...baseConfig.dependencies,
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.filter(w => w.code === 'REACT_VERSION_OLD')).toHaveLength(0);
    });

    it('should warn about React 17 as outdated', async () => {
      const config = {
        ...baseConfig,
        dependencies: {
          ...baseConfig.dependencies,
          react: '^17.0.0',
          'react-dom': '^17.0.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
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

    it('should error on missing React', async () => {
      const config = {
        ...baseConfig,
        dependencies: {
          react: '^18.2.0', // Required field
          typescript: '^5.0.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'REACT_MISSING'
          })
        ])
      );
    });
  });

  describe('Build System Compatibility', () => {
    it('should validate Vite + SWC as optimal', async () => {
      const config = {
        ...baseConfig,
        bundler: 'vite' as const,
        compiler: 'swc' as const,
        dependencies: {
          ...baseConfig.dependencies,
          '@vitejs/plugin-react-swc': '^3.0.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.filter(w => 
        w.code === 'BUNDLER_NOT_VITE' || w.code === 'COMPILER_NOT_SWC'
      )).toHaveLength(0);
    });

    it('should warn about non-Vite bundlers', async () => {
      const config = {
        ...baseConfig,
        bundler: 'webpack' as const,
        compiler: 'babel' as const
      };
      
      const validator = new ProjectCompatibilityValidator(config);
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

    it('should error on missing Vite SWC plugin when using Vite + SWC', async () => {
      const config = {
        ...baseConfig,
        bundler: 'vite' as const,
        compiler: 'swc' as const,
        dependencies: {
          ...baseConfig.dependencies,
          react: '^18.2.0'
          // Missing @vitejs/plugin-react-swc
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'VITE_SWC_PLUGIN_MISSING'
          })
        ])
      );
    });
  });

  describe('TypeScript Configuration', () => {
    it('should validate TypeScript setup with proper types', async () => {
      const config = {
        ...baseConfig,
        typescript: true,
        dependencies: {
          ...baseConfig.dependencies,
          typescript: '^5.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => 
        e.code === 'TYPESCRIPT_MISSING' || e.code === 'REACT_TYPES_MISSING'
      )).toHaveLength(0);
    });

    it('should error on missing TypeScript when configured', async () => {
      const config = {
        ...baseConfig,
        typescript: true,
        dependencies: {
          ...baseConfig.dependencies,
          react: '^18.2.0'
          // Missing TypeScript
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'TYPESCRIPT_MISSING'
          })
        ])
      );
    });

    it('should error on missing React types', async () => {
      const config = {
        ...baseConfig,
        typescript: true,
        dependencies: {
          ...baseConfig.dependencies,
          react: '^18.2.0',
          typescript: '^5.0.0'
          // Missing @types/react
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'REACT_TYPES_MISSING'
          })
        ])
      );
    });
  });

  describe('UI Library Integration', () => {
    it('should validate Tailwind CSS setup', async () => {
      const config = {
        ...baseConfig,
        styling: {
          framework: 'tailwind' as const,
          customClasses: false,
          responsiveBreakpoints: ['sm', 'md', 'lg', 'xl']
        },
        dependencies: {
          ...baseConfig.dependencies,
          tailwindcss: '^3.3.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^1.14.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.code === 'TAILWIND_MISSING')).toHaveLength(0);
    });

    it('should error on missing Tailwind CSS', async () => {
      const config = {
        ...baseConfig,
        styling: {
          framework: 'tailwind' as const,
          customClasses: false,
          responsiveBreakpoints: ['sm', 'md', 'lg', 'xl']
        },
        dependencies: {
          ...baseConfig.dependencies
          // Missing tailwindcss
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'TAILWIND_MISSING'
          })
        ])
      );
    });

    it('should warn about missing Tailwind utilities', async () => {
      const config = {
        ...baseConfig,
        styling: {
          framework: 'tailwind' as const,
          customClasses: false,
          responsiveBreakpoints: ['sm', 'md', 'lg', 'xl']
        },
        dependencies: {
          ...baseConfig.dependencies,
          tailwindcss: '^3.3.0'
          // Missing clsx and tailwind-merge
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'TAILWIND_UTIL_MISSING'
          })
        ])
      );
    });

    it('should validate Radix UI setup', async () => {
      const config = {
        ...baseConfig,
        uiLibrary: {
          name: 'radix-ui',
          components: ['@radix-ui/react-button', '@radix-ui/react-input'],
          utilities: {
            classNames: 'cn',
            variants: 'cva'
          }
        },
        dependencies: {
          ...baseConfig.dependencies,
          'class-variance-authority': '^0.7.0',
          radixUI: ['@radix-ui/react-button', '@radix-ui/react-input']
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings.filter(w => 
        w.code === 'RADIX_COMPONENTS_MISSING' || w.code === 'CVA_MISSING'
      )).toHaveLength(0);
    });
  });

  describe('Dependency Conflicts', () => {
    it('should detect conflicting Vite React plugins', async () => {
      const config = {
        ...baseConfig,
        dependencies: {
          ...baseConfig.dependencies,
          '@vitejs/plugin-react': '^4.0.0',
          '@vitejs/plugin-react-swc': '^3.0.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'DEPENDENCY_CONFLICT'
          })
        ])
      );
    });

    it('should validate version compatibility', async () => {
      const config = {
        ...baseConfig,
        dependencies: {
          ...baseConfig.dependencies,
          react: '^16.0.0', // Very old version
          typescript: '^4.0.0' // Older version
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'VERSION_OUTDATED'
          })
        ])
      );
    });
  });

  describe('Project Structure Validation', () => {
    it('should validate standard project structure', async () => {
      const config = {
        ...baseConfig,
        structure: {
          srcDirectory: 'src',
          componentsDirectory: 'components',
          typesDirectory: 'types',
          utilsDirectory: 'lib',
          stylesDirectory: 'styles',
          testDirectory: '__tests__'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(config);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
    });

    it('should handle different naming conventions', async () => {
      const kebabCaseConfig = {
        ...baseConfig,
        conventions: {
          componentNaming: 'PascalCase' as const,
          fileNaming: 'component-name.tsx',
          propsInterface: 'ComponentNameProps',
          exportPattern: 'named' as const
        }
      };
      
      const validator = new ProjectCompatibilityValidator(kebabCaseConfig);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Comprehensive Configuration Tests', () => {
    it('should validate complete optimal setup', async () => {
      const optimalConfig: ProjectConfig = {
        framework: 'react',
        typescript: true,
        bundler: 'vite',
        compiler: 'swc',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          typescript: '^5.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          '@vitejs/plugin-react-swc': '^3.0.0',
          tailwindcss: '^3.3.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^1.14.0',
          'class-variance-authority': '^0.7.0',
          radixUI: ['@radix-ui/react-button', '@radix-ui/react-input']
        },
        uiLibrary: {
          name: 'radix-ui',
          components: ['@radix-ui/react-button', '@radix-ui/react-input'],
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
          utilsDirectory: 'lib',
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
      
      const validator = new ProjectCompatibilityValidator(optimalConfig);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.not.stringMatching(/fix|error|missing/i)
        ])
      );
    });

    it('should provide helpful suggestions for suboptimal setups', async () => {
      const suboptimalConfig = {
        ...baseConfig,
        bundler: 'webpack' as const,
        compiler: 'babel' as const,
        dependencies: {
          react: '^17.0.0',
          typescript: '^4.0.0'
        }
      };
      
      const validator = new ProjectCompatibilityValidator(suboptimalConfig);
      const result = await validator.validateProjectCompatibility();
      
      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/vite|swc|upgrade/i)
        ])
      );
    });
  });
});