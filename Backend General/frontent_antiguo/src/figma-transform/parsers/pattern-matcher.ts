/**
 * Pattern Matcher for Existing UI Components
 * Maps Figma elements to existing UI components in the project
 */

import { FigmaElement, StyleProperties } from '../types/core';
import { ParsedElement, ComponentType } from './visual-element-parser';
import { ComponentNode } from './hierarchy-analyzer';

export interface UIComponentMatch {
  figmaElement: FigmaElement;
  matchedComponent: UIComponentDefinition;
  confidence: number;
  propMappings: PropMapping[];
  styleOverrides: StyleOverride[];
}

export interface UIComponentDefinition {
  name: string;
  type: ComponentType;
  variants?: ComponentVariant[];
  props: ComponentProp[];
  defaultProps?: Record<string, any>;
  importPath: string;
  examples?: ComponentExample[];
}

export interface ComponentVariant {
  name: string;
  props: Record<string, any>;
  description?: string;
  styleCharacteristics: StyleCharacteristics;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface PropMapping {
  figmaProperty: string;
  componentProp: string;
  transform?: (value: any) => any;
  confidence: number;
}

export interface StyleOverride {
  property: string;
  value: string;
  reason: string;
}

export interface StyleCharacteristics {
  backgroundColor?: string[];
  borderRadius?: number[];
  padding?: number[];
  fontSize?: number[];
  fontWeight?: string[];
  shadows?: boolean;
  borders?: boolean;
}

export interface ComponentExample {
  variant?: string;
  props: Record<string, any>;
  description: string;
}

export interface MatchingCriteria {
  elementType: ComponentType;
  styleThresholds: StyleThresholds;
  dimensionRanges: DimensionRanges;
  requiredFeatures: string[];
  optionalFeatures: string[];
}

export interface StyleThresholds {
  backgroundColorMatch: number;
  borderRadiusMatch: number;
  paddingMatch: number;
  fontSizeMatch: number;
}

export interface DimensionRanges {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatioRange?: [number, number];
}

export class PatternMatcher {
  private uiComponents: Map<string, UIComponentDefinition> = new Map();
  private matchingCriteria: Map<ComponentType, MatchingCriteria> = new Map();

  constructor() {
    this.initializeUIComponents();
    this.initializeMatchingCriteria();
  }

  /**
   * Find the best matching UI component for a Figma element
   */
  findBestMatch(parsedElement: ParsedElement): UIComponentMatch | null {
    const candidates = this.getCandidateComponents(parsedElement.componentType);
    
    if (candidates.length === 0) {
      return null;
    }

    const matches = candidates.map(component => 
      this.evaluateMatch(parsedElement, component)
    );

    // Sort by confidence and return the best match
    matches.sort((a, b) => b.confidence - a.confidence);
    
    const bestMatch = matches[0];
    return bestMatch.confidence > 0.6 ? bestMatch : null;
  }

  /**
   * Find matches for multiple elements
   */
  findMatches(parsedElements: ParsedElement[]): UIComponentMatch[] {
    return parsedElements
      .map(element => this.findBestMatch(element))
      .filter((match): match is UIComponentMatch => match !== null);
  }

  /**
   * Get candidate components for a given type
   */
  private getCandidateComponents(type: ComponentType): UIComponentDefinition[] {
    return Array.from(this.uiComponents.values())
      .filter(component => component.type === type || this.isCompatibleType(component.type, type));
  }

  /**
   * Check if component types are compatible
   */
  private isCompatibleType(componentType: ComponentType, figmaType: ComponentType): boolean {
    const compatibilityMap: Record<ComponentType, ComponentType[]> = {
      button: ['button'],
      input: ['input'],
      text: ['text'],
      card: ['card', 'container'],
      container: ['card', 'container', 'layout'],
      image: ['image'],
      icon: ['icon'],
      layout: ['layout', 'container'],
      unknown: []
    };

    return compatibilityMap[componentType]?.includes(figmaType) || false;
  }

  /**
   * Evaluate how well a Figma element matches a UI component
   */
  private evaluateMatch(parsedElement: ParsedElement, component: UIComponentDefinition): UIComponentMatch {
    const { element } = parsedElement;
    
    // Calculate style similarity
    const styleSimilarity = this.calculateStyleSimilarity(element.styles, component);
    
    // Calculate dimension compatibility
    const dimensionCompatibility = this.calculateDimensionCompatibility(element, component);
    
    // Calculate feature compatibility
    const featureCompatibility = this.calculateFeatureCompatibility(parsedElement, component);
    
    // Find best variant match
    const variantMatch = this.findBestVariantMatch(element.styles, component);
    
    // Calculate overall confidence
    const confidence = (styleSimilarity * 0.4 + dimensionCompatibility * 0.3 + featureCompatibility * 0.3);
    
    // Generate prop mappings
    const propMappings = this.generatePropMappings(element, component, variantMatch);
    
    // Generate style overrides
    const styleOverrides = this.generateStyleOverrides(element.styles, component, variantMatch);

    return {
      figmaElement: element,
      matchedComponent: component,
      confidence,
      propMappings,
      styleOverrides
    };
  }

  /**
   * Calculate style similarity between Figma element and UI component
   */
  private calculateStyleSimilarity(figmaStyles: StyleProperties, component: UIComponentDefinition): number {
    if (!component.variants || component.variants.length === 0) {
      return 0.5; // Default similarity for components without variants
    }

    const similarities = component.variants.map(variant => 
      this.calculateVariantStyleSimilarity(figmaStyles, variant.styleCharacteristics)
    );

    return Math.max(...similarities);
  }

  /**
   * Calculate style similarity with a specific variant
   */
  private calculateVariantStyleSimilarity(figmaStyles: StyleProperties, characteristics: StyleCharacteristics): number {
    let score = 0;
    let factors = 0;

    // Background color similarity
    if (figmaStyles.backgroundColor && characteristics.backgroundColor) {
      const colorMatch = characteristics.backgroundColor.includes(figmaStyles.backgroundColor);
      score += colorMatch ? 1 : 0;
      factors++;
    }

    // Border radius similarity
    if (typeof figmaStyles.borderRadius === 'number' && characteristics.borderRadius) {
      const borderRadius = figmaStyles.borderRadius as number;
      const radiusMatch = characteristics.borderRadius.some(radius => 
        Math.abs(radius - borderRadius) < 4
      );
      score += radiusMatch ? 1 : 0;
      factors++;
    }

    // Padding similarity
    if (figmaStyles.padding && characteristics.padding) {
      const paddingValue = figmaStyles.padding.all || figmaStyles.padding.top || 0;
      const paddingMatch = characteristics.padding.some(padding => 
        Math.abs(padding - paddingValue) < 8
      );
      score += paddingMatch ? 1 : 0;
      factors++;
    }

    // Shadow presence
    if (characteristics.shadows !== undefined) {
      const hasShadows = Boolean(figmaStyles.shadows && figmaStyles.shadows.length > 0);
      score += (hasShadows === characteristics.shadows) ? 1 : 0;
      factors++;
    }

    // Border presence
    if (characteristics.borders !== undefined) {
      const hasBorders = Boolean(figmaStyles.borders && figmaStyles.borders.length > 0);
      score += (hasBorders === characteristics.borders) ? 1 : 0;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate dimension compatibility
   */
  private calculateDimensionCompatibility(element: FigmaElement, component: UIComponentDefinition): number {
    const criteria = this.matchingCriteria.get(component.type);
    if (!criteria?.dimensionRanges) {
      return 0.7; // Default compatibility
    }

    const { width, height } = element.properties;
    const { dimensionRanges } = criteria;
    let score = 0;
    let factors = 0;

    // Width check
    if (dimensionRanges.minWidth !== undefined || dimensionRanges.maxWidth !== undefined) {
      const minWidth = dimensionRanges.minWidth || 0;
      const maxWidth = dimensionRanges.maxWidth || Infinity;
      score += (width >= minWidth && width <= maxWidth) ? 1 : 0;
      factors++;
    }

    // Height check
    if (dimensionRanges.minHeight !== undefined || dimensionRanges.maxHeight !== undefined) {
      const minHeight = dimensionRanges.minHeight || 0;
      const maxHeight = dimensionRanges.maxHeight || Infinity;
      score += (height >= minHeight && height <= maxHeight) ? 1 : 0;
      factors++;
    }

    // Aspect ratio check
    if (dimensionRanges.aspectRatioRange) {
      const aspectRatio = width / height;
      const [minRatio, maxRatio] = dimensionRanges.aspectRatioRange;
      score += (aspectRatio >= minRatio && aspectRatio <= maxRatio) ? 1 : 0;
      factors++;
    }

    return factors > 0 ? score / factors : 0.7;
  }

  /**
   * Calculate feature compatibility
   */
  private calculateFeatureCompatibility(parsedElement: ParsedElement, component: UIComponentDefinition): number {
    const criteria = this.matchingCriteria.get(component.type);
    if (!criteria) {
      return 0.7; // Default compatibility
    }

    const elementFeatures = this.extractElementFeatures(parsedElement);
    
    // Check required features
    const requiredScore = criteria.requiredFeatures.every(feature => 
      elementFeatures.includes(feature)
    ) ? 1 : 0;

    // Check optional features
    const optionalMatches = criteria.optionalFeatures.filter(feature => 
      elementFeatures.includes(feature)
    ).length;
    const optionalScore = criteria.optionalFeatures.length > 0 
      ? optionalMatches / criteria.optionalFeatures.length 
      : 1;

    return (requiredScore * 0.7) + (optionalScore * 0.3);
  }

  /**
   * Extract features from a parsed element
   */
  private extractElementFeatures(parsedElement: ParsedElement): string[] {
    const features: string[] = [];
    const { extractedProperties, styleAnalysis } = parsedElement;

    if (extractedProperties.interactive) features.push('interactive');
    if (extractedProperties.hasText) features.push('hasText');
    if (extractedProperties.hasChildren) features.push('hasChildren');
    if (styleAnalysis.hasBackground) features.push('hasBackground');
    if (styleAnalysis.hasRoundedCorners) features.push('hasRoundedCorners');
    if (styleAnalysis.hasShadows) features.push('hasShadows');
    if (styleAnalysis.hasBorders) features.push('hasBorders');
    if (styleAnalysis.hasTypography) features.push('hasTypography');

    return features;
  }

  /**
   * Find the best variant match for given styles
   */
  private findBestVariantMatch(styles: StyleProperties, component: UIComponentDefinition): ComponentVariant | null {
    if (!component.variants || component.variants.length === 0) {
      return null;
    }

    const variantScores = component.variants.map(variant => ({
      variant,
      score: this.calculateVariantStyleSimilarity(styles, variant.styleCharacteristics)
    }));

    variantScores.sort((a, b) => b.score - a.score);
    return variantScores[0].score > 0.5 ? variantScores[0].variant : null;
  }

  /**
   * Generate prop mappings from Figma element to component props
   */
  private generatePropMappings(element: FigmaElement, component: UIComponentDefinition, variant: ComponentVariant | null): PropMapping[] {
    const mappings: PropMapping[] = [];

    // Map common properties
    component.props.forEach(prop => {
      const mapping = this.mapElementPropertyToProp(element, prop, variant);
      if (mapping) {
        mappings.push(mapping);
      }
    });

    return mappings;
  }

  /**
   * Map a Figma element property to a component prop
   */
  private mapElementPropertyToProp(element: FigmaElement, prop: ComponentProp, variant: ComponentVariant | null): PropMapping | null {
    const commonMappings: Record<string, (element: FigmaElement) => any> = {
      children: (el) => this.extractTextContent(el),
      className: () => undefined, // Will be handled by style overrides
      disabled: (el) => el.properties.opacity !== undefined && el.properties.opacity < 1,
      variant: () => variant?.name,
      size: (el) => this.inferSizeFromDimensions(el),
      placeholder: (el) => this.extractPlaceholderText(el)
    };

    const mapper = commonMappings[prop.name];
    if (!mapper) {
      return null;
    }

    const value = mapper(element);
    if (value === undefined && !prop.required) {
      return null;
    }

    return {
      figmaProperty: this.findSourceProperty(element, prop.name),
      componentProp: prop.name,
      transform: mapper,
      confidence: 0.8
    };
  }

  /**
   * Find the source property in Figma element for a given prop
   */
  private findSourceProperty(element: FigmaElement, propName: string): string {
    const propertyMappings: Record<string, string> = {
      children: 'text_content',
      disabled: 'opacity',
      variant: 'style_analysis',
      size: 'dimensions',
      placeholder: 'name'
    };

    return propertyMappings[propName] || propName;
  }

  /**
   * Extract text content from element
   */
  private extractTextContent(element: FigmaElement): string | undefined {
    if (element.type === 'text') {
      return element.name; // Assuming name contains the text content
    }

    // Look for text in children
    if (element.children) {
      for (const child of element.children) {
        if (child.type === 'text') {
          return child.name;
        }
      }
    }

    return undefined;
  }

  /**
   * Infer size from element dimensions
   */
  private inferSizeFromDimensions(element: FigmaElement): string {
    const { width, height } = element.properties;
    const area = width * height;

    if (area < 2000) return 'sm';
    if (area < 5000) return 'md';
    if (area < 10000) return 'lg';
    return 'xl';
  }

  /**
   * Extract placeholder text from element name
   */
  private extractPlaceholderText(element: FigmaElement): string | undefined {
    const name = element.name.toLowerCase();
    if (name.includes('placeholder') || name.includes('hint')) {
      return element.name;
    }
    return undefined;
  }

  /**
   * Generate style overrides for custom styling
   */
  private generateStyleOverrides(styles: StyleProperties, component: UIComponentDefinition, variant: ComponentVariant | null): StyleOverride[] {
    const overrides: StyleOverride[] = [];

    // Check if background color needs override
    if (styles.backgroundColor && !this.isStandardColor(styles.backgroundColor)) {
      overrides.push({
        property: 'backgroundColor',
        value: styles.backgroundColor,
        reason: 'Custom background color not available in component variants'
      });
    }

    // Check if border radius needs override
    if (typeof styles.borderRadius === 'number' && !this.isStandardRadius(styles.borderRadius)) {
      overrides.push({
        property: 'borderRadius',
        value: `${styles.borderRadius}px`,
        reason: 'Custom border radius not available in component variants'
      });
    }

    // Check if custom spacing is needed
    if (styles.padding && !this.isStandardSpacing(styles.padding)) {
      const paddingValue = styles.padding.all || `${styles.padding.top}px ${styles.padding.right}px ${styles.padding.bottom}px ${styles.padding.left}px`;
      overrides.push({
        property: 'padding',
        value: String(paddingValue),
        reason: 'Custom padding not available in component variants'
      });
    }

    return overrides;
  }

  /**
   * Check if color is a standard Tailwind color
   */
  private isStandardColor(color: string): boolean {
    const standardColors = [
      '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981',
      '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#374151'
    ];
    return standardColors.includes(color.toLowerCase());
  }

  /**
   * Check if border radius is a standard value
   */
  private isStandardRadius(radius: number): boolean {
    const standardRadii = [0, 4, 6, 8, 12, 16, 24];
    return standardRadii.includes(radius);
  }

  /**
   * Check if spacing follows standard increments
   */
  private isStandardSpacing(spacing: any): boolean {
    const standardSpacings = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48];
    const value = typeof spacing === 'number' ? spacing : spacing.all || spacing.top || 0;
    return standardSpacings.includes(value);
  }

  /**
   * Initialize UI component definitions
   */
  private initializeUIComponents(): void {
    // Button component
    this.uiComponents.set('Button', {
      name: 'Button',
      type: 'button',
      importPath: '@/components/ui/button',
      props: [
        { name: 'children', type: 'React.ReactNode', required: true },
        { name: 'variant', type: 'string', required: false, defaultValue: 'default' },
        { name: 'size', type: 'string', required: false, defaultValue: 'md' },
        { name: 'disabled', type: 'boolean', required: false, defaultValue: false },
        { name: 'className', type: 'string', required: false }
      ],
      variants: [
        {
          name: 'default',
          props: { variant: 'default' },
          styleCharacteristics: {
            backgroundColor: ['#3b82f6', '#2563eb'],
            borderRadius: [6, 8],
            padding: [12, 16],
            shadows: true,
            borders: false
          }
        },
        {
          name: 'outline',
          props: { variant: 'outline' },
          styleCharacteristics: {
            backgroundColor: ['transparent', '#ffffff'],
            borderRadius: [6, 8],
            padding: [12, 16],
            shadows: false,
            borders: true
          }
        }
      ]
    });

    // Input component
    this.uiComponents.set('Input', {
      name: 'Input',
      type: 'input',
      importPath: '@/components/ui/input',
      props: [
        { name: 'placeholder', type: 'string', required: false },
        { name: 'value', type: 'string', required: false },
        { name: 'disabled', type: 'boolean', required: false },
        { name: 'className', type: 'string', required: false }
      ],
      variants: [
        {
          name: 'default',
          props: {},
          styleCharacteristics: {
            backgroundColor: ['#ffffff'],
            borderRadius: [6, 8],
            padding: [12, 16],
            shadows: false,
            borders: true
          }
        }
      ]
    });

    // Card component
    this.uiComponents.set('Card', {
      name: 'Card',
      type: 'card',
      importPath: '@/components/ui/card',
      props: [
        { name: 'children', type: 'React.ReactNode', required: true },
        { name: 'className', type: 'string', required: false }
      ],
      variants: [
        {
          name: 'default',
          props: {},
          styleCharacteristics: {
            backgroundColor: ['#ffffff'],
            borderRadius: [8, 12],
            padding: [16, 24],
            shadows: true,
            borders: false
          }
        }
      ]
    });
  }

  /**
   * Initialize matching criteria for different component types
   */
  private initializeMatchingCriteria(): void {
    this.matchingCriteria.set('button', {
      elementType: 'button',
      styleThresholds: {
        backgroundColorMatch: 0.8,
        borderRadiusMatch: 0.7,
        paddingMatch: 0.6,
        fontSizeMatch: 0.7
      },
      dimensionRanges: {
        minWidth: 60,
        maxWidth: 300,
        minHeight: 32,
        maxHeight: 60,
        aspectRatioRange: [1.5, 8]
      },
      requiredFeatures: ['hasBackground'],
      optionalFeatures: ['hasText', 'hasRoundedCorners', 'hasShadows']
    });

    this.matchingCriteria.set('input', {
      elementType: 'input',
      styleThresholds: {
        backgroundColorMatch: 0.7,
        borderRadiusMatch: 0.6,
        paddingMatch: 0.8,
        fontSizeMatch: 0.8
      },
      dimensionRanges: {
        minWidth: 100,
        maxWidth: 500,
        minHeight: 32,
        maxHeight: 50,
        aspectRatioRange: [3, 15]
      },
      requiredFeatures: ['hasBorders'],
      optionalFeatures: ['hasBackground', 'hasRoundedCorners']
    });

    this.matchingCriteria.set('card', {
      elementType: 'card',
      styleThresholds: {
        backgroundColorMatch: 0.8,
        borderRadiusMatch: 0.7,
        paddingMatch: 0.8,
        fontSizeMatch: 0.5
      },
      dimensionRanges: {
        minWidth: 200,
        minHeight: 100,
        aspectRatioRange: [0.5, 3]
      },
      requiredFeatures: ['hasBackground', 'hasChildren'],
      optionalFeatures: ['hasShadows', 'hasRoundedCorners', 'hasBorders']
    });
  }
}

// Export singleton instance
export const patternMatcher = new PatternMatcher();