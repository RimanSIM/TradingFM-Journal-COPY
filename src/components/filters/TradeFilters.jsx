import React from 'react';
import { Filter, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_SYMBOLS = ['GOLD', 'GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM', 'BTC', 'SILVER', 'DAX', 'JPN225'];

export default function TradeFilters({ 
  filters, 
  onFilterChange, 
  symbols = [], 
  showSetup = false,
  setups = []
}) {
  // Use default symbols if no symbols from trades
  const displaySymbols = symbols.length > 0 ? symbols : DEFAULT_SYMBOLS;
  return (
    <div className="space-y-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">Filters</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Symbol */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Symbol</Label>
          <Select value={filters.symbol} onValueChange={(v) => onFilterChange('symbol', v)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="All Symbols" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px] overflow-y-auto">
              <SelectItem value="all">All Symbols</SelectItem>
              {displaySymbols.map(symbol => (
                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Session */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Session</Label>
          <Select value={filters.session} onValueChange={(v) => onFilterChange('session', v)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="No Session">No Session</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Account</Label>
          <Select value={filters.account} onValueChange={(v) => onFilterChange('account', v)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="Demo">Demo</SelectItem>
              <SelectItem value="Evaluation">Evaluation</SelectItem>
              <SelectItem value="Funded">Funded</SelectItem>
              <SelectItem value="Live">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Result</Label>
          <Select value={filters.result} onValueChange={(v) => onFilterChange('result', v)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="Win">Win</SelectItem>
              <SelectItem value="Loss">Loss</SelectItem>
              <SelectItem value="Breakeven">Breakeven</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Setup (only for Journal) */}
        {showSetup && (
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Setup</Label>
            <Select value={filters.setup} onValueChange={(v) => onFilterChange('setup', v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Setups</SelectItem>
                {setups.map(setup => (
                  <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Time Period */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Time Period</Label>
          <Select value={filters.timePeriod} onValueChange={(v) => onFilterChange('timePeriod', v)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 h-9 text-sm">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* From Date */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">From Date</Label>
          <Input
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            className="bg-gray-800 border-gray-700 h-9 text-sm"
          />
        </div>

        {/* To Date */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">To Date</Label>
          <Input
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            className="bg-gray-800 border-gray-700 h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
}