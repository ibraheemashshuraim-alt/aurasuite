/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, CreditCard, Video, Calendar,
  Award, Settings, BookOpen, Factory, Plus, CheckCircle,
  Clock, Lock, Unlock, MessageSquare, Shield, Mic, MicOff,
  VideoOff, Monitor, ChevronRight, Check, Copy, LogOut,
  Info, Send, Search, X, Edit3, Trash2, UserCheck, Bell,
  BarChart2, TrendingUp, Star, Phone, PhoneOff, Hash,
  AtSign, ChevronDown, Activity, Eye, EyeOff, Zap, Globe, ArrowRight,
  BrainCircuit, UserMinus, UserX, Briefcase, ShieldAlert, Hand, Pin, Disc, Square, Loader2, Timer, Camera, FileText, Image as ImageIcon, PlayCircle
, Type
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getRandomQuestions } from '../../lib/questionBank';
import JSZip from 'jszip';


// ─── Utility ────────────────────────────────────────────────────
const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toISOString().split('T')[0];

// ─── Participant Video Tile ──────────────────────────────────────
function ParticipantTile({ part, stream, isHost, isMe, isMain, onPin, pinned, streamTrigger }) {
  const videoRef = React.useRef(null);
  const audioRef = React.useRef(null);

  // Attach stream to video element for visual.
  // streamTrigger forces this to re-run when a remote track arrives (stream ref changes).
  // NOTE: audio element does NOT depend on streamTrigger — this is intentional.
  // If audio depended on streamTrigger it would be interrupted every time any stream changed.
  React.useEffect(() => {
    if (videoRef.current && stream && !part.isVideoOff) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current && !stream) {
      videoRef.current.srcObject = null;
    }
  }, [stream, part.isVideoOff, streamTrigger]);

  const hasStream = !!stream && !part.isVideoOff;
  const height = isMain ? '100%' : undefined;

  return (
    <div
      className="relative bg-[#0d0a17] rounded-2xl border border-purple-500/20 overflow-hidden w-full"
      style={{ minHeight: isMain ? '100%' : 120, height }}
    >
      {/* Hidden audio element removed from here to prevent duplicate playback in Main and Thumbnails. */}

      {/* Real video */}
      {hasStream && (
        <video
          ref={videoRef}
          autoPlay playsInline muted={isMe}
          className={`w-full h-full ${isMain ? 'object-contain' : 'object-cover'} absolute inset-0`}
        />
      )}
      {/* Avatar fallback */}
      {!hasStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className={`${isMain ? 'w-28 h-28 text-5xl' : 'w-12 h-12 text-xl'} rounded-full bg-gradient-to-br from-purple-700 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg`}>
            {part.name[0]?.toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-white mt-1">{part.name}</span>
          {part.isVideoOff && (
            <span className="text-[10px] text-purple-400 flex items-center gap-1 mt-0.5">
              <VideoOff size={10} /> Camera Off
            </span>
          )}
          {!part.isVideoOff && !stream && (
            <span className="text-[10px] text-purple-500">Connecting…</span>
          )}
        </div>
      )}
      {/* Overlay: name + host badge */}
      <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-black/70 border border-purple-500/20 rounded-lg text-[10px] text-purple-200 flex items-center gap-1.5 backdrop-blur-sm">
        {isHost && <Shield size={10} className="text-yellow-400" />}
        <span>{part.name}</span>
        {isHost && <span className="text-yellow-400 text-[9px] font-bold">HOST</span>}
        {isMe && <span className="text-emerald-400 text-[9px] font-bold">YOU</span>}
      </div>
      {/* Audio speaking bars */}
      {!part.isMuted && stream && (
        <div className="absolute top-2.5 right-2.5 flex gap-0.5 items-end h-4">
          <div className="w-0.5 bg-emerald-400 h-2 animate-bounce" />
          <div className="w-0.5 bg-emerald-400 h-4 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-0.5 bg-emerald-400 h-1 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      )}
      {/* Muted badge */}
      {part.isMuted && (
        <div className="absolute top-2.5 right-2.5 p-1.5 bg-red-950/60 border border-red-500/30 text-red-400 rounded-lg">
          <MicOff size={12} />
        </div>
      )}
      {/* Raise Hand badge */}
      {part.isHandRaised && (
        <div className="absolute top-2.5 right-10 p-1.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg animate-bounce shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          <Hand size={14} fill="currentColor" />
        </div>
      )}
      {/* Pin Button */}
      <button 
        onClick={onPin}
        className={`absolute top-2.5 left-2.5 p-1.5 rounded-lg border transition-all ${pinned ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-black/40 border-white/10 text-white/50 hover:bg-black/60 hover:text-white'}`}
        title={pinned ? "Unpin Video" : "Pin Video"}
      >
        <Pin size={12} />
      </button>
    </div>
  );
}

// ─── Digital Card Visual ────────────────────────────────────────
function DigitalCardVisual({ cardData }) {
  if (!cardData) return null;
  const { role, full_name, card_number, domain } = cardData;
  
  let bgClass = "bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/30";
  let icon = <Briefcase size={20} className="text-purple-300" />;
  let roleTitle = "Team Member";

  if (role === 'client') {
    bgClass = "bg-gradient-to-br from-[#2a1b10] to-[#1a1410] border-yellow-500/30";
    icon = <Star size={20} className="text-yellow-400" />;
    roleTitle = "Valued Client";
  } else if (role === 'admin' || role === 'super_admin') {
    bgClass = "bg-gradient-to-br from-red-950 to-rose-950 border-red-500/30";
    icon = <Shield size={20} className="text-red-400" />;
    roleTitle = "Super Administrator";
  } else if (role === 'sub_admin') {
    bgClass = "bg-gradient-to-br from-orange-950 to-amber-950 border-orange-500/30";
    icon = <UserCheck size={20} className="text-orange-400" />;
    roleTitle = "Sub-Admin";
  } else if (role === 'student') {
    bgClass = "bg-gradient-to-br from-emerald-950 to-teal-950 border-emerald-500/30";
    icon = <BookOpen size={20} className="text-emerald-400" />;
    roleTitle = "Academy Student";
  } else if (role === 'teacher') {
    bgClass = "bg-gradient-to-br from-blue-950 to-cyan-950 border-blue-500/30";
    icon = <Award size={20} className="text-blue-400" />;
    roleTitle = "Academy Instructor";
  } else if (role === 'manager') {
    bgClass = "bg-gradient-to-br from-slate-800 to-gray-900 border-gray-500/30";
    icon = <Factory size={20} className="text-gray-300" />;
    roleTitle = "Factory Manager";
  }

  return (
    <div className={`relative w-full max-w-sm mx-auto rounded-xl border p-5 overflow-hidden shadow-2xl ${bgClass}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex justify-between items-start mb-6">
        <div>
          <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider mb-1">AuraSuite Access Card</div>
          <div className="text-lg font-bold text-white leading-tight">{full_name}</div>
          <div className="text-xs text-white/70 mt-0.5">{roleTitle} {domain && `• ${domain}`}</div>
        </div>
        <div className="p-2.5 bg-black/30 rounded-xl border border-white/10 shadow-inner">
          {icon}
        </div>
      </div>
      <div className="relative flex justify-between items-end mt-4">
        <div>
          <div className="text-[8px] uppercase font-bold text-white/40 mb-0.5">Card Number</div>
          <div className="font-mono text-sm text-white/90 tracking-widest">{card_number}</div>
        </div>
        <div className="text-[10px] font-bold text-white/30 tracking-widest">VALIDATED</div>
      </div>
    </div>
  );
}

export default function AppContainer() {
  const [mounted, setMounted] = useState(false);

  // ── Auth ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authTab, setAuthTab] = useState('login');
  const [isCardLoginOnly, setIsCardLoginOnly] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [authCardNumber, setAuthCardNumber] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' | 'worker'
  
  const addNotification = (text, type = 'info') =>
    setNotifications(prev => [{ id: Date.now(), text, type }, ...prev.slice(0, 9)]);

  // First time login & Quiz
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [newPermanentPassword, setNewPermanentPassword] = useState('');
  const [passwordChangeNew, setPasswordChangeNew] = useState('');
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const [authOrgType, setAuthOrgType] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [tempDigitalCard, setTempDigitalCard] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizStep, setQuizStep] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizLang, setQuizLang] = useState('en');
  const [actualQuizQuestions, setActualQuizQuestions] = useState([]);
  const [actualQuizAnswers, setActualQuizAnswers] = useState({});
  const [quizFailed, setQuizFailed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [cardError, setCardError] = useState(null);

  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpOrgType, setSignUpOrgType] = useState('software_house');
  const [signUpOrgName, setSignUpOrgName] = useState('');
  const [signUpRole, setSignUpRole] = useState('admin');

  // ── Global data ──
  const [organizations, setOrganizations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // ── Chat ──
  const [groupMessages, setGroupMessages] = useState([]);       // org-wide group chat
  const [dmThreads, setDmThreads] = useState({});              // { userId: [{id,from,text,time}] }
  const [activeDmUser, setActiveDmUser] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [activeChat, setActiveChat] = useState('group');        // 'group' | 'dm'
  const chatBottomRef = useRef(null);

  // ── Session ──
  const [currentUser, setCurrentUser] = useState(null);
  const [activeOrg, setActiveOrg] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'AuraSuite loaded. Welcome!', type: 'info' }
  ]);

  // ── Nav ──
  const [activeTab, setActiveTab] = useState('dashboard');
  useEffect(() => { const saved = localStorage.getItem('aura_worker_tab'); if (saved) setActiveTab(saved); }, []);
  useEffect(() => { localStorage.setItem('aura_worker_tab', activeTab); }, [activeTab]);

  // ── Meeting ──
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [currentMeetingSession, setCurrentMeetingSession] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetingChat, setMeetingChat] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [meetingParticipants, setMeetingParticipants] = useState([]);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [areAllMuted, setAreAllMuted] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingPasscode, setNewMeetingPasscode] = useState('');
  const [copiedMeetId, setCopiedMeetId] = useState(null);
  const [meetingInviteModal, setMeetingInviteModal] = useState(null);  // meeting obj
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [meetingInvites, setMeetingInvites] = useState([]);  // [{meetingId, invitees:[userId]}]

  const [showMeetingChat, setShowMeetingChat] = useState(false);
  const [showMeetingParticipants, setShowMeetingParticipants] = useState(false);
  const [showHostTools, setShowHostTools] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [reactionDetails, setReactionDetails] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const currentUserRef = useRef(currentUser);
  const kickoutChannelRef = useRef(null);
  const [kickoutModal, setKickoutModal] = useState(false);
  
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  // Audio fix: track previous media-control state to avoid spurious audio toggling
  const prevMediaStateRef = useRef({ hostMuted: false, isMuted: false, hostVideoOff: false, isVideoOff: false });
  const [showReactionsPanel, setShowReactionsPanel] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentSource, setAttachmentSource] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);
  const [reactionModalData, setReactionModalData] = useState(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  useEffect(() => {
    if (isCameraOpen) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          cameraStreamRef.current = stream;
          if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error("Camera error:", err);
          alert("Could not access camera. Please check permissions.");
          setIsCameraOpen(false);
        });
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
    }
  }, [isCameraOpen]);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const audioRecorderRef = useRef(null);
  const audioShouldSendRef = useRef(false);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const audioDiscardRef = useRef(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]); // [{id, emoji, userId, name}]

  // ── AI Onboarding ──
  const [onboardSkills, setOnboardSkills] = useState('React, Next.js, Node.js, CSS');
  const [onboardBio, setOnboardBio] = useState('Full Stack Engineer interested in dashboard systems.');
  const [onboardLoading, setOnboardLoading] = useState(false);

  // ── Admin edit ──
  const [editingUser, setEditingUser] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editRole, setEditRole] = useState('');

  // ── Budget ──
  const [budgetTaskId, setBudgetTaskId] = useState('');
  const [budgetComplexity, setBudgetComplexity] = useState('medium');
  const [budgetHours, setBudgetHours] = useState(10);
  const [suggestedBudget, setSuggestedBudget] = useState(null);
  const [budgetExplanation, setBudgetExplanation] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [overrideBudget, setOverrideBudget] = useState('');

  // ── Academy ──
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [submittedTasks, setSubmittedTasks] = useState({});
  
  // ── Schedules & Financials ──
  const [schedules, setSchedules] = useState([]);
  const [orgBudget, setOrgBudget] = useState(150000);

  // ── Online & Presence ──
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [presenceMap, setPresenceMap] = useState({});
  const [showPresenceModal, setShowPresenceModal] = useState(false);

  // ── WebRTC Refs & Streams ──
  const streamsRef = useRef({});
  const pcsRef = useRef({});
  const channelRef = useRef(null);
  const audioElementsRef = useRef({}); // persistent Audio objects, never re-mounted
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [streamTrigger, setStreamTrigger] = useState(0);

  // ── Meeting Live States Sync ──
  const [meetingStates, setMeetingStates] = useState({}); // { [meetingId]: { participants: [], chat: [], isChatLocked: false, areAllMuted: false } }

  // ── Onboarding / Invite Link States ──
  const [inviteToken, setInviteToken] = useState('');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [inviteOrgName, setInviteOrgName] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteCategory, setInviteCategory] = useState('');
  const [inviteDomain, setInviteDomain] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  // Admin Invite Generator States
  const [genInviteName, setGenInviteName] = useState('');
  const [genInviteRole, setGenInviteRole] = useState('worker');
  const [genInviteCategory, setGenInviteCategory] = useState('B');
  const [genInviteDomain, setGenInviteDomain] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedCardData, setGeneratedCardData] = useState(null);
  
  // ── Pre-Meeting Checklist ──
  const [preMeetingMeet, setPreMeetingMeet] = useState(null);
  const [preMeetingChecklist, setPreMeetingChecklist] = useState({ micOn: false, camOn: false });
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [processingHostAction, setProcessingHostAction] = useState(null);

  // ─────────────────── Supabase Data Load ───────────────────
  useEffect(() => {
    setMounted(true);
    const loadAll = async () => {
      try {
        const [orgs, profs, tsk, meets, scheds, msgs, dms, invites, mStates, fin] = await Promise.all([
          supabase.from('organizations').select('*'),
          supabase.from('profiles').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('meetings').select('*').eq('is_active', true),
          supabase.from('schedules').select('*'),
          supabase.from('group_messages').select('*').order('created_at', { ascending: true }),
          supabase.from('dm_messages').select('*').order('created_at', { ascending: true }),
          supabase.from('meeting_invites').select('*'),
          supabase.from('meeting_states').select('*'),
          supabase.from('financials').select('*'),
        ]);
        if (orgs.data) setOrganizations(orgs.data);
        if (profs.data) setProfiles(profs.data);
        if (tsk.data) setTasks(tsk.data);
        if (meets.data) setActiveMeetings(meets.data);
        if (scheds.data) setSchedules(scheds.data);
        if (msgs.data) setGroupMessages(msgs.data.map(m => ({ id: m.id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, audioUrl: m.audio_url, attachmentUrl: m.attachment_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size })));
        if (dms.data) {
          const threads = {};
          dms.data.forEach(m => {
            if (!threads[m.thread_key]) threads[m.thread_key] = [];
            threads[m.thread_key].push({ id: m.id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, audioUrl: m.audio_url, attachmentUrl: m.attachment_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size });
          });
          setDmThreads(threads);
        }
        if (invites.data) setMeetingInvites(invites.data.map(i => ({ meetingId: i.meeting_id, invitees: i.invitees })));
        if (mStates.data) {
          const statesMap = {};
          mStates.data.forEach(s => {
            statesMap[s.meeting_id] = { participants: s.participants || [], chat: s.chat || [], isChatLocked: s.is_chat_locked, areAllMuted: s.are_all_muted };
          });
          setMeetingStates(statesMap);
        }
        if (fin.data && fin.data.length > 0) setOrgBudget(fin.data[0].budget);
      } catch (err) {
        console.error('Supabase load error', err);
      }
    };
    loadAll().then(() => {
      const params = new URLSearchParams(window.location.search);
      const hasInviteToken = params.get('t');
      const hasOldInvite = params.get('inviteToken');

      // If an invite token is present, let the URL params effect handle the login flow.
      // Do not auto-login from localStorage, otherwise it overrides the token!
      if (hasInviteToken || hasOldInvite) {
        setIsCheckingSession(false);
        return;
      }

      // Auto Login: Check sessionStorage first (tab-specific, used for workers), then localStorage
      let savedSession = sessionStorage.getItem('aura_session');
      let loadedMode = 'worker';
      
      if (!savedSession) {
        savedSession = localStorage.getItem('aura_session');
        loadedMode = 'admin';
      }

      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          const userId = parsed.userId;
          if (parsed.loginMode) setLoginMode(parsed.loginMode);
          else setLoginMode(loadedMode);

          supabase.from('profiles').select('*').eq('id', userId).single().then(({data: savedUser, error: pError}) => {
            if (pError) {
              console.warn('Session check error (network?):', pError);
              // Do NOT delete session on network error! Just show login to be safe but keep storage.
              setIsCheckingSession(false);
              return;
            }
            if (savedUser) {
              // 🚨 STRICT ISOLATION: If localStorage was corrupted with a worker session from an older bug, reject it!
              const isWorker = ['worker', 'client'].includes(savedUser.role);
              if (isWorker && loadedMode === 'admin') {
                localStorage.removeItem('aura_session');
                setIsCheckingSession(false);
                return;
              }

              supabase.from('organizations').select('*').eq('id', savedUser.organization_id).single().then(({data: savedOrg}) => {
                setCurrentUser(savedUser);
                setActiveOrg(savedOrg || { id: 'org-1', name: 'AuraSuite Org', type: 'software_house' });
                setIsLoggedIn(true);
                setIsCheckingSession(false);
                
                // Trigger kickout modal IF suspended (but DON'T clear storage!)
                if (['suspended', 'banned', 'deleted'].includes(savedUser.role) || savedUser.status === 'suspended') {
                  setKickoutModal(true);
                }
              });
            } else {
              // User deleted from DB
              sessionStorage.removeItem('aura_session');
              localStorage.removeItem('aura_session');
              setIsCheckingSession(false);
            }
          });
        } catch(e) {
          console.error('Session parse error:', e);
          sessionStorage.removeItem('aura_session');
          localStorage.removeItem('aura_session');
          setIsCheckingSession(false);
        }
        const modeParam = params.get('mode');
        if (modeParam === 'admin') {
          setLoginMode('admin');
          setIsCardLoginOnly(true);
        } else if (modeParam === 'register') {
          setAuthTab('signup');
          setIsCardLoginOnly(true);
        }

        const kickoutParam = params.get('kickout');
        if (kickoutParam === 'true') {
          setCardError('Access Revoked: Your access card has been suspended by the Admin. Please contact support or request a new card.');
        }
      } else {
        setIsCheckingSession(false);
      }
    });
  }, []);

  // ── Session persistence ──
  useEffect(() => {
    if (currentUser && activeOrg) {
      const sessionData = JSON.stringify({ userId: currentUser.id, orgId: activeOrg.id, loginMode });
      if (loginMode === 'worker') {
        sessionStorage.setItem('aura_session', sessionData);
      } else {
        localStorage.setItem('aura_session', sessionData);
      }
    }
  }, [currentUser, activeOrg, loginMode]);

  // ─────────────────── Supabase Realtime Subscriptions ───────────────────
  useEffect(() => {
    if (!mounted) return;

    const channel = supabase
      .channel('aurasuite-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        supabase.from('profiles').select('*').then(({ data }) => {
          if (data) {
            setProfiles(data);
            setCurrentUser(prev => {
              if (!prev) return prev;
              const updated = data.find(p => p.id === prev.id);
              if (updated && (updated.role === 'deleted' || updated.role === 'banned')) {
                  sessionStorage.removeItem('aura_session');
                  localStorage.removeItem('aura_session');
                  window.location.href = '/login?kickout=true';
                  return null;
              }
              return updated || prev;
            });
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        supabase.from('tasks').select('*').then(({ data }) => { if (data) setTasks(data); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        supabase.from('meetings').select('*').eq('is_active', true).then(({ data }) => { if (data) setActiveMeetings(data); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_states' }, () => {
        supabase.from('meeting_states').select('*').then(({ data }) => {
          if (data) {
            const statesMap = {};
            data.forEach(s => { statesMap[s.meeting_id] = { participants: s.participants || [], chat: s.chat || [], isChatLocked: s.is_chat_locked, areAllMuted: s.are_all_muted }; });
            setMeetingStates(statesMap);
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_messages' }, payload => {
        if (payload.eventType === 'INSERT') {
          const m = payload.new;
          setGroupMessages(prev => {
            const exists = prev.find(msg => msg.id === m.id);
            if (exists) return prev.map(msg => msg.id === m.id ? { ...msg, attachmentUrl: m.attachment_url, audioUrl: m.audio_url, time: m.msg_time } : msg);
            return [...prev, { id: m.id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size }];
          });
        } else if (payload.eventType === 'DELETE') {
          setGroupMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          const m = payload.new;
          setGroupMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {} } : msg));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, payload => {
        if (payload.eventType === 'INSERT') {
          const m = payload.new;
          setDmThreads(prev => {
            const thread = prev[m.thread_key] || [];
            const exists = thread.find(msg => msg.id === m.id);
            if (exists) return { ...prev, [m.thread_key]: thread.map(msg => msg.id === m.id ? { ...msg, attachmentUrl: m.attachment_url, audioUrl: m.audio_url, time: m.msg_time } : msg) };
            return { ...prev, [m.thread_key]: [...thread, { id: m.id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, isDeleted: m.is_deleted, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size }] };
          });
        } else if (payload.eventType === 'DELETE') {
          setDmThreads(prev => {
            const next = { ...prev };
            for (const k in next) {
              next[k] = next[k].filter(msg => msg.id !== payload.old.id);
            }
            return next;
          });
        } else if (payload.eventType === 'UPDATE') {
          const m = payload.new;
          setDmThreads(prev => {
             const next = { ...prev };
             if (!next[m.thread_key]) return next;
             next[m.thread_key] = next[m.thread_key].map(msg => msg.id === m.id ? { ...msg, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {} } : msg);
             return next;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        supabase.from('schedules').select('*').then(({ data }) => { if (data) setSchedules(data); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_invites' }, () => {
        supabase.from('meeting_invites').select('*').then(({ data }) => {
          if (data) setMeetingInvites(data.map(i => ({ meetingId: i.meeting_id, invitees: i.invitees })));
        });
      })
      .subscribe();


    return () => { supabase.removeChannel(channel); };
  }, [mounted]);

  // ─────────────────── Unified Kickout & Poller ───────────────────
  useEffect(() => {
    // 1. Clean Broadcast Listener (subscribed & stored in ref for admin to reuse)
    const channel = supabase
      .channel('global-kickout-clean', { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'user-suspended' }, (payload) => {
        console.log('🚨 KICKOUT BROADCAST RECEIVED:', payload);
        const targetId = payload?.payload?.userId;
        const currentId = currentUserRef.current?.id;
        
        if (targetId && currentId && targetId === currentId) {
          console.log('🚨 TARGET MATCHED! Kicking out user:', currentId);
          setKickoutModal(true);
        } else {
          console.log('ℹ️ Broadcast ignored. Target ID:', targetId, 'Current ID:', currentId);
        }
      })
      .subscribe((status) => {
        console.log('📡 Kickout channel status:', status);
        if (status === 'SUBSCRIBED') {
          kickoutChannelRef.current = channel;
        }
      });

    // 2. Database Status Fallback (Polling every 3s)
    const interval = setInterval(async () => {
      const uid = currentUserRef.current?.id;
      if (!uid) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', uid)
          .maybeSingle();

        // Trigger kickout if: profile deleted (no data and no error), or role is suspended/banned/deleted
        if ((!data && !error) || (data && ['suspended', 'banned', 'deleted'].includes(data.role))) {
          console.log('🚨 POLLER KICKOUT: profile missing or suspended', { data, error });
          setKickoutModal(true);
        }
      } catch (err) {
        // Silence errors
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      kickoutChannelRef.current = null;
      clearInterval(interval);
    };
  }, []);

  // ─────────────────── Custom Presence Heartbeat ───────────────────
  useEffect(() => {
    if (!mounted || !isLoggedIn || !currentUser) return;

    const updatePresence = async () => {
      try {
        const { data: existing, error: selErr } = await supabase.from('presence').select('user_id').eq('user_id', currentUser.id).maybeSingle();
        if (selErr) console.error('Presence select error:', selErr);
        if (existing) {
          await supabase.from('presence').update({ last_seen: Date.now() }).eq('user_id', currentUser.id);
        } else {
          await supabase.from('presence').insert({ user_id: currentUser.id, organization_id: activeOrg?.id, last_seen: Date.now() });
        }
        
        const { data } = await supabase.from('presence').select('*');
        if (data) {
          const now = Date.now();
          const pMap = {};
          data.forEach(p => { pMap[p.user_id] = Number(p.last_seen); });
          setPresenceMap(pMap);
          setOnlineUsers(data.filter(p => now - Number(p.last_seen) < 15000).map(p => p.user_id));
        }
      } catch (err) {
        // ignore network errors
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 8000);
    return () => clearInterval(interval);
  }, [mounted, isLoggedIn, currentUser, activeOrg]);

  // Parse invite query parameters
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const loginTokenParam = params.get('t');
      const inviteToken = params.get('inviteToken');
      const cardParam = params.get('card');

      // If no relevant params, nothing to do
      if (!loginTokenParam && !inviteToken && !cardParam) return;

      if (cardParam) {
        // Force complete logout across tabs when accessing via direct card link
        sessionStorage.removeItem('aura_session');
        localStorage.removeItem('aura_session');
        setIsLoggedIn(false);
        setCurrentUser(null);
        setActiveOrg(null);
        
        setAuthCardNumber(cardParam);
        const userParam = params.get('user');
        if (userParam) setAuthUsername(userParam);
        
        setAuthTab('login');
        setIsCardLoginOnly(true);
        setLoginMode('worker');
        
        supabase.from('digital_cards').select('is_revoked').eq('card_number', cardParam).single().then(({data, error}) => {
             if (error || !data || data.is_revoked === true) {
                 setCardError("Access Revoked: Your access card has been suspended by the Admin.");
             }
        });
      }

      if (loginTokenParam || inviteToken) {
        // Clear any tab-specific worker session so the correct portal opens.
        sessionStorage.removeItem('aura_session');
        // We don't clear localStorage here, because we don't want to log the admin out in their other tab.
        setIsLoggedIn(false);
        setCurrentUser(null);
        setActiveOrg(null);
      }

      // Process the invite token
      if (loginTokenParam) {
        try {
          const decoded = JSON.parse(atob(loginTokenParam));
          if (decoded.card && decoded.username) {
            setAuthCardNumber(decoded.card);
            setAuthUsername(decoded.username);
            setLoginMode('worker');
            setIsInviteFlow(true);
            if (decoded.orgType) setAuthOrgType(decoded.orgType);
          }
        } catch(e) { /* ignore invalid token */ }
      }

      if (inviteToken) {
        setInviteToken(inviteToken);
        setInviteOrgId(params.get('orgId') || '');
        setInviteOrgName(params.get('orgName') || 'Workspace');
        setInviteRole(params.get('role') || 'worker');
        setInviteName(params.get('name') || '');
        setInviteCategory(params.get('category') || '');
        setInviteDomain(params.get('domain') || '');
        setAuthTab('invite_register');
      }
    }
  }, [mounted]);


  // Sync live meeting state changes across tabs
  // AUDIO FIX: We use prevMediaStateRef to compare ONLY when host-controlled media fields
  // actually change. This prevents the useEffect from touching audio tracks on every
  // Supabase update (e.g. hand raise, chat message) which was causing audio jitter/cutting.
  useEffect(() => {
    if (!isInMeeting || !currentMeetingSession) return;
    const meetState = meetingStates[currentMeetingSession.id];
    if (meetState) {
      setMeetingParticipants(meetState.participants);
      setMeetingChat(meetState.chat);
      setIsChatLocked(meetState.isChatLocked);
      setAreAllMuted(meetState.areAllMuted);

      const myInfo = meetState.participants.find(p => p.id === currentUser?.id);
      if (myInfo) {
        const prev = prevMediaStateRef.current;

        // ── Audio: only act when hostMuted flag changes ──
        if (myInfo.hostMuted && !prev.hostMuted) {
          // Host just muted us
          setIsMuted(true);
          const ls = streamsRef.current[currentUser?.id];
          if (ls) ls.getAudioTracks().forEach(t => { t.enabled = false; });
          addNotification('Host has muted your microphone.', 'warning');
        } else if (!myInfo.hostMuted && prev.hostMuted) {
          // Host just un-restricted our mic — don't force unmute, let user decide
        }

        // ── Video: only act when hostVideoOff flag changes ──
        if (myInfo.hostVideoOff && !prev.hostVideoOff) {
          setIsVideoOff(true);
          const ls = streamsRef.current[currentUser?.id];
          if (ls) ls.getVideoTracks().forEach(t => t.stop());
          addNotification('Host has turned off your camera.', 'warning');
        }

        // ── Screen share sync ──
        if (myInfo.isScreenSharing !== undefined && myInfo.isScreenSharing !== isScreenSharing) {
          setIsScreenSharing(myInfo.isScreenSharing);
          if (!myInfo.isScreenSharing && screenStream) {
            screenStream.getTracks().forEach(t => t.stop());
            setScreenStream(null);
          }
        }

        // Update prev ref
        prevMediaStateRef.current = {
          hostMuted: !!myInfo.hostMuted,
          isMuted: !!myInfo.isMuted,
          hostVideoOff: !!myInfo.hostVideoOff,
          isVideoOff: !!myInfo.isVideoOff,
        };
      } else {
        handleEndMeeting(false);
        addNotification('You have been removed from the meeting by the host.', 'error');
      }
    } else {
      handleEndMeeting(false);
      addNotification('The meeting has been ended by the host.', 'info');
    }
  }, [meetingStates, currentMeetingSession, isInMeeting]);

  useEffect(() => {
    if (tasks.length > 0 && !budgetTaskId) setBudgetTaskId(tasks[0].id);
  }, [tasks]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, dmThreads, activeDmUser]);

  // Auto-hide generated card after 15 seconds
  useEffect(() => {
    if (generatedLink && generatedCardData) {
      const timer = setTimeout(() => {
        setGeneratedLink('');
        setGeneratedCardData(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [generatedLink, generatedCardData]);

  // ─────────────────── Auth ───────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
    if (loginMode === 'worker') {
      if (!authCardNumber || !authUsername || !authPassword) {
        alert('Please fill all fields');
        return;
      }
      // Digital Card Login
      // Super Admin Strict Password Verification for Digital Card fallback
      if (authUsername.trim().toLowerCase() === 'ibraheemashshuraim@gmail.com') {
        if (authPassword !== 'abdullahsuperadmin.2006') {
          alert('Invalid Password for Super Admin!');
          return;
        }
      }

      // Super Admin Strict Password Verification for Digital Card fallback
      if (authUsername.trim().toLowerCase() === 'ibraheemashshuraim@gmail.com') {
        if (authPassword !== 'abdullahsuperadmin.2006') {
          alert('401 Unauthorized: Invalid Password for Super Admin!');
          return;
        }
      }

      const { data: cards, error } = await supabase.from('digital_cards')
        .select('*')
        .eq('card_number', authCardNumber.trim())
        .eq('username', authUsername.trim());
      
      if (error || !cards || cards.length === 0) {
        alert('Invalid Card Number or Username');
        return;
      }
      const card = cards[0];
      if (card.is_revoked === true || card.status === 'suspended') {
        setCardError('Access Revoked: Your card access has been suspended by the Admin.');
        return;
      }
      if (card.temp_password !== authPassword && card.permanent_password !== authPassword) {
        alert('Invalid Password');
        return;
      }
      if (card.is_first_login) {
        setTempDigitalCard(card);
        setForcePasswordChange(true);
        return;
      }
      
      // Proceed to login
      let user = profiles.find(p => p.id === card.profile_id);
      
      if (!user) {
        const { data: fetchUser, error: fetchUserError } = await supabase.from('profiles').select('*').eq('id', card.profile_id).single();
        if (fetchUserError || !fetchUser) {
           alert('Error: Could not retrieve linked user profile.');
           return;
        }
        user = fetchUser;
      }

      if (user) {
        if (user.role === 'banned' || user.role === 'deleted' || card.is_revoked === true) {
          setCardError('Access Revoked: Your card access has been suspended by the Admin.');
          return;
        }
        const org = organizations.find(o => o.id === user.organization_id) || organizations[0];
        setCurrentUser(user);
        setActiveOrg(org);
        setIsLoggedIn(true);
        setIsCheckingSession(false);
        if (window.history.replaceState) window.history.replaceState({}, document.title, window.location.pathname);
        addNotification(`Welcome back, ${user.full_name}!`, 'success');
      } else {
        alert('User profile not found. Contact Admin.');
      }
    } else {
      // Admin Email Login fallback
      if (!authEmail) {
        alert('Please enter your email');
        return;
      }
      
      const trimmedEmail = authEmail.trim().toLowerCase();
      
      if (trimmedEmail !== 'ibraheemashshuraim@gmail.com') {
        alert('401 Unauthorized: Only Super Admin can login via email. Workers must use Digital Cards.');
        return;
      }

      if (authPassword !== 'abdullahsuperadmin.2006') {
        alert('401 Unauthorized: Invalid Password for Super Admin!');
        return;
      }

      const user = profiles.find(u => u.email.toLowerCase() === trimmedEmail);
      if (!user) { alert('Email not registered! Please register your portal first.'); return; }
      
      if (user.role === 'banned' || user.role === 'deleted') {
        alert('Access Denied: This card has been suspended by the Admin.');
        return;
      }

      const org = organizations.find(o => o.id === user.organization_id) || organizations[0];
      setCurrentUser(user);
      setActiveOrg(org);
      setIsLoggedIn(true);
      setIsCheckingSession(false);
      if (window.history.replaceState) window.history.replaceState({}, document.title, window.location.pathname);
      addNotification(`Welcome back, ${user.full_name}!`, 'success');
    }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSetPermanentPassword = async (e) => {
    e.preventDefault();
    if (!newPermanentPassword || newPermanentPassword.length < 6) {
      alert('Password must be at least 6 characters.'); return;
    }
    setIsSettingPassword(true);
    try {

    // Update card: set permanent password, clear pending status
    const { error: cardErr } = await supabase.from('digital_cards').update({
      permanent_password: newPermanentPassword,
      is_first_login: false,
      is_pending: false
    }).eq('id', tempDigitalCard.id);
    if (cardErr) { alert('Failed to update password: ' + cardErr.message); return; }

    // If worker was pending, their profile exists but has role 'pending_worker'. Let's update it.
    let user = profiles.find(u => u.id === tempDigitalCard.profile_id);
    if (user && user.role === 'pending_worker') {
      const realRole = tempDigitalCard.role || 'worker';
      const { error: profUpdateErr } = await supabase.from('profiles').update({
        role: realRole
      }).eq('id', user.id);
      
      if (!profUpdateErr) {
        user = { ...user, role: realRole };
        setProfiles(prev => prev.map(p => p.id === user.id ? user : p));
      }
    }

    if (user) {
      const org = organizations.find(o => o.id === user.organization_id) || organizations[0];
      setCurrentUser(user);
      setActiveOrg(org);
      setIsLoggedIn(true);
      if (window.history.replaceState) window.history.replaceState({}, document.title, window.location.pathname);
      if ((user.role === 'worker' || user.role === 'student') && !user.skills?.includes('assessment_completed')) {
        setShowQuiz(true);
      } else {
        setShowQuiz(false);
      }
      setForcePasswordChange(false);
      setTempDigitalCard(null);
      addNotification(`Welcome ${user.full_name}! Password set successfully.`, 'success');
    } else {
      alert('Profile not found. Contact your admin.');
    }
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleSkipPasswordChange = async () => {
    const { error: cardErr } = await supabase.from('digital_cards').update({
      permanent_password: tempDigitalCard.temp_password,
      is_first_login: false,
      is_pending: false
    }).eq('id', tempDigitalCard.id);
    if (cardErr) { alert('Failed to update: ' + cardErr.message); return; }

    let user = profiles.find(u => u.id === tempDigitalCard.profile_id);
    if (user && user.role === 'pending_worker') {
      const realRole = tempDigitalCard.role || 'worker';
      await supabase.from('profiles').update({ role: realRole }).eq('id', user.id);
      user = { ...user, role: realRole };
      setProfiles(prev => prev.map(p => p.id === user.id ? user : p));
    }

    if (user) {
      const org = organizations.find(o => o.id === user.organization_id) || organizations[0];
      setCurrentUser(user);
      setActiveOrg(org);
      setIsLoggedIn(true);
      if (window.history.replaceState) window.history.replaceState({}, document.title, window.location.pathname);
      if ((user.role === 'worker' || user.role === 'student') && !user.skills?.includes('assessment_completed')) setShowQuiz(true);
      else setShowQuiz(false);
      setForcePasswordChange(false);
      setTempDigitalCard(null);
      addNotification(`Welcome ${user.full_name}!`, 'success');
    }
  };

  const handleChangePasswordSettings = async () => {
    if (!passwordChangeNew || passwordChangeNew.length < 6) {
      alert('Password must be at least 6 characters.'); return;
    }
    
    // Check if user has a digital card
    const { data: cards } = await supabase.from('digital_cards').select('*').eq('profile_id', currentUser.id);
    if (cards && cards.length > 0) {
      const { error } = await supabase.from('digital_cards').update({ permanent_password: passwordChangeNew }).eq('id', cards[0].id);
      if (error) { alert('Failed: ' + error.message); return; }
    } else {
      // Admin might just want to change it conceptually, but we don't use passwords for admin in this demo unless they have a digital card.
      // We'll update temp_password in profiles if we had one.
    }
    setPasswordChangeNew('');
    addNotification('Password updated successfully!', 'success');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpOrgName) { alert('Fill all fields.'); return; }
    const orgId = genId('org');
    const newOrg = { id: orgId, name: signUpOrgName, type: signUpOrgType };
    const superAdmins = ['ibraheemashshuraim@gmail.com'];
    const actualRole = superAdmins.includes(signUpEmail.toLowerCase()) ? 'super_admin' : signUpRole;
    const newProfile = {
      id: genId('user'), organization_id: orgId, email: signUpEmail,
      full_name: signUpName, role: actualRole,
      category: signUpRole === 'admin' ? 'A' : null,
      domain: signUpRole === 'admin' ? 'Executive Director' : '',
      skills: [], last_seen: now()
    };
    try {
      const { error: orgErr } = await supabase.from('organizations').insert(newOrg);
      if (orgErr) throw orgErr;
      const { error: profErr } = await supabase.from('profiles').insert(newProfile);
      if (profErr) throw profErr;
    } catch(err) { 
      console.error('SignUp DB error', err); 
      alert('Database connection failed! Have you run the SQL schema? Error: ' + err.message);
      return;
    }
    setOrganizations(p => [...p, newOrg]);
    setProfiles(p => [...p, newProfile]);
    setCurrentUser(newProfile);
    setActiveOrg(newOrg);
    setIsLoggedIn(true);
    addNotification(`Workspace "${signUpOrgName}" registered!`, 'success');
  };

  const handleInviteRegister = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !invitePassword || !inviteName) { alert('Please fill Name, Email and Password.'); return; }
    if (profiles.some(u => u.email.toLowerCase() === inviteEmail.toLowerCase())) {
      alert('Email already registered!'); return;
    }
    const newProfile = {
      id: genId('user'),
      organization_id: inviteOrgId || 'org-1',
      email: inviteEmail,
      full_name: inviteName,
      role: ['ibraheemashshuraim@gmail.com'].includes(inviteEmail.toLowerCase()) ? 'super_admin' : inviteRole,
      category: inviteCategory || null,
      domain: inviteDomain || '',
      skills: [],
      last_seen: now()
    };
    const org = organizations.find(o => o.id === inviteOrgId) || { id: inviteOrgId, name: inviteOrgName, type: 'software_house' };
    try {
      if (!organizations.some(o => o.id === org.id)) {
        const { error: oErr } = await supabase.from('organizations').insert(org);
        if (oErr) throw oErr;
        setOrganizations(prev => [...prev, org]);
      }
      const { error: pErr } = await supabase.from('profiles').insert(newProfile);
      if (pErr) throw pErr;
      setProfiles(p => [...p, newProfile]);
    } catch(err) { 
      console.error('InviteRegister DB error', err); 
      alert('Database connection failed! Have you run the SQL schema? Error: ' + err.message);
      return;
    }
    setCurrentUser(newProfile);
    setActiveOrg(org);
    setIsLoggedIn(true);
    if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
    setInviteToken('');
    addNotification(`Welcome, you joined ${org.name}!`, 'success');
  };

  const handleLogout = async () => {
    if (currentUser) {
      await supabase.from('presence').delete().eq('user_id', currentUser.id);
    }
    sessionStorage.clear();
    localStorage.clear();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveOrg(null);
    setIsInMeeting(false);
    setCurrentMeetingSession(null);
    setAuthEmail('');
    setAuthUsername('');
    setAuthCardNumber('');
    setAuthPassword('');
    setAuthTab('login');
    if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
  };

  // ─────────────────── Meeting ───────────────────
  const handleStartMeeting = async (e) => {
    e.preventDefault();
    if (!newMeetingTitle) return;
    const meetingId = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const passcode = newMeetingPasscode || `${Math.floor(1000 + Math.random() * 9000)}`;
    const meet = {
      id: genId('meet'),
      organization_id: activeOrg.id,
      host_id: currentUser.id,
      host_name: currentUser.full_name,
      title: newMeetingTitle,
      passcode,
      is_active: true,
      meeting_id: meetingId,
    };
    await supabase.from('meetings').insert(meet);
    setActiveMeetings(prev => [...prev, meet]);
    setNewMeetingTitle('');
    setNewMeetingPasscode('');
    addNotification(`Meeting "${meet.title}" created! ID: ${meetingId}`, 'success');
    setMeetingInviteModal(meet);
    setSelectedInvitees([]);
  };

  const handleJoinMeeting = async (meet) => {
    const existingState = meetingStates[meet.id];
    const initialChat = existingState?.chat || [{ id: 1, sender: 'System', text: `Live session started: "${meet.title}"`, time: 'Live' }];
    const myParticipant = {
      id: currentUser.id, name: currentUser.full_name, role: currentUser.role,
      isMuted: !preMeetingChecklist.micOn || (existingState?.areAllMuted && currentUser.id !== meet.host_id),
      isVideoOff: !preMeetingChecklist.camOn, isScreenSharing: false
    };
    const nextParticipants = [...(existingState?.participants || []).filter(p => p.id !== currentUser.id), myParticipant];
    const newState = { participants: nextParticipants, chat: initialChat, isChatLocked: existingState?.isChatLocked || false, areAllMuted: existingState?.areAllMuted || false };

    await supabase.from('meeting_states').upsert({
      meeting_id: meet.id, participants: nextParticipants, chat: initialChat,
      is_chat_locked: newState.isChatLocked, are_all_muted: newState.areAllMuted
    }, { onConflict: 'meeting_id' });
    setMeetingStates(prev => ({ ...prev, [meet.id]: newState }));
    setCurrentMeetingSession(meet);
    setMeetingChat(initialChat);
    setMeetingParticipants(nextParticipants);
    setIsInMeeting(true);
    setIsMuted(myParticipant.isMuted);
    setIsVideoOff(myParticipant.isVideoOff); setIsScreenSharing(false);
    setIsChatLocked(newState.isChatLocked); setAreAllMuted(newState.areAllMuted);

    // Only request microphone on join — camera is requested only when user explicitly turns it on
    try {
      // These exact constraints were stable in commit 2e6f49a — do NOT change noiseSuppression to false,
      // it makes the voice sound distant and slow every time it's been tried.
      const audioConstraints = { echoCancellation: true, noiseSuppression: true };
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: audioConstraints });
      if (myParticipant.isMuted) stream.getAudioTracks().forEach(t => t.enabled = false);
      streamsRef.current[currentUser.id] = stream;
      setLocalStream(stream);
      setStreamTrigger(t => t + 1);
      addNotification(`Joined "${meet.title}" successfully.`, 'success');
    } catch (err) {
      addNotification('Mic access denied. Joined without audio.', 'warning');
    }

    // --- Supabase Realtime for WebRTC signaling (works cross-device/network) ---
    const rtcChannel = supabase.channel(`rtc-${meet.id}`, { config: { broadcast: { self: false } } });
    channelRef.current = rtcChannel;

    rtcChannel.on('broadcast', { event: 'webrtc' }, async ({ payload }) => {
      const { type, from, to, sdp, candidate, streamId } = payload;
      if (from === currentUser.id) return;

      if (type === 'NEW_PEER_JOINED') {
        const pc = createPeerConnection(from, rtcChannel);
        pcsRef.current[from] = pc;
        const ls = streamsRef.current[currentUser.id];
        if (ls) ls.getTracks().forEach(t => pc.addTrack(t, ls));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        rtcChannel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'OFFER', from: currentUser.id, to: from, sdp: { type: offer.type, sdp: offer.sdp } } });
      } else if (type === 'OFFER' && to === currentUser.id) {
        let pc = pcsRef.current[from];
        if (!pc) { pc = createPeerConnection(from, rtcChannel); pcsRef.current[from] = pc; const ls = streamsRef.current[currentUser.id]; if (ls) ls.getTracks().forEach(t => pc.addTrack(t, ls)); }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        rtcChannel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'ANSWER', from: currentUser.id, to: from, sdp: { type: answer.type, sdp: answer.sdp } } });
      } else if (type === 'ANSWER' && to === currentUser.id) {
        const pc = pcsRef.current[from]; if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } else if (type === 'ICE' && to === currentUser.id) {
        const pc = pcsRef.current[from]; if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){} }
      } else if (type === 'SCREEN_SHARE_STARTED') {
        pcsRef.current[`screenId-${from}`] = streamId; setStreamTrigger(t => t + 1);
      } else if (type === 'SCREEN_SHARE_STOPPED') {
        if (streamsRef.current[`screen-${from}`]) { streamsRef.current[`screen-${from}`].getTracks().forEach(t => t.stop()); delete streamsRef.current[`screen-${from}`]; }
        delete pcsRef.current[`screenId-${from}`]; setStreamTrigger(t => t + 1);
      } else if (type === 'REACTION') {
        const { emoji: inEmoji, name: senderName, reactionId: rid } = payload;
        const newReaction = { id: rid, emoji: inEmoji, userId: from, name: senderName };
        setFloatingReactions(prev => [...prev, newReaction]);
        setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== rid)), 3500);
      }
    }).subscribe(() => {
      rtcChannel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'NEW_PEER_JOINED', from: currentUser.id } });
    });
  };

  const createPeerConnection = (peerId, rtcChannel) => {
    const pc = new RTCPeerConnection({ iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ] });
    pc.onicecandidate = (e) => {
      if (e.candidate) rtcChannel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'ICE', from: currentUser.id, to: peerId, candidate: e.candidate.toJSON() } });
    };
    // NOTE: onnegotiationneeded is intentionally NOT set here.
    // We use manual signaling (NEW_PEER_JOINED -> OFFER -> ANSWER) which is already
    // complete. Allowing onnegotiationneeded to fire causes mid-call renegotiation
    // that interrupts audio every time a track is added (camera on/off, screen share).
    pc.ontrack = (e) => {
      const remoteStream = e.streams[0];
      const expectedScreenId = pcsRef.current[`screenId-${peerId}`];
      if (expectedScreenId && remoteStream.id === expectedScreenId) {
        streamsRef.current[`screen-${peerId}`] = remoteStream;
      } else {
        streamsRef.current[peerId] = remoteStream;
        // Attach remote audio to a persistent Audio object (never re-mounted by React)
        if (!audioElementsRef.current[peerId]) {
          const audio = new Audio();
          audio.autoplay = true;
          audioElementsRef.current[peerId] = audio;
        }
        audioElementsRef.current[peerId].srcObject = remoteStream;
        audioElementsRef.current[peerId].play().catch(() => {});
      }
      setStreamTrigger(t => t + 1);
    };
    return pc;
  };

  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamsRef.current[`screen-${currentUser.id}`] = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);
      if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'SCREEN_SHARE_STARTED', from: currentUser.id, streamId: stream.id } });
      Object.entries(pcsRef.current).forEach(([k, pc]) => {
        if (!k.startsWith('screenId')) { stream.getTracks().forEach(t => pc.addTrack(t, stream)); }
      });
      stream.getVideoTracks()[0].onended = () => handleStopScreenShare();
      setStreamTrigger(t => t + 1);
      addNotification('Screen sharing started!', 'success');
    } catch (err) {
      addNotification('Screen share cancelled or permission denied.', 'warning');
    }
  };

  const handleStartRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(displayStream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = `Meeting_Recording_${new Date().getTime()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        setIsRecording(false);
        addNotification('Recording saved successfully.', 'success');
      };
      mediaRecorder.start();
      setIsRecording(true);
      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      };
      addNotification('Meeting recording started.', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Failed to start recording. Permission denied.', 'error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleStopScreenShare = async () => {
    const s = streamsRef.current[`screen-${currentUser.id}`];
    if (s) s.getTracks().forEach(t => t.stop());
    delete streamsRef.current[`screen-${currentUser.id}`];
    setScreenStream(null); setIsScreenSharing(false);
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'SCREEN_SHARE_STOPPED', from: currentUser.id } });
    setStreamTrigger(t => t + 1);
    addNotification('Screen sharing stopped.', 'info');
    if (currentMeetingSession) {
      const mState = meetingStates[currentMeetingSession.id];
      if (mState) {
        const nextParticipants = mState.participants.map(p => p.id === currentUser.id ? { ...p, isScreenSharing: false } : p);
        await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
        setMeetingStates(prev => ({ ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } }));
      }
    }
  };

  const cleanupWebRTC = () => {
    Object.values(streamsRef.current).forEach(s => { try { s.getTracks().forEach(t => t.stop()); } catch(e){} });
    streamsRef.current = {};
    Object.values(pcsRef.current).forEach(pc => { try { pc.close(); } catch(e){} });
    pcsRef.current = {};
    if (channelRef.current) { try { supabase.removeChannel(channelRef.current); } catch(e){} channelRef.current = null; }
    setLocalStream(null); setScreenStream(null); setStreamTrigger(t => t + 1);
  };

  const handleEndMeeting = async (forceEndForAll = true) => {
    cleanupWebRTC();
    const isHost = forceEndForAll && (currentUser.id === currentMeetingSession?.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role));
    if (isHost) {
      await supabase.from('meetings').update({ is_active: false }).eq('id', currentMeetingSession.id);
      await supabase.from('meeting_states').delete().eq('meeting_id', currentMeetingSession.id);
      await supabase.from('meeting_invites').delete().eq('meeting_id', currentMeetingSession.id);
      setActiveMeetings(prev => prev.filter(m => m.id !== currentMeetingSession.id));
      setMeetingInvites(prev => prev.filter(inv => inv.meetingId !== currentMeetingSession.id));
      setMeetingStates(prev => { const c = { ...prev }; delete c[currentMeetingSession.id]; return c; });
      addNotification(`Meeting "${currentMeetingSession.title}" ended by Host.`, 'info');
    } else {
      const mState = meetingStates[currentMeetingSession.id];
      if (mState) {
        const nextParticipants = mState.participants.filter(p => p.id !== currentUser.id);
        await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
        setMeetingStates(prev => ({ ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } }));
      }
      addNotification(`You left "${currentMeetingSession?.title}".`, 'info');
    }
    setIsInMeeting(false); setCurrentMeetingSession(null); setMeetingParticipants([]);
    setMeetingChat([]); setIsMuted(false); setIsVideoOff(false);
    setIsScreenSharing(false); setIsChatLocked(false); setAreAllMuted(false);
  };

  const copyMeetingInvite = (meet) => {
    const link = `Meeting ID: ${meet.meeting_id} | Passcode: ${meet.passcode}`;
    navigator.clipboard.writeText(link);
    setCopiedMeetId(meet.id);
    setTimeout(() => setCopiedMeetId(null), 2000);
    addNotification('Meeting info copied!', 'info');
  };

  const handleSendMeetingInvites = async () => {
    if (!meetingInviteModal || selectedInvitees.length === 0) { setMeetingInviteModal(null); return; }
    const existing = meetingInvites.find(inv => inv.meetingId === meetingInviteModal.id);
    const newInvitees = existing ? [...new Set([...existing.invitees, ...selectedInvitees])] : selectedInvitees;
    await supabase.from('meeting_invites').upsert({ meeting_id: meetingInviteModal.id, invitees: newInvitees }, { onConflict: 'meeting_id' });
    setMeetingInvites(prev => {
      if (existing) return prev.map(i => i.meetingId === meetingInviteModal.id ? { ...i, invitees: newInvitees } : i);
      return [...prev, { meetingId: meetingInviteModal.id, invitees: newInvitees }];
    });
    
    if (selectedInvitees.includes('__all__')) {
      const inviteMsg = { id: genId('msg'), from_id: currentUser.id, from_name: currentUser.full_name, organization_id: activeOrg.id,
        text: `📹 Meeting Invite: "${meetingInviteModal.title}" | ID: ${meetingInviteModal.meeting_id} | Code: ${meetingInviteModal.passcode} | [MEET_ID:${meetingInviteModal.id}]`,
        msg_time: now() };
      await supabase.from('group_messages').insert(inviteMsg);
    } else {
      const dmMessages = selectedInvitees.map(inviteeId => {
        const key = [currentUser.id, inviteeId].sort().join('_');
        return {
           id: genId('msg'), thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name,
           text: `📹 Meeting Invite: "${meetingInviteModal.title}" | ID: ${meetingInviteModal.meeting_id} | Code: ${meetingInviteModal.passcode} | [MEET_ID:${meetingInviteModal.id}]`,
           msg_time: now()
        };
      });
      if (dmMessages.length > 0) {
        await supabase.from('dm_messages').insert(dmMessages);
        // Also update local state so sender sees it immediately
        setDmThreads(prev => {
          const next = { ...prev };
          dmMessages.forEach(m => {
            if (!next[m.thread_key]) next[m.thread_key] = [];
            next[m.thread_key] = [...next[m.thread_key], { id: m.id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time }];
          });
          return next;
        });
      }
    }
    
    addNotification(`Invited ${selectedInvitees.length} member(s) to the meeting.`, 'success');
    setMeetingInviteModal(null); setSelectedInvitees([]);
  };

  const isInvitedToMeeting = (meet) => {
    const invite = meetingInvites.find(inv => inv.meetingId === meet.id);
    return invite && (invite.invitees.includes(currentUser?.id) || invite.invitees.includes('__all__'));
  };

  const handleHostMuteParticipant = async (id) => {
    const mState = meetingStates[currentMeetingSession.id];
    if (!mState) return;
    const nextParticipants = mState.participants.map(p => p.id === id ? { ...p, isMuted: true, hostMuted: true } : p);
    await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
    setMeetingStates(prev => ({ ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } }));
  };

  const handleHostKickParticipant = async (id) => {
    const mState = meetingStates[currentMeetingSession.id];
    if (!mState) return;
    const nextParticipants = mState.participants.filter(p => p.id !== id);
    await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
    setMeetingStates(prev => ({ ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } }));
  };

  const handleSendLiveChat = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;
    if (isChatLocked && currentUser.id !== currentMeetingSession.host_id && currentUser.role !== 'admin') { setCustomAlert('Chat is locked by host.'); return; }
    const newMsg = { id: Date.now(), sender: currentUser.full_name, text: newChatMessage, time: now() };
    const mState = meetingStates[currentMeetingSession.id];
    if (!mState) return;
    const nextChat = [...mState.chat, newMsg];
    await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: mState.participants, chat: nextChat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
    setMeetingStates(prev => ({ ...prev, [currentMeetingSession.id]: { ...mState, chat: nextChat } }));
    setNewChatMessage('');
  };

  // ─────────────────── Chat ───────────────────
  const orgMembers = (profiles || []).filter(p => p.organization_id === activeOrg?.id && p.id !== currentUser?.id);

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech to text is not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ur-PK';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
         setChatInput(prev => prev + ' ' + finalTranscript.trim());
      }
    };
    
    recognition.onerror = (e) => {
      console.error(e);
      setIsDictating(false);
    };
    recognition.onend = () => { setIsDictating(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsDictating(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      audioRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      audioRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        if (audioDiscardRef.current) {
          audioDiscardRef.current = false;
          setAudioBlob(null);
          return;
        }
        
        if (audioShouldSendRef.current) {
          audioShouldSendRef.current = false;
          await handleDirectAudioSend(blob);
        } else {
          setAudioBlob(blob);
        }
      };
      
      audioRecorderRef.current.start();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(`Microphone error: ${err.name}. If 'NotReadableError', close other tabs using the mic!`);
    }
  };

const stopRecording = () => {
    if (audioRecorderRef.current && isRecordingAudio) {
      audioRecorderRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsRecordingAudio(false);
    }
  };

const handleDeleteMessage = async (msg, type, action) => {
    try {
      const table = type === 'group' || activeChat === 'group' ? 'group_messages' : 'dm_messages';
      
      // OPTIMISTIC UPDATE
      const removeFromList = (list) => list.filter(m => m.id !== msg.id);
      const markDeletedForMe = (list) => list.map(m => m.id === msg.id ? { ...m, deletedFor: [...(m.deletedFor || []), currentUser.id] } : m);
      
      if (action === 'everyone') {
        if (msg.from === currentUser.id || (currentUser.role === 'super_admin' && table === 'group_messages')) {
          if (activeChat === 'group') setGroupMessages(prev => removeFromList(prev));
          else if (activeChat === 'dm' && activeDmUser) {
            const key = [currentUser.id, activeDmUser.id].sort().join('_');
            setDmThreads(prev => ({ ...prev, [key]: removeFromList(prev[key] || []) }));
          }
          await supabase.from(table).delete().eq('id', msg.id);
        } else {
          alert("You do not have permission to delete this message for everyone.");
        }
      } else if (action === 'me') {
        const currentDeletedFor = msg.deletedFor || [];
        if (!currentDeletedFor.includes(currentUser.id)) {
          if (activeChat === 'group') setGroupMessages(prev => markDeletedForMe(prev));
          else if (activeChat === 'dm' && activeDmUser) {
            const key = [currentUser.id, activeDmUser.id].sort().join('_');
            setDmThreads(prev => ({ ...prev, [key]: markDeletedForMe(prev[key] || []) }));
          }
          const newDeletedFor = [...currentDeletedFor, currentUser.id];
          await supabase.from(table).update({ deleted_for: newDeletedFor }).eq('id', msg.id);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

const handleReactMessage = async (msg, emoji) => {
    try {
      document.activeElement?.blur(); // Immediately close hover menu if focused
      const table = activeChat === 'group' ? 'group_messages' : 'dm_messages';
      const currentReactions = { ...msg.reactions } || {}; // Clone it to avoid mutation issues
      
      // Toggle logic: if already reacted with this emoji by this user, remove it
      if (currentReactions[emoji] && currentReactions[emoji].includes(currentUser.id)) {
        currentReactions[emoji] = currentReactions[emoji].filter(id => id !== currentUser.id);
        if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
      } else {
        if (!currentReactions[emoji]) currentReactions[emoji] = [];
        currentReactions[emoji].push(currentUser.id);
      }
      
      // OPTIMISTIC UPDATE
      const updateMsg = (m) => m.id === msg.id ? { ...m, reactions: currentReactions } : m;
      if (activeChat === 'group') {
        setGroupMessages(prev => prev.map(updateMsg));
      } else if (activeChat === 'dm' && activeDmUser) {
        const key = [currentUser.id, activeDmUser.id].sort().join('_');
        setDmThreads(prev => ({ ...prev, [key]: (prev[key] || []).map(updateMsg) }));
      }
      
      await supabase.from(table).update({ reactions: currentReactions }).eq('id', msg.id);
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };


  const renderTextWithLinks = (text) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => 
      urlRegex.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{part}</a> : part
    );
  };
  
  const handleDirectAudioSend = async (blob) => {
    const msgId = genId('msg');
    const msgTime = now();
    const tempAudioUrl = URL.createObjectURL(blob);
    const optimisticMsg = { id: msgId, from: currentUser?.id, fromName: currentUser?.full_name, text: '', time: msgTime, type: 'chat', audioUrl: tempAudioUrl, attachmentUrl: null, reactions: {} };
    if (activeChat === 'group') setGroupMessages(prev => [...prev, optimisticMsg]);
    else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: [...(prev[key] || []), optimisticMsg] })); }
    
    try {
        const fileName = `${msgId}_audio.webm`;
        const { data, error } = await supabase.storage.from('chat_attachments').upload(fileName, blob);
        if (error) throw error;
        const audioUrl = supabase.storage.from('chat_attachments').getPublicUrl(fileName).data.publicUrl;
        if (activeChat === 'group') await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, type: 'chat', audio_url: audioUrl });
        else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); await supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, audio_url: audioUrl }); }
    } catch(err) { 
        console.error("Audio upload error:", err); 
        // Revert optimistic UI on error
        if (activeChat === 'group') setGroupMessages(prev => prev.filter(m => m.id !== msgId));
        else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: (prev[key] || []).filter(m => m.id !== msgId) })); }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const currentChatInput = chatInput;
    const currentAttachmentFiles = attachmentFiles;
    
    if (!currentChatInput.trim() && currentAttachmentFiles.length === 0) return;
    
    setChatInput(''); setAttachmentFiles([]); setAttachmentSource(null);
    setIsSendingChat(true);
    
    try {
      // Group multiple files into a zip (skip if from gallery)
      let filesToProcess = currentAttachmentFiles;
      if (filesToProcess.length > 1 && attachmentSource !== 'gallery') {
        const zip = new JSZip();
        for (let i = 0; i < filesToProcess.length; i++) {
          const f = filesToProcess[i];
          const path = f.webkitRelativePath || f.name;
          zip.file(path, f);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const zipFile = new File([content], "Attachments.zip", { type: 'application/zip' });
        filesToProcess = [zipFile];
      }

      if (filesToProcess.length > 0) {
        // Send each file as a separate message (now it's just 1 zip if multiple were selected)
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          const msgId = genId('msg');
          const msgTime = now();

          // Optimistic UI - always show blob preview
          const blobUrl = URL.createObjectURL(file);
          const optimisticMsg = { id: msgId, from: currentUser?.id, fromName: currentUser?.full_name, text: i === 0 ? currentChatInput : '', time: msgTime, type: 'chat', audioUrl: null, attachmentUrl: blobUrl, reactions: {}, fileName: file.name, fileSize: file.size };
          if (activeChat === 'group') setGroupMessages(prev => [...prev, optimisticMsg]);
          else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: [...(prev[key] || []), optimisticMsg] })); }

          // Upload file to Supabase storage
          const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storageFileName = `${msgId}_${safeFileName}`;
          const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(storageFileName, file, { contentType: file.type });
          if (uploadError) { console.error('Upload error:', uploadError); continue; }
          const realUrl = supabase.storage.from('chat_attachments').getPublicUrl(storageFileName).data.publicUrl;

          // Update optimistic with real URL
          if (activeChat === 'group') setGroupMessages(prev => prev.map(m => m.id === msgId ? { ...m, attachmentUrl: realUrl } : m));
          else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: (prev[key] || []).map(m => m.id === msgId ? { ...m, attachmentUrl: realUrl } : m) })); }

          // Insert message to database (only existing columns)
          const msgText = i === 0 && currentChatInput ? currentChatInput : '';
          const msgData = { id: msgId, from_id: currentUser.id, from_name: currentUser.full_name, text: msgText, msg_time: msgTime, type: 'chat', audio_url: null, attachment_url: realUrl };
          if (activeChat === 'group') await supabase.from('group_messages').insert({ ...msgData, organization_id: activeOrg.id });
          else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); await supabase.from('dm_messages').insert({ ...msgData, thread_key: key }); }
        }
      } else {
        // Text only message
        const msgId = genId('msg');
        const msgTime = now();
        const optimisticMsg = { id: msgId, from: currentUser?.id, fromName: currentUser?.full_name, text: currentChatInput, time: msgTime, type: 'chat', audioUrl: null, attachmentUrl: null, reactions: {} };
        if (activeChat === 'group') setGroupMessages(prev => [...prev, optimisticMsg]);
        else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: [...(prev[key] || []), optimisticMsg] })); }

        if (activeChat === 'group') await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: null, attachment_url: null });
        else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); await supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, audio_url: null, attachment_url: null }); }
      }
    } catch(err) { 
      console.error("Message send error:", err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const getDmKey = (userId) => [currentUser?.id, userId].sort().join('_');

  // ─────────────────── AI Onboarding ───────────────────
  const handleOnboarding = (e) => {
    e.preventDefault();
    setOnboardLoading(true);
    setTimeout(() => {
      const skillsArray = onboardSkills.split(',').map(s => s.trim());
      const bioLow = onboardBio.toLowerCase();
      let category = 'C', domain = 'Researcher';

      if (bioLow.includes('lead') || bioLow.includes('architect') || skillsArray.length >= 6) category = 'A';
      else if (bioLow.includes('senior') || bioLow.includes('teacher') || skillsArray.length >= 3) category = 'B';

      if (activeOrg.type === 'academy') domain = 'Teacher';
      else if (activeOrg.type === 'factory') domain = 'Line Supervisor';
      else {
        const sk = onboardSkills.toLowerCase();
        if (sk.includes('react') || sk.includes('next') || sk.includes('css')) domain = 'Front-end Developer';
        else if (sk.includes('go') || sk.includes('node') || sk.includes('postgres')) domain = 'Back-end Developer';
        else if (sk.includes('search') || sk.includes('seo')) domain = 'SEO Researcher';
        else domain = 'Full Stack Developer';
      }

      const updated = { ...currentUser, category, domain, skills: skillsArray };
      setCurrentUser(updated);
      setProfiles(prev => prev.map(u => u.id === currentUser.id ? updated : u));
      setOnboardLoading(false);
      addNotification(`AI Profile Set: ${domain} | Category ${category}`, 'success');
    }, 1200);
  };

  // ─────────────────── Admin ───────────────────
  const handleAdminEditUser = (user) => {
    setEditingUser(user);
    setEditCategory(user.category || '');
    setEditDomain(user.domain || '');
    setEditRole(user.role || 'worker');
  };

  const handleSaveUserEdit = async () => {
    const updated = { category: editCategory, domain: editDomain, role: editRole };
    await supabase.from('profiles').update(updated).eq('id', editingUser.id);
    setProfiles(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
    if (currentUser.id === editingUser.id) setCurrentUser(prev => ({ ...prev, ...updated }));
    setEditingUser(null);
    addNotification(`User "${editingUser.full_name}" profile updated.`, 'success');
  };

  const handleSuspendUser = (userId) => {
    setConfirmModal({
      title: 'Suspend User & Revoke Access?',
      message: 'This will completely remove their profile and invalidate their current access card. You can re-invite this email anytime to issue a new card.',
      onConfirm: async () => {
        try {
          const targetUser = profiles.find(p => p.id === userId);
          const targetEmail = targetUser?.email;

          // 1. UPDATE profile role to 'suspended' FIRST (poller safety net)
          await supabase.from('profiles').update({ role: 'suspended' }).eq('id', userId);

          // 2. Fire Broadcast on the ALREADY-SUBSCRIBED channel
          if (kickoutChannelRef.current) {
            const res = await kickoutChannelRef.current.send({
              type: 'broadcast',
              event: 'user-suspended',
              payload: { userId, email: targetEmail }
            });
            console.log('📢 BROADCAST RESULT:', res);
          }

          // 3. Optimistic UI update
          setProfiles(prev => prev.filter(p => p.id !== userId));
          addNotification('User suspended and completely removed. Their access card has been revoked.', 'warning');

          // 4. DB cleanup (delayed to let poller catch the 'suspended' status)
          setTimeout(async () => {
            try {
              await supabase.from('group_messages').delete().eq('from_id', userId);
              await supabase.from('dm_messages').delete().or(`from_id.eq.${userId}`);
              await supabase.from('meeting_states').delete().in('meeting_id', (await supabase.from('meetings').select('id').eq('host_id', userId)).data?.map(m=>m.id) || []);
              await supabase.from('meeting_invites').delete().in('meeting_id', (await supabase.from('meetings').select('id').eq('host_id', userId)).data?.map(m=>m.id) || []);
              await supabase.from('meetings').delete().eq('host_id', userId);
              await supabase.from('tasks').delete().eq('assigned_to', userId);
              await supabase.from('presence').delete().eq('user_id', userId);
              await supabase.from('digital_cards').delete().eq('profile_id', userId);
              await supabase.from('profiles').delete().eq('id', userId);
            } catch (err) {
              console.warn('Silenced DB deletion error:', err);
            }
          }, 2000);
        } catch (error) {
          console.error('Suspend error:', error);
          addNotification('Error suspending user', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleBanUser = (userId) => {
    setConfirmModal({
      title: 'Permanently Ban User for 30 Days?',
      message: 'WARNING: This user will be banned. You will NOT be able to re-invite or issue access to this email address for 30 days.',
      onConfirm: async () => {
        const userEmail = profiles.find(p => p.id === userId)?.email;

        // 1. UPDATE profile role to 'suspended' FIRST (poller safety net)
        await supabase.from('profiles').update({ role: 'suspended' }).eq('id', userId);

        // 2. Fire broadcast on ALREADY-SUBSCRIBED channel
        if (kickoutChannelRef.current) {
          await kickoutChannelRef.current.send({
            type: 'broadcast',
            event: 'user-suspended',
            payload: { userId, email: userEmail }
          });
        }

        if (userEmail && !userEmail.includes('_deleted@') && !userEmail.includes('_banned@')) {
          const banDate = new Date();
          banDate.setDate(banDate.getDate() + 30);
          await supabase.from('banned_emails').insert({ email: userEmail.toLowerCase(), banned_until: banDate.toISOString() });
        }
        
        // Delayed Cascade Delete (give poller time to catch suspended status)
        setTimeout(async () => {
          try {
            await supabase.from('digital_cards').update({ is_revoked: true, is_pending: false }).eq('profile_id', userId);
            await supabase.from('profiles').update({ role: 'banned', last_seen: new Date().toISOString(), email: `${userId}_banned@aurasuite.com` }).eq('id', userId);
          } catch (err) {
            console.warn('Silenced cascade delete error:', err);
          }
        }, 2000);

        setProfiles(prev => prev.map(u => u.id === userId ? { ...u, role: 'banned', last_seen: new Date().toISOString() } : u));
        addNotification('User permanently banned for 30 days.', 'error');
        setConfirmModal(null);
      }
    });
  };

  // ─────────────────── Budget ───────────────────
  const handleSuggestBudget = (e) => {
    e.preventDefault();
    setSuggestLoading(true);
    setTimeout(() => {
      const rates = { low: 1000, medium: 2000, high: 4000 };
      const payout = budgetHours * rates[budgetComplexity];
      setSuggestedBudget(payout);
      setOverrideBudget(payout.toString());
      setBudgetExplanation(`AI suggests Rs. ${payout.toLocaleString()} @ Rs. ${rates[budgetComplexity].toLocaleString()}/hr for ${budgetComplexity} complexity.`);
      setSuggestLoading(false);
    }, 800);
  };

  const handleApprovePayout = async () => {
    const finalAmount = parseFloat(overrideBudget);
    await supabase.from('tasks').update({ suggested_payout: suggestedBudget, final_payout: finalAmount, payout_approved: true, status: 'done' }).eq('id', budgetTaskId);
    setTasks(prev => prev.map(t => t.id === budgetTaskId ? { ...t, suggested_payout: suggestedBudget, final_payout: finalAmount, payout_approved: true, status: 'done' } : t));
    addNotification(`Budget approved: Rs. ${finalAmount.toLocaleString()}`, 'success');
    setSuggestedBudget(null);
  };

  const handleMoveTask = async (taskId, status) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!newAssignmentTitle) return;
    setAssignments(prev => [...prev, {
      id: genId('assign'), title: newAssignmentTitle, description: newAssignmentDesc,
      due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]);
    setNewAssignmentTitle('');
    setNewAssignmentDesc('');
    addNotification('Assignment published!', 'success');
  };

  const handleClockIn = () => {
    const timeNow = now();
    setAttendanceLogs(prev => [{ id: genId('att'), name: currentUser.full_name, date: today(), time: timeNow, status: 'On Time' }, ...prev]);
    addNotification(`Attendance clocked at ${timeNow}`, 'success');
  };

  // ─────────────────── Derived ───────────────────
  const orgUsers = (profiles || []).filter(p => p.organization_id === activeOrg?.id && p.role !== 'pending_worker' && p.role !== 'deleted' && p.role !== 'banned' && p.role !== 'suspended');
  const orgMeetings = (activeMeetings || []).filter(m => m.organization_id === activeOrg?.id && m.is_active);
  const myInvitedMeetings = orgMeetings.filter(m => m.host_id !== currentUser?.id && isInvitedToMeeting(m));

  // ─────────────────── Render ───────────────────
  // Show loading until: (1) component mounted AND (2) session check done
  if (!mounted || isCheckingSession) return (
    <div className="min-h-screen bg-luxury-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl accent-gradient flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse">
          <Zap className="text-white" size={28} />
        </div>
        <div className="text-purple-400 font-bold text-sm tracking-widest animate-pulse">LOADING AURASUITE...</div>
      </div>
    </div>
  );

  // ── KICKOUT MODAL OVERLAY (HIGHEST PRIORITY) ──
  if (kickoutModal || currentUser?.role === 'suspended' || currentUser?.role === 'banned') {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Access Revoked</h2>
          <p className="text-red-400 text-sm mb-6">Access Revoked: Your access card has been suspended by the Admin.</p>
          <button
            onClick={() => {
              try {
                window.close();
              } catch (e) {}
            }}
            className="px-8 py-3 bg-red-950/60 hover:bg-red-900/80 text-white font-semibold rounded-xl border border-red-500/30 transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }

  // ── LOGIN SCREEN ──
  if (!isLoggedIn) {
    if (authTab === 'invite_register') {
      return (
        <div className="min-h-screen bg-luxury-bg text-[#f3f1f5] flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel-glow p-8 rounded-2xl border border-[#9333ea]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="text-center mb-6 relative">
              <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center shadow-lg shadow-purple-500/30 mx-auto mb-3">
                <Users className="text-white" size={24} />
              </div>
              <h1 className="font-bold text-2xl text-white tracking-wide">Join Team Workspace</h1>
              <p className="text-xs text-purple-400 font-medium mt-1">Invited to join &quot;{inviteOrgName}&quot;</p>
            </div>

            <form onSubmit={handleInviteRegister} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-purple-300 block mb-1">Full Name</label>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} required
                  className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-300 block mb-1">Email Address</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="name@company.com"
                  className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-300 block mb-1">Set Password</label>
                <input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} required placeholder="••••••••"
                  className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3 bg-purple-950/20 p-3 rounded-xl border border-purple-500/10 text-xs">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase font-bold block">Assigned Role</span>
                  <span className="text-white font-semibold capitalize">{inviteRole}</span>
                </div>
                {inviteDomain && (
                  <div>
                    <span className="text-[10px] text-purple-400 uppercase font-bold block">AI Domain</span>
                    <span className="text-white font-semibold truncate block">{inviteDomain}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setAuthTab('login'); setInviteToken(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 font-semibold hover:bg-purple-900/40">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl accent-gradient text-xs font-bold text-white glow-btn">
                  Join &amp; Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    
    if (cardError) {
      return (
        <div className="min-h-screen bg-luxury-bg flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel-glow p-8 rounded-2xl border border-red-500/20 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
             <h2 className="text-xl font-bold text-white mb-4">Access Revoked</h2>
             <p className="text-sm text-red-400 font-semibold mb-6">{cardError}</p>
             <button onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'about:blank';
             }} className="py-2.5 px-6 rounded-xl bg-red-950/30 border border-red-500/30 text-xs font-bold text-white hover:bg-red-900/40 transition-colors">Close Portal</button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-luxury-bg text-[#f3f1f5] flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel-glow p-8 rounded-2xl border border-[#9333ea]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="text-center mb-8 relative">
            <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center shadow-lg shadow-purple-500/30 mx-auto mb-3">
              <Zap className="text-white" size={24} />
            </div>
            <h1 className="font-bold text-2xl text-white tracking-wide">AuraSuite</h1>
            <p className="text-xs text-purple-400 font-medium mt-1">
              {authOrgType === 'software_house' ? 'Welcome to our Software House' : 
               authOrgType === 'factory' ? 'Welcome to our Factory' : 
               authOrgType === 'academy' ? 'Welcome to our Academy' : 
               'Enterprise SaaS Management Portal'}
            </p>
          </div>

          {/* TOP TABS PERMANENTLY HIDDEN FOR CLEAN UI */}
          {false && !isInviteFlow && !isCardLoginOnly && (
            <div className="flex flex-col sm:flex-row bg-[#120a1f] p-1 rounded-xl border border-purple-500/10 mb-6 gap-1">
              {['login', 'signup'].map(tab => (
                <button key={tab} onClick={() => setAuthTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authTab === tab ? 'bg-[#9333ea] text-white shadow-md' : 'text-purple-400 hover:text-white'}`}>
                  {tab === 'login' ? 'Sign In' : 'Register Portal'}
                </button>
              ))}
            </div>
          )}

          {forcePasswordChange ? (
            <form onSubmit={handleSetPermanentPassword} className="space-y-4">
              <div className="mb-4">
                <label className="text-[10px] text-yellow-400 uppercase font-bold block mb-1.5 flex items-center gap-1"><Shield size={12}/> First-Time Security Setup</label>
                <h3 className="text-xl font-bold text-white mb-4">Almost there!</h3>
                <DigitalCardVisual cardData={tempDigitalCard} />
                <p className="text-sm text-purple-200 mt-4 text-center">
                  Please create a secure password to finalize your account setup. This will be required for future logins.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-300 block mb-1">New Permanent Password</label>
                <input type="password" value={newPermanentPassword} onChange={e => setNewPermanentPassword(e.target.value)} required minLength={6}
                  className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={handleSkipPasswordChange} className="flex-1 py-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs font-bold text-purple-300 hover:bg-purple-900/40">
                  Skip for Now
                </button>
                <button type="submit" disabled={isSettingPassword} className={`flex-1 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 ${isSettingPassword ? 'bg-purple-800 opacity-70 cursor-not-allowed' : 'accent-gradient glow-btn'}`}>
                  {isSettingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} 
                  {isSettingPassword ? 'Setting Password...' : 'Set & Enter'}
                </button>
              </div>
            </form>
          ) : authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginMode === 'admin' ? (
                <>
                  <div>
                    <label className="text-[10px] text-purple-400 uppercase font-bold block mb-1.5 flex items-center gap-1"><Shield size={12}/> Admin Portal Access</label>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">Email Address</label>
                    <input type="email" placeholder="admin@domain.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">Password</label>
                    <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] text-emerald-400 uppercase font-bold block mb-1.5 flex items-center gap-1"><CreditCard size={12}/> Digital Access Card Login</label>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">Card Number</label>
                    <input type="text" placeholder="AS-2026-XXXX" value={authCardNumber} onChange={e => setAuthCardNumber(e.target.value)} required
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors uppercase" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">Username</label>
                    <input type="text" value={authUsername} onChange={e => setAuthUsername(e.target.value)} required
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">Password</label>
                    <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors" />
                  </div>
                </>
              )}

              <button type="submit" disabled={isLoggingIn} className={`w-full py-3 rounded-xl text-xs font-bold text-white mt-4 flex items-center justify-center gap-2 ${isLoggingIn ? 'bg-purple-800 opacity-70 cursor-not-allowed' : 'accent-gradient glow-btn'}`}>
                {isLoggingIn ? <Loader2 size={14} className="animate-spin" /> : (loginMode === 'admin' ? <Lock size={14} /> : <Unlock size={14} />)} 
                {isLoggingIn ? 'Validating...' : (loginMode === 'admin' ? 'Login as Admin' : 'Validate Credentials')}
              </button>
              
              <button type="button" onClick={() => {
                if (confirm('⚠️ This will delete ALL data and accounts. Continue?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }} className="w-full py-1.5 mt-2 text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
                Reset All Data
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              {[
                { label: 'Full Name', val: signUpName, set: setSignUpName, ph: 'e.g. Abdullah Khan', type: 'text' },
                { label: 'Email', val: signUpEmail, set: setSignUpEmail, ph: 'name@company.com', type: 'email' },
                { label: 'Password', val: signUpPassword, set: setSignUpPassword, ph: '', type: 'password' },
                { label: 'Organization Name', val: signUpOrgName, set: setSignUpOrgName, ph: 'e.g. Apex Software', type: 'text' }
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-purple-300 block mb-1">{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} required
                    className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-purple-300 block mb-1">Workspace Type</label>
                  <select value={signUpOrgType} onChange={e => setSignUpOrgType(e.target.value)}
                    className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none">
                    <option value="software_house">Software House</option>
                    <option value="academy">Academy</option>
                    <option value="factory">Factory</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-purple-300 block mb-1">My Role</label>
                  <select value={signUpRole} onChange={e => setSignUpRole(e.target.value)}
                    className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none">
                    <option value="admin">Owner / Admin</option>
                    <option value="worker">Worker / Staff</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl accent-gradient text-xs font-bold text-white glow-btn mt-2">
                Register &amp; Enter Portal
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════ AI QUIZ (ONBOARDING) ══════════════════
  if (showQuiz) {
    const handleQuizStart = () => {
      setQuizQuestions([
        { id: 1, question: 'What is your primary domain of expertise?', question_ur: 'آپ کی مہارت کا بنیادی شعبہ کون سا ہے؟', options: ['Software Development', 'Design/Creative', 'Management', 'Operations'], options_ur: ['سافٹ ویئر ڈیولپمنٹ', 'ڈیزائن/کریئیٹو', 'مینجمنٹ', 'آپریشنز'] },
        { id: 2, question: 'Which programming languages are you most comfortable with?', question_ur: 'آپ کون سی پروگرامنگ زبانوں میں زیادہ مہارت رکھتے ہیں؟', options: ['JavaScript/TypeScript', 'Python', 'Java/C#', 'Not Applicable'], options_ur: ['JavaScript/TypeScript', 'Python', 'Java/C#', 'قابل اطلاق نہیں'] },
        { id: 3, question: 'How many years of experience do you have?', question_ur: 'آپ کا کتنا تجربہ ہے؟', options: ['0-2 Years', '3-5 Years', '5-10 Years', '10+ Years'], options_ur: ['0-2 سال', '3-5 سال', '5-10 سال', '10+ سال'] }
      ]);
      setQuizStep(1);
    };

    const handleDemographicSubmit = () => {
      setQuizLoading(true);
      setTimeout(() => {
         const domainAnswer = quizAnswers[1] || 'Software Development';
         const questions = getRandomQuestions(domainAnswer, 5);
         setActualQuizQuestions(questions);
         setActualQuizAnswers({});
         setQuizLoading(false);
         setQuizStep(2); // Move to actual quiz
      }, 1000);
    };

    const handleActualQuizSubmit = async () => {
      setQuizLoading(true);
      setTimeout(async () => {
        let correctCount = 0;
        actualQuizQuestions.forEach(q => {
           if (actualQuizAnswers[q.id] === q.correctAnswerIndex) {
              correctCount++;
           }
        });
        
        setQuizScore(correctCount);

        if (correctCount >= 3) {
            // PASS
            let newCategory = 'C';
            if (correctCount === 5) newCategory = 'A';
            else if (correctCount === 4) newCategory = 'B';
            
            const newDomain = quizAnswers[1] || currentUser?.domain || 'Software Engineer';
            const newSkills = [...(currentUser?.skills || [])];
            if (!newSkills.includes('assessment_completed')) newSkills.push('assessment_completed');
            
            await supabase.from('profiles').update({ category: newCategory, domain: newDomain, skills: newSkills }).eq('id', currentUser.id);
            setCurrentUser(prev => ({ ...prev, category: newCategory, domain: newDomain, skills: newSkills }));
            setProfiles(prev => prev.map(p => p.id === currentUser.id ? { ...p, category: newCategory, domain: newDomain, skills: newSkills } : p));
            setQuizFailed(false);
        } else {
            // FAIL
            const cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await supabase.from('profiles').update({ quiz_cooldown_until: cooldownUntil }).eq('id', currentUser.id);
            setCurrentUser(prev => ({ ...prev, quiz_cooldown_until: cooldownUntil }));
            setProfiles(prev => prev.map(p => p.id === currentUser.id ? { ...p, quiz_cooldown_until: cooldownUntil } : p));
            setQuizFailed(true);
        }
        
        setQuizLoading(false);
        setQuizStep(3); // result step
      }, 2000);
    };

    return (
      <div className="min-h-screen bg-[#0a0514] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-screen pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="w-full max-w-lg glass-panel-glow border border-purple-500/30 rounded-3xl p-8 relative z-10">
          <div className="text-center mb-8 relative">
            <div className="absolute right-0 top-0 flex gap-2 bg-black/40 p-1 rounded-lg border border-purple-500/20">
              <button onClick={() => setQuizLang('en')} className={`px-2 py-1 text-[10px] font-bold rounded ${quizLang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'}`}>EN</button>
              <button onClick={() => setQuizLang('ur')} className={`px-2 py-1 text-[10px] font-bold rounded ${quizLang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'}`}>UR</button>
            </div>
            <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center shadow-lg shadow-purple-500/30 mx-auto mb-4 mt-6">
              <BrainCircuit className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{quizLang === 'ur' ? 'اے آئی اسکلز اسسمنٹ' : 'AI Skills Assessment'}</h2>
            <p className="text-xs text-purple-300">{quizLang === 'ur' ? 'AuraSuite AI کو آپ کا پروفائل تیار کرنے دیں۔' : 'Let AuraSuite AI tailor your workspace experience.'}</p>
          </div>

          {quizStep === 0 && (
            <div className="text-center space-y-6">
              <p className="text-sm text-white/80">{quizLang === 'ur' ? 'AuraSuite میں خوش آمدید! ہمارے AI کو آپ کی مہارتوں کا اندازہ لگانا ہے تاکہ آپ کو درست ٹاسکس دیے جا سکیں۔' : 'Welcome to AuraSuite! As part of our onboarding, our AI needs to assess your skill level to properly tag your profile and assign you to relevant tasks.'}</p>
              <button onClick={handleQuizStart} className="px-6 py-3 rounded-xl accent-gradient text-sm font-bold text-white glow-btn inline-flex items-center gap-2">
                {quizLang === 'ur' ? 'اسسمنٹ شروع کریں' : 'Begin Assessment'} <ArrowRight size={16}/>
              </button>
            </div>
          )}

          {quizStep === 1 && (
            <div className="space-y-6">
              {quizQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-xs font-bold text-purple-200">{idx + 1}. {quizLang === 'ur' ? q.question_ur : q.question}</p>
                  <div className="relative">
                    <input 
                      list={`opts-${q.id}`}
                      value={quizAnswers[q.id] || ''}
                      onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder={quizLang === 'ur' ? 'منتخب کریں یا ٹائپ کریں...' : 'Select or type...'}
                      className="w-full bg-[#11081c] border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all placeholder-purple-500/50"
                    />
                    <datalist id={`opts-${q.id}`}>
                      {(quizLang === 'ur' ? q.options_ur : q.options).map((opt, i) => (
                        <option key={i} value={opt} />
                      ))}
                    </datalist>
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <button onClick={handleDemographicSubmit} disabled={quizLoading || Object.keys(quizAnswers).length < quizQuestions.length}
                  className={`px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all ${quizLoading || Object.keys(quizAnswers).length < quizQuestions.length ? 'bg-purple-900/50 cursor-not-allowed opacity-50' : 'accent-gradient glow-btn'}`}>
                  {quizLoading ? <><Loader2 size={16} className="animate-spin" /> {quizLang === 'ur' ? 'تیار ہو رہا ہے...' : 'Preparing...'}</> : (quizLang === 'ur' ? 'آگے بڑھیں' : 'Next Step')}
                </button>
              </div>
            </div>
          )}

          {quizStep === 2 && (
            <div className="space-y-6">
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-purple-300 text-center">{quizLang === 'ur' ? 'یہ آپ کی مہارت کا اصل ٹیسٹ ہے۔ اسے پاس کرنے کے لیے کم از کم 3 درست جوابات درکار ہیں۔' : 'This is your actual skill test. You need at least 3 correct answers to pass.'}</p>
              </div>
              {actualQuizQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-xs font-bold text-purple-200">{idx + 1}. {quizLang === 'ur' ? q.question_ur : q.question}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(quizLang === 'ur' ? q.options_ur : q.options).map((opt, i) => (
                      <button key={i} onClick={() => setActualQuizAnswers(prev => ({ ...prev, [q.id]: i }))}
                        className={`p-3 rounded-xl text-[11px] font-bold border transition-all text-left ${actualQuizAnswers[q.id] === i ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-[#11081c] border-purple-500/20 text-purple-300 hover:border-purple-500/50'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <button onClick={handleActualQuizSubmit} disabled={quizLoading || Object.keys(actualQuizAnswers).length < actualQuizQuestions.length}
                  className={`px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all ${quizLoading || Object.keys(actualQuizAnswers).length < actualQuizQuestions.length ? 'bg-purple-900/50 cursor-not-allowed opacity-50' : 'accent-gradient glow-btn'}`}>
                  {quizLoading ? <><Loader2 size={16} className="animate-spin" /> {quizLang === 'ur' ? 'جانچ ہو رہی ہے...' : 'Analyzing...'}</> : (quizLang === 'ur' ? 'مکمل کریں' : 'Complete Assessment')}
                </button>
              </div>
            </div>
          )}

          {quizStep === 3 && (
            <div className="text-center space-y-6">
              {quizFailed ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                    <X className="text-red-400" size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{quizLang === 'ur' ? 'اسسمنٹ فیل' : 'Assessment Failed'}</h3>
                    <p className="text-sm text-red-300 mt-2">{quizLang === 'ur' ? `آپ نے ${actualQuizQuestions.length} میں سے ${quizScore} کا صحیح جواب دیا۔ پاس ہونے کے لیے 3 درکار ہیں۔` : `You answered ${quizScore} out of ${actualQuizQuestions.length} correctly. Minimum 3 required to pass.`}</p>
                  </div>
                  <button onClick={() => {
                      setQuizStep(1);
                      setQuizAnswers({});
                  }} className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#11081c] border border-purple-500/30 hover:bg-purple-900/40 transition-colors">
                    {quizLang === 'ur' ? 'دوبارہ کوشش کریں' : 'Try Again'}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <Check className="text-green-400" size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{quizLang === 'ur' ? 'اسسمنٹ مکمل' : 'Assessment Complete'}</h3>
                    <p className="text-sm text-purple-200 mt-2">
                       {quizLang === 'ur' ? `اسکور: ${quizScore}/5۔ آپ کو تفویض کیا گیا ہے ` : `Score: ${quizScore}/5. You have been assigned to `}
                       <strong className="text-purple-400 border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded">
                         {quizLang === 'ur' ? 'ٹیئر' : 'Tier'} {currentUser.category || 'C'}
                       </strong>
                    </p>
                  </div>
                  <button onClick={() => {
                      setIsEnteringDashboard(true);
                      setTimeout(() => {
                          setIsEnteringDashboard(false);
                          setShowQuiz(false);
                      }, 800);
                  }} disabled={isEnteringDashboard} className={`w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 ${isEnteringDashboard ? 'bg-purple-800 opacity-70 cursor-not-allowed' : 'accent-gradient glow-btn'}`}>
                    {isEnteringDashboard ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isEnteringDashboard ? (quizLang === 'ur' ? 'ری ڈائریکٹ ہو رہا ہے...' : 'Redirecting...') : (quizLang === 'ur' ? 'ڈیش بورڈ میں داخل ہوں' : 'Enter AuraSuite Dashboard')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════ MAIN APP ══════════════════
  return (
    <div className="flex min-h-screen bg-luxury-bg text-[#f3f1f5] relative">
      
      {/* 1. TOP-LEVEL KICKOUT OVERLAY ALREADY HANDLED ABOVE */}


      {/* ── MEETING INVITE MODAL ── */}
      {meetingInviteModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel-glow border border-purple-500/30 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Invite Members to Meeting</h3>
                <p className="text-[10px] text-purple-300 mt-0.5">&quot;{meetingInviteModal.title}&quot; · ID: {meetingInviteModal.meeting_id}</p>
              </div>
              <button onClick={() => setMeetingInviteModal(null)} className="p-1.5 hover:bg-purple-900/40 rounded-lg text-purple-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {/* Allow all */}
              <label className="flex items-center gap-3 p-2.5 bg-purple-950/30 border border-purple-500/20 rounded-xl cursor-pointer hover:border-purple-500/40 transition-all">
                <input type="checkbox"
                  checked={selectedInvitees.includes('__all__')}
                  onChange={e => setSelectedInvitees(e.target.checked ? ['__all__'] : [])}
                  className="rounded" />
                <Globe size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-white">Allow Everyone in Organization</span>
              </label>

              {orgUsers.filter(u => u.id !== currentUser.id).map(user => (
                <label key={user.id} className="flex items-center gap-3 p-2.5 bg-[#0f0b18] border border-purple-500/10 rounded-xl cursor-pointer hover:border-purple-500/30 transition-all">
                  <input type="checkbox"
                    checked={selectedInvitees.includes(user.id) || selectedInvitees.includes('__all__')}
                    disabled={selectedInvitees.includes('__all__')}
                    onChange={e => {
                      if (e.target.checked) setSelectedInvitees(p => [...p, user.id]);
                      else setSelectedInvitees(p => p.filter(id => id !== user.id));
                    }}
                    className="rounded" />
                  <div className="w-7 h-7 rounded-full bg-purple-700/50 flex items-center justify-center text-[11px] font-bold text-white border border-purple-500/30">
                    {user.full_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{user.full_name}</div>
                    <div className="text-[10px] text-purple-400">{user.role} {user.domain ? `· ${user.domain}` : ''}</div>
                  </div>
                  {onlineUsers.includes(user.id) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2 border-t border-purple-500/10">
              <button onClick={() => setMeetingInviteModal(null)}
                className="flex-1 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 font-semibold hover:bg-purple-900/40 transition-all">
                Skip for Now
              </button>
              <button onClick={handleSendMeetingInvites}
                className="flex-1 py-2 rounded-xl accent-gradient text-xs font-bold text-white glow-btn">
                Send Invites ({selectedInvitees.includes('__all__') ? 'All' : selectedInvitees.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Presence Modal ── */}
      {showPresenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-purple-500/20 shadow-2xl relative">
            <button onClick={() => setShowPresenceModal(false)} className="absolute top-4 right-4 text-purple-400 hover:text-white"><X size={18}/></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-950/40 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Online Presence</h3>
                <p className="text-[10px] text-purple-300">{orgUsers.length} total members in workspace</p>
              </div>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scroll">
              {orgUsers.map(u => {
                const isOnline = onlineUsers.includes(u.id);
                const lastSeenTime = presenceMap[u.id];
                return (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-purple-950/10 border border-purple-500/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg relative">
                        {u.full_name[0]?.toUpperCase()}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{u.full_name} {u.id === currentUser.id && '(You)'}</div>
                        <div className="text-[10px] text-purple-400">{u.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isOnline ? (
                        <span className="text-[10px] font-bold text-emerald-400">Online Now</span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-gray-400">Offline</span>
                          <span className="text-[9px] text-purple-500">{lastSeenTime ? new Date(lastSeenTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never seen'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN USER EDIT MODAL ── */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel-glow border border-purple-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Edit: {editingUser.full_name}</h3>
              <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-purple-900/40 rounded-lg text-purple-400"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none">
                  <option value="admin">Admin</option>
                  <option value="worker">Worker</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Category</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                  className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none">
                  <option value="">Unset</option>
                  <option value="A">A – Senior / Lead</option>
                  <option value="B">B – Mid Level</option>
                  <option value="C">C – Junior</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Domain / Specialty</label>
                <input type="text" value={editDomain} onChange={e => setEditDomain(e.target.value)}
                  className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none"
                  placeholder="e.g. Front-end Developer" />
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-purple-500/10">
              <button onClick={() => setEditingUser(null)}
                className="flex-1 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 font-semibold">Cancel</button>
              <button onClick={handleSaveUserEdit}
                className="flex-1 py-2 rounded-xl accent-gradient text-xs font-bold text-white">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── END MEETING MODAL ── */}
      {/* ── CUSTOM ALERT MODAL ── */}
      {customAlert && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#11081c] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)] rounded-3xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
            <p className="text-sm text-purple-300 mb-6">{customAlert}</p>
            <button onClick={() => setCustomAlert(null)} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20">
              Got it
            </button>
          </div>
        </div>
      )}

      {showEndMeetingModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel-glow border border-red-500/30 rounded-3xl p-8 relative">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white leading-tight">End Meeting</h2>
              <p className="text-xs text-purple-300 mt-1">Do you want to end the meeting for everyone or just leave?</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setShowEndMeetingModal(false); handleEndMeeting(true); }}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold text-white transition-all">
                End Meeting for All
              </button>
              <button onClick={() => { setShowEndMeetingModal(false); handleEndMeeting(false); }}
                className="w-full py-3 rounded-xl bg-[#150e1f] border border-purple-500/20 hover:border-purple-500/40 text-sm font-bold text-purple-200 transition-all">
                Just Leave Meeting
              </button>
              <button onClick={() => setShowEndMeetingModal(false)}
                className="w-full py-2 text-xs font-bold text-purple-400 hover:text-white transition-all mt-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRE-MEETING CHECKLIST MODAL ── */}
      {preMeetingMeet && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel-glow border border-purple-500/30 rounded-3xl p-8 relative">
            <div className="absolute inset-0 bg-purple-900/10 rounded-3xl animate-pulse pointer-events-none"></div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)] mx-auto mb-4">
                <Video className="text-white" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">Pre-Meeting Check</h2>
              <p className="text-xs text-purple-300 mt-1">&quot;{preMeetingMeet.title}&quot;</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {[
                { id: 'micOn', label: 'Turn on Microphone', icon: <Mic size={16}/> },
                { id: 'camOn', label: 'Turn on Camera', icon: <Video size={16}/> }
              ].map(item => (
                <label key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${preMeetingChecklist[item.id] ? 'bg-purple-900/40 border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-[#11081c] border-purple-500/20 hover:border-purple-500/50'}`}>
                  <input type="checkbox" className="hidden"
                    checked={preMeetingChecklist[item.id]}
                    onChange={e => setPreMeetingChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))} />
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${preMeetingChecklist[item.id] ? 'bg-purple-500 border-purple-400 text-white' : 'border-purple-500/50 text-transparent'}`}>
                    <Check size={12} />
                  </div>
                  <div className={`text-sm font-bold flex items-center gap-2 ${preMeetingChecklist[item.id] ? 'text-white' : 'text-purple-300'}`}>
                    {item.icon} {item.label}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPreMeetingMeet(null)}
                className="py-3 px-4 rounded-xl bg-[#11081c] border border-purple-500/20 text-xs font-bold text-purple-300 hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={() => {
                if (preMeetingChecklist.micOn || preMeetingChecklist.camOn) return;
                handleJoinMeeting(preMeetingMeet);
                setPreMeetingMeet(null);
              }}
                disabled={preMeetingChecklist.micOn || preMeetingChecklist.camOn}
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${!(preMeetingChecklist.micOn || preMeetingChecklist.camOn) ? 'accent-gradient glow-btn' : 'bg-purple-900/50 cursor-not-allowed opacity-50'}`}>
                Join Live <ArrowRight size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── ZOOM MEETING OVERLAY ── */}
      {isInMeeting && currentMeetingSession && (
        <div className="absolute inset-0 bg-[#070509]/98 z-50 flex flex-col p-5 space-y-4">
          <header className="flex justify-between items-center border-b border-purple-500/15 pb-4 shrink-0">
            <div>
              <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">AuraSuite HD Live</div>
              <h2 className="text-lg font-bold text-white">{currentMeetingSession.title}</h2>
              <div className="text-[10px] text-purple-300 mt-0.5">
                ID: <span className="text-purple-200 font-mono">{currentMeetingSession.meeting_id}</span>
                &nbsp;|&nbsp;Passcode: <span className="text-purple-200 font-mono">{currentMeetingSession.passcode}</span>
                &nbsp;|&nbsp;Host: <span className="text-purple-200">{currentMeetingSession.host_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(currentUser.id === currentMeetingSession.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)) && (
                <button onClick={() => { setMeetingInviteModal(currentMeetingSession); setSelectedInvitees([]); }}
                  className="px-3 py-2 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <Send size={12} /> Invite Members
                </button>
              )}
              <button onClick={() => {
                if (currentUser.id === currentMeetingSession.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)) {
                  setShowEndMeetingModal(true);
                } else {
                  handleEndMeeting(false);
                }
              }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all">
                {currentUser.id === currentMeetingSession.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) ? 'End Meeting' : 'Leave'}
              </button>
            </div>
          </header>

          <div className="flex-1 relative flex min-h-0 overflow-hidden bg-[#070509]">
            {/* Zoom-style Active Speaker / Screen Share Layout */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-2">
              {/* Main Stage */}
              <div className="flex-1 min-h-[300px] md:min-h-[400px] w-full rounded-2xl overflow-hidden relative shadow-2xl">
                {(() => {
                  const screenKeys = Object.keys(streamsRef.current).filter(k => k.startsWith('screen-'));
                  if (screenKeys.length > 0) {
                    const sk = screenKeys[0];
                    return (
                      <div className="w-full h-full bg-black relative border-2 border-emerald-500/40 rounded-2xl overflow-hidden">
                        <video autoPlay playsInline muted className="w-full h-full object-contain" ref={el => { if (el && streamsRef.current[sk]) el.srcObject = streamsRef.current[sk]; }} />
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-300 flex items-center gap-2">
                          <Monitor size={14} /> Screen Share
                        </div>
                      </div>
                    );
                  } else {
                    const activeSpeaker = pinnedUserId ? meetingParticipants.find(p => p.id === pinnedUserId) : (meetingParticipants.find(p => !p.isMuted && p.id !== currentUser.id) || meetingParticipants.find(p => p.id === currentMeetingSession?.host_id) || meetingParticipants[0]);
                    if (!activeSpeaker) return null;
                    return (
                      <div key={`main-${activeSpeaker.id}`} className="w-full h-full">
                        <ParticipantTile
                          part={activeSpeaker}
                          stream={streamsRef.current[activeSpeaker.id]}
                          isHost={activeSpeaker.id === currentMeetingSession?.host_id}
                          isMe={activeSpeaker.id === currentUser.id}
                          isMain={true}
                          pinned={pinnedUserId === activeSpeaker.id}
                          onPin={() => setPinnedUserId(pinnedUserId === activeSpeaker.id ? null : activeSpeaker.id)}
                          streamTrigger={streamTrigger}
                        />
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Floating Reactions Overlay */}
              {floatingReactions.length > 0 && (
                <div className="absolute bottom-36 left-0 right-0 pointer-events-none flex flex-wrap gap-3 px-6 justify-center z-30">
                  {floatingReactions.map(r => (
                    <div
                      key={r.id}
                      style={{ animation: 'floatUpFade 3.5s ease-out forwards' }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span style={{ fontSize: 36 }}>{r.emoji}</span>
                      <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-full">{r.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Thumbnails Strip */}
              <div className="h-32 shrink-0 flex gap-3 overflow-x-auto overflow-y-hidden pb-1 snap-x">
                {meetingParticipants.map(part => (
                  <div key={`thumb-${part.id}`} className="w-48 shrink-0 h-full snap-start">
                    <ParticipantTile
                      part={part}
                      stream={streamsRef.current[part.id]}
                      isHost={part.id === currentMeetingSession?.host_id}
                      isMe={part.id === currentUser.id}
                      isMain={false}
                      pinned={pinnedUserId === part.id}
                      onPin={() => setPinnedUserId(pinnedUserId === part.id ? null : part.id)}
                      streamTrigger={streamTrigger}
                    />
                  </div>
                ))}
              </div>

              {/* Audio is played via persistent JS Audio objects in audioElementsRef — no JSX audio tags needed */}
            </div>

            {/* Chat Sidebar */}
            {showMeetingChat && (
              <div className="w-80 flex flex-col bg-[#0b0713] border-l border-purple-500/15 shrink-0 shadow-2xl relative z-10 animate-in slide-in-from-right-8 duration-200">
                <div className="px-4 py-3 border-b border-purple-500/10 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Meeting Chat</span>
                  <div className="flex items-center gap-3">
                    {isChatLocked && <Lock size={12} className="text-red-400" />}
                    <button onClick={() => setShowMeetingChat(false)} className="text-purple-400 hover:text-white"><X size={14} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {meetingChat.map(msg => (
                    <div key={msg.id}>
                      <span className="text-[10px] font-bold text-purple-300">{msg.sender} <span className="text-purple-500 font-normal">{msg.time}</span></span>
                      <p className="text-xs text-white mt-0.5 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendLiveChat} className="p-3 border-t border-purple-500/10 flex gap-2 shrink-0 bg-[#07040d]">
                  <input type="text" placeholder={isChatLocked && currentUser.role !== 'admin' ? 'Chat locked' : 'Type message...'} value={newChatMessage}
                    onChange={e => setNewChatMessage(e.target.value)} disabled={isChatLocked && currentUser.role !== 'admin'}
                    className="bg-[#150e1f] border border-purple-500/20 rounded-xl p-2 text-xs text-white flex-1 focus:outline-none focus:border-purple-500/50" />
                  <button type="submit" className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-xl text-xs font-bold text-white">
                    <Send size={12} />
                  </button>
                </form>
              </div>
            )}

            {/* Participants Sidebar */}
            {showMeetingParticipants && (
              <div className="w-80 flex flex-col bg-[#0b0713] border-l border-purple-500/15 shrink-0 shadow-2xl relative z-10 animate-in slide-in-from-right-8 duration-200">
                <div className="px-4 py-3 border-b border-purple-500/10 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Participants ({meetingParticipants.length})</span>
                  <button onClick={() => setShowMeetingParticipants(false)} className="text-purple-400 hover:text-white"><X size={14} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {meetingParticipants.map(part => (
                    <div key={part.id} className="flex flex-col p-2 hover:bg-purple-900/20 rounded-xl group transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-700/50 border border-purple-500/30 flex items-center justify-center text-[11px] font-bold text-white">
                            {part.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {part.name}
                              {part.id === currentUser.id && <span className="text-[9px] text-purple-400 font-normal">(You)</span>}
                            </span>
                            {part.id === currentMeetingSession.host_id && <span className="text-[9px] text-yellow-400 tracking-wider">HOST</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {part.isMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} className="text-emerald-400" />}
                          {part.isVideoOff ? <VideoOff size={14} className="text-red-400" /> : <Video size={14} className="text-emerald-400" />}
                        </div>
                      </div>
                      {/* Host controls for individual participants */}
                      {(currentUser.id === currentMeetingSession.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)) && part.id !== currentUser.id && (
                        <div className="hidden group-hover:flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-purple-500/10 justify-end">
                           <button onClick={() => handleHostMuteParticipant(part.id)} className="text-[9px] px-2 py-1 bg-purple-950/40 text-purple-300 rounded font-bold hover:bg-purple-900/50">Force Mute</button>
                           <button onClick={() => {
                             setMeetingStates(prev => {
                               const mState = prev[currentMeetingSession.id];
                               if (!mState) return prev;
                               const nextParticipants = mState.participants.map(p => p.id === part.id ? { ...p, isVideoOff: true, hostVideoOff: true } : p);
                               const next = { ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } };
                               localStorage.setItem('as_meeting_states', JSON.stringify(next));
                               return next;
                             });
                           }} className="text-[9px] px-2 py-1 bg-purple-950/40 text-purple-300 rounded font-bold hover:bg-purple-900/50">Stop Video</button>
                           <button onClick={() => handleHostKickParticipant(part.id)} className="text-[9px] px-2 py-1 bg-red-950/40 text-red-300 rounded font-bold hover:bg-red-900/50">Kick</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host Tools Sidebar */}
            {showHostTools && (currentUser.id === currentMeetingSession.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)) && (
              <div className="w-72 flex flex-col bg-[#0b0713] border-l border-purple-500/15 shrink-0 shadow-2xl relative z-10 animate-in slide-in-from-right-8 duration-200">
                <div className="px-4 py-3 border-b border-purple-500/10 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5"><Shield size={12}/> Host Tools</span>
                  <button onClick={() => setShowHostTools(false)} className="text-purple-400 hover:text-white"><X size={14} /></button>
                </div>
                <div className="p-4 space-y-6">
                  <div>
                    <label className="text-[10px] text-purple-400 uppercase font-bold block mb-2 tracking-wider">Room Controls</label>
                    <div className="space-y-2">
                      <button onClick={async () => {
                        setProcessingHostAction('mute_all');
                        try {
                          const mState = meetingStates[currentMeetingSession.id];
                          if (!mState) return;
                          const nextVal = !mState.areAllMuted;
                          const nextParticipants = mState.participants.map(p => {
                            if (p.id === currentMeetingSession.host_id) return p;
                            if (nextVal) {
                              return { ...p, isMuted: true, hostMuted: true }; // Force Mute
                            } else {
                              return { ...p, hostMuted: false }; // Allow Unmute (do not force on)
                            }
                          });
                          const next = { ...meetingStates, [currentMeetingSession.id]: { ...mState, participants: nextParticipants, areAllMuted: nextVal } };
                          setMeetingStates(next);
                          setAreAllMuted(nextVal);
                          await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: nextVal }, { onConflict: 'meeting_id' });
                          addNotification(nextVal ? 'All participants muted.' : 'All participants unmuted.', 'info');
                        } finally {
                          setProcessingHostAction(null);
                        }
                      }} disabled={processingHostAction === 'mute_all'} className={`w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed border text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${meetingStates[currentMeetingSession.id]?.areAllMuted ? 'bg-red-950/40 border-red-500/30 text-red-300' : 'bg-[#150e1f] border-purple-500/20 hover:border-red-500/30 text-purple-300 hover:text-red-300'}`}>
                        <MicOff size={14} /> {processingHostAction === 'mute_all' ? 'Processing...' : (meetingStates[currentMeetingSession.id]?.areAllMuted ? 'Unmute All Mics' : 'Force Mute All Mics')}
                      </button>
                      <button onClick={async () => {
                        setProcessingHostAction('video_all');
                        try {
                          const mState = meetingStates[currentMeetingSession.id];
                          if (!mState) return;
                          const areAllCamerasOff = mState.participants.filter(p => p.id !== currentMeetingSession.host_id).every(p => p.hostVideoOff);
                          const nextVal = !areAllCamerasOff;
                          const nextParticipants = mState.participants.map(p => {
                            if (p.id === currentMeetingSession.host_id) return p;
                            if (nextVal) {
                              return { ...p, isVideoOff: true, hostVideoOff: true }; // Force Off
                            } else {
                              return { ...p, hostVideoOff: false }; // Allow On (do not force on)
                            }
                          });
                          const next = { ...meetingStates, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } };
                          setMeetingStates(next);
                          await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
                          addNotification(nextVal ? 'All cameras turned off.' : 'All cameras turned back on.', 'info');
                        } finally {
                          setProcessingHostAction(null);
                        }
                      }} disabled={processingHostAction === 'video_all'} className={`w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed border text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${meetingStates[currentMeetingSession.id]?.participants.filter(p => p.id !== currentMeetingSession?.host_id).every(p => p.hostVideoOff) ? 'bg-red-950/40 border-red-500/30 text-red-300' : 'bg-[#150e1f] border-purple-500/20 hover:border-red-500/30 text-purple-300 hover:text-red-300'}`}>
                        <VideoOff size={14} /> {processingHostAction === 'video_all' ? 'Processing...' : (meetingStates[currentMeetingSession.id]?.participants.filter(p => p.id !== currentMeetingSession?.host_id).every(p => p.hostVideoOff) ? 'Turn On All Cameras' : 'Turn Off All Cameras')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-400 uppercase font-bold block mb-2 tracking-wider">Chat Controls</label>
                    <button onClick={async () => { 
                      const nextVal = !isChatLocked;
                      setIsChatLocked(nextVal);
                      const mState = meetingStates[currentMeetingSession.id];
                      if (mState) {
                        const next = { ...meetingStates, [currentMeetingSession.id]: { ...mState, isChatLocked: nextVal } };
                        setMeetingStates(next);
                        await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: mState.participants, chat: mState.chat, is_chat_locked: nextVal, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
                      }
                      addNotification(nextVal ? 'Meeting chat locked.' : 'Meeting chat unlocked.', 'info');
                    }} className="w-full py-2.5 bg-[#150e1f] hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/40 text-xs text-purple-300 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                      {isChatLocked ? <Unlock size={14} /> : <Lock size={14} />} {isChatLocked ? 'Unlock Meeting Chat' : 'Lock Meeting Chat'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="h-16 bg-[#0e0a17] border border-purple-500/15 rounded-2xl flex items-center justify-between px-6 shrink-0 relative z-20 shadow-xl">
            {/* Media Controls */}
            <div className="flex gap-2">
              {[
                { 
                  icon: isMuted ? <MicOff size={16} /> : <Mic size={16} />, 
                  active: isMuted, 
                  label: isMuted ? 'Unmute' : 'Mute',
                  action: () => { 
                    const myInfo = meetingParticipants.find(p => p.id === currentUser.id);
                    if (myInfo?.hostMuted) {
                      setCustomAlert('Host has not allowed you to unmute your mic.');
                      return;
                    }
                    const nextVal = !isMuted;
                    setIsMuted(nextVal);
                    // Mute/unmute actual audio track
                    const ls = streamsRef.current[currentUser.id];
                    if (ls) ls.getAudioTracks().forEach(t => { t.enabled = !nextVal; });
                    setMeetingStates(prev => {
                      const mState = prev[currentMeetingSession.id];
                      if (!mState) return prev;
                      const nextParticipants = mState.participants.map(p => p.id === currentUser.id ? { ...p, isMuted: nextVal } : p);
                      const next = { ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } };
                      supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' }).then();
                      return next;
                    });
                  } 
                },
                { 
                  icon: isVideoOff ? <VideoOff size={16} /> : <Video size={16} />, 
                  active: isVideoOff, 
                  label: isVideoOff ? 'Start Video' : 'Stop Video',
                  action: async () => { 
                    const myInfo = meetingParticipants.find(p => p.id === currentUser.id);
                    if (myInfo?.hostVideoOff) {
                      setCustomAlert('Host has not allowed you to turn on your camera.');
                      return;
                    }
                    const nextVal = !isVideoOff;
                    setIsVideoOff(nextVal);
                    const ls = streamsRef.current[currentUser.id];
                    if (nextVal) {
                      // True stop to turn off hardware light
                      if (ls) ls.getVideoTracks().forEach(t => t.stop());
                      setStreamTrigger(t => t + 1); // re-render to show avatar
                    } else {
                      // Restart camera
                      try {
                        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        const newVideoTrack = newStream.getVideoTracks()[0];
                        if (ls) {
                          ls.getVideoTracks().forEach(t => { t.stop(); ls.removeTrack(t); });
                          ls.addTrack(newVideoTrack);
                        } else {
                          streamsRef.current[currentUser.id] = newStream;
                        }
                        // Replace track in peer connections (renegotiation triggered via onnegotiationneeded)
                        Object.values(pcsRef.current).forEach(pc => {
                          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                          if (sender) sender.replaceTrack(newVideoTrack);
                        });
                        setStreamTrigger(t => t + 1);
                      } catch (err) {
                        addNotification('Camera access denied or unavailable', 'warning');
                        setIsVideoOff(true);
                      }
                    }
                    
                    setMeetingStates(prev => {
                      const mState = prev[currentMeetingSession.id];
                      if (!mState) return prev;
                      const nextParticipants = mState.participants.map(p => p.id === currentUser.id ? { ...p, isVideoOff: nextVal } : p);
                      const next = { ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } };
                      supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' }).then();
                      return next;
                    });
                  } 
                },
                { 
                  icon: isScreenSharing ? <Monitor size={16} className="text-emerald-400" /> : <Monitor size={16} />, 
                  active: isScreenSharing, 
                  label: isScreenSharing ? 'Stop Share' : 'Share Screen',
                  action: () => isScreenSharing ? handleStopScreenShare() : handleStartScreenShare()
                },
                { 
                  icon: <span style={{fontSize:16}}>😊</span>, 
                  active: showReactionsPanel, 
                  label: 'Reactions',
                  action: () => setShowReactionsPanel(p => !p)
                }
              ].map((btn, i) => (
                <button key={i} onClick={btn.action}
                  title={btn.label || ''}
                  className={`p-2.5 rounded-xl border transition-all ${btn.active ? 'bg-red-900/40 border-red-500/30 text-red-300' : 'bg-[#150f22] border-purple-500/15 text-purple-300 hover:border-purple-500/40 hover:bg-purple-900/20'}`}>
                  {btn.icon}
                </button>
              ))}
            </div>

            {/* Reactions Panel */}
            {showReactionsPanel && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#0d0820] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-900/40 p-4 w-72 animate-in slide-in-from-bottom-4 duration-200">
                <div className="text-[10px] uppercase font-bold text-purple-400 mb-3 tracking-widest">Reactions</div>
                {/* Raise Hand — top prominent */}
                {(() => {
                  const myInfo = meetingParticipants.find(p => p.id === currentUser.id);
                  const isRaised = myInfo?.isHandRaised;
                  return (
                    <button
                      onClick={async () => {
                        const nextVal = !isRaised;
                        const mState = meetingStates[currentMeetingSession.id];
                        if (mState) {
                          const nextParticipants = mState.participants.map(p => p.id === currentUser.id ? { ...p, isHandRaised: nextVal } : p);
                          setMeetingStates(prev => ({ ...prev, [currentMeetingSession.id]: { ...mState, participants: nextParticipants } }));
                          await supabase.from('meeting_states').upsert({ meeting_id: currentMeetingSession.id, participants: nextParticipants, chat: mState.chat, is_chat_locked: mState.isChatLocked, are_all_muted: mState.areAllMuted }, { onConflict: 'meeting_id' });
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border mb-3 font-bold text-sm transition-all ${
                        isRaised
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                          : 'bg-purple-900/20 border-purple-500/20 text-white hover:bg-yellow-500/10 hover:border-yellow-500/30'
                      }`}>
                      <span style={{fontSize: 22}}>✋</span>
                      <span>{isRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                      {isRaised && <span className="ml-auto text-[10px] bg-yellow-500/20 px-2 py-0.5 rounded-full">Active</span>}
                    </button>
                  );
                })()}
                {/* Emoji Reactions */}
                <div className="text-[10px] uppercase font-bold text-purple-500 mb-2 tracking-widest">Send Reaction</div>
                <div className="grid grid-cols-6 gap-2">
                  {['👍', '❤️', '😂', '😮', '👏', '🎉', '🔥', '💯', '😢', '🤔', '👎', '⭐'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={async () => {
                        // Show floating reaction on all clients via meeting chat broadcast
                        const reactionId = `react-${Date.now()}-${Math.random()}`;
                        const reaction = { id: reactionId, emoji, userId: currentUser.id, name: currentUser.full_name };
                        setFloatingReactions(prev => [...prev, reaction]);
                        // Auto-remove after 3.5s
                        setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== reactionId)), 3500);
                        // Broadcast via meeting chat so others see it too
                        const mState = meetingStates[currentMeetingSession.id];
                        if (mState && channelRef.current) {
                          channelRef.current.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'REACTION', from: currentUser.id, name: currentUser.full_name, emoji, reactionId } });
                        }
                        setShowReactionsPanel(false);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-900/20 border border-purple-500/15 hover:bg-purple-700/30 hover:border-purple-500/40 hover:scale-125 transition-all text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View Controls */}
            <div className="flex gap-2 border-l border-purple-500/20 pl-4">
              <button onClick={() => { setShowMeetingParticipants(!showMeetingParticipants); setShowMeetingChat(false); setShowHostTools(false); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${showMeetingParticipants ? 'text-white bg-purple-900/40' : 'text-purple-400 hover:bg-purple-900/20 hover:text-purple-200'}`}>
                <Users size={16} />
                <span className="text-[9px] font-bold">Participants</span>
              </button>
              <button onClick={() => { setShowMeetingChat(!showMeetingChat); setShowMeetingParticipants(false); setShowHostTools(false); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all relative ${showMeetingChat ? 'text-white bg-purple-900/40' : 'text-purple-400 hover:bg-purple-900/20 hover:text-purple-200'}`}>
                <MessageSquare size={16} />
                <span className="text-[9px] font-bold">Chat</span>
              </button>
              {(currentUser.id === currentMeetingSession.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)) && (
                <button onClick={() => isRecording ? handleStopRecording() : handleStartRecording()}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${isRecording ? 'text-red-400 bg-red-950/60 animate-pulse' : 'text-purple-400 hover:bg-purple-900/20 hover:text-purple-200'}`}>
                  {isRecording ? <Square size={16} fill="currentColor" /> : <Disc size={16} />}
                  <span className="text-[9px] font-bold">{isRecording ? 'Recording...' : 'Record'}</span>
                </button>
              )}
              {(currentUser.id === currentMeetingSession.host_id || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)) && (
                <button onClick={() => { setShowHostTools(!showHostTools); setShowMeetingChat(false); setShowMeetingParticipants(false); }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${showHostTools ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-600 hover:bg-yellow-900/10 hover:text-yellow-500'}`}>
                  <Shield size={16} />
                  <span className="text-[9px] font-bold">Host Tools</span>
                </button>
              )}
            </div>
          </footer>
        </div>
      )}

      {/* ═══════════════════ SIDEBAR ═══════════════════ */}
      <aside className="w-64 glass-panel border-r border-[#9333ea]/15 flex-col p-5 hidden md:flex shrink-0">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-none">AuraSuite</h1>
            <span className="text-[9px] text-purple-400 font-bold tracking-wider uppercase mt-0.5 block">{activeOrg.name}</span>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-[9px] uppercase tracking-wider text-purple-500 font-bold block mb-2">Navigation</label>
          <div className="flex flex-col gap-0.5">
            {[
              { id: 'dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
              { id: 'admin', icon: <Shield size={15} />, label: 'Admin Control', adminOnly: true },
              { id: 'users', icon: <Users size={15} />, label: 'Users', adminOnly: true },
              { id: 'meetings', icon: <Video size={15} />, label: 'Meetings' },
              { id: 'chat', icon: <MessageSquare size={15} />, label: 'Team Chat', hideForClient: true },
              { id: 'schedules', icon: <Calendar size={15} />, label: 'Schedules', hideForClient: true },
              { id: 'financials', icon: <CreditCard size={15} />, label: 'Financials', hideForClient: true },
            ].filter(item => {
              if (item.adminOnly && !['admin', 'super_admin', 'sub_admin', 'manager'].includes(currentUser.role)) return false;
              if (item.hideForClient && currentUser.role === 'client') return false;
              return true;
            }).map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === item.id ? 'bg-purple-900/40 border border-purple-500/30 text-white' : 'text-purple-300 hover:bg-[#191325] hover:text-white'}`}>
                <span className="text-purple-400">{item.icon}</span>
                {item.label}
                {item.id === 'chat' && (groupMessages.length > 0) && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-purple-600 text-[9px] text-white flex items-center justify-center font-bold">
                    {Math.min(groupMessages.length, 9)}
                  </span>
                )}
                {item.id === 'meetings' && myInvitedMeetings.length > 0 && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                    {myInvitedMeetings.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-[#9333ea]/15 relative">
          {showProfileMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-full bg-[#140b20] border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden z-50">
              <button onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-white hover:bg-purple-900/30 transition-colors border-b border-purple-500/10">
                <Settings size={14} className="text-purple-400" /> Settings
              </button>
              <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-950/30 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-full flex items-center gap-2.5 hover:bg-purple-900/20 p-2 rounded-xl transition-colors">
            <div className="w-9 h-9 rounded-full bg-purple-700/50 flex items-center justify-center text-sm font-bold border border-purple-500/30 text-white shrink-0">
              {currentUser.full_name[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-semibold text-white truncate">{currentUser.full_name}</div>
              <div className="text-[9px] text-purple-400 uppercase font-bold mt-0.5">{currentUser.role} {currentUser.category ? `· Cat. ${currentUser.category}` : ''}</div>
            </div>
          </button>
        </div>
      </aside>

      {/* ═══════════════════ MAIN ═══════════════════ */}
      <main className="flex-1 flex flex-col min-w-0">

        <header className="h-14 glass-panel border-b border-[#9333ea]/15 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-bold uppercase">
              {activeOrg?.type ? activeOrg.type.replace('_', ' ') : 'SOFTWARE HOUSE'}
            </span>
            <ChevronRight size={13} className="text-purple-600" />
            <span className="text-xs text-purple-200 capitalize font-medium">{activeTab}</span>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <div className="text-[10px] text-purple-300 bg-purple-950/30 border border-purple-500/10 px-3 py-1 rounded-lg truncate max-w-[280px]">
                {notifications[0].text}
              </div>
            )}
            <button onClick={() => setShowPresenceModal(true)} className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 rounded-lg hover:bg-emerald-950/50 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{orgUsers.filter(u => onlineUsers.includes(u.id)).length} Online</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Meeting invites for current user ── */}
          {myInvitedMeetings.map(meet => (
            <div key={meet.id} className="glass-panel-glow border border-purple-500/40 p-4 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5 pointer-events-none" />
              <div className="flex items-center gap-3 relative">
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 animate-pulse">
                  <Video size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Meeting Invite</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <p className="text-xs text-purple-200 mt-0.5">&quot;{meet.title}&quot; by {meet.host_name} · ID: <span className="font-mono text-purple-300">{meet.meeting_id}</span></p>
                </div>
              </div>
              <div className="flex gap-2 relative">
                <button onClick={() => copyMeetingInvite(meet)}
                  className="p-2 bg-[#120a1f] border border-purple-500/25 text-purple-300 hover:text-white rounded-xl text-xs">
                  {copiedMeetId === meet.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button onClick={() => { setPreMeetingMeet(meet); setPreMeetingChecklist({ micOn: false, camOn: false }); }}
                  className="px-4 py-1.5 accent-gradient text-white rounded-xl text-xs font-bold glow-btn">
                  Join Now
                </button>
              </div>
            </div>
          ))}

          {/* Active org meetings (for host to see) */}
          {orgMeetings.filter(m => m.host_id === currentUser.id).map(meet => (
            <div key={meet.id} className="glass-panel border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <div>
                  <span className="text-xs font-bold text-white">Your Active Meeting: &quot;{meet.title}&quot;</span>
                  <p className="text-[10px] text-purple-300 mt-0.5">ID: {meet.meeting_id} · Passcode: {meet.passcode}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setMeetingInviteModal(meet); setSelectedInvitees([]); }}
                  className="px-3 py-1.5 bg-purple-900/50 border border-purple-500/30 text-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1">
                  <Send size={11} /> Invite
                </button>
                <button onClick={() => copyMeetingInvite(meet)}
                  className="p-2 bg-[#120a1f] border border-purple-500/25 text-purple-300 rounded-xl">
                  {copiedMeetId === meet.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button onClick={() => { setPreMeetingMeet(meet); setPreMeetingChecklist({ micOn: false, camOn: false }); }}
                  className="px-4 py-1.5 accent-gradient text-white rounded-xl text-xs font-bold glow-btn">
                  Join
                </button>
              </div>
            </div>
          ))}

          {/* ═══════ ADMIN PANEL ═══════ */}
          {activeTab === 'admin' && ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) && (
            <div className="space-y-6">

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: orgUsers.length, icon: <Users size={18} />, color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-500/20' },
                  { label: 'Online Now', value: orgUsers.filter(u => onlineUsers.includes(u.id)).length, icon: <Activity size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
                  { label: 'Workers', value: orgUsers.filter(u => u.role === 'worker').length, icon: <Award size={18} />, color: 'text-indigo-400', bg: 'bg-indigo-950/30 border-indigo-500/20' },
                  { label: 'Clients', value: orgUsers.filter(u => u.role === 'client').length, icon: <Star size={18} />, color: 'text-yellow-400', bg: 'bg-yellow-950/20 border-yellow-500/20' },
                ].map(stat => (
                  <div key={stat.label} className={`glass-panel p-5 rounded-2xl border ${stat.bg} flex items-center gap-4`}>
                    <div className={`${stat.color}`}>{stat.icon}</div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wide">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Meetings Summary */}
              <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <Video size={16} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Active Meetings in System</h3>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/20 text-[10px] text-purple-300 font-bold">{orgMeetings.length} Live</span>
                </div>
                {orgMeetings.length === 0 ? (
                  <p className="text-xs text-purple-400 p-3 bg-purple-950/10 border border-purple-500/5 rounded-xl">No active meetings right now.</p>
                ) : (
                  <div className="space-y-2">
                    {orgMeetings.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-[#0f0b18] border border-purple-500/10 rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-white">{m.title}</span>
                          <div className="text-[10px] text-purple-400 mt-0.5">Host: {m.host_name} · ID: {m.meeting_id}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleJoinMeeting(m)}
                            className="px-3 py-1 bg-purple-900/50 border border-purple-500/30 text-purple-200 rounded-lg text-[10px] font-bold">Monitor</button>
                          <button onClick={() => { setActiveMeetings(prev => prev.filter(x => x.id !== m.id)); addNotification(`Meeting "${m.title}" terminated.`, 'warning'); }}
                            className="px-3 py-1 bg-red-950/40 border border-red-500/20 text-red-300 rounded-lg text-[10px] font-bold">Terminate</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Team Member Digital Card Generator */}
              <div className="glass-panel p-5 rounded-2xl border border-purple-500/10 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Generate Digital Access Card</h3>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!genInviteName || !inviteEmail) { alert('Please enter name and email'); return; }
                  
                  // Check if this email is banned in Supabase
                  const { data: bannedData } = await supabase.from('banned_emails').select('*').eq('email', inviteEmail.toLowerCase());
                  if (bannedData && bannedData.length > 0) {
                    const banRecord = bannedData[0];
                    const bannedUntil = new Date(banRecord.banned_until).getTime();
                    if (Date.now() < bannedUntil) {
                      const availableDate = new Date(banRecord.banned_until).toLocaleDateString();
                      addNotification(`This email is under a 30-day permanent ban. Re-invite available after ${availableDate}.`, 'error');
                      return;
                    } else {
                      // Auto Unblock
                      await supabase.from('banned_emails').delete().eq('email', inviteEmail.toLowerCase());
                    }
                  }

                  const cleanEmail = inviteEmail.trim().toLowerCase();

                  // Check if this email exists in DB (more robust than local state)
                  const { data: existingDbProfiles } = await supabase.from('profiles').select('*').eq('email', cleanEmail).limit(1);
                  const existingProfile = existingDbProfiles && existingDbProfiles.length > 0 ? existingDbProfiles[0] : null;
                  
                  let finalProfileId = genId('user');
                  let isUpdate = false;

                  if (existingProfile && !existingProfile.email.includes('_deleted@') && !existingProfile.email.includes('_banned@')) {
                    if (existingProfile.role === 'pending_worker' || existingProfile.role === 'worker') {
                      // Reuse existing profile if they are pending or already a worker (re-inviting them to get a new card)
                      finalProfileId = existingProfile.id;
                      isUpdate = true;
                      
                      // Delete old digital card if exists
                      await supabase.from('digital_cards').delete().eq('profile_id', existingProfile.id);
                    } else {
                      alert('This email is already fully registered with a higher role in the system!\n\nIf this person has already logged in, they cannot be re-invited.\nFor testing, try a Gmail alias like: yourname+test2@gmail.com');
                      return;
                    }
                  }
                  
                  const cardNumber = `AS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                  const tempUsername = genInviteName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 100);
                  const tempPassword = Math.random().toString(36).slice(-8);

                  // Build the invite link using a single base64 token (no & in URL = no encoding issues)
                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aurasuite-kappa.vercel.app';
                  const loginToken = btoa(JSON.stringify({ card: cardNumber, username: tempUsername, orgType: activeOrg.type || 'software_house' }));
                  const inviteLink = `${baseUrl}/?t=${loginToken}`;

                  // 1. Create/Update Profile (as 'pending_worker' to hide from UI until they login)
                  const newProfile = {
                    id: finalProfileId,
                    organization_id: activeOrg.id,
                    email: cleanEmail,
                    full_name: genInviteName.trim(),
                    role: isUpdate ? existingProfile.role : 'pending_worker',
                    category: genInviteCategory || null,
                    domain: genInviteDomain || '',
                    skills: existingProfile ? existingProfile.skills : [],
                    last_seen: now()
                  };

                  // 2. Create Digital Card with actual real role (pending=true)
                  const newCard = {
                    card_number: cardNumber,
                    username: tempUsername,
                    temp_password: tempPassword,
                    profile_id: finalProfileId,
                    organization_id: activeOrg.id,
                    email: cleanEmail,
                    full_name: genInviteName.trim(),
                    role: genInviteRole, // store real role here
                    category: genInviteCategory || null,
                    domain: genInviteDomain || '',
                    is_pending: true
                  };
                  
                  try {
                    if (isUpdate) {
                      const { error: pErr } = await supabase.from('profiles').update(newProfile).eq('id', finalProfileId);
                      if (pErr) throw pErr;
                      setProfiles(prev => prev.map(p => p.id === finalProfileId ? { ...p, ...newProfile } : p));
                    } else {
                      const { error: pErr } = await supabase.from('profiles').insert(newProfile);
                      if (pErr) throw pErr;
                      setProfiles(prev => [...prev, newProfile]);
                    }

                    const { error: cErr } = await supabase.from('digital_cards').insert(newCard);
                    if (cErr) throw cErr;
                    
                    // Send Email with invite link
                    const res = await fetch('/api/send-invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: inviteEmail,
                        name: genInviteName,
                        cardNumber,
                        username: tempUsername,
                        tempPassword,
                        orgName: activeOrg.name,
                        inviteLink,
                        role: genInviteRole
                      })
                    });
                    
                    const emailData = await res.json();
                    if (!emailData.success) {
                      throw new Error('Email failed to send: ' + (emailData.error || emailData.message || 'Unknown error'));
                    }
                    
                    addNotification(`Invite sent to ${genInviteName}! They will appear in the team once they complete onboarding.`, 'success');
                    setGeneratedLink(inviteLink);
                    setGeneratedCardData(newCard);
                    setGenInviteName('');
                    setInviteEmail('');
                    setGenInviteDomain('');
                  } catch (err) {
                    alert('Error creating card: ' + err.message);
                  }
                }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Full Name</label>
                    <input type="text" placeholder="e.g. Zainab Ali" value={genInviteName} onChange={e => setGenInviteName(e.target.value)} required
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Email Address</label>
                    <input type="email" placeholder="zainab@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Assigned Role</label>
                    <select value={genInviteRole} onChange={e => setGenInviteRole(e.target.value)}
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none">
                      {activeOrg?.type === 'academy' ? (
                        <>
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </>
                      ) : activeOrg?.type === 'factory' ? (
                        <>
                          <option value="worker">Factory Worker</option>
                          <option value="manager">Manager</option>
                        </>
                      ) : (
                        <>
                          <option value="worker">Worker / Staff</option>
                          <option value="client">Client</option>
                          <option value="sub_admin">Sub-Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Domain / Specialty</label>
                    <input type="text" placeholder="e.g. Front-end Developer" value={genInviteDomain} onChange={e => setGenInviteDomain(e.target.value)}
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                  <div className="md:col-span-4 flex justify-end items-center pt-2">
                    <button type="submit" className="px-5 py-2 rounded-xl accent-gradient text-xs font-bold text-white glow-btn flex items-center gap-2">
                      <Send size={14} /> Send Digital Access Card
                    </button>
                  </div>
                </form>
                
                {generatedLink && generatedCardData && (
                  <div className="relative p-3.5 bg-[#140b20] border border-purple-500/30 rounded-xl space-y-4">
                    <button onClick={() => { setGeneratedLink(''); setGeneratedCardData(null); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800/60 transition-colors z-10">
                      <X size={12} />
                    </button>
                    <DigitalCardVisual cardData={generatedCardData} />
                    <div className="text-xs text-white bg-[#0a0510] p-2.5 rounded-lg border border-purple-500/10 font-mono break-all leading-relaxed text-center">
                      Email Sent Successfully! ✅
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && ['admin', 'super_admin'].includes(currentUser.role) && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* User Management Table */}
              <div className="glass-panel rounded-2xl border border-purple-500/10 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-purple-500/10">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-purple-400" />
                    <h3 className="text-sm font-bold text-white">User Management</h3>
                  </div>
                  <span className="text-[10px] text-purple-400">{orgUsers.length} members in {activeOrg.name}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/10 text-left">
                        {['User', 'Role', 'Category', 'AI Domain', 'Skills', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-[10px] text-purple-400 uppercase font-bold tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orgUsers.map((user, i) => (
                        <tr key={user.id} className={`border-b border-purple-500/5 hover:bg-purple-950/10 transition-colors ${i % 2 === 0 ? '' : 'bg-[#0c0818]/40'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-purple-700/40 flex items-center justify-center text-xs font-bold text-white border border-purple-500/20">
                                {user.full_name[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{user.full_name}</div>
                                <div className="text-[9px] text-purple-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                              ['admin', 'super_admin'].includes(user.role) ? 'bg-purple-950/50 border-purple-500/30 text-purple-300' :
                              user.role === 'worker' ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300' :
                              'bg-yellow-950/30 border-yellow-500/20 text-yellow-300'
                            }`}>{user.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            {user.category ? (
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                user.category === 'A' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' :
                                user.category === 'B' ? 'bg-blue-950/40 border-blue-500/30 text-blue-300' :
                                'bg-orange-950/30 border-orange-500/20 text-orange-300'
                              }`}>Tier {user.category}</span>
                            ) : <span className="text-purple-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-purple-200">{user.domain || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {(user.skills || []).slice(0, 3).map(sk => (
                                <span key={sk} className="px-1.5 py-0.5 bg-purple-950/50 border border-purple-500/10 text-[9px] text-purple-300 rounded">{sk}</span>
                              ))}
                              {(user.skills || []).length > 3 && <span className="text-[9px] text-purple-500">+{user.skills.length - 3}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(user.id) ? 'bg-emerald-500' : 'bg-purple-800'}`} />
                              <span className={`text-[9px] font-semibold ${onlineUsers.includes(user.id) ? 'text-emerald-400' : 'text-purple-500'}`}>
                                {onlineUsers.includes(user.id) ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => handleAdminEditUser(user)}
                                className="p-1.5 bg-purple-950/50 border border-purple-500/20 rounded-lg text-purple-300 hover:text-white hover:border-purple-500/50 transition-all">
                                <Edit3 size={11} />
                              </button>
                              {user.id !== currentUser.id && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleSuspendUser(user.id)} title="Delete / Suspend"
                                    className="p-1.5 bg-yellow-950/30 border border-yellow-500/20 rounded-lg text-yellow-400 hover:text-white hover:border-yellow-500/50 transition-all">
                                    <UserMinus size={11} />
                                  </button>
                                  <button onClick={() => handleBanUser(user.id)} title="Delete Permanently (Ban)"
                                    className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all">
                                    <UserX size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Category Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { cat: 'A', label: 'Senior / Lead', color: 'emerald', desc: 'Architects & Senior Engineers' },
                  { cat: 'B', label: 'Mid Level', color: 'blue', desc: 'Developers & Team Members' },
                  { cat: 'C', label: 'Junior', color: 'orange', desc: 'Interns & Junior Staff' },
                ].map(tier => {
                  const count = orgUsers.filter(u => u.category === tier.cat).length;
                  return (
                    <div key={tier.cat} className={`glass-panel p-5 rounded-2xl border border-${tier.color}-500/20`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className={`text-[10px] font-bold text-${tier.color}-400 uppercase tracking-wider`}>Tier {tier.cat} — {tier.label}</span>
                          <p className="text-[9px] text-purple-400 mt-0.5">{tier.desc}</p>
                        </div>
                        <div className={`text-3xl font-bold text-${tier.color}-400`}>{count}</div>
                      </div>
                      <div className="space-y-1.5">
                        {orgUsers.filter(u => u.category === tier.cat).map(u => (
                          <div key={u.id} className="flex items-center gap-2 p-1.5 bg-[#0f0b18] rounded-lg">
                            <div className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(u.id) ? 'bg-emerald-500' : 'bg-purple-800'}`} />
                            <span className="text-[10px] text-white font-medium truncate">{u.full_name}</span>
                            <span className="text-[9px] text-purple-500 ml-auto shrink-0">{u.domain?.split(' ')[0] || u.role}</span>
                          </div>
                        ))}
                        {count === 0 && <p className="text-[10px] text-purple-600 text-center py-2">No members in this tier</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Budget Panel for Admin */}
              <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white">AI-Powered Payout Calculator (PKR)</h3>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-xs text-purple-400 p-3 bg-purple-950/10 border border-purple-500/5 rounded-xl">No tasks found. Workers must create tasks first.</p>
                ) : (
                  <form onSubmit={handleSuggestBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Select Task</label>
                      <select value={budgetTaskId} onChange={e => setBudgetTaskId(e.target.value)}
                        className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none">
                        {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Complexity</label>
                      <select value={budgetComplexity} onChange={e => setBudgetComplexity(e.target.value)}
                        className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none">
                        <option value="low">Low (Rs. 1,000/hr)</option>
                        <option value="medium">Medium (Rs. 2,000/hr)</option>
                        <option value="high">High (Rs. 4,000/hr)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Hours</label>
                      <input type="number" value={budgetHours} onChange={e => setBudgetHours(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" min="1" />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button type="submit" disabled={suggestLoading}
                        className="px-5 py-2 rounded-xl accent-gradient text-xs font-bold text-white glow-btn">
                        {suggestLoading ? 'Calculating...' : 'Estimate Budget'}
                      </button>
                    </div>
                  </form>
                )}
                {suggestedBudget !== null && (
                  <div className="p-4 bg-[#140b20] border border-purple-500/25 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-purple-200">AI Suggested:</span>
                      <span className="text-base font-bold text-white">Rs. {suggestedBudget.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-purple-300">{budgetExplanation}</p>
                    <div className="flex items-center gap-3 pt-2 border-t border-purple-500/10">
                      <div className="flex-1">
                        <label className="text-[9px] uppercase font-bold text-purple-400 block mb-1">Override Amount (Rs.)</label>
                        <input type="number" value={overrideBudget} onChange={e => setOverrideBudget(e.target.value)}
                          className="w-full bg-[#1d142d] border border-purple-500/20 rounded-xl p-1.5 text-xs text-white focus:outline-none" />
                      </div>
                      <button onClick={handleApprovePayout}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold mt-4">
                        Approve Payout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ MEETINGS TAB ═══════ */}
          {activeTab === 'meetings' && (
            <div className="space-y-5">
              <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <Video size={16} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Create New Meeting</h3>
                </div>
                <form onSubmit={handleStartMeeting} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-purple-300 block mb-1">Meeting Topic</label>
                    <input type="text" placeholder="e.g. Design Sync Room" value={newMeetingTitle}
                      onChange={e => setNewMeetingTitle(e.target.value)} required
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-purple-300 block mb-1">Passcode (optional)</label>
                    <input type="text" placeholder="Auto-generated if empty" value={newMeetingPasscode}
                      onChange={e => setNewMeetingPasscode(e.target.value)}
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full py-2.5 rounded-xl accent-gradient text-xs font-bold text-white glow-btn flex items-center justify-center gap-2">
                      <Video size={14} /> Create Meeting
                    </button>
                  </div>
                </form>
              </div>

              {/* All org meetings */}
              <div className="glass-panel rounded-2xl border border-purple-500/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-purple-500/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Active Meetings</h3>
                  <span className="text-[10px] text-purple-400">{orgMeetings.length} live sessions</span>
                </div>
                {orgMeetings.length === 0 ? (
                  <div className="p-8 text-center">
                    <Video size={32} className="text-purple-700 mx-auto mb-3" />
                    <p className="text-xs text-purple-400">No active meetings. Create one above to get started.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {orgMeetings.map(meet => {
                      const isMine = meet.host_id === currentUser.id;
                      const invited = isInvitedToMeeting(meet);
                      return (
                        <div key={meet.id} className="p-4 bg-[#0f0b18] border border-purple-500/10 rounded-2xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center">
                              <Video size={18} className="text-purple-400" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                {meet.title}
                                {isMine && <span className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/30 rounded text-[9px] text-purple-300">Your Meeting</span>}
                                {invited && !isMine && <span className="px-1.5 py-0.5 bg-red-900/50 border border-red-500/30 rounded text-[9px] text-red-300 animate-pulse">Invited</span>}
                              </div>
                              <div className="text-[10px] text-purple-400 mt-0.5">Host: {meet.host_name} · ID: <span className="font-mono text-purple-300">{meet.meeting_id}</span> · Code: <span className="font-mono text-purple-300">{meet.passcode}</span></div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {isMine && (
                              <button onClick={() => { setMeetingInviteModal(meet); setSelectedInvitees([]); }}
                                className="px-3 py-1.5 bg-purple-900/50 border border-purple-500/30 text-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                                <Send size={11} /> Invite
                              </button>
                            )}
                            <button onClick={() => copyMeetingInvite(meet)}
                              className="p-2 bg-[#120a1f] border border-purple-500/25 text-purple-300 hover:text-white rounded-xl">
                              {copiedMeetId === meet.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                            {(isMine || invited || ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)) && (
                              <button onClick={() => { setPreMeetingMeet(meet); setPreMeetingChecklist({ micOn: false, camOn: false }); }}
                                className="px-4 py-1.5 accent-gradient text-white rounded-xl text-xs font-bold glow-btn">
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ CHAT TAB ═══════ */}
          {activeTab === 'chat' && (
            <div className="glass-panel rounded-2xl border border-purple-500/10 overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
              <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-56 border-r border-purple-500/10 flex flex-col shrink-0">
                  <div className="p-4 border-b border-purple-500/10">
                    <h3 className="text-xs font-bold text-white">Team Chat</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {/* Group Chat */}
                    <button onClick={() => { setActiveChat('group'); setActiveDmUser(null); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-all ${activeChat === 'group' && !activeDmUser ? 'bg-purple-900/30 border-r-2 border-purple-500' : 'hover:bg-purple-950/20'}`}>
                      <Hash size={14} className="text-purple-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white">Team General</div>
                        <div className="text-[9px] text-purple-400">Whole organization</div>
                      </div>
                    </button>
                    <div className="px-4 py-2">
                      <span className="text-[9px] text-purple-500 uppercase font-bold tracking-wider">Direct Messages</span>
                    </div>
                    {orgMembers.filter(u => u.role !== 'deleted' && u.role !== 'pending_worker' && u.role !== 'suspended').map(user => {
                      const key = getDmKey(user.id);
                      const msgs = dmThreads[key] || [];
                      return (
                        <div key={user.id} className="group relative">
                          <button
                            onClick={() => { setActiveChat('dm'); setActiveDmUser(user); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all ${activeDmUser?.id === user.id ? 'bg-purple-900/30 border-r-2 border-purple-500' : 'hover:bg-purple-950/20'}`}>
                            <div className="relative shrink-0">
                              <div className="w-7 h-7 rounded-full bg-purple-700/40 flex items-center justify-center text-xs font-bold text-white border border-purple-500/20">
                                {user.full_name[0]}
                              </div>
                              {onlineUsers.includes(user.id) && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0c0818]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white truncate">{user.full_name}</div>
                              <div className="text-[9px] text-purple-400 truncate">{user.role}</div>
                            </div>
                            {msgs.length > 0 && (
                              <span className="w-4 h-4 rounded-full bg-purple-600 text-[9px] text-white flex items-center justify-center font-bold shrink-0">
                                {Math.min(msgs.length, 9)}
                              </span>
                            )}
                          </button>
                          {['admin', 'super_admin'].includes(currentUser?.role) && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (confirm(`Delete all chats with ${user.full_name}?`)) {
                                  const k = getDmKey(user.id);
                                  supabase.from('dm_messages').delete().eq('thread_key', k).then(() => {
                                    setDmThreads(prev => { const n = {...prev}; delete n[k]; return n; });
                                    if (activeDmUser?.id === user.id) setActiveDmUser(null);
                                  });
                                }
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-red-900/50 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-900/70 transition-all">
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Header */}
                  <div className="px-5 py-3.5 border-b border-purple-500/10 flex items-center gap-3 shrink-0">
                    {activeChat === 'group' ? (
                      <>
                        <Hash size={16} className="text-purple-400" />
                        <div>
                          <span className="text-sm font-bold text-white">Team General</span>
                          <span className="text-[10px] text-purple-400 ml-2">{orgUsers.length} members</span>
                        </div>
                      </>
                    ) : activeDmUser ? (
                      <>
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-purple-700/50 flex items-center justify-center text-sm font-bold text-white border border-purple-500/30">
                            {activeDmUser.full_name[0]}
                          </div>
                          {onlineUsers.includes(activeDmUser.id) && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0c0818]" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white">{activeDmUser.full_name}</span>
                          <span className="text-[10px] text-purple-400 ml-2">{activeDmUser.domain || activeDmUser.role}</span>
                        </div>
                        {activeMeetings.some(m => m.host_id === currentUser.id) && (
                          <button onClick={() => {
                            const myMeet = activeMeetings.find(m => m.host_id === currentUser.id);
                            if (myMeet) {
                              const key = getDmKey(activeDmUser.id);
                              const msgText = `📹 Join my meeting: "${myMeet.title}" | ID: ${myMeet.meeting_id} | Code: ${myMeet.passcode} | [MEET_ID:${myMeet.id}]`;
                              const msgId = genId('msg');
                              const msgTime = now();
                              // Save to DB
                              supabase.from('dm_messages').insert({
                                id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name,
                                text: msgText, msg_time: msgTime
                              }).then(() => {});
                              // Update local state immediately
                              setDmThreads(prev => ({ ...prev, [key]: [...(prev[key] || []), { id: msgId, from: currentUser.id, fromName: currentUser.full_name, text: msgText, time: msgTime }] }));
                              // Also save invite record
                              setMeetingInvites(prev => {
                                const ex = prev.find(inv => inv.meetingId === myMeet.id);
                                if (ex) return prev.map(inv => inv.meetingId === myMeet.id ? { ...inv, invitees: [...new Set([...inv.invitees, activeDmUser.id])] } : inv);
                                return [...prev, { meetingId: myMeet.id, invitees: [activeDmUser.id] }];
                              });
                              addNotification(`Meeting invite sent to ${activeDmUser.full_name} via DM.`, 'success');
                            }
                          }}
                          className="ml-auto px-3 py-1.5 bg-purple-900/50 border border-purple-500/30 text-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                            <Send size={11} /> Send Meeting Link
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {(() => {
                      const msgs = activeChat === 'group'
                        ? groupMessages
                        : activeDmUser ? (dmThreads[getDmKey(activeDmUser.id)] || []) : [];
                      if (msgs.length === 0) return (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare size={32} className="text-purple-700 mb-3" />
                          <p className="text-xs text-purple-500">No messages yet. Say hello!</p>
                        </div>
                      );
                      return msgs.filter(m => !(m.deletedFor && m.deletedFor.includes(currentUser.id))).map(msg => {
                        const isMine = msg.from === currentUser.id;
                        const canDeleteEveryone = isMine || (currentUser.role === 'super_admin' && activeChat === 'group');
                        return (
                          <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <div className="w-7 h-7 rounded-full bg-purple-700/40 flex items-center justify-center text-xs font-bold text-white border border-purple-500/20 shrink-0">
                              {(msg.fromName || 'S')[0]}
                            </div>
                            <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1 group/msg`}>
                              <div className="flex items-center gap-2">
                                <div className="relative group/del opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                  <button className="text-purple-500/50 hover:text-purple-300 transition-colors p-1" title="Options">
                                    <Edit3 size={12} />
                                  </button>
                                  <div className={`absolute top-full mt-1 ${isMine ? 'right-0' : 'left-0'} hidden group-hover/del:flex flex-col bg-[#1a0e2a] border border-purple-500/30 rounded-lg p-1 z-50 w-36 shadow-xl`}>
                                    <div className="flex gap-2 justify-center p-1 border-b border-purple-500/20 mb-1">
                                      {['👍', '❤️', '😂', '🔥', '👀'].map(emoji => (
                                        <button key={emoji} onClick={() => handleReactMessage(msg, emoji)} className="hover:scale-125 transition-transform text-sm">{emoji}</button>
                                      ))}
                                    </div>
                                    <button onClick={() => handleDeleteMessage(msg, activeChat, 'me')} className="text-[10px] text-left px-2 py-1.5 hover:bg-purple-900/40 rounded text-purple-200">Delete for Me</button>
                                    {canDeleteEveryone && (
                                       <button onClick={() => handleDeleteMessage(msg, activeChat, 'everyone')} className="text-[10px] text-left px-2 py-1.5 hover:bg-red-900/40 rounded text-red-400">Delete for Everyone</button>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[9px] text-purple-400">{msg.fromName} · {msg.time}</span>
                              </div>
                              <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                msg.type === 'meeting_invite' || msg.text.includes('[MEET_ID:')
                                  ? 'bg-purple-900/60 border border-purple-500/40 text-purple-100'
                                  : isMine
                                    ? 'accent-gradient text-white'
                                    : 'bg-[#150e25] border border-purple-500/15 text-white'
                              }`}>
                                {renderTextWithLinks(msg.text.replace(/ \| \[MEET_ID:.*\]/, ''))}
                                {(msg.attachmentUrl && msg.attachmentUrl !== 'file_placeholder') && (
                                  <div className="mt-2">
                                    {(() => {
                                      const url = msg.attachmentUrl;
                                      const isImg = msg.fileName ? /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i.test(msg.fileName) : /\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i.test(url);
                                      if (isImg) {
                                        return <img src={url} alt="attachment" className="max-w-[200px] rounded border border-purple-500/30 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxImage(url)} loading="lazy" onError={e => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex'); }} />;
                                      }
                                      let displayName = msg.fileName || 'Document';
                                      if (!msg.fileName) {
                                        try {
                                          const urlObj = new URL(url);
                                          const parts = urlObj.pathname.split('/');
                                          const lastSeg = decodeURIComponent(parts.pop() || '');
                                          const nameParts = lastSeg.split('_');
                                          displayName = nameParts.length > 2 ? nameParts.slice(2).join('_') : lastSeg || 'Document';
                                        } catch(e) { displayName = 'Document'; }
                                      }
                                      const sizeStr = msg.fileSize ? (msg.fileSize > 1024*1024 ? (msg.fileSize/(1024*1024)).toFixed(1)+' MB' : Math.round(msg.fileSize/1024)+' KB') : '';
                                      
                                      let finalUrl = url;
                                      if (url.includes('supabase.co')) {
                                        finalUrl = url + (url.includes('?') ? '&' : '?') + 'download=';
                                      }

                                      return (
                                        <a href={finalUrl} download={displayName} className="flex items-center gap-3 bg-[#2a1b38] hover:bg-[#342245] p-3 rounded-xl border border-purple-500/20 transition-colors w-64 max-w-full mt-1">
                                          <div className="w-10 h-10 shrink-0 rounded-lg bg-purple-900/50 flex items-center justify-center text-purple-300">
                                            <FileText size={20} />
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-purple-100 truncate">{displayName}</span>
                                            {sizeStr && <span className="text-[10px] text-purple-300/70">{sizeStr}</span>}
                                            <span className="text-[10px] text-purple-300/70 mt-0.5">Click to download</span>
                                          </div>
                                        </a>
                                      );
                                    })()}
                                  </div>
                                )}
                                {msg.audioUrl && (
                                  <div className="mt-2">
                                    <audio controls src={msg.audioUrl} className="h-8 w-48" />
                                  </div>
                                )}
                                {(msg.type === 'meeting_invite' || msg.text.includes('[MEET_ID:')) && (
                                  <button onClick={() => {
                                    const meetIdMatch = msg.text.match(/\[MEET_ID:(.*?)\]/);
                                    const targetMeetId = meetIdMatch ? meetIdMatch[1] : msg.meetingId;
                                    const meet = activeMeetings.find(m => m.id === targetMeetId);
                                    if (meet) { setPreMeetingMeet(meet); setPreMeetingChecklist({ micOn: false, camOn: false }); }
                                    else addNotification('Meeting may have ended.', 'warning');
                                  }} className="block mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white w-full text-center">
                                    Join Meeting →
                                  </button>
                                )}
                              </div>
                              {/* Reactions */}
                              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className={`flex gap-1 -mt-2 z-10 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                    <button key={emoji} onClick={(e) => setReactionModalData({ msgId: msg.id, reactions: msg.reactions || {}, x: e.clientX, y: e.clientY })} title="View Reactions" className={`text-[10px] px-1.5 py-0.5 rounded-full border ${userIds.includes(currentUser.id) ? 'bg-purple-900/60 border-purple-500' : 'bg-[#150e25] border-purple-500/30'} hover:bg-purple-800 transition-colors`}>
                                      {emoji} {userIds.length > 1 && <span className="text-purple-300 ml-0.5">{userIds.length}</span>}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-purple-500/10 shrink-0">
                    {isRecordingAudio ? (
                      <div className="flex items-center gap-3 bg-[#11081c] border border-purple-500/20 rounded-xl px-4 py-2 w-full">
                        <button type="button" onClick={() => { audioDiscardRef.current = true; audioShouldSendRef.current = false; stopRecording(); }} className="p-2 rounded-full text-red-400 hover:bg-red-900/30 transition-colors">
                          <Trash2 size={18} />
                        </button>
                        <div className="flex-1 flex items-center justify-center gap-3">
                           <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                           <span className="text-red-400 text-xs font-medium tracking-wider">Recording...</span>
                           <div className="flex items-end gap-1 h-5 ml-2">
                             {[1, 2, 3, 2, 1, 3, 2, 4, 2, 1].map((h, i) => (
                               <div key={i} className="w-1 bg-purple-500 rounded-full animate-pulse" style={{height: `${h*25}%`, animationDelay: `${i*100}ms`}}></div>
                             ))}
                           </div>
                        </div>
                        <button type="button" disabled={isSendingChat} onClick={() => { audioShouldSendRef.current = true; stopRecording(); }} className="p-2.5 rounded-full accent-gradient hover:opacity-90 transition-all text-white shadow-lg shadow-purple-500/20">
                          {isSendingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                        <div className="flex gap-1 mb-1">
                          <label className="cursor-pointer p-2 rounded-xl text-purple-400 hover:bg-purple-900/30 hover:text-white transition-colors group relative" title="Attach File">
                            <Pin size={18} />
                            <input type="file" multiple className="hidden" onChange={e => { setAttachmentFiles(Array.from(e.target.files)); setAttachmentSource('file'); }} />
                          </label>
                          <label className="cursor-pointer p-2 rounded-xl text-purple-400 hover:bg-purple-900/30 hover:text-white transition-colors group relative" title="Gallery">
                            <ImageIcon size={18} />
                            <input type="file" multiple accept="image/*" className="hidden" onChange={e => { setAttachmentFiles(Array.from(e.target.files)); setAttachmentSource('gallery'); }} />
                          </label>
                          <button type="button" onClick={() => setIsCameraOpen(true)} className="cursor-pointer p-2 rounded-xl text-purple-400 hover:bg-purple-900/30 hover:text-white transition-colors group relative" title="Camera">
                            <Camera size={18} />
                          </button>
                        </div>
                        <div className="flex-1 relative">
                          {(attachmentFiles.length > 0 || audioBlob) && (
                            <div className="absolute -top-14 left-0 right-0 bg-[#150e25] p-2 rounded-lg border border-purple-500/30 flex justify-between items-center z-10 shadow-lg overflow-x-auto gap-2">
                               <div className="flex gap-2 items-center flex-nowrap">
                               {attachmentFiles.map((f, i) => (
                                 f.type.startsWith('image/') ? 
                                  <img key={i} src={URL.createObjectURL(f)} alt="preview" className="h-10 max-w-[100px] object-cover rounded border border-purple-500/50 cursor-pointer hover:opacity-80 shrink-0" onClick={() => setLightboxImage(URL.createObjectURL(f))} title="Click to view full size" />
                                 : <span key={i} className="text-xs text-purple-300 flex items-center gap-1 shrink-0"><FileText size={14}/> {f.name}</span>
                               ))}
                               </div>
                               {audioBlob ? (
                                  <span className="text-xs text-purple-300 flex items-center gap-1 shrink-0"><Mic size={14}/> Audio Note ready to send</span>
                               ) : null}
                               <button type="button" onClick={() => { setAttachmentFiles([]); setAudioBlob(null); }} className="p-1 text-red-400 hover:bg-red-500/20 rounded-full transition-colors shrink-0 ml-auto"><X size={14}/></button>
                            </div>
                          )}
                          <input type="text" placeholder={`Message ${activeChat === 'group' ? '#team-general' : activeDmUser?.full_name || '...'}`}
                            value={chatInput} onChange={e => setChatInput(e.target.value)}
                            className="w-full bg-[#11081c] border border-purple-500/20 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                        </div>
                        <div className="flex gap-2 mb-1">
                          <button type="button" onClick={toggleDictation} className={`p-2.5 rounded-full transition-colors ${isDictating ? 'text-green-400 bg-green-900/30 animate-pulse' : 'bg-purple-900/30 text-purple-300 hover:text-green-400 hover:bg-green-900/30'}`} title="Speech to Text">
                            <Type size={18} />
                          </button>
                          <button type="button" onClick={() => { audioShouldSendRef.current = false; startRecording(); }} className="p-2.5 rounded-full bg-purple-900/30 text-purple-300 hover:bg-purple-900/60 hover:text-white transition-colors">
                            <Mic size={18} />
                          </button>
                          <button type="submit" disabled={isSendingChat} className={`p-2.5 rounded-full text-white font-bold transition-all flex items-center justify-center ${isSendingChat ? 'bg-purple-800 opacity-70' : 'accent-gradient hover:opacity-90 shadow-lg shadow-purple-500/20'}`}>
                            {isSendingChat ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} 
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ DASHBOARD ═══════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* ADMIN QUICK VIEW */}
              {['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Members', value: orgUsers.length, icon: <Users size={16} />, sub: `${orgUsers.filter(u => u.role === 'worker').length} workers, ${orgUsers.filter(u => u.role === 'client').length} clients` },
                    { label: 'Online Now', value: orgUsers.filter(u => onlineUsers.includes(u.id)).length, icon: <Activity size={16} />, sub: 'Active sessions' },
                    { label: 'Live Meetings', value: orgMeetings.length, icon: <Video size={16} />, sub: 'Active channels' },
                    { label: 'Tasks Active', value: tasks.filter(t => t.status !== 'done').length, icon: <Clock size={16} />, sub: `${tasks.filter(t => t.status === 'done').length} completed` },
                  ].map(s => (
                    <div key={s.label} className="glass-panel p-4 rounded-2xl border border-purple-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-400">{s.icon}</span>
                        <span className="text-2xl font-bold text-white">{s.value}</span>
                      </div>
                      <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wide">{s.label}</div>
                      <div className="text-[10px] text-purple-600 mt-0.5">{s.sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* CLIENT VIEW */}
              {currentUser.role === 'client' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20">
                      <div className="flex items-center gap-2 mb-2"><Star size={16} className="text-yellow-400" /><h3 className="font-bold text-white text-sm">Project Status</h3></div>
                      <div className="text-3xl font-bold text-yellow-400 mt-2">Active</div>
                      <p className="text-xs text-yellow-200/50 mt-1">Your project is on track.</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2"><CreditCard size={16} className="text-blue-400" /><h3 className="font-bold text-white text-sm">Outstanding Balance</h3></div>
                      <div className="text-3xl font-bold text-blue-400 mt-2">PKR 0</div>
                      <p className="text-xs text-blue-200/50 mt-1">All invoices paid.</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-emerald-400" /><h3 className="font-bold text-white text-sm">Completed Tasks</h3></div>
                      <div className="text-3xl font-bold text-emerald-400 mt-2">{tasks.filter(t => t.status === 'done').length}</div>
                      <p className="text-xs text-emerald-200/50 mt-1">Tasks delivered successfully.</p>
                    </div>
                  </div>
                  
                  <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                    <h3 className="text-sm font-bold text-white mb-4">Recent Updates</h3>
                    {tasks.filter(t => t.status === 'done').slice(0, 5).map(t => (
                      <div key={t.id} className="flex justify-between items-center py-2 border-b border-purple-500/10 last:border-0">
                        <span className="text-xs text-white">{t.title}</span>
                        <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 bg-emerald-900/20 rounded-md">Completed</span>
                      </div>
                    ))}
                    {tasks.filter(t => t.status === 'done').length === 0 && <div className="text-xs text-white/50">No updates yet.</div>}
                  </div>
                </div>
              )}

              {/* FACTORY MANAGER VIEW */}
              {currentUser.role === 'manager' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-5 rounded-2xl border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2"><Factory size={16} className="text-purple-400" /><h3 className="font-bold text-white text-sm">Active Lines</h3></div>
                      <div className="text-3xl font-bold text-purple-400 mt-2">4 / 5</div>
                      <p className="text-xs text-purple-200/50 mt-1">Production lines operational.</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-emerald-400" /><h3 className="font-bold text-white text-sm">Shift Workers</h3></div>
                      <div className="text-3xl font-bold text-emerald-400 mt-2">{orgUsers.filter(u => onlineUsers.includes(u.id)).length}</div>
                      <p className="text-xs text-emerald-200/50 mt-1">Workers clocked in today.</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-blue-400" /><h3 className="font-bold text-white text-sm">Daily Output</h3></div>
                      <div className="text-3xl font-bold text-blue-400 mt-2">92%</div>
                      <p className="text-xs text-blue-200/50 mt-1">Efficiency target reached.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* WORKER VIEW */}
              {currentUser.role === 'worker' && (
                <div className="space-y-5">
                  {!currentUser.category ? (
                    <div className="glass-panel-glow p-6 rounded-2xl border border-[#9333ea]/30">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="text-purple-400" size={18} />
                        <h3 className="text-sm font-bold text-white">AI-Powered Profile Setup</h3>
                      </div>
                      <p className="text-xs text-purple-200 mb-4">Enter your skills and bio. AuraSuite AI will classify you into Tier A, B, or C and assign your domain automatically.</p>
                      <form onSubmit={handleOnboarding} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Skills (comma separated)</label>
                          <input type="text" value={onboardSkills} onChange={e => setOnboardSkills(e.target.value)}
                            className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" required />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase font-bold text-purple-300 block mb-1">Bio / Description</label>
                          <input type="text" value={onboardBio} onChange={e => setOnboardBio(e.target.value)}
                            className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" required />
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                          <button type="submit" disabled={onboardLoading}
                            className="px-5 py-2 rounded-xl accent-gradient text-xs font-bold text-white glow-btn">
                            {onboardLoading ? 'AI Analyzing...' : 'Analyze & Tag Profile'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Award size={16} className="text-purple-400" />
                        <h3 className="text-sm font-bold text-white">Your AI Profile</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-[#0f0b18] rounded-xl border border-purple-500/10">
                          <span className="text-[9px] text-purple-400 uppercase font-bold block mb-1">AI Category</span>
                          <div className="text-xl font-bold text-white">Tier {currentUser.category}</div>
                        </div>
                        <div className="p-3 bg-[#0f0b18] rounded-xl border border-purple-500/10">
                          <span className="text-[9px] text-purple-400 uppercase font-bold block mb-1">Domain</span>
                          <div className="text-sm font-bold text-purple-200">{currentUser.domain}</div>
                        </div>
                        <div className="p-3 bg-[#0f0b18] rounded-xl border border-purple-500/10">
                          <span className="text-[9px] text-purple-400 uppercase font-bold block mb-1">Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {(currentUser.skills || []).slice(0, 3).map(sk => (
                              <span key={sk} className="px-1.5 py-0.5 bg-purple-950/50 border border-purple-500/10 text-[9px] text-purple-300 rounded">{sk}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kanban */}
                  {activeOrg.type === 'software_house' && (
                    <div className="glass-panel p-5 rounded-2xl border border-purple-500/10 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white">Task Kanban Board</h3>
                        <button onClick={() => {
                          const title = prompt('Task title:');
                          if (title) setTasks(prev => [...prev, {
                            id: genId('task'), project_id: 'proj-1', title, description: 'Custom task.',
                            status: 'todo', complexity: 'medium', hours_spent: 4,
                            suggested_payout: 0, final_payout: 0, payout_approved: false
                          }]);
                        }} className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/20 text-[10px] text-purple-300 font-bold rounded-lg">
                          + Add Task
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: 'todo', label: 'Backlog', next: 'in_progress', nextLabel: 'Start →', color: 'text-purple-400' },
                          { key: 'in_progress', label: 'In Progress', next: 'done', nextLabel: 'Complete →', color: 'text-blue-400' },
                          { key: 'done', label: 'Completed', next: null, nextLabel: null, color: 'text-emerald-400' },
                        ].map(col => (
                          <div key={col.key} className="bg-[#0f0a1b] p-4 rounded-2xl border border-purple-500/5 space-y-3">
                            <div className="border-b border-purple-500/10 pb-2 flex justify-between items-center">
                              <span className={`text-[10px] uppercase font-bold ${col.color}`}>{col.label}</span>
                              <span className="text-xs text-purple-300 font-bold">{tasks.filter(t => t.status === col.key).length}</span>
                            </div>
                            <div className="space-y-2">
                              {tasks.filter(t => t.status === col.key).map(t => (
                                <div key={t.id} className={`p-3 rounded-xl border ${col.key === 'done' ? 'bg-[#161122] border-emerald-500/20' : 'bg-[#161122] border-purple-500/10'}`}>
                                  <div className="text-xs font-bold text-white flex items-center justify-between">
                                    {t.title}
                                    {col.key === 'done' && <CheckCircle size={12} className="text-emerald-400" />}
                                  </div>
                                  <p className="text-[9px] text-purple-400 mt-1 truncate">{t.description}</p>
                                  {t.payout_approved && <span className="text-[9px] text-emerald-400 font-bold block mt-1.5">Rs. {t.final_payout.toLocaleString()}</span>}
                                  {col.next && (
                                    <button onClick={() => handleMoveTask(t.id, col.next)}
                                      className="text-[9px] text-purple-400 hover:text-white mt-2 block font-bold">
                                      {col.nextLabel}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CLIENT VIEW */}
              {currentUser.role === 'client' && (
                <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                  <h3 className="text-sm font-bold text-white mb-4">Project Progress</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'SaaS Layout Framework', pct: 80 },
                      { name: 'Agora SDK Integration', pct: 100 },
                      { name: 'AI Profiling Engine', pct: 65 },
                    ].map(p => (
                      <div key={p.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white">{p.name}</span>
                          <span className={`font-bold ${p.pct === 100 ? 'text-emerald-400' : 'text-purple-400'}`}>{p.pct}%</span>
                        </div>
                        <div className="w-full bg-[#120a1f] h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${p.pct === 100 ? 'bg-emerald-500' : 'accent-gradient'}`} style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ SCHEDULES TAB ═══════ */}
          {activeTab === 'schedules' && (
            <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white">Schedule & Deadlines</h3>
              </div>
              {['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const title = e.target.title.value;
                  const time = e.target.time.value;
                  if (!title || !time) return;
                  setSchedules(prev => [...prev, { id: genId('sched'), title, time, color: 'border-purple-500' }]);
                  e.target.reset();
                }} className="mb-4 flex gap-2">
                  <input name="title" placeholder="Event Title" className="flex-1 bg-purple-950/20 border border-purple-500/20 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" />
                  <input name="time" type="datetime-local" className="bg-purple-950/20 border border-purple-500/20 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">Add</button>
                </form>
              )}
              <div className="space-y-3">
                {schedules.length === 0 ? <p className="text-xs text-purple-500">No schedules set.</p> : schedules.map(ev => (
                  <div key={ev.id} className={`p-3 bg-[#11081c] border-l-4 ${ev.color} rounded-xl flex justify-between items-center`}>
                    <div>
                      <div className="text-xs font-bold text-white">{ev.title}</div>
                      <div className="text-[10px] text-purple-400 mt-0.5">{new Date(ev.time).toLocaleString()}</div>
                    </div>
                    {['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) && (
                      <button onClick={() => setSchedules(prev => prev.filter(s => s.id !== ev.id))} className="text-red-400 hover:text-red-300 text-xs p-1">Delete</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ FINANCIALS TAB ═══════ */}
          {activeTab === 'financials' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Budget Pool', val: `Rs. ${orgBudget.toLocaleString()}`, color: 'text-white' },
                  { label: 'Approved Payouts', val: `Rs. ${tasks.filter(t => t.payout_approved).reduce((s, t) => s + t.final_payout, 0).toLocaleString()}`, color: 'text-emerald-400' },
                  { label: 'Pending Approvals', val: `${tasks.filter(t => !t.payout_approved && t.status !== 'done').length} tasks`, color: 'text-yellow-400' },
                ].map(s => (
                  <div key={s.label} className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                    <span className="text-[10px] text-purple-400 uppercase font-bold block mb-1">{s.label}</span>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  </div>
                ))}
              </div>

              {['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const val = parseInt(e.target.budget.value);
                  if (!isNaN(val)) setOrgBudget(val);
                  e.target.reset();
                }} className="glass-panel p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-bold">Update Budget:</span>
                  <input name="budget" type="number" placeholder="Enter new budget amount..." className="flex-1 bg-emerald-950/20 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/60" />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">Save Budget</button>
                </form>
              )}
              <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                <h4 className="text-xs uppercase font-bold text-purple-400 tracking-wide mb-4">Payout Audit Log</h4>
                {tasks.filter(t => t.payout_approved).length === 0 ? (
                  <p className="text-xs text-purple-500">No approved payouts yet.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.filter(t => t.payout_approved).map(t => (
                      <div key={t.id} className="p-3 bg-[#0f0b18] border border-purple-500/5 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="text-xs font-bold text-white">{t.title}</div>
                          <div className="text-[10px] text-purple-400">Task ID: {t.id}</div>
                        </div>
                        <span className="font-bold text-emerald-400 text-sm">Rs. {t.final_payout.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ SETTINGS TAB ═══════ */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-5 rounded-2xl border border-purple-500/10 space-y-5 max-w-lg">
              <h3 className="text-sm font-bold text-white">Workspace Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-purple-300 block mb-1">Organization Name</label>
                  <input type="text" value={activeOrg.name} disabled
                    className="w-full bg-[#11081c] border border-purple-500/10 rounded-xl p-2 text-xs text-purple-400" />
                </div>
                <div>
                  <label className="text-xs text-purple-300 block mb-1">Agora App ID</label>
                  <input type="text" placeholder="Enter Agora App ID"
                    className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-purple-300 block mb-1">Supabase URL</label>
                  <input type="text" placeholder="https://xxxx.supabase.co"
                    className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" />
                </div>
                <button onClick={() => addNotification('Settings saved successfully.', 'success')}
                  className="px-5 py-2 rounded-xl accent-gradient text-xs font-bold text-white glow-btn">
                  Save Settings
                </button>
                
                <div className="mt-8 pt-6 border-t border-purple-500/10">
                  <h4 className="text-sm font-bold text-white mb-4">Security Settings</h4>
                  <div className="space-y-3">
                    <label className="text-xs text-purple-300 block mb-1">Update Password</label>
                    <input type="password" placeholder="New Password" value={passwordChangeNew} onChange={e => setPasswordChangeNew(e.target.value)}
                      className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" />
                    <button onClick={handleChangePasswordSettings} className="px-5 py-2 rounded-xl accent-gradient text-xs font-bold text-white glow-btn">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

      {confirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[200] p-4">
          <div className="bg-[#11081c] border border-purple-500/30 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            <h3 className="text-lg font-bold text-white mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-purple-200 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs font-bold text-purple-300 hover:bg-purple-900/40">Cancel</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]">Confirm</button>
            </div>
          </div>
        </div>
      )}

        </div>
      </main>
    
      {lightboxImage && (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-full max-h-full flex flex-col items-center">
            <button 
              className="fixed top-6 right-6 sm:top-10 sm:right-10 text-white hover:text-red-400 bg-white/10 hover:bg-white/20 transition-all rounded-full p-3 z-[100000]"
              onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img 
              src={lightboxImage} 
              alt="Enlarged view" 
              className="max-w-[80vw] max-h-[75vh] object-contain rounded-lg shadow-[0_0_50px_rgba(168,85,247,0.2)] border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Provide a distinct download button just in case, though the image itself is visible */}
            <a href={lightboxImage + (lightboxImage.includes('?') ? '&' : '?') + 'download='} download className="mt-4 px-4 py-2 bg-purple-600/50 hover:bg-purple-600/80 border border-purple-500/50 rounded-xl text-white text-sm font-medium transition-colors" onClick={e => e.stopPropagation()}>
              Open / Download
            </a>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden mb-6 border border-purple-500/30">
            <video ref={cameraVideoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => {
              if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
              setIsCameraOpen(false);
            }} className="px-6 py-3 rounded-xl bg-purple-900/40 text-white font-medium hover:bg-purple-900/60 border border-purple-500/30 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={() => {
              if (!cameraVideoRef.current) return;
              const canvas = document.createElement('canvas');
              canvas.width = cameraVideoRef.current.videoWidth;
              canvas.height = cameraVideoRef.current.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(cameraVideoRef.current, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(blob => {
                if (blob) {
                  const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                  setAttachmentFiles([file]);
                }
                if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
                setIsCameraOpen(false);
              }, 'image/jpeg', 0.9);
            }} className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center gap-2">
              <Camera size={20} /> Capture
            </button>
          </div>
        </div>
      )}
        {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden mb-6 border border-purple-500/30">
            <video ref={cameraVideoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => {
              if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
              setIsCameraOpen(false);
            }} className="px-6 py-3 rounded-xl bg-purple-900/40 text-white font-medium hover:bg-purple-900/60 border border-purple-500/30 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={() => {
              if (!cameraVideoRef.current) return;
              const canvas = document.createElement('canvas');
              canvas.width = cameraVideoRef.current.videoWidth;
              canvas.height = cameraVideoRef.current.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(cameraVideoRef.current, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(blob => {
                if (blob) {
                  const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                  setAttachmentFiles([file]);
                }
                if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
                setIsCameraOpen(false);
              }, 'image/jpeg', 0.9);
            }} className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center gap-2">
              <Camera size={20} /> Capture
            </button>
          </div>
        </div>
      )}

      {reactionModalData && (
        <div className="fixed inset-0 z-[100] bg-black/10" onClick={() => setReactionModalData(null)}>
          <div 
            className="absolute bg-[#11081c] border border-purple-500/30 rounded-xl w-80 max-h-[80vh] overflow-y-auto p-4 shadow-2xl" 
            style={{ 
              top: Math.min(window.innerHeight - 320, Math.max(10, (reactionModalData.y || window.innerHeight/2) + 35)) + 'px', 
              left: Math.min(window.innerWidth - 330, Math.max(10, (reactionModalData.x || window.innerWidth/2) - 160)) + 'px',
              maxHeight: '300px'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Reactions</h3>
              <button onClick={() => setReactionModalData(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-3">
              {Object.entries(reactionModalData.reactions).map(([emoji, users]) => 
                  users.map(uid => {
                    const user = orgUsers?.find(u => u.id === uid);
                    const isMe = uid === currentUser?.id;
                    return (
                      <div key={`${emoji}-${uid}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-xl">
                            {emoji}
                          </div>
                          <span className="text-sm text-gray-200">{isMe ? 'You' : (user?.full_name || 'Unknown')}</span>
                        </div>
                        {isMe && (
                          <button onClick={() => { handleReactMessage({ id: reactionModalData.msgId, reactions: reactionModalData.reactions }, emoji); setReactionModalData(null); }} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-1 transition-colors">
                            Tap to remove
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
