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
      const lowerTarget = target?.toLowerCase().trim();
      if (lowerTarget === 'notepad') {
        try {
          const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
          if (localAppData) {
            const tabState = path.join(localAppData, 'Packages', 'Microsoft.WindowsNotepad_8wekyb3d8bbwe', 'LocalState', 'TabState');
            const winState = path.join(localAppData, 'Packages', 'Microsoft.WindowsNotepad_8wekyb3d8bbwe', 'LocalState', 'WindowState');
            if (fs.existsSync(tabState)) fs.rmSync(tabState, { recursive: true, force: true });
            if (fs.existsSync(winState)) fs.rmSync(winState, { recursive: true, force: true });
          }
        } catch (e) {}
        return new Promise((resolve) => {
          exec('cmd.exe /c taskkill /F /IM notepad.exe 2>nul & start "" notepad', (err) => {
            if (err) {
              resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
            } else {
              resolve(NextResponse.json({ success: true, message: 'Launched notepad successfully' }));
            }
          });
        });
      }

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

      const cmd = appMap[lowerTarget] || `cmd.exe /c start "" ${target}`;
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

    // 1.5 Close local Windows application
    if (action === 'close_app') {
      const processMap = {
        calc: ['CalculatorApp.exe', 'calc.exe'],
        calculator: ['CalculatorApp.exe', 'calc.exe'],
        notepad: ['notepad.exe'],
        paint: ['mspaint.exe'],
        mspaint: ['mspaint.exe'],
        chrome: ['chrome.exe'],
        browser: ['chrome.exe', 'msedge.exe'],
        explorer: ['explorer.exe']
      };
      const targets = processMap[target?.toLowerCase()] || [`${target}.exe`];
      const killCmd = targets.map(t => `taskkill /F /IM ${t} 2>nul`).join(' & ');
      return new Promise((resolve) => {
        exec(`cmd.exe /c "${killCmd}"`, () => {
          resolve(NextResponse.json({ success: true, message: `Closed ${target} successfully` }));
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
