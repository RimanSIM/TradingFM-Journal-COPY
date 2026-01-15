import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek, getWeek, isMonday, isSaturday, isSunday } from 'date-fns';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TradeTable from '../components/dashboard/TradeTable';
import TradeFilters from '../components/filters/TradeFilters';
import { filterTrades } from '../components/utils/filterTrades';

export default function Calendar() {
  const [user, setUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
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

  const trades = useMemo(() => {
    return filterTrades(allTrades, filters);
  }, [allTrades, filters]);

  // Get all weekdays (Mon-Fri) for the month, organized by weeks
  const getMonthWeeks = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const weeks = [];
    let currentWeek = [];
    let weekNum = 1;
    
    days.forEach((day, index) => {
      const dayOfWeek = getDay(day);
      
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek === 0 || dayOfWeek === 6) return;
      
      currentWeek.push(day);
      
      // If it's Friday (5) or last day of month, close the week
      if (dayOfWeek === 5 || index === days.length - 1) {
        if (currentWeek.length > 0) {
          weeks.push({
            weekNum,
            days: currentWeek
          });
          weekNum++;
          currentWeek = [];
        }
      }
    });
    
    return weeks;
  };

  const weeks = getMonthWeeks();

  // Get trades for a specific day
  const getTradesForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return trades.filter(trade => {
      if (!trade.entry_time) return false;
      return format(new Date(trade.entry_time), 'yyyy-MM-dd') === dateStr;
    });
  };

  // Get P&L for a day
  const getDayPnL = (date) => {
    const dayTrades = getTradesForDay(date);
    return dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  };

  // Get win rate for a day
  const getDayWinRate = (date) => {
    const dayTrades = getTradesForDay(date);
    if (dayTrades.length === 0) return null;
    const wins = dayTrades.filter(t => t.result === 'Win').length;
    return (wins / dayTrades.length) * 100;
  };

  // Get weekly P&L
  const getWeekPnL = (weekDays) => {
    return weekDays.reduce((sum, day) => sum + getDayPnL(day), 0);
  };

  // Get weekly trades
  const getWeekTrades = (weekDays) => {
    return weekDays.reduce((sum, day) => sum + getTradesForDay(day).length, 0);
  };

  // Monthly stats
  const monthlyTrades = trades.filter(trade => {
    if (!trade.entry_time) return false;
    return isSameMonth(new Date(trade.entry_time), currentMonth);
  });
  const monthlyPnL = monthlyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const monthlyWins = monthlyTrades.filter(t => t.result === 'Win').length;
  const monthlyWinRate = monthlyTrades.length > 0 ? (monthlyWins / monthlyTrades.length) * 100 : 0;

  // Count green/red days
  const greenDays = weeks.flatMap(w => w.days).filter(day => getDayPnL(day) > 0).length;
  const redDays = weeks.flatMap(w => w.days).filter(day => getDayPnL(day) < 0).length;

  // Best and worst day
  const allDaysWithPnL = weeks.flatMap(w => w.days).map(day => ({
    date: day,
    pnl: getDayPnL(day)
  })).filter(d => d.pnl !== 0);
  
  const bestDay = allDaysWithPnL.length > 0 ? allDaysWithPnL.reduce((a, b) => a.pnl > b.pnl ? a : b) : null;
  const worstDay = allDaysWithPnL.length > 0 ? allDaysWithPnL.reduce((a, b) => a.pnl < b.pnl ? a : b) : null;

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
              <CalendarDays className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">P&L Calendar</h1>
              <p className="text-gray-400">Track your daily trading performance</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-xl font-bold text-white min-w-[180px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <TradeFilters 
          filters={filters}
          onFilterChange={(field, value) => setFilters(prev => ({ ...prev, [field]: value }))}
          symbols={traderSymbols}
        />
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-4">
          <div className="text-sm text-gray-400 mb-1">Monthly P&L</div>
          <div className={`text-xl font-bold ${monthlyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {monthlyPnL >= 0 ? '+' : ''}${monthlyPnL.toFixed(2)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-4">
          <div className="text-sm text-gray-400 mb-1">Win Rate</div>
          <div className="text-xl font-bold text-white">{monthlyWinRate.toFixed(1)}%</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-4">
          <div className="text-sm text-gray-400 mb-1">Green Days</div>
          <div className="text-xl font-bold text-emerald-400">{greenDays}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-4">
          <div className="text-sm text-gray-400 mb-1">Red Days</div>
          <div className="text-xl font-bold text-red-400">{redDays}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-4">
          <div className="text-sm text-gray-400 mb-1">Best Day</div>
          <div className="text-xl font-bold text-emerald-400">
            {bestDay ? `+$${bestDay.pnl.toFixed(0)}` : 'N/A'}
          </div>
          {bestDay && <div className="text-xs text-gray-500">{format(bestDay.date, 'MMM d')}</div>}
        </div>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-4">
          <div className="text-sm text-gray-400 mb-1">Worst Day</div>
          <div className="text-xl font-bold text-red-400">
            {worstDay ? `$${worstDay.pnl.toFixed(0)}` : 'N/A'}
          </div>
          {worstDay && <div className="text-xs text-gray-500">{format(worstDay.date, 'MMM d')}</div>}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6 overflow-x-auto">
        {/* Day Headers */}
        <div className="grid grid-cols-6 gap-2 mb-4 min-w-[700px]">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Week Summary'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-3 min-w-[700px]">
          {weeks.map((week) => {
            const weekPnL = getWeekPnL(week.days);
            const weekTrades = getWeekTrades(week.days);
            
            // Pad the week with empty cells if it doesn't start on Monday
            const paddedDays = [];
            if (week.days.length > 0) {
              const firstDayOfWeek = getDay(week.days[0]);
              // Add empty cells for days before the first day (1 = Monday)
              for (let i = 1; i < firstDayOfWeek; i++) {
                paddedDays.push(null);
              }
            }
            paddedDays.push(...week.days);
            // Pad to 5 days
            while (paddedDays.length < 5) {
              paddedDays.push(null);
            }

            return (
              <div key={week.weekNum} className="grid grid-cols-6 gap-2">
                {/* Days Mon-Fri */}
                {paddedDays.map((day, index) => {
                  if (!day) {
                    return (
                      <div key={index} className="aspect-square rounded-xl bg-gray-800/30 border border-gray-700/30" />
                    );
                  }

                  const dayPnL = getDayPnL(day);
                  const winRate = getDayWinRate(day);
                  const hasTrades = getTradesForDay(day).length > 0;

                  return (
                    <button
                      key={format(day, 'yyyy-MM-dd')}
                      onClick={() => hasTrades && setSelectedDay(day)}
                      className={`
                        aspect-square rounded-xl p-2 flex flex-col items-center justify-center transition-all
                        ${hasTrades ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                        ${dayPnL > 0 ? 'bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50' :
                          dayPnL < 0 ? 'bg-red-500/10 border border-red-500/30 hover:border-red-500/50' :
                          'bg-gray-800/30 border border-gray-700/30'}
                      `}
                    >
                      <div className="text-sm font-semibold text-gray-400">{format(day, 'd')}</div>
                      {hasTrades && (
                        <>
                          <div className={`text-lg font-bold mt-1 ${dayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {dayPnL >= 0 ? '+' : ''}${Math.abs(dayPnL).toFixed(0)}
                          </div>
                          {winRate !== null && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {winRate.toFixed(0)}% WR
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}

                {/* Week Summary */}
                <div className={`
                  rounded-xl p-3 flex flex-col items-center justify-center
                  ${weekPnL > 0 ? 'bg-emerald-500/10 border border-emerald-500/30' :
                    weekPnL < 0 ? 'bg-red-500/10 border border-red-500/30' :
                    'bg-gray-800/30 border border-gray-700/30'}
                `}>
                  <div className="text-sm text-gray-400 mb-1">Week {week.weekNum}</div>
                  <div className={`text-xl font-bold ${weekPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {weekPnL >= 0 ? '+' : ''}${weekPnL.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">{weekTrades} trades</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDay && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white">
                      {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                    </span>
                    <Badge 
                      className={getDayPnL(selectedDay) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
                    >
                      {getDayPnL(selectedDay) >= 0 ? '+' : ''}${getDayPnL(selectedDay).toFixed(2)}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                {/* Day Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">Total P&L</div>
                    <div className={`text-lg font-bold ${getDayPnL(selectedDay) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {getDayPnL(selectedDay) >= 0 ? '+' : ''}${getDayPnL(selectedDay).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                    <div className="text-lg font-bold text-white">
                      {getDayWinRate(selectedDay)?.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">Trades</div>
                    <div className="text-lg font-bold text-white">
                      {getTradesForDay(selectedDay).length}
                    </div>
                  </div>
                </div>

                {/* Trades Table */}
                <TradeTable trades={getTradesForDay(selectedDay)} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}