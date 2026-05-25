/**
 * Project configuration interfaces for integration with existing projects
 */

// Main project configuration
export interface ProjectConfig {
  framework: 'react';
  typescript: boolean;
  bundler: 'vite' | 'webpack' | 'rollup' | 'parcel';
  compiler: 'swc' | 'babel' | 'tsc';
  uiLibrary: any; // Will be typed as UILibraryConfig when imported
  styling: StylingConfig;
  conventions: any; // Will be typed as NamingConventions when imported
  structure: ProjectStructure;
  dependencies: ProjectDependencies;
}

// Styling framework configuration
export interface StylingConfig {
  framework: 'tailwind' | 'styled-components' | 'emotion' | 'css-modules';
  customClasses: boolean;
  responsiveBreakpoints: string[];
  theme?: Record<string, any>;
  prefix?: string;
  important?: boolean;
}

// Project structure configuration
export interface ProjectStructure {
  srcDirectory: string;
  componentsDirectory: string;
  typesDirectory: string;
  utilsDirectory: string;
  stylesDirectory: string;
  testDirectory?: string;
  publicDirectory?: string;
}

// Project dependencies
export interface ProjectDependencies {
  react: string;
  typescript?: string;
  tailwindcss?: string;
  radixUI?: string[];
  lucideReact?: string;
  classVarianceAuthority?: string;
  clsx?: string;
  tailwindMerge?: string;
  [key: string]: string | string[] | undefined;
}

// Build configuration
export interface BuildConfig {
  target: string[];
  outDir: string;
  sourcemap: boolean;
  minify: boolean;
  cssCodeSplit?: boolean;
  rollupOptions?: Record<string, any>;
}

// Development server configuration
export interface DevServerConfig {
  port: number;
  host: string;
  open: boolean;
  cors: boolean;
  proxy?: Record<string, any>;
}

// Environment configuration
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PUBLIC_URL?: string;
  VITE_APP_TITLE?: string;
  [key: string]: string | undefined;
}

// Code quality configuration
export interface CodeQualityConfig {
  eslint: {
    enabled: boolean;
    configPath?: string;
    rules?: Record<string, any>;
  };
  prettier: {
    enabled: boolean;
    configPath?: string;
    options?: Record<string, any>;
  };
  typescript: {
    strict: boolean;
    configPath?: string;
    compilerOptions?: Record<string, any>;
  };
}

// Testing configuration
export interface TestingConfig {
  framework: 'vitest' | 'jest' | 'testing-library';
  setupFiles?: string[];
  testMatch?: string[];
  coverage?: {
    enabled: boolean;
    threshold?: number;
    reporters?: string[];
  };
}

// Accessibility configuration
export interface AccessibilityConfig {
  enabled: boolean;
  standards: ('WCAG2A' | 'WCAG2AA' | 'WCAG2AAA')[];
  autoFix: boolean;
  reportLevel: 'error' | 'warn' | 'info';
}

// Performance configuration
export interface PerformanceConfig {
  bundleAnalysis: boolean;
  treeshaking: boolean;
  codesplitting: boolean;
  lazyLoading: boolean;
  imageOptimization?: boolean;
}