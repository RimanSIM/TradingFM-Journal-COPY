import React from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Image } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const sessionColors = {
  'Asia': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'London': 'bg-red-500/20 text-red-400 border-red-500/30',
  'New York': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'No Session': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const resultColors = {
  'Win': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Loss': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Breakeven': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function TradeTable({ trades, showTrader = false, onRowClick }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No trades found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            {showTrader && <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trader</th>}
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Symbol</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Position Type</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Session</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">P&L</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Result</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {trades.map((trade) => (
            <tr 
              key={trade.id} 
              className="hover:bg-gray-800/30 transition-colors cursor-pointer"
              onClick={() => onRowClick && onRowClick(trade)}
            >
              {showTrader && (
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {trade.trader_name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-white">{trade.trader_name}</span>
                  </div>
                </td>
              )}
              <td className="py-4 px-4">
                <div className="text-sm text-white">
                  {trade.entry_time ? format(new Date(trade.entry_time), 'MMM d, yyyy') : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {trade.entry_time ? format(new Date(trade.entry_time), 'HH:mm') : ''}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm font-semibold text-white">{trade.symbol}</span>
              </td>
              <td className="py-4 px-4">
                <div className={`inline-flex items-center gap-1 text-sm font-medium ${trade.position_type === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.position_type === 'Buy' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {trade.position_type}
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant="outline" className={`${sessionColors[trade.session]} border text-xs`}>
                  {trade.session}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <span className={`text-sm font-bold ${trade.result === 'Loss' ? 'text-red-400' : trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.result === 'Loss' ? '-' : trade.pnl >= 0 ? '+' : ''}{Math.abs(trade.pnl || 0).toFixed(2)}$
                </span>
              </td>
              <td className="py-4 px-4">
                <Badge variant="outline" className={`${resultColors[trade.result]} border text-xs`}>
                  {trade.result}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <span className="text-xs text-gray-400">{trade.account_type}</span>
              </td>
              <td className="py-4 px-4">
                {trade.setup_screenshot && (
                  <Image className="w-4 h-4 text-gray-500" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}