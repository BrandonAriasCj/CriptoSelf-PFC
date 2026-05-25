import { describe, it, expect } from 'vitest';
import {
  generateComponentFilePath,
  generateFileName,
  generateCategoryPath,
  generateTestFilePath,
  generateTypeFilePath,
  generateStoryFilePath,
  generateImportPath,
  generateAliasImportPath,
  ensureDirectoryPath,
  validateFilePath
} from '../file-paths.js';
import type { ProjectStructure, NamingConventions } from '../../types/index.js';

describe('file-paths utilities', () => {
  const mockProjectStructure: ProjectStructure = {
    srcDirectory: 'src',
    componentsDirectory: 'components',
    typesDirectory: 'types',
    testDirectory: 'tests',
    utilsDirectory: 'utils'
  };

  const mockNamingConventions: NamingConventions = {
    componentNaming: 'PascalCase',
    fileNaming: 'ComponentName.tsx',
    propsInterface: 'ComponentNameProps',
    exportPattern: 'default'
  };

  describe('generateComponentFilePath', () => {
    it('should generate correct file path for PascalCase convention', () => {
      const result = generateComponentFilePath('Button', mockNamingConventions, mockProjectStructure);
      expect(result).toBe('src/components/Button.tsx');
    });

    it('should handle complex component names', () => {
      const result = generateComponentFilePath('UserProfileCard', mockNamingConventions, mockProjectStructure);
      expect(result).toBe('src/components/UserProfileCard.tsx');
    });

    it('should work with different project structures', () => {
      const customStructure: ProjectStructure = {
        srcDirectory: 'app',
        componentsDirectory: 'ui',
        typesDirectory: 'types',
        testDirectory: '__tests__',
        utilsDirectory: 'lib'
      };
      const result = generateComponentFilePath('Button', mockNamingConventions, customStructure);
      expect(result).toBe('app/ui/Button.tsx');
    });
  });

  describe('generateFileName', () => {
    it('should generate PascalCase file names', () => {
      expect(generateFileName('Button', 'ComponentName.tsx')).toBe('Button.tsx');
      expect(generateFileName('UserCard', 'ComponentName.tsx')).toBe('UserCard.tsx');
    });

    it('should generate kebab-case file names', () => {
      expect(generateFileName('Button', 'component-name.tsx')).toBe('button.tsx');
      expect(generateFileName('UserCard', 'component-name.tsx')).toBe('user-card.tsx');
    });

    it('should generate camelCase file names', () => {
      expect(generateFileName('Button', 'componentName.tsx')).toBe('button.tsx');
      expect(generateFileName('UserCard', 'componentName.tsx')).toBe('userCard.tsx');
    });

    it('should handle complex component names', () => {
      expect(generateFileName('NavigationMenuButton', 'component-name.tsx')).toBe('navigation-menu-button.tsx');
    });
  });

  describe('generateCategoryPath', () => {
    it('should generate category paths', () => {
      expect(generateCategoryPath('ui', mockProjectStructure)).toBe('src/components/ui');
      expect(generateCategoryPath('forms', mockProjectStructure)).toBe('src/components/forms');
    });

    it('should handle PascalCase categories', () => {
      expect(generateCategoryPath('FormElements', mockProjectStructure)).toBe('src/components/form-elements');
    });

    it('should handle empty category', () => {
      expect(generateCategoryPath('', mockProjectStructure)).toBe('src/components');
    });
  });

  describe('generateTestFilePath', () => {
    it('should generate test file path in test directory', () => {
      const result = generateTestFilePath('Button', mockNamingConventions, mockProjectStructure);
      expect(result).toBe('tests/components/Button.test.tsx');
    });

    it('should co-locate tests when no test directory', () => {
      const structureWithoutTests: ProjectStructure = {
        ...mockProjectStructure,
        testDirectory: undefined
      };
      const result = generateTestFilePath('Button', mockNamingConventions, structureWithoutTests);
      expect(result).toBe('src/components/Button.test.tsx');
    });

    it('should handle different file naming conventions', () => {
      const kebabConventions: NamingConventions = {
        ...mockNamingConventions,
        fileNaming: 'component-name.tsx'
      };
      const result = generateTestFilePath('UserCard', kebabConventions, mockProjectStructure);
      expect(result).toBe('tests/components/user-card.test.tsx');
    });
  });

  describe('generateTypeFilePath', () => {
    it('should generate type file paths', () => {
      expect(generateTypeFilePath('Button', mockProjectStructure)).toBe('src/types/button.types.ts');
      expect(generateTypeFilePath('UserCard', mockProjectStructure)).toBe('src/types/user-card.types.ts');
    });

    it('should handle complex component names', () => {
      expect(generateTypeFilePath('NavigationMenuButton', mockProjectStructure))
        .toBe('src/types/navigation-menu-button.types.ts');
    });
  });

  describe('generateStoryFilePath', () => {
    it('should generate story file paths', () => {
      const result = generateStoryFilePath('Button', mockNamingConventions, mockProjectStructure);
      expect(result).toBe('src/components/Button.stories.tsx');
    });

    it('should handle different naming conventions', () => {
      const kebabConventions: NamingConventions = {
        ...mockNamingConventions,
        fileNaming: 'component-name.tsx'
      };
      const result = generateStoryFilePath('UserCard', kebabConventions, mockProjectStructure);
      expect(result).toBe('src/components/user-card.stories.tsx');
    });
  });

  describe('generateImportPath', () => {
    it('should generate relative import paths', () => {
      const fromPath = 'src/components/forms/LoginForm.tsx';
      const toPath = 'src/components/ui/Button.tsx';
      const result = generateImportPath(fromPath, toPath);
      expect(result).toBe('../ui/Button');
    });

    it('should handle same directory imports', () => {
      const fromPath = 'src/components/ui/Button.tsx';
      const toPath = 'src/components/ui/Input.tsx';
      const result = generateImportPath(fromPath, toPath);
      expect(result).toBe('./Input');
    });

    it('should handle deep nested paths', () => {
      const fromPath = 'src/components/forms/complex/nested/Form.tsx';
      const toPath = 'src/components/ui/Button.tsx';
      const result = generateImportPath(fromPath, toPath);
      expect(result).toBe('../../../ui/Button');
    });

    it('should remove file extensions', () => {
      const fromPath = 'src/components/Form.tsx';
      const toPath = 'src/components/Button.ts';
      const result = generateImportPath(fromPath, toPath);
      expect(result).toBe('./Button');
    });
  });

  describe('generateAliasImportPath', () => {
    it('should generate alias import paths with @ alias', () => {
      const componentPath = 'src/components/ui/Button.tsx';
      const result = generateAliasImportPath(componentPath, mockProjectStructure, '@');
      expect(result).toBe('@/components/ui/Button');
    });

    it('should handle custom aliases', () => {
      const componentPath = 'src/components/ui/Button.tsx';
      const result = generateAliasImportPath(componentPath, mockProjectStructure, '@/components');
      expect(result).toBe('src/components/ui/Button');
    });

    it('should remove file extensions', () => {
      const componentPath = 'src/components/ui/Button.ts';
      const result = generateAliasImportPath(componentPath, mockProjectStructure, '@');
      expect(result).toBe('@/components/ui/Button');
    });

    it('should handle paths not starting with src', () => {
      const componentPath = 'lib/utils/helper.ts';
      const result = generateAliasImportPath(componentPath, mockProjectStructure, '@');
      expect(result).toBe('lib/utils/helper');
    });
  });

  describe('ensureDirectoryPath', () => {
    it('should extract directory path from file path', () => {
      expect(ensureDirectoryPath('src/components/ui/Button.tsx')).toBe('src/components/ui');
      expect(ensureDirectoryPath('src/utils/helper.ts')).toBe('src/utils');
    });

    it('should handle root level files', () => {
      expect(ensureDirectoryPath('package.json')).toBe('');
    });

    it('should handle nested paths', () => {
      expect(ensureDirectoryPath('src/components/forms/complex/nested/Form.tsx'))
        .toBe('src/components/forms/complex/nested');
    });
  });

  describe('validateFilePath', () => {
    it('should validate correct file paths', () => {
      const result = validateFilePath('src/components/Button.tsx', mockProjectStructure);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should detect incorrect src directory', () => {
      const result = validateFilePath('app/components/Button.tsx', mockProjectStructure);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('File path should start with src directory');
      expect(result.suggestions).toContain('Move file to src directory');
    });

    it('should detect incorrect file extensions', () => {
      const result = validateFilePath('src/components/Button.js', mockProjectStructure);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('File should have .tsx or .ts extension');
      expect(result.suggestions).toContain('Use .tsx for components, .ts for utilities');
    });

    it('should detect invalid characters', () => {
      const result = validateFilePath('src/components/Button@#$.tsx', mockProjectStructure);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('File path contains invalid characters');
      expect(result.suggestions).toContain('Use only letters, numbers, hyphens, underscores, and dots');
    });

    it('should validate TypeScript files', () => {
      const result = validateFilePath('src/utils/helper.ts', mockProjectStructure);
      expect(result.isValid).toBe(true);
    });

    it('should handle multiple issues', () => {
      const result = validateFilePath('app/components/Button@#$.js', mockProjectStructure);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(1);
      expect(result.suggestions.length).toBeGreaterThan(1);
    });
  });
});