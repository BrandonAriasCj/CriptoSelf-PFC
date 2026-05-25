/**
 * Pages exports
 * Main application pages organized by functionality
 */

// Trading and Portfolio pages
export { TradingDashboard } from './TradingDashboard';
export { default as Portfolio } from './Portfolio';

// Strategy pages
export { StrategyBuilder } from './StrategyBuilder';
export { BacktestResults } from './BacktestResults';

// Re-export component pages that are still in components folder
export { MyStrategy } from '../components/MyStrategy';
export { Settings } from '../components/Settings';
export { Education } from '../components/Education';