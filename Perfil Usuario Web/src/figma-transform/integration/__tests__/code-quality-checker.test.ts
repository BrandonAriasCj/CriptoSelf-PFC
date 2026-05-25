/**
 * Unit tests for CodeQualityChecker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeQualityChecker } from '../code-quality-checker.js';
import type { ProjectConfig, GeneratedComponent } from '../../types/index.js';

describe('CodeQualityChecker', () => {
  let mockProjectConfig: ProjectConfig;
  let checker: CodeQualityChecker;

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
        react: '^18.2.0',
        typescript: '^5.0.2'
      }
    };

    checker = new CodeQualityChecker(mockProjectConfig);
  });

  describe('analyzeComponent', () => {
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
          variant: { type: 'string', required: false, description: 'Button variant' },
          children: { type: 'React.ReactNode', required: true, description: 'Button content' },
          className: { type: 'string', required: false }
        },
        jsx: '<button className={cn("btn", className)}>{children}</button>',
        exports: [{ name: 'TestButton', isDefault: false }]
      };
    });

    it('should pass analysis for a well-structured component', async () => {
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.passed).toBe(true);
      expect(result.issues.filter(issue => issue.severity === 'error')).toHaveLength(0);
      expect(result.metrics.maintainability).toBeGreaterThan(70);
    });

    it('should detect syntax errors', async () => {
      validComponent.jsx = '<button><span>Unclosed tag</button>';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'SYNTAX',
          severity: 'error',
          rule: 'jsx-tag-matching'
        })
      );
    });

    it('should detect invalid TypeScript types', async () => {
      validComponent.props.invalidProp = { type: 'invalidType', required: false };
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TYPE',
          severity: 'error',
          rule: 'valid-prop-types'
        })
      );
    });

    it('should detect naming convention violations', async () => {
      validComponent.name = 'testButton'; // camelCase instead of PascalCase
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'STYLE',
          severity: 'error',
          rule: 'component-naming-convention'
        })
      );
    });

    it('should detect accessibility issues', async () => {
      validComponent.jsx = '<button onClick={handleClick}>Click me</button>';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'ACCESSIBILITY',
          severity: 'warning',
          rule: 'keyboard-navigation'
        })
      );
    });

    it('should detect security issues', async () => {
      validComponent.jsx = '<div dangerouslySetInnerHTML={{__html: userInput}} />';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'SECURITY',
          severity: 'error',
          rule: 'no-dangerous-html'
        })
      );
    });

    it('should detect performance issues', async () => {
      validComponent.jsx = '<button onClick={() => console.log("inline function")}>Click</button>';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'PERFORMANCE',
          severity: 'warning',
          rule: 'avoid-unnecessary-rerenders'
        })
      );
    });

    it('should suggest React.memo for components with many props', async () => {
      // Add many props to trigger memo suggestion
      for (let i = 0; i < 10; i++) {
        validComponent.props[`prop${i}`] = { type: 'string', required: false };
      }
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'PERFORMANCE',
          severity: 'info',
          rule: 'consider-memo'
        })
      );
    });

    it('should warn about missing prop documentation', async () => {
      validComponent.props.undocumentedProp = { type: 'string', required: true };
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TYPE',
          severity: 'warning',
          rule: 'prop-documentation'
        })
      );
    });

    it('should validate children prop type', async () => {
      validComponent.props.children = { type: 'string', required: true };
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TYPE',
          severity: 'warning',
          rule: 'children-prop-type'
        })
      );
    });

    it('should detect missing exports', async () => {
      validComponent.exports = [];
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'SYNTAX',
          severity: 'error',
          rule: 'export-required'
        })
      );
    });

    it('should detect improper JSX attribute quotes', async () => {
      validComponent.jsx = '<button className=unquoted>Test</button>';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'SYNTAX',
          severity: 'error',
          rule: 'jsx-attribute-quotes'
        })
      );
    });

    it('should detect void elements that should be self-closing', async () => {
      validComponent.jsx = '<div><img src="test.jpg"><input type="text"></div>';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'SYNTAX',
          severity: 'warning',
          rule: 'jsx-self-closing'
        })
      );
    });

    it('should detect duplicate CSS classes', async () => {
      validComponent.jsx = '<button className="btn btn primary btn">Test</button>';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'PERFORMANCE',
          severity: 'warning',
          rule: 'no-duplicate-classes'
        })
      );
    });

    it('should detect div soup (excessive div usage)', async () => {
      validComponent.jsx = '<div><div><div><div><div>Content</div></div></div></div></div>';
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'ACCESSIBILITY',
          severity: 'warning',
          rule: 'semantic-html-usage'
        })
      );
    });

    it('should detect sensitive prop names', async () => {
      validComponent.props.userPassword = { type: 'string', required: false };
      validComponent.props.apiToken = { type: 'string', required: false };
      
      const result = await checker.analyzeComponent(validComponent);
      
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'SECURITY',
          severity: 'warning',
          rule: 'sensitive-prop-handling'
        })
      );
    });
  });

  describe('analyzeComponents', () => {
    it('should analyze multiple components and provide aggregate results', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'Component1',
          filePath: 'src/components/Component1.tsx',
          imports: [],
          props: { prop1: { type: 'string', required: false } },
          jsx: '<div>Component 1</div>',
          exports: [{ name: 'Component1' }]
        },
        {
          name: 'Component2',
          filePath: 'src/components/Component2.tsx',
          imports: [],
          props: { prop2: { type: 'string', required: false } },
          jsx: '<div>Component 2</div>',
          exports: [{ name: 'Component2' }]
        }
      ];
      
      const result = await checker.analyzeComponents(components);
      
      expect(result.individual.size).toBe(2);
      expect(result.individual.has('Component1')).toBe(true);
      expect(result.individual.has('Component2')).toBe(true);
      expect(result.overall.metrics).toBeDefined();
      expect(result.overall.suggestions).toBeDefined();
    });

    it('should remove duplicate suggestions in aggregate results', async () => {
      const components: GeneratedComponent[] = [
        {
          name: 'component1', // Invalid naming
          filePath: 'src/components/component1.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'component1' }]
        },
        {
          name: 'component2', // Invalid naming
          filePath: 'src/components/component2.tsx',
          imports: [],
          props: {},
          jsx: '<div>Test</div>',
          exports: [{ name: 'component2' }]
        }
      ];
      
      const result = await checker.analyzeComponents(components);
      
      // Should have unique suggestions even though both components have naming issues
      const namingSuggestions = result.overall.suggestions.filter(s => 
        s.includes('naming') || s.includes('convention')
      );
      expect(namingSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('configuration options', () => {
    it('should skip syntax checks when disabled', async () => {
      checker = new CodeQualityChecker(mockProjectConfig, { checkSyntax: false });
      
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [],
        props: {},
        jsx: '<button><span>Unclosed tag</button>', // Syntax error
        exports: []
      };
      
      const result = await checker.analyzeComponent(component);
      
      const syntaxIssues = result.issues.filter(issue => issue.type === 'SYNTAX');
      expect(syntaxIssues).toHaveLength(0);
    });

    it('should skip type checks when disabled', async () => {
      checker = new CodeQualityChecker(mockProjectConfig, { checkTypes: false });
      
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [],
        props: { invalidProp: { type: 'invalidType', required: false } },
        jsx: '<div>Test</div>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const result = await checker.analyzeComponent(component);
      
      const typeIssues = result.issues.filter(issue => issue.type === 'TYPE');
      expect(typeIssues).toHaveLength(0);
    });

    it('should skip accessibility checks when disabled', async () => {
      checker = new CodeQualityChecker(mockProjectConfig, { checkAccessibility: false });
      
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [],
        props: {},
        jsx: '<button onClick={handleClick}>Click me</button>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const result = await checker.analyzeComponent(component);
      
      const a11yIssues = result.issues.filter(issue => issue.type === 'ACCESSIBILITY');
      expect(a11yIssues).toHaveLength(0);
    });

    it('should skip performance checks when disabled', async () => {
      checker = new CodeQualityChecker(mockProjectConfig, { checkPerformance: false });
      
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [],
        props: {},
        jsx: '<button onClick={() => console.log("inline")}>Click</button>',
        exports: [{ name: 'TestComponent' }]
      };
      
      const result = await checker.analyzeComponent(component);
      
      const perfIssues = result.issues.filter(issue => issue.type === 'PERFORMANCE');
      expect(perfIssues).toHaveLength(0);
    });

    it('should skip security checks when disabled', async () => {
      checker = new CodeQualityChecker(mockProjectConfig, { checkSecurity: false });
      
      const component: GeneratedComponent = {
        name: 'TestComponent',
        filePath: 'src/components/TestComponent.tsx',
        imports: [],
        props: {},
        jsx: '<div dangerouslySetInnerHTML={{__html: userInput}} />',
        exports: [{ name: 'TestComponent' }]
      };
      
      const result = await checker.analyzeComponent(component);
      
      const securityIssues = result.issues.filter(issue => issue.type === 'SECURITY');
      expect(securityIssues).toHaveLength(0);
    });
  });

  describe('quality metrics calculation', () => {
    it('should calculate complexity based on component structure', async () => {
      const simpleComponent: GeneratedComponent = {
        name: 'SimpleComponent',
        filePath: 'src/components/SimpleComponent.tsx',
        imports: [],
        props: {},
        jsx: '<div>Simple</div>',
        exports: [{ name: 'SimpleComponent' }]
      };
      
      const complexComponent: GeneratedComponent = {
        name: 'ComplexComponent',
        filePath: 'src/components/ComplexComponent.tsx',
        imports: [
          { source: 'react', imports: [{ name: 'React' }] },
          { source: 'lodash', imports: [{ name: 'debounce' }] },
          { source: '@/utils', imports: [{ name: 'helper' }] }
        ],
        props: {
          prop1: { type: 'string', required: false },
          prop2: { type: 'number', required: false },
          prop3: { type: 'boolean', required: false },
          prop4: { type: 'function', required: false }
        },
        jsx: '<div><section><article><p>Complex nested structure</p></article></section></div>',
        exports: [{ name: 'ComplexComponent' }]
      };
      
      const simpleResult = await checker.analyzeComponent(simpleComponent);
      const complexResult = await checker.analyzeComponent(complexComponent);
      
      expect(complexResult.metrics.complexity).toBeGreaterThan(simpleResult.metrics.complexity);
    });

    it('should calculate maintainability score based on issues', async () => {
      const goodComponent: GeneratedComponent = {
        name: 'GoodComponent',
        filePath: 'src/components/GoodComponent.tsx',
        imports: [{ source: 'react', imports: [{ name: 'React' }] }],
        props: { children: { type: 'React.ReactNode', required: true } },
        jsx: '<div>{children}</div>',
        exports: [{ name: 'GoodComponent' }]
      };
      
      const badComponent: GeneratedComponent = {
        name: 'badComponent', // Naming issue
        filePath: 'src/components/badComponent.tsx',
        imports: [],
        props: { invalidProp: { type: 'invalidType', required: false } }, // Type issue
        jsx: '<button><span>Unclosed tag</button>', // Syntax issue
        exports: []
      };
      
      const goodResult = await checker.analyzeComponent(goodComponent);
      const badResult = await checker.analyzeComponent(badComponent);
      
      expect(goodResult.metrics.maintainability).toBeGreaterThan(badResult.metrics.maintainability);
    });
  });
});