const { app, BrowserWindow, shell, screen: eScreen, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { exec, execSync, spawn } = require('child_process');
const { startServer, stopServer, broadcastFrame, setDisconnectHandler, setFrameHandler, setSenderDisconnectHandler } = require('./server.cjs');

// ── GitHub 업데이트 설정 ─────────────────────────────────────────
const GITHUB_OWNER = 'creatorjosephkr';
const GITHUB_REPO  = 'Boida';

// ── uxplay-win 런타임 다운로드 경로 (Windows) ────────────────────
const UXPLAY_WIN_LOCAL_DIR = process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Boida', 'uxplay-win')
  : '';
const UXPLAY_WIN_ZIP_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/uxplay-win.zip`;

let mainWindow = null;
let airplayProcess = null;
let airplayGen = 0; // generation counter — incremented on restart to cancel stale reconnects
let videoClient = null; // track the active TCP socket client connection
const VIDEO_PORT = 19777;
let currentAudioDeviceId = null; // target CoreAudio device ID for macOS (null = auto default)

// ── AirPlay Streaming / Bitrate Presets ───────────────────────────
const STREAM_PRESETS = {
  balanced: {
    id: 'balanced',
    name: '균형 모드 (추천)',
    shortName: '720p',
    desc: '720p · 30fps · ~4Mbps',
    tag: '장시간 안정',
    resolution: '1280x720@30',
    fps: '30',
    jpegQuality: 85,
  },
  fhd_6m: {
    id: 'fhd_6m',
    name: '1080p 30fps (6Mbps)',
    shortName: '1080p 6M',
    desc: '1080p · 30fps · 6Mbps',
    tag: 'FHD 표준',
    resolution: '1920x1080@30',
    fps: '30',
    jpegQuality: 90,
  },
  high: {
    id: 'high',
    name: '고화질 (1080p 8Mbps)',
    shortName: '1080p 8M',
    desc: '1080p · 30fps · ~8Mbps',
    tag: '선명한 텍스트',
    resolution: '1920x1080@30',
    fps: '30',
    jpegQuality: 95,
  },
  ultra: {
    id: 'ultra',
    name: '초고화질 (60fps)',
    shortName: '1080p 60F',
    desc: '1080p · 60fps · ~14Mbps',
    tag: '초고속 Wi-Fi',
    resolution: '1920x1080@60',
    fps: '60',
    jpegQuality: 98,
  },
  eco: {
    id: 'eco',
    name: '절약 모드',
    shortName: '540p',
    desc: '540p · 30fps · ~2Mbps',
    tag: '약한 Wi-Fi',
    resolution: '960x540@30',
    fps: '30',
    jpegQuality: 75,
  },
};
let currentQualityPreset = 'ultra';

// ── macOS CoreAudio Device Helper ─────────────────────────────
function getMacOSAudioDevices(targetDevId = null) {
  if (process.platform !== 'darwin') return { defaultId: 0, volume: 70, isMuted: false, devices: [] };
  try {
    const scriptPath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources', 'bin', 'get_audio_devices.py')
      : path.join(__dirname, 'resources', 'bin', 'get_audio_devices.py');
    if (fs.existsSync(scriptPath)) {
      const arg = (targetDevId && targetDevId > 0) ? ` ${targetDevId}` : '';
      const out = execSync(`python3 "${scriptPath}"${arg}`, { timeout: 3000, stdio: 'pipe' }).toString().trim();
      return JSON.parse(out);
    }
  } catch (e) {
    console.warn('[보이다] Failed to get macOS audio devices:', e.message);
  }
  return { defaultId: 0, volume: 70, isMuted: false, devices: [] };
}

function setMacOSAudioVolume(deviceId, volume) {
  if (process.platform !== 'darwin') return { success: true, volume };
  try {
    const scriptPath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources', 'bin', 'get_audio_devices.py')
      : path.join(__dirname, 'resources', 'bin', 'get_audio_devices.py');
    if (fs.existsSync(scriptPath)) {
      const devArg = deviceId || '0';
      const out = execSync(`python3 "${scriptPath}" set-volume ${devArg} ${volume}`, { timeout: 3000, stdio: 'pipe' }).toString().trim();
      return JSON.parse(out);
    }
  } catch (e) {
    console.warn('[보이다] Failed to set macOS audio volume:', e.message);
  }
  return { success: false, volume };
}

function setMacOSAudioMute(deviceId, isMuted) {
  if (process.platform !== 'darwin') return { success: true, isMuted };
  try {
    const scriptPath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources', 'bin', 'get_audio_devices.py')
      : path.join(__dirname, 'resources', 'bin', 'get_audio_devices.py');
    if (fs.existsSync(scriptPath)) {
      const devArg = deviceId || '0';
      const out = execSync(`python3 "${scriptPath}" set-mute ${devArg} ${isMuted ? '1' : '0'}`, { timeout: 3000, stdio: 'pipe' }).toString().trim();
      return JSON.parse(out);
    }
  } catch (e) {
    console.warn('[보이다] Failed to set macOS audio mute:', e.message);
  }
  return { success: false, isMuted };
}

// ── JPEG Frame Parser ─────────────────────────────────────────
class JPEGParser {
  constructor(onFrame) {
    this.buf = Buffer.alloc(0);
    this.onFrame = onFrame;
  }
  push(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    let guard = 0;
    while (guard++ < 200) {
      let si = -1;
      for (let i = 0; i < this.buf.length - 1; i++) {
        if (this.buf[i] === 0xFF && this.buf[i + 1] === 0xD8) { si = i; break; }
      }
      if (si === -1) { this.buf = Buffer.alloc(0); break; }
      if (si > 0) this.buf = this.buf.subarray(si);

      let ei = -1;
      for (let i = 2; i < this.buf.length - 1; i++) {
        if (this.buf[i] === 0xFF && this.buf[i + 1] === 0xD9) { ei = i; break; }
      }
      if (ei === -1) break;

      this.onFrame(Buffer.from(this.buf.subarray(0, ei + 2)));
      this.buf = this.buf.subarray(ei + 2);
    }
  }
}

function jpegDims(buf) {
  for (let i = 0; i < buf.length - 10; i++) {
    if (buf[i] !== 0xFF) continue;
    const m = buf[i + 1];
    if (m === 0xC0 || m === 0xC1 || m === 0xC2) {
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      if (w > 10 && w < 5000 && h > 10 && h < 5000) return { w, h };
    }
  }
  return null;
}

const HEADER_H = 38;
let lastW = 0, lastH = 0;
let currentScale = 1.0;
let currentRotation = 0; // 0, 90, 180, 270

function applyScale() {
  if (!mainWindow || lastW === 0 || lastH === 0) return;
  if (mainWindow.isFullScreen()) return; // Do not resize or lock aspect ratio in full screen
  const { width: sw, height: sh } = eScreen.getPrimaryDisplay().workAreaSize;
  
  const isRotated90 = (currentRotation === 90 || currentRotation === 270);
  const effW = isRotated90 ? lastH : lastW;
  const effH = isRotated90 ? lastW : lastH;

  let baseW, baseH;
  if (effW >= effH) {
    // Landscape
    baseW = Math.min(Math.floor(sw * 0.8), 840);
    const canvasH = Math.round(baseW * effH / effW);
    baseH = canvasH + HEADER_H;
  } else {
    // Portrait
    const maxCanvasH = Math.min(Math.floor(sh * 0.82), 820) - HEADER_H;
    baseW = Math.round(maxCanvasH * effW / effH);
    baseH = maxCanvasH + HEADER_H;
  }

  // Scale width and canvas height, then add the constant header height
  const winW = Math.round(baseW * currentScale);
  const scaledCanvasH = Math.round((baseH - HEADER_H) * currentScale);
  const winH = scaledCanvasH + HEADER_H;

  // Dynamically set minimum size (allows scaling down to 200px)
  const minW = 200;
  const minCanvasH = Math.round(minW * effH / effW);
  const minH = minCanvasH + HEADER_H;
  mainWindow.setMinimumSize(minW, minH);

  // Dynamically lock window aspect ratio to prevent manual resize stretching
  mainWindow.setAspectRatio(winW / winH);

  mainWindow.setSize(winW, winH, true);
}

function resizeWindow(w, h) {
  if (!mainWindow || (w === lastW && h === lastH)) return;
  console.log(`[보이다] Stream resolution changed: ${lastW}x${lastH} -> ${w}x${h}`);
  const prevW = lastW, prevH = lastH;
  lastW = w; lastH = h;
  // If the stream natively switched to landscape/portrait from iOS, reset software rotation
  if ((prevW < prevH && w >= h) || (prevW >= prevH && w < h && prevW > 0)) {
    if (currentRotation !== 0) {
      currentRotation = 0;
      mainWindow.webContents.send('rotation-changed', currentRotation);
    }
  }
  applyScale();
}

ipcMain.on('window-scale-100', () => {
  currentScale = 1.0;
  applyScale();
});
ipcMain.on('window-scale-plus', () => {
  currentScale = Math.min(currentScale + 0.1, 2.0);
  applyScale();
});
ipcMain.on('window-scale-minus', () => {
  currentScale = Math.max(currentScale - 0.1, 0.25);
  applyScale();
});

// 회전 (Orientation) 제어
ipcMain.handle('get-rotation', () => {
  return currentRotation;
});

ipcMain.handle('set-rotation', (event, angle) => {
  const normAngle = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  if (currentRotation !== normAngle) {
    currentRotation = normAngle;
    applyScale();
    if (mainWindow) {
      mainWindow.webContents.send('rotation-changed', currentRotation);
    }
  }
  return { success: true, rotation: currentRotation };
});

ipcMain.handle('toggle-rotation', () => {
  // Cycle: 0 -> 90 -> 270 -> 0
  if (currentRotation === 0) currentRotation = 90;
  else if (currentRotation === 90) currentRotation = 270;
  else currentRotation = 0;
  applyScale();
  if (mainWindow) {
    mainWindow.webContents.send('rotation-changed', currentRotation);
  }
  return { success: true, rotation: currentRotation };
});

ipcMain.on('log-detect', (event, data) => {
  console.log('[보이다 auto-detect]', data);
});

// Windows 프레임리스 창 제어
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('window-close',   () => { if (mainWindow) mainWindow.close(); });

// ── uxplay-win 런타임 다운로드 (Windows) ─────────────────────────
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const doRequest = (reqUrl) => {
      const mod = reqUrl.startsWith('https') ? require('https') : require('http');
      mod.get(reqUrl, { headers: { 'User-Agent': 'Boida-App' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          doRequest(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const total = parseInt(res.headers['content-length'] || '0');
        let downloaded = 0;
        res.on('data', chunk => {
          downloaded += chunk.length;
          if (total > 0 && onProgress) onProgress(downloaded / total * 100);
        });
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', (err) => { file.close(); reject(err); });
      }).on('error', (err) => { file.close(); reject(err); });
    };
    doRequest(url);
  });
}

async function downloadAndExtractUxplay() {
  const send = (event, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(event, data);
  };
  try {
    send('uxplay-download-progress', { percent: 0, status: '다운로드 준비 중...' });

    // 저장 디렉토리 준비
    const parentDir = path.dirname(UXPLAY_WIN_LOCAL_DIR);
    fs.mkdirSync(parentDir, { recursive: true });
    const zipPath = path.join(os.tmpdir(), 'uxplay-win.zip');

    // 다운로드
    await downloadFile(UXPLAY_WIN_ZIP_URL, zipPath, (pct) => {
      send('uxplay-download-progress', {
        percent: Math.round(pct * 0.85),
        status: `다운로드 중... ${Math.round(pct)}%`
      });
    });

    send('uxplay-download-progress', { percent: 88, status: '압축 해제 중...' });

    // PowerShell Expand-Archive로 압축 해제
    const safeZip  = zipPath.replace(/'/g, "''");
    const safeDest = parentDir.replace(/'/g, "''");
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${safeZip}' -DestinationPath '${safeDest}' -Force"`,
      { timeout: 180000 }
    );

    try { fs.unlinkSync(zipPath); } catch (_) {}

    send('uxplay-download-progress', { percent: 100, status: '완료!' });
    send('uxplay-download-done', {});
    console.log('[보이다] uxplay-win 다운로드 완료:', UXPLAY_WIN_LOCAL_DIR);

    // 다운로드 완료 후 AirPlay 시작
    setTimeout(startAirPlay, 600);
  } catch (err) {
    console.error('[보이다] uxplay-win 다운로드 실패:', err.message);
    send('uxplay-download-error', { message: err.message });
  }
}

// ── TCP Client → uxplay's tcpserversink ──────────────────────
function connectToVideoStream(parser, gen, retryDelay = 1000, streamingRef = { value: false }) {
  if (gen !== airplayGen) return; // Stale generation — discard

  if (videoClient) {
    try { videoClient.destroy(); } catch (e) {}
    videoClient = null;
  }

  const client = net.createConnection(VIDEO_PORT, '127.0.0.1');
  videoClient = client;

  client.on('connect', () => {
    console.log('[보이다] Connected to uxplay video stream');
    client.on('data', chunk => { 
      if (gen === airplayGen) {
        parser.push(chunk); 
      }
    });
  });

  client.on('error', () => {
    client.destroy();
    if (videoClient === client) videoClient = null;
    // Retry silently — uxplay may not have opened the sink yet
    if (gen === airplayGen && airplayProcess) {
      setTimeout(() => connectToVideoStream(parser, gen, Math.min(retryDelay * 1.5, 5000), streamingRef), retryDelay);
    }
  });

  client.on('close', () => {
    client.destroy();
    if (videoClient === client) videoClient = null;
    
    // ONLY notify frontend of disconnect if we were actually streaming.
    // A TCP close during the initial connection phase (before any AirPlay device connected)
    // is NORMAL and must NOT trigger a restart.
    if (streamingRef.value && mainWindow && gen === airplayGen) {
      streamingRef.value = false;
      mainWindow.webContents.send('airplay-status', 'disconnected');
    }

    // Retry TCP connection — do NOT restart uxplay, just reconnect to its sink
    if (gen === airplayGen && airplayProcess) {
      setTimeout(() => connectToVideoStream(parser, gen, 1000, streamingRef), 1500);
    }
  });
}


// ── AirPlay via uxplay ────────────────────────────────────────
function startAirPlay(targetAudioDeviceId = null, targetQualityPreset = null) {
  const gen = ++airplayGen; // New generation — cancels any previous reconnect loops
  if (targetAudioDeviceId !== null) {
    currentAudioDeviceId = targetAudioDeviceId;
  }
  if (targetQualityPreset !== null && STREAM_PRESETS[targetQualityPreset]) {
    currentQualityPreset = targetQualityPreset;
  }
  
  let uxplayPath = 'uxplay';
  const env = { ...process.env };

  const localUxPlayDir = path.join(__dirname, 'UxPlay');

  // Proactively inject all possible macOS GStreamer & Homebrew paths
  if (process.platform === 'darwin') {
    // 1. Core binaries path injection
    env.PATH = `/usr/local/bin:/opt/homebrew/bin:/Library/Frameworks/GStreamer.framework/Commands:${localUxPlayDir}:${env.PATH || ''}`;
    
    // 2. Dynamic Linker library and Framework path injection
    env.DYLD_LIBRARY_PATH = `/usr/local/lib:/opt/homebrew/lib:/Library/Frameworks/GStreamer.framework/Versions/1.0/lib:${env.DYLD_LIBRARY_PATH || ''}`;
    env.DYLD_FRAMEWORK_PATH = `/Library/Frameworks:${env.DYLD_FRAMEWORK_PATH || ''}`;

    // 3. GStreamer plugin and scanner resolution
    if (fs.existsSync('/Library/Frameworks/GStreamer.framework')) {
      env.GST_PLUGIN_SYSTEM_PATH = `/Library/Frameworks/GStreamer.framework/Versions/1.0/lib/gstreamer-1.0:${env.GST_PLUGIN_SYSTEM_PATH || ''}`;
      env.GST_PLUGIN_PATH = `/Library/Frameworks/GStreamer.framework/Versions/1.0/lib/gstreamer-1.0:${env.GST_PLUGIN_PATH || ''}`;
      env.GST_PLUGIN_SCANNER = '/Library/Frameworks/GStreamer.framework/Versions/1.0/libexec/gstreamer-1.0/gst-plugin-scanner';
    } else if (fs.existsSync('/usr/local/libexec/gstreamer-1.0/gst-plugin-scanner')) {
      env.GST_PLUGIN_SCANNER = '/usr/local/libexec/gstreamer-1.0/gst-plugin-scanner';
    } else if (fs.existsSync('/opt/homebrew/libexec/gstreamer-1.0/gst-plugin-scanner')) {
      env.GST_PLUGIN_SCANNER = '/opt/homebrew/libexec/gstreamer-1.0/gst-plugin-scanner';
    }
  }

  const isWin = process.platform === 'win32';
  const binName = isWin ? 'uxplay.exe' : 'uxplay';

  // ── Windows: GStreamer PATH/플러그인 경로 주입 ─────────────────
  if (isWin) {
    // uxplay-win 폴더 경로 — 패키지: LOCALAPPDATA 다운로드 경로, 개발: 로컬
    const winUxplayDir = app.isPackaged
      ? UXPLAY_WIN_LOCAL_DIR
      : path.join(__dirname, 'resources', 'bin', 'uxplay-win');
    const bundledPluginDir = path.join(winUxplayDir, 'gstreamer-1.0');

    if (fs.existsSync(bundledPluginDir)) {
      // 번들 MinGW 플러그인 우선 사용 (시스템 GStreamer 불필요)
      env.GST_PLUGIN_PATH = bundledPluginDir;
      env.GST_PLUGIN_SYSTEM_PATH = bundledPluginDir;
      env.PATH = `${winUxplayDir};${env.PATH || ''}`;
      console.log(`[보이다] Bundled GStreamer plugins: ${bundledPluginDir}`);
    } else {
      // 폴백: 시스템 GStreamer
      const gstRoot = findGStreamerRootWin();
      if (gstRoot) {
        env.GST_PLUGIN_PATH = path.join(gstRoot, 'lib', 'gstreamer-1.0');
        env.GST_PLUGIN_SYSTEM_PATH = env.GST_PLUGIN_PATH;
        env.PATH = `${path.join(gstRoot, 'bin')};${env.PATH || ''}`;
        console.log(`[보이다] System GStreamer: ${gstRoot}`);
      } else {
        console.warn('[보이다] GStreamer를 찾을 수 없음 (번들/시스템 모두)');
      }
    }

    // GStreamer 레지스트리 격리 (stale 캐시 방지)
    // v2: uxplay-win 경로가 LOCALAPPDATA로 변경됨 (v1.1.0) → 구버전 캐시 모두 삭제
    for (const old of ['boida-gst-registry.bin', 'boida-gst-registry-v1.bin']) {
      try { const p = path.join(os.tmpdir(), old); if (fs.existsSync(p)) fs.unlinkSync(p); } catch(_) {}
    }
    env.GST_REGISTRY = path.join(os.tmpdir(), 'boida-gst-registry-v2.bin');

    // 번들 플러그인 스캐너
    const scannerPath = path.join(winUxplayDir, 'gst-plugin-scanner.exe');
    if (fs.existsSync(scannerPath)) {
      env.GST_PLUGIN_SCANNER = scannerPath;
      console.log(`[보이다] GStreamer scanner: ${scannerPath}`);
    }
  }

  if (app.isPackaged) {
    // Windows: %LOCALAPPDATA%\Boida\uxplay-win\uxplay.exe (런타임 다운로드)
    // macOS:   resources/bin/uxplay
    const winUxplayDir = UXPLAY_WIN_LOCAL_DIR;
    const packagedPath = isWin
      ? path.join(winUxplayDir, 'uxplay.exe')
      : path.join(process.resourcesPath, 'resources', 'bin', binName);
    if (fs.existsSync(packagedPath)) {
      uxplayPath = packagedPath;
      if (isWin) {
        // uxplay-win 폴더를 PATH 맨 앞에 추가 → DLL 자동 로드
        env.PATH = `${winUxplayDir};${env.PATH || ''}`;
      } else {
        const libDir = path.join(process.resourcesPath, 'resources', 'lib');
        env.DYLD_LIBRARY_PATH = `${libDir}:${path.dirname(packagedPath)}:/Library/Frameworks/GStreamer.framework/Versions/1.0/lib:/opt/homebrew/lib:/usr/local/lib:${env.DYLD_LIBRARY_PATH || ''}`;
      }
      console.log(`[보이다] Using bundled uxplay: ${uxplayPath}`);
    } else {
      console.log(`[보이다] Bundled uxplay not found at ${packagedPath}, falling back to system...`);
      const systemPaths = ['/usr/local/bin/uxplay', '/opt/homebrew/bin/uxplay'];
      for (const p of systemPaths) {
        if (fs.existsSync(p)) { uxplayPath = p; break; }
      }
    }
  } else {
    // Development mode
    const devWinDir = path.join(__dirname, 'resources', 'bin', 'uxplay-win');
    const devBinPath = isWin
      ? path.join(devWinDir, 'uxplay.exe')
      : path.join(__dirname, 'resources', 'bin', binName);
    const devUxPlayPath = path.join(localUxPlayDir, 'uxplay');
    if (fs.existsSync(devBinPath)) {
      uxplayPath = devBinPath;
      if (isWin) {
        env.PATH = `${devWinDir};${env.PATH || ''}`;
      } else {
        const libDir = path.join(__dirname, 'resources', 'lib');
        env.DYLD_LIBRARY_PATH = `${libDir}:${path.dirname(devBinPath)}:/Library/Frameworks/GStreamer.framework/Versions/1.0/lib:/opt/homebrew/lib:/usr/local/lib:${env.DYLD_LIBRARY_PATH || ''}`;
      }
      console.log(`[보이다] Dev mode: using resources/bin/uxplay${isWin ? '-win' : ''}`);
    } else if (!isWin && fs.existsSync(devUxPlayPath)) {
      uxplayPath = devUxPlayPath;
      env.PATH = `${localUxPlayDir}:${env.PATH || ''}`;
      env.DYLD_LIBRARY_PATH = `/Library/Frameworks/GStreamer.framework/Versions/1.0/lib:/opt/homebrew/lib:/usr/local/lib:${env.DYLD_LIBRARY_PATH || ''}`;
      console.log(`[보이다] Dev mode: using UxPlay build dir`);
    } else {
      env.PATH = `/usr/local/bin:/opt/homebrew/bin:${localUxPlayDir}:${env.PATH || ''}`;
      env.DYLD_LIBRARY_PATH = `/Library/Frameworks/GStreamer.framework/Versions/1.0/lib:/opt/homebrew/lib:/usr/local/lib:${env.DYLD_LIBRARY_PATH || ''}`;
    }
  }

  let hasConnected = false;
  const streamingRef = { value: false }; // true only when AirPlay device is actively streaming
  const parser = new JPEGParser(frame => {
    broadcastFrame(frame);
    if (!hasConnected && mainWindow) {
      hasConnected = true;
      streamingRef.value = true; // mark as actively streaming
      mainWindow.webContents.send('airplay-status', 'connected');
    }
    const d = jpegDims(frame);
    if (d) resizeWindow(d.w, d.h);
  });

  const preset = STREAM_PRESETS[currentQualityPreset] || STREAM_PRESETS.ultra;
  console.log(`[보이다] Starting AirPlay with preset: ${preset.name} (${preset.resolution}, ${preset.fps}fps, jpegQuality=${preset.jpegQuality})`);

  const uxplayArgs = [
    '-n', isWin ? 'Boida' : '보이다(Boida)',
    '-nh',
    '-s', preset.resolution,
    '-fps', preset.fps,
    '-vsync', 'no',
    '-async', 'no',
    '-al', '0.5',
    '-vs', `videoconvert chroma-mode=full matrix-mode=full dither=none ! video/x-raw,format=Y444 ! jpegenc quality=${preset.jpegQuality} idct-method=float ! tcpserversink host=127.0.0.1 port=${VIDEO_PORT} sync=false`
  ];

  // macOS 오디오 싱크 최적화:
  // 명시적 device ID 또는 현재 macOS 기본 출력 장치 ID를 가져와 osxaudiosink에 직결 바인딩!
  if (process.platform === 'darwin') {
    let deviceIdToUse = currentAudioDeviceId;
    if (!deviceIdToUse) {
      const audioInfo = getMacOSAudioDevices();
      if (audioInfo && audioInfo.defaultId > 0) {
        deviceIdToUse = audioInfo.defaultId;
        currentAudioDeviceId = deviceIdToUse;
      }
    }
    if (deviceIdToUse && deviceIdToUse > 0) {
      uxplayArgs.push('-as', `osxaudiosink device=${deviceIdToUse}`);
      console.log(`[보이다] Binding audio output to macOS CoreAudio device ID: ${deviceIdToUse}`);
    } else {
      uxplayArgs.push('-as', 'osxaudiosink');
    }
  }

  const spawnStart = Date.now();
  airplayProcess = spawn(uxplayPath, uxplayArgs, {
    env,
    cwd: isWin ? path.dirname(uxplayPath) : os.homedir(),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  airplayProcess.stdout.on('data', d => {
    const msg = d.toString().trim();
    console.log('[uxplay]', msg);
    if (mainWindow) mainWindow.webContents.send('uxplay-output', msg);
  });
  airplayProcess.stderr.on('data', d => {
    const msg = d.toString().trim();
    console.error('[uxplay err]', msg);
    if (mainWindow) mainWindow.webContents.send('uxplay-output', msg);
  });
  airplayProcess.on('error', err => {
    console.error('[uxplay error]', err.message);
    if (mainWindow) mainWindow.webContents.send('uxplay-crash', err.message);
  });
  airplayProcess.on('close', code => {
    const elapsed = Date.now() - spawnStart;
    console.log('[uxplay] closed:', code, `(${elapsed}ms)`);
    if (elapsed < 3000 && mainWindow) {
      // 3초 내 종료 = 시작 실패
      mainWindow.webContents.send('uxplay-crash',
        `uxplay 시작 실패 (code: ${code}). Bonjour 서비스 또는 DLL 누락 가능성.`);
    }
    airplayProcess = null;
  });

  setTimeout(() => connectToVideoStream(parser, gen, 1000, streamingRef), 1500);
}

// ── Disconnect / Restart uxplay ───────────────────────────────
function restartAirPlay(targetAudioDeviceId = null, targetQualityPreset = null) {
  console.log('[보이다] Disconnecting — restarting uxplay...');
  if (targetAudioDeviceId !== null) {
    currentAudioDeviceId = targetAudioDeviceId;
  }
  if (targetQualityPreset !== null && STREAM_PRESETS[targetQualityPreset]) {
    currentQualityPreset = targetQualityPreset;
  }
  if (videoClient) {
    try { videoClient.destroy(); } catch (e) {}
    videoClient = null;
  }
  if (airplayProcess) {
    try { airplayProcess.kill('SIGKILL'); } catch (e) {}
    airplayProcess = null;
  }
  // cross-platform uxplay kill
  if (process.platform === 'win32') {
    exec('taskkill /F /IM uxplay.exe 2>nul & exit 0');
  } else {
    exec('killall uxplay 2>/dev/null; true');
  }
  lastW = 0; lastH = 0;
  currentRotation = 0;
  if (mainWindow) {
    mainWindow.webContents.send('rotation-changed', 0);
    mainWindow.setAspectRatio(390 / 760);
  }
  setTimeout(() => startAirPlay(currentAudioDeviceId, currentQualityPreset), 800); // wait for port 19777 to be freed before rebinding
}

// ── Windows GStreamer 설치 경로 탐색 (드라이브 무관) ──────────────
function findGStreamerRootWin() {
  // 1. 현재 프로세스 환경변수 (재시작 후 반영됐을 경우)
  for (const v of ['GSTREAMER_1_0_ROOT_MSVC_X86_64', 'GSTREAMER_1_0_ROOT_MINGW_X86_64',
                    'GSTREAMER_1_0_ROOT_MSVC_X86', 'GSTREAMER_1_0_ROOT_MINGW_X86']) {
    if (process.env[v] && fs.existsSync(process.env[v])) return process.env[v];
  }

  // 2. 시스템 레지스트리에서 직접 읽기 (relaunch 후 process.env에 미반영 대응)
  const regKey = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment';
  for (const v of ['GSTREAMER_1_0_ROOT_MSVC_X86_64', 'GSTREAMER_1_0_ROOT_MINGW_X86_64',
                    'GSTREAMER_1_0_ROOT_MSVC_X86', 'GSTREAMER_1_0_ROOT_MINGW_X86']) {
    try {
      const out = execSync(`reg query "${regKey}" /v ${v}`, { stdio: 'pipe', timeout: 3000 }).toString();
      const m = out.match(/REG_(?:SZ|EXPAND_SZ)\s+(.+)/);
      if (m) {
        const p = m[1].trim();
        if (fs.existsSync(p)) return p;
      }
    } catch {}
  }

  // 3. 모든 드라이브 스캔 (C:, D:, E: ... — D:\gstreamer 같은 경우 대응)
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

// ── macOS Application Menu ────────────────────────────────────
function setupMacMenu() {
  app.setAboutPanelOptions({
    applicationName: '보이다 (Boida)',
    applicationVersion: app.getVersion(),
    copyright: 'Copyright © 2026 CREATOR JOSEPH',
    credits: 'creatorjoseph@kakao.com',
  });

  const template = [
    {
      label: app.name,
      submenu: [
        { label: 'About', role: 'about' },
        {
          label: '업데이트 확인',
          click: () => checkForUpdates(true),
        },
        { type: 'separator' },
        {
          label: '개발자 블로그',
          click: () => shell.openExternal('https://blog.naver.com/josephk1010'),
        },
        {
          label: '개발자후원',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('open-sponsor-modal');
            }
          },
        },
        { type: 'separator' },
        { label: '종료', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Electron Window ───────────────────────────────────────────
function createWindow() {
  if (process.platform === 'darwin') {
    setupMacMenu();
  } else if (process.platform === 'win32') {
    // Windows: 메뉴바 제거
    Menu.setApplicationMenu(null);
  }

  mainWindow = new BrowserWindow({
    width: 390,
    height: 760,
    minWidth: 200,
    minHeight: 380,
    resizable: true,
    frame: process.platform !== 'win32',           // Windows: 네이티브 타이틀바 제거
    titleBarStyle: process.platform === 'win32' ? 'default' : 'hiddenInset',
    backgroundColor: '#f2f2f7',
    autoHideMenuBar: true,
    menuBarVisible: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
  mainWindow.setAspectRatio(390 / 760);
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('enter-full-screen', () => {
    mainWindow.setAspectRatio(0); // Disable aspect ratio constraints during full screen to prevent sizing glitches
    mainWindow.webContents.send('fullscreen-changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-changed', false);
    // Trigger applyScale after transition to perfectly restore aspect ratio + header height
    setTimeout(() => {
      applyScale();
    }, 150);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── GStreamer Detection & Self-Healing ─────────────────────────
function checkGStreamerInstalled() {
  if (process.platform === 'darwin') {
    return fs.existsSync('/Library/Frameworks/GStreamer.framework');
  } else if (process.platform === 'win32') {
    // findGStreamerRootWin()이 모든 드라이브 탐색 — D:\gstreamer 등 비표준 경로 대응
    if (findGStreamerRootWin()) return true;

    // 추가: Uninstall 레지스트리 검색 (MSI 설치 후 항상 등록)
    try {
      const psCmd = [
        `$p='HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',`,
        `'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*';`,
        `(Get-ItemProperty $p -EA SilentlyContinue|Where-Object{$_.DisplayName -like '*GStreamer*'}|Measure-Object).Count`,
      ].join(' ');
      const r = execSync(`powershell -NoProfile -Command "${psCmd}"`,
        { stdio: 'pipe', timeout: 8000 }).toString().trim();
      if (parseInt(r) > 0) return true;
    } catch {}

    return false;
  }
  return true;
}


ipcMain.handle('check-gstreamer', async () => {
  // Windows 패키지: GStreamer는 uxplay-win 안에 내장됨 → 모달 불필요
  if (process.platform === 'win32' && app.isPackaged) return true;
  return checkGStreamerInstalled();
});

ipcMain.handle('install-gstreamer', async () => {
  try {
    const isWin = process.platform === 'win32';
    // Packaged path (installed app)
    const pkgInstallerPath = isWin
      ? path.join(process.resourcesPath, 'resources', 'gstreamer-installer.msi')
      : path.join(process.resourcesPath, 'resources', 'gstreamer-installer.pkg');
    // Dev mode path
    const devInstallerPath = isWin
      ? path.join(__dirname, 'resources', 'gstreamer-installer.msi')
      : path.join(__dirname, 'resources', 'gstreamer-installer.pkg');

    const activeInstallerPath = fs.existsSync(pkgInstallerPath)
      ? pkgInstallerPath
      : fs.existsSync(devInstallerPath) ? devInstallerPath : '';

    if (!activeInstallerPath) {
      throw new Error('설치 파일을 앱 번들 내에서 찾을 수 없습니다.');
    }

    console.log(`[보이다] Installing GStreamer from: ${activeInstallerPath}`);

    if (isWin) {
      // Windows: temp .ps1 파일로 UAC 권한 상승 후 MSI 설치
      // inline -Command 방식은 이스케이프 문제로 msiexec 인자 파싱 실패 → 설치 루프 발생
      const tempScript = path.join(os.tmpdir(), 'boida_install_gst.ps1');
      const winPath = activeInstallerPath.replace(/\\/g, '\\\\');
      const psContent = `Start-Process -FilePath 'msiexec.exe' -ArgumentList @('/i', '"${winPath}"', '/quiet', '/norestart') -Verb RunAs -Wait\n`;
      fs.writeFileSync(tempScript, psContent, 'utf8');
      try {
        execSync(
          `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScript}"`,
          { timeout: 300000 }
        );
      } finally {
        try { fs.unlinkSync(tempScript); } catch {}
      }
    } else {
      // macOS: pkg installer with admin privileges via osascript
      const escapedPath = activeInstallerPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const script = `do shell script "installer -pkg \\"${escapedPath}\\" -target /" with administrator privileges`;
      execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { timeout: 300000 });
    }
    return { success: true };
  } catch (err) {
    console.error('[보이다] GStreamer installation failed:', err.message);
    return { success: false, error: err.message };
  }
});


// ── Windows Bonjour(mDNS) Detection & Install ─────────────────
function checkBonjourInstalled() {
  if (process.platform !== 'win32') return true;
  try {
    const r = execSync('sc query "Bonjour Service"', { stdio: 'pipe', timeout: 5000 }).toString();
    if (/STATE/.test(r)) return true; // 서비스 존재 (실행중/중지 무관)
  } catch {}
  // dnssd.dll 위치 직접 확인
  const locs = [
    'C:\\Windows\\System32\\dnssd.dll',
    'C:\\Windows\\SysWOW64\\dnssd.dll',
    'C:\\Program Files\\Bonjour\\dnssd.dll',
    'C:\\Program Files (x86)\\Bonjour\\dnssd.dll',
  ];
  return locs.some(p => fs.existsSync(p));
}

ipcMain.handle('check-bonjour', async () => checkBonjourInstalled());

ipcMain.handle('install-bonjour', async () => {
  if (process.platform !== 'win32') return { success: true };
  try {
    const tmpExe = path.join(os.tmpdir(), 'BonjourSetup.exe');
    const tempScript = path.join(os.tmpdir(), 'boida_install_bonjour.ps1');

    // PowerShell WebClient — TLS 1.2, 자동 리다이렉트, 긴 타임아웃
    const lines = [
      '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
      `$out = '${tmpExe.replace(/'/g, "''")}'`,
      '',
      '# 1. winget 으로 먼저 시도 (Windows 10/11 내장)',
      'try {',
      '  $wg = Get-Command winget -ErrorAction SilentlyContinue',
      '  if ($wg) {',
      '    winget install Apple.Bonjour --silent --accept-package-agreements --accept-source-agreements 2>$null',
      '    if ($LASTEXITCODE -eq 0) { Write-Host "winget OK"; exit 0 }',
      '  }',
      '} catch {}',
      '',
      '# 2. 직접 다운로드 (여러 URL 시도)',
      '$urls = @(',
      '  "https://support.apple.com/downloads/DL999/en_US/BonjourPSSetup.exe",',
      '  "https://downloads.sourceforge.net/project/bonjour-windows/BonjourSetup.exe"',
      ')',
      '$downloaded = $false',
      'foreach ($url in $urls) {',
      '  try {',
      '    Write-Host "다운로드: $url"',
      '    $wc = New-Object System.Net.WebClient',
      '    $wc.Headers.Add("User-Agent", "Mozilla/5.0")',
      '    $wc.DownloadFile($url, $out)',
      '    $downloaded = $true',
      '    break',
      '  } catch { Write-Host "실패: $_" }',
      '}',
      'if (-not $downloaded) { Write-Host "ERR:download_failed"; exit 1 }',
      '',
      '# 3. UAC 권한으로 설치',
      'Start-Process $out -ArgumentList "/quiet", "/norestart" -Verb RunAs -Wait',
      'try { Start-Service "Bonjour Service" -ErrorAction SilentlyContinue } catch {}',
      'Write-Host "Bonjour 설치 완료"',
    ];

    fs.writeFileSync(tempScript, lines.join('\r\n') + '\r\n', 'utf8');
    const result = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScript}"`,
      { timeout: 300000, stdio: 'pipe' }
    ).toString();
    try { fs.unlinkSync(tempScript); } catch {}

    if (result.includes('ERR:download_failed')) {
      return { success: false, error: '다운로드 실패. 인터넷 연결 확인 후 재시도해주세요.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});



ipcMain.handle('restart-app', async () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

// ── Audio Device & Volume Management IPC ───────────────────────
ipcMain.handle('get-audio-devices', async () => {
  const info = getMacOSAudioDevices(currentAudioDeviceId);
  return {
    ...info,
    currentId: currentAudioDeviceId || info.defaultId
  };
});

ipcMain.handle('set-audio-device', async (event, deviceId) => {
  console.log('[보이다] User requested audio device change to ID:', deviceId);
  currentAudioDeviceId = Number(deviceId);
  restartAirPlay(currentAudioDeviceId, currentQualityPreset);
  return { success: true };
});

ipcMain.handle('set-audio-volume', async (event, { volume, deviceId }) => {
  const devId = deviceId || currentAudioDeviceId;
  const res = setMacOSAudioVolume(devId, volume);
  return res;
});

ipcMain.handle('set-audio-mute', async (event, { isMuted, deviceId }) => {
  const devId = deviceId || currentAudioDeviceId;
  const res = setMacOSAudioMute(devId, isMuted);
  return res;
});

// ── Streaming Quality & Bitrate IPC ─────────────────────────────
ipcMain.handle('get-quality-presets', async () => {
  return {
    presets: STREAM_PRESETS,
    currentId: currentQualityPreset,
  };
});

ipcMain.handle('set-quality-preset', async (event, presetId) => {
  if (STREAM_PRESETS[presetId]) {
    console.log('[보이다] User requested quality preset change to:', presetId);
    currentQualityPreset = presetId;
    restartAirPlay(currentAudioDeviceId, currentQualityPreset);
    return { success: true, currentId: currentQualityPreset };
  }
  return { success: false, error: 'Invalid preset' };
});

ipcMain.on('audio-device-changed', () => {
  const info = getMacOSAudioDevices(currentAudioDeviceId);
  console.log('[보이다] Audio device hardware change detected:', info);
  if (mainWindow) {
    mainWindow.webContents.send('audio-devices-updated', {
      ...info,
      currentId: currentAudioDeviceId || info.defaultId
    });
  }
  // 미러링 중이 아닐 때만 새 기본 장치로 조용히 자동 재바인딩
  if (!lastW || lastW === 0) {
    currentAudioDeviceId = info.defaultId;
    restartAirPlay(info.defaultId);
  }
});

// ── GitHub 최신 버전 체크 ─────────────────────────────────────────
function showUpdateMessageBox(options) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return dialog.showMessageBox(mainWindow, options);
  }
  return dialog.showMessageBox(options);
}

function checkForUpdates(isManual = false) {
  const currentVersion = app.getVersion(); // package.json의 version 값
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
  let handled = false;

  const showUpToDate = () => {
    if (!isManual || handled) return;
    handled = true;
    showUpdateMessageBox({
      type: 'info',
      title: '업데이트 확인',
      message: '최신 버전입니다.',
      detail: `현재 보이다(Boida) v${currentVersion}을 사용 중입니다.`,
      buttons: ['확인'],
    }).catch(() => {});
  };

  const showUpdateError = () => {
    if (!isManual || handled) return;
    handled = true;
    showUpdateMessageBox({
      type: 'warning',
      title: '업데이트 확인',
      message: '업데이트를 확인할 수 없습니다.',
      detail: '네트워크 연결을 확인한 후 다시 시도해 주세요.',
      buttons: ['확인'],
    }).catch(() => {});
  };

  const req = https.get(apiUrl, {
    headers: { 'User-Agent': 'Boida-App', 'Accept': 'application/vnd.github.v3+json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        const latestTag = (release.tag_name || '').replace(/^v/, '');
        if (!latestTag) {
          showUpToDate();
          return;
        }

        // 버전 비교: semver 방식 (major.minor.patch)
        const parse = v => v.split('.').map(Number);
        const [curMaj, curMin, curPat] = parse(currentVersion);
        const [latMaj, latMin, latPat] = parse(latestTag);

        const isNewer =
          latMaj > curMaj ||
          (latMaj === curMaj && latMin > curMin) ||
          (latMaj === curMaj && latMin === curMin && latPat > curPat);

        if (isNewer && mainWindow && !mainWindow.isDestroyed()) {
          handled = true;
          mainWindow.webContents.send('update-available', {
            currentVersion,
            latestVersion: latestTag,
            releaseUrl: release.html_url,
            releaseName: release.name || `v${latestTag}`,
            releaseNotes: (release.body || '').slice(0, 400) // 최대 400자
          });
        } else {
          showUpToDate();
        }
      } catch (e) {
        console.log('[보이다] 업데이트 확인 파싱 오류:', e.message);
        showUpdateError();
      }
    });
  });
  req.on('error', (e) => {
    console.log('[보이다] 업데이트 확인 네트워크 오류:', e.message);
    showUpdateError();
  });
  req.setTimeout(8000, () => req.destroy());
}

app.setName('Boida');

app.whenReady().then(async () => {
  // 이전 세션에서 비정상 종료된 uxplay 정리 (cross-platform)
  if (process.platform === 'win32') {
    exec('taskkill /F /IM uxplay.exe 2>nul & exit 0');
  } else {
    exec('killall uxplay 2>/dev/null; true');
  }
  await new Promise(r => setTimeout(r, 400)); // wait for port to be freed
  await startServer(app.isPackaged);
  setDisconnectHandler(restartAirPlay);
  setFrameHandler((frame) => {
    // Custom iOS Sender (AuraCast) frame received
    if (mainWindow) {
      mainWindow.webContents.send('airplay-status', 'connected');
      const d = jpegDims(frame);
      if (d) resizeWindow(d.w, d.h);
    }
  });
  setSenderDisconnectHandler(() => {
    if (mainWindow) {
      mainWindow.webContents.send('airplay-status', 'disconnected');
      lastW = 0; lastH = 0;
      currentRotation = 0;
      mainWindow.webContents.send('rotation-changed', 0);
      mainWindow.setAspectRatio(390 / 760);
    }
  });
  createWindow();

  // Windows 패키지: uxplay-win 존재 여부 확인 → 없으면 다운로드
  if (process.platform === 'win32' && app.isPackaged) {
    const uxplayExe = path.join(UXPLAY_WIN_LOCAL_DIR, 'uxplay.exe');
    if (!fs.existsSync(uxplayExe)) {
      // 렌더러가 준비된 후 다운로드 시작
      mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(downloadAndExtractUxplay, 800);
      });
    } else {
      startAirPlay();
    }
  } else {
    startAirPlay();
  }

  // 앱 시작 3초 후 업데이트 체크 (시작 성능에 영향을 주지 않도록 지연)
  setTimeout(checkForUpdates, 3000);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  airplayGen++; // increment generation to cancel any pending stream connection timers
  if (videoClient) {
    try { videoClient.destroy(); } catch (e) {}
    videoClient = null;
  }
  if (airplayProcess) {
    try { airplayProcess.kill('SIGKILL'); } catch (e) {}
    airplayProcess = null;
  }
  if (process.platform === 'win32') {
    exec('taskkill /F /IM uxplay.exe 2>nul & exit 0');
  } else {
    exec('killall uxplay 2>/dev/null; true');
  }
  await stopServer();
  setTimeout(() => process.exit(0), 100);
});
