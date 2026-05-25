/**
 * Semantic HTML structure generator for React components
 * Maps Figma frames to semantic HTML elements and creates proper heading hierarchy
 */

import { FigmaElement } from '../types/core';

// Semantic HTML element types
export type SemanticElement = 
  | 'header' 
  | 'nav' 
  | 'main' 
  | 'aside' 
  | 'footer' 
  | 'section' 
  | 'article' 
  | 'div'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'p' | 'span' | 'strong' | 'em'
  | 'ul' | 'ol' | 'li'
  | 'figure' | 'figcaption'
  | 'time' | 'address';

// Semantic mapping configuration
export interface SemanticMapping {
  figmaPattern: RegExp | string;
  semanticElement: SemanticElement;
  role?: string;
  priority: number; // Higher priority mappings are checked first
  requiresChildren?: boolean;
  parentConstraints?: SemanticElement[];
}

// Heading hierarchy context
export interface HeadingContext {
  currentLevel: number;
  maxLevel: number;
  usedLevels: Set<number>;
}

// Semantic structure result
export interface SemanticStructure {
  element: SemanticElement;
  role?: string;
  landmarks?: string[];
  headingLevel?: number;
  isLandmark: boolean;
  children?: SemanticStructure[];
}

// Predefined semantic mappings based on Figma element names and patterns
const SEMANTIC_MAPPINGS: SemanticMapping[] = [
  // Header patterns - exact matches first
  {
    figmaPattern: /^header(-section|-area|-container)?$/i,
    semanticElement: 'header',
    role: 'banner',
    priority: 10
  },
  
  // Navigation patterns - exact matches first
  {
    figmaPattern: /^(nav|navigation)(-menu|-bar|-container)?$/i,
    semanticElement: 'nav',
    role: 'navigation',
    priority: 10
  },
  
  // Main content patterns - exact matches first
  {
    figmaPattern: /^main(-content|-area|-container)?$/i,
    semanticElement: 'main',
    role: 'main',
    priority: 10
  },
  
  // Footer patterns - exact matches first
  {
    figmaPattern: /^footer(-section|-area|-container)?$/i,
    semanticElement: 'footer',
    role: 'contentinfo',
    priority: 10
  },
  
  // Aside/Sidebar patterns - exact matches first
  {
    figmaPattern: /^(aside|sidebar)(-content|-area|-container)?$/i,
    semanticElement: 'aside',
    role: 'complementary',
    priority: 9
  },
  
  // Heading patterns (will be processed separately) - exact matches
  {
    figmaPattern: /^(title|h[1-6])(-text|-content)?$/i,
    semanticElement: 'h1', // Will be adjusted based on hierarchy
    priority: 5
  },
  
  // List patterns - more specific patterns
  {
    figmaPattern: /^(list|menu-items|nav-items)(-container)?$/i,
    semanticElement: 'ul',
    priority: 6,
    requiresChildren: true
  },
  
  // List item patterns
  {
    figmaPattern: /^(item|list-item|menu-item)(-container)?$/i,
    semanticElement: 'li',
    priority: 6,
    parentConstraints: ['ul', 'ol']
  },
  
  // Article patterns
  {
    figmaPattern: /^(article|post|entry|story)(-container)?$/i,
    semanticElement: 'article',
    priority: 8,
    requiresChildren: true
  },
  
  // Section patterns
  {
    figmaPattern: /^section(-content|-area|-container)?$/i,
    semanticElement: 'section',
    priority: 7,
    requiresChildren: true
  },
  
  // Figure patterns
  {
    figmaPattern: /^(figure|image-container|media)(-container)?$/i,
    semanticElement: 'figure',
    priority: 5
  },
  
  // Time patterns
  {
    figmaPattern: /^(date|time|timestamp)(-container)?$/i,
    semanticElement: 'time',
    priority: 5
  },
  
  // Address patterns
  {
    figmaPattern: /^(address|contact|location)(-container)?$/i,
    semanticElement: 'address',
    priority: 5
  }
];

// Text style to heading level mapping
const TEXT_STYLE_TO_HEADING: Record<string, number> = {
  'display': 1,
  'title': 1,
  'headline': 2,
  'subheading': 3,
  'subtitle': 4,
  'caption': 5,
  'overline': 6
};

export class SemanticHtmlGenerator {
  private headingContext: HeadingContext = {
    currentLevel: 1,
    maxLevel: 6,
    usedLevels: new Set()
  };

  /**
   * Generate semantic HTML structure for a Figma element
   */
  generateSemanticStructure(element: FigmaElement, parentElement?: SemanticElement): SemanticStructure {
    const semanticElement = this.determineSemanticElement(element, parentElement);
    const isLandmark = this.isLandmarkElement(semanticElement);
    
    const structure: SemanticStructure = {
      element: semanticElement,
      isLandmark,
      children: []
    };

    // Add role if it's a landmark
    if (isLandmark) {
      structure.role = this.getLandmarkRole(semanticElement);
      structure.landmarks = this.generateLandmarks(semanticElement);
    }

    // Handle heading levels
    if (this.isHeadingElement(semanticElement)) {
      structure.headingLevel = this.determineHeadingLevel(element);
    }

    // Process children
    if (element.children && element.children.length > 0) {
      structure.children = element.children.map(child => 
        this.generateSemanticStructure(child, semanticElement)
      );
    }

    return structure;
  }

  /**
   * Generate semantic HTML element name
   */
  generateSemanticElement(element: FigmaElement, parentElement?: SemanticElement): SemanticElement {
    return this.determineSemanticElement(element, parentElement);
  }

  /**
   * Generate heading hierarchy based on text styles and structure
   */
  generateHeadingHierarchy(elements: FigmaElement[]): Map<string, number> {
    const headingMap = new Map<string, number>();
    this.resetHeadingContext();

    // First pass: identify all potential headings
    const potentialHeadings = this.identifyHeadings(elements);
    
    // Second pass: assign heading levels based on hierarchy and styles
    potentialHeadings.forEach((element, index) => {
      const level = this.calculateHeadingLevel(element, index, potentialHeadings);
      headingMap.set(element.id, level);
    });

    return headingMap;
  }

  /**
   * Generate landmark regions for screen reader navigation
   */
  generateLandmarkRegions(element: FigmaElement): string[] {
    const landmarks: string[] = [];
    const semanticElement = this.determineSemanticElement(element);

    if (this.isLandmarkElement(semanticElement)) {
      landmarks.push(this.getLandmarkRole(semanticElement));
    }

    // Recursively collect landmarks from children
    if (element.children) {
      element.children.forEach(child => {
        landmarks.push(...this.generateLandmarkRegions(child));
      });
    }

    return [...new Set(landmarks)]; // Remove duplicates
  }

  /**
   * Determine the appropriate semantic element for a Figma element
   */
  private determineSemanticElement(element: FigmaElement, parentElement?: SemanticElement): SemanticElement {
    const elementName = element.name || element.properties.name || '';
    
    // Sort mappings by priority (highest first)
    const sortedMappings = [...SEMANTIC_MAPPINGS].sort((a, b) => b.priority - a.priority);
    
    for (const mapping of sortedMappings) {
      if (this.matchesPattern(elementName, mapping.figmaPattern)) {
        // Check parent constraints
        if (mapping.parentConstraints && parentElement) {
          if (!mapping.parentConstraints.includes(parentElement)) {
            continue;
          }
        }
        
        // Check if requires children
        if (mapping.requiresChildren && (!element.children || element.children.length === 0)) {
          continue;
        }
        
        // Handle heading elements specially
        if (mapping.semanticElement.startsWith('h')) {
          return this.getHeadingElement(element);
        }
        
        return mapping.semanticElement;
      }
    }

    // Fallback based on element type
    return this.getFallbackSemanticElement(element, parentElement);
  }

  /**
   * Check if pattern matches element name
   */
  private matchesPattern(elementName: string, pattern: RegExp | string): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(elementName);
    }
    return elementName.toLowerCase().includes(pattern.toLowerCase());
  }

  /**
   * Get fallback semantic element based on Figma element type
   */
  private getFallbackSemanticElement(element: FigmaElement, parentElement?: SemanticElement): SemanticElement {
    switch (element.type) {
      case 'text':
        return this.getTextSemanticElement(element);
      case 'button':
        return 'div'; // Button elements will be handled by component mapping
      case 'input':
        return 'div'; // Input elements will be handled by component mapping
      case 'image':
        return 'div'; // Image elements will be handled by component mapping
      case 'frame':
      case 'component':
        // Check if it's a container that should be a section
        if (element.children && element.children.length > 1) {
          return 'section';
        }
        return 'div';
      default:
        return 'div';
    }
  }

  /**
   * Get semantic element for text elements
   */
  private getTextSemanticElement(element: FigmaElement): SemanticElement {
    const elementName = element.name || element.properties.name || '';
    
    // Check for heading patterns - be more specific
    if (/^(title|h[1-6])(-text|-content)?$/i.test(elementName)) {
      return this.getHeadingElement(element);
    }
    
    // Check for emphasis patterns
    if (/^(strong|bold|important)/i.test(elementName)) {
      return 'strong';
    }
    
    if (/^(em|italic|emphasis)/i.test(elementName)) {
      return 'em';
    }
    
    // Check text style for heading determination
    if (element.styles.typography) {
      const fontSize = element.styles.typography.fontSize || 16;
      const fontWeight = element.styles.typography.fontWeight || 400;
      
      // Large text with heavy weight suggests heading
      if (fontSize > 24 && fontWeight >= 600) {
        return this.getHeadingElement(element);
      }
    }
    
    return 'p';
  }

  /**
   * Get appropriate heading element based on context
   */
  private getHeadingElement(element: FigmaElement): SemanticElement {
    const level = this.determineHeadingLevel(element);
    return `h${level}` as SemanticElement;
  }

  /**
   * Determine heading level based on element properties and context
   */
  private determineHeadingLevel(element: FigmaElement): number {
    const elementName = element.name || element.properties.name || '';
    
    // Check for explicit heading level in name
    const explicitLevel = elementName.match(/h([1-6])/i);
    if (explicitLevel) {
      const level = parseInt(explicitLevel[1]);
      this.headingContext.usedLevels.add(level);
      this.headingContext.currentLevel = level;
      return level;
    }
    
    // Check text style mapping
    const textStyle = this.getTextStyleFromName(elementName);
    if (textStyle && TEXT_STYLE_TO_HEADING[textStyle]) {
      const level = TEXT_STYLE_TO_HEADING[textStyle];
      this.headingContext.usedLevels.add(level);
      this.headingContext.currentLevel = level;
      return level;
    }
    
    // Determine based on typography properties
    if (element.styles.typography) {
      const level = this.calculateHeadingLevelFromTypography(element.styles.typography);
      this.headingContext.usedLevels.add(level);
      this.headingContext.currentLevel = level;
      return level;
    }
    
    // Use next available level
    const nextLevel = this.getNextAvailableHeadingLevel();
    this.headingContext.usedLevels.add(nextLevel);
    this.headingContext.currentLevel = nextLevel;
    return nextLevel;
  }

  /**
   * Extract text style from element name
   */
  private getTextStyleFromName(elementName: string): string | null {
    const lowerName = elementName.toLowerCase();
    
    for (const style of Object.keys(TEXT_STYLE_TO_HEADING)) {
      if (lowerName.includes(style)) {
        return style;
      }
    }
    
    return null;
  }

  /**
   * Calculate heading level from typography properties
   */
  private calculateHeadingLevelFromTypography(typography: any): number {
    const fontSize = typography.fontSize || 16;
    const fontWeight = typography.fontWeight || 400;
    
    // Map font size and weight to heading levels
    if (fontSize >= 32 && fontWeight >= 700) return 1;
    if (fontSize >= 28 && fontWeight >= 600) return 2;
    if (fontSize >= 24 && fontWeight >= 600) return 3;
    if (fontSize >= 20 && fontWeight >= 500) return 4;
    if (fontSize >= 18 && fontWeight >= 500) return 5;
    
    return 6;
  }

  /**
   * Get next available heading level
   */
  private getNextAvailableHeadingLevel(): number {
    for (let level = this.headingContext.currentLevel; level <= this.headingContext.maxLevel; level++) {
      if (!this.headingContext.usedLevels.has(level)) {
        this.headingContext.currentLevel = level;
        return level;
      }
    }
    
    // If all levels are used, return the maximum level
    return this.headingContext.maxLevel;
  }

  /**
   * Check if element is a landmark
   */
  private isLandmarkElement(element: SemanticElement): boolean {
    const landmarks = ['header', 'nav', 'main', 'aside', 'footer'];
    return landmarks.includes(element);
  }

  /**
   * Check if element is a heading
   */
  private isHeadingElement(element: SemanticElement): boolean {
    return /^h[1-6]$/.test(element);
  }

  /**
   * Get landmark role for element
   */
  private getLandmarkRole(element: SemanticElement): string {
    const roleMap: Record<string, string> = {
      'header': 'banner',
      'nav': 'navigation',
      'main': 'main',
      'aside': 'complementary',
      'footer': 'contentinfo'
    };
    
    return roleMap[element] || '';
  }

  /**
   * Generate landmarks array for element
   */
  private generateLandmarks(element: SemanticElement): string[] {
    const role = this.getLandmarkRole(element);
    return role ? [role] : [];
  }

  /**
   * Identify potential heading elements
   */
  private identifyHeadings(elements: FigmaElement[]): FigmaElement[] {
    const headings: FigmaElement[] = [];
    
    const traverse = (element: FigmaElement) => {
      const elementName = element.name || element.properties.name || '';
      
      // Check if element looks like a heading
      if (this.looksLikeHeading(element, elementName)) {
        headings.push(element);
      }
      
      // Recursively check children
      if (element.children) {
        element.children.forEach(traverse);
      }
    };
    
    elements.forEach(traverse);
    return headings;
  }

  /**
   * Check if element looks like a heading
   */
  private looksLikeHeading(element: FigmaElement, elementName: string): boolean {
    // Check name patterns - be more specific to avoid matching header-section
    if (/^(title|h[1-6])(-text|-content)?$/i.test(elementName)) {
      return true;
    }
    
    // Check text style patterns
    if (this.getTextStyleFromName(elementName)) {
      return true;
    }
    
    // Check typography properties
    if (element.styles.typography) {
      const fontSize = element.styles.typography.fontSize || 16;
      const fontWeight = element.styles.typography.fontWeight || 400;
      
      // Large, bold text suggests heading
      if (fontSize > 20 && fontWeight >= 600) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate heading level based on position and context
   */
  private calculateHeadingLevel(element: FigmaElement, index: number, allHeadings: FigmaElement[]): number {
    // If it's the first heading, it's likely h1
    if (index === 0) {
      this.headingContext.currentLevel = 1;
      return 1;
    }
    
    // Check typography to determine relative importance
    const currentTypography = element.styles.typography;
    const previousTypography = allHeadings[index - 1].styles.typography;
    
    if (currentTypography && previousTypography) {
      const currentSize = currentTypography.fontSize || 16;
      const previousSize = previousTypography.fontSize || 16;
      
      // If current is smaller, it's a lower level heading
      if (currentSize < previousSize) {
        this.headingContext.currentLevel = Math.min(6, this.headingContext.currentLevel + 1);
        return this.headingContext.currentLevel;
      }
      
      // If current is same or larger, it's same or higher level
      if (currentSize >= previousSize) {
        return this.headingContext.currentLevel;
      }
    }
    
    // Default to next level
    this.headingContext.currentLevel = Math.min(6, this.headingContext.currentLevel + 1);
    return this.headingContext.currentLevel;
  }

  /**
   * Reset heading context for new document
   */
  private resetHeadingContext(): void {
    this.headingContext = {
      currentLevel: 1,
      maxLevel: 6,
      usedLevels: new Set()
    };
  }
}