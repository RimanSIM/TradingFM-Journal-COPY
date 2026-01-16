import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Globe, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  Filter,
  Target,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatsCard from '../components/dashboard/StatsCard';
import TradeTable from '../components/dashboard/TradeTable';
import PremiumEquityCurve from '../components/charts/PremiumEquityCurve';
import UserAvatar from '../components/UserAvatar';

const TRADERS = ['Haidar', 'MMX', 'Riman', 'Abdin', 'Reitrac', 'Cartier'];

const TRADER_EMAILS = {
  'Haidar': 'haidarmustafa456@gmail.com',
  'MMX': 'mohamadkanbar321@gmail.com',
  'Riman': 'rimanmustafa206@gmail.com',
  'Abdin': 'abdin.m2008@gmail.com',
  'Reitrac': 'abdinm237@gmail.com',
  'Cartier': 'cartier@tradingfm.com'
};

const MASTER_SYMBOLS = ['XAUUSD', 'XAGUSD', 'GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM', 'NAS100', 'BTC'];

export default function GlobalPerformance() {
  const [traderFilter, setTraderFilter] = useState('all');
  const [symbolFilter, setSymbolFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    timePeriod: 'all'
  });
  const [activeTab, setActiveTab] = useState('trades');

  const { data: allTrades = [], isLoading } = useQuery({
    queryKey: ['allTrades'],
    queryFn: () => base44.entities.Trade.list('-entry_time'),
  });

  // Filter trades
  const filteredTrades = allTrades.filter(trade => {
    if (traderFilter !== 'all' && trade.trader_name !== traderFilter) return false;
    if (symbolFilter !== 'all' && trade.symbol !== symbolFilter) return false;
    if (sessionFilter !== 'all' && trade.session !== sessionFilter) return false;
    if (accountFilter !== 'all' && trade.account_type !== accountFilter) return false;
    if (resultFilter !== 'all' && trade.result !== resultFilter) return false;
    
    // Time period filter
    if (trade.entry_time && filters.timePeriod !== 'all') {
      const tradeDate = new Date(trade.entry_time);
      const now = new Date();
      
      switch (filters.timePeriod) {
        case 'today':
          if (tradeDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (tradeDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (tradeDate < monthAgo) return false;
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          if (tradeDate < yearAgo) return false;
          break;
      }
    }
    
    // Date range filter
    if (trade.entry_time && (filters.fromDate || filters.toDate)) {
      const tradeDate = new Date(trade.entry_time);
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        if (tradeDate < from) return false;
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate);
        to.setHours(23, 59, 59);
        if (tradeDate > to) return false;
      }
    }
    
    return true;
  });

  // Get symbols from database + master list
  const dbSymbols = [...new Set(allTrades.map(t => t.symbol).filter(Boolean))];
  const allSymbols = [...new Set([...MASTER_SYMBOLS, ...dbSymbols])].sort();

  // Performance by Trader - Leaderboards
  const traderPerformance = TRADERS.map(trader => {
    const traderTrades = allTrades.filter(t => t.trader_name === trader);
    const totalPnL = traderTrades.reduce((sum, t) => {
      const pnl = t.pnl || 0;
      return sum + (t.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl));
    }, 0);
    // Apply sign based on result: Loss = negative, Win = positive
    const totalPips = traderTrades.reduce((sum, t) => {
      const pips = Math.abs(t.exit_pips || 0);
      return sum + (t.result === 'Loss' ? -pips : pips);
    }, 0);
    const wins = traderTrades.filter(t => t.result === 'Win').length;
    const totalTrades = traderTrades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const bestTrade = Math.max(...traderTrades.filter(t => t.result === 'Win').map(t => Math.abs(t.pnl || 0)), 0);
    const worstTrade = Math.min(...traderTrades.filter(t => t.result === 'Loss').map(t => -Math.abs(t.pnl || 0)), 0);
    
    const avgWin = wins > 0 ? traderTrades.filter(t => t.result === 'Win').reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / wins : 0;
    const losses = traderTrades.filter(t => t.result === 'Loss').length;
    const avgLoss = losses > 0 ? Math.abs(traderTrades.filter(t => t.result === 'Loss').reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / losses) : 0;
    
    // Fix Profit Factor edge cases
    let profitFactor = 0;
    if (losses === 0 && wins > 0) {
      profitFactor = Infinity; // No losses = infinite profit factor
    } else if (avgLoss > 0 && losses > 0) {
      profitFactor = (avgWin * wins) / (avgLoss * losses);
    }
    // Calculate Avg R properly - only from trades with valid RRR
    const tradesWithRRR = traderTrades.filter(t => t.rrr && t.rrr.includes(':'));
    const avgR = tradesWithRRR.length > 0 
      ? tradesWithRRR.reduce((sum, t) => sum + (parseFloat(t.rrr.split(':')[1]) || 0), 0) / tradesWithRRR.length 
      : 0;

    // Equity curve data
    let runningPnL = 0;
    const equityCurve = traderTrades.slice().reverse().map((trade, index) => {
      const pnl = trade.pnl || 0;
      const adjustedPnl = trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
      runningPnL += adjustedPnl;
      return {
        trade: index + 1,
        equity: runningPnL,
        date: trade.entry_time ? format(new Date(trade.entry_time), 'MMM d') : ''
      };
    });

    return {
      name: trader,
      totalPnL,
      totalPips,
      winRate,
      totalTrades,
      bestTrade,
      worstTrade,
      profitFactor,
      avgR,
      equityCurve
    };
  });

  const tradersByPnL = [...traderPerformance].sort((a, b) => b.totalPnL - a.totalPnL);
  const tradersByPips = [...traderPerformance].sort((a, b) => b.totalPips - a.totalPips);

  // Performance by Setup
  const setupPerformance = allTrades.reduce((acc, trade) => {
    const setups = trade.setup || [];
    setups.forEach(setup => {
      if (!acc[setup]) {
        acc[setup] = { wins: 0, losses: 0, trades: 0, pnl: 0 };
      }
      acc[setup].trades++;
      const pnl = trade.pnl || 0;
      acc[setup].pnl += trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
      if (trade.result === 'Win') acc[setup].wins++;
      if (trade.result === 'Loss') acc[setup].losses++;
    });
    return acc;
  }, {});

  const setupData = Object.entries(setupPerformance).map(([setup, data]) => ({
    setup,
    trades: data.trades,
    pnl: data.pnl,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    lossRate: data.trades > 0 ? (data.losses / data.trades) * 100 : 0,
  })).sort((a, b) => b.winRate - a.winRate);

  // Performance by Symbol
  const symbolPerformance = allTrades.reduce((acc, trade) => {
    const symbol = trade.symbol;
    if (!symbol) return acc;
    if (!acc[symbol]) {
      acc[symbol] = { wins: 0, losses: 0, trades: 0, pnl: 0, totalDuration: 0 };
    }
    acc[symbol].trades++;
    const pnl = trade.pnl || 0;
    acc[symbol].pnl += trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
    if (trade.result === 'Win') acc[symbol].wins++;
    if (trade.result === 'Loss') acc[symbol].losses++;
    return acc;
  }, {});

  const symbolData = Object.entries(symbolPerformance).map(([symbol, data]) => ({
    symbol,
    trades: data.trades,
    pnl: data.pnl,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
  })).sort((a, b) => b.pnl - a.pnl);

  // Performance by Session
  const sessionPerformance = allTrades.reduce((acc, trade) => {
    const session = trade.session;
    if (!session) return acc;
    if (!acc[session]) {
      acc[session] = { wins: 0, losses: 0, trades: 0, pnl: 0 };
    }
    acc[session].trades++;
    const pnl = trade.pnl || 0;
    acc[session].pnl += trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
    if (trade.result === 'Win') acc[session].wins++;
    if (trade.result === 'Loss') acc[session].losses++;
    return acc;
  }, {});

  const sessionData = Object.entries(sessionPerformance).map(([session, data]) => ({
    session,
    trades: data.trades,
    pnl: data.pnl,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
  }));

  // Global stats (all trades)
  const totalPnL = allTrades.reduce((sum, t) => {
    const pnl = t.pnl || 0;
    return sum + (t.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl));
  }, 0);
  const totalWins = allTrades.filter(t => t.result === 'Win').length;
  const totalTradesCount = allTrades.length;
  const globalWinRate = totalTradesCount > 0 ? (totalWins / totalTradesCount) * 100 : 0;
  // Apply sign based on result: Loss = negative, Win = positive
  const totalAccumulatedPips = allTrades.reduce((sum, t) => {
    const pips = Math.abs(t.exit_pips || 0);
    return sum + (t.result === 'Loss' ? -pips : pips);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Global Performance</h1>
            <p className="text-gray-400">View all traders' performance and recent trades</p>
          </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total P&L" 
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`}
          icon={TrendingUp}
          variant={totalPnL >= 0 ? 'success' : 'danger'}
        />
        <StatsCard 
          title="Global Win Rate" 
          value={`${globalWinRate.toFixed(1)}%`}
          icon={Target}
          variant="accent"
        />
        <StatsCard 
          title="Total Trades" 
          value={totalTradesCount}
          icon={BarChart3}
          variant="default"
        />
        <StatsCard 
          title="Accumulated Pips" 
          value={`${totalAccumulatedPips >= 0 ? '+' : ''}${totalAccumulatedPips.toFixed(1)}`}
          icon={Clock}
          variant={totalAccumulatedPips >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Filters */}
      <div className="space-y-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Filters</span>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={traderFilter} onValueChange={setTraderFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="Trader" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px] overflow-y-auto">
              <SelectItem value="all">All Traders</SelectItem>
              {TRADERS.map(trader => (
                <SelectItem key={trader} value={trader}>{trader}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={symbolFilter} onValueChange={setSymbolFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px] overflow-y-auto">
              <SelectItem value="all">All Symbols</SelectItem>
              {allSymbols.map(symbol => (
                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="No Session">No Session</SelectItem>
            </SelectContent>
          </Select>

          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="Demo">Demo</SelectItem>
              <SelectItem value="Evaluation">Evaluation</SelectItem>
              <SelectItem value="Funded">Funded</SelectItem>
              <SelectItem value="Live">Live</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="Win">Wins</SelectItem>
              <SelectItem value="Loss">Losses</SelectItem>
              <SelectItem value="Breakeven">Breakeven</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.timePeriod} onValueChange={(v) => setFilters(prev => ({ ...prev, timePeriod: v }))}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white h-9"
            placeholder="From Date"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white h-9"
            placeholder="To Date"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800/50 border border-gray-700/50">
          <TabsTrigger value="trades" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Recent Trades
          </TabsTrigger>
          <TabsTrigger value="traders" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            By Trader
          </TabsTrigger>
          <TabsTrigger value="setups" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            By Setup
          </TabsTrigger>
          <TabsTrigger value="symbols" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            By Symbol
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            By Session
          </TabsTrigger>
        </TabsList>

        {/* Recent Trades Tab */}
        <TabsContent value="trades" className="mt-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              All Traders' Recent Trades
            </h3>
            <TradeTable trades={filteredTrades.slice(0, 50)} showTrader={true} />
          </div>
        </TabsContent>

        {/* By Trader Tab */}
        <TabsContent value="traders" className="mt-6 space-y-6">
          {/* Leaderboard by Total P&L */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Leaderboard - By Total P&L
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trader</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Total P&L</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Win Rate</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trades</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Avg R</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Best Trade</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Worst Trade</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Profit Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {tradersByPnL.map((trader, index) => (
                    <tr key={trader.name} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/50 text-gray-500'}
                        `}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar email={TRADER_EMAILS[trader.name]} traderName={trader.name} size="md" />
                          <span className="font-medium text-white">{trader.name}</span>
                        </div>
                      </td>
                      <td className={`py-4 px-4 font-bold ${trader.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trader.totalPnL >= 0 ? '+' : ''}${trader.totalPnL.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`${trader.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trader.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{trader.totalTrades}</td>
                      <td className="py-4 px-4 text-gray-300">{trader.avgR.toFixed(2)}</td>
                      <td className="py-4 px-4 text-emerald-400">+${trader.bestTrade.toFixed(2)}</td>
                      <td className="py-4 px-4 text-red-400">${trader.worstTrade.toFixed(2)}</td>
                      <td className="py-4 px-4 text-gray-300">
                        {trader.profitFactor === Infinity ? '∞' : trader.profitFactor === 0 ? '—' : trader.profitFactor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Equity Curves for Top 3 */}
            <div className="mt-6 grid lg:grid-cols-3 gap-4">
              {tradersByPnL.slice(0, 3).map((trader, index) => (
                <div key={trader.name} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        'bg-orange-500/20 text-orange-400'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-semibold text-white">{trader.name}</span>
                  </div>
                  <PremiumEquityCurve data={trader.equityCurve} height={150} />
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard by Total Pips */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Leaderboard - By Total Accumulated Pips
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trader</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Total Pips</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Win Rate</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trades</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Avg R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {tradersByPips.map((trader, index) => (
                    <tr key={trader.name} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/50 text-gray-500'}
                        `}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar email={TRADER_EMAILS[trader.name]} traderName={trader.name} size="md" />
                          <span className="font-medium text-white">{trader.name}</span>
                        </div>
                      </td>
                      <td className={`py-4 px-4 font-bold ${trader.totalPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trader.totalPips >= 0 ? '+' : ''}{trader.totalPips.toFixed(1)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`${trader.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trader.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{trader.totalTrades}</td>
                      <td className="py-4 px-4 text-gray-300">{trader.avgR.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* By Setup Tab */}
        <TabsContent value="setups" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Win Rate by Setup Chart */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Win Rate by Setup</h3>
              <div className="h-64">
                {setupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setupData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                      <YAxis type="category" dataKey="setup" stroke="#9CA3AF" fontSize={11} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} 
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Win Rate']}
                      />
                      <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                        {setupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                )}
              </div>
            </div>

            {/* Loss Rate by Setup Chart */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Loss Rate by Setup</h3>
              <div className="h-64">
                {setupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setupData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                      <YAxis type="category" dataKey="setup" stroke="#9CA3AF" fontSize={11} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} 
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Loss Rate']}
                      />
                      <Bar dataKey="lossRate" fill="#EF4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                )}
              </div>
            </div>

            {/* Setup Performance Table */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Setup Performance Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Setup</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trades</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Win Rate</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Loss Rate</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Total P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {setupData.map((setup) => (
                      <tr key={setup.setup} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 px-4 font-medium text-white">{setup.setup}</td>
                        <td className="py-4 px-4 text-gray-300">{setup.trades}</td>
                        <td className={`py-4 px-4 ${setup.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {setup.winRate.toFixed(1)}%
                        </td>
                        <td className="py-4 px-4 text-red-400">{setup.lossRate.toFixed(1)}%</td>
                        <td className={`py-4 px-4 font-bold ${setup.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {setup.pnl >= 0 ? '+' : ''}${setup.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* By Symbol Tab */}
        <TabsContent value="symbols" className="mt-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Symbol</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Symbol</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Total Trades</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Win Rate</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Total P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {symbolData.map((symbol) => (
                    <tr key={symbol.symbol} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4 font-semibold text-white">{symbol.symbol}</td>
                      <td className="py-4 px-4 text-gray-300">{symbol.trades}</td>
                      <td className={`py-4 px-4 ${symbol.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {symbol.winRate.toFixed(1)}%
                      </td>
                      <td className={`py-4 px-4 font-bold ${symbol.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {symbol.pnl >= 0 ? '+' : ''}${symbol.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* By Session Tab */}
        <TabsContent value="sessions" className="mt-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Session</h3>
            <div className="grid lg:grid-cols-4 gap-4 mb-6">
              {sessionData.map((session) => (
                <div 
                  key={session.session}
                  className={`
                    p-4 rounded-xl border
                    ${session.session === 'Asia' ? 'bg-blue-500/10 border-blue-500/30' :
                      session.session === 'London' ? 'bg-red-500/10 border-red-500/30' :
                      session.session === 'New York' ? 'bg-emerald-500/10 border-emerald-500/30' :
                      'bg-gray-500/10 border-gray-500/30'}
                  `}
                >
                  <h4 className={`font-semibold mb-2 ${
                    session.session === 'Asia' ? 'text-blue-400' :
                    session.session === 'London' ? 'text-red-400' :
                    session.session === 'New York' ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {session.session}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trades:</span>
                      <span className="text-white">{session.trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className={session.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                        {session.winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">P&L:</span>
                      <span className={session.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {session.pnl >= 0 ? '+' : ''}${session.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}