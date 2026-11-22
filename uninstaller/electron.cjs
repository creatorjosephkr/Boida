const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, exec } = require('child_process');

// ── Windows GStreamer 설치 경로 탐색 (드라이브 무관) ──────────────
function findGStreamerRootWin() {
  for (const v of ['GSTREAMER_1_0_ROOT_MSVC_X86_64', 'GSTREAMER_1_0_ROOT_MINGW_X86_64',
                    'GSTREAMER_1_0_ROOT_MSVC_X86', 'GSTREAMER_1_0_ROOT_MINGW_X86']) {
    if (process.env[v] && fs.existsSync(process.env[v])) return process.env[v];
  }
  const regKey = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment';
  for (const v of ['GSTREAMER_1_0_ROOT_MSVC_X86_64', 'GSTREAMER_1_0_ROOT_MINGW_X86_64',
                    'GSTREAMER_1_0_ROOT_MSVC_X86', 'GSTREAMER_1_0_ROOT_MINGW_X86']) {
    try {
      const out = execSync(`reg query "${regKey}" /v ${v}`, { stdio: 'pipe', timeout: 3000 }).toString();
      const m = out.match(/REG_(?:SZ|EXPAND_SZ)\s+(.+)/);
      if (m) { const p = m[1].trim(); if (fs.existsSync(p)) return p; }
    } catch {}
  }
  try {
    const drives = execSync('wmic logicaldisk get caption', { stdio: 'pipe', timeout: 3000 })
      .toString().split('\n').map(l => l.trim()).filter(l => /^[A-Z]:$/.test(l));
    for (const drive of drives) {
      for (const variant of ['msvc_x86_64', 'mingw_x86_64', 'msvc_x86', 'mingw_x86']) {
        const p = `${drive}\\gstreamer\\1.0\\${variant}`;
        if (fs.existsSync(p)) return p;
      }
    }
  } catch {}
  return null;
}

let mainWindow = null;

// ── Removal items definition ───────────────────────────────────
function getRemovalItems() {
  const home = os.homedir();
  const isWin = process.platform === 'win32';

  if (isWin) {
    return [
      {
        id: 'app',
        label: 'Boida 앱',
        desc: '%LOCALAPPDATA%\\Programs\\Boida 또는 auracast-receiver',
        requiresAdmin: false,
        check: () => {
          const localAppData = process.env.LOCALAPPDATA || '';
          const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
          const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

          // 1. 파일 직접 확인 (per-user / per-machine 설치 경로 모두)
          const filePaths = [
            path.join(localAppData, 'Programs', 'Boida', 'Boida.exe'),
            path.join(localAppData, 'Programs', 'auracast-receiver', 'Boida.exe'),
            path.join(localAppData, 'Programs', 'Boida'),
            path.join(localAppData, 'Programs', 'auracast-receiver'),
            path.join(programFiles, 'Boida', 'Boida.exe'),
            path.join(programFilesX86, 'Boida', 'Boida.exe'),
          ];
          if (filePaths.some(p => fs.existsSync(p))) return true;

          // 2. 레지스트리 확인 (HKCU: per-user, HKLM: per-machine)
          const regRoots = [
            'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
            'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
            'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
          ];
          for (const root of regRoots) {
            try {
              const result = execSync(
                `reg query "${root}" /s /f "Boida" /d`,
                { stdio: 'pipe', timeout: 5000 }
              ).toString();
              if (result.toLowerCase().includes('boida')) return true;
            } catch {}
          }
          return false;
        },
        remove: () => {
          // 레지스트리에서 UninstallString 찾아 실행
          const regRoots = [
            'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
            'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
          ];
          for (const root of regRoots) {
            try {
              const result = execSync(
                `reg query "${root}" /s /f "Boida" /d`,
                { stdio: 'pipe', timeout: 5000 }
              ).toString();
              const keyMatches = result.match(/HKEY[^\r\n]+/g) || [];
              for (const key of keyMatches) {
                try {
                  const uninst = execSync(`reg query "${key}" /v UninstallString`, { stdio: 'pipe' }).toString();
                  const m = uninst.match(/UninstallString\s+REG_SZ\s+(.+)/);
                  if (m) {
                    const uninstStr = m[1].trim().replace(/^"|"$/g, '');
                    execSync(`"${uninstStr}" /S`, { timeout: 60000 });
                    return true;
                  }
                } catch {}
              }
            } catch {}
          }
          // 폴백: 앱 디렉토리 직접 삭제
          const localAppData = process.env.LOCALAPPDATA || '';
          const fallbackPaths = [
            path.join(localAppData, 'Programs', 'Boida'),
            path.join(localAppData, 'Programs', 'auracast-receiver'),
          ];
          for (const p of fallbackPaths) {
            if (fs.existsSync(p)) {
              fs.rmSync(p, { recursive: true, force: true });
              return true;
            }
          }
          return false;
        }
      },
      {
        id: 'gstreamer',
        label: 'GStreamer 미디어 라이브러리',
        desc: 'GStreamer 설치 폴더 (모든 드라이브 탐색)',
        requiresAdmin: true,
        check: () => {
          // 드라이브 무관하게 탐색
          if (findGStreamerRootWin()) return true;
          // gstreamer 루트 디렉토리도 확인 (상위 폴더)
          try {
            const drives = execSync('wmic logicaldisk get caption', { stdio: 'pipe', timeout: 3000 })
              .toString().split('\n').map(l => l.trim()).filter(l => /^[A-Z]:$/.test(l));
            for (const drive of drives) {
              if (fs.existsSync(`${drive}\\gstreamer`)) return true;
            }
          } catch {}
          return false;
        },
        remove: () => {
          const tempScript = path.join(os.tmpdir(), 'boida_rm_gstreamer.ps1');
          const lines = [
            '# GStreamer 제거 (관리자)',
            '',
            '# 1. MSI GUID 찾아서 uninstall',
            '$roots = @(',
            '  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",',
            '  "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",',
            '  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall"',
            ')',
            'foreach ($root in $roots) {',
            '  try {',
            '    $items = Get-ChildItem $root -ErrorAction SilentlyContinue |',
            '      Where-Object { $_.GetValue("DisplayName") -like "*GStreamer*" }',
            '    foreach ($item in $items) {',
            '      $us = $item.GetValue("UninstallString")',
            '      if ($us -match "\\{[0-9A-Fa-f\\-]+\\}") {',
            '        $guid = $matches[0]',
            '        Write-Host "MSI 제거: $guid"',
            '        Start-Process msiexec.exe -ArgumentList "/x $guid /quiet /norestart" -Wait -ErrorAction SilentlyContinue',
            '      }',
            '    }',
            '  } catch {}',
            '}',
            '',
            '# 2. 폴더 삭제 (모든 드라이브)',
            '$drives = Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root',
            'foreach ($d in $drives) {',
            '  $p = Join-Path $d "gstreamer"',
            '  if (Test-Path $p) {',
            '    Write-Host "폴더 삭제: $p"',
            '    takeown /f $p /r /d y 2>$null | Out-Null',
            '    icacls $p /grant ($env:USERNAME + ":F") /T 2>$null | Out-Null',
            '    Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue',
            '    if (Test-Path $p) { cmd /c ("rd /s /q """ + $p + """") }',
            '  }',
            '}',
            'Write-Host "GStreamer 제거 완료"',
          ];
          const scriptContent = lines.join('\r\n');
          fs.writeFileSync(tempScript, scriptContent, 'utf8');
          try {
            // 관리자 권한으로 전체 스크립트 실행 (UAC 1회)
            execSync(
              `powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \\"${tempScript}\\"' -Verb RunAs -Wait"`,
              { timeout: 180000 }
            );
          } catch {}
          try { fs.unlinkSync(tempScript); } catch {}
          return true;
        }
      },
      {
        id: 'appdata',
        label: 'Boida 사용자 데이터',
        desc: '%APPDATA%\\Boida, %LOCALAPPDATA%\\Boida 등',
        requiresAdmin: false,
        check: () => {
          const paths = [
            path.join(process.env.APPDATA || '', 'Boida'),
            path.join(process.env.LOCALAPPDATA || '', 'Boida'),
            path.join(process.env.APPDATA || '', 'auracast-receiver'),
            path.join(process.env.LOCALAPPDATA || '', 'auracast-receiver'),
          ];
          return paths.some(p => fs.existsSync(p));
        },
        remove: () => {
          const paths = [
            path.join(process.env.APPDATA || '', 'Boida'),
            path.join(process.env.LOCALAPPDATA || '', 'Boida'),
            path.join(process.env.APPDATA || '', 'auracast-receiver'),
            path.join(process.env.LOCALAPPDATA || '', 'auracast-receiver'),
          ];
          paths.forEach(p => {
            if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
          });
          return true;
        }
      }
    ];
  }

  // macOS items
  return [
    {
      id: 'app',
      label: 'Boida 앱',
      desc: '/Applications/Boida.app',
      path: '/Applications/Boida.app',
      requiresAdmin: true,
      check: () => fs.existsSync('/Applications/Boida.app'),
      removeCmd: () => 'rm -rf "/Applications/Boida.app"'
    },
    {
      id: 'gstreamer',
      label: 'GStreamer 미디어 라이브러리',
      desc: '/Library/Frameworks/GStreamer.framework',
      path: '/Library/Frameworks/GStreamer.framework',
      requiresAdmin: true,
      check: () => fs.existsSync('/Library/Frameworks/GStreamer.framework'),
      removeCmd: () => 'rm -rf "/Library/Frameworks/GStreamer.framework"'
    },
    {
      id: 'gst_receipts',
      label: 'GStreamer 패키지 영수증',
      desc: 'pkgutil 설치 기록 (org.freedesktop.gstreamer.*)',
      requiresAdmin: true,
      check: () => {
        try {
          const out = execSync('pkgutil --pkgs 2>/dev/null', { stdio: 'pipe' }).toString();
          return out.includes('org.freedesktop.gstreamer');
        } catch { return false; }
      },
      removeCmd: () => {
        try {
          const out = execSync('pkgutil --pkgs 2>/dev/null', { stdio: 'pipe' }).toString();
          const pkgs = out.split('\n').filter(l => l.includes('org.freedesktop.gstreamer') || l.includes('com.boida'));
          return pkgs.map(p => `pkgutil --forget "${p.trim()}"`).join(' && ');
        } catch { return 'true'; }
      }
    },
    {
      id: 'prefs',
      label: 'Boida 환경설정',
      desc: '~/Library/Preferences/com.boida.mirror.plist',
      path: path.join(home, 'Library/Preferences/com.boida.mirror.plist'),
      requiresAdmin: false,
      check: () => fs.existsSync(path.join(home, 'Library/Preferences/com.boida.mirror.plist')),
      removeCmd: () => `rm -f "${path.join(home, 'Library/Preferences/com.boida.mirror.plist')}"`
    },
    {
      id: 'appsupport',
      label: 'Boida 앱 데이터',
      desc: '~/Library/Application Support/Boida',
      path: path.join(home, 'Library/Application Support/Boida'),
      requiresAdmin: false,
      check: () => fs.existsSync(path.join(home, 'Library/Application Support/Boida')),
      removeCmd: () => `rm -rf "${path.join(home, 'Library/Application Support/Boida')}"`
    },
    {
      id: 'caches',
      label: 'Boida 캐시',
      desc: '~/Library/Caches/com.boida.mirror',
      path: path.join(home, 'Library/Caches/com.boida.mirror'),
      requiresAdmin: false,
      check: () => fs.existsSync(path.join(home, 'Library/Caches/com.boida.mirror')),
      removeCmd: () => `rm -rf "${path.join(home, 'Library/Caches/com.boida.mirror')}"`
    },
    {
      id: 'logs',
      label: 'Boida 로그',
      desc: '~/Library/Logs/Boida',
      path: path.join(home, 'Library/Logs/Boida'),
      requiresAdmin: false,
      check: () => fs.existsSync(path.join(home, 'Library/Logs/Boida')),
      removeCmd: () => `rm -rf "${path.join(home, 'Library/Logs/Boida')}"`
    }
  ];
}

// ── IPC Handlers ───────────────────────────────────────────────
ipcMain.handle('get-items', async () => {
  const items = getRemovalItems();
  return items.map(item => ({
    id: item.id,
    label: item.label,
    desc: item.desc,
    requiresAdmin: item.requiresAdmin,
    exists: item.check()
  }));
});

ipcMain.handle('uninstall', async (event, selectedIds) => {
  const items = getRemovalItems();
  const selected = items.filter(i => selectedIds.includes(i.id));
  const results = [];

  if (process.platform === 'darwin') {
    // Separate admin-required and user-level removals
    const adminItems = selected.filter(i => i.requiresAdmin && i.check());
    const userItems = selected.filter(i => !i.requiresAdmin && i.check());

    // User-level: remove directly
    for (const item of userItems) {
      try {
        execSync(item.removeCmd(), { timeout: 30000 });
        results.push({ id: item.id, success: true });
        event.sender.send('uninstall-progress', { id: item.id, done: true });
      } catch (e) {
        results.push({ id: item.id, success: false, error: e.message });
        event.sender.send('uninstall-progress', { id: item.id, done: true, error: e.message });
      }
    }

    // Admin-level: batch into one osascript call
    if (adminItems.length > 0) {
      const cmds = adminItems.map(i => i.removeCmd()).filter(Boolean).join(' && ');
      try {
        const script = `do shell script "${cmds.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" with administrator privileges`;
        execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { timeout: 120000 });
        adminItems.forEach(item => {
          results.push({ id: item.id, success: true });
          event.sender.send('uninstall-progress', { id: item.id, done: true });
        });
      } catch (e) {
        adminItems.forEach(item => {
          results.push({ id: item.id, success: false, error: e.message });
          event.sender.send('uninstall-progress', { id: item.id, done: true, error: e.message });
        });
      }
    }
  } else if (process.platform === 'win32') {
    for (const item of selected) {
      if (!item.check()) {
        results.push({ id: item.id, success: true, skipped: true });
        continue;
      }
      try {
        item.remove();
        results.push({ id: item.id, success: true });
        event.sender.send('uninstall-progress', { id: item.id, done: true });
      } catch (e) {
        results.push({ id: item.id, success: false, error: e.message });
        event.sender.send('uninstall-progress', { id: item.id, done: true, error: e.message });
      }
    }
  }

  return results;
});

ipcMain.handle('quit-app', async () => {
  app.quit();
});

// ── Window ─────────────────────────────────────────────────────
function createWindow() {
  // 기본 Electron 메뉴 완전 제거 (macOS/Windows 모두)
  Menu.setApplicationMenu(null);

  const isWin = process.platform === 'win32';
  mainWindow = new BrowserWindow({
    width: 520,
    height: 660,
    resizable: false,
    // hiddenInset은 macOS 전용 — Windows는 네이티브 타이틀바 사용
    titleBarStyle: isWin ? 'default' : 'hiddenInset',
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f7',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
