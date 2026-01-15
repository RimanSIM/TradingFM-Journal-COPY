import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Settings as SettingsIcon, User, Lock, Upload, Camera, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setProfilePicture(userData.profile_picture || null);
        setNewName(userData.full_name || '');
      } catch (e) {
        console.log('Not logged in');
      }
    };
    loadUser();
  }, []);

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      // Update the user profile
      await base44.auth.updateMe({ full_name: newName });
      
      // Verify the update worked
      const updatedUser = await base44.auth.me();
      console.log('Updated user:', updatedUser);
      
      if (updatedUser.full_name === newName) {
        toast.success('Name updated successfully!');
        // Reload to refresh all components
        setTimeout(() => window.location.reload(), 800);
      } else {
        throw new Error('Name update verification failed');
      }
    } catch (err) {
      console.error('Name update failed:', err);
      toast.error('Failed to update name. Please try again.');
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // Upload the file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Update user profile
      await base44.auth.updateMe({ profile_picture: file_url });
      
      // Verify the update
      const updatedUser = await base44.auth.me();
      console.log('Updated profile picture:', updatedUser.profile_picture);
      
      if (updatedUser.profile_picture === file_url) {
        toast.success('Profile picture updated!');
        // Reload to refresh all components
        setTimeout(() => window.location.reload(), 800);
      } else {
        throw new Error('Profile picture update verification failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload profile picture. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Note: This would need backend support for password change
      // For now, just show a message
      toast.info('Password change functionality will be available soon');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error('Password change failed:', err);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Get user's strategy (trader_name from their trades)
  const [strategy, setStrategy] = useState(null);
  const [aiScore, setAiScore] = useState(null);

  useEffect(() => {
    const loadStrategy = async () => {
      if (!user?.email) return;
      
      try {
        // Get user's most recent trade to determine their trader_name
        const trades = await base44.entities.Trade.filter({ created_by: user.email }, '-entry_time', 1);
        if (trades.length > 0) {
          setStrategy(trades[0].trader_name);
          
          // Calculate AI Score based on recent performance
          const recentTrades = await base44.entities.Trade.filter({ created_by: user.email }, '-entry_time', 20);
          if (recentTrades.length >= 10) {
            const wins = recentTrades.filter(t => t.result === 'Win').length;
            const winRate = (wins / recentTrades.length) * 100;
            const avgPnL = recentTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / recentTrades.length;
            
            // Simple AI score calculation
            const score = Math.min(100, Math.max(0, 
              (winRate * 0.6) + 
              (avgPnL > 0 ? 20 : 0) + 
              (recentTrades.length >= 20 ? 20 : recentTrades.length)
            ));
            setAiScore(Math.round(score));
          }
        }
      } catch (e) {
        console.error('Failed to load strategy:', e);
      }
    };
    
    loadStrategy();
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your account settings</p>
        </div>
      </div>

      {/* Profile Picture */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Profile Picture
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-cyan-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleProfilePictureUpload}
                disabled={loading}
              />
            </label>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-gray-800 border-gray-700 h-9"
                    placeholder="Your name"
                  />
                  <Button
                    size="sm"
                    onClick={handleNameUpdate}
                    disabled={loading}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingName(false);
                      setNewName(user.full_name || '');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white">{user.full_name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingName(true)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">Role: {user.role || 'User'}</p>
          </div>
        </div>
      </div>

      {/* Strategy & AI Score */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Strategy */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Strategy</h2>
          {strategy ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {strategy.charAt(0)}
              </div>
              <p className="text-xl font-bold text-white">{strategy}</p>
              <p className="text-sm text-gray-400 mt-1">Trading Strategy</p>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">No trades logged yet</p>
          )}
        </div>

        {/* AI Rate Score */}
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Rate Score
          </h2>
          {aiScore !== null ? (
            <div className="text-center py-4">
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - aiScore / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {aiScore}
                    </div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Based on your recent 20 trades
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">Need at least 10 trades to calculate score</p>
          )}
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          Change Password
        </h2>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label className="text-gray-400">Current Password</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
              className="bg-gray-800 border-gray-700"
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">New Password</Label>
            <Input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
              className="bg-gray-800 border-gray-700"
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Confirm New Password</Label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              className="bg-gray-800 border-gray-700"
              placeholder="Confirm new password"
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={loading || !passwords.current || !passwords.new || !passwords.confirm}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );
}