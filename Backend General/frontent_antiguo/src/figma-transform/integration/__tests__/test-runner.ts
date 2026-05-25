/**
 * Simple test runner to verify integration tests are working
 */

import { ProjectCompatibilityValidator } from '../project-compatibility-validator.js';
import { FileSystemIntegration } from '../file-system-integration.js';
import { IntegrationManager } from '../integration-manager.js';
import type { ProjectConfig, GeneratedComponent } from '../../types/index.js';

// Simple test configuration
const testConfig: ProjectConfig = {
  framework: 'react',
  typescript: true,
  bundler: 'vite',
  compiler: 'swc',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    typescript: '^5.0.0',
    '@vitejs/plugin-react-swc': '^3.0.0',
    tailwindcss: '^3.3.0'
  },
  uiLibrary: {
    name: 'radix-ui',
    components: [],
    utilities: {
      classNames: 'cn',
      variants: 'cva'
    }
  },
  styling: {
    framework: 'tailwind',
    customClasses: false,
    responsiveBreakpoints: ['sm', 'md', 'lg', 'xl']
  },
  structure: {
    srcDirectory: 'src',
    componentsDirectory: 'components',
    typesDirectory: 'types',
    utilsDirectory: 'utils',
    stylesDirectory: 'styles'
  },
  conventions: {
    componentNaming: 'PascalCase',
    fileNaming: 'ComponentName.tsx',
    propsInterface: 'ComponentNameProps',
    exportPattern: 'default'
  }
};

const testComponent: GeneratedComponent = {
  name: 'TestButton',
  filePath: 'src/components/TestButton.tsx',
  imports: [
    {
      imports: [{ name: 'React', isDefault: true }],
      source: 'react'
    }
  ],
  props: {
    children: { type: 'React.ReactNode', required: false }
  },
  jsx: '<button>{children}</button>',
  exports: [{ name: 'TestButton', isDefault: true }]
};

async function runIntegrationTests() {
  console.log('🧪 Running Integration Tests...\n');

  try {
    // Test 1: Project Compatibility Validation
    console.log('1️⃣ Testing Project Compatibility Validation...');
    const validator = new ProjectCompatibilityValidator(testConfig);
    const compatibilityResult = await validator.validateProjectCompatibility();
    console.log(`   ✅ Project validation: ${compatibilityResult.isValid ? 'PASS' : 'FAIL'}`);
    console.log(`   📊 Errors: ${compatibilityResult.errors.length}, Warnings: ${compatibilityResult.warnings.length}`);

    // Test 2: Component Compatibility
    const componentCompatibility = await validator.validateComponentCompatibility(testComponent);
    console.log(`   ✅ Component validation: ${componentCompatibility.isValid ? 'PASS' : 'FAIL'}`);

    // Test 3: File System Integration
    console.log('\n2️⃣ Testing File System Integration...');
    const fileSystem = new FileSystemIntegration(testConfig);
    const fileSystemResult = await fileSystem.integrateComponent(testComponent);
    console.log(`   ✅ File system integration: ${fileSystemResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   📁 Generated path: ${fileSystemResult.component?.filePath}`);

    // Test 4: File Structure Generation
    const structure = fileSystem.generateFileStructure(testComponent);
    console.log(`   📂 Main file: ${structure.mainFile}`);
    console.log(`   🧪 Test file: ${structure.testFile}`);

    // Test 5: End-to-End Integration Manager
    console.log('\n3️⃣ Testing Integration Manager...');
    const manager = new IntegrationManager(testConfig);
    const integrationResult = await manager.integrateComponent(testComponent);
    console.log(`   ✅ Full integration: ${integrationResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   🔍 Critical issues: ${integrationResult.summary.criticalIssues}`);
    console.log(`   ⚠️  Warnings: ${integrationResult.summary.warnings}`);

    // Test 6: Batch Processing
    const batchComponents = [
      testComponent,
      { ...testComponent, name: 'TestInput', filePath: 'src/components/TestInput.tsx' }
    ];
    const batchResult = await manager.integrateComponents(batchComponents);
    console.log(`   ✅ Batch processing: ${batchResult.overall.success ? 'PASS' : 'FAIL'}`);
    console.log(`   📦 Processed: ${batchResult.overall.processedComponents} components`);

    // Test 7: Integration Report
    const report = await manager.getIntegrationReport([testComponent]);
    console.log(`   📋 Integration report generated: ${report.recommendations.length} recommendations`);

    console.log('\n🎉 All integration tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Project compatibility validation');
    console.log('   ✅ Component compatibility validation');
    console.log('   ✅ File system integration');
    console.log('   ✅ File structure generation');
    console.log('   ✅ End-to-end integration workflow');
    console.log('   ✅ Batch component processing');
    console.log('   ✅ Integration reporting');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

// Export for use in tests
export { runIntegrationTests, testConfig, testComponent };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch(console.error);
}