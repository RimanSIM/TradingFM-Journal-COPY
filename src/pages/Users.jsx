import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');

  const { data: users = [] } = useQuery(['users'], () => api.entities.User.list());
  const { data: invites = [] } = useQuery(['invites'], () => api.entities.Invite.list());

  const approveInvite = useMutation({
    mutationFn: async (id) => {
      const inv = await api.entities.Invite.update(id, { status: 'approved' });
      await api.entities.User.create({ full_name: inv.full_name || '', email: inv.email, role: inv.role || 'user', trader_name: inv.trader_name || '' });
      return inv;
    },
    onSuccess: () => queryClient.invalidateQueries(['users', 'invites'])
  });

  const denyInvite = useMutation({
    mutationFn: async (id) => api.entities.Invite.update(id, { status: 'denied' }),
    onSuccess: () => queryClient.invalidateQueries(['invites'])
  });

  const inviteUser = useMutation({
    mutationFn: async (payload) => api.entities.Invite.create(payload),
    onSuccess: () => queryClient.invalidateQueries(['invites'])
  });

  const filteredUsers = users.filter(u => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
  });

  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'user', trader_name: '' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">All Users</h2>
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.email} className="flex items-center gap-3 p-2 bg-gray-900/30 rounded-md">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                    {u.profile_picture ? <img src={u.profile_picture} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{(u.full_name||u.email||'U').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{u.full_name || u.email}</div>
                    <div className="text-sm text-gray-400">{u.email} • {u.role || 'user'} {u.trader_name ? `• ${u.trader_name}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">Pending Invites</h2>
            <div className="space-y-2">
              {invites.filter(i => i.status === 'pending').map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-2 bg-gray-900/30 rounded-md">
                  <div className="flex-1">
                    <div className="text-white font-medium">{inv.full_name || inv.email}</div>
                    <div className="text-sm text-gray-400">{inv.email} • {inv.role}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveInvite.mutate(inv.id)} disabled={approveInvite.isLoading}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => denyInvite.mutate(inv.id)} disabled={denyInvite.isLoading}>Deny</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">Invite User</h2>
            <div className="space-y-2">
              <Input placeholder="Full name" value={inviteForm.full_name} onChange={(e)=>setInviteForm(prev=>({...prev, full_name: e.target.value}))} />
              <Input placeholder="Email" value={inviteForm.email} onChange={(e)=>setInviteForm(prev=>({...prev, email: e.target.value}))} />
              <Input placeholder="Role (user/admin/owner)" value={inviteForm.role} onChange={(e)=>setInviteForm(prev=>({...prev, role: e.target.value}))} />
              <Input placeholder="Trader name (optional)" value={inviteForm.trader_name} onChange={(e)=>setInviteForm(prev=>({...prev, trader_name: e.target.value}))} />
              <div className="flex justify-end">
                <Button onClick={() => inviteUser.mutate(inviteForm)} disabled={inviteUser.isLoading}>Send Invite</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
