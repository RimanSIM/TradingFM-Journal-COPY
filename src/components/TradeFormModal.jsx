import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Upload, X } from 'lucide-react';

const TRADERS = [
  { name: 'Haidar', email: 'haidarmustafa456@gmail.com' },
  { name: 'MMX', email: 'mohamadkanbar321@gmail.com' },
  { name: 'Riman', email: 'rimanmustafa206@gmail.com' },
  { name: 'Abdin', email: 'abdin.m2008@gmail.com' },
  { name: 'Reitrac', email: 'abdinm237@gmail.com' },
  { name: 'Cartier', email: 'cartier@tradingfm.com' },
];

const SYMBOLS = {
  Haidar: ['XAUUSD', 'NAS100', 'BTC', 'XAGUSD'],
  MMX: ['GC', 'MGC', 'XAUUSD', 'NAS100', 'BTC'],
  Riman: ['GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM', 'XAUUSD'],
  Abdin: ['GC', 'MGC', 'XAUUSD'],
  Reitrac: ['NQ', 'MNQ', 'GC', 'MGC'],
  Cartier: ['NQ', 'MNQ', 'GC', 'MGC'],
};

export default function TradeFormModal({ trade, traderName, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTrader, setSelectedTrader] = useState(null);

  const [formData, setFormData] = useState({
    trader_name: '',
    symbol: '',
    account_type: '',
    position_type: '',
    session: '',
    lot_size: '',
    result: '',
    stop_loss: '',
    take_profit: '',
    pnl: '',
    exit_pips: '',
    entry_time: '',
    exit_time: '',
    setup: [],
    setup_screenshot: null,
    confirmation_screenshot: null,
    notes: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
        
        // Auto-select trader for current user
        if (!trade) {
          const trader = TRADERS.find(t => t.email === userData.email);
          if (trader) {
            setSelectedTrader(trader.name);
            setFormData(prev => ({ ...prev, trader_name: trader.name }));
          }
        }
      } catch (e) {
        console.log('Not logged in');
      }
    };
    loadUser();
  }, [trade]);

  useEffect(() => {
    if (trade) {
      setFormData({
        ...trade,
        entry_time: trade.entry_time ? trade.entry_time.slice(0, 16) : '',
        exit_time: trade.exit_time ? trade.exit_time.slice(0, 16) : '',
      });
      setSelectedTrader(trade.trader_name);
    }
  }, [trade]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate exit_pips
      if ((field === 'pnl' || field === 'lot_size' || field === 'symbol' || field === 'result') && updated.pnl && updated.lot_size && updated.symbol) {
        const pnl = Math.abs(parseFloat(updated.pnl) || 0);
        const lotSize = parseFloat(updated.lot_size) || 0;
        const symbol = updated.symbol;
        const isLoss = updated.result === 'Loss';

        if (lotSize > 0) {
          let pipValue = 0;

          // Correct pip values for each instrument
          if (symbol === 'GC') pipValue = 10; // 1 contract = $10 per pip
          else if (symbol === 'MGC') pipValue = 1; // 1 contract = $1 per pip
          else if (symbol === 'NQ') pipValue = 5; // 1 contract = $5 per pip
          else if (symbol === 'MNQ') pipValue = 0.5; // 1 contract = $0.5 per pip
          else if (symbol === 'YM') pipValue = 5; // 1 contract = $5 per pip
          else if (symbol === 'MYM') pipValue = 0.5; // 1 contract = $0.5 per pip
          else if (symbol === 'XAUUSD') pipValue = 10; // 0.01 lot = $0.10 per pip -> pipValue = 10
          else if (symbol === 'NAS100') pipValue = 10; // 0.01 lot = $0.10 per pip -> pipValue = 10
          else if (symbol === 'XAGUSD') pipValue = 50; // 0.01 lot = $0.50 per pip -> pipValue = 50
          else if (symbol === 'BTC') pipValue = 100; // 0.01 lot = $1 per pip -> pipValue = 100

          if (pipValue > 0) {
            const exitPips = pnl / (pipValue * lotSize);
            updated.exit_pips = (isLoss ? -exitPips : exitPips).toFixed(2);
          }
        }
      }
      
      return updated;
    });
  };

  const handleFileUpload = async (field, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let duration = '';
      if (formData.entry_time && formData.exit_time) {
        const entry = new Date(formData.entry_time);
        const exit = new Date(formData.exit_time);
        const diffMs = exit - entry;
        const diffMins = Math.round(diffMs / 60000);
        duration = `${diffMins}M`;
      }

      let rrr = '';
      if (formData.stop_loss && formData.take_profit && formData.pnl) {
        const risk = Math.abs(parseFloat(formData.stop_loss));
        if (risk > 0) {
          const reward = Math.abs(parseFloat(formData.pnl));
          rrr = `1:${(reward / risk).toFixed(1)}`;
        }
      }

      const tradeData = {
        ...formData,
        lot_size: parseFloat(formData.lot_size) || 0,
        stop_loss: parseFloat(formData.stop_loss) || 0,
        take_profit: parseFloat(formData.take_profit) || 0,
        pnl: parseFloat(formData.pnl) || 0,
        exit_pips: parseFloat(formData.exit_pips) || 0,
        trade_duration: duration,
        rrr: rrr,
        quality_score: Math.floor(Math.random() * 30) + 70,
      };

      if (trade) {
        await base44.entities.Trade.update(trade.id, tradeData);
      } else {
        await base44.entities.Trade.create(tradeData);
      }

      queryClient.invalidateQueries(['myTrades']);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save trade:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sessionColors = {
    'Asia': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'London': 'bg-red-500/20 text-red-400 border-red-500/30',
    'New York': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'No Session': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const resultColors = {
    'Win': 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
    'Loss': 'bg-red-500/20 text-red-400 border-red-500',
    'Breakeven': 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {trade ? 'Edit Trade' : 'Add Trade'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Trader Selection (for new trades by admin) */}
          {!trade && currentUser?.email === 'rimanmustafa2003@gmail.com' && (
            <div className="space-y-2">
              <Label className="text-gray-400">Trader</Label>
              <Select value={selectedTrader} onValueChange={(v) => {
                setSelectedTrader(v);
                handleChange('trader_name', v);
              }}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select trader" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {TRADERS.map(t => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Symbol</Label>
              <Select value={formData.symbol} onValueChange={(v) => handleChange('symbol', v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {SYMBOLS[selectedTrader]?.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Account Type</Label>
              <Select value={formData.account_type} onValueChange={(v) => handleChange('account_type', v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {['Demo', 'Evaluation', 'Funded', 'Live'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Position Type</Label>
              <div className="flex gap-2">
                {['Buy', 'Sell'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleChange('position_type', type)}
                    className={`flex-1 py-2 rounded-lg border transition-all ${
                      formData.position_type === type
                        ? type === 'Buy' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session & Result */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Session</Label>
              <div className="flex flex-wrap gap-2">
                {['Asia', 'London', 'New York', 'No Session'].map(session => (
                  <button
                    key={session}
                    onClick={() => handleChange('session', session)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      formData.session === session
                        ? sessionColors[session]
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {session}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Result</Label>
              <div className="flex gap-2">
                {['Win', 'Loss', 'Breakeven'].map(r => (
                  <button
                    key={r}
                    onClick={() => handleChange('result', r)}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                      formData.result === r
                        ? resultColors[r]
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Execution */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Lot Size</Label>
              <Input
                type="number"
                step={['GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM'].includes(formData.symbol) ? "1" : "0.01"}
                value={formData.lot_size}
                onChange={(e) => handleChange('lot_size', e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">P/L ($)</Label>
              <Input
                type="number"
                value={formData.pnl}
                onChange={(e) => handleChange('pnl', e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Exit (Pips)</Label>
              <Input
                type="number"
                value={formData.exit_pips}
                onChange={(e) => handleChange('exit_pips', e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Stop Loss</Label>
              <Input
                type="number"
                value={formData.stop_loss}
                onChange={(e) => handleChange('stop_loss', e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Entry Time</Label>
              <Input
                type="datetime-local"
                value={formData.entry_time}
                onChange={(e) => handleChange('entry_time', e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Exit Time</Label>
              <Input
                type="datetime-local"
                value={formData.exit_time}
                onChange={(e) => handleChange('exit_time', e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          {/* Screenshots */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Setup Screenshot</Label>
              {formData.setup_screenshot ? (
                <div className="relative">
                  <img src={formData.setup_screenshot} alt="Setup" className="w-full h-32 object-cover rounded-lg border border-gray-700" />
                  <button
                    onClick={() => handleChange('setup_screenshot', null)}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500">Upload Setup</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('setup_screenshot', e)} />
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Confirmation Screenshot</Label>
              {formData.confirmation_screenshot ? (
                <div className="relative">
                  <img src={formData.confirmation_screenshot} alt="Confirmation" className="w-full h-32 object-cover rounded-lg border border-gray-700" />
                  <button
                    onClick={() => handleChange('confirmation_screenshot', null)}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500">Upload Confirmation</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('confirmation_screenshot', e)} />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-gray-400">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Trade notes, mistakes, observations..."
              className="bg-gray-800 border-gray-700 min-h-[100px]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button variant="outline" onClick={onClose} className="border-gray-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.symbol || !formData.result}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {trade ? 'Update Trade' : 'Save Trade'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}