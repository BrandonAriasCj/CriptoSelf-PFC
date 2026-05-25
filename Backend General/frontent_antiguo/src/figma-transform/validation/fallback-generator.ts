/**
 * Fallback component generation for unknown or problematic Figma elements
 */

import type { 
  FallbackStrategy, 
  RecoveryResult 
} from '../types/validation.js';
import type { 
  FigmaElement, 
  ElementProperties, 
  StyleProperties 
} from '../types/core.js';
import type { 
  GeneratedComponent, 
  ComponentProps, 
  GenerationContext 
} from '../types/component.js';
import { generateComponentName } from '../utils/naming.js';
import { generateFilePath } from '../utils/file-paths.js';
import { formatCode } from '../utils/code-formatting.js';

/**
 * Configuration options for fallback generation
 */
export interface FallbackConfig {
  generateComments: boolean;
  includeDebugInfo: boolean;
  useGenericNames: boolean;
  defaultDimensions: {
    width: number;
    height: number;
  };
  defaultStyles: StyleProperties;
}

/**
 * Default fallback configuration
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  generateComments: true,
  includeDebugInfo: true,
  useGenericNames: false,
  defaultDimensions: {
    width: 100,
    height: 50
  },
  defaultStyles: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    border: '1px solid #d1d5db'
  }
};

/**
 * Fallback component generator for handling unknown or problematic elements
 */
export class FallbackComponentGenerator {
  private config: FallbackConfig;
  private strategies: FallbackStrategy[] = [];

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config };
    this.initializeFallbackStrategies();
  }

  /**
   * Generates a fallback component for an unknown or problematic element
   */
  generateFallbackComponent(
    element: Partial<FigmaElement>, 
    context: GenerationContext = {},
    reason?: string
  ): GeneratedComponent {
    // Find appropriate fallback strategy
    const strategy = this.findFallbackStrategy(element);
    
    if (strategy) {
      try {
        return strategy.action(element as FigmaElement, context);
      } catch (error) {
        console.warn(`Fallback strategy failed, using generic fallback:`, error);
      }
    }

    // Use generic fallback if no strategy matches
    return this.generateGenericFallback(element, context, reason);
  }

  /**
   * Generates a generic div component as ultimate fallback
   */
  generateGenericFallback(
    element: Partial<FigmaElement>,
    context: GenerationContext = {},
    reason?: string
  ): GeneratedComponent {
    const sanitizedElement = this.sanitizeElement(element);
    const componentName = this.generateFallbackName(sanitizedElement);
    const filePath = generateFilePath(componentName, context.projectConfig);

    const props: ComponentProps = {
      className: {
        type: 'string',
        required: false,
        description: 'Additional CSS classes'
      },
      children: {
        type: 'React.ReactNode',
        required: false,
        description: 'Child elements'
      }
    };

    // Add debug props if enabled
    if (this.config.includeDebugInfo) {
      props.debugInfo = {
        type: 'object',
        required: false,
        description: 'Debug information about the original element'
      };
    }

    const jsx = this.generateGenericJSX(sanitizedElement, reason);
    const imports = this.generateFallbackImports();

    return {
      name: componentName,
      filePath,
      imports,
      props,
      jsx,
      exports: [{ name: componentName, isDefault: true }],
      metadata: {
        isFallback: true,
        originalElement: element,
        fallbackReason: reason || 'Unknown element type',
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generates a basic layout component for complex structures
   */
  generateLayoutFallback(
    element: Partial<FigmaElement>,
    context: GenerationContext = {}
  ): GeneratedComponent {
    const sanitizedElement = this.sanitizeElement(element);
    const componentName = this.generateFallbackName(sanitizedElement, 'Layout');
    const filePath = generateFilePath(componentName, context.projectConfig);

    const props: ComponentProps = {
      className: {
        type: 'string',
        required: false,
        description: 'Additional CSS classes'
      },
      children: {
        type: 'React.ReactNode',
        required: false,
        description: 'Child elements'
      }
    };

    const jsx = this.generateLayoutJSX(sanitizedElement);
    const imports = this.generateFallbackImports();

    return {
      name: componentName,
      filePath,
      imports,
      props,
      jsx,
      exports: [{ name: componentName, isDefault: true }],
      metadata: {
        isFallback: true,
        originalElement: element,
        fallbackReason: 'Complex layout structure',
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generates a placeholder component for missing elements
   */
  generatePlaceholderFallback(
    element: Partial<FigmaElement>,
    context: GenerationContext = {}
  ): GeneratedComponent {
    const sanitizedElement = this.sanitizeElement(element);
    const componentName = this.generateFallbackName(sanitizedElement, 'Placeholder');
    const filePath = generateFilePath(componentName, context.projectConfig);

    const props: ComponentProps = {
      className: {
        type: 'string',
        required: false,
        description: 'Additional CSS classes'
      },
      message: {
        type: 'string',
        required: false,
        defaultValue: 'Component placeholder',
        description: 'Placeholder message to display'
      }
    };

    const jsx = this.generatePlaceholderJSX(sanitizedElement);
    const imports = this.generateFallbackImports();

    return {
      name: componentName,
      filePath,
      imports,
      props,
      jsx,
      exports: [{ name: componentName, isDefault: true }],
      metadata: {
        isFallback: true,
        originalElement: element,
        fallbackReason: 'Missing or incomplete element data',
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Provides manual override options for custom component generation
   */
  generateCustomOverride(
    element: Partial<FigmaElement>,
    overrides: Partial<GeneratedComponent>,
    context: GenerationContext = {}
  ): GeneratedComponent {
    const fallbackComponent = this.generateGenericFallback(element, context, 'Custom override');
    
    // Apply overrides
    return {
      ...fallbackComponent,
      ...overrides,
      metadata: {
        ...fallbackComponent.metadata,
        hasCustomOverrides: true,
        overrides: Object.keys(overrides)
      }
    };
  }

  /**
   * Sanitizes element data to ensure it has minimum required properties
   */
  private sanitizeElement(element: Partial<FigmaElement>): FigmaElement {
    return {
      id: element.id || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: element.type || 'frame',
      properties: this.sanitizeProperties(element.properties),
      styles: this.sanitizeStyles(element.styles),
      children: element.children || []
    };
  }

  /**
   * Sanitizes element properties
   */
  private sanitizeProperties(properties?: Partial<ElementProperties>): ElementProperties {
    return {
      name: properties?.name || 'Fallback Component',
      width: properties?.width || this.config.defaultDimensions.width,
      height: properties?.height || this.config.defaultDimensions.height,
      x: properties?.x || 0,
      y: properties?.y || 0,
      visible: properties?.visible !== false,
      constraints: properties?.constraints || {
        horizontal: 'LEFT',
        vertical: 'TOP'
      }
    };
  }

  /**
   * Sanitizes element styles
   */
  private sanitizeStyles(styles?: Partial<StyleProperties>): StyleProperties {
    return {
      ...this.config.defaultStyles,
      ...styles
    };
  }

  /**
   * Generates a fallback component name
   */
  private generateFallbackName(element: FigmaElement, suffix?: string): string {
    if (this.config.useGenericNames) {
      return suffix ? `Generic${suffix}` : 'GenericComponent';
    }

    let baseName = element.properties.name || element.type || 'Unknown';
    baseName = generateComponentName(baseName);
    
    return suffix ? `${baseName}${suffix}` : baseName;
  }

  /**
   * Generates JSX for generic fallback component
   */
  private generateGenericJSX(element: FigmaElement, reason?: string): string {
    const styles = this.generateTailwindClasses(element.styles);
    const debugComment = this.config.generateComments && reason 
      ? `{/* Fallback component: ${reason} */}\n    ` 
      : '';

    const debugProps = this.config.includeDebugInfo 
      ? `\n      {debugInfo && (\n        <div className="text-xs text-gray-500 p-2 border-t">\n          Debug: {JSON.stringify(debugInfo, null, 2)}\n        </div>\n      )}` 
      : '';

    return formatCode(`
      ${debugComment}<div 
        className={cn(
          "${styles}",
          className
        )}
      >
        {children || (
          <div className="text-sm text-gray-600 p-4 text-center">
            Component placeholder
            ${this.config.generateComments ? `\n            {/* Original element type: ${element.type} */}` : ''}
          </div>
        )}${debugProps}
      </div>
    `);
  }

  /**
   * Generates JSX for layout fallback component
   */
  private generateLayoutJSX(element: FigmaElement): string {
    const styles = this.generateTailwindClasses(element.styles);
    const layoutClasses = this.determineLayoutClasses(element);

    return formatCode(`
      <div 
        className={cn(
          "${styles}",
          "${layoutClasses}",
          className
        )}
      >
        {children || (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">📐</div>
              <div className="text-sm">Layout Container</div>
              ${this.config.generateComments ? `\n              {/* Complex layout fallback */}` : ''}
            </div>
          </div>
        )}
      </div>
    `);
  }

  /**
   * Generates JSX for placeholder fallback component
   */
  private generatePlaceholderJSX(element: FigmaElement): string {
    const styles = this.generateTailwindClasses(element.styles);

    return formatCode(`
      <div 
        className={cn(
          "${styles}",
          "border-2 border-dashed border-gray-300 bg-gray-50",
          className
        )}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🔲</div>
            <div className="text-sm font-medium">{message}</div>
            ${this.config.generateComments ? `\n            {/* Placeholder for: ${element.properties.name} */}` : ''}
          </div>
        </div>
      </div>
    `);
  }

  /**
   * Generates basic Tailwind classes from styles
   */
  private generateTailwindClasses(styles: StyleProperties): string {
    const classes: string[] = [];

    // Background color
    if (styles.backgroundColor) {
      if (styles.backgroundColor.startsWith('#')) {
        classes.push(`bg-[${styles.backgroundColor}]`);
      } else {
        classes.push(`bg-gray-100`);
      }
    }

    // Border radius
    if (styles.borderRadius) {
      if (styles.borderRadius <= 4) classes.push('rounded');
      else if (styles.borderRadius <= 8) classes.push('rounded-md');
      else if (styles.borderRadius <= 12) classes.push('rounded-lg');
      else classes.push('rounded-xl');
    }

    // Padding
    if (styles.padding) {
      classes.push('p-4'); // Default padding
    }

    // Border
    if (styles.border) {
      classes.push('border border-gray-200');
    }

    // Default classes for fallback components
    classes.push('min-h-[50px]', 'min-w-[100px]');

    return classes.join(' ');
  }

  /**
   * Determines layout classes based on element structure
   */
  private determineLayoutClasses(element: FigmaElement): string {
    const classes: string[] = [];

    // If has children, use flex layout
    if (element.children && element.children.length > 0) {
      classes.push('flex', 'flex-col', 'gap-2');
    }

    // Add responsive classes
    classes.push('w-full');

    return classes.join(' ');
  }

  /**
   * Generates imports for fallback components
   */
  private generateFallbackImports() {
    return [
      {
        from: 'react',
        imports: [{ name: 'React', isDefault: false }]
      },
      {
        from: '@/lib/utils',
        imports: [{ name: 'cn', isDefault: false }]
      }
    ];
  }

  /**
   * Finds appropriate fallback strategy for an element
   */
  private findFallbackStrategy(element: Partial<FigmaElement>): FallbackStrategy | undefined {
    return this.strategies.find(strategy => strategy.condition(element as FigmaElement));
  }

  /**
   * Initializes fallback strategies
   */
  private initializeFallbackStrategies(): void {
    this.strategies = [
      // Unknown element type strategy
      {
        condition: (element) => !element.type || element.type === 'unknown',
        action: (element, context) => this.generateGenericFallback(element, context, 'Unknown element type'),
        description: 'Handles elements with unknown or missing type'
      },

      // Complex layout strategy
      {
        condition: (element) => element.children && element.children.length > 5,
        action: (element, context) => this.generateLayoutFallback(element, context),
        description: 'Handles complex layouts with many children'
      },

      // Missing properties strategy
      {
        condition: (element) => !element.properties || !element.properties.name,
        action: (element, context) => this.generatePlaceholderFallback(element, context),
        description: 'Handles elements with missing essential properties'
      },

      // Malformed element strategy
      {
        condition: (element) => !element.id,
        action: (element, context) => this.generateGenericFallback(element, context, 'Malformed element'),
        description: 'Handles elements with missing ID or corrupted data'
      }
    ];
  }
}

/**
 * Utility function to create fallback generator instance
 */
export function createFallbackGenerator(config?: Partial<FallbackConfig>): FallbackComponentGenerator {
  return new FallbackComponentGenerator(config);
}

/**
 * Quick utility to generate a generic fallback component
 */
export function generateGenericFallback(
  element: Partial<FigmaElement>,
  reason?: string
): GeneratedComponent {
  const generator = createFallbackGenerator();
  return generator.generateFallbackComponent(element, {}, reason);
}

/**
 * Quick utility to generate a layout fallback component
 */
export function generateLayoutFallback(
  element: Partial<FigmaElement>
): GeneratedComponent {
  const generator = createFallbackGenerator();
  return generator.generateLayoutFallback(element);
}

/**
 * Quick utility to generate a placeholder fallback component
 */
export function generatePlaceholderFallback(
  element: Partial<FigmaElement>
): GeneratedComponent {
  const generator = createFallbackGenerator();
  return generator.generatePlaceholderFallback(element);
}