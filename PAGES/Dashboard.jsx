import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Activity,
  Percent,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatsCard from '../components/dashboard/StatsCard';
import TradeTable from '../components/dashboard/TradeTable';
import TradeFilters from '../components/filters/TradeFilters';
import { filterTrades, calculateAvgRRR } from '../components/utils/filterTrades';
import PremiumEquityCurve from '../components/charts/PremiumEquityCurve';

export default function Dashboard() {
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
        console.error('User not logged in:', e);
        setUser({ full_name: 'Guest', email: 'guest@tradingfm.com' });
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

  // Calculate metrics
  const totalPnL = trades.reduce((sum, t) => {
    const pnl = t.pnl || 0;
    return sum + (t.result === 'Loss' ? -Math.abs(pnl) : Math.abs(pnl));
  }, 0);
  const wins = trades.filter(t => t.result === 'Win').length;
  const losses = trades.filter(t => t.result === 'Loss').length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
  const lossRate = totalTrades > 0 ? ((losses / totalTrades) * 100).toFixed(1) : 0;
  // Apply sign based on result: Loss = negative, Win = positive
  const totalAccumulatedPips = trades.reduce((sum, t) => {
    const pips = Math.abs(t.exit_pips || 0);
    return sum + (t.result === 'Loss' ? -pips : pips);
  }, 0);
  
  const avgWin = wins > 0 ? trades.filter(t => t.result === 'Win').reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(trades.filter(t => t.result === 'Loss').reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / losses) : 0;
  const profitFactor = avgLoss > 0 && losses > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;
  const avgRRR = calculateAvgRRR(trades);

  // Equity curve data
  let runningPnL = 0;
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{user?.full_name?.split(' ')[0] || 'Trader'}</span>
        </h1>
        <p className="text-gray-400 mt-1">Here's your trading performance overview</p>
      </div>

      {/* Filters */}
      <TradeFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        symbols={traderSymbols}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total P&L" 
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`}
          icon={DollarSign}
          variant={totalPnL >= 0 ? 'success' : 'danger'}
        />
        <StatsCard 
          title="Win Rate" 
          value={`${winRate}%`}
          icon={Target}
          variant={parseFloat(winRate) >= 50 ? 'success' : 'danger'}
        />
        <StatsCard 
          title="Total Trades" 
          value={totalTrades}
          icon={Activity}
          variant="accent"
        />
        <StatsCard 
          title="Profit Factor" 
          value={profitFactor.toFixed(2)}
          icon={BarChart3}
          variant={profitFactor >= 1 ? 'success' : 'danger'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="Avg RRR" 
          value={`1:${avgRRR.toFixed(2)}`}
          icon={Target}
          variant="accent"
        />
        <StatsCard 
          title="Accumulated Pips" 
          value={`${totalAccumulatedPips >= 0 ? '+' : ''}${totalAccumulatedPips.toFixed(1)}`}
          icon={TrendingUp}
          variant={totalAccumulatedPips >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Equity Curve</h3>
          <PremiumEquityCurve data={equityCurve} height={280} />
        </div>

        {/* Win/Loss Distribution */}
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
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
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

      {/* Recent Trades */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
        <TradeTable trades={trades.slice(0, 10)} />
      </div>
    </div>
  );
}