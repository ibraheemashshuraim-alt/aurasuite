/* eslint-disable */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Shield, CheckCircle, Clock, Search, X } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SuperAdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  useEffect(() => {
    setMounted(true);
    // Basic super admin check (For demonstration, we check if they are logged in as admin of a specific 'AuraSuite' org, or just allow them in this prototype)
    // In production, check role === 'super_admin'
    const session = localStorage.getItem('aura_session');
    if (!session) {
      router.push('/login');
      return;
    }
    
    setIsSuperAdmin(true);
    fetchPendingOrgs();
  }, []);

  const fetchPendingOrgs = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });
      
    if (data) setPendingOrgs(data);
    setLoading(false);
  };

  const handleApprove = async (org) => {
    if (!confirm(`Are you sure you want to approve ${org.org_name}?`)) return;
    setActionLoading(org.id);

    try {
      // 1. Update Org Status
      await supabase.from('organizations').update({ status: 'active' }).eq('id', org.id);

      // 2. Generate Admin Credentials
      const cardNumber = `AS-2026-ADM-${Math.floor(1000 + Math.random() * 9000)}`;
      const username = `admin_${org.org_name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const tempPassword = Math.random().toString(36).slice(-8);

      // 3. Create Admin Profile
      const { data: profileData } = await supabase.from('profiles').insert({
        organization_id: org.id,
        email: org.email,
        full_name: org.owner_name,
        role: 'admin',
        category: 'A',
        domain: 'Admin',
        username,
        password_hash: tempPassword,
        card_number: cardNumber,
        is_first_login: true,
        org_mode: org.business_type || 'software_house'
      }).select().single();

      // 4. Create Digital Card
      if (profileData) {
        await supabase.from('digital_cards').insert({
          card_number: cardNumber,
          username,
          temp_password: tempPassword,
          profile_id: profileData.id,
          organization_id: org.id,
          email: org.email
        });
      }

      // 5. Send Email
      await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: org.email,
          name: org.owner_name,
          cardNumber,
          username,
          tempPassword,
          orgName: org.org_name
        })
      });

      setPendingOrgs(prev => prev.filter(o => o.id !== org.id));
      alert(`Approved! Email sent to ${org.email}`);
    } catch (err) {
      console.error(err);
      alert('Failed to approve organization.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orgId) => {
    if (!confirm('Reject and delete this request?')) return;
    setActionLoading(orgId);
    await supabase.from('organizations').delete().eq('id', orgId);
    setPendingOrgs(prev => prev.filter(o => o.id !== orgId));
    setActionLoading(null);
  };

  if (!mounted || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-[#05010a] text-[#f3f1f5] font-sans relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/bg-office.jpg" alt="Luxury Office" className="w-full h-full object-cover opacity-10 object-center mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05010a]/90 via-[#05010a]/95 to-[#05010a]"></div>
      </div>
      
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/20 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none z-0" />

      <header className="sticky top-0 z-50 bg-[#0a0514]/60 backdrop-blur-xl border-b border-red-500/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wide text-white">Super Admin Cabinet</h1>
            <p className="text-[10px] uppercase text-red-400 tracking-widest font-bold">Master Control</p>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-sm font-bold text-red-400 hover:text-white transition-colors">
          Return to Dashboard
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20"><Clock className="text-red-400" /></div> Pending Registrations
          </h2>
          <div className="px-4 py-2 bg-[#11081c]/80 backdrop-blur border border-red-500/30 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
            <Search size={16} className="text-red-400" />
            <input type="text" placeholder="Search requests..." className="bg-transparent border-none outline-none text-sm text-white" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-purple-400">Loading requests...</div>
        ) : pendingOrgs.length === 0 ? (
          <div className="text-center py-32 bg-[#0f081c] border border-purple-500/10 rounded-3xl">
            <Shield className="mx-auto text-purple-500/30 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">No Pending Requests</h3>
            <p className="text-purple-300">All organization registrations have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrgs.map(org => (
              <div key={org.id} className="bg-[#11081c] border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Pending
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{org.org_name}</h3>
                <p className="text-xs text-purple-300 uppercase tracking-wider mb-6 font-bold">{org.business_type?.replace('_', ' ')}</p>
                
                <div className="space-y-3 mb-8 text-sm">
                  <div className="flex justify-between border-b border-purple-500/10 pb-2">
                    <span className="text-purple-400">Owner</span>
                    <span className="text-white font-medium">{org.owner_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-purple-500/10 pb-2">
                    <span className="text-purple-400">Email</span>
                    <span className="text-white font-medium truncate ml-4">{org.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-purple-500/10 pb-2">
                    <span className="text-purple-400">Phone</span>
                    <span className="text-white font-medium">{org.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-purple-500/10 pb-2">
                    <span className="text-purple-400">Team Size</span>
                    <span className="text-white font-medium">{org.team_size}</span>
                  </div>
                  {org.working_hours?.cnic && (
                    <div className="flex justify-between border-b border-purple-500/10 pb-2">
                      <span className="text-red-400 font-semibold">CNIC</span>
                      <span className="text-white font-medium tracking-wider">{org.working_hours.cnic}</span>
                    </div>
                  )}
                  {org.working_hours?.city && (
                    <div className="flex justify-between border-b border-purple-500/10 pb-2">
                      <span className="text-purple-400">City</span>
                      <span className="text-white font-medium">{org.working_hours.city}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleApprove(org)} disabled={actionLoading === org.id}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                    {actionLoading === org.id ? 'Processing...' : <><CheckCircle size={18}/> Approve & Send Card</>}
                  </button>
                  <button onClick={() => handleReject(org.id)} disabled={actionLoading === org.id}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
