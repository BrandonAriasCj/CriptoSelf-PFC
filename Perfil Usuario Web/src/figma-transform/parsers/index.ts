/**
 * Figma Element Analysis and Parsing Module
 * Exports all parsers for analyzing Figma elements and mapping to React components
 */

export * from './visual-element-parser';
export * from './hierarchy-analyzer';
export * from './pattern-matcher';

// Re-export singleton instances for convenience
export { visualElementParser } from './visual-element-parser';
export { hierarchyAnalyzer } from './hierarchy-analyzer';
export { patternMatcher } from './pattern-matcher';