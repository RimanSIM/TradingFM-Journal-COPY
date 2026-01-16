import { isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export function filterTrades(trades, filters) {
  return trades.filter(trade => {
    // Symbol filter
    if (filters.symbol && filters.symbol !== 'all' && trade.symbol !== filters.symbol) {
      return false;
    }

    // Session filter
    if (filters.session && filters.session !== 'all' && trade.session !== filters.session) {
      return false;
    }

    // Account filter
    if (filters.account && filters.account !== 'all' && trade.account_type !== filters.account) {
      return false;
    }

    // Result filter
    if (filters.result && filters.result !== 'all' && trade.result !== filters.result) {
      return false;
    }

    // Setup filter (check if any setup matches)
    if (filters.setup && filters.setup !== 'all') {
      if (!trade.setup || !trade.setup.includes(filters.setup)) {
        return false;
      }
    }

    // Time period filter
    if (trade.entry_time && filters.timePeriod && filters.timePeriod !== 'all') {
      const tradeDate = new Date(trade.entry_time);
      const now = new Date();

      try {
        switch (filters.timePeriod) {
          case 'today':
            if (!isWithinInterval(tradeDate, { start: startOfDay(now), end: endOfDay(now) })) {
              return false;
            }
            break;
          case 'week':
            if (!isWithinInterval(tradeDate, { start: startOfWeek(now), end: endOfWeek(now) })) {
              return false;
            }
            break;
          case 'month':
            if (!isWithinInterval(tradeDate, { start: startOfMonth(now), end: endOfMonth(now) })) {
              return false;
            }
            break;
          case 'year':
            if (!isWithinInterval(tradeDate, { start: startOfYear(now), end: endOfYear(now) })) {
              return false;
            }
            break;
        }
      } catch (e) {
        console.error('Date filter error:', e);
      }
    }

    // Custom date range
    if (trade.entry_time && (filters.fromDate || filters.toDate)) {
      const tradeDate = new Date(trade.entry_time);
      
      if (filters.fromDate) {
        const from = startOfDay(new Date(filters.fromDate));
        if (tradeDate < from) return false;
      }

      if (filters.toDate) {
        const to = endOfDay(new Date(filters.toDate));
        if (tradeDate > to) return false;
      }
    }

    return true;
  });
}

export function calculateAvgRRR(trades) {
  if (!trades || trades.length === 0) return 0;
  
  const total = trades.reduce((sum, trade) => {
    if (trade.rrr) {
      const parts = trade.rrr.split(':');
      if (parts.length === 2) {
        const rValue = parseFloat(parts[1]);
        if (!isNaN(rValue)) {
          // Apply negative for losses to get accurate average
          return sum + (trade.result === 'Loss' ? -rValue : rValue);
        }
      }
    }
    return sum;
  }, 0);
  
  return trades.length > 0 ? total / trades.length : 0;
}