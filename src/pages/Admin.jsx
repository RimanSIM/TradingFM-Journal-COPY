import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  BarChart3,
  AlertCircle,
  Trophy,
  Globe,
  DollarSign,
  Target,
  Clock,
  Filter
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from '../components/dashboard/StatsCard';
import TradeTable from '../components/dashboard/TradeTable';
import PremiumEquityCurve from '../components/charts/PremiumEquityCurve';
import UserAvatar from '../components/UserAvatar';
import { format } from 'date-fns';

const ADMIN_EMAIL = 'rimanmustafa2003@gmail.com';
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

export default function Admin() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    trader: 'all',
    symbol: 'all',
    session: 'all',
    account: 'all',
    result: 'all',
    timePeriod: 'all',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const { data: allTrades = [], isLoading } = useQuery({
    queryKey: ['adminAllTrades'],
    queryFn: () => base44.entities.Trade.list('-entry_time'),
  });

  const { data: allGoals = [] } = useQuery({
    queryKey: ['adminAllGoals'],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: allCertificates = [] } = useQuery({
    queryKey: ['adminAllCertificates'],
    queryFn: () => base44.entities.Certificate.list(),
  });

  const { data: allPayouts = [] } = useQuery({
    queryKey: ['adminAllPayouts'],
    queryFn: () => base44.entities.Payout.list('-date'),
  });

  // Check if user is admin
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 w-20 h-20 mx-auto flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-gray-400">
          You do not have permission to access the admin panel.
          <br />
          This area is restricted to administrators only.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get all symbols from trades + master list
  const dbSymbols = [...new Set(allTrades.map(t => t.symbol).filter(Boolean))];
  const allSymbols = [...new Set([...MASTER_SYMBOLS, ...dbSymbols])].sort();

  // Apply all filters to trades
  const filteredTrades = allTrades.filter(trade => {
    if (filters.trader !== 'all' && trade.trader_name !== filters.trader) return false;
    if (filters.symbol !== 'all' && trade.symbol !== filters.symbol) return false;
    if (filters.session !== 'all' && trade.session !== filters.session) return false;
    if (filters.account !== 'all' && trade.account_type !== filters.account) return false;
    if (filters.result !== 'all' && trade.result !== filters.result) return false;
    
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

  // Global stats
  const totalPnL = allTrades.reduce((sum, t) => {
    const pnl = t.pnl || 0;
    return sum + (t.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl));
  }, 0);
  const totalWins = allTrades.filter(t => t.result === 'Win').length;
  const globalWinRate = allTrades.length > 0 ? (totalWins / allTrades.length) * 100 : 0;
  const totalAccumulatedPips = allTrades.reduce((sum, t) => sum + (t.exit_pips || 0), 0);
  const totalPayouts = allPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Trader performance
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

    // Equity curve
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
      equityCurve
    };
  }).sort((a, b) => b.totalPnL - a.totalPnL);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/20">
          <Shield className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400">Complete overview and management</p>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Total P&L (All)" 
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`}
          icon={DollarSign}
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
          value={allTrades.length}
          icon={BarChart3}
          variant="default"
        />
        <StatsCard 
          title="Accumulated Pips" 
          value={totalAccumulatedPips.toFixed(1)}
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard 
          title="Total Payouts" 
          value={`$${totalPayouts.toFixed(2)}`}
          icon={Trophy}
          variant="success"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-gray-800/50 border border-gray-700/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="traders" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Traders
          </TabsTrigger>
          <TabsTrigger value="trades" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            All Trades
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Goals
          </TabsTrigger>
          <TabsTrigger value="certificates" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Certificates
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Payouts
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {traderPerformance.map((trader) => (
              <div key={trader.name} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{trader.name}</h3>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${trader.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trader.totalPnL >= 0 ? '+' : ''}${trader.totalPnL.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">{trader.totalTrades} trades</div>
                  </div>
                </div>
                <PremiumEquityCurve data={trader.equityCurve} height={180} />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Traders */}
        <TabsContent value="traders" className="mt-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              All Traders Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trader</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Total P&L</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Total Pips</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Win Rate</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {traderPerformance.map((trader, index) => (
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
                      <td className={`py-4 px-4 font-bold ${trader.totalPips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trader.totalPips >= 0 ? '+' : ''}{trader.totalPips.toFixed(1)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`${trader.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trader.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{trader.totalTrades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* All Trades */}
        <TabsContent value="trades" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="space-y-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Filters</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Select value={filters.trader} onValueChange={(v) => setFilters(prev => ({ ...prev, trader: v }))}>
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

              <Select value={filters.symbol} onValueChange={(v) => setFilters(prev => ({ ...prev, symbol: v }))}>
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

              <Select value={filters.session} onValueChange={(v) => setFilters(prev => ({ ...prev, session: v }))}>
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

              <Select value={filters.account} onValueChange={(v) => setFilters(prev => ({ ...prev, account: v }))}>
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

              <Select value={filters.result} onValueChange={(v) => setFilters(prev => ({ ...prev, result: v }))}>
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

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              All Trades ({filteredTrades.length})
            </h3>
            <TradeTable trades={filteredTrades.slice(0, 100)} showTrader={true} />
          </div>
        </TabsContent>

        {/* Goals */}
        <TabsContent value="goals" className="mt-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">All Trader Goals</h3>
            <div className="grid lg:grid-cols-2 gap-4">
              {allGoals.map((goal) => (
                <div key={goal.id} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <h4 className="font-semibold text-white mb-3">{goal.trader_name}</h4>
                  <div className="space-y-2 text-sm">
                    {goal.daily_pnl_goal && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Daily P&L Goal:</span>
                        <span className="text-emerald-400">${goal.daily_pnl_goal}</span>
                      </div>
                    )}
                    {goal.weekly_pnl_goal && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Weekly P&L Goal:</span>
                        <span className="text-emerald-400">${goal.weekly_pnl_goal}</span>
                      </div>
                    )}
                    {goal.monthly_pnl_goal && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monthly P&L Goal:</span>
                        <span className="text-emerald-400">${goal.monthly_pnl_goal}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Certificates */}
        <TabsContent value="certificates" className="mt-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">All Certificates</h3>
            <div className="grid lg:grid-cols-3 gap-4">
              {allCertificates.map((cert) => (
                <div key={cert.id} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <h4 className="font-semibold text-white mb-2">{cert.trader_name}</h4>
                  <p className="text-sm text-gray-400 mb-1">{cert.firm_name}</p>
                  <p className="text-sm text-cyan-400 mb-2">{cert.account_size}</p>
                  {cert.file_url && (
                    <img src={cert.file_url} alt="Certificate" className="w-full rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Payouts */}
        <TabsContent value="payouts" className="mt-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">All Payouts</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Trader</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Firm</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {allPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-white">{payout.trader_name}</td>
                      <td className="py-4 px-4 text-gray-300">
                        {payout.date ? format(new Date(payout.date), 'MMM d, yyyy') : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-gray-300">{payout.firm_name}</td>
                      <td className="py-4 px-4 font-bold text-emerald-400">${payout.amount?.toFixed(2)}</td>
                      <td className="py-4 px-4 text-gray-400 text-sm">{payout.account_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}