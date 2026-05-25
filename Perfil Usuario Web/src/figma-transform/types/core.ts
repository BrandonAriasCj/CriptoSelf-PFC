/**
 * Core TypeScript interfaces for Figma to React transformation system
 */

// Base Figma element structure
export interface FigmaElement {
  id: string;
  type: 'component' | 'frame' | 'text' | 'image' | 'button' | 'input' | 'group' | 'rectangle' | 'ellipse';
  name: string;
  properties: ElementProperties;
  children?: FigmaElement[];
  styles: StyleProperties;
  semanticRole?: string;
  responsive?: Record<string, StyleProperties>;
}

// Element properties from Figma
export interface ElementProperties {
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  visible: boolean;
  constraints: LayoutConstraints;
  opacity?: number;
  rotation?: number;
  locked?: boolean;
}

// Layout constraints for responsive behavior
export interface LayoutConstraints {
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
}

// Style properties extracted from Figma
export interface StyleProperties {
  backgroundColor?: string;
  borderRadius?: number | BorderRadius;
  padding?: Spacing;
  margin?: Spacing;
  typography?: TypographyStyle;
  shadows?: Shadow[];
  borders?: Border[];
  fills?: Fill[];
  effects?: Effect[];
  tailwindClasses?: string[];
}

// Spacing configuration
export interface Spacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  all?: number;
}

// Border radius configuration
export interface BorderRadius {
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
  all?: number;
}

// Typography style properties
export interface TypographyStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number | string;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color?: string;
}

// Shadow effect
export interface Shadow {
  type: 'DROP_SHADOW' | 'INNER_SHADOW';
  color: string;
  offset: { x: number; y: number };
  radius: number;
  spread?: number;
}

// Border configuration
export interface Border {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  position?: 'inside' | 'outside' | 'center';
}

// Fill configuration
export interface Fill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  color?: string;
  opacity?: number;
  gradientStops?: GradientStop[];
  imageUrl?: string;
}

// Gradient stop for gradient fills
export interface GradientStop {
  position: number;
  color: string;
}

// Effect configuration
export interface Effect {
  type: 'BLUR' | 'BACKGROUND_BLUR';
  radius: number;
}