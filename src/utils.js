// Utility functions for the TradingFM Journal app

export function createPageUrl(pageName) {
  // Simple page URL creator - converts page name to path
  // In a Base44 environment, this might generate proper Base44 URLs
  // For now, return a simple path
  const pageMap = {
    'Dashboard': '/',
    'Journal': '/journal',
    'AddTrade': '/add-trade',
    'Analytics': '/analytics',
    'Calendar': '/calendar',
    'Goals': '/goals',
    'Certificates': '/certificates',
    'Calculator': '/calculator',
    'Payouts': '/payouts',
    'GlobalPerformance': '/global-performance',
    'AIInsights': '/ai-insights',
    'Admin': '/admin',
    'Users': '/users',
    'Settings': '/settings'
  };
  
  return pageMap[pageName] || `/${pageName.toLowerCase()}`;
}
