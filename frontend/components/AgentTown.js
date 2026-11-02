'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic, MicOff, Send, Sparkles, List, Activity, Settings as SettingsIcon, 
  Volume2, Shield, Lock, Unlock, Cpu, Layers, Radio, Terminal, 
  CheckCircle, AlertCircle, RefreshCw, Play, Zap, MessageSquare, Users, BookOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dispatchAgentTask, createEngineTask, getEngineAgents, getEngineTasks, executeEngineTaskClient } from '../lib/agentClient';

export default function AgentTown({ currentUser }) {
  if (!currentUser || !['admin', 'super_admin', 'sub_admin'].includes(currentUser.role)) {
    return null;
  }

  // ==========================================
  // 1. PIN SECURITY & SYSTEM GATE
  // ==========================================
  const [isAiUnlocked, setIsAiUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [masterPin, setMasterPin] = useState('7860');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('aurasuite_ai_unlocked') === 'true';
      setIsAiUnlocked(saved);
      const savedPin = localStorage.getItem('aurasuite_master_pin');
      if (savedPin) setMasterPin(savedPin);
    }
  }, []);

  const handleUnlockWithPin = (e) => {
    e?.preventDefault();
    if (enteredPin.trim() === masterPin) {
      setIsAiUnlocked(true);
      sessionStorage.setItem('aurasuite_ai_unlocked', 'true');
      setShowPinModal(false);
      setPinError('');
      setEnteredPin('');
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const chime = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(chime);
      }
    } else {
      setPinError('Invalid PIN! (Master PIN is 7860)');
    }
  };

  const handleLockAi = () => {
    setIsAiUnlocked(false);
    sessionStorage.removeItem('aurasuite_ai_unlocked');
    if (continuousMicActive) {
      stopContinuousListening();
    }
  };

  // ==========================================
  // 2. LIVE AGENT & ORCHESTRATOR STATES
  // ==========================================
  const [agentStates, setAgentStates] = useState({
    Saima: { state: 'idle', thought: 'Analyzing...' },
    Dani: { state: 'idle', thought: 'Fixing bugs' },
    Mianzi: { state: 'idle', thought: 'Printing...' },
    Zohaib: { state: 'idle', thought: 'Need coffee...' },
  });

  const [voiceInput, setVoiceInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeTaskBanner, setActiveTaskBanner] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [continuousMicActive, setContinuousMicActive] = useState(false);
  const [lastAssistantResponse, setLastAssistantResponse] = useState('');
  
  // Right console tabs: 'voice' | 'agent' | 'notes'
  const [activeTab, setActiveTab] = useState('voice');
  const [selectedAgentName, setSelectedAgentName] = useState('Saima');

  // Multi-turn chat messages feed
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'SYSTEM READY // سلام! میں آپ کا پرسنل AI اسسٹنٹ جارویس ہوں۔ بتائیے میں کیا مدد کر سکتا ہوں؟',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Phase 2A Engine States
  const [engineAgents, setEngineAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [engineTasks, setEngineTasks] = useState([]);

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showVoicesModal, setShowVoicesModal] = useState(false);

  // Settings State
  const [autoApprove, setAutoApprove] = useState(true);
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    groq: '',
    claude: '',
    openai: ''
  });
  const [savingKeys, setSavingKeys] = useState(false);

  // References for Continuous Mic and Echo Suppression
  const recognitionRef = useRef(null);
  const continuousMicActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    continuousMicActiveRef.current = continuousMicActive;
  }, [continuousMicActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, lastAssistantResponse]);

  // Load saved settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuto = localStorage.getItem('aurasuite_ai_auto_approve');
      if (savedAuto !== null) setAutoApprove(savedAuto === 'true');
    }
  }, []);

  // Load Phase 2A Agents and Tasks
  useEffect(() => {
    if (currentUser?.organization_id) {
      getEngineAgents(currentUser.organization_id).then(res => {
        if (res.agents) {
          setEngineAgents(res.agents);
          if (res.agents.length > 0) setSelectedAgentId(res.agents[0].id);
        }
      });
      loadTasks();
    }
  }, [currentUser?.organization_id]);

  const loadTasks = async () => {
    if (!currentUser?.organization_id) return;
    const res = await getEngineTasks(currentUser.organization_id);
    if (res.tasks) setEngineTasks(res.tasks);
  };

  // Realtime Supabase Subscription for Engine Tasks
  useEffect(() => {
    if (!currentUser?.organization_id) return;
    loadTasks();

    const channel = supabase
      .channel(`agent_town_sync_${currentUser.organization_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'engine_tasks', filter: `organization_id=eq.${currentUser.organization_id}` },
        () => {
          loadTasks();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_executions' },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.organization_id]);

  // Derive visual agent states from engine tasks
  useEffect(() => {
    const sorted = [...engineTasks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Auto-execute PENDING tasks orchestration loop
    const pendingTask = sorted.find(t => t.status === 'PENDING');
    if (pendingTask && !window.__isExecutingTask) {
       window.__isExecutingTask = true;
       console.log("Client Orchestrator: Auto-executing pending task", pendingTask.id);
       executeEngineTaskClient(pendingTask.id).finally(() => {
          window.__isExecutingTask = false;
       });
    }

    const newStates = {
      Saima: { state: 'idle', thought: 'Analyzing...' },
      Dani: { state: 'idle', thought: 'Fixing bugs' },
      Mianzi: { state: 'idle', thought: 'Printing...' },
      Zohaib: { state: 'idle', thought: 'Need coffee...' },
    };

    sorted.forEach(task => {
      const charName = task.agents?.character_name;
      if (!charName) return;

      const statusMap = {
        'PENDING': 'idle',
        'RUNNING': 'thinking',
        'ACTION_REQUIRED': 'thinking',
        'EXECUTING': 'working',
        'VERIFYING': 'researching',
        'VERIFIED': 'completed',
        'FAILED': 'failed',
        'COMPLETED': 'completed'
      };
      
      const st = statusMap[task.status] || 'idle';
      
      if (['PENDING', 'RUNNING', 'ACTION_REQUIRED', 'EXECUTING', 'VERIFYING'].includes(task.status)) {
        newStates[charName] = { 
          state: st, 
          thought: task.status === 'VERIFYING' ? 'Verifying output...' : 
                   task.status === 'ACTION_REQUIRED' ? 'Action Required!' : 
                   task.status === 'EXECUTING' ? 'Executing Actions...' : 
                   'Task: ' + task.title 
        };
      } else {
        if (task.status === 'FAILED') newStates[charName] = { state: 'error', thought: 'Failed: ' + (task.error ? task.error.slice(0, 15) : 'Error') };
        else if (task.status === 'VERIFIED' || task.status === 'COMPLETED') {
          newStates[charName] = { state: 'idle', thought: 'Task Completed' };
        }
      }
    });

    setAgentStates(newStates);
  }, [engineTasks]);

  // ==========================================
  // 3. JARVIS NEURAL VOICE PLAYBACK (/api/tts)
  // ==========================================
  const speakText = async (text) => {
    if (typeof window === 'undefined') return;
    if (!text || typeof text !== 'string') return;

    try {
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      // Temporary pause recognition while speaking to avoid echo loop
      if (recognitionRef.current && continuousMicActiveRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          URL.revokeObjectURL(audioUrl);
          // Resume continuous listening if still active
          if (continuousMicActiveRef.current) {
            startRecognitionInstance();
          }
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          URL.revokeObjectURL(audioUrl);
          if (continuousMicActiveRef.current) {
            startRecognitionInstance();
          }
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("Natural TTS endpoint fallback:", err);
    }

    // High quality browser fallback if server is unreachable
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferred = voices.find(v => (v.lang.includes('ur') || v.lang.includes('hi')) || (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David'))));
          if (preferred) utterance.voice = preferred;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (continuousMicActiveRef.current) {
            startRecognitionInstance();
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (continuousMicActiveRef.current) {
            startRecognitionInstance();
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis error", e);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (continuousMicActiveRef.current) {
        startRecognitionInstance();
      }
    }
  };

  // ==========================================
  // 4. CONTINUOUS HANDS-FREE MICROPHONE
  // ==========================================
  const startRecognitionInstance = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isSpeakingRef.current) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setActiveTaskBanner('🎙️ Continuous Mic: Online & Listening...');
      };

      recognition.onresult = (event) => {
        const lastIdx = event.results.length - 1;
        const transcript = event.results[lastIdx][0].transcript.trim();
        if (transcript) {
          setActiveTaskBanner(`Heard: "${transcript}"`);
          handleAssistantSubmit(null, transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setActiveTaskBanner(`Mic notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If continuous mode is enabled and Jarvis is not currently talking, restart listening immediately!
        if (continuousMicActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (continuousMicActiveRef.current && !isSpeakingRef.current) {
              try { recognition.start(); } catch (e) {}
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize recognition:", err);
      setIsListening(false);
    }
  };

  const toggleContinuousListening = () => {
    if (!isAiUnlocked) {
      setShowPinModal(true);
      return;
    }

    if (continuousMicActive) {
      stopContinuousListening();
    } else {
      setContinuousMicActive(true);
      continuousMicActiveRef.current = true;
      startRecognitionInstance();
    }
  };

  const stopContinuousListening = () => {
    setContinuousMicActive(false);
    continuousMicActiveRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    setActiveTaskBanner('Continuous Mic: Stopped');
  };

  // Clean up mic on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // ==========================================
  // 5. PROMPT & FAST-CHAT SUBMISSION
  // ==========================================
  const handleAssistantSubmit = async (e, promptOverride = null) => {
    e?.preventDefault();
    if (!isAiUnlocked) {
      setShowPinModal(true);
      return;
    }

    if (isDispatching) return;

    const promptText = (typeof promptOverride === 'string' ? promptOverride : voiceInput).trim() || 'Analyze market trends and draft initial growth strategy';
    setVoiceInput('');
    setIsDispatching(true);

    const userMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setActiveTaskBanner(`Processing: "${promptText.slice(0, 36)}..."`);

    // Campaign Routing
    if (promptText.toLowerCase().startsWith('/campaign')) {
       const campaignTopic = promptText.replace(/\/campaign/i, '').trim() || 'New Brand Launch';
       try {
         const orgId = currentUser?.organization_id || 'org-aurasuite-superadmin';
         const res = await fetch('/api/engine/campaign', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ prompt: campaignTopic, organization_id: orgId, created_by: currentUser?.id })
         });
         const data = await res.json();
         if (data.success) {
           const replyText = 'Campaign Started! The 5-Agent Swarm is now active across your ecosystem.';
           setChatMessages(prev => [...prev, {
             id: 'ast-' + Date.now(),
             sender: 'assistant',
             text: replyText,
             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
           }]);
           setLastAssistantResponse(replyText);
           speakText(replyText);
           setIsDispatching(false);
           return;
         }
       } catch(err) {
         console.error('Campaign start failed:', err);
         setActiveTaskBanner(`Campaign Error: ${err.message}`);
         setIsDispatching(false);
         return;
       }
    }

    const orgId = currentUser?.organization_id || 'org-aurasuite-superadmin';
    const userName = currentUser?.full_name || 'Admin';

    try {
      const res = await fetch('/api/assistant/fast-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptText, 
          orgId, 
          userName,
          autoApprove 
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (data.text) {
        let cleanAnswer = data.text;
        let isPlan = data.isActionPlan;

        // If JSON action plan, provide a natural spoken summary
        if (isPlan) {
          cleanAnswer = 'Action executed successfully, sir.';
        } else {
          cleanAnswer = cleanAnswer
            .replace(/\{[\s\S]*?\}/g, '')
            .replace(/Jarvis Execution Completed:|- [a-zA-Z_]+:/g, '')
            .trim();
        }

        const astMsg = {
          id: 'ast-' + Date.now(),
          sender: 'assistant',
          text: cleanAnswer || data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isActionPlan: isPlan
        };

        setChatMessages(prev => [...prev, astMsg]);
        setLastAssistantResponse(cleanAnswer || data.text);
        setActiveTaskBanner((cleanAnswer || data.text).slice(0, 60));

        if (cleanAnswer) {
          speakText(cleanAnswer.slice(0, 220));
        }
      }

      // Keep visual office animation active
      dispatchAgentTask({
        orgId,
        agentCodeName: 'researcher',
        title: promptText,
        inputPayload: { prompt: promptText, initiated_by: userName },
      }).catch(() => null);

    } catch (err) {
      console.warn('Fast chat fallback to standard engine:', err);
      createEngineTask({
        organization_id: orgId,
        title: promptText.slice(0, 50),
        prompt: promptText,
        assigned_agent_id: selectedAgentId || null,
        priority: 'MEDIUM',
        created_by: currentUser?.id
      }).then(tRes => {
        if (tRes?.task?.id) {
          executeEngineTaskClient(tRes.task.id).then(r => {
            if (r?.result) {
              const cAns = r.result.replace(/\{[\s\S]*?\}/g, '').trim();
              setChatMessages(prev => [...prev, {
                id: 'ast-' + Date.now(),
                sender: 'assistant',
                text: cAns,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]);
              setLastAssistantResponse(cAns);
              speakText(cAns.slice(0, 220));
            }
          });
        }
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const getStatusColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'thinking': return 'bg-amber-400 animate-pulse';
      case 'researching': return 'bg-orange-400 animate-pulse';
      case 'running':
      case 'creating': return 'bg-blue-400 animate-pulse';
      case 'generating': return 'bg-purple-400 animate-pulse';
      case 'verifying': return 'bg-indigo-400 animate-pulse';
      case 'completed': return 'bg-emerald-400';
      case 'failed': return 'bg-red-400';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="w-full bg-[#080911] border border-cyan-500/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.12)] my-5 flex flex-col font-sans">
      
      {/* ==========================================
          TOP STONIC OS STATUS HEADER
      ========================================== */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0d0e19] border-b border-cyan-500/20 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-400">
            <Zap size={14} className="text-cyan-400 animate-pulse" />
            <span className="font-mono text-sm uppercase">STONIC NEURAL OS</span>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className={`w-2 h-2 rounded-full ${isAiUnlocked ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
            <span>{isAiUnlocked ? 'AI CORE: ONLINE' : 'AI CORE: LOCKED'}</span>
          </div>
          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">
            <span>MASTER PIN: {masterPin}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="text-[11px] text-purple-300/80 mr-2 hidden lg:block truncate max-w-xs">
            {activeTaskBanner || 'AuraSuite Autonomous SuperAdmin Command Deck'}
          </div>

          {isAiUnlocked ? (
            <button 
              onClick={handleLockAi}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/60 transition-all text-[11px] font-mono cursor-pointer"
            >
              <Lock size={12} />
              <span>LOCK AI</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all text-[11px] font-mono shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer animate-pulse"
            >
              <Unlock size={12} />
              <span>START AI (PIN)</span>
            </button>
          )}

          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-lg bg-[#141624] border border-cyan-500/20 text-gray-400 hover:text-cyan-300 transition-colors"
            title="System Settings & BYOK Keys"
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>

      {/* ==========================================
          MAIN STONIC 3-PANEL COMMAND DECK
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-cyan-500/10">

        {/* --------------------------------------
            LEFT PANEL: MEDIA LINK & SAT-LINK FEED (3 cols)
        -------------------------------------- */}
        <div className="lg:col-span-3 bg-[#0a0b14] border-r border-cyan-500/15 p-3 flex flex-col gap-3">
          
          {/* MEDIA LINK FRAME */}
          <div className="bg-[#0f111e] border border-cyan-500/20 rounded-xl p-2.5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
                <Radio size={12} className="text-cyan-400 animate-pulse" />
                <span>MEDIA LINK</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono">
                LIVE 60FPS
              </span>
            </div>

            {/* Simulated Sat Camera / Audio Radar */}
            <div className="h-28 bg-[#07080f] rounded-lg border border-cyan-500/10 relative flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent)]"></div>
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.06)_1px,transparent_1px)]" style={{ backgroundSize: '100% 3px' }}></div>
              
              {/* Radar Rings */}
              <div className="relative w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
                <div className="w-10 h-10 rounded-full border border-dashed border-cyan-400/40"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></div>
              </div>

              <div className="mt-2 text-[10px] font-mono text-cyan-300/80 tracking-widest text-center">
                AURA-CORE CAM-01
              </div>
              <div className="text-[8px] text-gray-500 font-mono">SAT LINK STABLE • 18ms</div>
            </div>
          </div>

          {/* SAT-LINK FEED / INTELLIGENCE TICKER */}
          <div className="flex-1 bg-[#0f111e] border border-cyan-500/20 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/15">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
                  <Activity size={12} className="text-cyan-400" />
                  <span>SAT-LINK FEED</span>
                </div>
                <span className="text-[9px] text-gray-400 font-mono">ENCRYPTED</span>
              </div>

              <div className="space-y-2 text-[10px] font-mono text-gray-300">
                <div className="bg-[#090a12] p-2 rounded border border-cyan-500/10">
                  <div className="text-cyan-400 font-bold mb-0.5">⚡ SYSTEM DIRECTIVE</div>
                  <div className="text-gray-400 leading-relaxed">Personal Jarvis integrated with 24kHz Charon neural voice pool.</div>
                </div>

                <div className="bg-[#090a12] p-2 rounded border border-cyan-500/10">
                  <div className="text-purple-400 font-bold mb-0.5">🌐 LIVE HEADLINES</div>
                  <div className="text-gray-400 leading-relaxed">• Global AI Agent Swarm throughput peaked at 4.2M req/sec.</div>
                  <div className="text-gray-400 leading-relaxed mt-1">• AuraSuite PC Automation Daemon listening on local port.</div>
                  <div className="text-gray-400 leading-relaxed mt-1">• Windows Desktop tools: Notepad, Calc, Browser, File IO active.</div>
                </div>
              </div>
            </div>

            {/* Quick Stats Ticker */}
            <div className="pt-2 border-t border-cyan-500/10 grid grid-cols-2 gap-2 text-center text-[9px] font-mono">
              <div className="bg-[#080911] p-1.5 rounded border border-white/5">
                <span className="text-gray-500 block">CORE LATENCY</span>
                <span className="text-cyan-400 font-bold">0.42 SEC</span>
              </div>
              <div className="bg-[#080911] p-1.5 rounded border border-white/5">
                <span className="text-gray-500 block">VOICE ENGINE</span>
                <span className="text-emerald-400 font-bold">CHARON 24K</span>
              </div>
            </div>
          </div>

        </div>

        {/* --------------------------------------
            CENTER PANEL: AI REACTOR & AGENT TOWN (5 cols)
        -------------------------------------- */}
        <div className="lg:col-span-5 bg-[#090a13] p-3 flex flex-col gap-3">

          {/* TOP SECTION: HEX NODES + HOLOGRAPHIC AI REACTOR */}
          <div className="bg-[#0f111e] border border-cyan-500/20 rounded-xl p-3 flex items-center justify-between relative overflow-hidden">
            
            {/* Background Circuit Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 160">
                <path d="M 120 30 L 220 30 L 250 80" stroke="cyan" strokeWidth="1" fill="none" strokeDasharray="3 3" />
                <path d="M 120 65 L 200 65 L 240 80" stroke="#f59e0b" strokeWidth="1" fill="none" strokeDasharray="3 3" />
                <path d="M 120 100 L 200 100 L 240 80" stroke="#10b981" strokeWidth="1" fill="none" strokeDasharray="3 3" />
                <path d="M 120 135 L 220 135 L 250 80" stroke="#8b5cf6" strokeWidth="1" fill="none" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* 4 Hex Connection Buttons */}
            <div className="flex flex-col gap-2 z-10 w-28">
              <button 
                onClick={() => setShowMemoryModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
              >
                <Cpu size={12} className="text-cyan-400" />
                <span>MEMORY</span>
              </button>

              <button 
                onClick={() => setShowSkillsModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-amber-500/40 text-amber-300 hover:bg-amber-950/60 hover:border-amber-400 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                <Layers size={12} className="text-amber-400" />
                <span>SKILLS</span>
              </button>

              <button 
                onClick={() => setShowVoicesModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60 hover:border-emerald-400 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <Volume2 size={12} className="text-emerald-400" />
                <span>VOICES</span>
              </button>

              <button 
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-purple-500/40 text-purple-300 hover:bg-purple-950/60 hover:border-purple-400 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer"
              >
                <SettingsIcon size={12} className="text-purple-400" />
                <span>SETTING</span>
              </button>
            </div>

            {/* Center Holographic AI Sphere Reactor */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 pl-2">
              <div className="text-[9px] font-mono text-cyan-400/80 mb-1 flex items-center gap-1">
                <span>THINKING MODE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              </div>

              {/* Holographic Glowing Sphere */}
              <div 
                onClick={() => { if (!isAiUnlocked) setShowPinModal(true); }}
                className={`relative w-28 h-28 my-1 flex items-center justify-center cursor-pointer transition-all ${
                  isAiUnlocked ? 'scale-100 hover:scale-105' : 'scale-95 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Outer Glow */}
                <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
                  isSpeaking ? 'bg-cyan-400/40 scale-125' : 
                  isListening ? 'bg-red-500/30 scale-115' : 
                  isAiUnlocked ? 'bg-cyan-500/25' : 'bg-amber-500/20'
                }`}></div>

                {/* Rotating Tech Rings */}
                <div className={`absolute inset-0 rounded-full border border-dashed transition-all ${
                  isAiUnlocked ? 'border-cyan-400/40 animate-spin' : 'border-amber-500/40'
                }`} style={{ animationDuration: isSpeaking ? '2s' : '10s' }}></div>

                <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-[spin_15s_linear_infinite_reverse]"></div>

                {/* Core Sphere / Particle Grid */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#0a0514] via-[#101426] to-[#041c24] border-2 border-cyan-400/60 flex items-center justify-center shadow-[inset_0_0_20px_rgba(6,182,212,0.6)]">
                  <svg className="w-16 h-16 opacity-80" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="cyan" strokeWidth="0.5" strokeDasharray="2 3" className="animate-spin" style={{ transformOrigin: 'center', animationDuration: '6s' }} />
                    <circle cx="50" cy="50" r="24" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="3 3" className="animate-[spin_4s_linear_infinite_reverse]" style={{ transformOrigin: 'center' }} />
                    <circle cx="50" cy="50" r="12" fill={isAiUnlocked ? "cyan" : "#f59e0b"} className="animate-pulse" opacity="0.8" />
                  </svg>
                </div>
              </div>

              {/* Reactor Activation Button */}
              {isAiUnlocked ? (
                <div className="text-[10px] font-mono px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)] mt-1 flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-emerald-400" />
                  <span>NEURAL CORE ACTIVE</span>
                </div>
              ) : (
                <button 
                  onClick={() => setShowPinModal(true)}
                  className="text-[10px] font-mono px-3.5 py-1 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.6)] mt-1 flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <Unlock size={11} />
                  <span>START AI</span>
                </button>
              )}
            </div>

          </div>

          {/* BOTTOM SECTION: AGENT TOWN PIXEL WORKSPACE */}
          <div className="flex-1 bg-[#1a1b26] rounded-xl border border-cyan-500/20 flex flex-col overflow-hidden relative min-h-[300px]">
            
            {/* Pixel Map Header */}
            <div className="flex justify-between items-center p-2.5 border-b border-cyan-500/15 bg-[#0f111e]/90 backdrop-blur z-20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-white text-xs font-mono">AGENT TOWN</span>
              </div>

              {/* Agent Status Chips */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-950/60 border border-orange-500/40 text-[9px] text-orange-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agentStates.Saima?.state)}`}></span>
                  <span>Saima</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-[9px] text-blue-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agentStates.Dani?.state)}`}></span>
                  <span>Dani</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-[9px] text-red-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agentStates.Mianzi?.state)}`}></span>
                  <span>Mianzi</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-[9px] text-cyan-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agentStates.Zohaib?.state)}`}></span>
                  <span>Zohaib</span>
                </div>
              </div>
            </div>

            {/* Pixel Canvas with Characters and Opening Doors */}
            <div className="flex-1 bg-[#1a1b26] relative overflow-hidden h-[240px] w-full">
              <img src="/agent-town-map-clean.png" alt="Agent Town Map" className="w-full h-full object-cover opacity-90 mix-blend-lighten pointer-events-none" />

              {/* Animated Doors */}
              <div className="absolute w-[4.5%] h-[8%] bg-[#2d3142] z-10" style={{ left: '33.8%', top: '42%' }}>
                <div className="w-full h-full bg-[#d97736] border-2 border-[#944d1f] origin-left animate-[doorOpenLeft_20s_infinite]"></div>
              </div>
              <div className="absolute w-[4.5%] h-[8%] bg-[#2d3142] z-10" style={{ left: '74.5%', top: '42%' }}>
                <div className="w-full h-full bg-[#d97736] border-2 border-[#944d1f] origin-left animate-[doorOpenRight_20s_infinite]"></div>
              </div>

              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px)]" style={{ backgroundSize: '100% 4px' }}></div>

              {/* Character 1: Saima */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent1Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate">
                      {agentStates.Saima?.thought || 'Analyzing...'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20"></div>
                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-amber-800 rounded-t-sm"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-orange-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-blue-900 rounded-sm animate-[legSwing_0.5s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-blue-900 rounded-sm animate-[legSwing_0.5s_infinite_linear] [animation-delay:0.25s]"></div>
                </div>
              </div>

              {/* Character 2: Dani */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent2Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate">
                      {agentStates.Dani?.thought || 'Fixing bugs'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20"></div>
                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-slate-800 rounded-t-sm"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-slate-900 rounded-sm animate-[legSwing_0.6s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-slate-900 rounded-sm animate-[legSwing_0.6s_infinite_linear] [animation-delay:0.3s]"></div>
                </div>
              </div>

              {/* Character 3: Mianzi */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent3Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate">
                      {agentStates.Mianzi?.thought || 'Printing...'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#dcb193] rounded-sm border border-black/20"></div>
                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-black rounded-t-sm"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-red-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-gray-800 rounded-sm animate-[legSwing_0.7s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-gray-800 rounded-sm animate-[legSwing_0.7s_infinite_linear] [animation-delay:0.35s]"></div>
                </div>
              </div>

              {/* Character 4: Zohaib */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent4Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate">
                      {agentStates.Zohaib?.thought || 'Need coffee...'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#ffdecc] rounded-sm border border-black/20"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-cyan-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-indigo-900 rounded-sm animate-[legSwing_0.8s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-indigo-900 rounded-sm animate-[legSwing_0.8s_infinite_linear] [animation-delay:0.4s]"></div>
                </div>
              </div>

            </div>

            {/* Pixel Map Footer Bar */}
            <div className="p-2 bg-[#0d0e19] border-t border-cyan-500/15 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Swarm Engine: Ready</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('notes')}
                  className="px-2 py-1 rounded bg-[#141624] border border-cyan-500/20 text-cyan-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <List size={11} />
                  <span>History ({engineTasks.length})</span>
                </button>
                <button 
                  onClick={() => handleAssistantSubmit({ preventDefault: () => {} })}
                  disabled={isDispatching}
                  className="px-2 py-1 rounded bg-cyan-600/60 hover:bg-cyan-500 border border-cyan-400/40 text-white font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} className="text-yellow-400" />
                  <span>Dispatch Task</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* --------------------------------------
            RIGHT PANEL: MULTI-TAB CYBERPUNK CONSOLE (4 cols)
        -------------------------------------- */}
        <div className="lg:col-span-4 bg-[#0a0b14] p-3 flex flex-col justify-between">
          
          {/* Top Console Tabs */}
          <div>
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
              <div className="flex items-center gap-1 bg-[#0f111e] p-1 rounded-lg border border-cyan-500/20">
                <button 
                  onClick={() => setActiveTab('voice')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    activeTab === 'voice' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  VOICE
                </button>
                <button 
                  onClick={() => setActiveTab('agent')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    activeTab === 'agent' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  AGENT
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    activeTab === 'notes' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  NOTES / HISTORY
                </button>
              </div>

              <div className="text-[10px] font-mono text-cyan-400/70 flex items-center gap-1">
                <Terminal size={11} />
                <span>v2.5</span>
              </div>
            </div>

            {/* TAB CONTENT 1: VOICE ASSISTANT */}
            {activeTab === 'voice' && (
              <div className="flex flex-col h-[340px]">
                
                {/* Chat Message Stream */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[88%] p-2.5 rounded-xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-purple-950/70 border border-purple-500/30 text-purple-100' 
                          : 'bg-[#121424] border border-cyan-500/30 text-gray-200'
                      }`}>
                        {msg.sender === 'assistant' && (
                          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono font-bold mb-1">
                            <Zap size={10} />
                            <span>JARVIS (Charon)</span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        {msg.sender === 'assistant' && (
                          <button 
                            onClick={() => speakText(msg.text)} 
                            className="mt-1.5 text-[9px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer"
                          >
                            <Volume2 size={10} />
                            <span>Replay Audio</span>
                          </button>
                        )}
                      </div>
                      <span className="text-[8px] text-gray-500 font-mono mt-0.5 px-1">{msg.timestamp}</span>
                    </div>
                  ))}

                  {/* Audio Waveform Visualizer */}
                  {(isListening || isSpeaking) && (
                    <div className="bg-[#0f111e] border border-cyan-500/30 rounded-xl p-2.5 my-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-400' : 'bg-red-400'} animate-ping`}></span>
                        <span className="text-[10px] font-mono font-bold text-gray-300">
                          {isSpeaking ? "🔊 Jarvis Speaking (Charon 24kHz)..." : "🎙️ Continuous Mic Listening..."}
                        </span>
                      </div>
                      
                      {/* Wave Bars */}
                      <div className="flex items-center gap-1 h-5">
                        <div className="w-1 bg-cyan-400 rounded animate-[pulse_0.4s_infinite] h-3"></div>
                        <div className="w-1 bg-purple-400 rounded animate-[pulse_0.6s_infinite] h-5"></div>
                        <div className="w-1 bg-cyan-300 rounded animate-[pulse_0.3s_infinite] h-4"></div>
                        <div className="w-1 bg-pink-400 rounded animate-[pulse_0.5s_infinite] h-2"></div>
                        <div className="w-1 bg-cyan-400 rounded animate-[pulse_0.4s_infinite] h-5"></div>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: AGENT SWARM SELECTOR */}
            {activeTab === 'agent' && (
              <div className="h-[340px] flex flex-col justify-between overflow-y-auto custom-scrollbar pr-1">
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">SELECT SPECIALIZED AGENT:</div>
                  
                  {[
                    { name: 'Saima', role: 'Strategic Market Analyst', desc: 'Analyzes SaaS trends, competitive intelligence & expansion metrics.' },
                    { name: 'Dani', role: 'Senior Fullstack Architect', desc: 'Executes Next.js code, API integrations & database schema mutations.' },
                    { name: 'Mianzi', role: 'Autonomous Operations & Documents', desc: 'Drafts executive reports, client invoices & system paperwork.' },
                    { name: 'Zohaib', role: 'Security & QA Automation Specialist', desc: 'Automates user locking, access controls & penetration checks.' },
                  ].map(ag => (
                    <div 
                      key={ag.name}
                      onClick={() => setSelectedAgentName(ag.name)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        selectedAgentName === ag.name 
                          ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                          : 'bg-[#0f111e] border-cyan-500/10 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{ag.name}</span>
                        <span className="text-[9px] font-mono text-cyan-400">{ag.role}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{ag.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="p-2 bg-[#090a13] rounded-lg border border-cyan-500/20 text-[10px] text-gray-400 font-mono mt-2">
                  Active Direct Agent: <strong className="text-cyan-300">{selectedAgentName}</strong>. Prompts typed below will be delegated to this persona.
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: TASK ENGINE HISTORY */}
            {activeTab === 'notes' && (
              <div className="h-[340px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {engineTasks.length === 0 ? (
                  <div className="text-xs text-gray-500 font-mono text-center mt-12">No tasks in engine history yet.</div>
                ) : (
                  engineTasks.map(task => (
                    <div key={task.id} className="bg-[#0f111e] border border-cyan-500/20 rounded-xl p-2.5 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-gray-200 truncate max-w-[180px]">{task.title}</div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${getStatusColor(task.status)} text-black`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono flex justify-between mt-1">
                        <span>{task.agents?.name || 'Jarvis'}</span>
                        <span>{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {task.result && (
                        <div className="mt-2 bg-[#080911] p-1.5 rounded border border-white/5 text-[10px] text-gray-300 max-h-20 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                          {task.result}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Console Input Bar */}
          <form onSubmit={handleAssistantSubmit} className="pt-3 border-t border-cyan-500/15">
            <div className="flex items-center gap-2 bg-[#0f111e] border border-cyan-500/30 rounded-xl p-2 shadow-inner">
              <input 
                type="text" 
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder={isAiUnlocked ? "Type to Assistant (Gemini Live)..." : "Click 'START AI' or enter PIN to type..."}
                disabled={!isAiUnlocked}
                className="bg-transparent border-none outline-none text-xs text-white flex-1 px-2 placeholder-gray-500 font-sans" 
              />
              
              {/* Continuous Hands-Free Microphone Button */}
              <button 
                type="button" 
                onClick={toggleContinuousListening}
                title={continuousMicActive ? "Continuous Mic ACTIVE - Click to Stop" : "Click for Hands-Free Continuous Mic"}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  continuousMicActive 
                    ? "bg-red-600/30 text-red-300 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]" 
                    : "bg-[#141624] text-cyan-400 hover:text-white border-cyan-500/30 hover:border-cyan-400"
                }`}
              >
                {continuousMicActive ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} />}
              </button>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isDispatching || !isAiUnlocked} 
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg border border-cyan-400/40 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* ==========================================
          MODAL 1: 4-DIGIT AI SECURITY PIN DIALOG
      ========================================== */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] relative">
            <button 
              onClick={() => setShowPinModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <Shield size={24} />
              </div>
              
              <h3 className="text-base font-bold text-white font-mono tracking-wide">ENTER AI SECURITY PIN</h3>
              <p className="text-xs text-gray-400 mt-1">Authenticate to unlock AuraSuite Autonomous AI & Jarvis Voice Daemon.</p>
              
              <form onSubmit={handleUnlockWithPin} className="w-full mt-5">
                <input 
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter PIN (e.g. 7860)"
                  className="w-full text-center tracking-[8px] font-mono text-xl font-bold bg-[#07080f] border border-cyan-500/40 rounded-xl p-3 text-cyan-300 focus:border-cyan-400 outline-none"
                />

                {pinError && (
                  <div className="text-red-400 text-[11px] font-mono mt-2 font-bold">{pinError}</div>
                )}

                <div className="flex gap-2 mt-5">
                  <button 
                    type="button"
                    onClick={() => { setEnteredPin(masterPin); }}
                    className="flex-1 py-2 rounded-xl bg-[#141624] border border-cyan-500/20 text-cyan-300 text-xs font-mono hover:bg-cyan-950/60"
                  >
                    Use Master PIN (7860)
                  </button>

                  <button 
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer"
                  >
                    AUTHENTICATE
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: SYSTEM SETTINGS & BYOK KEYS
      ========================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] relative">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">AI ENGINE SETTINGS & BYOK</h3>
            </div>

            {/* Execution Mode Toggle */}
            <div className="bg-[#07080f] p-3.5 rounded-xl border border-cyan-500/20 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white">Execution Mode</span>
                <button 
                  onClick={() => {
                    const nextMode = !autoApprove;
                    setAutoApprove(nextMode);
                    localStorage.setItem('aurasuite_ai_auto_approve', nextMode ? 'true' : 'false');
                  }}
                  className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                    autoApprove ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {autoApprove ? '⚡ AUTO-EXECUTION' : '✋ ASK APPROVAL'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {autoApprove 
                  ? 'Autonomous mode: Jarvis executes OS and computer commands directly without requiring manual confirmation.' 
                  : 'Approval mode: Jarvis drafts an action plan and waits for your confirmation before executing.'}
              </p>
            </div>

            {/* Bring Your Own Key (BYOK) */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-cyan-300 font-mono uppercase">BRING YOUR OWN KEYS (BYOK):</div>
              
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Google Gemini API Key (Required for 24kHz Charon Voice & Fast Chat)</label>
                <input 
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeys.gemini}
                  onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                  className="w-full bg-[#07080f] border border-cyan-500/20 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Groq API Key (Ultra-Fast Fallback)</label>
                <input 
                  type="password"
                  placeholder="gsk_..."
                  value={apiKeys.groq}
                  onChange={(e) => setApiKeys({...apiKeys, groq: e.target.value})}
                  className="w-full bg-[#07080f] border border-cyan-500/20 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Master AI Security PIN</label>
                <input 
                  type="text"
                  maxLength={6}
                  value={masterPin}
                  onChange={(e) => {
                    setMasterPin(e.target.value);
                    localStorage.setItem('aurasuite_master_pin', e.target.value);
                  }}
                  className="w-full bg-[#07080f] border border-cyan-500/20 rounded-lg p-2 text-xs text-cyan-300 font-mono font-bold outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#141624] text-gray-300 text-xs font-mono"
              >
                Close
              </button>
              <button 
                onClick={async () => {
                  setSavingKeys(true);
                  try {
                    const orgId = currentUser?.organization_id || 'org-aurasuite-superadmin';
                    if (apiKeys.gemini) {
                      await fetch('/api/providers/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ organization_id: orgId, provider_name: 'gemini', api_key: apiKeys.gemini })
                      });
                    }
                    alert('Settings and Keys saved successfully!');
                    setShowSettingsModal(false);
                  } catch (e) {
                    alert('Save notice: ' + e.message);
                  } finally {
                    setSavingKeys(false);
                  }
                }}
                disabled={savingKeys}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer"
              >
                {savingKeys ? 'Saving...' : 'SAVE SETTINGS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: MEMORY & CONTEXT INSPECTOR
      ========================================== */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-cyan-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] relative">
            <button onClick={() => setShowMemoryModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={16}/></button>
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">NEURAL MEMORY // CONTEXT BUS</h3>
            </div>
            <div className="bg-[#07080f] p-3 rounded-xl border border-cyan-500/20 text-xs font-mono text-gray-300 space-y-2">
              <div><span className="text-cyan-400 font-bold">Active User:</span> {currentUser?.full_name || 'Admin'} ({currentUser?.role})</div>
              <div><span className="text-cyan-400 font-bold">Organization ID:</span> {currentUser?.organization_id || 'Superadmin'}</div>
              <div><span className="text-cyan-400 font-bold">Session Memory:</span> {chatMessages.length} Turns Ingested</div>
              <div><span className="text-cyan-400 font-bold">Context Tokens:</span> 1.4k / 1.0M Available</div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 4: SKILLS CAPABILITY MATRIX
      ========================================== */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.3)] relative">
            <button onClick={() => setShowSkillsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={16}/></button>
            <div className="flex items-center gap-2 mb-3">
              <Layers size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white font-mono">ACTIVE AI SKILLS & TOOLS</h3>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-[#07080f] p-2.5 rounded-lg border border-amber-500/20 text-gray-300">
                <span className="text-amber-400 font-bold">1. Windows Automation Daemon:</span> Launch apps (calc, notepad, chrome), execute system commands.
              </div>
              <div className="bg-[#07080f] p-2.5 rounded-lg border border-amber-500/20 text-gray-300">
                <span className="text-amber-400 font-bold">2. AuraSuite Enterprise Queries:</span> Real-time user counting, instant account locking/suspension.
              </div>
              <div className="bg-[#07080f] p-2.5 rounded-lg border border-amber-500/20 text-gray-300">
                <span className="text-amber-400 font-bold">3. Multi-Agent Swarm Orchestration:</span> Task decomposition across Saima, Dani, Mianzi & Zohaib.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 5: VOICES CONFIGURATION
      ========================================== */}
      {showVoicesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-emerald-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.3)] relative">
            <button onClick={() => setShowVoicesModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={16}/></button>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono">NEURAL VOICE ENGINE (CHARON)</h3>
            </div>
            <div className="bg-[#07080f] p-3 rounded-xl border border-emerald-500/20 text-xs font-mono text-gray-300 space-y-2">
              <div><span className="text-emerald-400 font-bold">Active Voice:</span> Charon (Iconic British Neural AI)</div>
              <div><span className="text-emerald-400 font-bold">Sampling Rate:</span> 24,000 Hz Linear PCM to WAV</div>
              <div><span className="text-emerald-400 font-bold">Model Pool:</span> gemini-3.8-flash-lite-tts, gemini-3.1-flash-tts-preview</div>
              <div><span className="text-emerald-400 font-bold">Echo Cancellation:</span> Dynamic mic muting during playback</div>
              <div><span className="text-emerald-400 font-bold">Google Translate:</span> Completely Purged & Disabled</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
