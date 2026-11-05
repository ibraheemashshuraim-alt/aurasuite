'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic, MicOff, Send, Sparkles, List, Activity, Settings as SettingsIcon, 
  Volume2, Shield, Lock, Unlock, Cpu, Layers, Radio, Terminal, 
  CheckCircle, AlertCircle, RefreshCw, Play, Zap, MessageSquare, Users, 
  Monitor, Share2, Eye, Sliders, Check, UserCheck, Bot, Laptop, Key, Globe, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dispatchAgentTask, createEngineTask, getEngineAgents, getEngineTasks, executeEngineTaskClient } from '../lib/agentClient';

export default function AgentTown({ currentUser }) {
  if (!currentUser || !['admin', 'super_admin', 'sub_admin'].includes(currentUser.role)) {
    return null;
  }

  // ==========================================
  // 1. PIN SECURITY & GATE BANNER
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
      setPinError('Invalid PIN! Please check the PIN sent to your email or chat.');
    }
  };

  const handleLockAi = () => {
    setIsAiUnlocked(false);
    sessionStorage.removeItem('aurasuite_ai_unlocked');
    if (continuousMicActive) {
      stopContinuousListening();
    }
    stopScreenShare();
  };

  // ==========================================
  // 2. LIVE 5-AGENT SWARM STATES
  // ==========================================
  const [agentStates, setAgentStates] = useState({
    Saima: { state: 'working', thought: 'Analyzing SaaS metrics...' },
    Dani: { state: 'working', thought: 'Writing Next.js API route...' },
    Mianzi: { state: 'idle', thought: 'Reviewing audit docs...' },
    Zohaib: { state: 'working', thought: 'Running security scan...' },
    Aura: { state: 'thinking', thought: 'Coordinating agent swarm...' },
  });

  const [voiceInput, setVoiceInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeTaskBanner, setActiveTaskBanner] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [continuousMicActive, setContinuousMicActive] = useState(false);
  const [lastAssistantResponse, setLastAssistantResponse] = useState('');
  
  // Voice Settings: Gender & Specific Voice Name
  const [voiceGender, setVoiceGender] = useState('male');
  const [selectedVoiceName, setSelectedVoiceName] = useState('Charon');

  // Right console tabs: 'voice' | 'agent' | 'notes'
  const [activeTab, setActiveTab] = useState('voice');
  const [selectedAgentName, setSelectedAgentName] = useState('Saima');

  // Multi-turn chat messages feed
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'SYSTEM READY // سلام! میں آپ کا پرسنل AI اسسٹنٹ ہوں۔ بتائیے میں آپ کی کیا خدمت کر سکتا ہوں؟',
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

  // Settings: Execution mode & AI Providers
  const [autoApprove, setAutoApprove] = useState(true);
  const [connectModes, setConnectModes] = useState({
    gemini: 'subscription', // 'subscription' | 'api'
    openai: 'subscription',
    groq: 'api',
    claude: 'subscription'
  });
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    groq: '',
    claude: '',
    openai: ''
  });
  const [subscriptionTokens, setSubscriptionTokens] = useState({
    gemini: '',
    openai: '',
    groq: '',
    claude: ''
  });
  const [providerModels, setProviderModels] = useState({
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o',
    groq: 'llama-3.3-70b-versatile',
    claude: 'claude-3-5-sonnet-20241022'
  });
  const [providerTestStatus, setProviderTestStatus] = useState({
    gemini: 'idle',
    openai: 'idle',
    groq: 'idle',
    claude: 'idle'
  });
  const [providerTestMsg, setProviderTestMsg] = useState({
    gemini: '',
    openai: '',
    groq: '',
    claude: ''
  });
  const [savingKeys, setSavingKeys] = useState(false);

  // 5-Agent Individual Custom Training Prompts
  const [agentPrompts, setAgentPrompts] = useState({
    Saima: 'Act as Chief Market Analyst. Focus on SaaS growth, user acquisition metrics, and competitive pricing analysis.',
    Dani: 'Act as Lead Fullstack Architect. Specialize in Next.js 16, Supabase SQL, API routes, and high-performance frontend engineering.',
    Mianzi: 'Act as Autonomous Documentation & Operations Specialist. Generate professional corporate summaries, invoices, and process manuals.',
    Zohaib: 'Act as Security & QA Specialist. Audit user permissions, enforce 2FA/access rules, and monitor system vulnerability logs.',
    Aura: 'Act as Chief AI Coordinator. Decompose complex user goals into sub-tasks and orchestrate work across the agent swarm.'
  });

  // Screen Share in Media Link
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef(null);
  const screenStreamRef = useRef(null);

  // References for Ultra-Low Latency Continuous Mic and Echo Suppression
  const [speechLang, setSpeechLang] = useState('ur-PK'); // 'ur-PK' or 'en-US'
  const speechLangRef = useRef('ur-PK');
  const silenceTimerRef = useRef(null);
  const isDispatchingRef = useRef(false);

  const recognitionRef = useRef(null);
  const continuousMicActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    speechLangRef.current = speechLang;
  }, [speechLang]);

  useEffect(() => {
    isDispatchingRef.current = isDispatching;
  }, [isDispatching]);

  useEffect(() => {
    continuousMicActiveRef.current = continuousMicActive;
  }, [continuousMicActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, lastAssistantResponse]);

  // Load saved settings & agent prompts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuto = localStorage.getItem('aurasuite_ai_auto_approve');
      if (savedAuto !== null) setAutoApprove(savedAuto === 'true');

      const savedGender = localStorage.getItem('aurasuite_voice_gender');
      if (savedGender) setVoiceGender(savedGender);

      const savedVoice = localStorage.getItem('aurasuite_selected_voice');
      if (savedVoice) setSelectedVoiceName(savedVoice);

      const savedPrompts = localStorage.getItem('aurasuite_agent_prompts');
      if (savedPrompts) {
        try { setAgentPrompts(JSON.parse(savedPrompts)); } catch (e) {}
      }

      const savedKeys = localStorage.getItem('aurasuite_byok_keys');
      if (savedKeys) {
        try { setApiKeys(JSON.parse(savedKeys)); } catch (e) {}
      }
    }
  }, []);

  // Screen Sharing WebRTC Functionality
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScreenSharing(true);
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("Screen share cancelled:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  // Test Provider Connection
  const testProviderConnection = async (provider) => {
    setProviderTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
    setProviderTestMsg(prev => ({ ...prev, [provider]: 'Testing connection...' }));
    try {
      const res = await fetch('/api/providers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          mode: connectModes[provider] || 'api',
          apiKey: apiKeys[provider],
          token: subscriptionTokens[provider]
        })
      });
      const data = await res.json();
      if (data.success) {
        setProviderTestStatus(prev => ({ ...prev, [provider]: 'success' }));
        setProviderTestMsg(prev => ({ ...prev, [provider]: `✓ ${data.message} (${data.latencyMs}ms)` }));
      } else {
        setProviderTestStatus(prev => ({ ...prev, [provider]: 'error' }));
        setProviderTestMsg(prev => ({ ...prev, [provider]: `❌ ${data.error}` }));
      }
    } catch (err) {
      setProviderTestStatus(prev => ({ ...prev, [provider]: 'error' }));
      setProviderTestMsg(prev => ({ ...prev, [provider]: `❌ ${err.message}` }));
    }
  };

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

  // Realtime Supabase Subscription for Engine Tasks & agent_executions
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
      Saima: { state: 'working', thought: 'Analyzing metrics' },
      Dani: { state: 'working', thought: 'Writing code' },
      Mianzi: { state: 'idle', thought: 'Printing docs...' },
      Zohaib: { state: 'working', thought: 'Security scan' },
      Aura: { state: 'thinking', thought: 'Coordinating swarm' },
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
          newStates[charName] = { state: 'working', thought: 'Task Completed' };
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

      // Pause recognition while speaking to avoid echo loop
      if (recognitionRef.current && continuousMicActiveRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: selectedVoiceName,
          gender: voiceGender
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          URL.revokeObjectURL(audioUrl);
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
  // 4. CONTINUOUS HANDS-FREE MICROPHONE (ULTRA-LOW LATENCY)
  // ==========================================
  const startRecognitionInstance = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isSpeakingRef.current || isDispatchingRef.current) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLangRef.current || 'ur-PK';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setActiveTaskBanner(`🎙️ Listening (${speechLangRef.current === 'ur-PK' ? 'اردو' : 'English'})... Speak now`);
      };

      recognition.onresult = (event) => {
        if (isSpeakingRef.current || isDispatchingRef.current) return;

        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }

        const candidateText = (finalText || interimText).trim();
        if (candidateText) {
          setActiveTaskBanner(`🎙️ "${candidateText}"`);

          clearTimeout(silenceTimerRef.current);
          // Instant conversational debounce: 500ms on final word, 850ms on interim
          const debounceMs = finalText ? 500 : 850;
          silenceTimerRef.current = setTimeout(() => {
            if (!isDispatchingRef.current && !isSpeakingRef.current) {
              const toSend = candidateText.trim();
              if (toSend && toSend.length >= 2) {
                try { recognition.abort(); } catch (e) {}
                handleAssistantSubmit(null, toSend);
              }
            }
          }, debounceMs);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn("Speech recognition notice:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (continuousMicActiveRef.current && !isSpeakingRef.current && !isDispatchingRef.current) {
          setTimeout(() => {
            if (continuousMicActiveRef.current && !isSpeakingRef.current && !isDispatchingRef.current) {
              try { recognition.start(); } catch (e) {}
            }
          }, 150);
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
    clearTimeout(silenceTimerRef.current);
    setContinuousMicActive(false);
    continuousMicActiveRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    setActiveTaskBanner('Continuous Mic: Stopped');
  };

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

        // If action plan, trigger local system execution fallback
        if (data.actions && Array.isArray(data.actions)) {
          data.actions.forEach(act => {
            fetch('/api/system/execute-action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(act)
            }).catch(() => null);
          });
        }

        cleanAnswer = cleanAnswer
          .replace(/\{[\s\S]*?\}/g, '')
          .replace(/Jarvis Execution Completed:|- [a-zA-Z_]+:/g, '')
          .trim();

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
      case 'working': return 'bg-emerald-400 animate-pulse';
      case 'failed': return 'bg-red-400';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-green-500';
    }
  };

  // =========================================================================
  // RENDER CASE 1: AI LOCKED -> SHOW BEAUTIFUL CYBERPUNK GATE BANNER
  // =========================================================================
  if (!isAiUnlocked) {
    return (
      <div className="w-full my-6 rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#070811] via-[#0d1022] to-[#05060d] shadow-[0_0_60px_rgba(6,182,212,0.18)] p-8 relative font-sans group">
        {/* Futuristic Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px)]" style={{ backgroundSize: '100% 4px' }}></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Text & Capabilities Badges */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>AURASUITE AI OS // ENTERPRISE NEURAL GATE</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Autonomous 5-Agent Swarm & Jarvis Assistant
            </h2>

            <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
              Initialize your dedicated AI Operating System. Featuring an autonomous 5-Agent Swarm at interactive workstations, real-time Computer Screen Sharing, 24kHz Neural Voice, and Windows Desktop Automation.
            </p>

            <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
              <span className="px-3 py-1 rounded-lg bg-[#0e1224] border border-cyan-500/20 text-xs font-mono text-cyan-300">
                👥 5 Active Agents
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#0e1224] border border-purple-500/20 text-xs font-mono text-purple-300">
                🎙️ Male & Female 24kHz Voice
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#0e1224] border border-emerald-500/20 text-xs font-mono text-emerald-300">
                🖥️ Live Screen Sharing
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#0e1224] border border-amber-500/20 text-xs font-mono text-amber-300">
                ⚡ Auto-Execution Engine
              </span>
            </div>
          </div>

          {/* Right Holographic Orb & START AI Action Button */}
          <div className="flex flex-col items-center justify-center bg-[#0a0d1c]/80 border border-cyan-500/30 p-6 rounded-2xl shadow-2xl backdrop-blur-md min-w-[280px]">
            <div 
              onClick={() => setShowPinModal(true)}
              className="relative w-32 h-32 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/50 animate-spin" style={{ animationDuration: '12s' }}></div>
              <div className="absolute inset-3 rounded-full border border-purple-500/40 animate-[spin_8s_linear_infinite_reverse]"></div>
              
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#050b14] to-[#0d1e2e] border-2 border-cyan-400 flex items-center justify-center shadow-[inset_0_0_20px_rgba(6,182,212,0.6)]">
                <Shield size={32} className="text-cyan-400 animate-pulse" />
              </div>
            </div>

            <button 
              onClick={() => setShowPinModal(true)}
              className="mt-6 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 cursor-pointer transition-all animate-pulse"
            >
              <Unlock size={16} />
              <span>START AI</span>
            </button>

            <span className="text-[11px] font-mono text-gray-400 mt-2">
              Requires 4-Digit Security PIN
            </span>
          </div>

        </div>

        {/* PIN Entry Modal */}
        {showPinModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0e101d] border-2 border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.4)] relative">
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
                <p className="text-xs text-gray-400 mt-1">Authenticate to unlock AuraSuite AI OS and Swarm Command Deck.</p>
                
                <form onSubmit={handleUnlockWithPin} className="w-full mt-5">
                  <input 
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    placeholder="Enter PIN"
                    className="w-full text-center tracking-[10px] font-mono text-2xl font-bold bg-[#07080f] border border-cyan-500/40 rounded-xl p-3 text-cyan-300 focus:border-cyan-400 outline-none"
                  />

                  {pinError && (
                    <div className="text-red-400 text-[11px] font-mono mt-2 font-bold">{pinError}</div>
                  )}

                  <div className="flex gap-2 mt-5">
                    <button 
                      type="button"
                      onClick={() => setShowPinModal(false)}
                      className="flex-1 py-2 rounded-xl bg-[#141624] text-gray-300 text-xs font-mono hover:bg-gray-800"
                    >
                      Cancel
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
      </div>
    );
  }

  // =========================================================================
  // RENDER CASE 2: AI UNLOCKED -> FULL 3-PANEL COMMAND DECK
  // =========================================================================
  return (
    <div className="w-full bg-[#080911] border border-cyan-500/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.12)] my-5 flex flex-col font-sans">
      
      {/* ==========================================
          TOP STATUS HEADER
      ========================================== */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0d0e19] border-b border-cyan-500/20 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-400">
            <Zap size={14} className="text-cyan-400 animate-pulse" />
            <span className="font-mono text-sm uppercase">AURASUITE AI OS</span>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>AI CORE: ONLINE</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
            <span>5 AGENTS ENGAGED</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="text-[11px] text-purple-300/80 mr-2 hidden lg:block truncate max-w-xs">
            {activeTaskBanner || 'AuraSuite Autonomous SuperAdmin Command Deck'}
          </div>

          <button 
            onClick={handleLockAi}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/60 transition-all text-[11px] font-mono cursor-pointer"
          >
            <Lock size={12} />
            <span>LOCK AI</span>
          </button>

          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-lg bg-[#141624] border border-cyan-500/20 text-gray-400 hover:text-cyan-300 transition-colors"
            title="System Settings, BYOK & Agent Training"
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>

      {/* ==========================================
          MAIN 3-PANEL COMMAND DECK
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-cyan-500/10">

        {/* --------------------------------------
            LEFT PANEL: MEDIA LINK & SAT-LINK FEED (3 cols)
        -------------------------------------- */}
        <div className="lg:col-span-3 bg-[#0a0b14] border-r border-cyan-500/15 p-3 flex flex-col gap-3">
          
          {/* MEDIA LINK & REAL SCREEN SHARING FRAME */}
          <div className="bg-[#0f111e] border border-cyan-500/20 rounded-xl p-2.5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
                <Monitor size={12} className="text-cyan-400" />
                <span>MEDIA LINK // SCREEN</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                isScreenSharing 
                  ? 'bg-red-950 border border-red-500/40 text-red-400 animate-pulse' 
                  : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
              }`}>
                {isScreenSharing ? 'SHARING' : 'READY'}
              </span>
            </div>

            {/* Video / Radar Display */}
            <div className="h-32 bg-[#07080f] rounded-lg border border-cyan-500/10 relative flex flex-col items-center justify-center overflow-hidden">
              {isScreenSharing ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent)]"></div>
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.06)_1px,transparent_1px)]" style={{ backgroundSize: '100% 3px' }}></div>
                  
                  {/* Radar Rings */}
                  <div className="relative w-14 h-14 rounded-full border border-cyan-500/30 flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
                    <div className="w-8 h-8 rounded-full border border-dashed border-cyan-400/40"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></div>
                  </div>

                  <div className="mt-1 text-[9px] font-mono text-cyan-300/80 tracking-widest text-center">
                    AURA-SCREEN CAPTURE
                  </div>
                </>
              )}
            </div>

            {/* Screen Share Action Button */}
            <div className="mt-2 flex gap-1.5">
              {isScreenSharing ? (
                <button 
                  onClick={stopScreenShare}
                  className="w-full py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <X size={12} />
                  <span>STOP SCREEN SHARE</span>
                </button>
              ) : (
                <button 
                  onClick={startScreenShare}
                  className="w-full py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                >
                  <Share2 size={12} />
                  <span>SHARE COMPUTER SCREEN</span>
                </button>
              )}
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
                  <div className="text-gray-400 leading-relaxed">Personal Jarvis integrated with studio 24kHz neural voice pool.</div>
                </div>

                <div className="bg-[#090a12] p-2 rounded border border-cyan-500/10">
                  <div className="text-purple-400 font-bold mb-0.5">🌐 LIVE HEADLINES</div>
                  <div className="text-gray-400 leading-relaxed">• 5 Specialized Agents engaged in workstation workstations.</div>
                  <div className="text-gray-400 leading-relaxed mt-1">• Windows Automation: Calc, Notepad, Paint & Explorer active.</div>
                  <div className="text-gray-400 leading-relaxed mt-1">• Clean Audio Engine: 16-bit fade curve with zero trailing pop.</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-500/10 grid grid-cols-2 gap-2 text-center text-[9px] font-mono">
              <div className="bg-[#080911] p-1.5 rounded border border-white/5">
                <span className="text-gray-500 block">CORE LATENCY</span>
                <span className="text-cyan-400 font-bold">0.34 SEC</span>
              </div>
              <div className="bg-[#080911] p-1.5 rounded border border-white/5">
                <span className="text-gray-500 block">ACTIVE VOICE</span>
                <span className="text-emerald-400 font-bold uppercase">{selectedVoiceName} (24K)</span>
              </div>
            </div>
          </div>

        </div>

        {/* --------------------------------------
            CENTER PANEL: AI REACTOR & 5-AGENT TOWN (5 cols)
        -------------------------------------- */}
        <div className="lg:col-span-5 bg-[#090a13] p-3 flex flex-col gap-3">

          {/* TOP SECTION: HEX NODES + HOLOGRAPHIC AI REACTOR */}
          <div className="bg-[#0f111e] border border-cyan-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden gap-3">
            
            {/* Background Circuit Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20 hidden sm:block">
              <svg className="w-full h-full" viewBox="0 0 400 160">
                <path d="M 120 30 L 220 30 L 250 80" stroke="cyan" strokeWidth="1" fill="none" strokeDasharray="3 3" />
                <path d="M 120 65 L 200 65 L 240 80" stroke="#f59e0b" strokeWidth="1" fill="none" strokeDasharray="3 3" />
                <path d="M 120 100 L 200 100 L 240 80" stroke="#10b981" strokeWidth="1" fill="none" strokeDasharray="3 3" />
                <path d="M 120 135 L 220 135 L 250 80" stroke="#8b5cf6" strokeWidth="1" fill="none" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* 4 Hex Connection Buttons */}
            <div className="flex sm:flex-col gap-2 z-10 w-full sm:w-28 justify-between">
              <button 
                onClick={() => setShowMemoryModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
              >
                <Cpu size={12} className="text-cyan-400" />
                <span>MEMORY</span>
              </button>

              <button 
                onClick={() => setShowSkillsModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-amber-500/40 text-amber-300 hover:bg-amber-950/60 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                <Layers size={12} className="text-amber-400" />
                <span>SKILLS</span>
              </button>

              <button 
                onClick={() => setShowVoicesModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <Volume2 size={12} className="text-emerald-400" />
                <span>VOICES</span>
              </button>

              <button 
                onClick={() => setShowSettingsModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0c16] border border-purple-500/40 text-purple-300 hover:bg-purple-950/60 transition-all text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer"
              >
                <SettingsIcon size={12} className="text-purple-400" />
                <span>SETTING</span>
              </button>
            </div>

            {/* Center Holographic AI Sphere Reactor + Primary Mic Underneath */}
            <div className="flex-1 flex flex-col items-center justify-center z-10">
              <div className="text-[9px] font-mono text-cyan-400/80 mb-1 flex items-center gap-1">
                <span>NEURAL REACTOR</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              </div>

              {/* Holographic Glowing Sphere */}
              <div 
                onClick={toggleContinuousListening}
                className="relative w-24 h-24 my-1 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                title="Click to toggle continuous voice assistant"
              >
                <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
                  isSpeaking ? 'bg-cyan-400/50 scale-125' : 
                  continuousMicActive ? 'bg-red-500/40 scale-120 animate-pulse' : 
                  'bg-cyan-500/20'
                }`}></div>

                {/* Rotating Rings */}
                <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/50 animate-spin" style={{ animationDuration: isSpeaking ? '2s' : '10s' }}></div>
                <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-[spin_15s_linear_infinite_reverse]"></div>

                {/* Core Sphere */}
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#0a0514] via-[#101426] to-[#041c24] border-2 border-cyan-400/70 flex items-center justify-center shadow-[inset_0_0_15px_rgba(6,182,212,0.6)]">
                  {continuousMicActive ? (
                    <Mic size={22} className="text-red-400 animate-pulse" />
                  ) : isSpeaking ? (
                    <Volume2 size={22} className="text-cyan-400 animate-bounce" />
                  ) : (
                    <Zap size={22} className="text-cyan-300" />
                  )}
                </div>
              </div>

              {/* PRIMARY HIGH-TECH MIC TOGGLE & LANGUAGE TOGGLE */}
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={toggleContinuousListening}
                  className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    continuousMicActive 
                      ? 'bg-red-600/30 border-red-500 text-red-300 animate-pulse shadow-[0_0_18px_rgba(239,68,68,0.6)]' 
                      : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  {continuousMicActive ? <MicOff size={13} className="text-red-400" /> : <Mic size={13} />}
                  <span>{continuousMicActive ? 'MIC ON (CLICK TO STOP)' : 'CLICK TO TALK (MIC)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextLang = speechLang === 'ur-PK' ? 'en-US' : 'ur-PK';
                    setSpeechLang(nextLang);
                    speechLangRef.current = nextLang;
                    if (continuousMicActive) {
                      startRecognitionInstance();
                    }
                  }}
                  title="Toggle Speech Recognition Language (Urdu / English)"
                  className="px-2.5 py-1.5 rounded-full border border-cyan-500/40 bg-[#0d1020] hover:bg-cyan-950/70 text-cyan-300 text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>🌐</span>
                  <span>{speechLang === 'ur-PK' ? 'اردو' : 'ENG'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION: 5-AGENT WORKSPACE WITH SITTING & WORKING ANIMATIONS */}
          <div className="flex-1 bg-[#1a1b26] rounded-xl border border-cyan-500/20 flex flex-col overflow-hidden relative min-h-[300px]">
            
            {/* Pixel Map Header with all 5 Agents */}
            <div className="flex justify-between items-center p-2.5 border-b border-cyan-500/15 bg-[#0f111e]/90 backdrop-blur z-20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-white text-xs font-mono">AGENT TOWN (5 AGENTS)</span>
              </div>

              {/* 5 Agent Status Chips */}
              <div className="flex flex-wrap items-center gap-1">
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
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-[9px] text-purple-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agentStates.Aura?.state)}`}></span>
                  <span>Aura</span>
                </div>
              </div>
            </div>

            {/* Pixel Canvas with Characters Sitting at Desks & Walking */}
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

              {/* Character 1: Saima (Sitting at desk working / walking) */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent1Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate" style={{ animation: 'talk1 20s infinite' }}>
                      {agentStates.Saima?.thought || 'Analyzing...'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20"></div>
                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-amber-800 rounded-t-sm"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-orange-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-blue-900 rounded-sm animate-[legSwing_0.5s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-blue-900 rounded-sm animate-[legSwing_0.5s_infinite_linear] [animation-delay:0.25s]"></div>
                </div>
              </div>

              {/* Character 2: Dani (Sitting at developer desk / coding) */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent2Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate" style={{ animation: 'talk2 20s infinite' }}>
                      {agentStates.Dani?.thought || 'Fixing bugs'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20"></div>
                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-slate-800 rounded-t-sm"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-slate-900 rounded-sm animate-[legSwing_0.6s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-slate-900 rounded-sm animate-[legSwing_0.6s_infinite_linear] [animation-delay:0.3s]"></div>
                </div>
              </div>

              {/* Character 3: Mianzi (Document desk / printer) */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent3Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate" style={{ animation: 'talk3 20s infinite' }}>
                      {agentStates.Mianzi?.thought || 'Printing...'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#dcb193] rounded-sm border border-black/20"></div>
                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-black rounded-t-sm"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-red-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-gray-800 rounded-sm animate-[legSwing_0.7s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-gray-800 rounded-sm animate-[legSwing_0.7s_infinite_linear] [animation-delay:0.35s]"></div>
                </div>
              </div>

              {/* Character 4: Zohaib (Security monitoring desk) */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent4Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[22px] bg-white text-black text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[110px] truncate" style={{ animation: 'talk4 20s infinite' }}>
                      {agentStates.Zohaib?.thought || 'Need coffee...'}
                    </div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#ffdecc] rounded-sm border border-black/20"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-cyan-500 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-indigo-900 rounded-sm animate-[legSwing_0.8s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-indigo-900 rounded-sm animate-[legSwing_0.8s_infinite_linear] [animation-delay:0.4s]"></div>
                </div>
              </div>

              {/* Character 5: Aura (Chief Coordinator with full animation path) */}
              <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent5Path 20s infinite linear' }}>
                <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.2]">
                    <div className="absolute -top-[24px] bg-purple-950 text-purple-200 border border-purple-400 text-[7px] px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold" style={{ animation: 'talk5 20s infinite' }}>
                      {agentStates.Aura?.thought || 'Coordinating'}
                    </div>
                    {/* Monitor Glow on desk */}
                    <div className="absolute -top-3 w-8 h-3 bg-cyan-400/20 blur-sm"></div>
                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f8d7c2] rounded-sm border border-black/20"></div>
                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-purple-900 rounded-t-sm"></div>
                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-purple-600 rounded-sm"></div>
                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-purple-950 rounded-sm animate-[legSwing_0.75s_infinite_linear]"></div>
                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-purple-950 rounded-sm animate-[legSwing_0.75s_infinite_linear] [animation-delay:0.37s]"></div>
                </div>
              </div>

            </div>

            {/* Pixel Map Footer Bar */}
            <div className="p-2 bg-[#0d0e19] border-t border-cyan-500/15 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Swarm Engine: 5 Agents Active</span>
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
                  AGENTS (5)
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
                            <span>JARVIS ({selectedVoiceName.toUpperCase()})</span>
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
                          {isSpeaking ? `🔊 Assistant Speaking (${selectedVoiceName.toUpperCase()})...` : "🎙️ Continuous Mic Listening..."}
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

            {/* TAB CONTENT 2: AGENT SWARM SELECTOR & TRAINING ACCESS */}
            {activeTab === 'agent' && (
              <div className="h-[340px] flex flex-col justify-between overflow-y-auto custom-scrollbar pr-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">5 SPECIALIZED AGENTS:</span>
                    <button 
                      onClick={() => setShowSettingsModal(true)}
                      className="text-[9px] font-mono text-purple-300 hover:text-white underline cursor-pointer"
                    >
                      Train Agents ⚙️
                    </button>
                  </div>
                  
                  {[
                    { name: 'Saima', role: 'Strategic Market Analyst', desc: 'Analyzes SaaS trends, competitive intelligence & expansion metrics.' },
                    { name: 'Dani', role: 'Senior Fullstack Architect', desc: 'Executes Next.js code, API integrations & database mutations.' },
                    { name: 'Mianzi', role: 'Autonomous Operations & Docs', desc: 'Drafts executive reports, client invoices & paperwork.' },
                    { name: 'Zohaib', role: 'Security & QA Specialist', desc: 'Automates user locking, access controls & penetration checks.' },
                    { name: 'Aura', role: 'Chief AI Coordinator', desc: 'Swarm lead: routes tasks and supervises autonomous execution.' },
                  ].map(ag => (
                    <div 
                      key={ag.name}
                      onClick={() => setSelectedAgentName(ag.name)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${
                        selectedAgentName === ag.name 
                          ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                          : 'bg-[#0f111e] border-cyan-500/10 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{ag.name}</span>
                        <span className="text-[9px] font-mono text-cyan-400">{ag.role}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{ag.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="p-2 bg-[#090a13] rounded-lg border border-cyan-500/20 text-[10px] text-gray-400 font-mono mt-2">
                  Active Direct Agent: <strong className="text-cyan-300">{selectedAgentName}</strong>. Prompts typed below are assigned to this specialist.
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
                placeholder="Type or speak to Jarvis (Urdu/English)..."
                className="bg-transparent border-none outline-none text-xs text-white flex-1 px-2 placeholder-gray-500 font-sans" 
              />
              
              {/* Mic Language Button */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = speechLang === 'ur-PK' ? 'en-US' : 'ur-PK';
                  setSpeechLang(nextLang);
                  speechLangRef.current = nextLang;
                  if (continuousMicActive) {
                    startRecognitionInstance();
                  }
                }}
                title="Toggle Voice Language: Urdu (اردو) / English"
                className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg border border-cyan-500/30 bg-[#141624] text-cyan-300 hover:text-white cursor-pointer"
              >
                {speechLang === 'ur-PK' ? 'اردو' : 'EN'}
              </button>

              {/* Mic Button in input bar */}
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
                disabled={isDispatching} 
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg border border-cyan-400/40 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* ==========================================
          MODAL 1: SYSTEM SETTINGS, DUAL-MODE AI PROVIDERS & AGENT TRAINING
      ========================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-cyan-500/40 rounded-2xl p-6 max-w-3xl w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] relative max-h-[92vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">AI PROVIDERS CONFIGURATION & AGENT WORKBENCH</h3>
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

            {/* DUAL-MODE AI PROVIDERS CONFIGURATION */}
            <div className="bg-[#07080f] p-4 rounded-xl border border-cyan-500/20 mb-4 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                <span className="text-xs font-bold text-cyan-300 font-mono uppercase">AI PROVIDERS: API KEY OR SUBSCRIPTION CONNECT</span>
                <span className="text-[10px] text-emerald-400 font-mono">Real Pings Enabled</span>
              </div>

              {/* 1. Google Gemini */}
              <div className="p-3 rounded-xl bg-[#0b0d18] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">1. Google Gemini</span>
                    <span className="text-[10px] text-cyan-400 font-mono">(Voice & Jarvis Core)</span>
                  </div>
                  
                  {/* Mode Selector */}
                  <div className="flex bg-[#07080f] p-0.5 rounded-lg border border-cyan-500/20 text-[10px] font-mono">
                    <button 
                      onClick={() => setConnectModes({...connectModes, gemini: 'subscription'})}
                      className={`px-2 py-0.5 rounded ${connectModes.gemini === 'subscription' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400'}`}
                    >
                      🌐 Subscription / Direct
                    </button>
                    <button 
                      onClick={() => setConnectModes({...connectModes, gemini: 'api'})}
                      className={`px-2 py-0.5 rounded ${connectModes.gemini === 'api' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400'}`}
                    >
                      🔑 API Key
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="sm:col-span-2">
                    {connectModes.gemini === 'api' ? (
                      <input 
                        type="password"
                        placeholder="Enter Gemini API Key (AIzaSy...)"
                        value={apiKeys.gemini}
                        onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                        className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    ) : (
                      <input 
                        type="password"
                        placeholder="Google Account OAuth / Session Token (or leave blank to use shared gateway)"
                        value={subscriptionTokens.gemini}
                        onChange={(e) => setSubscriptionTokens({...subscriptionTokens, gemini: e.target.value})}
                        className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    )}
                  </div>
                  <div>
                    <select 
                      value={providerModels.gemini}
                      onChange={(e) => setProviderModels({...providerModels, gemini: e.target.value})}
                      className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-cyan-300 outline-none"
                    >
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Fastest)</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-gray-400">{providerTestMsg.gemini || 'Status: Ready to connect'}</span>
                  <button 
                    onClick={() => testProviderConnection('gemini')}
                    disabled={providerTestStatus.gemini === 'testing'}
                    className="px-3 py-1 rounded bg-[#141624] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {providerTestStatus.gemini === 'testing' ? 'Testing...' : 'Test Connection ⚡'}
                  </button>
                </div>
              </div>

              {/* 2. OpenAI ChatGPT */}
              <div className="p-3 rounded-xl bg-[#0b0d18] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">2. OpenAI ChatGPT</span>
                    <span className="text-[10px] text-green-400 font-mono">(GPT-4o)</span>
                  </div>
                  
                  {/* Mode Selector */}
                  <div className="flex bg-[#07080f] p-0.5 rounded-lg border border-cyan-500/20 text-[10px] font-mono">
                    <button 
                      onClick={() => setConnectModes({...connectModes, openai: 'subscription'})}
                      className={`px-2 py-0.5 rounded ${connectModes.openai === 'subscription' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400'}`}
                    >
                      🌐 ChatGPT Plus / Team
                    </button>
                    <button 
                      onClick={() => setConnectModes({...connectModes, openai: 'api'})}
                      className={`px-2 py-0.5 rounded ${connectModes.openai === 'api' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400'}`}
                    >
                      🔑 API Key
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="sm:col-span-2">
                    {connectModes.openai === 'api' ? (
                      <input 
                        type="password"
                        placeholder="Enter OpenAI API Key (sk-proj-...)"
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                        className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    ) : (
                      <input 
                        type="password"
                        placeholder="ChatGPT Plus Session Token / Authorization Bearer"
                        value={subscriptionTokens.openai}
                        onChange={(e) => setSubscriptionTokens({...subscriptionTokens, openai: e.target.value})}
                        className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    )}
                  </div>
                  <div>
                    <select 
                      value={providerModels.openai}
                      onChange={(e) => setProviderModels({...providerModels, openai: e.target.value})}
                      className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-cyan-300 outline-none"
                    >
                      <option value="gpt-4o">gpt-4o (Omni Multi-modal)</option>
                      <option value="gpt-4o-mini">gpt-4o-mini (High Speed)</option>
                      <option value="o3-mini">o3-mini (Reasoning)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-gray-400">{providerTestMsg.openai || 'Status: Ready to connect'}</span>
                  <button 
                    onClick={() => testProviderConnection('openai')}
                    disabled={providerTestStatus.openai === 'testing'}
                    className="px-3 py-1 rounded bg-[#141624] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {providerTestStatus.openai === 'testing' ? 'Testing...' : 'Test Connection ⚡'}
                  </button>
                </div>
              </div>

              {/* 3. Groq LPU */}
              <div className="p-3 rounded-xl bg-[#0b0d18] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">3. Groq LPU</span>
                    <span className="text-[10px] text-amber-400 font-mono">(500+ Tokens/sec LPU)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Ultra-Low Latency</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="sm:col-span-2">
                    <input 
                      type="password"
                      placeholder="Enter Groq API Key (gsk_...)"
                      value={apiKeys.groq}
                      onChange={(e) => setApiKeys({...apiKeys, groq: e.target.value})}
                      className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div>
                    <select 
                      value={providerModels.groq}
                      onChange={(e) => setProviderModels({...providerModels, groq: e.target.value})}
                      className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-cyan-300 outline-none"
                    >
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-gray-400">{providerTestMsg.groq || 'Status: Ready to connect'}</span>
                  <button 
                    onClick={() => testProviderConnection('groq')}
                    disabled={providerTestStatus.groq === 'testing'}
                    className="px-3 py-1 rounded bg-[#141624] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {providerTestStatus.groq === 'testing' ? 'Testing...' : 'Test Connection ⚡'}
                  </button>
                </div>
              </div>

              {/* 4. Anthropic Claude */}
              <div className="p-3 rounded-xl bg-[#0b0d18] border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">4. Anthropic Claude</span>
                    <span className="text-[10px] text-purple-400 font-mono">(Sonnet 3.5)</span>
                  </div>
                  
                  {/* Mode Selector */}
                  <div className="flex bg-[#07080f] p-0.5 rounded-lg border border-cyan-500/20 text-[10px] font-mono">
                    <button 
                      onClick={() => setConnectModes({...connectModes, claude: 'subscription'})}
                      className={`px-2 py-0.5 rounded ${connectModes.claude === 'subscription' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400'}`}
                    >
                      🌐 Claude Pro / Connect
                    </button>
                    <button 
                      onClick={() => setConnectModes({...connectModes, claude: 'api'})}
                      className={`px-2 py-0.5 rounded ${connectModes.claude === 'api' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400'}`}
                    >
                      🔑 API Key
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="sm:col-span-2">
                    {connectModes.claude === 'api' ? (
                      <input 
                        type="password"
                        placeholder="Enter Claude API Key (sk-ant-...)"
                        value={apiKeys.claude}
                        onChange={(e) => setApiKeys({...apiKeys, claude: e.target.value})}
                        className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    ) : (
                      <input 
                        type="password"
                        placeholder="Claude Pro Session Key / UUID"
                        value={subscriptionTokens.claude}
                        onChange={(e) => setSubscriptionTokens({...subscriptionTokens, claude: e.target.value})}
                        className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      />
                    )}
                  </div>
                  <div>
                    <select 
                      value={providerModels.claude}
                      onChange={(e) => setProviderModels({...providerModels, claude: e.target.value})}
                      className="w-full bg-[#07080f] border border-cyan-500/30 rounded-lg p-2 text-xs text-cyan-300 outline-none"
                    >
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet</option>
                      <option value="claude-3-5-haiku-20241022">claude-3-5-haiku</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-gray-400">{providerTestMsg.claude || 'Status: Ready to connect'}</span>
                  <button 
                    onClick={() => testProviderConnection('claude')}
                    disabled={providerTestStatus.claude === 'testing'}
                    className="px-3 py-1 rounded bg-[#141624] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {providerTestStatus.claude === 'testing' ? 'Testing...' : 'Test Connection ⚡'}
                  </button>
                </div>
              </div>

            </div>

            {/* INDIVIDUAL 5-AGENT TRAINING BOXES */}
            <div className="bg-[#07080f] p-4 rounded-xl border border-cyan-500/20 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 font-mono uppercase">INDIVIDUAL AGENT TRAINING WORKBENCH (5 AGENTS)</span>
                <span className="text-[10px] text-gray-400">Custom System Instructions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {Object.keys(agentPrompts).map(agentName => (
                  <div key={agentName} className="p-2.5 rounded-lg bg-[#0b0d18] border border-purple-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Bot size={12} className="text-purple-400" />
                        {agentName}
                      </span>
                      <span className="text-[9px] font-mono text-purple-300">Custom Training Prompt</span>
                    </div>
                    <textarea 
                      rows={3}
                      value={agentPrompts[agentName]}
                      onChange={(e) => setAgentPrompts({...agentPrompts, [agentName]: e.target.value})}
                      className="w-full bg-[#07080f] border border-purple-500/20 rounded p-1.5 text-[11px] text-gray-200 outline-none focus:border-purple-400 font-sans resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
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
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('aurasuite_agent_prompts', JSON.stringify(agentPrompts));
                      localStorage.setItem('aurasuite_byok_keys', JSON.stringify(apiKeys));
                    }
                    const orgId = currentUser?.organization_id || 'org-aurasuite-superadmin';
                    if (apiKeys.gemini) {
                      await fetch('/api/providers/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ organization_id: orgId, provider_name: 'gemini', api_key: apiKeys.gemini })
                      });
                    }
                    alert('All Providers, Subscriptions & Agent Training Prompts Saved Successfully!');
                    setShowSettingsModal(false);
                  } catch (e) {
                    alert('Save notice: ' + e.message);
                  } finally {
                    setSavingKeys(false);
                  }
                }}
                disabled={savingKeys}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer"
              >
                {savingKeys ? 'Saving...' : 'SAVE ALL CONFIGURATIONS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: VOICES & GENDER SWITCH
      ========================================== */}
      {showVoicesModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-emerald-500/40 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.3)] relative">
            <button onClick={() => setShowVoicesModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={16}/></button>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono">NEURAL VOICE ENGINE (MALE & FEMALE PROFILES)</h3>
            </div>
            
            <div className="bg-[#07080f] p-4 rounded-xl border border-emerald-500/20 space-y-4">
              <div className="text-xs font-bold text-white">Select Neural Voice Personality:</div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Charon */}
                <button 
                  onClick={() => {
                    setVoiceGender('male');
                    setSelectedVoiceName('Charon');
                    localStorage.setItem('aurasuite_voice_gender', 'male');
                    localStorage.setItem('aurasuite_selected_voice', 'Charon');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoiceName === 'Charon' 
                      ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                      : 'bg-[#121424] border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Charon (Male)</div>
                  <div className="text-[10px] text-emerald-300 mt-1">Iconic British Jarvis Tone</div>
                </button>

                {/* Fenrir */}
                <button 
                  onClick={() => {
                    setVoiceGender('male');
                    setSelectedVoiceName('Fenrir');
                    localStorage.setItem('aurasuite_voice_gender', 'male');
                    localStorage.setItem('aurasuite_selected_voice', 'Fenrir');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoiceName === 'Fenrir' 
                      ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                      : 'bg-[#121424] border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Fenrir (Male)</div>
                  <div className="text-[10px] text-emerald-300 mt-1">Authoritative Deep Voice</div>
                </button>

                {/* Aoede */}
                <button 
                  onClick={() => {
                    setVoiceGender('female');
                    setSelectedVoiceName('Aoede');
                    localStorage.setItem('aurasuite_voice_gender', 'female');
                    localStorage.setItem('aurasuite_selected_voice', 'Aoede');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoiceName === 'Aoede' 
                      ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                      : 'bg-[#121424] border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Aoede (Female)</div>
                  <div className="text-[10px] text-pink-300 mt-1">Refined Natural Friday AI</div>
                </button>

                {/* Kore */}
                <button 
                  onClick={() => {
                    setVoiceGender('female');
                    setSelectedVoiceName('Kore');
                    localStorage.setItem('aurasuite_voice_gender', 'female');
                    localStorage.setItem('aurasuite_selected_voice', 'Kore');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoiceName === 'Kore' 
                      ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                      : 'bg-[#121424] border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Kore (Female)</div>
                  <div className="text-[10px] text-pink-300 mt-1">Energetic Clear Female</div>
                </button>
              </div>

              <div className="pt-2 border-t border-emerald-500/10 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-mono">24,000 Hz Linear PCM • Studio Fade</span>
                <button 
                  onClick={() => speakText("ہیلو سر! سسٹم مکمل طور پر تیار اور فعال ہے۔ بتائیے کیا خدمت کر سکتا ہوں؟")}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer shadow-lg"
                >
                  Test Selected Voice 🔊
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: MEMORY & CONTEXT INSPECTOR
      ========================================== */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
              <div><span className="text-cyan-400 font-bold">Context Tokens:</span> 1.8k / 1.0M Available</div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {
                  setChatMessages([chatMessages[0]]);
                  alert('Session Memory Cleared!');
                  setShowMemoryModal(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-mono hover:bg-red-900/60 cursor-pointer"
              >
                Clear Session Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 4: SKILLS CAPABILITY MATRIX
      ========================================== */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e101d] border-2 border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.3)] relative">
            <button onClick={() => setShowSkillsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={16}/></button>
            <div className="flex items-center gap-2 mb-3">
              <Layers size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white font-mono">ACTIVE AI SKILLS & TOOLS</h3>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-[#07080f] p-2.5 rounded-lg border border-amber-500/20 text-gray-300">
                <span className="text-amber-400 font-bold">1. Windows Automation Daemon:</span> Launch apps (calc, notepad, chrome, browser), execute system commands.
              </div>
              <div className="bg-[#07080f] p-2.5 rounded-lg border border-amber-500/20 text-gray-300">
                <span className="text-amber-400 font-bold">2. AuraSuite Enterprise Queries:</span> Real-time user counting, instant account locking/suspension.
              </div>
              <div className="bg-[#07080f] p-2.5 rounded-lg border border-amber-500/20 text-gray-300">
                <span className="text-amber-400 font-bold">3. 5-Agent Swarm Orchestration:</span> Task decomposition across Saima, Dani, Mianzi, Zohaib & Aura.
              </div>
              <div className="bg-[#07080f] p-2.5 rounded-lg border border-amber-500/20 text-gray-300">
                <span className="text-amber-400 font-bold">4. Real Computer Screen Share:</span> WebRTC display capture inside Media Link.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
