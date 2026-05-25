/**
 * Import statement resolver for managing React component imports and dependencies
 */

import { FigmaElement } from '../types/core';
import { ImportStatement, ImportItem, ComponentMapping, UILibraryConfig } from '../types/component';

export interface ImportResolutionOptions {
  uiLibrary: UILibraryConfig;
  projectStructure: ProjectStructure;
  customMappings: ComponentMapping[];
  utilityImports: UtilityImports;
}

export interface ProjectStructure {
  componentsPath: string;
  utilsPath: string;
  typesPath: string;
  hooksPath: string;
  libPath: string;
}

export interface UtilityImports {
  classNames: string; // e.g., 'cn'
  variants: string; // e.g., 'cva'
  clsx: boolean;
  tailwindMerge: boolean;
}

export interface ResolvedImports {
  imports: ImportStatement[];
  dependencies: string[];
  utilityFunctions: string[];
}

export class ImportResolver {
  private options: ImportResolutionOptions;
  private componentMappings: Map<string, ComponentMapping>;
  private standardImports: Map<string, ImportStatement>;

  constructor(options: ImportResolutionOptions) {
    this.options = options;
    this.componentMappings = new Map();
    this.standardImports = new Map();
    
    this.initializeComponentMappings();
    this.initializeStandardImports();
  }

  /**
   * Resolve all imports needed for a component
   */
  resolveImports(element: FigmaElement, usedComponents: string[] = []): ResolvedImports {
    const imports: ImportStatement[] = [];
    const dependencies: string[] = [];
    const utilityFunctions: string[] = [];

    // Add React import
    imports.push(this.getReactImport());

    // Add utility imports (cn, cva, etc.)
    const utilityImports = this.resolveUtilityImports();
    imports.push(...utilityImports.imports);
    utilityFunctions.push(...utilityImports.utilities);

    // Add UI component imports
    const uiImports = this.resolveUIComponentImports(element, usedComponents);
    imports.push(...uiImports.imports);
    dependencies.push(...uiImports.dependencies);

    // Add icon imports
    const iconImports = this.resolveIconImports(element);
    imports.push(...iconImports);

    // Add third-party library imports
    const thirdPartyImports = this.resolveThirdPartyImports(element);
    imports.push(...thirdPartyImports.imports);
    dependencies.push(...thirdPartyImports.dependencies);

    // Add custom hook imports
    const hookImports = this.resolveHookImports(element);
    imports.push(...hookImports);

    // Add type imports
    const typeImports = this.resolveTypeImports(element);
    imports.push(...typeImports);

    return {
      imports: this.deduplicateImports(imports),
      dependencies: [...new Set(dependencies)],
      utilityFunctions: [...new Set(utilityFunctions)]
    };
  }

  /**
   * Get React import statement
   */
  private getReactImport(): ImportStatement {
    return {
      source: 'react',
      imports: [
        { name: 'React', isDefault: false }
      ]
    };
  }

  /**
   * Resolve utility function imports (cn, cva, etc.)
   */
  private resolveUtilityImports(): { imports: ImportStatement[]; utilities: string[] } {
    const imports: ImportStatement[] = [];
    const utilities: string[] = [];

    // cn utility for className merging
    if (this.options.utilityImports.classNames) {
      imports.push({
        source: '@/lib/utils',
        imports: [{ name: this.options.utilityImports.classNames, isDefault: false }]
      });
      utilities.push(this.options.utilityImports.classNames);
    }

    // cva utility for component variants
    if (this.options.utilityImports.variants) {
      imports.push({
        source: 'class-variance-authority',
        imports: [{ name: this.options.utilityImports.variants, isDefault: false }]
      });
      utilities.push(this.options.utilityImports.variants);
    }

    // clsx utility
    if (this.options.utilityImports.clsx) {
      imports.push({
        source: 'clsx',
        imports: [{ name: 'clsx', isDefault: true }]
      });
      utilities.push('clsx');
    }

    // tailwind-merge utility
    if (this.options.utilityImports.tailwindMerge) {
      imports.push({
        source: 'tailwind-merge',
        imports: [{ name: 'twMerge', isDefault: false }]
      });
      utilities.push('twMerge');
    }

    return { imports, utilities };
  }

  /**
   * Resolve UI component imports from design system
   */
  private resolveUIComponentImports(
    element: FigmaElement, 
    usedComponents: string[]
  ): { imports: ImportStatement[]; dependencies: string[] } {
    const imports: ImportStatement[] = [];
    const dependencies: string[] = [];

    // Get components needed based on element type and used components
    const neededComponents = this.getNeededUIComponents(element, usedComponents);

    // Group components by their import source
    const componentsBySource = new Map<string, string[]>();

    neededComponents.forEach(componentName => {
      const component = this.options.uiLibrary.components.find(c => c.name === componentName);
      if (component) {
        const source = component.importPath;
        if (!componentsBySource.has(source)) {
          componentsBySource.set(source, []);
        }
        componentsBySource.get(source)!.push(componentName);
      }
    });

    // Create import statements
    componentsBySource.forEach((components, source) => {
      imports.push({
        source,
        imports: components.map(name => ({ name, isDefault: false }))
      });
    });

    // Add UI library as dependency
    if (neededComponents.length > 0) {
      dependencies.push(this.options.uiLibrary.name);
    }

    return { imports, dependencies };
  }

  /**
   * Get needed UI components based on element analysis
   */
  private getNeededUIComponents(element: FigmaElement, usedComponents: string[]): string[] {
    const components = new Set<string>();

    // Add components based on element type
    const elementComponents = this.getComponentsForElementType(element.type);
    elementComponents.forEach(comp => components.add(comp));

    // Add explicitly used components
    usedComponents.forEach(comp => components.add(comp));

    // Add components for child elements
    if (element.children) {
      element.children.forEach(child => {
        const childComponents = this.getComponentsForElementType(child.type);
        childComponents.forEach(comp => components.add(comp));
      });
    }

    return Array.from(components);
  }

  /**
   * Get UI components needed for specific element type
   */
  private getComponentsForElementType(elementType: string): string[] {
    const componentMap: Record<string, string[]> = {
      'button': ['Button'],
      'input': ['Input', 'Label'],
      'text': [], // Usually no special components needed
      'image': [], // Usually no special components needed
      'frame': ['Card'], // Frames often become cards
      'component': [], // Generic components
      'group': []
    };

    return componentMap[elementType] || [];
  }

  /**
   * Resolve icon imports (Lucide, Heroicons, etc.)
   */
  private resolveIconImports(element: FigmaElement): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const iconNames = this.extractIconNames(element);

    if (iconNames.length > 0) {
      // Default to Lucide React icons
      imports.push({
        source: 'lucide-react',
        imports: iconNames.map(name => ({ name, isDefault: false }))
      });
    }

    return imports;
  }

  /**
   * Extract icon names from element and children
   */
  private extractIconNames(element: FigmaElement): string[] {
    const iconNames: string[] = [];

    // Check element name for icon patterns
    const iconName = this.extractIconFromName(element.name);
    if (iconName) {
      iconNames.push(iconName);
    }

    // Check children for icons
    if (element.children) {
      element.children.forEach(child => {
        const childIconNames = this.extractIconNames(child);
        iconNames.push(...childIconNames);
      });
    }

    return [...new Set(iconNames)];
  }

  /**
   * Extract icon name from element name
   */
  private extractIconFromName(name: string): string | null {
    const lowerName = name.toLowerCase();
    
    // Common icon patterns
    const iconPatterns = [
      'icon', 'arrow', 'chevron', 'plus', 'minus', 'close', 'menu',
      'search', 'user', 'home', 'settings', 'heart', 'star', 'check',
      'x', 'edit', 'delete', 'trash', 'download', 'upload', 'share'
    ];

    for (const pattern of iconPatterns) {
      if (lowerName.includes(pattern)) {
        // Convert to PascalCase for Lucide icons
        return this.convertToIconName(pattern);
      }
    }

    return null;
  }

  /**
   * Convert pattern to proper icon name
   */
  private convertToIconName(pattern: string): string {
    const iconMap: Record<string, string> = {
      'arrow': 'ArrowRight',
      'chevron': 'ChevronRight',
      'plus': 'Plus',
      'minus': 'Minus',
      'close': 'X',
      'menu': 'Menu',
      'search': 'Search',
      'user': 'User',
      'home': 'Home',
      'settings': 'Settings',
      'heart': 'Heart',
      'star': 'Star',
      'check': 'Check',
      'x': 'X',
      'edit': 'Edit',
      'delete': 'Trash2',
      'trash': 'Trash2',
      'download': 'Download',
      'upload': 'Upload',
      'share': 'Share'
    };

    return iconMap[pattern] || this.toPascalCase(pattern);
  }

  /**
   * Resolve third-party library imports
   */
  private resolveThirdPartyImports(element: FigmaElement): { imports: ImportStatement[]; dependencies: string[] } {
    const imports: ImportStatement[] = [];
    const dependencies: string[] = [];

    // Check for form-related elements that might need react-hook-form
    if (this.needsFormLibrary(element)) {
      imports.push({
        source: 'react-hook-form',
        imports: [
          { name: 'useForm', isDefault: false },
          { name: 'Controller', isDefault: false }
        ]
      });
      dependencies.push('react-hook-form');
    }

    // Check for animation needs
    if (this.needsAnimationLibrary(element)) {
      imports.push({
        source: 'framer-motion',
        imports: [
          { name: 'motion', isDefault: false },
          { name: 'AnimatePresence', isDefault: false }
        ]
      });
      dependencies.push('framer-motion');
    }

    // Check for date picker needs
    if (this.needsDatePicker(element)) {
      imports.push({
        source: 'react-datepicker',
        imports: [{ name: 'DatePicker', isDefault: true }]
      });
      dependencies.push('react-datepicker');
    }

    return { imports, dependencies };
  }

  /**
   * Resolve custom hook imports
   */
  private resolveHookImports(element: FigmaElement): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const hooks = this.getNeededHooks(element);

    if (hooks.length > 0) {
      imports.push({
        source: this.options.projectStructure.hooksPath,
        imports: hooks.map(hook => ({ name: hook, isDefault: false }))
      });
    }

    return imports;
  }

  /**
   * Get needed custom hooks
   */
  private getNeededHooks(element: FigmaElement): string[] {
    const hooks: string[] = [];

    // Add hooks based on element functionality
    if (this.isInteractiveElement(element)) {
      hooks.push('useKeyboardNavigation');
    }

    if (this.hasFormElements(element)) {
      hooks.push('useFormValidation');
    }

    if (this.hasAnimations(element)) {
      hooks.push('useAnimation');
    }

    return hooks;
  }

  /**
   * Resolve type imports
   */
  private resolveTypeImports(element: FigmaElement): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const types = this.getNeededTypes(element);

    if (types.length > 0) {
      imports.push({
        source: this.options.projectStructure.typesPath,
        imports: types.map(type => ({ name: type, isDefault: false })),
        isTypeOnly: true
      });
    }

    return imports;
  }

  /**
   * Get needed type imports
   */
  private getNeededTypes(element: FigmaElement): string[] {
    const types: string[] = [];

    // Add common types
    types.push('ComponentProps');

    // Add element-specific types
    if (element.type === 'button') {
      types.push('ButtonVariant', 'ButtonSize');
    }

    if (element.type === 'input') {
      types.push('InputType', 'ValidationRule');
    }

    return types;
  }

  /**
   * Deduplicate and merge import statements
   */
  private deduplicateImports(imports: ImportStatement[]): ImportStatement[] {
    const importMap = new Map<string, ImportStatement>();

    imports.forEach(importStmt => {
      const existing = importMap.get(importStmt.source);
      if (existing) {
        // Merge imports from same source
        const mergedImports = [...existing.imports];
        importStmt.imports.forEach(newImport => {
          if (!mergedImports.some(existing => existing.name === newImport.name)) {
            mergedImports.push(newImport);
          }
        });
        existing.imports = mergedImports;
      } else {
        importMap.set(importStmt.source, { ...importStmt });
      }
    });

    return Array.from(importMap.values());
  }

  /**
   * Initialize component mappings
   */
  private initializeComponentMappings(): void {
    this.options.customMappings.forEach(mapping => {
      this.componentMappings.set(mapping.figmaType, mapping);
    });
  }

  /**
   * Initialize standard imports
   */
  private initializeStandardImports(): void {
    // React
    this.standardImports.set('react', {
      source: 'react',
      imports: [{ name: 'React', isDefault: false }]
    });

    // Common utilities
    this.standardImports.set('cn', {
      source: '@/lib/utils',
      imports: [{ name: 'cn', isDefault: false }]
    });
  }

  /**
   * Helper methods for checking element needs
   */
  private needsFormLibrary(element: FigmaElement): boolean {
    return this.hasFormElements(element) && this.hasMultipleInputs(element);
  }

  private needsAnimationLibrary(element: FigmaElement): boolean {
    return this.hasAnimations(element) || this.hasTransitions(element);
  }

  private needsDatePicker(element: FigmaElement): boolean {
    return element.name.toLowerCase().includes('date') || 
           element.name.toLowerCase().includes('calendar');
  }

  private isInteractiveElement(element: FigmaElement): boolean {
    return ['button', 'input'].includes(element.type);
  }

  private hasFormElements(element: FigmaElement): boolean {
    if (element.type === 'input') return true;
    return element.children?.some(child => this.hasFormElements(child)) || false;
  }

  private hasMultipleInputs(element: FigmaElement): boolean {
    const inputCount = this.countInputs(element);
    return inputCount > 1;
  }

  private countInputs(element: FigmaElement): number {
    let count = element.type === 'input' ? 1 : 0;
    if (element.children) {
      count += element.children.reduce((sum, child) => sum + this.countInputs(child), 0);
    }
    return count;
  }

  private hasAnimations(element: FigmaElement): boolean {
    // Check for animation hints in element name or properties
    const name = element.name.toLowerCase();
    return name.includes('animate') || name.includes('transition') || name.includes('fade');
  }

  private hasTransitions(element: FigmaElement): boolean {
    // Check for transition needs
    return element.name.toLowerCase().includes('modal') || 
           element.name.toLowerCase().includes('dropdown');
  }

  /**
   * Utility method to convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Generate import statements as strings
   */
  generateImportStrings(imports: ImportStatement[]): string[] {
    return imports.map(importStmt => {
      const { source, imports: importItems, isTypeOnly } = importStmt;
      
      const defaultImports = importItems.filter(item => item.isDefault);
      const namedImports = importItems.filter(item => !item.isDefault);
      
      const importParts: string[] = [];
      
      // Add default imports
      if (defaultImports.length > 0) {
        importParts.push(defaultImports.map(item => item.alias || item.name).join(', '));
      }
      
      // Add named imports
      if (namedImports.length > 0) {
        const namedPart = namedImports.map(item => 
          item.alias ? `${item.name} as ${item.alias}` : item.name
        ).join(', ');
        importParts.push(`{ ${namedPart} }`);
      }
      
      const typePrefix = isTypeOnly ? 'type ' : '';
      return `import ${typePrefix}${importParts.join(', ')} from '${source}';`;
    });
  }
}