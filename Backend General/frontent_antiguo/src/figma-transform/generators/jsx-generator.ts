/**
 * JSX generation engine for creating semantic HTML structure from Figma elements
 */

import { FigmaElement, StyleProperties } from '../types/core';
import { TailwindClassGenerator } from './tailwind-class-generator';

export interface JSXGenerationOptions {
  useSemanticHTML: boolean;
  includeAccessibility: boolean;
  responsiveBreakpoints: string[];
  classNameUtility: string; // e.g., 'cn'
}

export interface JSXElement {
  tag: string;
  attributes: Record<string, string>;
  children: (JSXElement | string)[];
  selfClosing: boolean;
}

export class JSXGenerator {
  private tailwindGenerator: TailwindClassGenerator;
  private options: JSXGenerationOptions;
  private semanticMappings: Record<string, string>;

  constructor(options: Partial<JSXGenerationOptions> = {}) {
    this.tailwindGenerator = new TailwindClassGenerator();
    this.options = {
      useSemanticHTML: true,
      includeAccessibility: true,
      responsiveBreakpoints: ['sm', 'md', 'lg', 'xl'],
      classNameUtility: 'cn',
      ...options
    };
    this.semanticMappings = this.initializeSemanticMappings();
  }

  /**
   * Generate JSX string from Figma element
   */
  generateJSX(element: FigmaElement, depth: number = 0): string {
    const jsxElement = this.createJSXElement(element);
    return this.renderJSXElement(jsxElement, depth);
  }

  /**
   * Generate JSX for multiple elements (component body)
   */
  generateComponentJSX(elements: FigmaElement[]): string {
    if (elements.length === 0) return '<div />';
    
    if (elements.length === 1) {
      return this.generateJSX(elements[0]);
    }

    // Wrap multiple elements in a fragment or container
    const children = elements.map(element => this.generateJSX(element, 1)).join('\n');
    return `<>\n${children}\n</>`;
  }

  /**
   * Create JSX element structure from Figma element
   */
  private createJSXElement(element: FigmaElement): JSXElement {
    const tag = this.getSemanticTag(element);
    const attributes = this.generateAttributes(element);
    const children = this.generateChildren(element);
    const selfClosing = this.isSelfClosingTag(tag) && children.length === 0;

    return {
      tag,
      attributes,
      children,
      selfClosing
    };
  }

  /**
   * Get appropriate semantic HTML tag for element
   */
  private getSemanticTag(element: FigmaElement): string {
    if (!this.options.useSemanticHTML) {
      return this.getBasicTag(element);
    }

    // Check for semantic role first
    if (element.semanticRole && this.semanticMappings[element.semanticRole]) {
      return this.semanticMappings[element.semanticRole];
    }

    // Check element name for semantic hints
    const name = element.name.toLowerCase();
    for (const [keyword, tag] of Object.entries(this.semanticMappings)) {
      if (name.includes(keyword)) {
        return tag;
      }
    }

    // Fallback to element type mapping
    return this.getBasicTag(element);
  }

  /**
   * Get basic HTML tag based on element type
   */
  private getBasicTag(element: FigmaElement): string {
    const tagMap: Record<string, string> = {
      'button': 'button',
      'input': 'input',
      'text': 'p',
      'image': 'img',
      'frame': 'div',
      'component': 'div',
      'group': 'div',
      'rectangle': 'div',
      'ellipse': 'div'
    };

    return tagMap[element.type] || 'div';
  }

  /**
   * Generate HTML attributes for element
   */
  private generateAttributes(element: FigmaElement): Record<string, string> {
    const attributes: Record<string, string> = {};

    // Generate className with Tailwind classes
    const classes = this.generateClassNames(element);
    if (classes) {
      attributes.className = classes;
    }

    // Add accessibility attributes
    if (this.options.includeAccessibility) {
      const accessibilityAttrs = this.generateAccessibilityAttributes(element);
      Object.assign(attributes, accessibilityAttrs);
    }

    // Add element-specific attributes
    const specificAttrs = this.generateElementSpecificAttributes(element);
    Object.assign(attributes, specificAttrs);

    return attributes;
  }

  /**
   * Generate className string with cn() utility
   */
  private generateClassNames(element: FigmaElement): string {
    const baseClasses = this.tailwindGenerator.generateClasses(element.styles);
    
    // Add responsive classes if available
    let allClasses = baseClasses;
    if (element.responsive) {
      const responsiveClasses = this.tailwindGenerator.generateResponsiveClasses(
        element.styles,
        element.responsive
      );
      allClasses = responsiveClasses;
    }

    // Add layout classes based on element properties
    const layoutClasses = this.generateLayoutClasses(element);
    allClasses.push(...layoutClasses);

    if (allClasses.length === 0) return '';

    // Use cn() utility for className merging
    const classString = allClasses.map(cls => `"${cls}"`).join(', ');
    return `{${this.options.classNameUtility}(${classString}, className)}`;
  }

  /**
   * Generate layout classes (flexbox, grid, positioning)
   */
  private generateLayoutClasses(element: FigmaElement): string[] {
    const classes: string[] = [];

    // Determine if element should be flex container
    if (this.shouldUseFlex(element)) {
      classes.push('flex');
      
      // Flex direction based on layout
      const direction = this.getFlexDirection(element);
      if (direction !== 'row') {
        classes.push(`flex-${direction}`);
      }

      // Flex alignment
      const alignment = this.getFlexAlignment(element);
      classes.push(...alignment);
    }

    // Grid layout for complex layouts
    if (this.shouldUseGrid(element)) {
      classes.push('grid');
      const gridClasses = this.getGridClasses(element);
      classes.push(...gridClasses);
    }

    // Positioning
    const positionClasses = this.getPositionClasses(element);
    classes.push(...positionClasses);

    return classes;
  }

  /**
   * Determine if element should use flexbox
   */
  private shouldUseFlex(element: FigmaElement): boolean {
    if (!element.children || element.children.length === 0) return false;
    
    // Check if children are arranged in a line (horizontal or vertical)
    const children = element.children;
    if (children.length < 2) return false;

    // Simple heuristic: if children are roughly aligned, use flex
    const firstChild = children[0];
    const isHorizontalLayout = children.every(child => 
      Math.abs(child.properties.y - firstChild.properties.y) < 10
    );
    const isVerticalLayout = children.every(child =>
      Math.abs(child.properties.x - firstChild.properties.x) < 10
    );

    return isHorizontalLayout || isVerticalLayout;
  }

  /**
   * Get flex direction based on children layout
   */
  private getFlexDirection(element: FigmaElement): string {
    if (!element.children || element.children.length < 2) return 'row';

    const children = element.children;
    const firstChild = children[0];
    const secondChild = children[1];

    // If second child is below first child, use column
    if (secondChild.properties.y > firstChild.properties.y + firstChild.properties.height / 2) {
      return 'col';
    }

    return 'row';
  }

  /**
   * Get flex alignment classes
   */
  private getFlexAlignment(element: FigmaElement): string[] {
    const classes: string[] = [];

    // Default to center alignment for better visual results
    classes.push('items-center');
    
    // Justify content based on layout
    if (element.children && element.children.length > 1) {
      // Simple heuristic for justify-content
      classes.push('justify-between');
    }

    return classes;
  }

  /**
   * Determine if element should use CSS Grid
   */
  private shouldUseGrid(element: FigmaElement): boolean {
    if (!element.children || element.children.length < 4) return false;
    
    // Check for grid-like arrangement (multiple rows and columns)
    const children = element.children;
    const uniqueYPositions = new Set(children.map(child => Math.round(child.properties.y / 10) * 10));
    const uniqueXPositions = new Set(children.map(child => Math.round(child.properties.x / 10) * 10));
    
    return uniqueYPositions.size > 1 && uniqueXPositions.size > 1;
  }

  /**
   * Get CSS Grid classes
   */
  private getGridClasses(element: FigmaElement): string[] {
    const classes: string[] = [];
    
    if (!element.children) return classes;

    // Estimate grid columns based on layout
    const children = element.children;
    const uniqueXPositions = new Set(children.map(child => Math.round(child.properties.x / 10) * 10));
    const cols = uniqueXPositions.size;
    
    if (cols <= 12) {
      classes.push(`grid-cols-${cols}`);
    } else {
      classes.push('grid-cols-auto');
    }

    classes.push('gap-4'); // Default gap

    return classes;
  }

  /**
   * Get positioning classes
   */
  private getPositionClasses(element: FigmaElement): string[] {
    const classes: string[] = [];

    // Add width and height classes if specified
    if (element.properties.width) {
      const widthClass = this.getDimensionClass(element.properties.width, 'w');
      if (widthClass) classes.push(widthClass);
    }

    if (element.properties.height) {
      const heightClass = this.getDimensionClass(element.properties.height, 'h');
      if (heightClass) classes.push(heightClass);
    }

    return classes;
  }

  /**
   * Get dimension class (width/height)
   */
  private getDimensionClass(value: number, prefix: string): string | null {
    // Common dimension mappings
    const dimensionMap: Record<number, string> = {
      16: '4',
      20: '5',
      24: '6',
      32: '8',
      40: '10',
      48: '12',
      64: '16',
      80: '20',
      96: '24',
      128: '32',
      160: '40',
      192: '48',
      256: '64',
      320: '80',
      384: '96'
    };

    const mapped = dimensionMap[value];
    if (mapped) {
      return `${prefix}-${mapped}`;
    }

    // Use arbitrary value for custom dimensions
    return `${prefix}-[${value}px]`;
  }

  /**
   * Generate accessibility attributes
   */
  private generateAccessibilityAttributes(element: FigmaElement): Record<string, string> {
    const attributes: Record<string, string> = {};

    // Add role based on semantic tag
    const role = this.getAriaRole(element);
    if (role) {
      attributes.role = role;
    }

    // Add aria-label for interactive elements
    if (this.isInteractiveElement(element)) {
      const label = this.generateAriaLabel(element);
      if (label) {
        attributes['aria-label'] = label;
      }

      // Add tabIndex for keyboard navigation
      attributes.tabIndex = '0';
    }

    return attributes;
  }

  /**
   * Get ARIA role for element
   */
  private getAriaRole(element: FigmaElement): string | null {
    const roleMap: Record<string, string> = {
      'button': 'button',
      'input': 'textbox',
      'nav': 'navigation',
      'header': 'banner',
      'footer': 'contentinfo',
      'main': 'main',
      'aside': 'complementary'
    };

    const tag = this.getSemanticTag(element);
    return roleMap[tag] || null;
  }

  /**
   * Check if element is interactive
   */
  private isInteractiveElement(element: FigmaElement): boolean {
    const interactiveTypes = ['button', 'input'];
    const interactiveTags = ['button', 'input', 'a'];
    
    return interactiveTypes.includes(element.type) || 
           interactiveTags.includes(this.getSemanticTag(element));
  }

  /**
   * Generate aria-label from element name
   */
  private generateAriaLabel(element: FigmaElement): string | null {
    if (!element.name) return null;
    
    // Clean up element name for aria-label
    return element.name
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .trim();
  }

  /**
   * Generate element-specific attributes
   */
  private generateElementSpecificAttributes(element: FigmaElement): Record<string, string> {
    const attributes: Record<string, string> = {};

    switch (element.type) {
      case 'button':
        attributes.type = 'button';
        break;
      case 'input':
        attributes.type = 'text';
        if (element.name.toLowerCase().includes('email')) {
          attributes.type = 'email';
        } else if (element.name.toLowerCase().includes('password')) {
          attributes.type = 'password';
        }
        break;
      case 'image':
        attributes.alt = element.name || 'Image';
        break;
    }

    return attributes;
  }

  /**
   * Generate children JSX elements
   */
  private generateChildren(element: FigmaElement): (JSXElement | string)[] {
    if (!element.children || element.children.length === 0) {
      // For text elements, return the text content
      if (element.type === 'text' && element.name) {
        return [element.name];
      }
      return [];
    }

    return element.children.map(child => this.createJSXElement(child));
  }

  /**
   * Check if tag is self-closing
   */
  private isSelfClosingTag(tag: string): boolean {
    const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    return selfClosingTags.includes(tag);
  }

  /**
   * Render JSX element to string
   */
  private renderJSXElement(element: JSXElement, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    const attributes = this.renderAttributes(element.attributes);
    
    if (element.selfClosing) {
      return `${indent}<${element.tag}${attributes} />`;
    }

    const openTag = `${indent}<${element.tag}${attributes}>`;
    
    if (element.children.length === 0) {
      return `${openTag}</${element.tag}>`;
    }

    const children = element.children.map(child => {
      if (typeof child === 'string') {
        return element.children.length === 1 ? child : `${indent}  ${child}`;
      }
      return this.renderJSXElement(child, depth + 1);
    }).join('\n');

    const closeTag = `${indent}</${element.tag}>`;
    
    if (element.children.length === 1 && typeof element.children[0] === 'string') {
      return `${openTag}${children}${closeTag}`;
    }

    return `${openTag}\n${children}\n${closeTag}`;
  }

  /**
   * Render attributes to string
   */
  private renderAttributes(attributes: Record<string, string>): string {
    const attrs = Object.entries(attributes)
      .map(([key, value]) => {
        if (key === 'className' && value.startsWith('{')) {
          return ` ${key}=${value}`;
        }
        return ` ${key}="${value}"`;
      })
      .join('');
    
    return attrs;
  }

  /**
   * Initialize semantic HTML mappings
   */
  private initializeSemanticMappings(): Record<string, string> {
    return {
      'navigation': 'nav',
      'nav': 'nav',
      'header': 'header',
      'footer': 'footer',
      'main': 'main',
      'content': 'main',
      'sidebar': 'aside',
      'aside': 'aside',
      'article': 'article',
      'section': 'section',
      'hero': 'section',
      'banner': 'section',
      'card': 'article',
      'list': 'ul',
      'item': 'li',
      'heading': 'h2',
      'title': 'h1',
      'subtitle': 'h3'
    };
  }
}