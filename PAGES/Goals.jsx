import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Target, 
  Save,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Activity
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function Goals() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  
  const [goals, setGoals] = useState({
    daily_pnl_goal: '',
    daily_trade_limit: '',
    daily_loss_limit: '',
    weekly_pnl_goal: '',
    weekly_trade_limit: '',
    monthly_pnl_goal: '',
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

  const { data: existingGoals } = useQuery({
    queryKey: ['goals', user?.email],
    queryFn: async () => {
      const goals = await base44.entities.Goal.filter({ created_by: user?.email });
      return goals[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['myTrades', user?.email],
    queryFn: () => base44.entities.Trade.filter({ created_by: user?.email }, '-entry_time'),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existingGoals) {
      setGoals({
        daily_pnl_goal: existingGoals.daily_pnl_goal || '',
        daily_trade_limit: existingGoals.daily_trade_limit || '',
        daily_loss_limit: existingGoals.daily_loss_limit || '',
        weekly_pnl_goal: existingGoals.weekly_pnl_goal || '',
        weekly_trade_limit: existingGoals.weekly_trade_limit || '',
        monthly_pnl_goal: existingGoals.monthly_pnl_goal || '',
      });
    }
  }, [existingGoals]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingGoals?.id) {
        return base44.entities.Goal.update(existingGoals.id, data);
      }
      return base44.entities.Goal.create({ ...data, trader_name: user?.full_name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      daily_pnl_goal: parseFloat(goals.daily_pnl_goal) || 0,
      daily_trade_limit: parseInt(goals.daily_trade_limit) || 0,
      daily_loss_limit: parseFloat(goals.daily_loss_limit) || 0,
      weekly_pnl_goal: parseFloat(goals.weekly_pnl_goal) || 0,
      weekly_trade_limit: parseInt(goals.weekly_trade_limit) || 0,
      monthly_pnl_goal: parseFloat(goals.monthly_pnl_goal) || 0,
    });
  };

  // Calculate current progress
  const today = new Date().toDateString();
  const todayTrades = trades.filter(t => t.entry_time && new Date(t.entry_time).toDateString() === today);
  const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const todayTradeCount = todayTrades.length;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekTrades = trades.filter(t => t.entry_time && new Date(t.entry_time) >= startOfWeek);
  const weekPnL = weekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const weekTradeCount = weekTrades.length;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthTrades = trades.filter(t => t.entry_time && new Date(t.entry_time) >= startOfMonth);
  const monthPnL = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  // Calculate discipline score
  const calculateDisciplineScore = () => {
    // If no trades exist, return null (not calculated)
    if (trades.length === 0) {
      return null;
    }
    
    // If no goals are set, return null
    if (!goals.daily_trade_limit && !goals.daily_loss_limit && !goals.weekly_pnl_goal) {
      return null;
    }
    
    let score = 100;
    
    // Penalize for exceeding daily trade limit
    if (goals.daily_trade_limit && todayTradeCount > goals.daily_trade_limit) {
      score -= 20;
    }
    
    // Penalize for exceeding daily loss limit
    if (goals.daily_loss_limit && todayPnL < -goals.daily_loss_limit) {
      score -= 20;
    }
    
    // Reward for consistent win rate (only if we have today's trades)
    if (todayTrades.length > 0) {
      const wins = todayTrades.filter(t => t.result === 'Win').length;
      const winRate = (wins / todayTrades.length) * 100;
      if (winRate >= 50) score += 10;
      else score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const disciplineScore = calculateDisciplineScore();

  // Behavioral insights
  const insights = [];
  
  // Best session
  const sessionStats = trades.reduce((acc, t) => {
    if (t.session) {
      if (!acc[t.session]) acc[t.session] = { wins: 0, total: 0 };
      acc[t.session].total++;
      if (t.result === 'Win') acc[t.session].wins++;
    }
    return acc;
  }, {});
  
  const bestSession = Object.entries(sessionStats)
    .map(([session, data]) => ({ session, winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0 }))
    .sort((a, b) => b.winRate - a.winRate)[0];
  
  if (bestSession && bestSession.winRate > 50) {
    insights.push({
      type: 'success',
      text: `You're most profitable during ${bestSession.session} session (${bestSession.winRate.toFixed(0)}% win rate)`
    });
  }

  // Best setup
  const setupStats = trades.reduce((acc, t) => {
    (t.setup || []).forEach(setup => {
      if (!acc[setup]) acc[setup] = { wins: 0, total: 0 };
      acc[setup].total++;
      if (t.result === 'Win') acc[setup].wins++;
    });
    return acc;
  }, {});
  
  const bestSetup = Object.entries(setupStats)
    .map(([setup, data]) => ({ setup, winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0 }))
    .sort((a, b) => b.winRate - a.winRate)[0];
  
  if (bestSetup && bestSetup.winRate > 50) {
    insights.push({
      type: 'success',
      text: `Your best setup is ${bestSetup.setup} (${bestSetup.winRate.toFixed(0)}% win rate)`
    });
  }

  // Overtrading detection
  if (goals.daily_trade_limit && todayTradeCount > goals.daily_trade_limit) {
    insights.push({
      type: 'warning',
      text: `Over-trading alert: ${todayTradeCount} trades today (limit: ${goals.daily_trade_limit})`
    });
  }

  // Risk alert
  const avgWin = trades.filter(t => t.result === 'Win').reduce((sum, t) => sum + (t.pnl || 0), 0) / (trades.filter(t => t.result === 'Win').length || 1);
  const avgLoss = Math.abs(trades.filter(t => t.result === 'Loss').reduce((sum, t) => sum + (t.pnl || 0), 0) / (trades.filter(t => t.result === 'Loss').length || 1));
  
  if (avgWin > avgLoss) {
    insights.push({
      type: 'success',
      text: `Good RR: Avg win ($${avgWin.toFixed(0)}) > Avg loss ($${avgLoss.toFixed(0)})`
    });
  } else {
    insights.push({
      type: 'warning',
      text: `Risk warning: Avg loss ($${avgLoss.toFixed(0)}) > Avg win ($${avgWin.toFixed(0)})`
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
          <Target className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Goals & Psychology</h1>
          <p className="text-gray-400">Set your trading goals and track your discipline</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Goals Settings */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Daily Goals</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Daily P&L Goal ($)</Label>
                <Input
                  type="number"
                  value={goals.daily_pnl_goal}
                  onChange={(e) => setGoals(prev => ({ ...prev, daily_pnl_goal: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="e.g., 500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Daily Trade Limit</Label>
                <Input
                  type="number"
                  value={goals.daily_trade_limit}
                  onChange={(e) => setGoals(prev => ({ ...prev, daily_trade_limit: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="e.g., 5"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Daily Loss Limit ($)</Label>
                <Input
                  type="number"
                  value={goals.daily_loss_limit}
                  onChange={(e) => setGoals(prev => ({ ...prev, daily_loss_limit: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="e.g., 200"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Weekly Goals</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Weekly P&L Goal ($)</Label>
                <Input
                  type="number"
                  value={goals.weekly_pnl_goal}
                  onChange={(e) => setGoals(prev => ({ ...prev, weekly_pnl_goal: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="e.g., 2000"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Weekly Trade Limit</Label>
                <Input
                  type="number"
                  value={goals.weekly_trade_limit}
                  onChange={(e) => setGoals(prev => ({ ...prev, weekly_trade_limit: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="e.g., 25"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Monthly Goals</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Monthly P&L Goal ($)</Label>
                <Input
                  type="number"
                  value={goals.monthly_pnl_goal}
                  onChange={(e) => setGoals(prev => ({ ...prev, monthly_pnl_goal: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="e.g., 8000"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Goals
          </Button>
        </div>

        {/* Progress & Insights */}
        <div className="space-y-6">
          {/* Discipline Score */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              Discipline Score
            </h2>
            {disciplineScore !== null ? (
              <>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#374151"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={disciplineScore >= 80 ? '#10B981' : disciplineScore >= 50 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(disciplineScore / 100) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${
                      disciplineScore >= 80 ? 'text-emerald-400' : 
                      disciplineScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {disciplineScore}
                    </span>
                  </div>
                </div>
                <p className="text-center text-gray-400 text-sm">
                  {disciplineScore >= 80 ? 'Excellent discipline!' : 
                   disciplineScore >= 50 ? 'Room for improvement' : 'Needs attention'}
                </p>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">Add trades and set goals to calculate discipline score</p>
              </div>
            )}
          </div>

          {/* Progress Tracking */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Goal Progress
            </h2>
            <div className="space-y-4">
              {/* Daily P&L Progress */}
              {goals.daily_pnl_goal && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Today's P&L</span>
                    <span className={todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ${todayPnL.toFixed(2)} / ${goals.daily_pnl_goal}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (todayPnL / parseFloat(goals.daily_pnl_goal)) * 100)} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              )}

              {/* Daily Trades Progress */}
              {goals.daily_trade_limit && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Today's Trades</span>
                    <span className={todayTradeCount <= goals.daily_trade_limit ? 'text-emerald-400' : 'text-red-400'}>
                      {todayTradeCount} / {goals.daily_trade_limit}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (todayTradeCount / parseFloat(goals.daily_trade_limit)) * 100)} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              )}

              {/* Weekly P&L Progress */}
              {goals.weekly_pnl_goal && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">This Week's P&L</span>
                    <span className={weekPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ${weekPnL.toFixed(2)} / ${goals.weekly_pnl_goal}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (weekPnL / parseFloat(goals.weekly_pnl_goal)) * 100)} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              )}

              {/* Monthly P&L Progress */}
              {goals.monthly_pnl_goal && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">This Month's P&L</span>
                    <span className={monthPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ${monthPnL.toFixed(2)} / ${goals.monthly_pnl_goal}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (monthPnL / parseFloat(goals.monthly_pnl_goal)) * 100)} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Behavioral Insights */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Behavioral Insights
            </h2>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg flex items-start gap-3 ${
                    insight.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                    insight.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                    'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  {insight.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : insight.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm text-gray-300">{insight.text}</span>
                </div>
              ))}
              {insights.length === 0 && (
                <p className="text-gray-500 text-center py-4">Add trades to see behavioral insights</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}