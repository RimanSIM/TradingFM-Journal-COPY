import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, 
  ArrowRight, 
  Upload, 
  X, 
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import UserAvatar from '../components/UserAvatar';

const TRADERS = [
  { name: 'Haidar', avatar: 'H', color: 'from-blue-500 to-cyan-500', email: 'haidarmustafa456@gmail.com' },
  { name: 'MMX', avatar: 'M', color: 'from-purple-500 to-pink-500', email: 'mohamadkanbar321@gmail.com' },
  { name: 'Riman', avatar: 'R', color: 'from-green-500 to-emerald-500', email: 'rimanmustafa206@gmail.com' },
  { name: 'Abdin', avatar: 'A', color: 'from-orange-500 to-red-500', email: 'abdin.m2008@gmail.com' },
  { name: 'Reitrac', avatar: 'R', color: 'from-yellow-500 to-orange-500', email: 'abdinm237@gmail.com' },
  { name: 'Cartier', avatar: 'C', color: 'from-pink-500 to-rose-500', email: 'cartier@tradingfm.com' },
];

const ADMIN_EMAIL = 'rimanmustafa2003@gmail.com';

const SYMBOLS = {
  Haidar: ['XAUUSD', 'NAS100', 'BTC', 'XAGUSD'],
  MMX: ['GC', 'MGC', 'XAUUSD', 'NAS100', 'BTC'],
  Riman: ['GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM', 'XAUUSD'],
  Abdin: ['GC', 'MGC', 'XAUUSD'],
  Reitrac: ['NQ', 'MNQ', 'GC', 'MGC'],
  Cartier: ['NQ', 'MNQ', 'GC', 'MGC'],
};

export default function AddTrade() {
  const navigate = useNavigate();
  const location = useLocation();
  const editTrade = location.state?.editTrade;
  const [step, setStep] = useState(editTrade ? 2 : 1);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState(editTrade ? {
    ...editTrade,
    entry_time: editTrade.entry_time ? editTrade.entry_time.slice(0, 16) : '',
    exit_time: editTrade.exit_time ? editTrade.exit_time.slice(0, 16) : '',
  } : {
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
    setup_timeframe: [],
    structure: [],
    trend: [],
    confirmation: [],
    wicks_timeframe: [],
    orderblock_timeframe: [],
    candle_timeframe: [],
    bos_timeframe: [],
    ifvg_timeframe: [],
    extension_timeframe: [],
    eq_timeframe: [],
    fvg_timeframe: [],
    bpr_timeframe: [],
    csd_timeframe: [],
    setup_screenshot: null,
    confirmation_screenshot: null,
    notes: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // If editing, set the trader based on the trade's trader_name
        if (editTrade) {
          const trader = TRADERS.find(t => t.name === editTrade.trader_name);
          if (trader) {
            setSelectedTrader(trader);
          }
        }
      } catch (e) {
        console.log('Not logged in');
      }
    };
    loadUser();
  }, [editTrade]);

  const handleTraderSelect = (trader) => {
    setSelectedTrader(trader);
    setFormData(prev => ({ ...prev, trader_name: trader.name }));
    setStep(2);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...current, value] };
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
      // Calculate duration
      let duration = '';
      if (formData.entry_time && formData.exit_time) {
        const entry = new Date(formData.entry_time);
        const exit = new Date(formData.exit_time);
        const diffMs = exit - entry;
        const diffMins = Math.round(diffMs / 60000);
        duration = `${diffMins}M`;
      }

      // Calculate RRR (simplified)
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

      if (editTrade) {
        // Update existing trade
        await base44.entities.Trade.update(editTrade.id, tradeData);
      } else {
        // Create new trade
        await base44.entities.Trade.create(tradeData);
      }

      navigate(createPageUrl('Journal'));
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

  // Filter traders based on current user's email (admin can access all)
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const allowedTraders = isAdmin ? TRADERS : TRADERS.filter(trader => trader.email === currentUser?.email);

  // Auto-select if only one trader
  React.useEffect(() => {
    if (currentUser && allowedTraders.length === 1 && step === 1) {
      handleTraderSelect(allowedTraders[0]);
    }
  }, [currentUser]);

  // Step 1: Select Trader
  if (step === 1) {
    if (!currentUser) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (allowedTraders.length === 0) {
      return (
        <div className="max-w-2xl mx-auto text-center space-y-6 py-20">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 w-20 h-20 mx-auto flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400">
            Your account ({currentUser?.email}) does not have permission to add trades.
            <br />
            Please contact an administrator.
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Add New Trade</h1>
          <p className="text-gray-400">Who took this trade?</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {allowedTraders.map((trader) => (
            <button
              key={trader.name}
              onClick={() => handleTraderSelect(trader)}
              className="group p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="w-16 h-16 mx-auto mb-4">
                <UserAvatar email={trader.email} traderName={trader.name} size="xl" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                {trader.name}
              </h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Trade Form
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <UserAvatar email={selectedTrader.email} traderName={selectedTrader.name} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-white">{editTrade ? 'Edit' : 'Add'} Trade for {selectedTrader.name}</h1>
            <p className="text-sm text-gray-400">Fill in the trade details below</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Symbol</Label>
              <Select value={formData.symbol} onValueChange={(v) => handleChange('symbol', v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {SYMBOLS[selectedTrader.name]?.map(s => (
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
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

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
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {session}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Lot Size</Label>
              <Input
                type="number"
                step={['GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM'].includes(formData.symbol) ? "1" : "0.01"}
                min={['GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM'].includes(formData.symbol) ? "1" : "0.01"}
                max="100"
                value={formData.lot_size}
                onChange={(e) => handleChange('lot_size', e.target.value)}
                className="bg-gray-800 border-gray-700"
                placeholder={['GC', 'MGC', 'NQ', 'MNQ', 'YM', 'MYM'].includes(formData.symbol) ? "1 - 100" : "0.01 - 100"}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Result</Label>
              <div className="flex gap-2">
                {['Win', 'Loss', 'Breakeven'].map(result => (
                  <button
                    key={result}
                    onClick={() => handleChange('result', result)}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                      formData.result === result
                        ? resultColors[result]
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {result}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Execution */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Execution</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Stop Loss</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">-</span>
                <Input
                  type="number"
                  value={formData.stop_loss}
                  onChange={(e) => handleChange('stop_loss', e.target.value)}
                  className="bg-gray-800 border-gray-700 pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Take Profit</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">+</span>
                <Input
                  type="number"
                  value={formData.take_profit}
                  onChange={(e) => handleChange('take_profit', e.target.value)}
                  className="bg-gray-800 border-gray-700 pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">P/L ($)</Label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${formData.result === 'Loss' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formData.result === 'Loss' ? '-' : '+'}
                </span>
                <Input
                  type="number"
                  value={formData.pnl}
                  onChange={(e) => handleChange('pnl', e.target.value)}
                  className="bg-gray-800 border-gray-700 pl-7"
                />
              </div>
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
          </div>
        </div>

        {/* Entry & Exit Time */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Entry & Exit Time</h2>
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
        </div>

        {/* Strategy Details - Dynamic based on trader */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Strategy Details</h2>
          
          {/* Haidar Strategy */}
          {selectedTrader.name === 'Haidar' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Setup</Label>
                <div className="flex flex-wrap gap-2">
                  {['Support', 'Resistance', 'Liquidity'].map(setup => (
                    <button
                      key={setup}
                      onClick={() => handleMultiSelect('setup', setup)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup.includes(setup)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {setup}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.setup.includes('Support') || formData.setup.includes('Resistance')) && (
                <div className="space-y-2">
                  <Label className="text-gray-400">Setup Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['15M', '1H', '4H'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('setup_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.setup_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-400">Structure</Label>
                <div className="flex flex-wrap gap-2">
                  {['Up-15M', 'Up-1H', 'Up-4H', 'Up-1D', 'Down-15M', 'Down-1H', 'Down-4H', 'Down-1D'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleMultiSelect('structure', s)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.structure.includes(s)
                          ? s.startsWith('Up') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Trend</Label>
                <div className="flex flex-wrap gap-2">
                  {['Up-15M', 'Up-1H', 'Up-4H', 'Up-1D', 'Down-15M', 'Down-1H', 'Down-4H', 'Down-1D'].map(t => (
                    <button
                      key={t}
                      onClick={() => handleMultiSelect('trend', t)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.trend.includes(t)
                          ? t.startsWith('Up') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Confirmation</Label>
                <div className="flex flex-wrap gap-2">
                  {['Wicks', 'Orderblock'].map(c => (
                    <button
                      key={c}
                      onClick={() => handleMultiSelect('confirmation', c)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.confirmation.includes(c)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {formData.confirmation.includes('Wicks') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">Wicks Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M', '30M', '1H'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('wicks_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.wicks_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.confirmation.includes('Orderblock') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">Orderblock Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M', '30M', '1H'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('orderblock_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.orderblock_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MMX Strategy */}
          {selectedTrader.name === 'MMX' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Setup</Label>
                <div className="flex flex-wrap gap-2">
                  {['Support', 'Resistance', 'Liquidity', 'Session liquidity'].map(setup => (
                    <button
                      key={setup}
                      onClick={() => handleMultiSelect('setup', setup)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup.includes(setup)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {setup}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Setup Timeframe</Label>
                <div className="flex flex-wrap gap-2">
                  {['15M', '1H', '4H'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => handleMultiSelect('setup_timeframe', tf)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup_timeframe.includes(tf)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Structure</Label>
                <div className="flex flex-wrap gap-2">
                  {['Up-15M', 'Up-1H', 'Up-4H', 'Up-1D', 'Down-15M', 'Down-1H', 'Down-4H', 'Down-1D'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleMultiSelect('structure', s)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.structure.includes(s)
                          ? s.startsWith('Up') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Trend</Label>
                <div className="flex flex-wrap gap-2">
                  {['Up-15M', 'Up-1H', 'Up-4H', 'Up-1D', 'Down-15M', 'Down-1H', 'Down-4H', 'Down-1D'].map(t => (
                    <button
                      key={t}
                      onClick={() => handleMultiSelect('trend', t)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.trend.includes(t)
                          ? t.startsWith('Up') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Confirmation: Orderblock</Label>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Orderblock Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '2M', '3M', '4M', '5M', '6M', '10M', '12M', '15M', '30M', '1H', '4H'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('orderblock_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.orderblock_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Riman Strategy */}
          {selectedTrader.name === 'Riman' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Setup</Label>
                <div className="flex flex-wrap gap-2">
                  {['Support', 'Resistance', 'Session liquidity'].map(setup => (
                    <button
                      key={setup}
                      onClick={() => handleMultiSelect('setup', setup)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup.includes(setup)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {setup}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.setup.includes('Support') || formData.setup.includes('Resistance')) && (
                <div className="space-y-2">
                  <Label className="text-gray-400">Setup Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['15M', '1H', '4H'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('setup_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.setup_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-400">Structure</Label>
                <div className="flex flex-wrap gap-2">
                  {['Up-15M', 'Up-1H', 'Up-4H', 'Up-1D', 'Down-15M', 'Down-1H', 'Down-4H', 'Down-1D'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleMultiSelect('structure', s)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.structure.includes(s)
                          ? s.startsWith('Up') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Trend</Label>
                <div className="flex flex-wrap gap-2">
                  {['Up-15M', 'Up-1H', 'Up-4H', 'Up-1D', 'Down-15M', 'Down-1H', 'Down-4H', 'Down-1D'].map(t => (
                    <button
                      key={t}
                      onClick={() => handleMultiSelect('trend', t)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.trend.includes(t)
                          ? t.startsWith('Up') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Confirmation</Label>
                <div className="flex flex-wrap gap-2">
                  {['Orderblock', 'Candle', 'Both'].map(c => (
                    <button
                      key={c}
                      onClick={() => handleMultiSelect('confirmation', c)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.confirmation.includes(c)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.confirmation.includes('Orderblock') || formData.confirmation.includes('Both')) && (
                <div className="space-y-2">
                  <Label className="text-gray-400">Orderblock Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M', '30M', '1H'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('orderblock_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.orderblock_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(formData.confirmation.includes('Candle') || formData.confirmation.includes('Both')) && (
                <div className="space-y-2">
                  <Label className="text-gray-400">Candle Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M', '30M', '1H'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('candle_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.candle_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Abdin Strategy */}
          {selectedTrader.name === 'Abdin' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Setup</Label>
                <div className="flex flex-wrap gap-2">
                  {['Liquidity', 'Session liquidity'].map(setup => (
                    <button
                      key={setup}
                      onClick={() => handleMultiSelect('setup', setup)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup.includes(setup)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {setup}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Setup Timeframe</Label>
                <div className="flex flex-wrap gap-2">
                  {['1M', '5M', '15M', '1H', '4H', '1D'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => handleMultiSelect('setup_timeframe', tf)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup_timeframe.includes(tf)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Confirmation</Label>
                <div className="flex flex-wrap gap-2">
                  {['BOS', 'IFVG', '79% Extension', 'EQ', 'FVG', 'BPR'].map(c => (
                    <button
                      key={c}
                      onClick={() => handleMultiSelect('confirmation', c)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.confirmation.includes(c)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {formData.confirmation.includes('BOS') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">BOS Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('bos_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.bos_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}

              {formData.confirmation.includes('IFVG') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">IFVG Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('ifvg_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.ifvg_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}

              {formData.confirmation.includes('79% Extension') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">79% Extension Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('extension_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.extension_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}

              {formData.confirmation.includes('EQ') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">EQ Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['5M', '15M', '1H'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('eq_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.eq_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}

              {formData.confirmation.includes('FVG') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">FVG Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['5M', '15M', '1H'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('fvg_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.fvg_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}

              {formData.confirmation.includes('BPR') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">BPR Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['5M', '15M', '1H'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('bpr_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.bpr_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reitrac Strategy */}
          {selectedTrader.name === 'Reitrac' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Setup</Label>
                <div className="flex flex-wrap gap-2">
                  {['DOL', 'MMXM', 'Structure', 'Extreme', 'Range'].map(setup => (
                    <button
                      key={setup}
                      onClick={() => handleMultiSelect('setup', setup)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup.includes(setup)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {setup}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Setup Timeframe</Label>
                <div className="flex flex-wrap gap-2">
                  {['1M', '5M', '15M', '1H', '4H', '1D'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => handleMultiSelect('setup_timeframe', tf)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup_timeframe.includes(tf)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Confirmation: CSD</Label>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">CSD Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['1M', '5M', '15M', '1H', '4H', '1D'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => handleMultiSelect('csd_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.csd_timeframe.includes(tf)
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cartier Strategy */}
          {selectedTrader.name === 'Cartier' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Setup</Label>
                <div className="flex flex-wrap gap-2">
                  {['DOL', 'Support', 'Resistance'].map(setup => (
                    <button
                      key={setup}
                      onClick={() => handleMultiSelect('setup', setup)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup.includes(setup)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {setup}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Setup Timeframe</Label>
                <div className="flex flex-wrap gap-2">
                  {['5M', '15M', '1H'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => handleMultiSelect('setup_timeframe', tf)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.setup_timeframe.includes(tf)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Confirmation</Label>
                <div className="flex flex-wrap gap-2">
                  {['FVG', 'IFVG'].map(c => (
                    <button
                      key={c}
                      onClick={() => handleMultiSelect('confirmation', c)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        formData.confirmation.includes(c)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {formData.confirmation.includes('IFVG') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">IFVG Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['15M', '1H'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('ifvg_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.ifvg_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}

              {formData.confirmation.includes('FVG') && (
                <div className="space-y-2">
                  <Label className="text-gray-400">FVG Timeframe</Label>
                  <div className="flex flex-wrap gap-2">
                    {['15M', '1H'].map(tf => (
                      <button key={tf} onClick={() => handleMultiSelect('fvg_timeframe', tf)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${formData.fvg_timeframe.includes(tf) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{tf}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Screenshots */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Screenshots</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Setup Screenshot</Label>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-colors">
                {formData.setup_screenshot ? (
                  <img src={formData.setup_screenshot} alt="Setup" className="h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-sm text-gray-500">Upload Setup</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('setup_screenshot', e)} />
              </label>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Confirmation Screenshot</Label>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-colors">
                {formData.confirmation_screenshot ? (
                  <img src={formData.confirmation_screenshot} alt="Confirmation" className="h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-sm text-gray-500">Upload Confirmation</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('confirmation_screenshot', e)} />
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Trade notes, observations, lessons learned..."
            className="bg-gray-800 border-gray-700 min-h-[120px]"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.symbol || !formData.result}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 py-6 text-lg font-semibold"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              {editTrade ? 'Update Trade' : 'Save Trade'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}