import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request) {
  try {
    const { action, target, value } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action type is required' }, { status: 400 });
    }

    // 1. Launch local Windows application
    if (action === 'launch_app' || action === 'open_app') {
      const appMap = {
        calc: 'cmd.exe /c start "" calc',
        calculator: 'cmd.exe /c start "" calc',
        notepad: 'cmd.exe /c start "" notepad',
        paint: 'cmd.exe /c start "" mspaint',
        mspaint: 'cmd.exe /c start "" mspaint',
        chrome: 'cmd.exe /c start "" chrome',
        browser: 'cmd.exe /c start "" chrome',
        explorer: 'cmd.exe /c start "" explorer',
        files: 'cmd.exe /c start "" explorer',
        cmd: 'cmd.exe /c start "" cmd',
        powershell: 'cmd.exe /c start "" powershell'
      };

      const cmd = appMap[target?.toLowerCase()] || `cmd.exe /c start "" ${target}`;
      return new Promise((resolve) => {
        exec(cmd, (err) => {
          if (err) {
            console.warn('Execution error:', err.message);
            resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ success: true, message: `Launched ${target} successfully` }));
          }
        });
      });
    }

    // 2. Open URL
    if (action === 'open_url') {
      const url = target.startsWith('http') ? target : `https://${target}`;
      return new Promise((resolve) => {
        exec(`start "" "${url}"`, (err) => {
          if (err) {
            resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
          } else {
            resolve(NextResponse.json({ success: true, message: `Opened URL: ${url}` }));
          }
        });
      });
    }

    // 3. Write file to Desktop
    if (action === 'write_file') {
      const desktopDir = path.join(os.homedir(), 'Desktop');
      const filename = target.replace(/^[/\\]+/, '');
      const filePath = path.join(desktopDir, filename);
      fs.writeFileSync(filePath, value || '', 'utf8');
      return NextResponse.json({ success: true, message: `File created at ${filePath}` });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('System execute-action error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
