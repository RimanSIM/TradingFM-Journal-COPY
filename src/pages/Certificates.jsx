import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Award, 
  Upload, 
  Plus,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Certificates() {
  const [user, setUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [formData, setFormData] = useState({
    firm_name: '',
    account_size: '',
    date_issued: '',
    file_url: '',
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

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['certificates', user?.email],
    queryFn: () => base44.entities.Certificate.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Certificate.create({ ...data, trader_name: user?.full_name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['certificates']);
      setShowAddForm(false);
      setFormData({ firm_name: '', account_size: '', date_issued: '', file_url: '', notes: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Certificate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['certificates']);
      setSelectedCertificate(null);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, file_url }));
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSubmit = () => {
    if (!formData.firm_name) return;
    createMutation.mutate(formData);
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/20">
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Certificates</h1>
            <p className="text-gray-400">Store your funded account certificates</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No certificates yet</h3>
          <p className="text-gray-500 mb-6">Upload your funded account certificates here</p>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Certificate
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              onClick={() => setSelectedCertificate(cert)}
              className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden hover:border-yellow-500/30 transition-all cursor-pointer"
            >
              {cert.file_url ? (
                <div className="aspect-[4/3] bg-gray-800 relative">
                  <img 
                    src={cert.file_url} 
                    alt={cert.firm_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-800 flex items-center justify-center">
                  <Award className="w-12 h-12 text-gray-600" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1">{cert.firm_name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{cert.account_size || 'N/A'}</span>
                  <span className="text-gray-500">
                    {cert.date_issued ? format(new Date(cert.date_issued), 'MMM yyyy') : 'No date'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Certificate Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Certificate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
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
              <Label className="text-gray-400">Account Size</Label>
              <Input
                value={formData.account_size}
                onChange={(e) => setFormData(prev => ({ ...prev, account_size: e.target.value }))}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g., $100,000"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Date Issued</Label>
              <Input
                type="date"
                value={formData.date_issued}
                onChange={(e) => setFormData(prev => ({ ...prev, date_issued: e.target.value }))}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Certificate Image</Label>
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-yellow-500/50 transition-colors">
                {formData.file_url ? (
                  <img src={formData.file_url} alt="Preview" className="h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                  </>
                )}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
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
              disabled={!formData.firm_name || createMutation.isPending}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600"
            >
              Add Certificate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certificate Detail Dialog */}
      <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          {selectedCertificate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="text-white">{selectedCertificate.firm_name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(selectedCertificate.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {selectedCertificate.file_url && (
                  <img 
                    src={selectedCertificate.file_url} 
                    alt={selectedCertificate.firm_name}
                    className="w-full rounded-lg mb-4"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Account Size</div>
                    <div className="text-white font-semibold">{selectedCertificate.account_size || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Date Issued</div>
                    <div className="text-white font-semibold">
                      {selectedCertificate.date_issued ? format(new Date(selectedCertificate.date_issued), 'MMM d, yyyy') : 'N/A'}
                    </div>
                  </div>
                </div>
                {selectedCertificate.notes && (
                  <div className="mt-4 bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Notes</div>
                    <div className="text-gray-300">{selectedCertificate.notes}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}