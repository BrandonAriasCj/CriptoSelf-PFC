import { describe, it, expect } from 'vitest';
import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  generateComponentName,
  generatePropsInterfaceName,
  generateUniqueComponentName,
  isValidComponentName,
  sanitizeIdentifier
} from '../naming.js';

describe('naming utilities', () => {
  describe('toPascalCase', () => {
    it('should convert camelCase to PascalCase', () => {
      expect(toPascalCase('myComponent')).toBe('MyComponent');
      expect(toPascalCase('userName')).toBe('UserName');
    });

    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('my-component')).toBe('MyComponent');
      expect(toPascalCase('user-profile-card')).toBe('UserProfileCard');
    });

    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('my_component')).toBe('MyComponent');
      expect(toPascalCase('user_profile_card')).toBe('UserProfileCard');
    });

    it('should handle mixed delimiters', () => {
      expect(toPascalCase('my-component_name test')).toBe('MyComponentNameTest');
    });

    it('should handle special characters', () => {
      expect(toPascalCase('my@component#name')).toBe('MyComponentName');
      expect(toPascalCase('button$icon%widget')).toBe('ButtonIconWidget');
    });

    it('should handle empty string', () => {
      expect(toPascalCase('')).toBe('');
    });

    it('should handle single word', () => {
      expect(toPascalCase('button')).toBe('Button');
      expect(toPascalCase('BUTTON')).toBe('Button');
    });

    it('should handle numbers', () => {
      expect(toPascalCase('button2')).toBe('Button2');
      expect(toPascalCase('my-component-v2')).toBe('MyComponentV2');
    });
  });

  describe('toCamelCase', () => {
    it('should convert PascalCase to camelCase', () => {
      expect(toCamelCase('MyComponent')).toBe('myComponent');
      expect(toCamelCase('UserProfileCard')).toBe('userProfileCard');
    });

    it('should convert kebab-case to camelCase', () => {
      expect(toCamelCase('my-component')).toBe('myComponent');
      expect(toCamelCase('user-profile-card')).toBe('userProfileCard');
    });

    it('should handle empty string', () => {
      expect(toCamelCase('')).toBe('');
    });

    it('should handle single word', () => {
      expect(toCamelCase('button')).toBe('button');
      expect(toCamelCase('BUTTON')).toBe('button');
    });
  });

  describe('toKebabCase', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(toKebabCase('MyComponent')).toBe('my-component');
      expect(toKebabCase('UserProfileCard')).toBe('user-profile-card');
    });

    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('myComponent')).toBe('my-component');
      expect(toKebabCase('userProfileCard')).toBe('user-profile-card');
    });

    it('should handle spaces and underscores', () => {
      expect(toKebabCase('my component')).toBe('my-component');
      expect(toKebabCase('my_component')).toBe('my-component');
    });

    it('should handle empty string', () => {
      expect(toKebabCase('')).toBe('');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(toKebabCase('-MyComponent-')).toBe('my-component');
    });
  });

  describe('toSnakeCase', () => {
    it('should convert PascalCase to snake_case', () => {
      expect(toSnakeCase('MyComponent')).toBe('my_component');
      expect(toSnakeCase('UserProfileCard')).toBe('user_profile_card');
    });

    it('should convert camelCase to snake_case', () => {
      expect(toSnakeCase('myComponent')).toBe('my_component');
      expect(toSnakeCase('userProfileCard')).toBe('user_profile_card');
    });

    it('should handle spaces and hyphens', () => {
      expect(toSnakeCase('my component')).toBe('my_component');
      expect(toSnakeCase('my-component')).toBe('my_component');
    });

    it('should handle empty string', () => {
      expect(toSnakeCase('')).toBe('');
    });

    it('should remove leading and trailing underscores', () => {
      expect(toSnakeCase('_MyComponent_')).toBe('my_component');
    });
  });

  describe('generateComponentName', () => {
    it('should generate valid component names from Figma names', () => {
      expect(generateComponentName('button')).toBe('Button');
      expect(generateComponentName('user-card')).toBe('UserCard');
      expect(generateComponentName('navigation menu')).toBe('NavigationMenu');
    });

    it('should handle empty or invalid names', () => {
      expect(generateComponentName('')).toBe('UnnamedComponent');
      expect(generateComponentName('123invalid')).toBe('Component123invalid');
    });

    it('should add suffix when provided', () => {
      expect(generateComponentName('button', 'Widget')).toBe('ButtonWidget');
      expect(generateComponentName('card', 'component')).toBe('CardComponent');
    });

    it('should not duplicate suffix', () => {
      expect(generateComponentName('ButtonWidget', 'Widget')).toBe('ButtonWidget');
    });

    it('should ensure name starts with letter', () => {
      expect(generateComponentName('123button')).toBe('Component123button');
      expect(generateComponentName('$special')).toBe('ComponentSpecial');
    });
  });

  describe('generatePropsInterfaceName', () => {
    it('should generate props interface names with default convention', () => {
      expect(generatePropsInterfaceName('Button')).toBe('ButtonProps');
      expect(generatePropsInterfaceName('UserCard')).toBe('UserCardProps');
    });

    it('should handle different conventions', () => {
      expect(generatePropsInterfaceName('Button', 'ComponentProps')).toBe('ComponentProps');
      expect(generatePropsInterfaceName('Button', 'Props')).toBe('Props');
      expect(generatePropsInterfaceName('Button', 'ComponentNameProps')).toBe('ButtonProps');
    });
  });

  describe('generateUniqueComponentName', () => {
    it('should return original name if not in existing set', () => {
      const existingNames = new Set(['OtherComponent']);
      expect(generateUniqueComponentName('Button', existingNames)).toBe('Button');
    });

    it('should add numeric suffix for conflicts', () => {
      const existingNames = new Set(['Button', 'Button1']);
      expect(generateUniqueComponentName('Button', existingNames)).toBe('Button2');
    });

    it('should handle multiple conflicts', () => {
      const existingNames = new Set(['Button', 'Button1', 'Button2', 'Button3']);
      expect(generateUniqueComponentName('Button', existingNames)).toBe('Button4');
    });

    it('should fallback to timestamp after max attempts', () => {
      const existingNames = new Set();
      // Fill with many names to trigger timestamp fallback
      for (let i = 0; i <= 100; i++) {
        existingNames.add(`Button${i === 0 ? '' : i}`);
      }
      const result = generateUniqueComponentName('Button', existingNames, 5);
      expect(result).toMatch(/^Button\d{6}$/);
    });
  });

  describe('isValidComponentName', () => {
    it('should validate correct component names', () => {
      expect(isValidComponentName('Button')).toBe(true);
      expect(isValidComponentName('UserCard')).toBe(true);
      expect(isValidComponentName('NavigationMenu')).toBe(true);
      expect(isValidComponentName('Button_2')).toBe(true);
    });

    it('should reject invalid component names', () => {
      expect(isValidComponentName('')).toBe(false);
      expect(isValidComponentName('button')).toBe(false); // lowercase
      expect(isValidComponentName('123Button')).toBe(false); // starts with number
      expect(isValidComponentName('Button-Card')).toBe(false); // contains hyphen
      expect(isValidComponentName('Button Card')).toBe(false); // contains space
    });

    it('should reject reserved words', () => {
      expect(isValidComponentName('Component')).toBe(false);
      expect(isValidComponentName('Element')).toBe(false);
      expect(isValidComponentName('Fragment')).toBe(false);
      expect(isValidComponentName('React')).toBe(false);
    });
  });

  describe('sanitizeIdentifier', () => {
    it('should remove invalid characters', () => {
      expect(sanitizeIdentifier('my-component')).toBe('mycomponent');
      expect(sanitizeIdentifier('user@name')).toBe('username');
      expect(sanitizeIdentifier('button#1')).toBe('button1');
    });

    it('should remove leading numbers', () => {
      expect(sanitizeIdentifier('123button')).toBe('button');
      expect(sanitizeIdentifier('456test')).toBe('test');
    });

    it('should handle empty input', () => {
      expect(sanitizeIdentifier('')).toBe('identifier');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeIdentifier('validName123')).toBe('validName123');
      expect(sanitizeIdentifier('valid_name$')).toBe('valid_name');
    });

    it('should handle only invalid characters', () => {
      expect(sanitizeIdentifier('!@#$%')).toBe('identifier');
      expect(sanitizeIdentifier('123')).toBe('identifier');
    });
  });
});