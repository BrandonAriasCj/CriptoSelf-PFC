/**
 * Component generation interfaces for React component creation
 */

// Generated React component structure
export interface GeneratedComponent {
  name: string;
  filePath: string;
  imports: ImportStatement[];
  props: ComponentProps;
  jsx: string;
  exports: ExportStatement[];
  dependencies?: string[];
}

// Import statement configuration
export interface ImportStatement {
  source: string;
  imports: ImportItem[];
  isTypeOnly?: boolean;
}

// Individual import item
export interface ImportItem {
  name: string;
  alias?: string;
  isDefault?: boolean;
}

// Export statement configuration
export interface ExportStatement {
  name: string;
  isDefault?: boolean;
  isType?: boolean;
}

// Component props definition
export interface ComponentProps {
  [key: string]: PropDefinition;
}

// Individual prop definition
export interface PropDefinition {
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: PropValidation;
}

// Prop validation rules
export interface PropValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  custom?: string;
}

// Component mapping from Figma to React
export interface ComponentMapping {
  figmaType: string;
  reactComponent: string;
  propsMapping: Record<string, string>;
  styleMapping: Record<string, string>;
  accessibilityAttributes: string[];
  defaultProps?: Record<string, any>;
  requiredImports?: ImportStatement[];
}

// Tailwind CSS class mapping
export interface TailwindMapping {
  figmaProperty: string;
  tailwindClass: string;
  valueMapping?: Record<string, string>;
  transformer?: (value: any) => string | null;
}

// Component generation context
export interface GenerationContext {
  projectConfig: any; // Will be typed as ProjectConfig when imported
  existingComponents: Map<string, ComponentInfo>;
  uiLibrary: UILibraryConfig;
  namingConventions: NamingConventions;
}

// Existing component information
export interface ComponentInfo {
  name: string;
  filePath: string;
  props: ComponentProps;
  variants?: string[];
  category?: string;
}

// UI library configuration
export interface UILibraryConfig {
  name: string;
  components: ComponentLibraryItem[];
  utilities: {
    classNames: string;
    variants: string;
  };
  theme?: Record<string, any>;
}

// Component library item
export interface ComponentLibraryItem {
  name: string;
  importPath: string;
  props: ComponentProps;
  variants?: Record<string, any>;
  examples?: string[];
}

// Naming conventions
export interface NamingConventions {
  componentNaming: 'PascalCase' | 'camelCase';
  fileNaming: 'ComponentName.tsx' | 'component-name.tsx' | 'componentName.tsx';
  propsInterface: 'ComponentNameProps' | 'ComponentProps' | 'Props';
  exportPattern: 'named' | 'default' | 'both';
}