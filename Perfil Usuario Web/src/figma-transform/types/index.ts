/**
 * Main types export file for Figma to React transformation system
 */

// Core Figma element types
export type {
  FigmaElement,
  ElementProperties,
  StyleProperties,
  LayoutConstraints,
  Spacing,
  BorderRadius,
  TypographyStyle,
  Shadow,
  Border,
  Fill,
  GradientStop,
  Effect
} from './core.js';

// Component generation types
export type {
  GeneratedComponent,
  ImportStatement,
  ImportItem,
  ExportStatement,
  ComponentProps,
  PropDefinition,
  PropValidation,
  ComponentMapping,
  TailwindMapping,
  GenerationContext,
  ComponentInfo,
  UILibraryConfig,
  ComponentLibraryItem,
  NamingConventions
} from './component.js';

// Project configuration types
export type {
  ProjectConfig,
  StylingConfig,
  ProjectStructure,
  ProjectDependencies,
  BuildConfig,
  DevServerConfig,
  EnvironmentConfig,
  CodeQualityConfig,
  TestingConfig,
  AccessibilityConfig,
  PerformanceConfig
} from './project.js';

// Validation and error handling types
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ErrorLocation,
  IntegrationResult,
  IntegrationConflict,
  ConflictResolution,
  ErrorRecoveryStrategy,
  RecoveryResult,
  FallbackStrategy,
  CodeQualityResult,
  QualityIssue,
  QualityMetrics
} from './validation.js';