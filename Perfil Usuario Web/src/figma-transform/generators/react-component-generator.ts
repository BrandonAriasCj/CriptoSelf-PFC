/**
 * Main React component generator that orchestrates all generation components
 */

import { FigmaElement } from '../types/core';
import { GeneratedComponent, GenerationContext, ExportStatement } from '../types/component';
import { TailwindClassGenerator } from './tailwind-class-generator';
import { JSXGenerator } from './jsx-generator';
import { PropsGenerator } from './props-generator';
import { ImportResolver, ImportResolutionOptions } from './import-resolver';
import { generateComponentName, generateFileName } from '../utils/naming';
import { formatCode } from '../utils/code-formatting';

export interface ComponentGenerationOptions {
  useSemanticHTML: boolean;
  includeAccessibility: boolean;
  includeTypeScript: boolean;
  includeDefaultProps: boolean;
  exportPattern: 'named' | 'default' | 'both';
  componentDirectory: string;
}

export class ReactComponentGenerator {
  private tailwindGenerator: TailwindClassGenerator;
  private jsxGenerator: JSXGenerator;
  private propsGenerator: PropsGenerator;
  private importResolver: ImportResolver;
  private options: ComponentGenerationOptions;

  constructor(
    context: GenerationContext,
    importOptions: ImportResolutionOptions,
    options: Partial<ComponentGenerationOptions> = {}
  ) {
    this.options = {
      useSemanticHTML: true,
      includeAccessibility: true,
      includeTypeScript: true,
      includeDefaultProps: true,
      exportPattern: 'default',
      componentDirectory: 'src/components',
      ...options
    };

    this.tailwindGenerator = new TailwindClassGenerator();
    this.jsxGenerator = new JSXGenerator({
      useSemanticHTML: this.options.useSemanticHTML,
      includeAccessibility: this.options.includeAccessibility,
      classNameUtility: 'cn'
    });
    this.propsGenerator = new PropsGenerator({
      includeClassName: true,
      includeChildren: true,
      includeEventHandlers: true
    });
    this.importResolver = new ImportResolver(importOptions);
  }

  /**
   * Generate a complete React component from a Figma element
   */
  generateComponent(element: FigmaElement): GeneratedComponent {
    // Generate component name
    const componentName = generateComponentName(element.name);
    const fileName = generateFileName(componentName);
    const filePath = `${this.options.componentDirectory}/${fileName}`;

    // Generate props interface and destructuring
    const propsResult = this.propsGenerator.generatePropsWithClassMerging(element, componentName);

    // Generate JSX content
    const jsxContent = this.jsxGenerator.generateJSX(element);

    // Resolve imports
    const usedComponents = this.extractUsedComponents(element);
    const importResult = this.importResolver.resolveImports(element, usedComponents);

    // Generate complete component code
    const componentCode = this.generateComponentCode(
      componentName,
      propsResult,
      jsxContent,
      importResult.imports
    );

    return {
      name: componentName,
      filePath,
      imports: importResult.imports,
      props: propsResult.props,
      jsx: componentCode,
      exports: this.generateExports(componentName),
      dependencies: importResult.dependencies
    };
  }

  /**
   * Generate multiple components from a Figma element tree
   */
  generateComponents(elements: FigmaElement[]): GeneratedComponent[] {
    return elements.map(element => this.generateComponent(element));
  }

  /**
   * Generate the complete component code string
   */
  private generateComponentCode(
    componentName: string,
    propsResult: any,
    jsxContent: string,
    imports: any[]
  ): string {
    const parts: string[] = [];

    // Add imports
    const importStrings = this.importResolver.generateImportStrings(imports);
    parts.push(...importStrings);
    parts.push(''); // Empty line after imports

    // Add props interface (if TypeScript)
    if (this.options.includeTypeScript) {
      parts.push(propsResult.interface);
      parts.push(''); // Empty line after interface
    }

    // Add component function
    const componentFunction = this.generateComponentFunction(
      componentName,
      propsResult,
      jsxContent
    );
    parts.push(componentFunction);

    // Add default props (if enabled)
    if (this.options.includeDefaultProps && Object.keys(propsResult.defaultProps).length > 0) {
      parts.push(''); // Empty line
      const defaultPropsCode = this.generateDefaultPropsCode(componentName, propsResult.defaultProps);
      parts.push(defaultPropsCode);
    }

    // Add exports
    const exportStatements = this.generateExportStatements(componentName);
    if (exportStatements.length > 0) {
      parts.push(''); // Empty line
      parts.push(...exportStatements);
    }

    const code = parts.join('\n');
    return formatCode(code);
  }

  /**
   * Generate the component function
   */
  private generateComponentFunction(
    componentName: string,
    propsResult: any,
    jsxContent: string
  ): string {
    const propsType = this.options.includeTypeScript ? `: ${componentName}Props` : '';
    const destructuring = propsResult.destructuring;

    return `export function ${componentName}({ ${destructuring} }${propsType}) {
  return (
    ${this.indentJSX(jsxContent, 2)}
  );
}`;
  }

  /**
   * Generate default props code
   */
  private generateDefaultPropsCode(componentName: string, defaultProps: Record<string, any>): string {
    const defaultPropsObj = this.propsGenerator.generateDefaultPropsObject(defaultProps);
    return `${componentName}.defaultProps = ${defaultPropsObj};`;
  }

  /**
   * Generate export statements
   */
  private generateExportStatements(componentName: string): string[] {
    const statements: string[] = [];

    switch (this.options.exportPattern) {
      case 'named':
        // Already exported in function declaration
        break;
      case 'default':
        statements.push(`export default ${componentName};`);
        break;
      case 'both':
        statements.push(`export default ${componentName};`);
        break;
    }

    return statements;
  }

  /**
   * Generate export configuration
   */
  private generateExports(componentName: string): ExportStatement[] {
    const exports: ExportStatement[] = [];

    switch (this.options.exportPattern) {
      case 'named':
        exports.push({ name: componentName, isDefault: false });
        break;
      case 'default':
        exports.push({ name: componentName, isDefault: true });
        break;
      case 'both':
        exports.push({ name: componentName, isDefault: false });
        exports.push({ name: componentName, isDefault: true });
        break;
    }

    return exports;
  }

  /**
   * Extract used UI components from element tree
   */
  private extractUsedComponents(element: FigmaElement): string[] {
    const components = new Set<string>();

    // Add component based on element type
    const componentName = this.getUIComponentForElement(element);
    if (componentName) {
      components.add(componentName);
    }

    // Recursively check children
    if (element.children) {
      element.children.forEach(child => {
        const childComponents = this.extractUsedComponents(child);
        childComponents.forEach(comp => components.add(comp));
      });
    }

    return Array.from(components);
  }

  /**
   * Get UI component name for Figma element type
   */
  private getUIComponentForElement(element: FigmaElement): string | null {
    const componentMap: Record<string, string> = {
      'button': 'Button',
      'input': 'Input',
      'frame': 'Card'
    };

    return componentMap[element.type] || null;
  }

  /**
   * Indent JSX content
   */
  private indentJSX(jsx: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return jsx.split('\n').map(line => line ? indent + line : line).join('\n');
  }

  /**
   * Generate component with custom styling
   */
  generateStyledComponent(element: FigmaElement, customStyles?: Record<string, string>): GeneratedComponent {
    // Apply custom styles to element
    if (customStyles) {
      element.styles = {
        ...element.styles,
        tailwindClasses: [
          ...(element.styles.tailwindClasses || []),
          ...Object.values(customStyles)
        ]
      };
    }

    return this.generateComponent(element);
  }

  /**
   * Generate component with variants
   */
  generateVariantComponent(element: FigmaElement, variants: Record<string, any>): GeneratedComponent {
    // Enable variant generation in props generator
    this.propsGenerator = new PropsGenerator({
      includeClassName: true,
      includeChildren: true,
      includeEventHandlers: true,
      includeVariants: true
    });

    const component = this.generateComponent(element);

    // Add variant logic to component
    component.jsx = this.addVariantLogic(component.jsx, variants);

    return component;
  }

  /**
   * Add variant logic to component JSX
   */
  private addVariantLogic(jsx: string, variants: Record<string, any>): string {
    // This would add cva (class-variance-authority) logic
    // For now, return the original JSX
    return jsx;
  }

  /**
   * Generate responsive component
   */
  generateResponsiveComponent(element: FigmaElement): GeneratedComponent {
    // Ensure responsive classes are generated
    if (element.responsive) {
      const responsiveClasses = this.tailwindGenerator.generateResponsiveClasses(
        element.styles,
        element.responsive
      );
      element.styles.tailwindClasses = responsiveClasses;
    }

    return this.generateComponent(element);
  }

  /**
   * Validate generated component
   */
  validateComponent(component: GeneratedComponent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required props
    if (!component.name) {
      errors.push('Component name is required');
    }

    // Check for valid JSX
    if (!component.jsx || component.jsx.trim().length === 0) {
      errors.push('Component JSX is empty');
    }

    // Check for TypeScript syntax (basic validation)
    if (this.options.includeTypeScript) {
      if (!component.jsx.includes('Props')) {
        errors.push('TypeScript props interface not found');
      }
    }

    // Check for accessibility attributes
    if (this.options.includeAccessibility) {
      if (!component.jsx.includes('aria-') && !component.jsx.includes('role=')) {
        // Only warn for interactive elements
        const hasInteractiveElements = component.jsx.includes('<button') || component.jsx.includes('<input');
        if (hasInteractiveElements) {
          errors.push('Interactive elements should include accessibility attributes');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate component documentation
   */
  generateComponentDocs(component: GeneratedComponent): string {
    const docs: string[] = [];

    docs.push(`# ${component.name}`);
    docs.push('');
    docs.push('## Props');
    docs.push('');

    Object.entries(component.props).forEach(([propName, propDef]) => {
      docs.push(`### ${propName}`);
      docs.push(`- Type: \`${propDef.type}\``);
      docs.push(`- Required: ${propDef.required ? 'Yes' : 'No'}`);
      if (propDef.defaultValue !== undefined) {
        docs.push(`- Default: \`${propDef.defaultValue}\``);
      }
      if (propDef.description) {
        docs.push(`- Description: ${propDef.description}`);
      }
      docs.push('');
    });

    docs.push('## Usage');
    docs.push('');
    docs.push('```tsx');
    docs.push(`import { ${component.name} } from './${component.name}';`);
    docs.push('');
    docs.push(`<${component.name} />`);
    docs.push('```');

    return docs.join('\n');
  }
}