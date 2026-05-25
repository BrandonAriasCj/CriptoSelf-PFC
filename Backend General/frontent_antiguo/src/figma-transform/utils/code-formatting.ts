/**
 * Code formatting and indentation utilities for generating clean, readable code
 */

/**
 * Formatting options for code generation
 */
export interface FormattingOptions {
  indentSize: number;
  indentType: 'spaces' | 'tabs';
  maxLineLength: number;
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
  semicolons: boolean;
  singleQuotes: boolean;
  trailingCommas: boolean;
}

/**
 * Default formatting options following common TypeScript/React conventions
 */
export const DEFAULT_FORMATTING_OPTIONS: FormattingOptions = {
  indentSize: 2,
  indentType: 'spaces',
  maxLineLength: 100,
  insertFinalNewline: true,
  trimTrailingWhitespace: true,
  semicolons: true,
  singleQuotes: true,
  trailingCommas: true
};

/**
 * Formats TypeScript/JSX code with proper indentation and styling
 * @param code - Raw code string
 * @param options - Formatting options
 * @returns Formatted code string
 */
export function formatCode(code: string, options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS): string {
  let formatted = code;
  
  // Normalize line endings
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Basic spacing fixes
  formatted = formatted.replace(/(\w)=(["\w])/g, '$1 = $2'); // Add spaces around equals
  formatted = formatted.replace(/(\w|\))\{/g, '$1 {'); // Add space before opening brace
  formatted = formatted.replace(/\}(\w)/g, '} $1'); // Add space after closing brace
  
  // Apply indentation
  formatted = applyIndentation(formatted, options);
  
  // Apply quote style
  if (options.singleQuotes) {
    formatted = convertToSingleQuotes(formatted);
  } else {
    // Convert single quotes to double quotes
    formatted = formatted.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
  }
  
  // Handle semicolons
  if (options.semicolons) {
    formatted = ensureSemicolons(formatted);
  }
  
  // Handle trailing commas
  if (options.trailingCommas) {
    formatted = addTrailingCommas(formatted);
  }
  
  // Trim trailing whitespace
  if (options.trimTrailingWhitespace) {
    formatted = trimTrailingWhitespace(formatted);
  }
  
  // Insert final newline
  if (options.insertFinalNewline && !formatted.endsWith('\n')) {
    formatted += '\n';
  }
  
  return formatted;
}

/**
 * Applies proper indentation to code
 * @param code - Code string
 * @param options - Formatting options
 * @returns Code with proper indentation
 */
export function applyIndentation(code: string, options: FormattingOptions): string {
  const lines = code.split('\n');
  const indent = options.indentType === 'tabs' ? '\t' : ' '.repeat(options.indentSize);
  let indentLevel = 0;
  
  return lines.map(line => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) return '';
    
    // Decrease indent for closing brackets/braces
    if (/^[}\])]/.test(trimmedLine)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indentedLine = indent.repeat(indentLevel) + trimmedLine;
    
    // Increase indent for opening brackets/braces
    if (/[{[\(]$/.test(trimmedLine) && !trimmedLine.includes('//')) {
      indentLevel++;
    }
    
    return indentedLine;
  }).join('\n');
}

/**
 * Converts double quotes to single quotes in code
 * @param code - Code string
 * @returns Code with single quotes
 */
export function convertToSingleQuotes(code: string): string {
  // Replace double quotes with single quotes, and handle escaped quotes
  return code.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
    // Convert escaped double quotes to regular double quotes inside single quotes
    const processedContent = content.replace(/\\"/g, '"');
    return `'${processedContent}'`;
  });
}

/**
 * Ensures semicolons are present where needed
 * @param code - Code string
 * @returns Code with proper semicolons
 */
export function ensureSemicolons(code: string): string {
  const lines = code.split('\n');
  
  return lines.map(line => {
    const trimmed = line.trim();
    
    // Skip empty lines, comments, and lines that already end with semicolon
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.endsWith(';')) {
      return line;
    }
    
    // Skip lines that end with opening braces, JSX tags, or are part of multi-line statements
    if (/[{(<]$/.test(trimmed) || /^</.test(trimmed) || /^}/.test(trimmed)) {
      return line;
    }
    
    // Add semicolon to statements that need them
    if (/^(const|let|var|import|export|return|throw|break|continue)/.test(trimmed)) {
      return line + ';';
    }
    
    return line;
  }).join('\n');
}

/**
 * Adds trailing commas to arrays and objects
 * @param code - Code string
 * @returns Code with trailing commas
 */
export function addTrailingCommas(code: string): string {
  // This is a simplified implementation - a full implementation would need proper AST parsing
  return code.replace(/([^,\s])\s*\n\s*([}\]])/g, '$1,\n$2');
}

/**
 * Removes trailing whitespace from lines
 * @param code - Code string
 * @returns Code without trailing whitespace
 */
export function trimTrailingWhitespace(code: string): string {
  return code.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');
}

/**
 * Formats JSX attributes with proper spacing and line breaks
 * @param attributes - Array of attribute strings
 * @param options - Formatting options
 * @returns Formatted attributes string
 */
export function formatJSXAttributes(attributes: string[], options: FormattingOptions): string {
  if (attributes.length === 0) return '';
  
  const indent = options.indentType === 'tabs' ? '\t' : ' '.repeat(options.indentSize);
  
  // Single line if short enough
  const singleLine = attributes.join(' ');
  if (singleLine.length <= options.maxLineLength - 20) { // Leave room for tag name
    return ' ' + singleLine;
  }
  
  // Multi-line format
  return '\n' + attributes.map(attr => indent + attr).join('\n') + '\n';
}

/**
 * Formats import statements with proper grouping and sorting
 * @param imports - Array of import statements
 * @param options - Formatting options
 * @returns Formatted imports string
 */
export function formatImports(imports: string[], options: FormattingOptions): string {
  if (imports.length === 0) return '';
  
  // Group imports by type
  const reactImports: string[] = [];
  const libraryImports: string[] = [];
  const relativeImports: string[] = [];
  
  imports.forEach(importStatement => {
    if (importStatement.includes("from 'react'") || importStatement.includes('from "react"')) {
      reactImports.push(importStatement);
    } else if (importStatement.includes("from '.") || importStatement.includes('from ".')) {
      relativeImports.push(importStatement);
    } else {
      libraryImports.push(importStatement);
    }
  });
  
  // Sort each group
  reactImports.sort();
  libraryImports.sort();
  relativeImports.sort();
  
  // Combine with proper spacing
  const groups = [reactImports, libraryImports, relativeImports].filter(group => group.length > 0);
  return groups.map(group => group.join('\n')).join('\n\n') + '\n\n';
}

/**
 * Formats TypeScript interface with proper indentation
 * @param interfaceName - Name of the interface
 * @param properties - Array of property definitions
 * @param options - Formatting options
 * @returns Formatted interface string
 */
export function formatInterface(
  interfaceName: string, 
  properties: string[], 
  options: FormattingOptions
): string {
  if (properties.length === 0) {
    return `interface ${interfaceName} {}`;
  }
  
  const indent = options.indentType === 'tabs' ? '\t' : ' '.repeat(options.indentSize);
  const formattedProperties = properties.map(prop => indent + prop).join('\n');
  
  return `interface ${interfaceName} {\n${formattedProperties}\n}`;
}

/**
 * Formats function component with proper structure
 * @param componentName - Name of the component
 * @param props - Props interface name
 * @param jsx - JSX content
 * @param options - Formatting options
 * @returns Formatted component string
 */
export function formatComponent(
  componentName: string,
  props: string,
  jsx: string,
  options: FormattingOptions
): string {
  const indent = options.indentType === 'tabs' ? '\t' : ' '.repeat(options.indentSize);
  
  // Handle single line JSX
  if (!jsx.includes('\n')) {
    return `export function ${componentName}(${props}) {\n${indent}return (${jsx});\n}`;
  }
  
  // Handle multi-line JSX
  const jsxLines = jsx.split('\n');
  const formattedJSX = jsxLines.map((line, index) => {
    if (index === 0) return indent + 'return (' + line;
    if (index === jsxLines.length - 1) return indent + line + ');';
    return indent + line;
  }).join('\n');
  
  return `export function ${componentName}(${props}) {\n${formattedJSX}\n}`;
}

/**
 * Wraps long lines to respect max line length
 * @param code - Code string
 * @param maxLength - Maximum line length
 * @returns Code with wrapped lines
 */
export function wrapLongLines(code: string, maxLength: number): string {
  return code.split('\n').map(line => {
    if (line.length <= maxLength) return line;
    
    // Simple line wrapping for long lines (this could be more sophisticated)
    const indent = line.match(/^\s*/)?.[0] || '';
    const content = line.trim();
    
    if (content.includes(' && ') || content.includes(' || ')) {
      return content.split(/ (&& |\|\| )/).reduce((acc, part, index) => {
        if (index === 0) return indent + part;
        return acc + '\n' + indent + '  ' + part;
      }, '');
    }
    
    return line; // Return as-is if we can't wrap intelligently
  }).join('\n');
}