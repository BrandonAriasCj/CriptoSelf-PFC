import { describe, it, expect, beforeEach } from 'vitest';
import { PropsGenerator, PropsGenerationOptions, GeneratedProps } from '../props-generator.js';
import { FigmaElement, StyleProperties, ElementProperties, LayoutConstraints, TypographyStyle } from '../../types/core.js';
import { ComponentProps } from '../../types/component.js';

describe('PropsGenerator', () => {
  let generator: PropsGenerator;
  let defaultOptions: PropsGenerationOptions;

  beforeEach(() => {
    defaultOptions = {
      includeClassName: true,
      includeChildren: true,
      includeEventHandlers: true,
      includeVariants: false,
      defaultOptional: true,
      namingConvention: 'camelCase'
    };
    generator = new PropsGenerator(defaultOptions);
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

  describe('generateProps', () => {
    it('should generate basic props with standard React props', () => {
      const element = createMockElement();
      const result = generator.generateProps(element, 'TestComponent');

      expect(result.props.className).toBeDefined();
      expect(result.props.className.type).toBe('string');
      expect(result.props.className.required).toBe(false);

      expect(result.props.children).toBeDefined();
      expect(result.props.children.type).toBe('React.ReactNode');
      expect(result.props.children.required).toBe(false);
    });

    it('should generate TypeScript interface string', () => {
      const element = createMockElement();
      const result = generator.generateProps(element, 'TestComponent');

      expect(result.interface).toContain('interface TestComponentProps');
      expect(result.interface).toContain('className?: string;');
      expect(result.interface).toContain('children?: React.ReactNode;');
    });

    it('should generate destructuring pattern with default values', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = generator.generateProps(element, 'Button');

      expect(result.destructuring).toContain('variant = \'primary\'');
      expect(result.destructuring).toContain('size = \'md\'');
      expect(result.destructuring).toContain('disabled = false');
    });

    it('should exclude standard props when options are false', () => {
      const customGenerator = new PropsGenerator({
        ...defaultOptions,
        includeClassName: false,
        includeChildren: false
      });

      const element = createMockElement();
      const result = customGenerator.generateProps(element, 'TestComponent');

      expect(result.props.className).toBeUndefined();
      expect(result.props.children).toBeUndefined();
    });
  });

  describe('button-specific props', () => {
    it('should generate button props for button elements', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = generator.generateProps(element, 'Button');

      expect(result.props.variant).toBeDefined();
      expect(result.props.variant.type).toBe("'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'");
      expect(result.props.variant.defaultValue).toBe('primary');

      expect(result.props.size).toBeDefined();
      expect(result.props.size.type).toBe("'sm' | 'md' | 'lg'");

      expect(result.props.disabled).toBeDefined();
      expect(result.props.disabled.type).toBe('boolean');

      expect(result.props.loading).toBeDefined();
      expect(result.props.loading.type).toBe('boolean');

      expect(result.props.type).toBeDefined();
      expect(result.props.type.type).toBe("'button' | 'submit' | 'reset'");
    });

    it('should include button default props', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = generator.generateProps(element, 'Button');

      expect(result.defaultProps.variant).toBe('primary');
      expect(result.defaultProps.size).toBe('md');
      expect(result.defaultProps.disabled).toBe(false);
      expect(result.defaultProps.loading).toBe(false);
      expect(result.defaultProps.type).toBe('button');
    });
  });

  describe('input-specific props', () => {
    it('should generate input props for input elements', () => {
      const element = createMockElement({
        type: 'input'
      });
      const result = generator.generateProps(element, 'Input');

      expect(result.props.type).toBeDefined();
      expect(result.props.type.type).toBe("'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'");

      expect(result.props.placeholder).toBeDefined();
      expect(result.props.placeholder.type).toBe('string');

      expect(result.props.value).toBeDefined();
      expect(result.props.value.type).toBe('string');

      expect(result.props.required).toBeDefined();
      expect(result.props.required.type).toBe('boolean');

      expect(result.props.disabled).toBeDefined();
      expect(result.props.disabled.type).toBe('boolean');

      expect(result.props.error).toBeDefined();
      expect(result.props.error.type).toBe('string');

      expect(result.props.label).toBeDefined();
      expect(result.props.label.type).toBe('string');
    });

    it('should include input default props', () => {
      const element = createMockElement({
        type: 'input'
      });
      const result = generator.generateProps(element, 'Input');

      expect(result.defaultProps.type).toBe('text');
      expect(result.defaultProps.required).toBe(false);
      expect(result.defaultProps.disabled).toBe(false);
      expect(result.defaultProps.readOnly).toBe(false);
    });
  });

  describe('text-specific props', () => {
    it('should generate text props for text elements', () => {
      const element = createMockElement({
        type: 'text'
      });
      const result = generator.generateProps(element, 'Text');

      expect(result.props.as).toBeDefined();
      expect(result.props.as.type).toBe("'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'");

      expect(result.props.variant).toBeDefined();
      expect(result.props.variant.type).toBe("'body' | 'caption' | 'heading' | 'subheading' | 'label'");

      expect(result.props.size).toBeDefined();
      expect(result.props.size.type).toBe("'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'");

      expect(result.props.weight).toBeDefined();
      expect(result.props.weight.type).toBe("'normal' | 'medium' | 'semibold' | 'bold'");

      expect(result.props.align).toBeDefined();
      expect(result.props.align.type).toBe("'left' | 'center' | 'right' | 'justify'");
    });

    it('should include text default props', () => {
      const element = createMockElement({
        type: 'text'
      });
      const result = generator.generateProps(element, 'Text');

      expect(result.defaultProps.as).toBe('p');
      expect(result.defaultProps.variant).toBe('body');
      expect(result.defaultProps.size).toBe('md');
      expect(result.defaultProps.weight).toBe('normal');
      expect(result.defaultProps.align).toBe('left');
    });
  });

  describe('image-specific props', () => {
    it('should generate image props for image elements', () => {
      const element = createMockElement({
        type: 'image'
      });
      const result = generator.generateProps(element, 'Image');

      expect(result.props.src).toBeDefined();
      expect(result.props.src.type).toBe('string');
      expect(result.props.src.required).toBe(true);

      expect(result.props.alt).toBeDefined();
      expect(result.props.alt.type).toBe('string');
      expect(result.props.alt.required).toBe(true);

      expect(result.props.width).toBeDefined();
      expect(result.props.width.type).toBe('number | string');

      expect(result.props.height).toBeDefined();
      expect(result.props.height.type).toBe('number | string');

      expect(result.props.loading).toBeDefined();
      expect(result.props.loading.type).toBe("'lazy' | 'eager'");

      expect(result.props.objectFit).toBeDefined();
      expect(result.props.objectFit.type).toBe("'cover' | 'contain' | 'fill' | 'none' | 'scale-down'");
    });

    it('should include image default props', () => {
      const element = createMockElement({
        type: 'image'
      });
      const result = generator.generateProps(element, 'Image');

      expect(result.defaultProps.loading).toBe('lazy');
      expect(result.defaultProps.objectFit).toBe('cover');
    });
  });

  describe('generic element props', () => {
    it('should generate generic props for unknown element types', () => {
      const element = createMockElement({
        type: 'frame'
      });
      const result = generator.generateProps(element, 'GenericComponent');

      expect(result.props.as).toBeDefined();
      expect(result.props.as.type).toBe('React.ElementType');
      expect(result.defaultProps.as).toBe('div');
    });
  });

  describe('style-related props', () => {
    it('should add spacing props for elements with variable spacing', () => {
      const element = createMockElement({
        styles: {
          padding: { all: 16 },
          margin: { all: 8 }
        }
      });
      const result = generator.generateProps(element, 'SpacedComponent');

      expect(result.props.spacing).toBeDefined();
      expect(result.props.spacing.type).toBe("'none' | 'sm' | 'md' | 'lg' | 'xl'");
      expect(result.defaultProps.spacing).toBe('md');
    });

    it('should add color props for elements with variable colors', () => {
      const element = createMockElement({
        styles: {
          backgroundColor: '#ff0000',
          typography: {
            color: '#000000'
          }
        }
      });
      const result = generator.generateProps(element, 'ColoredComponent');

      expect(result.props.color).toBeDefined();
      expect(result.props.color.type).toBe("'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'");
      expect(result.defaultProps.color).toBe('primary');
    });

    it('should add rounded props for elements with border radius', () => {
      const element = createMockElement({
        styles: {
          borderRadius: 8
        }
      });
      const result = generator.generateProps(element, 'RoundedComponent');

      expect(result.props.rounded).toBeDefined();
      expect(result.props.rounded.type).toBe("'none' | 'sm' | 'md' | 'lg' | 'full'");
      expect(result.defaultProps.rounded).toBe('md');
    });

    it('should add shadow props for elements with shadows', () => {
      const element = createMockElement({
        styles: {
          shadows: [{
            type: 'DROP_SHADOW',
            color: 'rgba(0, 0, 0, 0.1)',
            offset: { x: 0, y: 2 },
            radius: 4
          }]
        }
      });
      const result = generator.generateProps(element, 'ShadowedComponent');

      expect(result.props.shadow).toBeDefined();
      expect(result.props.shadow.type).toBe("'none' | 'sm' | 'md' | 'lg' | 'xl'");
      expect(result.defaultProps.shadow).toBe('md');
    });
  });

  describe('event handler props', () => {
    it('should add event handlers for interactive elements', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = generator.generateProps(element, 'InteractiveButton');

      expect(result.props.onClick).toBeDefined();
      expect(result.props.onClick.type).toBe('(event: React.MouseEvent<HTMLElement>) => void');

      expect(result.props.onKeyDown).toBeDefined();
      expect(result.props.onKeyDown.type).toBe('(event: React.KeyboardEvent<HTMLElement>) => void');
    });

    it('should add input-specific event handlers', () => {
      const element = createMockElement({
        type: 'input'
      });
      const result = generator.generateProps(element, 'InputField');

      expect(result.props.onChange).toBeDefined();
      expect(result.props.onChange.type).toBe('(event: React.ChangeEvent<HTMLInputElement>) => void');

      expect(result.props.onFocus).toBeDefined();
      expect(result.props.onFocus.type).toBe('(event: React.FocusEvent<HTMLInputElement>) => void');

      expect(result.props.onBlur).toBeDefined();
      expect(result.props.onBlur.type).toBe('(event: React.FocusEvent<HTMLInputElement>) => void');
    });

    it('should not add event handlers when option is disabled', () => {
      const customGenerator = new PropsGenerator({
        ...defaultOptions,
        includeEventHandlers: false
      });

      const element = createMockElement({
        type: 'button'
      });
      const result = customGenerator.generateProps(element, 'Button');

      expect(result.props.onClick).toBeUndefined();
      expect(result.props.onKeyDown).toBeUndefined();
    });
  });

  describe('variant props', () => {
    it('should add variant props when option is enabled', () => {
      const customGenerator = new PropsGenerator({
        ...defaultOptions,
        includeVariants: true
      });

      const element = createMockElement();
      const result = customGenerator.generateProps(element, 'VariantComponent');

      expect(result.props.variant).toBeDefined();
      expect(result.props.variant.type).toBe("'default' | 'primary' | 'secondary' | 'outline' | 'ghost'");
      expect(result.defaultProps.variant).toBe('default');
    });

    it('should not add variant props when option is disabled', () => {
      const element = createMockElement();
      const result = generator.generateProps(element, 'Component');

      // Should not have generic variant prop (button elements have their own variant)
      if (element.type !== 'button') {
        expect(result.props.variant).toBeUndefined();
      }
    });
  });

  describe('interface generation', () => {
    it('should generate proper TypeScript interface with descriptions', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = generator.generateProps(element, 'Button');

      expect(result.interface).toContain('interface ButtonProps {');
      expect(result.interface).toContain('/** Additional CSS classes to apply */');
      expect(result.interface).toContain('/** Button visual variant */');
      expect(result.interface).toContain('/** Whether the button is disabled */');
      expect(result.interface).toContain('}');
    });

    it('should handle required vs optional props correctly', () => {
      const element = createMockElement({
        type: 'image'
      });
      const result = generator.generateProps(element, 'Image');

      expect(result.interface).toContain('src: string;'); // required
      expect(result.interface).toContain('alt: string;'); // required
      expect(result.interface).toContain('width?: number | string;'); // optional
      expect(result.interface).toContain('loading?: \'lazy\' | \'eager\';'); // optional
    });
  });

  describe('destructuring generation', () => {
    it('should generate destructuring with default values', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = generator.generateProps(element, 'Button');

      expect(result.destructuring).toContain('variant = \'primary\'');
      expect(result.destructuring).toContain('size = \'md\'');
      expect(result.destructuring).toContain('disabled = false');
      expect(result.destructuring).toContain('type = \'button\'');
    });

    it('should handle props without default values', () => {
      const element = createMockElement({
        type: 'input'
      });
      const result = generator.generateProps(element, 'Input');

      expect(result.destructuring).toContain('placeholder');
      expect(result.destructuring).toContain('value');
      expect(result.destructuring).not.toContain('placeholder =');
      expect(result.destructuring).not.toContain('value =');
    });

    it('should format different default value types correctly', () => {
      const element = createMockElement({
        type: 'button'
      });
      const result = generator.generateProps(element, 'Button');

      // String values
      expect(result.destructuring).toContain('variant = \'primary\'');
      // Boolean values
      expect(result.destructuring).toContain('disabled = false');
    });
  });

  describe('naming conventions', () => {
    it('should use camelCase naming convention by default', () => {
      const element = createMockElement();
      const result = generator.generateProps(element, 'TestComponent');

      expect(result.interface).toContain('interface TestComponentProps');
    });

    it('should use PascalCase naming convention when specified', () => {
      const customGenerator = new PropsGenerator({
        ...defaultOptions,
        namingConvention: 'PascalCase'
      });

      const element = createMockElement();
      const result = customGenerator.generateProps(element, 'TestComponent');

      expect(result.interface).toContain('interface TestComponentProps');
    });
  });

  describe('generatePropsWithClassMerging', () => {
    it('should update className prop description for class merging', () => {
      const element = createMockElement();
      const result = generator.generatePropsWithClassMerging(element, 'TestComponent');

      expect(result.props.className?.description).toBe('Additional CSS classes to merge with component styles');
    });
  });

  describe('generateDefaultPropsObject', () => {
    it('should generate formatted default props object', () => {
      const defaultProps = {
        variant: 'primary',
        size: 'md',
        disabled: false,
        count: 0
      };

      const result = generator.generateDefaultPropsObject(defaultProps);

      expect(result).toContain('{\n');
      expect(result).toContain('  variant: \'primary\',\n');
      expect(result).toContain('  size: \'md\',\n');
      expect(result).toContain('  disabled: false,\n');
      expect(result).toContain('  count: 0\n');
      expect(result).toContain('}');
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no styles', () => {
      const element = createMockElement({
        styles: {}
      });
      const result = generator.generateProps(element, 'EmptyComponent');

      expect(result.props.className).toBeDefined();
      expect(result.props.children).toBeDefined();
    });

    it('should handle elements with complex style combinations', () => {
      const element = createMockElement({
        styles: {
          backgroundColor: '#ff0000',
          borderRadius: 8,
          padding: { all: 16 },
          shadows: [{
            type: 'DROP_SHADOW',
            color: 'rgba(0, 0, 0, 0.1)',
            offset: { x: 0, y: 2 },
            radius: 4
          }],
          typography: {
            color: '#000000',
            fontSize: 16
          }
        }
      });
      const result = generator.generateProps(element, 'ComplexComponent');

      expect(result.props.spacing).toBeDefined();
      expect(result.props.color).toBeDefined();
      expect(result.props.rounded).toBeDefined();
      expect(result.props.shadow).toBeDefined();
    });

    it('should handle empty component names', () => {
      const element = createMockElement();
      const result = generator.generateProps(element, '');

      expect(result.interface).toContain('interface Props');
    });
  });
});