import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import AddTrade from './pages/AddTrade';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import Goals from './pages/Goals';
import Certificates from './pages/Certificates';
import Calculator from './pages/Calculator';
import Payouts from './pages/Payouts';
import GlobalPerformance from './pages/GlobalPerformance';
import AIInsights from './pages/AIInsights';
import Admin from './pages/Admin';
import Users from './pages/Users';
import Settings from './pages/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout currentPageName="Dashboard"><Dashboard /></Layout>} />
          <Route path="/journal" element={<Layout currentPageName="Journal"><Journal /></Layout>} />
          <Route path="/add-trade" element={<Layout currentPageName="AddTrade"><AddTrade /></Layout>} />
          <Route path="/analytics" element={<Layout currentPageName="Analytics"><Analytics /></Layout>} />
          <Route path="/calendar" element={<Layout currentPageName="Calendar"><Calendar /></Layout>} />
          <Route path="/goals" element={<Layout currentPageName="Goals"><Goals /></Layout>} />
          <Route path="/certificates" element={<Layout currentPageName="Certificates"><Certificates /></Layout>} />
          <Route path="/calculator" element={<Layout currentPageName="Calculator"><Calculator /></Layout>} />
          <Route path="/payouts" element={<Layout currentPageName="Payouts"><Payouts /></Layout>} />
          <Route path="/global-performance" element={<Layout currentPageName="GlobalPerformance"><GlobalPerformance /></Layout>} />
          <Route path="/ai-insights" element={<Layout currentPageName="AIInsights"><AIInsights /></Layout>} />
          <Route path="/admin" element={<Layout currentPageName="Admin"><Admin /></Layout>} />
          <Route path="/users" element={<Layout currentPageName="Users"><Users /></Layout>} />
          <Route path="/settings" element={<Layout currentPageName="Settings"><Settings /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;