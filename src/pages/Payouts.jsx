import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  DollarSign, 
  Plus,
  Trash2,
  Upload,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line 
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatsCard from '../components/dashboard/StatsCard';

export default function Payouts() {
  const [user, setUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    firm_name: '',
    amount: '',
    account_type: '',
    screenshot_url: '',
    notes: '',
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

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['payouts', user?.email],
    queryFn: () => base44.entities.Payout.filter({ created_by: user?.email }, '-date'),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Payout.create({ ...data, trader_name: user?.full_name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payouts']);
      setShowAddForm(false);
      setFormData({ date: '', firm_name: '', amount: '', account_type: '', screenshot_url: '', notes: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Payout.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payouts']);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, screenshot_url: file_url }));
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSubmit = () => {
    if (!formData.firm_name || !formData.amount || !formData.date) return;
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  // Calculate stats
  const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const avgPayout = payouts.length > 0 ? totalPayouts / payouts.length : 0;
  
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const payoutsThisMonth = payouts.filter(p => p.date && new Date(p.date) >= thisMonth);
  const monthTotal = payoutsThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);

  const thisYear = new Date();
  thisYear.setMonth(0, 1);
  const payoutsThisYear = payouts.filter(p => p.date && new Date(p.date) >= thisYear);
  const yearTotal = payoutsThisYear.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Monthly chart data
  const monthlyData = payouts.reduce((acc, p) => {
    if (p.date) {
      const month = format(new Date(p.date), 'MMM yyyy');
      if (!acc[month]) acc[month] = 0;
      acc[month] += p.amount || 0;
    }
    return acc;
  }, {});
  const monthlyChartData = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })).reverse();

  // Cumulative chart data
  let cumulative = 0;
  const cumulativeData = payouts.slice().reverse().map(p => {
    cumulative += p.amount || 0;
    return {
      date: p.date ? format(new Date(p.date), 'MMM d') : '',
      total: cumulative
    };
  });

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
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/20">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Payouts</h1>
            <p className="text-gray-400">Track your funded account payouts</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Payouts" 
          value={`$${totalPayouts.toFixed(2)}`}
          icon={DollarSign}
          variant="success"
        />
        <StatsCard 
          title="This Month" 
          value={`$${monthTotal.toFixed(2)}`}
          icon={TrendingUp}
          variant="accent"
        />
        <StatsCard 
          title="This Year" 
          value={`$${yearTotal.toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatsCard 
          title="Average Payout" 
          value={`$${avgPayout.toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      {/* Charts */}
      {payouts.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Payouts */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payouts by Month</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative Payouts */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cumulative Payouts</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Payouts Table */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payout History</h3>
        {payouts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No payouts recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Firm</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Account Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Notes</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 text-white">
                      {payout.date ? format(new Date(payout.date), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-white font-semibold">{payout.firm_name}</td>
                    <td className="py-4 px-4 text-emerald-400 font-bold">
                      +${payout.amount?.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-gray-400">{payout.account_type || 'N/A'}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm max-w-[200px] truncate">
                      {payout.notes || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(payout.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payout Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Firm Name *</Label>
              <Input
                value={formData.firm_name}
                onChange={(e) => setFormData(prev => ({ ...prev, firm_name: e.target.value }))}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g., FTMO, MyForexFunds"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Amount ($) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g., 1500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Account Type</Label>
              <Select 
                value={formData.account_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, account_type: v }))}
              >
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
              <Label className="text-gray-400">Screenshot</Label>
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                {formData.screenshot_url ? (
                  <img src={formData.screenshot_url} alt="Preview" className="h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">Upload screenshot</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-gray-800 border-gray-700"
                placeholder="Any additional notes..."
              />
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.firm_name || !formData.amount || !formData.date || createMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
            >
              Add Payout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}