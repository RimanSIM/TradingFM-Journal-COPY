import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import TradeFilters from '../components/filters/TradeFilters';
import { filterTrades } from '../components/utils/filterTrades';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  Activity,
  Percent,
  DollarSign,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCard from '../components/dashboard/StatsCard';
import PremiumEquityCurve from '../components/charts/PremiumEquityCurve';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
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
    queryKey: ['myTrades', user?.email],
    queryFn: () => base44.entities.Trade.filter({ created_by: user?.email }, '-entry_time'),
    enabled: !!user?.email,
  });

  // Get trader-specific symbols
  const traderSymbols = useMemo(() => {
    if (!user?.email) return [];
    
    const symbolsByTrader = {
      'haidarmustafa456@gmail.com': ['XAUUSD', 'NAS100', 'BTC', 'XAGUSD'],
      'mohamadkanbar321@gmail.com': ['GC', 'MGC', 'XAUUSD', 'NAS100', 'BTC'],
      'rimanmustafa206@gmail.com': ['GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM', 'XAUUSD'],
      'abdin.m2008@gmail.com': ['GC', 'MGC', 'XAUUSD'],
      'abdinm237@gmail.com': ['NQ', 'MNQ', 'GC', 'MGC'],
      'cartier@tradingfm.com': ['NQ', 'MNQ', 'GC', 'MGC']
    };
    
    return symbolsByTrader[user.email] || [];
  }, [user]);

  // Apply filters
  const trades = useMemo(() => {
    return filterTrades(allTrades, filters);
  }, [allTrades, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Calculate all metrics
  const totalPnL = trades.reduce((sum, t) => {
    const pnl = t.pnl || 0;
    return sum + (t.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl));
  }, 0);
  const wins = trades.filter(t => t.result === 'Win').length;
  const losses = trades.filter(t => t.result === 'Loss').length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;
  
  const avgWin = wins > 0 ? trades.filter(t => t.result === 'Win').reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(trades.filter(t => t.result === 'Loss').reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / losses) : 0;
  const profitFactor = avgLoss > 0 && losses > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;
  const expectancy = (winRate/100 * avgWin) - (lossRate/100 * avgLoss);
  // Apply sign based on result: Loss = negative, Win = positive
  const totalAccumulatedPips = trades.reduce((sum, t) => {
    const pips = Math.abs(t.exit_pips || 0);
    return sum + (t.result === 'Loss' ? -pips : pips);
  }, 0);

  // Max drawdown calculation
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;
  trades.slice().reverse().forEach(trade => {
    const pnl = trade.pnl || 0;
    const adjustedPnl = trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
    runningPnL += adjustedPnl;
    if (runningPnL > peak) peak = runningPnL;
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  // Equity curve data
  runningPnL = 0;
  const equityCurve = trades.slice().reverse().map((trade, index) => {
    const pnl = trade.pnl || 0;
    const adjustedPnl = trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
    runningPnL += adjustedPnl;
    return {
      trade: index + 1,
      equity: runningPnL,
      date: trade.entry_time ? format(new Date(trade.entry_time), 'MMM d') : ''
    };
  });

  // Win rate by month
  const monthlyData = trades.reduce((acc, trade) => {
    if (trade.entry_time) {
      const month = format(new Date(trade.entry_time), 'MMM yyyy');
      if (!acc[month]) acc[month] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      acc[month].total++;
      const pnl = trade.pnl || 0;
      acc[month].pnl += trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
      if (trade.result === 'Win') acc[month].wins++;
      if (trade.result === 'Loss') acc[month].losses++;
    }
    return acc;
  }, {});
  
  const winRateByMonth = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
    trades: data.total,
    pnl: data.pnl
  }));

  // Win/Loss rate by setup
  const setupStats = trades.reduce((acc, trade) => {
    (trade.setup || []).forEach(setup => {
      if (!acc[setup]) acc[setup] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      acc[setup].total++;
      const pnl = trade.pnl || 0;
      acc[setup].pnl += trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
      if (trade.result === 'Win') acc[setup].wins++;
      if (trade.result === 'Loss') acc[setup].losses++;
    });
    return acc;
  }, {});

  const setupData = Object.entries(setupStats).map(([setup, data]) => ({
    setup,
    winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
    lossRate: data.total > 0 ? (data.losses / data.total) * 100 : 0,
    trades: data.total,
    pnl: data.pnl
  })).sort((a, b) => b.winRate - a.winRate);

  // Trade duration distribution
  const durationStats = trades.reduce((acc, trade) => {
    const duration = trade.trade_duration;
    if (duration) {
      const mins = parseInt(duration);
      let bucket;
      if (mins < 5) bucket = '< 5m';
      else if (mins < 15) bucket = '5-15m';
      else if (mins < 30) bucket = '15-30m';
      else if (mins < 60) bucket = '30-60m';
      else bucket = '> 60m';
      acc[bucket] = (acc[bucket] || 0) + 1;
    }
    return acc;
  }, {});
  const durationData = Object.entries(durationStats).map(([duration, count]) => ({ duration, count }));

  // P&L distribution
  const pnlDistribution = trades.map(t => ({
    pnl: t.pnl || 0,
    result: t.result
  })).sort((a, b) => a.pnl - b.pnl);

  // Session performance
  const sessionStats = trades.reduce((acc, trade) => {
    const session = trade.session;
    if (session) {
      if (!acc[session]) acc[session] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      acc[session].total++;
      const pnl = trade.pnl || 0;
      acc[session].pnl += trade.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl);
      if (trade.result === 'Win') acc[session].wins++;
      if (trade.result === 'Loss') acc[session].losses++;
    }
    return acc;
  }, {});

  const sessionData = Object.entries(sessionStats).map(([session, data]) => ({
    session,
    winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
    trades: data.total,
    pnl: data.pnl
  }));

  const pieData = [
    { name: 'Wins', value: wins, color: '#10B981' },
    { name: 'Losses', value: losses, color: '#EF4444' },
    { name: 'Breakeven', value: trades.filter(t => t.result === 'Breakeven').length, color: '#F59E0B' },
  ].filter(d => d.value > 0);

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
            <BarChart3 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400">Deep dive into your trading performance</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TradeFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        symbols={traderSymbols}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Total P&L" 
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`}
          icon={DollarSign}
          variant={totalPnL >= 0 ? 'success' : 'danger'}
        />
        <StatsCard 
          title="Win Rate" 
          value={`${winRate.toFixed(1)}%`}
          icon={Target}
          variant={winRate >= 50 ? 'success' : 'danger'}
        />
        <StatsCard 
          title="Loss Rate" 
          value={`${lossRate.toFixed(1)}%`}
          icon={TrendingDown}
          variant="danger"
        />
        <StatsCard 
          title="Total Trades" 
          value={totalTrades}
          icon={Activity}
          variant="accent"
        />
        <StatsCard 
          title="Accumulated Pips" 
          value={`${totalAccumulatedPips >= 0 ? '+' : ''}${totalAccumulatedPips.toFixed(1)}`}
          icon={TrendingUp}
          variant={totalAccumulatedPips >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Profit Factor" 
          value={profitFactor.toFixed(2)}
          icon={BarChart3}
          variant={profitFactor >= 1 ? 'success' : 'danger'}
        />
        <StatsCard 
          title="Expectancy" 
          value={`${expectancy >= 0 ? '+' : ''}$${expectancy.toFixed(2)}`}
          icon={Percent}
          variant={expectancy >= 0 ? 'success' : 'danger'}
        />
        <StatsCard 
          title="Avg Win" 
          value={`+$${avgWin.toFixed(2)}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard 
          title="Avg Loss" 
          value={`-$${avgLoss.toFixed(2)}`}
          icon={TrendingDown}
          variant="danger"
        />
        <StatsCard 
          title="Max Drawdown" 
          value={`-$${maxDrawdown.toFixed(2)}`}
          icon={TrendingDown}
          variant="danger"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-800/50 border border-gray-700/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="setups" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            By Setup
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Equity Curve */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Equity Curve</h3>
              <PremiumEquityCurve data={equityCurve} height={280} />
            </div>

            {/* Win/Loss Distribution Pie */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Win/Loss Distribution</h3>
              <div className="h-64">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
                )}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-400">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trade Duration Distribution */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Trade Duration Distribution</h3>
            <div className="h-64">
              {durationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="duration" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#00D9FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* By Setup Tab */}
        <TabsContent value="setups" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Win Rate by Setup */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Win Rate by Setup</h3>
              <div className="h-72">
                {setupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setupData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                      <YAxis type="category" dataKey="setup" stroke="#9CA3AF" fontSize={11} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v) => [`${v.toFixed(1)}%`, 'Win Rate']} />
                      <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                        {setupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
                )}
              </div>
            </div>

            {/* Loss Rate by Setup */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Loss Rate by Setup</h3>
              <div className="h-72">
                {setupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setupData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                      <YAxis type="category" dataKey="setup" stroke="#9CA3AF" fontSize={11} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v) => [`${v.toFixed(1)}%`, 'Loss Rate']} />
                      <Bar dataKey="lossRate" fill="#EF4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Setup Performance Table */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
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
                    <tr key={setup.setup} className="hover:bg-gray-800/30">
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
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Win Rate by Month */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Win Rate by Month</h3>
              <div className="h-64">
                {winRateByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={winRateByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v) => [`${v.toFixed(1)}%`, 'Win Rate']} />
                      <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                        {winRateByMonth.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
                )}
              </div>
            </div>

            {/* P&L by Month */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">P&L by Month</h3>
              <div className="h-64">
                {winRateByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={winRateByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v) => [`$${v.toFixed(2)}`, 'P&L']} />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {winRateByMonth.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data yet</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="grid lg:grid-cols-4 gap-4">
            {sessionData.map((session) => (
              <div 
                key={session.session}
                className={`
                  p-5 rounded-xl border
                  ${session.session === 'Asia' ? 'bg-blue-500/10 border-blue-500/30' :
                    session.session === 'London' ? 'bg-red-500/10 border-red-500/30' :
                    session.session === 'New York' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    'bg-gray-500/10 border-gray-500/30'}
                `}
              >
                <h4 className={`text-lg font-semibold mb-3 ${
                  session.session === 'Asia' ? 'text-blue-400' :
                  session.session === 'London' ? 'text-red-400' :
                  session.session === 'New York' ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  {session.session}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Trades:</span>
                    <span className="text-white font-semibold">{session.trades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className={session.winRate >= 50 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {session.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">P&L:</span>
                    <span className={`font-semibold ${session.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {session.pnl >= 0 ? '+' : ''}${session.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}