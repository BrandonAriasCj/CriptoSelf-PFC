/**
 * Component Hierarchy Analyzer
 * Builds tree structures from nested Figma elements and identifies component boundaries
 */

import { FigmaElement } from '../types/core';
import { ParsedElement, ComponentType, visualElementParser } from './visual-element-parser';

export interface ComponentNode {
  id: string;
  element: FigmaElement;
  parsedElement: ParsedElement;
  parent?: ComponentNode;
  children: ComponentNode[];
  depth: number;
  componentBoundary: boolean;
  reusablePattern?: ReusablePattern;
}

export interface ComponentHierarchy {
  root: ComponentNode;
  allNodes: Map<string, ComponentNode>;
  componentBoundaries: ComponentNode[];
  reusablePatterns: ReusablePattern[];
}

export interface ReusablePattern {
  id: string;
  type: ComponentType;
  signature: PatternSignature;
  instances: ComponentNode[];
  confidence: number;
}

export interface PatternSignature {
  elementTypes: string[];
  structureHash: string;
  styleFingerprint: string;
  dimensionRatio: number;
}

export interface ComponentBoundaryAnalysis {
  isComponentBoundary: boolean;
  reason: ComponentBoundaryReason;
  suggestedName: string;
  confidence: number;
}

export type ComponentBoundaryReason = 
  | 'reusable_pattern'
  | 'semantic_grouping'
  | 'style_consistency'
  | 'functional_unit'
  | 'size_threshold'
  | 'naming_convention';

export class HierarchyAnalyzer {
  private readonly MIN_COMPONENT_CHILDREN = 2;
  private readonly MAX_COMPONENT_DEPTH = 6;
  private readonly REUSE_THRESHOLD = 2;

  /**
   * Analyze the hierarchy of Figma elements
   */
  analyzeHierarchy(rootElement: FigmaElement): ComponentHierarchy {
    // Build the component tree
    const root = this.buildComponentTree(rootElement);
    
    // Collect all nodes for easy access
    const allNodes = this.collectAllNodes(root);
    
    // Identify component boundaries
    const componentBoundaries = this.identifyComponentBoundaries(root);
    
    // Detect reusable patterns
    const reusablePatterns = this.detectReusablePatterns(Array.from(allNodes.values()));
    
    // Update nodes with reusable pattern information
    this.assignReusablePatterns(reusablePatterns, allNodes);

    return {
      root,
      allNodes,
      componentBoundaries,
      reusablePatterns
    };
  }

  /**
   * Build a tree structure from nested Figma elements
   */
  private buildComponentTree(element: FigmaElement, parent?: ComponentNode, depth = 0): ComponentNode {
    const parsedElement = visualElementParser.parseElement(element);
    
    const node: ComponentNode = {
      id: element.id,
      element,
      parsedElement,
      parent,
      children: [],
      depth,
      componentBoundary: false
    };

    // Recursively build children
    if (element.children) {
      node.children = element.children.map(child => 
        this.buildComponentTree(child, node, depth + 1)
      );
    }

    return node;
  }

  /**
   * Collect all nodes in the tree into a map
   */
  private collectAllNodes(root: ComponentNode): Map<string, ComponentNode> {
    const nodes = new Map<string, ComponentNode>();
    
    const traverse = (node: ComponentNode) => {
      nodes.set(node.id, node);
      node.children.forEach(traverse);
    };
    
    traverse(root);
    return nodes;
  }

  /**
   * Identify component boundaries in the hierarchy
   */
  private identifyComponentBoundaries(root: ComponentNode): ComponentNode[] {
    const boundaries: ComponentNode[] = [];
    
    const traverse = (node: ComponentNode) => {
      const analysis = this.analyzeComponentBoundary(node);
      
      if (analysis.isComponentBoundary) {
        node.componentBoundary = true;
        boundaries.push(node);
      }
      
      node.children.forEach(traverse);
    };
    
    traverse(root);
    return boundaries;
  }

  /**
   * Analyze if a node should be a component boundary
   */
  private analyzeComponentBoundary(node: ComponentNode): ComponentBoundaryAnalysis {
    const reasons: Array<{ reason: ComponentBoundaryReason; confidence: number }> = [];
    
    // Check for semantic grouping
    if (this.isSemanticGroup(node)) {
      reasons.push({ reason: 'semantic_grouping', confidence: 0.8 });
    }
    
    // Check for style consistency
    if (this.hasStyleConsistency(node)) {
      reasons.push({ reason: 'style_consistency', confidence: 0.7 });
    }
    
    // Check for functional unit
    if (this.isFunctionalUnit(node)) {
      reasons.push({ reason: 'functional_unit', confidence: 0.9 });
    }
    
    // Check size threshold
    if (this.meetsComponentSizeThreshold(node)) {
      reasons.push({ reason: 'size_threshold', confidence: 0.6 });
    }
    
    // Check naming convention
    if (this.hasComponentNamingConvention(node)) {
      reasons.push({ reason: 'naming_convention', confidence: 0.8 });
    }
    
    // Determine if it should be a component boundary
    const maxConfidence = Math.max(...reasons.map(r => r.confidence), 0);
    const isComponentBoundary = maxConfidence > 0.6 && reasons.length > 0;
    
    const primaryReason = reasons.reduce((max, current) => 
      current.confidence > max.confidence ? current : max,
      { reason: 'semantic_grouping' as ComponentBoundaryReason, confidence: 0 }
    );

    return {
      isComponentBoundary,
      reason: primaryReason.reason,
      suggestedName: this.generateComponentName(node),
      confidence: maxConfidence
    };
  }

  /**
   * Check if node represents a semantic group
   */
  private isSemanticGroup(node: ComponentNode): boolean {
    const semanticKeywords = [
      'header', 'footer', 'nav', 'sidebar', 'main', 'content',
      'card', 'modal', 'dialog', 'form', 'button', 'input'
    ];
    
    const name = node.element.name.toLowerCase();
    return semanticKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if node has consistent styling across children
   */
  private hasStyleConsistency(node: ComponentNode): boolean {
    if (node.children.length < this.MIN_COMPONENT_CHILDREN) {
      return false;
    }
    
    // Check if children have similar styling patterns
    const childStyles = node.children.map(child => child.element.styles);
    
    // Check background color consistency
    const backgrounds = childStyles.map(s => s.backgroundColor).filter(Boolean);
    const uniqueBackgrounds = new Set(backgrounds);
    
    // Check border radius consistency
    const borderRadii = childStyles.map(s => s.borderRadius).filter(Boolean);
    const uniqueRadii = new Set(borderRadii);
    
    return uniqueBackgrounds.size <= 2 && uniqueRadii.size <= 2;
  }

  /**
   * Check if node represents a functional unit
   */
  private isFunctionalUnit(node: ComponentNode): boolean {
    const functionalTypes: ComponentType[] = ['button', 'input', 'card'];
    
    if (functionalTypes.includes(node.parsedElement.componentType)) {
      return true;
    }
    
    // Check if it contains interactive elements
    const hasInteractiveChildren = this.hasInteractiveChildren(node);
    const hasFormElements = this.hasFormElements(node);
    
    return hasInteractiveChildren || hasFormElements;
  }

  /**
   * Check if node meets size threshold for componentization
   */
  private meetsComponentSizeThreshold(node: ComponentNode): boolean {
    const minChildren = this.MIN_COMPONENT_CHILDREN;
    const maxDepth = this.MAX_COMPONENT_DEPTH;
    
    const hasEnoughChildren = node.children.length >= minChildren;
    const isNotTooDeep = node.depth <= maxDepth;
    const hasReasonableSize = this.calculateSubtreeSize(node) >= 3;
    
    return hasEnoughChildren && isNotTooDeep && hasReasonableSize;
  }

  /**
   * Check if node follows component naming conventions
   */
  private hasComponentNamingConvention(node: ComponentNode): boolean {
    const name = node.element.name;
    
    // Check for PascalCase naming
    const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(name);
    
    // Check for component-like naming patterns
    const componentPatterns = [
      /Component$/,
      /Card$/,
      /Button$/,
      /Modal$/,
      /Form$/,
      /Header$/,
      /Footer$/
    ];
    
    const hasComponentPattern = componentPatterns.some(pattern => pattern.test(name));
    
    return isPascalCase || hasComponentPattern;
  }

  /**
   * Check if node has interactive children
   */
  private hasInteractiveChildren(node: ComponentNode): boolean {
    const traverse = (n: ComponentNode): boolean => {
      if (n.parsedElement.extractedProperties.interactive) {
        return true;
      }
      return n.children.some(traverse);
    };
    
    return traverse(node);
  }

  /**
   * Check if node has form elements
   */
  private hasFormElements(node: ComponentNode): boolean {
    const formTypes: ComponentType[] = ['input', 'button'];
    
    const traverse = (n: ComponentNode): boolean => {
      if (formTypes.includes(n.parsedElement.componentType)) {
        return true;
      }
      return n.children.some(traverse);
    };
    
    return traverse(node);
  }

  /**
   * Calculate the total number of nodes in a subtree
   */
  private calculateSubtreeSize(node: ComponentNode): number {
    let size = 1;
    node.children.forEach(child => {
      size += this.calculateSubtreeSize(child);
    });
    return size;
  }

  /**
   * Generate a suggested component name
   */
  private generateComponentName(node: ComponentNode): string {
    const baseName = node.element.name;
    
    // Clean up the name
    let cleanName = baseName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Convert to PascalCase
    const pascalCase = cleanName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    
    // Ensure it starts with a capital letter
    return pascalCase || 'Component';
  }

  /**
   * Detect reusable patterns in the component tree
   */
  private detectReusablePatterns(nodes: ComponentNode[]): ReusablePattern[] {
    const patterns = new Map<string, ComponentNode[]>();
    
    // Group nodes by their pattern signature
    nodes.forEach(node => {
      if (node.children.length > 0) {
        const signature = this.generatePatternSignature(node);
        const key = signature.structureHash;
        
        if (!patterns.has(key)) {
          patterns.set(key, []);
        }
        patterns.get(key)!.push(node);
      }
    });
    
    // Filter patterns that appear multiple times
    const reusablePatterns: ReusablePattern[] = [];
    let patternId = 1;
    
    patterns.forEach((instances, hash) => {
      if (instances.length >= this.REUSE_THRESHOLD) {
        const signature = this.generatePatternSignature(instances[0]);
        const confidence = this.calculatePatternConfidence(instances);
        
        reusablePatterns.push({
          id: `pattern-${patternId++}`,
          type: instances[0].parsedElement.componentType,
          signature,
          instances,
          confidence
        });
      }
    });
    
    return reusablePatterns;
  }

  /**
   * Generate a pattern signature for a component node
   */
  private generatePatternSignature(node: ComponentNode): PatternSignature {
    const elementTypes = this.extractElementTypes(node);
    const structureHash = this.generateStructureHash(node);
    const styleFingerprint = this.generateStyleFingerprint(node);
    const dimensionRatio = node.element.properties.width / node.element.properties.height;
    
    return {
      elementTypes,
      structureHash,
      styleFingerprint,
      dimensionRatio
    };
  }

  /**
   * Extract element types from node hierarchy
   */
  private extractElementTypes(node: ComponentNode): string[] {
    const types: string[] = [node.element.type];
    
    node.children.forEach(child => {
      types.push(...this.extractElementTypes(child));
    });
    
    return types.sort();
  }

  /**
   * Generate a hash representing the structure
   */
  private generateStructureHash(node: ComponentNode): string {
    const structure = this.serializeStructure(node);
    return this.simpleHash(structure);
  }

  /**
   * Serialize the structure of a node
   */
  private serializeStructure(node: ComponentNode): string {
    const childStructures = node.children
      .map(child => this.serializeStructure(child))
      .sort()
      .join('|');
    
    return `${node.element.type}(${childStructures})`;
  }

  /**
   * Generate a simple hash from a string
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate a style fingerprint for pattern matching
   */
  private generateStyleFingerprint(node: ComponentNode): string {
    const styles = node.element.styles;
    const fingerprint = [
      styles.backgroundColor || 'none',
      String(styles.borderRadius || 0),
      Boolean(styles.shadows?.length).toString(),
      Boolean(styles.borders?.length).toString()
    ];
    
    return fingerprint.join('-');
  }

  /**
   * Calculate confidence score for a pattern
   */
  private calculatePatternConfidence(instances: ComponentNode[]): number {
    if (instances.length < this.REUSE_THRESHOLD) {
      return 0;
    }
    
    // Base confidence on number of instances
    let confidence = Math.min(instances.length / 5, 1) * 0.6;
    
    // Boost confidence for consistent styling
    const styleFingerprints = instances.map(instance => 
      this.generateStyleFingerprint(instance)
    );
    const uniqueStyles = new Set(styleFingerprints);
    
    if (uniqueStyles.size === 1) {
      confidence += 0.3;
    } else if (uniqueStyles.size <= 2) {
      confidence += 0.1;
    }
    
    // Boost confidence for similar dimensions
    const aspectRatios = instances.map(instance => 
      instance.element.properties.width / instance.element.properties.height
    );
    const avgRatio = aspectRatios.reduce((sum, ratio) => sum + ratio, 0) / aspectRatios.length;
    const ratioVariance = aspectRatios.reduce((sum, ratio) => sum + Math.pow(ratio - avgRatio, 2), 0) / aspectRatios.length;
    
    if (ratioVariance < 0.1) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1);
  }

  /**
   * Assign reusable patterns to nodes
   */
  private assignReusablePatterns(patterns: ReusablePattern[], nodes: Map<string, ComponentNode>): void {
    patterns.forEach(pattern => {
      pattern.instances.forEach(instance => {
        const node = nodes.get(instance.id);
        if (node) {
          node.reusablePattern = pattern;
          node.componentBoundary = true;
        }
      });
    });
  }
}

// Export singleton instance
export const hierarchyAnalyzer = new HierarchyAnalyzer();