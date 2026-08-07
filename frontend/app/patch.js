const fs = require('fs');
const dashboard = fs.readFileSync('dashboard/page.js', 'utf8');
const login = fs.readFileSync('login/page.js', 'utf8');

const handleSendStart = dashboard.indexOf('const handleSendMessage =');
let idx = handleSendStart;
let braceCount = 0;
let started = false;
while(idx < dashboard.length) {
    if(dashboard[idx] === '{') { braceCount++; started=true; }
    else if(dashboard[idx] === '}') { braceCount--; }
    idx++;
    if(started && braceCount === 0) break;
}
const handleSendBlockDashboard = dashboard.substring(handleSendStart, idx);

const handleSendStartL = login.indexOf('const handleSendMessage =');
idx = handleSendStartL;
braceCount = 0;
started = false;
while(idx < login.length) {
    if(login[idx] === '{') { braceCount++; started=true; }
    else if(login[idx] === '}') { braceCount--; }
    idx++;
    if(started && braceCount === 0) break;
}
const handleSendBlockLogin = login.substring(handleSendStartL, idx);

const extrasRegex = /(const (handleDeleteMessage|handleReactMessage|startRecording|stopRecording) =[\s\S]*?\n  };)/g;
let extras = '';
let match;
while((match = extrasRegex.exec(dashboard)) !== null) {
    extras += match[1] + '\n\n';
}

const chatStart = dashboard.indexOf('{activeTab === \'chat\'');
idx = chatStart;
braceCount = 0;
started = false;
while(idx < dashboard.length) {
    if(dashboard.slice(idx, idx+2) === '({') { braceCount++; started=true; idx+=2; continue; }
    if(dashboard.slice(idx, idx+2) === '})') { braceCount--; idx+=2; if(started && braceCount===0) break; continue;}
    if(dashboard[idx] === '{') { braceCount++; started=true; }
    else if(dashboard[idx] === '}') { braceCount--; }
    idx++;
    if(started && braceCount === 0) break;
}
const chatBlockDashboard = dashboard.substring(chatStart, idx);

const chatStartL = login.indexOf('{activeTab === \'chat\'');
idx = chatStartL;
braceCount = 0;
started = false;
while(idx < login.length) {
    if(login.slice(idx, idx+2) === '({') { braceCount++; started=true; idx+=2; continue; }
    if(login.slice(idx, idx+2) === '})') { braceCount--; idx+=2; if(started && braceCount===0) break; continue;}
    if(login[idx] === '{') { braceCount++; started=true; }
    else if(login[idx] === '}') { braceCount--; }
    idx++;
    if(started && braceCount === 0) break;
}
const chatBlockLogin = login.substring(chatStartL, idx);

let newLogin = login;
if(!newLogin.includes('attachmentFile')) {
  newLogin = newLogin.replace(
    'const [showReactionsPanel, setShowReactionsPanel] = useState(false);',
    'const [showReactionsPanel, setShowReactionsPanel] = useState(false);\n  const [attachmentFile, setAttachmentFile] = useState(null);\n  const [audioBlob, setAudioBlob] = useState(null);\n  const [isRecordingAudio, setIsRecordingAudio] = useState(false);\n  const audioRecorderRef = useRef(null);\n  const [isSendingChat, setIsSendingChat] = useState(false);'
  );
}

newLogin = newLogin.replace(handleSendBlockLogin, handleSendBlockDashboard);

if(!newLogin.includes('handleReactMessage =')) {
   newLogin = newLogin.replace('const handleSendMessage =', extras + '\n  const handleSendMessage =');
}

newLogin = newLogin.replace(chatBlockLogin, chatBlockDashboard);

fs.writeFileSync('login/page.js', newLogin);
console.log('Replaced successfully.');

