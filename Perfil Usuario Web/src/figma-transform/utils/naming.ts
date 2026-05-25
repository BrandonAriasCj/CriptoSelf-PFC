/**
 * Component naming utilities for converting between different naming conventions
 */

/**
 * Converts camelCase or kebab-case to PascalCase for component names
 * @param name - The input name in camelCase, kebab-case, or any format
 * @returns PascalCase component name
 */
export function toPascalCase(name: string): string {
  if (!name) return '';
  
  // Handle camelCase by inserting spaces before uppercase letters
  let processedName = name.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Remove special characters and split by common delimiters
  const words = processedName
    .replace(/[^a-zA-Z0-9\s\-_]/g, ' ') // Replace special chars with spaces
    .split(/[\s\-_]+/) // Split by spaces, hyphens, underscores
    .filter(word => word.length > 0);
  
  // Capitalize first letter of each word
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Converts PascalCase to camelCase
 * @param name - PascalCase name
 * @returns camelCase name
 */
export function toCamelCase(name: string): string {
  if (!name) return '';
  
  const pascalCase = toPascalCase(name);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * Converts PascalCase to kebab-case
 * @param name - PascalCase name
 * @returns kebab-case name
 */
export function toKebabCase(name: string): string {
  if (!name) return '';
  
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Add hyphen before uppercase letters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .toLowerCase()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Converts PascalCase to snake_case
 * @param name - PascalCase name
 * @returns snake_case name
 */
export function toSnakeCase(name: string): string {
  if (!name) return '';
  
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Add underscore before uppercase letters
    .replace(/[\s\-]+/g, '_') // Replace spaces and hyphens with underscores
    .toLowerCase()
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

/**
 * Generates a valid React component name from Figma element name
 * @param figmaName - Original name from Figma
 * @param suffix - Optional suffix to add (e.g., 'Component', 'Widget')
 * @returns Valid React component name in PascalCase
 */
export function generateComponentName(figmaName: string, suffix?: string): string {
  if (!figmaName) return 'UnnamedComponent';
  
  // Check if original name starts with invalid character before processing
  const startsWithInvalidChar = !/^[A-Za-z]/.test(figmaName);
  
  // Clean the name and convert to PascalCase
  let componentName = toPascalCase(figmaName);
  
  // Ensure it starts with a letter (React requirement)
  if (!componentName || !/^[A-Za-z]/.test(componentName) || startsWithInvalidChar) {
    componentName = 'Component' + componentName;
  }
  
  // Add suffix if provided
  if (suffix) {
    const cleanSuffix = toPascalCase(suffix);
    if (!componentName.toLowerCase().endsWith(cleanSuffix.toLowerCase())) {
      componentName += cleanSuffix;
    }
  }
  
  return componentName;
}

/**
 * Generates props interface name from component name
 * @param componentName - Component name in PascalCase
 * @param convention - Naming convention to use
 * @returns Props interface name
 */
export function generatePropsInterfaceName(
  componentName: string, 
  convention: 'ComponentNameProps' | 'ComponentProps' | 'Props' = 'ComponentNameProps'
): string {
  switch (convention) {
    case 'ComponentNameProps':
      return `${componentName}Props`;
    case 'ComponentProps':
      return 'ComponentProps';
    case 'Props':
      return 'Props';
    default:
      return `${componentName}Props`;
  }
}

/**
 * Generates a unique component name by checking against existing names
 * @param baseName - Base component name
 * @param existingNames - Set of existing component names
 * @param maxAttempts - Maximum number of attempts to find unique name
 * @returns Unique component name
 */
export function generateUniqueComponentName(
  baseName: string, 
  existingNames: Set<string>, 
  maxAttempts: number = 100
): string {
  const cleanBaseName = generateComponentName(baseName);
  
  if (!existingNames.has(cleanBaseName)) {
    return cleanBaseName;
  }
  
  // Try with numeric suffixes
  for (let i = 1; i <= maxAttempts; i++) {
    const candidateName = `${cleanBaseName}${i}`;
    if (!existingNames.has(candidateName)) {
      return candidateName;
    }
  }
  
  // Fallback with timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `${cleanBaseName}${timestamp}`;
}

/**
 * Validates if a string is a valid React component name
 * @param name - Name to validate
 * @returns True if valid, false otherwise
 */
export function isValidComponentName(name: string): boolean {
  if (!name) return false;
  
  // Must start with uppercase letter
  if (!/^[A-Z]/.test(name)) return false;
  
  // Must contain only letters, numbers, and underscores
  if (!/^[A-Za-z0-9_]+$/.test(name)) return false;
  
  // Must not be a reserved word
  const reservedWords = ['Component', 'Element', 'Fragment', 'React'];
  if (reservedWords.includes(name)) return false;
  
  return true;
}

/**
 * Generates a file name from component name
 * @param componentName - Component name in PascalCase
 * @param extension - File extension (default: 'tsx')
 * @returns File name
 */
export function generateFileName(componentName: string, extension: string = 'tsx'): string {
  if (!componentName) return `Component.${extension}`;
  return `${componentName}.${extension}`;
}

/**
 * Sanitizes a string to be used as a valid identifier
 * @param input - Input string
 * @returns Sanitized identifier
 */
export function sanitizeIdentifier(input: string): string {
  if (!input) return 'identifier';
  
  let result = input
    .replace(/[^a-zA-Z0-9_]/g, '') // Remove invalid characters ($ is not valid in identifiers)
    .replace(/^[0-9]+/, ''); // Remove leading numbers
  
  return result || 'identifier'; // Fallback for empty result
}