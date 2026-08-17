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
    orgName: '', ownerName: '', email: '', phone: '+92 ', businessType: 'software_house', teamSize: '1-10', cnic: '', city: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Showcase State
  const [activeMode, setActiveMode] = useState('software_house');
  
  // Background Carousel State
  const [bgIndex, setBgIndex] = useState(0);
  const bgImages = ['/bg-office.jpg', '/bg-building-1.jpg', '/bg-building-2.jpg'];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        status: 'pending_approval', // This will be reviewed by Super Admin
        working_hours: { cnic: formData.cnic, city: formData.city, start: "00:00", end: "23:59", is_24_7: false }
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
    <div className="min-h-screen bg-[#05010a] text-[#f3f1f5] font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      
      {/* Background Image Carousel & Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out">
        {bgImages.map((src, i) => (
          <img key={src} src={src} alt="Luxury Office Background" 
               className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 object-center ${bgIndex === i ? 'opacity-60' : 'opacity-0'}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05010a]/50 via-[#05010a]/70 to-[#05010a]"></div>
      </div>
      
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-700/20 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#0a0514]/60 backdrop-blur-xl border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.4)]" style={{ transformStyle: 'preserve-3d', animation: 'spin-slow 6s linear infinite' }}>
              <Zap className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-wide">AuraSuite</span>
            <style jsx>{`
              @keyframes spin-slow {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
              }
              @keyframes float-3d {
                0% { transform: perspective(1000px) rotateX(15deg) rotateY(-10deg) translateZ(0px); }
                50% { transform: perspective(1000px) rotateX(-5deg) rotateY(15deg) translateZ(30px); }
                100% { transform: perspective(1000px) rotateX(15deg) rotateY(-10deg) translateZ(0px); }
              }
            `}</style>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-purple-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#modes" className="hover:text-white transition-colors">Multi-Modes</a>
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a href="#privacy" className="hover:text-white transition-colors">Privacy & Rules</a>
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-6 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          AuraSuite Premium is Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] flex flex-col items-center justify-center relative z-20">
          <span style={{ textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>The Ultimate OS for</span> <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-fuchsia-300 to-indigo-500 font-black tracking-wide" 
                style={{ 
                  display: 'inline-block', 
                  animation: 'float-3d 6s ease-in-out infinite', 
                  padding: '20px 0',
                  filter: 'drop-shadow(0 20px 20px rgba(147, 51, 234, 0.4)) drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))' 
                }}>
            AuraSuite
          </span>
        </h1>
        
        <p className="text-lg text-purple-200/90 max-w-2xl mx-auto mb-10 leading-relaxed font-medium" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          Experience world-class software house management. From client vaults and AI metrics to strict access control and real-time activity tracking, packed in a breathtaking glassmorphism design.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={() => setShowRegisterModal(true)} className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:scale-105 transition-all flex items-center gap-2">
            Register Your Software House <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── REAL SHOWCASE ── */}
      <section id="showcase" className="py-24 px-6 relative z-10 bg-gradient-to-b from-[#0a0514]/80 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Inside The Portal</h2>
            <p className="text-purple-300">A sneak peek into our luxury management interfaces.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-purple-500/20 overflow-hidden shadow-[0_10px_40px_rgba(147,51,234,0.15)] group relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-white font-bold text-xl">Admin Master Control</h3>
              </div>
              <img src="/screenshot-admin.png" alt="Admin Dashboard" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700 blur-[0.5px] opacity-90 border-t border-purple-500/30" />
            </div>
            <div className="rounded-2xl border border-purple-500/20 overflow-hidden shadow-[0_10px_40px_rgba(147,51,234,0.15)] group relative bg-black">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-white font-bold text-xl">Client & Worker Vaults</h3>
              </div>
              <img src="/screenshot-worker.png" alt="Vaults" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700 opacity-90 border-t border-purple-500/30" />
            </div>
          </div>
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

      {/* ── FEATURES SECTION (Three Interconnected Portals) ── */}
      <section id="features" className="py-24 px-6 relative z-10 bg-[#0a0514]">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Three Interconnected Portals</h2>
          <p className="text-purple-300">Dedicated interfaces designed specifically for your Admins, Workers, and Clients, packed with industry-leading features.</p>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#11081c] border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/50 transition-all hover:transform hover:-translate-y-2 flex flex-col h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center mb-6 border border-purple-500/30">
              <Server className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Admin Master Cabinet</h3>
            <p className="text-sm text-purple-200/80 leading-relaxed mb-4">
              Complete oversight over your entire organization. Manage users, track active sessions, and oversee operations in real-time.
            </p>
            <ul className="text-sm text-purple-300/90 space-y-2 list-disc pl-4 mt-auto">
              <li>Live Active User Logs & Session Tracking</li>
              <li>Zoom-like Master WebRTC Video Controls</li>
              <li>AI-Suggested Payment & Salary Adjustments</li>
              <li>Dynamic Department & Team Size Management</li>
            </ul>
          </div>

          <div className="bg-[#11081c] border border-indigo-500/20 rounded-2xl p-8 hover:border-indigo-500/50 transition-all hover:transform hover:-translate-y-2 flex flex-col h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/30 flex items-center justify-center mb-6 border border-indigo-500/30">
              <Shield className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Worker Portal</h3>
            <p className="text-sm text-purple-200/80 leading-relaxed mb-4">
              A dedicated, distraction-free environment for your employees to work, track their hours, and securely communicate.
            </p>
            <ul className="text-sm text-purple-300/90 space-y-2 list-disc pl-4 mt-auto">
              <li>Digital Access Card Authentication (Gold/Silver)</li>
              <li>Dynamic AI Technical Onboarding Quizzes</li>
              <li>Real-time Secure Personal DM Chats</li>
              <li>Automated Hours Tracking & Auto-Lock</li>
            </ul>
          </div>

          <div className="bg-[#11081c] border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/50 transition-all hover:transform hover:-translate-y-2 flex flex-col h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-12 rounded-xl bg-pink-900/30 flex items-center justify-center mb-6 border border-pink-500/30">
              <Cloud className="text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Client Sandbox</h3>
            <p className="text-sm text-purple-200/80 leading-relaxed mb-4">
              Give your clients complete transparency with a premium sandbox to view project progress, invoices, and milestones.
            </p>
            <ul className="text-sm text-purple-300/90 space-y-2 list-disc pl-4 mt-auto">
              <li>Live In-App Project Staging Previews</li>
              <li>AI-Generated Daily Progress Summaries</li>
              <li>Secure Payment-Gated File Unlocking</li>
              <li>Direct Encrypted Chat with Admins</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── PRIVACY & RULES SECTION ── */}
      <section id="privacy" className="py-24 px-6 relative z-10 bg-gradient-to-t from-[#0a0514] to-[#11081c]/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          <div className="bg-[#11081c] border border-red-500/30 rounded-3xl p-10 shadow-[0_0_40px_rgba(239,68,68,0.1)] flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center border border-red-500/30">
                <Shield className="text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Strict Privacy & Suspension Policy</h2>
            </div>
            <div className="space-y-6 text-purple-200/90 text-sm leading-relaxed flex-1">
              <p>
                <strong className="text-white">1. Absolute Privacy Standards:</strong> AuraSuite employs advanced end-to-end encryption for all organization data. Messages, client files, source code staging, and financial business logic are fully isolated per tenant. Your data is never shared with third-party vendors, ensuring top-tier enterprise privacy.
              </p>
              <div>
                <strong className="text-white">2. Suspension Criteria:</strong> A registered Software House, Academy, or Factory can be suspended instantly without notice if they engage in:
                <ul className="list-disc pl-6 space-y-3 mt-4 text-red-300/90 font-medium">
                  <li>Fraudulent activities, scamming clients out of payments, or failing to deliver verified milestones after collecting funds.</li>
                  <li>Attempting to bypass, reverse-engineer, or manipulate the built-in tracking, video monitoring, and automated attendance systems.</li>
                  <li>Registering with a fake identification (CNIC) or providing misleading legal organization details during the initial approval phase.</li>
                </ul>
              </div>
              <p>
                <strong className="text-white">3. Master Super Admin Authority:</strong> The overarching Super Admin reserves the ultimate right to suspend, ban, or investigate any registered portal if malicious behavior or violation of the terms of service is detected on the network, keeping the ecosystem completely safe.
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#11081c] to-indigo-900/10 border border-purple-500/30 rounded-3xl p-10 shadow-[0_0_40px_rgba(147,51,234,0.1)] flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center border border-purple-500/30">
                <Server className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Advanced Platform Features</h2>
            </div>
            <div className="space-y-6 text-purple-200/90 text-sm leading-relaxed flex-1">
              <p>
                <strong className="text-white">The Ultimate Master Control:</strong> Once approved, your organization gains access to a dedicated tenant workspace. The Super Admin of your organization controls the entire ecosystem—from creating sub-admins and managers to assigning specific worker roles and configuring complex multi-mode setups.
              </p>
              <p>
                <strong className="text-white">Client & Student Vaults:</strong> Invite external clients or students to their own restricted sandbox portals via secure Magic Links and digital cards. Clients can securely view their staging projects, read daily AI summaries, and unlock payment-gated deliverables using dynamic invoice triggers.
              </p>
              <p>
                <strong className="text-white">Realtime Monitoring & Automation:</strong> Experience true 24/7 autonomous management. AuraSuite tracks active sessions via WebSocket, monitors live WebRTC meetings, issues AI skill assessments automatically based on job titles, and strictly manages working hours to auto-lock the portal out-of-hours, preventing unauthorized off-hours access.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-purple-500/20 bg-[#05010a] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>
            <span className="font-bold text-lg tracking-wide text-white">AuraSuite</span>
          </div>
          
          <div className="flex gap-8 text-sm text-purple-300/80">
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
            <button onClick={() => router.push('/super-admin')} className="hover:text-red-400 font-bold transition-colors">Super Admin</button>
            <a href="#" className="hover:text-purple-400 transition-colors">Contact Support</a>
          </div>

          <div className="text-sm font-medium text-purple-300/60 bg-[#11081c] px-4 py-2 rounded-full border border-purple-500/20">
            For inquiries, contact: <span className="text-white font-bold tracking-wider">03703603184</span>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-purple-400/40">
          &copy; {new Date().getFullYear()} AuraSuite Inc. All rights reserved. The ultimate OS for luxury workspaces.
        </div>
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
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Owner Name (Admin Full Name)</label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Business Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="owner@company.com"
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Phone Number</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="+92 3XX XXXXXXX"
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">Admin CNIC Number</label>
                      <input type="text" value={formData.cnic} 
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 5) val = val.substring(0, 5) + '-' + val.substring(5);
                          if (val.length > 13) val = val.substring(0, 13) + '-' + val.substring(13, 14);
                          setFormData({...formData, cnic: val})
                        }} 
                        required placeholder="XXXXX-XXXXXXX-X" maxLength="15"
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-purple-300 block mb-1">City</label>
                      <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required placeholder="e.g. Lahore"
                        className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400" />
                    </div>
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
