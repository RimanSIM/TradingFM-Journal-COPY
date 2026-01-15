import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  BookOpen, 
  Plus, 
  Filter, 
  Search,
  Image,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit,
  Eye,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import TradeFilters from '../components/filters/TradeFilters';
import { filterTrades } from '../components/utils/filterTrades';
import TradeFormModal from '../components/TradeFormModal';

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

const ADMIN_EMAIL = 'rimanmustafa2003@gmail.com';

export default function Journal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [filters, setFilters] = useState({
    symbol: 'all',
    session: 'all',
    account: 'all',
    result: 'all',
    setup: 'all',
    timePeriod: 'all',
    fromDate: '',
    toDate: ''
  });
  const queryClient = useQueryClient();

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

  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: allTrades = [], isLoading } = useQuery({
    queryKey: ['myTrades', user?.email, isAdmin],
    queryFn: () => {
      if (isAdmin) {
        return base44.entities.Trade.list('-entry_time');
      }
      return base44.entities.Trade.filter({ created_by: user?.email }, '-entry_time');
    },
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Trade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myTrades']);
      setSelectedTrade(null);
    },
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

  const setups = useMemo(() => {
    const allSetups = allTrades.flatMap(t => t.setup || []);
    return [...new Set(allSetups)];
  }, [allTrades]);

  // Apply filters
  const filteredByFilters = useMemo(() => {
    return filterTrades(allTrades, filters);
  }, [allTrades, filters]);

  // Apply search
  const filteredTrades = filteredByFilters.filter(trade => {
    if (searchQuery && !trade.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !trade.notes?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleEditTrade = () => {
    setEditingTrade(selectedTrade);
    setSelectedTrade(null);
  };

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
            <BookOpen className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Trade Journal</h1>
            <p className="text-gray-400">Review and manage your trades</p>
          </div>
        </div>
        <Button 
          onClick={() => setEditingTrade({})}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Trade
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search trades..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-800/50 border-gray-700"
        />
      </div>

      {/* Filters */}
      <TradeFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        symbols={traderSymbols}
        showSetup={true}
        setups={setups}
      />

      {/* Trades Grid */}
      {filteredTrades.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No trades found</h3>
          <p className="text-gray-500 mb-6">Start logging your trades to build your journal</p>
          <Button 
            onClick={() => setEditingTrade({})}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Trade
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTrades.map((trade) => (
            <div
              key={trade.id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-5 hover:border-cyan-500/30 transition-all cursor-pointer"
              onClick={() => setSelectedTrade(trade)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start lg:items-center gap-4">
                  <div className={`p-3 rounded-xl ${trade.result === 'Win' ? 'bg-emerald-500/20' : trade.result === 'Loss' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                    {trade.position_type === 'Buy' ? (
                      <ArrowUpRight className={`w-6 h-6 ${trade.result === 'Win' ? 'text-emerald-400' : trade.result === 'Loss' ? 'text-red-400' : 'text-yellow-400'}`} />
                    ) : (
                      <ArrowDownRight className={`w-6 h-6 ${trade.result === 'Win' ? 'text-emerald-400' : trade.result === 'Loss' ? 'text-red-400' : 'text-yellow-400'}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-white">{trade.symbol}</span>
                      <Badge variant="outline" className={`${sessionColors[trade.session]} border text-xs`}>
                        {trade.session}
                      </Badge>
                      <Badge variant="outline" className={`${resultColors[trade.result]} border text-xs`}>
                        {trade.result}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{trade.entry_time ? format(new Date(trade.entry_time), 'MMM d, yyyy HH:mm') : 'No date'}</span>
                      <span>•</span>
                      <span>{trade.position_type}</span>
                      <span>•</span>
                      <span>{trade.account_type}</span>
                      {trade.trade_duration && (
                        <>
                          <span>•</span>
                          <span>{trade.trade_duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className={`text-xl font-bold ${trade.result === 'Loss' ? 'text-red-400' : trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.result === 'Loss' ? '-' : trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl || 0).toFixed(2)}
                    </div>
                    {trade.rrr && <div className="text-sm text-gray-400">RRR: {trade.rrr}</div>}
                  </div>
                  {trade.setup_screenshot && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700">
                      <img src={trade.setup_screenshot} alt="Setup" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {trade.notes && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <p className="text-sm text-gray-400 line-clamp-2">{trade.notes}</p>
                </div>
              )}

              {trade.setup?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {trade.setup.map((s, i) => (
                    <Badge key={i} variant="outline" className="bg-gray-700/30 border-gray-600 text-gray-300 text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Trade Modal */}
      {editingTrade && (
        <TradeFormModal
          trade={editingTrade.id ? editingTrade : null}
          traderName={editingTrade.trader_name}
          onClose={() => setEditingTrade(null)}
          onSuccess={() => setEditingTrade(null)}
        />
      )}

      {/* Trade Detail Modal */}
      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTrade && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white">{selectedTrade.symbol}</span>
                    <Badge variant="outline" className={`${resultColors[selectedTrade.result]} border`}>
                      {selectedTrade.result}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(selectedTrade.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* P&L Summary */}
                <div className={`p-4 rounded-xl ${selectedTrade.result === 'Win' ? 'bg-emerald-500/10 border border-emerald-500/30' : selectedTrade.result === 'Loss' ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${selectedTrade.result === 'Loss' ? 'text-red-400' : selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedTrade.result === 'Loss' ? '-' : selectedTrade.pnl >= 0 ? '+' : ''}${Math.abs(selectedTrade.pnl || 0).toFixed(2)}
                    </div>
                    {selectedTrade.rrr && <div className="text-gray-400 mt-1">RRR: {selectedTrade.rrr}</div>}
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Position</div>
                    <div className={`font-semibold ${selectedTrade.position_type === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedTrade.position_type}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Session</div>
                    <div className="text-white font-semibold">{selectedTrade.session}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Account Type</div>
                    <div className="text-white font-semibold">{selectedTrade.account_type}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Lot Size</div>
                    <div className="text-white font-semibold">{selectedTrade.lot_size || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Entry Time</div>
                    <div className="text-white font-semibold text-sm">
                      {selectedTrade.entry_time ? format(new Date(selectedTrade.entry_time), 'MMM d, yyyy HH:mm') : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Exit Time</div>
                    <div className="text-white font-semibold text-sm">
                      {selectedTrade.exit_time ? format(new Date(selectedTrade.exit_time), 'MMM d, yyyy HH:mm') : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Stop Loss</div>
                    <div className="text-red-400 font-semibold">-{selectedTrade.stop_loss || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Take Profit</div>
                    <div className="text-emerald-400 font-semibold">+{selectedTrade.take_profit || 'N/A'}</div>
                  </div>
                </div>

                {/* Setup & Confirmation */}
                {selectedTrade.setup?.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Setup</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrade.setup.map((s, i) => (
                        <Badge key={i} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTrade.confirmation?.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Confirmation</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrade.confirmation.map((c, i) => (
                        <Badge key={i} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screenshots */}
                {(selectedTrade.setup_screenshot || selectedTrade.confirmation_screenshot) && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Screenshots</div>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTrade.setup_screenshot && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Setup</div>
                          <img 
                            src={selectedTrade.setup_screenshot} 
                            alt="Setup" 
                            className="w-full rounded-lg border border-gray-700"
                          />
                        </div>
                      )}
                      {selectedTrade.confirmation_screenshot && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Confirmation</div>
                          <img 
                            src={selectedTrade.confirmation_screenshot} 
                            alt="Confirmation" 
                            className="w-full rounded-lg border border-gray-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedTrade.notes && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Notes</div>
                    <div className="bg-gray-800/50 p-4 rounded-lg text-gray-300 text-sm">
                      {selectedTrade.notes}
                    </div>
                  </div>
                )}
                
                {/* Edit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    onClick={handleEditTrade}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Trade
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}