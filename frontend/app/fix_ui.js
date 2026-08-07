const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix the preview box
    content = content.replace(
        /<span className="text-xs text-purple-300">\s*\{attachmentFile \? `Attachment: \$\{attachmentFile.name\}` : 'Audio Note recorded'\}\s*<\/span>/,
        `{attachmentFile && attachmentFile.type.startsWith('image/') ? (
          <img src={URL.createObjectURL(attachmentFile)} alt="preview" className="h-12 max-w-[100px] object-contain rounded border border-purple-500/50" />
        ) : attachmentFile ? (
          <span className="text-xs text-purple-300 flex items-center gap-1"><Paperclip size={14}/> {attachmentFile.name}</span>
        ) : audioBlob ? (
          <span className="text-xs text-purple-300 flex items-center gap-1"><Mic size={14}/> Audio Note recorded</span>
        ) : null}`
    );

    // Fix regex for images
    content = content.replace(
        /msg\.attachmentUrl\.match\(\/\\.\(jpeg\|jpg\|gif\|png\)\$\/\)/g,
        "msg.attachmentUrl.match(/\\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i)"
    );

    // Add extra logging for microphone to help user debug
    content = content.replace(
        /alert\("Microphone access denied or unavailable."\);/g,
        "alert(`Microphone error: ${err.name}. If 'NotReadableError', close other tabs using the mic!`);"
    );

    fs.writeFileSync(file, content);
}

fixFile('dashboard/page.js');
fixFile('login/page.js');
console.log('Fixed UI in both files.');
