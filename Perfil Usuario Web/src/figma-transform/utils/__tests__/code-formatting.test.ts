import { describe, it, expect } from 'vitest';
import {
  formatCode,
  applyIndentation,
  convertToSingleQuotes,
  ensureSemicolons,
  addTrailingCommas,
  trimTrailingWhitespace,
  formatJSXAttributes,
  formatImports,
  formatInterface,
  formatComponent,
  wrapLongLines,
  DEFAULT_FORMATTING_OPTIONS,
  type FormattingOptions
} from '../code-formatting.js';

describe('code-formatting utilities', () => {
  describe('formatCode', () => {
    it('should format code with default options', () => {
      const input = `const test="hello"
function example(){
return "world"
}`;
      const result = formatCode(input);
      expect(result).toContain("const test = 'hello';");
      expect(result).toContain("function example() {");
      expect(result).toContain("return 'world';");
    });

    it('should normalize line endings', () => {
      const input = 'line1\r\nline2\rline3\n';
      const result = formatCode(input);
      expect(result).not.toContain('\r');
      expect(result.split('\n').length).toBeGreaterThanOrEqual(3);
    });

    it('should apply custom formatting options', () => {
      const customOptions: FormattingOptions = {
        ...DEFAULT_FORMATTING_OPTIONS,
        indentSize: 4,
        singleQuotes: false,
        semicolons: false
      };
      const input = 'const test = \'hello\'';
      const result = formatCode(input, customOptions);
      expect(result).toContain('"hello"');
      expect(result).not.toContain(';');
    });

    it('should insert final newline when enabled', () => {
      const input = 'const test = "hello"';
      const result = formatCode(input, { ...DEFAULT_FORMATTING_OPTIONS, insertFinalNewline: true });
      expect(result.endsWith('\n')).toBe(true);
    });

    it('should not insert final newline when disabled', () => {
      const input = 'const test = "hello"';
      const result = formatCode(input, { ...DEFAULT_FORMATTING_OPTIONS, insertFinalNewline: false });
      expect(result.endsWith('\n')).toBe(false);
    });
  });

  describe('applyIndentation', () => {
    it('should apply proper indentation with spaces', () => {
      const input = `function test() {
const x = 1;
if (x) {
return true;
}
}`;
      const options: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS, indentSize: 2, indentType: 'spaces' };
      const result = applyIndentation(input, options);
      
      expect(result).toContain('  const x = 1;');
      expect(result).toContain('    return true;');
    });

    it('should apply proper indentation with tabs', () => {
      const input = `function test() {
const x = 1;
}`;
      const options: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS, indentType: 'tabs' };
      const result = applyIndentation(input, options);
      
      expect(result).toContain('\tconst x = 1;');
    });

    it('should handle nested blocks correctly', () => {
      const input = `if (condition) {
if (nested) {
doSomething();
}
}`;
      const result = applyIndentation(input, DEFAULT_FORMATTING_OPTIONS);
      
      expect(result).toContain('  if (nested) {');
      expect(result).toContain('    doSomething();');
    });

    it('should handle arrays and objects', () => {
      const input = `const obj = {
key: value,
nested: [
item1,
item2
]
}`;
      const result = applyIndentation(input, DEFAULT_FORMATTING_OPTIONS);
      
      expect(result).toContain('  key: value,');
      expect(result).toContain('    item1,');
    });

    it('should preserve empty lines', () => {
      const input = `function test() {

const x = 1;

}`;
      const result = applyIndentation(input, DEFAULT_FORMATTING_OPTIONS);
      const lines = result.split('\n');
      
      expect(lines[1]).toBe('');
      expect(lines[3]).toBe('');
    });
  });

  describe('convertToSingleQuotes', () => {
    it('should convert double quotes to single quotes', () => {
      expect(convertToSingleQuotes('"hello world"')).toBe("'hello world'");
      expect(convertToSingleQuotes('const msg = "test"')).toBe("const msg = 'test'");
    });

    it('should handle escaped quotes', () => {
      expect(convertToSingleQuotes('"hello \\"world\\""')).toBe("'hello \"world\"'");
    });

    it('should handle multiple quotes in one line', () => {
      expect(convertToSingleQuotes('const a = "hello"; const b = "world";'))
        .toBe("const a = 'hello'; const b = 'world';");
    });

    it('should not affect single quotes', () => {
      const input = "const msg = 'hello';";
      expect(convertToSingleQuotes(input)).toBe(input);
    });
  });

  describe('ensureSemicolons', () => {
    it('should add semicolons to statements', () => {
      expect(ensureSemicolons('const x = 1')).toBe('const x = 1;');
      expect(ensureSemicolons('let y = 2')).toBe('let y = 2;');
      expect(ensureSemicolons('var z = 3')).toBe('var z = 3;');
    });

    it('should add semicolons to import/export statements', () => {
      expect(ensureSemicolons("import React from 'react'")).toBe("import React from 'react';");
      expect(ensureSemicolons("export default Component")).toBe("export default Component;");
    });

    it('should add semicolons to return statements', () => {
      expect(ensureSemicolons('return value')).toBe('return value;');
      expect(ensureSemicolons('throw error')).toBe('throw error;');
    });

    it('should not add semicolons to lines that already have them', () => {
      const input = 'const x = 1;';
      expect(ensureSemicolons(input)).toBe(input);
    });

    it('should not add semicolons to comments', () => {
      expect(ensureSemicolons('// This is a comment')).toBe('// This is a comment');
      expect(ensureSemicolons('/* Block comment */')).toBe('/* Block comment */');
    });

    it('should not add semicolons to block statements', () => {
      expect(ensureSemicolons('if (condition) {')).toBe('if (condition) {');
      expect(ensureSemicolons('} else {')).toBe('} else {');
      expect(ensureSemicolons('}')).toBe('}');
    });

    it('should not add semicolons to JSX', () => {
      expect(ensureSemicolons('<div>')).toBe('<div>');
      expect(ensureSemicolons('<Component />')).toBe('<Component />');
    });
  });

  describe('addTrailingCommas', () => {
    it('should add trailing commas to objects', () => {
      const input = `{
  key: value
}`;
      const result = addTrailingCommas(input);
      expect(result).toContain('key: value,');
    });

    it('should add trailing commas to arrays', () => {
      const input = `[
  item1,
  item2
]`;
      const result = addTrailingCommas(input);
      expect(result).toContain('item2,');
    });

    it('should not add trailing commas if already present', () => {
      const input = `{
  key: value,
}`;
      const result = addTrailingCommas(input);
      expect(result).toBe(input);
    });
  });

  describe('trimTrailingWhitespace', () => {
    it('should remove trailing spaces', () => {
      const input = 'line with spaces   \nline without';
      const result = trimTrailingWhitespace(input);
      expect(result).toBe('line with spaces\nline without');
    });

    it('should remove trailing tabs', () => {
      const input = 'line with tabs\t\t\nline without';
      const result = trimTrailingWhitespace(input);
      expect(result).toBe('line with tabs\nline without');
    });

    it('should handle mixed whitespace', () => {
      const input = 'line with mixed \t \nline without';
      const result = trimTrailingWhitespace(input);
      expect(result).toBe('line with mixed\nline without');
    });

    it('should preserve leading whitespace', () => {
      const input = '  indented line  \n  another indented  ';
      const result = trimTrailingWhitespace(input);
      expect(result).toBe('  indented line\n  another indented');
    });
  });

  describe('formatJSXAttributes', () => {
    it('should format short attributes on single line', () => {
      const attributes = ['className="btn"', 'onClick={handler}'];
      const result = formatJSXAttributes(attributes, DEFAULT_FORMATTING_OPTIONS);
      expect(result).toBe(' className="btn" onClick={handler}');
    });

    it('should format long attributes on multiple lines', () => {
      const attributes = [
        'className="very-long-class-name-that-exceeds-line-length"',
        'onClick={handleVeryLongFunctionName}',
        'data-testid="component-test-id"'
      ];
      const result = formatJSXAttributes(attributes, DEFAULT_FORMATTING_OPTIONS);
      expect(result).toContain('\n  className=');
      expect(result).toContain('\n  onClick=');
      expect(result).toContain('\n  data-testid=');
    });

    it('should handle empty attributes', () => {
      const result = formatJSXAttributes([], DEFAULT_FORMATTING_OPTIONS);
      expect(result).toBe('');
    });

    it('should use correct indentation', () => {
      const attributes = ['prop1="value1"', 'prop2="value2"'];
      const options: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS, indentSize: 4 };
      const result = formatJSXAttributes(attributes, options);
      if (result.includes('\n')) {
        expect(result).toContain('\n    prop1=');
      }
    });
  });

  describe('formatImports', () => {
    it('should group and sort imports correctly', () => {
      const imports = [
        "import { useState } from 'react';",
        "import { Button } from './Button';",
        "import axios from 'axios';",
        "import React from 'react';"
      ];
      const result = formatImports(imports, DEFAULT_FORMATTING_OPTIONS);
      
      // React imports should come first
      expect(result.indexOf('React')).toBeLessThan(result.indexOf('axios'));
      // Library imports before relative imports
      expect(result.indexOf('axios')).toBeLessThan(result.indexOf('./Button'));
    });

    it('should handle empty imports', () => {
      const result = formatImports([], DEFAULT_FORMATTING_OPTIONS);
      expect(result).toBe('');
    });

    it('should add proper spacing between groups', () => {
      const imports = [
        "import React from 'react';",
        "import axios from 'axios';",
        "import { Button } from './Button';"
      ];
      const result = formatImports(imports, DEFAULT_FORMATTING_OPTIONS);
      expect(result).toContain('react\';\n\n');
      expect(result).toContain('axios\';\n\n');
    });

    it('should sort within groups', () => {
      const imports = [
        "import { useState, useEffect } from 'react';",
        "import React from 'react';",
        "import { Component } from './Component';",
        "import { Button } from './Button';"
      ];
      const result = formatImports(imports, DEFAULT_FORMATTING_OPTIONS);
      
      const reactIndex = result.indexOf("import React");
      const useStateIndex = result.indexOf("import { useState");
      expect(reactIndex).toBeLessThan(useStateIndex);
    });
  });

  describe('formatInterface', () => {
    it('should format interface with properties', () => {
      const properties = ['name: string;', 'age: number;', 'active?: boolean;'];
      const result = formatInterface('User', properties, DEFAULT_FORMATTING_OPTIONS);
      
      expect(result).toContain('interface User {');
      expect(result).toContain('  name: string;');
      expect(result).toContain('  age: number;');
      expect(result).toContain('  active?: boolean;');
      expect(result).toContain('}');
    });

    it('should handle empty interface', () => {
      const result = formatInterface('Empty', [], DEFAULT_FORMATTING_OPTIONS);
      expect(result).toBe('interface Empty {}');
    });

    it('should use correct indentation', () => {
      const properties = ['prop: string;'];
      const options: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS, indentSize: 4 };
      const result = formatInterface('Test', properties, options);
      expect(result).toContain('    prop: string;');
    });
  });

  describe('formatComponent', () => {
    it('should format React component correctly', () => {
      const jsx = '<div>Hello World</div>';
      const result = formatComponent('HelloWorld', '{ message: string }', jsx, DEFAULT_FORMATTING_OPTIONS);
      
      expect(result).toContain('export function HelloWorld({ message: string }) {');
      expect(result).toContain('  return (<div>Hello World</div>);');
      expect(result).toContain('}');
    });

    it('should handle multi-line JSX', () => {
      const jsx = `<div>
  <h1>Title</h1>
  <p>Content</p>
</div>`;
      const result = formatComponent('Component', 'props', jsx, DEFAULT_FORMATTING_OPTIONS);
      
      expect(result).toContain('  return (<div>');
      expect(result).toContain('  <h1>Title</h1>');
      expect(result).toContain('  <p>Content</p>');
      expect(result).toContain('  </div>);');
    });

    it('should use correct indentation', () => {
      const jsx = '<div>Test</div>';
      const options: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS, indentSize: 4 };
      const result = formatComponent('Test', 'props', jsx, options);
      expect(result).toContain('    return (<div>Test</div>);');
    });
  });

  describe('wrapLongLines', () => {
    it('should wrap long lines with logical operators', () => {
      const input = 'const result = condition1 && condition2 && condition3 && condition4;';
      const result = wrapLongLines(input, 50);
      
      if (input.length > 50) {
        expect(result).toContain('\n');
        expect(result).toMatch(/&&\s*\n/);
      }
    });

    it('should preserve indentation when wrapping', () => {
      const input = '  const result = condition1 && condition2 && condition3;';
      const result = wrapLongLines(input, 30);
      
      if (input.length > 30) {
        const lines = result.split('\n');
        lines.slice(1).forEach(line => {
          if (line.trim()) {
            expect(line).toMatch(/^\s{4}/); // Should have additional indentation
          }
        });
      }
    });

    it('should not wrap short lines', () => {
      const input = 'const x = 1;';
      const result = wrapLongLines(input, 100);
      expect(result).toBe(input);
    });

    it('should handle lines without logical operators', () => {
      const input = 'const veryLongVariableNameThatExceedsTheMaximumLineLengthButHasNoLogicalOperators = true;';
      const result = wrapLongLines(input, 50);
      // Should return as-is if can't wrap intelligently
      expect(result).toBe(input);
    });

    it('should handle multiple lines', () => {
      const input = `const short = 1;
const veryLongLineWithLogicalOperators = condition1 && condition2 && condition3;
const anotherShort = 2;`;
      const result = wrapLongLines(input, 50);
      
      const lines = result.split('\n');
      expect(lines[0]).toBe('const short = 1;');
      expect(lines[lines.length - 1]).toBe('const anotherShort = 2;');
    });
  });
});