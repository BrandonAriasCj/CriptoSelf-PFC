/**
 * Visual Element Parser
 * Parses Figma elements to identify component types and extract properties
 */

import {
  FigmaElement,
  ElementProperties,
  StyleProperties,
  TypographyStyle,
  Shadow,
  Border,
  Fill,
  Effect,
  Spacing,
  BorderRadius,
  LayoutConstraints
} from '../types/core';

export interface ParsedElement {
  element: FigmaElement;
  componentType: ComponentType;
  extractedProperties: ExtractedProperties;
  styleAnalysis: StyleAnalysis;
}

export interface ExtractedProperties {
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  position: {
    x: number;
    y: number;
    zIndex?: number;
  };
  visibility: {
    visible: boolean;
    opacity: number;
  };
  constraints: LayoutConstraints;
  interactive: boolean;
  hasText: boolean;
  hasChildren: boolean;
}

export interface StyleAnalysis {
  hasBackground: boolean;
  hasRoundedCorners: boolean;
  hasShadows: boolean;
  hasBorders: boolean;
  hasTypography: boolean;
  isCard: boolean;
  isButton: boolean;
  isInput: boolean;
  layoutType: 'flex' | 'grid' | 'absolute' | 'static';
}

export type ComponentType = 
  | 'button'
  | 'input'
  | 'text'
  | 'card'
  | 'container'
  | 'image'
  | 'icon'
  | 'layout'
  | 'unknown';

export class VisualElementParser {
  /**
   * Parse a Figma element and extract component information
   */
  parseElement(element: FigmaElement): ParsedElement {
    const extractedProperties = this.extractProperties(element);
    const styleAnalysis = this.analyzeStyles(element);
    const componentType = this.identifyComponentType(element, extractedProperties, styleAnalysis);

    return {
      element,
      componentType,
      extractedProperties,
      styleAnalysis
    };
  }

  /**
   * Parse multiple Figma elements
   */
  parseElements(elements: FigmaElement[]): ParsedElement[] {
    return elements.map(element => this.parseElement(element));
  }

  /**
   * Extract element properties from Figma element
   */
  private extractProperties(element: FigmaElement): ExtractedProperties {
    const { properties } = element;
    
    return {
      dimensions: {
        width: properties.width,
        height: properties.height,
        aspectRatio: properties.width / properties.height
      },
      position: {
        x: properties.x,
        y: properties.y
      },
      visibility: {
        visible: properties.visible,
        opacity: properties.opacity ?? 1
      },
      constraints: properties.constraints,
      interactive: this.isInteractiveElement(element),
      hasText: this.hasTextContent(element),
      hasChildren: Boolean(element.children && element.children.length > 0)
    };
  }

  /**
   * Analyze style properties to determine component characteristics
   */
  private analyzeStyles(element: FigmaElement): StyleAnalysis {
    const { styles } = element;
    
    return {
      hasBackground: this.hasBackground(styles),
      hasRoundedCorners: this.hasRoundedCorners(styles),
      hasShadows: Boolean(styles.shadows && styles.shadows.length > 0),
      hasBorders: Boolean(styles.borders && styles.borders.length > 0),
      hasTypography: Boolean(styles.typography),
      isCard: this.looksLikeCard(styles),
      isButton: this.looksLikeButton(element, styles),
      isInput: this.looksLikeInput(element, styles),
      layoutType: this.determineLayoutType(element)
    };
  }

  /**
   * Identify the most appropriate component type for the element
   */
  private identifyComponentType(
    element: FigmaElement,
    properties: ExtractedProperties,
    styles: StyleAnalysis
  ): ComponentType {
    // Direct type mapping from Figma
    if (element.type === 'button' || styles.isButton) {
      return 'button';
    }
    
    if (element.type === 'input' || styles.isInput) {
      return 'input';
    }
    
    if (element.type === 'text' && !properties.hasChildren) {
      return 'text';
    }
    
    if (element.type === 'image') {
      return 'image';
    }
    
    // Inferred types based on characteristics
    if (styles.isCard) {
      return 'card';
    }
    
    if (this.isIconElement(element, properties)) {
      return 'icon';
    }
    
    if (properties.hasChildren && this.isLayoutContainer(element)) {
      return 'layout';
    }
    
    if (properties.hasChildren || element.type === 'frame' || element.type === 'group') {
      return 'container';
    }
    
    return 'unknown';
  }

  /**
   * Check if element is interactive (clickable, focusable)
   */
  private isInteractiveElement(element: FigmaElement): boolean {
    const interactiveTypes = ['button', 'input'];
    
    if (interactiveTypes.includes(element.type)) {
      return true;
    }
    
    // Check for interactive naming patterns
    const name = element.name.toLowerCase();
    const interactiveKeywords = ['button', 'btn', 'click', 'input', 'field', 'form'];
    
    return interactiveKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if element contains text content
   */
  private hasTextContent(element: FigmaElement): boolean {
    if (element.type === 'text') {
      return true;
    }
    
    // Check if any children are text elements
    if (element.children) {
      return element.children.some(child => 
        child.type === 'text' || this.hasTextContent(child)
      );
    }
    
    return false;
  }

  /**
   * Check if element has background styling
   */
  private hasBackground(styles: StyleProperties): boolean {
    return Boolean(
      styles.backgroundColor ||
      (styles.fills && styles.fills.length > 0)
    );
  }

  /**
   * Check if element has rounded corners
   */
  private hasRoundedCorners(styles: StyleProperties): boolean {
    if (typeof styles.borderRadius === 'number') {
      return styles.borderRadius > 0;
    }
    
    if (typeof styles.borderRadius === 'object' && styles.borderRadius) {
      const radius = styles.borderRadius as BorderRadius;
      return Boolean(
        radius.all ||
        radius.topLeft ||
        radius.topRight ||
        radius.bottomLeft ||
        radius.bottomRight
      );
    }
    
    return false;
  }

  /**
   * Determine if element looks like a card component
   */
  private looksLikeCard(styles: StyleProperties): boolean {
    const hasBackground = this.hasBackground(styles);
    const hasRoundedCorners = this.hasRoundedCorners(styles);
    const hasShadows = Boolean(styles.shadows && styles.shadows.length > 0);
    const hasPadding = Boolean(styles.padding);
    
    // Cards typically have background, padding, and either shadows or borders
    return hasBackground && hasPadding && (hasShadows || hasRoundedCorners);
  }

  /**
   * Determine if element looks like a button component
   */
  private looksLikeButton(element: FigmaElement, styles: StyleProperties): boolean {
    const hasBackground = this.hasBackground(styles);
    const hasRoundedCorners = this.hasRoundedCorners(styles);
    const hasText = this.hasTextContent(element);
    const isInteractive = this.isInteractiveElement(element);
    
    // Check dimensions - buttons are typically wider than they are tall
    const aspectRatio = element.properties.width / element.properties.height;
    const isButtonSized = aspectRatio > 1.5 && element.properties.height < 60;
    
    return (hasBackground || hasRoundedCorners) && hasText && (isInteractive || isButtonSized);
  }

  /**
   * Determine if element looks like an input component
   */
  private looksLikeInput(element: FigmaElement, styles: StyleProperties): boolean {
    const hasBorder = Boolean(styles.borders && styles.borders.length > 0);
    const hasBackground = this.hasBackground(styles);
    const isRectangular = element.properties.width > element.properties.height * 2;
    
    // Check for input-like naming
    const name = element.name.toLowerCase();
    const inputKeywords = ['input', 'field', 'textbox', 'search', 'email', 'password'];
    const hasInputName = inputKeywords.some(keyword => name.includes(keyword));
    
    return (hasBorder || hasBackground) && isRectangular && (hasInputName || element.type === 'input');
  }

  /**
   * Check if element is likely an icon
   */
  private isIconElement(element: FigmaElement, properties: ExtractedProperties): boolean {
    const isSmall = properties.dimensions.width <= 32 && properties.dimensions.height <= 32;
    const isSquareish = Math.abs(properties.dimensions.aspectRatio - 1) < 0.2;
    const hasIconName = element.name.toLowerCase().includes('icon');
    
    return isSmall && isSquareish && (hasIconName || element.type === 'ellipse');
  }

  /**
   * Check if element is a layout container
   */
  private isLayoutContainer(element: FigmaElement): boolean {
    const hasMultipleChildren = element.children && element.children.length > 1;
    const isFrame = element.type === 'frame' || element.type === 'group';
    
    // Check for layout-related naming
    const name = element.name.toLowerCase();
    const layoutKeywords = ['container', 'wrapper', 'layout', 'grid', 'flex', 'row', 'column'];
    const hasLayoutName = layoutKeywords.some(keyword => name.includes(keyword));
    
    return Boolean(hasMultipleChildren && isFrame && hasLayoutName);
  }

  /**
   * Determine the layout type of the element
   */
  private determineLayoutType(element: FigmaElement): 'flex' | 'grid' | 'absolute' | 'static' {
    if (!element.children || element.children.length === 0) {
      return 'static';
    }
    
    // Check naming for layout hints
    const name = element.name.toLowerCase();
    
    if (name.includes('grid')) {
      return 'grid';
    }
    
    if (name.includes('flex') || name.includes('row') || name.includes('column')) {
      return 'flex';
    }
    
    // Analyze children positioning to infer layout type
    const children = element.children;
    const positions = children.map(child => ({
      x: child.properties.x,
      y: child.properties.y
    }));
    
    // Check if children are arranged in a grid pattern
    if (this.isGridLayout(positions)) {
      return 'grid';
    }
    
    // Check if children are arranged in a row or column
    if (this.isFlexLayout(positions)) {
      return 'flex';
    }
    
    // If children have absolute positioning
    if (this.hasAbsolutePositioning(positions)) {
      return 'absolute';
    }
    
    return 'static';
  }

  /**
   * Check if positions suggest a grid layout
   */
  private isGridLayout(positions: Array<{ x: number; y: number }>): boolean {
    if (positions.length < 4) return false;
    
    // Group by rows and columns
    const rows = new Set(positions.map(p => Math.round(p.y / 10) * 10));
    const cols = new Set(positions.map(p => Math.round(p.x / 10) * 10));
    
    return rows.size > 1 && cols.size > 1 && rows.size * cols.size >= positions.length * 0.8;
  }

  /**
   * Check if positions suggest a flex layout
   */
  private isFlexLayout(positions: Array<{ x: number; y: number }>): boolean {
    if (positions.length < 2) return false;
    
    // Check for horizontal alignment (row)
    const yVariance = this.calculateVariance(positions.map(p => p.y));
    const xVariance = this.calculateVariance(positions.map(p => p.x));
    
    // If Y positions are similar, it's likely a row
    // If X positions are similar, it's likely a column
    return yVariance < 100 || xVariance < 100;
  }

  /**
   * Check if elements use absolute positioning
   */
  private hasAbsolutePositioning(positions: Array<{ x: number; y: number }>): boolean {
    // If positions don't follow grid or flex patterns, assume absolute
    return !this.isGridLayout(positions) && !this.isFlexLayout(positions);
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

// Export singleton instance
export const visualElementParser = new VisualElementParser();