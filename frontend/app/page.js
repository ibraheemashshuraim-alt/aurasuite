'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Monitor, GraduationCap, Factory, Check, ArrowRight, Server, Shield, Cloud } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LandingPage() {
  const router = useRouter();
  
  // Registration Form State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '', ownerName: '', email: '', phone: '', businessType: 'software_house', teamSize: '1-10'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Showcase State
  const [activeMode, setActiveMode] = useState('software_house');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const { error } = await supabase.from('organizations').insert({
        org_name: formData.orgName,
        owner_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        business_type: formData.businessType,
        team_size: formData.teamSize,
        status: 'pending_approval' // This will be reviewed by Super Admin
      });

      if (error) {
        if (error.code === '23505') throw new Error('An organization with this email already exists.');
        throw error;
      }
      
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modeContent = {
    software_house: {
      title: "Agile Software Houses",
      desc: "Manage developers, track Jira-like tickets, calculate dynamic budgets, and present live staging iframes to clients securely.",
      features: ["Worker Activity Tracking", "Client Staging Vaults", "Automated Payroll Suggestions"]
    },
    academy: {
      title: "Digital Academies",
      desc: "Assess students via AI quizzes automatically. Grade them into Tiers, track assignments, and broadcast lectures with Zero-latency WebRTC.",
      features: ["AI Skill Assessment", "Tier-based Grouping", "Mass Live Lecture Broadcasting"]
    },
    factory: {
      title: "Industrial Factories",
      desc: "Monitor production lines, assign worker shifts, and streamline supply chain tasks. Use the Master Cabinet for full oversight.",
      features: ["Line Supervisor Controls", "Shift Attendance", "Material & Resource Tracking"]
    }
  };

  return (
    <div className="min-h-screen bg-[#05010a] text-[#f3f1f5] font-sans selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-700/20 rounded-full blur-[150px] pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#0a0514]/80 backdrop-blur-md border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.4)]">
              <Zap className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-wide">AuraSuite</span>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-purple-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#modes" className="hover:text-white transition-colors">Multi-Modes</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex gap-4">
            <button onClick={() => router.push('/admin')} className="px-5 py-2.5 text-sm font-bold text-purple-300 hover:text-white transition-colors">
              Login to Portal
            </button>
            <button onClick={() => setShowRegisterModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:scale-105 transition-all">
              Register Organization
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          AuraSuite 2.0 is Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          The All-in-One OS for <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400">
            Modern Workspaces
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-purple-200/80 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
          Streamline client delivery, dynamic AI skill assessments, secure payment-gated project vaults, and encrypted real-time meetings in one unified glassmorphism portal.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={() => setShowRegisterModal(true)} className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:scale-105 transition-all flex items-center gap-2">
            Start 14-Day Free Trial <ArrowRight size={18} />
          </button>
          <button disabled className="px-8 py-4 rounded-xl bg-[#11081c] border border-purple-500/20 text-purple-300 font-bold hover:bg-purple-900/20 transition-all opacity-50 cursor-not-allowed flex items-center gap-2">
            <Monitor size={18} /> Download Desktop App (Coming Soon)
          </button>
        </div>
      </section>

      {/* ── MULTI-MODE SHOWCASE ── */}
      <section id="modes" className="py-24 px-6 relative z-10 bg-gradient-to-b from-transparent to-[#0a0514]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Adaptable to Your Business</h2>
            <p className="text-purple-300">Switch modes instantly to reconfigure the portal for your exact industry.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col gap-3 w-full md:w-1/3">
              {[
                { id: 'software_house', icon: Monitor, label: 'Software House' },
                { id: 'academy', icon: GraduationCap, label: 'Academy' },
                { id: 'factory', icon: Factory, label: 'Factory' }
              ].map(mode => (
                <button key={mode.id} onClick={() => setActiveMode(mode.id)}
                  className={`p-6 rounded-2xl flex items-center gap-4 transition-all text-left border ${activeMode === mode.id ? 'bg-purple-900/40 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.2)] text-white' : 'bg-[#0f081c] border-purple-500/10 text-purple-400 hover:border-purple-500/30 hover:bg-purple-900/20'}`}>
                  <mode.icon size={28} className={activeMode === mode.id ? 'text-purple-300' : 'text-purple-500/50'} />
                  <span className="font-bold text-lg">{mode.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 bg-[#11081c] border border-purple-500/20 rounded-3xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-3xl font-bold text-white mb-4">{modeContent[activeMode].title}</h3>
              <p className="text-purple-200 leading-relaxed mb-8">{modeContent[activeMode].desc}</p>
              <div className="space-y-4">
                {modeContent[activeMode].features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <Check size={14} className="text-purple-400" />
                    </div>
                    <span className="text-white font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTALS SHOWCASE ── */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Three Interconnected Portals</h2>
            <p className="text-purple-300">Dedicated interfaces designed specifically for your Admins, Workers, and Clients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-[#11081c] to-[#0a0514] border border-purple-500/20 rounded-3xl p-8 hover:border-purple-400/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center mb-6 border border-purple-500/30">
                <Server className="text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Admin Master Cabinet</h3>
              <p className="text-sm text-purple-200/80 mb-6">Complete oversight with live active user logs, Zoom-like master meeting controls, and AI-suggested payment adjustments.</p>
            </div>

            <div className="bg-gradient-to-b from-[#11081c] to-[#0a0514] border border-purple-500/20 rounded-3xl p-8 hover:border-purple-400/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-900/50 flex items-center justify-center mb-6 border border-indigo-500/30">
                <Shield className="text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Worker Portal</h3>
              <p className="text-sm text-purple-200/80 mb-6">Digital Access Card authentication, dynamic AI technical onboarding quizzes, and real-time personal DM chats.</p>
            </div>

            <div className="bg-gradient-to-b from-[#11081c] to-[#0a0514] border border-purple-500/20 rounded-3xl p-8 hover:border-purple-400/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-900/50 flex items-center justify-center mb-6 border border-fuchsia-500/30">
                <Cloud className="text-fuchsia-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Client Sandbox</h3>
              <p className="text-sm text-purple-200/80 mb-6">Live in-app project staging previews, AI-generated daily summaries, and secure payment-gated file unlocking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-purple-500/10 py-10 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Zap size={16} /> <span className="font-bold tracking-widest">AURASUITE</span>
        </div>
        <p className="text-xs text-purple-500/50">© 2026 AuraSuite Inc. All rights reserved.</p>
      </footer>

      {/* ── REGISTRATION MODAL ── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel-glow border border-purple-500/40 rounded-3xl p-8 relative overflow-hidden">
            <button onClick={() => setShowRegisterModal(false)} className="absolute top-4 right-4 text-purple-400 hover:text-white">✕</button>
            
            {success ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <Check size={40} className="text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Request Submitted!</h3>
                <p className="text-sm text-purple-200">
                  Your registration request has been submitted. Our Super Admin will review it and send your Admin Access Card via Email within 24 hours.
                </p>
                <button onClick={() => setShowRegisterModal(false)} className="mt-4 px-8 py-3 bg-purple-900/40 border border-purple-500/30 rounded-xl text-white font-bold hover:bg-purple-800/50 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Register Organization</h3>
                  <p className="text-sm text-purple-300">Create your tenant workspace &amp; begin the 14-day trial.</p>
                </div>
                
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Organization Name</label>
                      <input type="text" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} required
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Business Type</label>
                      <select value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})}
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400 appearance-none">
                        <option value="software_house">Software House</option>
                        <option value="academy">Academy</option>
                        <option value="factory">Factory</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Owner Name</label>
                      <input type="text" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} required
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Team Size</label>
                      <select value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: e.target.value})}
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400 appearance-none">
                        <option value="1-10">1 - 10 Employees</option>
                        <option value="11-50">11 - 50 Employees</option>
                        <option value="50+">50+ Employees</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">Business Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="owner@company.com"
                      className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">Phone Number</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 mt-2 rounded-xl accent-gradient text-white font-bold glow-btn hover:scale-[1.02] transition-transform">
                    {loading ? 'Submitting Request...' : 'Submit Registration Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
