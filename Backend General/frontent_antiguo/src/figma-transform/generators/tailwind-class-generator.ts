/**
 * Tailwind CSS class generator for converting Figma styles to Tailwind classes
 */

import { StyleProperties, Spacing, BorderRadius, TypographyStyle, Shadow, Border } from '../types/core';
import { TailwindMapping } from '../types/component';

export class TailwindClassGenerator {
  private mappings: TailwindMapping[];
  private colorMappings: Record<string, string>;
  private spacingMappings: Record<string, string>;
  private responsiveBreakpoints: string[];

  constructor() {
    this.mappings = this.initializeMappings();
    this.colorMappings = this.initializeColorMappings();
    this.spacingMappings = this.initializeSpacingMappings();
    this.responsiveBreakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
  }

  /**
   * Generate Tailwind classes from Figma style properties
   */
  generateClasses(styles: StyleProperties): string[] {
    const classes: string[] = [];

    // Background color
    if (styles.backgroundColor) {
      const bgClass = this.convertColorToTailwind(styles.backgroundColor, 'bg');
      if (bgClass) classes.push(bgClass);
    }

    // Border radius
    if (styles.borderRadius !== undefined) {
      const radiusClasses = this.convertBorderRadiusToTailwind(styles.borderRadius);
      classes.push(...radiusClasses);
    }

    // Padding
    if (styles.padding) {
      const paddingClasses = this.convertSpacingToTailwind(styles.padding, 'p');
      classes.push(...paddingClasses);
    }

    // Margin
    if (styles.margin) {
      const marginClasses = this.convertSpacingToTailwind(styles.margin, 'm');
      classes.push(...marginClasses);
    }

    // Typography
    if (styles.typography) {
      const typographyClasses = this.convertTypographyToTailwind(styles.typography);
      classes.push(...typographyClasses);
    }

    // Shadows
    if (styles.shadows && styles.shadows.length > 0) {
      const shadowClasses = this.convertShadowsToTailwind(styles.shadows);
      classes.push(...shadowClasses);
    }

    // Borders
    if (styles.borders && styles.borders.length > 0) {
      const borderClasses = this.convertBordersToTailwind(styles.borders);
      classes.push(...borderClasses);
    }

    // Custom Tailwind classes
    if (styles.tailwindClasses) {
      classes.push(...styles.tailwindClasses);
    }

    return classes.filter(Boolean);
  }

  /**
   * Generate responsive classes for different breakpoints
   */
  generateResponsiveClasses(
    baseStyles: StyleProperties,
    responsiveStyles: Record<string, StyleProperties>
  ): string[] {
    const classes: string[] = [];

    // Base classes (mobile-first)
    classes.push(...this.generateClasses(baseStyles));

    // Responsive breakpoint classes
    Object.entries(responsiveStyles).forEach(([breakpoint, styles]) => {
      if (this.responsiveBreakpoints.includes(breakpoint)) {
        const breakpointClasses = this.generateClasses(styles);
        const prefixedClasses = breakpointClasses.map(cls => `${breakpoint}:${cls}`);
        classes.push(...prefixedClasses);
      }
    });

    return classes;
  }

  /**
   * Convert hex/rgb color to Tailwind color class
   */
  private convertColorToTailwind(color: string, prefix: string): string | null {
    // Check predefined color mappings first
    const mappedColor = this.colorMappings[color.toLowerCase()];
    if (mappedColor) {
      return `${prefix}-${mappedColor}`;
    }

    // Convert hex to closest Tailwind color or use arbitrary value
    if (color.startsWith('#')) {
      const closestColor = this.findClosestTailwindColor(color);
      if (closestColor) {
        return `${prefix}-${closestColor}`;
      }
      // Use arbitrary value for custom colors
      return `${prefix}-[${color}]`;
    }

    // Handle rgb/rgba values
    if (color.startsWith('rgb')) {
      return `${prefix}-[${color}]`;
    }

    return null;
  }

  /**
   * Convert border radius to Tailwind classes
   */
  private convertBorderRadiusToTailwind(borderRadius: number | BorderRadius): string[] {
    if (typeof borderRadius === 'number') {
      const mappedRadius = this.spacingMappings[borderRadius.toString()];
      if (mappedRadius) {
        return [`rounded-${mappedRadius}`];
      }
      return [`rounded-[${borderRadius}px]`];
    }

    const classes: string[] = [];
    const { topLeft, topRight, bottomLeft, bottomRight, all } = borderRadius;

    if (all !== undefined) {
      const mappedRadius = this.spacingMappings[all.toString()];
      if (mappedRadius) {
        classes.push(`rounded-${mappedRadius}`);
      } else {
        classes.push(`rounded-[${all}px]`);
      }
    } else {
      if (topLeft !== undefined) classes.push(`rounded-tl-[${topLeft}px]`);
      if (topRight !== undefined) classes.push(`rounded-tr-[${topRight}px]`);
      if (bottomLeft !== undefined) classes.push(`rounded-bl-[${bottomLeft}px]`);
      if (bottomRight !== undefined) classes.push(`rounded-br-[${bottomRight}px]`);
    }

    return classes;
  }

  /**
   * Convert spacing to Tailwind classes
   */
  private convertSpacingToTailwind(spacing: Spacing, prefix: string): string[] {
    const classes: string[] = [];
    const { top, right, bottom, left, all } = spacing;

    if (all !== undefined) {
      const mappedSpacing = this.spacingMappings[all.toString()];
      if (mappedSpacing) {
        classes.push(`${prefix}-${mappedSpacing}`);
      } else {
        classes.push(`${prefix}-[${all}px]`);
      }
    } else {
      if (top !== undefined) {
        const mappedTop = this.spacingMappings[top.toString()];
        classes.push(mappedTop ? `${prefix}t-${mappedTop}` : `${prefix}t-[${top}px]`);
      }
      if (right !== undefined) {
        const mappedRight = this.spacingMappings[right.toString()];
        classes.push(mappedRight ? `${prefix}r-${mappedRight}` : `${prefix}r-[${right}px]`);
      }
      if (bottom !== undefined) {
        const mappedBottom = this.spacingMappings[bottom.toString()];
        classes.push(mappedBottom ? `${prefix}b-${mappedBottom}` : `${prefix}b-[${bottom}px]`);
      }
      if (left !== undefined) {
        const mappedLeft = this.spacingMappings[left.toString()];
        classes.push(mappedLeft ? `${prefix}l-${mappedLeft}` : `${prefix}l-[${left}px]`);
      }
    }

    return classes;
  }

  /**
   * Convert typography styles to Tailwind classes
   */
  private convertTypographyToTailwind(typography: TypographyStyle): string[] {
    const classes: string[] = [];

    // Font size
    if (typography.fontSize) {
      const sizeMapping = this.getFontSizeMapping(typography.fontSize);
      classes.push(sizeMapping || `text-[${typography.fontSize}px]`);
    }

    // Font weight
    if (typography.fontWeight) {
      const weightMapping = this.getFontWeightMapping(typography.fontWeight);
      if (weightMapping) classes.push(weightMapping);
    }

    // Text align
    if (typography.textAlign) {
      classes.push(`text-${typography.textAlign}`);
    }

    // Text color
    if (typography.color) {
      const colorClass = this.convertColorToTailwind(typography.color, 'text');
      if (colorClass) classes.push(colorClass);
    }

    // Text decoration
    if (typography.textDecoration && typography.textDecoration !== 'none') {
      classes.push(`${typography.textDecoration}`);
    }

    // Line height
    if (typography.lineHeight) {
      const lineHeightClass = this.getLineHeightMapping(typography.lineHeight);
      if (lineHeightClass) classes.push(lineHeightClass);
    }

    // Letter spacing
    if (typography.letterSpacing) {
      classes.push(`tracking-[${typography.letterSpacing}px]`);
    }

    return classes;
  }

  /**
   * Convert shadows to Tailwind classes
   */
  private convertShadowsToTailwind(shadows: Shadow[]): string[] {
    const classes: string[] = [];

    shadows.forEach(shadow => {
      if (shadow.type === 'DROP_SHADOW') {
        // Map common shadow patterns to Tailwind shadow classes
        const shadowClass = this.getShadowMapping(shadow);
        if (shadowClass) {
          classes.push(shadowClass);
        } else {
          // Use arbitrary value for custom shadows
          const { offset, radius, color, spread = 0 } = shadow;
          classes.push(`shadow-[${offset.x}px_${offset.y}px_${radius}px_${spread}px_${color}]`);
        }
      }
    });

    return classes;
  }

  /**
   * Convert borders to Tailwind classes
   */
  private convertBordersToTailwind(borders: Border[]): string[] {
    const classes: string[] = [];

    borders.forEach(border => {
      // Border width
      const widthMapping = this.getBorderWidthMapping(border.width);
      if (widthMapping) classes.push(widthMapping);

      // Border color
      const colorClass = this.convertColorToTailwind(border.color, 'border');
      if (colorClass) classes.push(colorClass);

      // Border style
      if (border.style !== 'solid') {
        classes.push(`border-${border.style}`);
      }
    });

    return classes;
  }

  /**
   * Initialize Tailwind mappings
   */
  private initializeMappings(): TailwindMapping[] {
    return [
      {
        figmaProperty: 'backgroundColor',
        tailwindClass: 'bg-',
        valueMapping: this.colorMappings
      },
      {
        figmaProperty: 'padding',
        tailwindClass: 'p-',
        valueMapping: this.spacingMappings
      },
      {
        figmaProperty: 'margin',
        tailwindClass: 'm-',
        valueMapping: this.spacingMappings
      },
      {
        figmaProperty: 'borderRadius',
        tailwindClass: 'rounded-',
        valueMapping: this.spacingMappings
      }
    ];
  }

  /**
   * Initialize color mappings
   */
  private initializeColorMappings(): Record<string, string> {
    return {
      '#ffffff': 'white',
      '#000000': 'black',
      '#f8fafc': 'slate-50',
      '#f1f5f9': 'slate-100',
      '#e2e8f0': 'slate-200',
      '#cbd5e1': 'slate-300',
      '#94a3b8': 'slate-400',
      '#64748b': 'slate-500',
      '#475569': 'slate-600',
      '#334155': 'slate-700',
      '#1e293b': 'slate-800',
      '#0f172a': 'slate-900',
      '#ef4444': 'red-500',
      '#dc2626': 'red-600',
      '#b91c1c': 'red-700',
      '#3b82f6': 'blue-500',
      '#2563eb': 'blue-600',
      '#1d4ed8': 'blue-700',
      '#10b981': 'emerald-500',
      '#059669': 'emerald-600',
      '#047857': 'emerald-700',
      '#f59e0b': 'amber-500',
      '#d97706': 'amber-600',
      '#b45309': 'amber-700'
    };
  }

  /**
   * Initialize spacing mappings
   */
  private initializeSpacingMappings(): Record<string, string> {
    return {
      '0': '0',
      '1': '0.5',
      '2': '0.5',
      '4': '1',
      '6': '1.5',
      '8': '2',
      '10': '2.5',
      '12': '3',
      '14': '3.5',
      '16': '4',
      '20': '5',
      '24': '6',
      '28': '7',
      '32': '8',
      '36': '9',
      '40': '10',
      '44': '11',
      '48': '12',
      '56': '14',
      '64': '16',
      '80': '20',
      '96': '24'
    };
  }

  /**
   * Find closest Tailwind color for a hex value
   */
  private findClosestTailwindColor(hex: string): string | null {
    // Simple implementation - in a real scenario, you'd use color distance algorithms
    const lowerHex = hex.toLowerCase();
    return this.colorMappings[lowerHex] || null;
  }

  /**
   * Get font size mapping
   */
  private getFontSizeMapping(fontSize: number): string | null {
    const sizeMap: Record<number, string> = {
      12: 'text-xs',
      14: 'text-sm',
      16: 'text-base',
      18: 'text-lg',
      20: 'text-xl',
      24: 'text-2xl',
      30: 'text-3xl',
      36: 'text-4xl',
      48: 'text-5xl',
      60: 'text-6xl',
      72: 'text-7xl',
      96: 'text-8xl',
      128: 'text-9xl'
    };
    return sizeMap[fontSize] || null;
  }

  /**
   * Get font weight mapping
   */
  private getFontWeightMapping(fontWeight: number | string): string | null {
    const weightMap: Record<string, string> = {
      '100': 'font-thin',
      '200': 'font-extralight',
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      '800': 'font-extrabold',
      '900': 'font-black',
      'thin': 'font-thin',
      'light': 'font-light',
      'normal': 'font-normal',
      'medium': 'font-medium',
      'semibold': 'font-semibold',
      'bold': 'font-bold',
      'extrabold': 'font-extrabold',
      'black': 'font-black'
    };
    return weightMap[fontWeight.toString()] || null;
  }

  /**
   * Get line height mapping
   */
  private getLineHeightMapping(lineHeight: number | string): string | null {
    if (typeof lineHeight === 'number') {
      const heightMap: Record<number, string> = {
        1: 'leading-none',
        1.25: 'leading-tight',
        1.375: 'leading-snug',
        1.5: 'leading-normal',
        1.625: 'leading-relaxed',
        2: 'leading-loose'
      };
      return heightMap[lineHeight] || `leading-[${lineHeight}]`;
    }
    return `leading-[${lineHeight}]`;
  }

  /**
   * Get shadow mapping for common shadow patterns
   */
  private getShadowMapping(shadow: Shadow): string | null {
    const { offset, radius } = shadow;
    
    // Common shadow patterns
    if (offset.x === 0 && offset.y === 1 && radius === 3) return 'shadow-sm';
    if (offset.x === 0 && offset.y === 1 && radius === 2) return 'shadow';
    if (offset.x === 0 && offset.y === 4 && radius === 6) return 'shadow-md';
    if (offset.x === 0 && offset.y === 10 && radius === 15) return 'shadow-lg';
    if (offset.x === 0 && offset.y === 20 && radius === 25) return 'shadow-xl';
    if (offset.x === 0 && offset.y === 25 && radius === 50) return 'shadow-2xl';
    
    return null;
  }

  /**
   * Get border width mapping
   */
  private getBorderWidthMapping(width: number): string | null {
    const widthMap: Record<number, string> = {
      0: 'border-0',
      1: 'border',
      2: 'border-2',
      4: 'border-4',
      8: 'border-8'
    };
    return widthMap[width] || `border-[${width}px]`;
  }
}