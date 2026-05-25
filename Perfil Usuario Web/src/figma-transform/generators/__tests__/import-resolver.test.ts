import { describe, it, expect, beforeEach } from 'vitest';
import { ImportResolver, ImportResolutionOptions, ProjectStructure, UtilityImports } from '../import-resolver.js';
import { FigmaElement, StyleProperties, ElementProperties } from '../../types/core.js';
import { UILibraryConfig, ComponentMapping, ImportStatement } from '../../types/component.js';

describe('ImportResolver', () => {
  let resolver: ImportResolver;
  let defaultOptions: ImportResolutionOptions;

  beforeEach(() => {
    const projectStructure: ProjectStructure = {
      componentsPath: '@/components',
      utilsPath: '@/lib/utils',
      typesPath: '@/types',
      hooksPath: '@/hooks',
      libPath: '@/lib'
    };

    const utilityImports: UtilityImports = {
      classNames: 'cn',
      variants: 'cva',
      clsx: false,
      tailwindMerge: false
    };

    const uiLibrary: UILibraryConfig = {
      name: '@radix-ui/react',
      components: [
        { name: 'Button', importPath: '@/components/ui/button', props: {} },
        { name: 'Input', importPath: '@/components/ui/input', props: {} },
        { name: 'Card', importPath: '@/components/ui/card', props: {} },
        { name: 'Label', importPath: '@/components/ui/label', props: {} }
      ],
      utilities: {
        classNames: 'cn',
        variants: 'cva'
      }
    };

    const customMappings: ComponentMapping[] = [
      {
        figmaType: 'button',
        reactComponent: 'Button',
        propsMapping: { text: 'children' },
        styleMapping: { backgroundColor: 'variant' },
        accessibilityAttributes: ['aria-label']
      }
    ];

    defaultOptions = {
      uiLibrary,
      projectStructure,
      customMappings,
      utilityImports
    };

    resolver = new ImportResolver(defaultOptions);
  });

  const createMockElement = (overrides: Partial<FigmaElement> = {}): FigmaElement => {
    const defaultProperties: ElementProperties = {
      name: 'test-element',
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      visible: true,
      constraints: {
        horizontal: 'LEFT',
        vertical: 'TOP'
      }
    };

    const defaultStyles: StyleProperties = {
      backgroundColor: '#ffffff'
    };

    return {
      id: 'test-id',
      type: 'frame',
      name: 'TestElement',
      properties: defaultProperties,
      styles: defaultStyles,
      ...overrides
    };
  };

  describe('resolveImports', () => {
    it('should include React import by default', () => {
      const element = createMockElement();
      const result = resolver.resolveImports(element);

      const reactImport = result.imports.find(imp => imp.source === 'react');
      expect(reactImport).toBeDefined();
      expect(reactImport?.imports).toContainEqual({ name: 'React', isDefault: false });
    });

    it('should include utility imports when configured', () => {
      const element = createMockElement();
      const result = resolver.resolveImports(element);

      const utilsImport = result.imports.find(imp => imp.source === '@/lib/utils');
      expect(utilsImport).toBeDefined();
      expect(utilsImport?.imports).toContainEqual({ name: 'cn', isDefault: false });
    });

    it('should resolve UI component imports based on element type', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = resolver.resolveImports(element);

      const buttonImport = result.imports.find(imp => imp.source === '@/components/ui/button');
      expect(buttonImport).toBeDefined();
      expect(buttonImport?.imports).toContainEqual({ name: 'Button', isDefault: false });
    });

    it('should return utility functions list', () => {
      const element = createMockElement();
      const result = resolver.resolveImports(element);

      expect(result.utilityFunctions).toContain('cn');
    });

    it('should return dependencies list', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = resolver.resolveImports(element);

      expect(result.dependencies).toContain('@radix-ui/react');
    });
  });

  describe('generateImportStrings', () => {
    it('should generate proper import statement strings', () => {
      const imports: ImportStatement[] = [
        {
          source: 'react',
          imports: [{ name: 'React', isDefault: false }]
        },
        {
          source: '@/components/ui/button',
          imports: [{ name: 'Button', isDefault: false }]
        }
      ];

      const result = resolver.generateImportStrings(imports);

      expect(result).toContain("import { React } from 'react';");
      expect(result).toContain("import { Button } from '@/components/ui/button';");
    });

    it('should handle default imports', () => {
      const imports: ImportStatement[] = [
        {
          source: 'react-datepicker',
          imports: [{ name: 'DatePicker', isDefault: true }]
        }
      ];

      const result = resolver.generateImportStrings(imports);

      expect(result).toContain("import DatePicker from 'react-datepicker';");
    });

    it('should handle type-only imports', () => {
      const imports: ImportStatement[] = [
        {
          source: '@/types',
          imports: [{ name: 'ComponentProps', isDefault: false }],
          isTypeOnly: true
        }
      ];

      const result = resolver.generateImportStrings(imports);

      expect(result).toContain("import type { ComponentProps } from '@/types';");
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no children', () => {
      const element = createMockElement({
        children: []
      });
      const result = resolver.resolveImports(element);

      expect(result.imports).toBeDefined();
      expect(result.imports.length).toBeGreaterThan(0); // Should at least have React import
    });

    it('should handle unknown element types', () => {
      const element = createMockElement({
        type: 'unknown' as any
      });
      const result = resolver.resolveImports(element);

      expect(result.imports).toBeDefined();
      // Should still include basic imports like React and utilities
      expect(result.imports.some(imp => imp.source === 'react')).toBe(true);
    });

    it('should handle empty used components array', () => {
      const element = createMockElement();
      const result = resolver.resolveImports(element, []);

      expect(result.imports).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.utilityFunctions).toBeDefined();
    });
  });
});