/**
 * Project configuration loader to read existing project structure and conventions
 */

import type { 
  ProjectConfig, 
  ProjectStructure, 
  ProjectDependencies,
  NamingConventions,
  StylingConfig,
  UILibraryConfig
} from '../types/index.js';

/**
 * Loads project configuration from various sources
 * @param projectRoot - Root directory of the project
 * @returns Complete project configuration
 */
export async function loadProjectConfig(projectRoot: string = '.'): Promise<ProjectConfig> {
  const packageJson = await loadPackageJson(projectRoot);
  const tsConfig = await loadTSConfig(projectRoot);
  const viteConfig = await loadViteConfig(projectRoot);
  const tailwindConfig = await loadTailwindConfig(projectRoot);
  
  return {
    framework: 'react',
    typescript: hasTypeScript(packageJson, tsConfig),
    bundler: detectBundler(packageJson, viteConfig),
    compiler: detectCompiler(packageJson, viteConfig),
    uiLibrary: detectUILibrary(packageJson),
    styling: detectStylingConfig(packageJson, tailwindConfig),
    conventions: detectNamingConventions(projectRoot),
    structure: detectProjectStructure(projectRoot),
    dependencies: extractDependencies(packageJson)
  };
}

/**
 * Loads and parses package.json
 * @param projectRoot - Project root directory
 * @returns Parsed package.json content
 */
async function loadPackageJson(projectRoot: string): Promise<any> {
  try {
    // In a real implementation, this would read from the file system
    // For now, we'll return a mock structure based on common React + Vite projects
    return {
      name: 'figma-react-project',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@radix-ui/react-button': '^1.0.0',
        '@radix-ui/react-input': '^1.0.0',
        'lucide-react': '^0.263.1',
        'class-variance-authority': '^0.7.0',
        clsx: '^2.0.0',
        'tailwind-merge': '^1.14.0'
      },
      devDependencies: {
        '@types/react': '^18.2.15',
        '@types/react-dom': '^18.2.7',
        '@vitejs/plugin-react-swc': '^3.3.2',
        typescript: '^5.0.2',
        vite: '^4.4.5',
        tailwindcss: '^3.3.0',
        autoprefixer: '^10.4.14',
        postcss: '^8.4.24'
      }
    };
  } catch (error) {
    console.warn('Could not load package.json:', error);
    return {};
  }
}

/**
 * Loads TypeScript configuration
 * @param projectRoot - Project root directory
 * @returns TypeScript configuration
 */
async function loadTSConfig(projectRoot: string): Promise<any> {
  try {
    // Mock TypeScript config for Vite + React + SWC
    return {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*']
        }
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }]
    };
  } catch (error) {
    console.warn('Could not load tsconfig.json:', error);
    return {};
  }
}

/**
 * Loads Vite configuration
 * @param projectRoot - Project root directory
 * @returns Vite configuration
 */
async function loadViteConfig(projectRoot: string): Promise<any> {
  try {
    // Mock Vite config
    return {
      plugins: ['@vitejs/plugin-react-swc'],
      resolve: {
        alias: {
          '@': '/src'
        }
      }
    };
  } catch (error) {
    console.warn('Could not load vite.config:', error);
    return {};
  }
}

/**
 * Loads Tailwind CSS configuration
 * @param projectRoot - Project root directory
 * @returns Tailwind configuration
 */
async function loadTailwindConfig(projectRoot: string): Promise<any> {
  try {
    // Mock Tailwind config
    return {
      content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
      theme: {
        extend: {}
      },
      plugins: []
    };
  } catch (error) {
    console.warn('Could not load tailwind.config:', error);
    return {};
  }
}

/**
 * Detects if TypeScript is used in the project
 * @param packageJson - Package.json content
 * @param tsConfig - TypeScript configuration
 * @returns True if TypeScript is detected
 */
function hasTypeScript(packageJson: any, tsConfig: any): boolean {
  return !!(
    packageJson.devDependencies?.typescript ||
    packageJson.dependencies?.typescript ||
    tsConfig.compilerOptions
  );
}

/**
 * Detects the bundler used in the project
 * @param packageJson - Package.json content
 * @param viteConfig - Vite configuration
 * @returns Detected bundler
 */
function detectBundler(packageJson: any, viteConfig: any): 'vite' | 'webpack' | 'rollup' | 'parcel' {
  if (packageJson.devDependencies?.vite || viteConfig.plugins) {
    return 'vite';
  }
  if (packageJson.devDependencies?.webpack) {
    return 'webpack';
  }
  if (packageJson.devDependencies?.rollup) {
    return 'rollup';
  }
  if (packageJson.devDependencies?.parcel) {
    return 'parcel';
  }
  return 'vite'; // Default assumption
}

/**
 * Detects the compiler used in the project
 * @param packageJson - Package.json content
 * @param viteConfig - Vite configuration
 * @returns Detected compiler
 */
function detectCompiler(packageJson: any, viteConfig: any): 'swc' | 'babel' | 'tsc' {
  if (packageJson.devDependencies?.['@vitejs/plugin-react-swc'] || 
      viteConfig.plugins?.includes('@vitejs/plugin-react-swc')) {
    return 'swc';
  }
  if (packageJson.devDependencies?.['@babel/core']) {
    return 'babel';
  }
  return 'swc'; // Default for modern Vite setups
}

/**
 * Detects UI library configuration
 * @param packageJson - Package.json content
 * @returns UI library configuration
 */
function detectUILibrary(packageJson: any): UILibraryConfig {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Detect Radix UI components
  const radixComponents = Object.keys(dependencies)
    .filter(dep => dep.startsWith('@radix-ui/'))
    .map(dep => dep.replace('@radix-ui/react-', ''));
  
  return {
    name: 'radix-ui',
    components: [
      {
        name: 'Button',
        importPath: '@radix-ui/react-button',
        props: {
          variant: { type: 'string', required: false },
          size: { type: 'string', required: false },
          disabled: { type: 'boolean', required: false }
        }
      },
      {
        name: 'Input',
        importPath: '@radix-ui/react-input',
        props: {
          placeholder: { type: 'string', required: false },
          value: { type: 'string', required: false },
          onChange: { type: 'function', required: false }
        }
      }
    ],
    utilities: {
      classNames: dependencies.clsx ? 'cn' : 'clsx',
      variants: dependencies['class-variance-authority'] ? 'cva' : ''
    }
  };
}

/**
 * Detects styling configuration
 * @param packageJson - Package.json content
 * @param tailwindConfig - Tailwind configuration
 * @returns Styling configuration
 */
function detectStylingConfig(packageJson: any, tailwindConfig: any): StylingConfig {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (dependencies.tailwindcss) {
    return {
      framework: 'tailwind',
      customClasses: true,
      responsiveBreakpoints: ['sm', 'md', 'lg', 'xl', '2xl'],
      theme: tailwindConfig.theme || {},
      prefix: tailwindConfig.prefix || '',
      important: tailwindConfig.important || false
    };
  }
  
  return {
    framework: 'tailwind', // Default assumption
    customClasses: true,
    responsiveBreakpoints: ['sm', 'md', 'lg', 'xl', '2xl']
  };
}

/**
 * Detects naming conventions from existing files
 * @param projectRoot - Project root directory
 * @returns Detected naming conventions
 */
function detectNamingConventions(projectRoot: string): NamingConventions {
  // In a real implementation, this would scan existing files
  // For now, return common React conventions
  return {
    componentNaming: 'PascalCase',
    fileNaming: 'ComponentName.tsx',
    propsInterface: 'ComponentNameProps',
    exportPattern: 'named'
  };
}

/**
 * Detects project structure from directory layout
 * @param projectRoot - Project root directory
 * @returns Detected project structure
 */
function detectProjectStructure(projectRoot: string): ProjectStructure {
  // In a real implementation, this would scan the directory structure
  // For now, return common Vite + React structure
  return {
    srcDirectory: 'src',
    componentsDirectory: 'components',
    typesDirectory: 'types',
    utilsDirectory: 'utils',
    stylesDirectory: 'styles',
    testDirectory: '__tests__',
    publicDirectory: 'public'
  };
}

/**
 * Extracts dependencies from package.json
 * @param packageJson - Package.json content
 * @returns Project dependencies
 */
function extractDependencies(packageJson: any): ProjectDependencies {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  return {
    react: deps.react || '^18.2.0',
    typescript: deps.typescript,
    tailwindcss: deps.tailwindcss,
    radixUI: Object.keys(deps).filter(dep => dep.startsWith('@radix-ui/')),
    lucideReact: deps['lucide-react'],
    classVarianceAuthority: deps['class-variance-authority'],
    clsx: deps.clsx,
    tailwindMerge: deps['tailwind-merge'],
    ...deps
  };
}

/**
 * Validates project configuration for compatibility
 * @param config - Project configuration to validate
 * @returns Validation result with issues and suggestions
 */
export function validateProjectConfig(config: ProjectConfig): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for required dependencies
  if (!config.dependencies.react) {
    issues.push('React is not installed');
    suggestions.push('Install React: npm install react react-dom');
  }
  
  if (config.typescript && !config.dependencies.typescript) {
    issues.push('TypeScript is configured but not installed');
    suggestions.push('Install TypeScript: npm install -D typescript @types/react @types/react-dom');
  }
  
  if (config.styling.framework === 'tailwind' && !config.dependencies.tailwindcss) {
    issues.push('Tailwind CSS is configured but not installed');
    suggestions.push('Install Tailwind CSS: npm install -D tailwindcss postcss autoprefixer');
  }
  
  // Check for SWC compatibility
  if (config.compiler === 'swc' && config.bundler === 'vite') {
    const hasSwcPlugin = config.dependencies['@vitejs/plugin-react-swc'];
    if (!hasSwcPlugin) {
      issues.push('SWC compiler configured but Vite SWC plugin not found');
      suggestions.push('Install Vite SWC plugin: npm install -D @vitejs/plugin-react-swc');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}