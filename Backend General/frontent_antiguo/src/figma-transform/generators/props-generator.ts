/**
 * Props interface generator for creating TypeScript interfaces for React components
 */

import { FigmaElement, StyleProperties } from '../types/core';
import { ComponentProps, PropDefinition, PropValidation } from '../types/component';

export interface PropsGenerationOptions {
  includeClassName: boolean;
  includeChildren: boolean;
  includeEventHandlers: boolean;
  includeVariants: boolean;
  defaultOptional: boolean;
  namingConvention: 'camelCase' | 'PascalCase';
}

export interface GeneratedProps {
  interface: string;
  props: ComponentProps;
  defaultProps: Record<string, any>;
  destructuring: string;
}

export class PropsGenerator {
  private options: PropsGenerationOptions;

  constructor(options: Partial<PropsGenerationOptions> = {}) {
    this.options = {
      includeClassName: true,
      includeChildren: true,
      includeEventHandlers: true,
      includeVariants: false,
      defaultOptional: true,
      namingConvention: 'camelCase',
      ...options
    };
  }

  /**
   * Generate props interface for a component
   */
  generateProps(element: FigmaElement, componentName: string): GeneratedProps {
    const props: ComponentProps = {};
    const defaultProps: Record<string, any> = {};

    // Add standard React props
    this.addStandardProps(props);

    // Add element-specific props
    this.addElementSpecificProps(element, props, defaultProps);

    // Add style-related props
    this.addStyleProps(element, props, defaultProps);

    // Add event handler props
    if (this.options.includeEventHandlers) {
      this.addEventHandlerProps(element, props);
    }

    // Add variant props
    if (this.options.includeVariants) {
      this.addVariantProps(element, props, defaultProps);
    }

    // Generate interface string
    const interfaceString = this.generateInterfaceString(componentName, props);
    
    // Generate destructuring pattern
    const destructuring = this.generateDestructuring(props, defaultProps);

    return {
      interface: interfaceString,
      props,
      defaultProps,
      destructuring
    };
  }

  /**
   * Add standard React props (className, children, etc.)
   */
  private addStandardProps(props: ComponentProps): void {
    if (this.options.includeClassName) {
      props.className = {
        type: 'string',
        required: false,
        description: 'Additional CSS classes to apply'
      };
    }

    if (this.options.includeChildren) {
      props.children = {
        type: 'React.ReactNode',
        required: false,
        description: 'Child elements to render'
      };
    }
  }

  /**
   * Add element-specific props based on Figma element type
   */
  private addElementSpecificProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    switch (element.type) {
      case 'button':
        this.addButtonProps(element, props, defaultProps);
        break;
      case 'input':
        this.addInputProps(element, props, defaultProps);
        break;
      case 'text':
        this.addTextProps(element, props, defaultProps);
        break;
      case 'image':
        this.addImageProps(element, props, defaultProps);
        break;
      default:
        this.addGenericProps(element, props, defaultProps);
        break;
    }
  }

  /**
   * Add button-specific props
   */
  private addButtonProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    props.variant = {
      type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'",
      required: false,
      defaultValue: 'primary',
      description: 'Button visual variant'
    };
    defaultProps.variant = 'primary';

    props.size = {
      type: "'sm' | 'md' | 'lg'",
      required: false,
      defaultValue: 'md',
      description: 'Button size'
    };
    defaultProps.size = 'md';

    props.disabled = {
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Whether the button is disabled'
    };
    defaultProps.disabled = false;

    props.loading = {
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Whether the button is in loading state'
    };
    defaultProps.loading = false;

    props.type = {
      type: "'button' | 'submit' | 'reset'",
      required: false,
      defaultValue: 'button',
      description: 'Button type attribute'
    };
    defaultProps.type = 'button';
  }

  /**
   * Add input-specific props
   */
  private addInputProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    props.type = {
      type: "'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'",
      required: false,
      defaultValue: 'text',
      description: 'Input type'
    };
    defaultProps.type = 'text';

    props.placeholder = {
      type: 'string',
      required: false,
      description: 'Placeholder text'
    };

    props.value = {
      type: 'string',
      required: false,
      description: 'Input value'
    };

    props.defaultValue = {
      type: 'string',
      required: false,
      description: 'Default input value'
    };

    props.required = {
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Whether the input is required'
    };
    defaultProps.required = false;

    props.disabled = {
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Whether the input is disabled'
    };
    defaultProps.disabled = false;

    props.readOnly = {
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Whether the input is read-only'
    };
    defaultProps.readOnly = false;

    props.error = {
      type: 'string',
      required: false,
      description: 'Error message to display'
    };

    props.label = {
      type: 'string',
      required: false,
      description: 'Input label'
    };
  }

  /**
   * Add text-specific props
   */
  private addTextProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    props.as = {
      type: "'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'",
      required: false,
      defaultValue: 'p',
      description: 'HTML element to render as'
    };
    defaultProps.as = 'p';

    props.variant = {
      type: "'body' | 'caption' | 'heading' | 'subheading' | 'label'",
      required: false,
      defaultValue: 'body',
      description: 'Text variant'
    };
    defaultProps.variant = 'body';

    props.size = {
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'",
      required: false,
      defaultValue: 'md',
      description: 'Text size'
    };
    defaultProps.size = 'md';

    props.weight = {
      type: "'normal' | 'medium' | 'semibold' | 'bold'",
      required: false,
      defaultValue: 'normal',
      description: 'Font weight'
    };
    defaultProps.weight = 'normal';

    props.align = {
      type: "'left' | 'center' | 'right' | 'justify'",
      required: false,
      defaultValue: 'left',
      description: 'Text alignment'
    };
    defaultProps.align = 'left';
  }

  /**
   * Add image-specific props
   */
  private addImageProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    props.src = {
      type: 'string',
      required: true,
      description: 'Image source URL'
    };

    props.alt = {
      type: 'string',
      required: true,
      description: 'Alternative text for accessibility'
    };

    props.width = {
      type: 'number | string',
      required: false,
      description: 'Image width'
    };

    props.height = {
      type: 'number | string',
      required: false,
      description: 'Image height'
    };

    props.loading = {
      type: "'lazy' | 'eager'",
      required: false,
      defaultValue: 'lazy',
      description: 'Image loading strategy'
    };
    defaultProps.loading = 'lazy';

    props.objectFit = {
      type: "'cover' | 'contain' | 'fill' | 'none' | 'scale-down'",
      required: false,
      defaultValue: 'cover',
      description: 'How the image should be resized'
    };
    defaultProps.objectFit = 'cover';
  }

  /**
   * Add generic props for other element types
   */
  private addGenericProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    props.as = {
      type: 'React.ElementType',
      required: false,
      defaultValue: 'div',
      description: 'HTML element or component to render as'
    };
    defaultProps.as = 'div';
  }

  /**
   * Add style-related props based on Figma styles
   */
  private addStyleProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    const styles = element.styles;

    // Add spacing props if element has dynamic spacing needs
    if (this.hasVariableSpacing(styles)) {
      props.spacing = {
        type: "'none' | 'sm' | 'md' | 'lg' | 'xl'",
        required: false,
        defaultValue: 'md',
        description: 'Internal spacing'
      };
      defaultProps.spacing = 'md';
    }

    // Add color variant props if element has multiple color options
    if (this.hasVariableColors(styles)) {
      props.color = {
        type: "'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'",
        required: false,
        defaultValue: 'primary',
        description: 'Color variant'
      };
      defaultProps.color = 'primary';
    }

    // Add border radius props if element has rounded corners
    if (styles.borderRadius) {
      props.rounded = {
        type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
        required: false,
        defaultValue: 'md',
        description: 'Border radius'
      };
      defaultProps.rounded = 'md';
    }

    // Add shadow props if element has shadows
    if (styles.shadows && styles.shadows.length > 0) {
      props.shadow = {
        type: "'none' | 'sm' | 'md' | 'lg' | 'xl'",
        required: false,
        defaultValue: 'md',
        description: 'Shadow size'
      };
      defaultProps.shadow = 'md';
    }
  }

  /**
   * Add event handler props
   */
  private addEventHandlerProps(element: FigmaElement, props: ComponentProps): void {
    // Add common event handlers based on element type
    if (this.isInteractiveElement(element)) {
      props.onClick = {
        type: '(event: React.MouseEvent<HTMLElement>) => void',
        required: false,
        description: 'Click event handler'
      };

      props.onKeyDown = {
        type: '(event: React.KeyboardEvent<HTMLElement>) => void',
        required: false,
        description: 'Key down event handler'
      };
    }

    // Add input-specific event handlers
    if (element.type === 'input') {
      props.onChange = {
        type: '(event: React.ChangeEvent<HTMLInputElement>) => void',
        required: false,
        description: 'Change event handler'
      };

      props.onFocus = {
        type: '(event: React.FocusEvent<HTMLInputElement>) => void',
        required: false,
        description: 'Focus event handler'
      };

      props.onBlur = {
        type: '(event: React.FocusEvent<HTMLInputElement>) => void',
        required: false,
        description: 'Blur event handler'
      };
    }
  }

  /**
   * Add variant props for component variations
   */
  private addVariantProps(
    element: FigmaElement,
    props: ComponentProps,
    defaultProps: Record<string, any>
  ): void {
    // This would be expanded based on design system requirements
    props.variant = {
      type: "'default' | 'primary' | 'secondary' | 'outline' | 'ghost'",
      required: false,
      defaultValue: 'default',
      description: 'Component variant'
    };
    defaultProps.variant = 'default';
  }

  /**
   * Generate TypeScript interface string
   */
  private generateInterfaceString(componentName: string, props: ComponentProps): string {
    const interfaceName = `${componentName}Props`;
    const propLines: string[] = [];

    Object.entries(props).forEach(([propName, propDef]) => {
      const optional = propDef.required ? '' : '?';
      const description = propDef.description ? `  /** ${propDef.description} */\n` : '';
      propLines.push(`${description}  ${propName}${optional}: ${propDef.type};`);
    });

    return `interface ${interfaceName} {\n${propLines.join('\n')}\n}`;
  }

  /**
   * Generate destructuring pattern for props
   */
  private generateDestructuring(props: ComponentProps, defaultProps: Record<string, any>): string {
    const propNames: string[] = [];

    Object.entries(props).forEach(([propName, propDef]) => {
      if (defaultProps[propName] !== undefined) {
        const defaultValue = this.formatDefaultValue(defaultProps[propName]);
        propNames.push(`${propName} = ${defaultValue}`);
      } else {
        propNames.push(propName);
      }
    });

    return propNames.join(', ');
  }

  /**
   * Format default value for destructuring
   */
  private formatDefaultValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    return JSON.stringify(value);
  }

  /**
   * Check if element has variable spacing needs
   */
  private hasVariableSpacing(styles: StyleProperties): boolean {
    return !!(styles.padding || styles.margin);
  }

  /**
   * Check if element has variable color options
   */
  private hasVariableColors(styles: StyleProperties): boolean {
    return !!(styles.backgroundColor || (styles.typography && styles.typography.color));
  }

  /**
   * Check if element is interactive
   */
  private isInteractiveElement(element: FigmaElement): boolean {
    const interactiveTypes = ['button', 'input'];
    return interactiveTypes.includes(element.type);
  }

  /**
   * Generate props with Tailwind class merging support
   */
  generatePropsWithClassMerging(element: FigmaElement, componentName: string): GeneratedProps {
    const result = this.generateProps(element, componentName);
    
    // Ensure className prop supports merging
    if (result.props.className) {
      result.props.className.description = 'Additional CSS classes to merge with component styles';
    }

    return result;
  }

  /**
   * Generate props validation schema
   */
  generateValidationSchema(props: ComponentProps): Record<string, PropValidation> {
    const schema: Record<string, PropValidation> = {};

    Object.entries(props).forEach(([propName, propDef]) => {
      if (propDef.validation) {
        schema[propName] = propDef.validation;
      }
    });

    return schema;
  }

  /**
   * Generate default props object
   */
  generateDefaultPropsObject(defaultProps: Record<string, any>): string {
    const entries = Object.entries(defaultProps)
      .map(([key, value]) => `  ${key}: ${this.formatDefaultValue(value)}`)
      .join(',\n');

    return `{\n${entries}\n}`;
  }
}