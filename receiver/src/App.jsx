import React, { useState, useEffect, useRef, useCallback } from 'react';

const HEADER_H = 38;
const IS_WIN = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

// macOS light gray palette
const C = {
  winBg:        '#f2f2f7',
  headerBg:     'rgba(246,246,246,0.96)',
  headerBorder: 'rgba(0,0,0,0.1)',
  titleText:    '#1d1d1f',
  secondary:    '#6e6e73',
  accent:       '#007aff',
  accentBg:     'rgba(0,122,255,0.08)',
  accentBorder: 'rgba(0,122,255,0.22)',
  redBg:        'rgba(255,59,48,0.08)',
  redBorder:    'rgba(255,59,48,0.22)',
  redText:      '#ff3b30',
  redHoverBg:   'rgba(255,59,48,0.15)',
  redHoverBorder:'rgba(255,59,48,0.4)',
  cardBg:       '#ffffff',
  cardShadow:   '0 1px 4px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06)',
  btnBg:        'rgba(0,0,0,0.055)',
  btnBorder:    'rgba(0,0,0,0.1)',
  btnText:      '#3d3d3d',
};

// ── SVG Icons ─────────────────────────────────────────────────
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const DisconnectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const ExitIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const MinusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

const SpeakerMuteIcon = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);

const VolumeIcon = ({ volume, isMuted, size = 12 }) => {
  if (isMuted || volume === 0) return <SpeakerMuteIcon size={size} />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      {volume > 20 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
      {volume > 65 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
    </svg>
  );
};

const QualityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const RotateIcon = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const triggerIpc = (channel) => {
  try {
    if (window.ipcRenderer) {
      window.ipcRenderer.send(channel);
    }
  } catch (e) {}
};

const AppIcon = ({ size = 16, color = C.accent }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width={size} height={size}>
    <g fill="none" stroke={color} strokeWidth="50" strokeLinecap="round" strokeLinejoin="round">
      <path d="M777.66,375.43v-77.76c0-42.94-34.81-77.76-77.76-77.76H233.35c-42.94,0-77.76,34.81-77.76,77.76v272.15c0,42.94,34.81,77.76,77.76,77.76h350.29"/>
      <path d="M466.63,803.1v-153.96,122.47"/>
      <path d="M349.99,803.1h194.39"/>
    </g>
    <g fill="none" stroke={color} strokeWidth="38" strokeLinecap="round" strokeLinejoin="round">
      <path d="M680.1,523.26c0-19.62,14.56-35.52,32.52-35.52h130.08c17.96,0,32.52,15.9,32.52,35.52v248.65c0,19.62-14.56,35.52-32.52,35.52h-130.08c-17.96,0-32.52-15.9-32.52-35.52v-248.65"/>
      <path d="M761.4,533.56h32.52"/>
      <path d="M777.66,749.82v.26"/>
    </g>
    <g fill="none" stroke={color} strokeWidth="68" strokeLinecap="round" strokeLinejoin="round">
      <path d="M563.82,402.19v63.11"/>
      <path d="M369.43,402.19v63.11"/>
    </g>
  </svg>
);

// ── Multilingual Localization ──────────────────────────────────
const getLocale = () => {
  const lang = (navigator.language || '').toLowerCase();
  return lang.startsWith('ko') ? 'ko' : 'en';
};

const L = {
  ko: {
    title: '보이다',
    subtitle: '아이폰 미러링',
    tools: '도구',
    mirroring: '미러링 중',
    hideScreen: '화면가리기',
    disconnect: '연결끊기',
    zoomIn: '화면 확대 (+)',
    zoomOut: '화면 축소 (-)',
    fitScale: '100% 비율 맞춤',
    close: '종료',
    screenHiddenMsg: '화면이 가려져 있습니다',
    modalClose: '닫기',
    rotate: '화면 회전 (R)',
    orientation: '방향',
    autoRotate: '자동 방향 인지',
    portrait: '세로 (0°)',
    landscape90: '가로 (90° 시계방향)',
    landscape270: '가로 (270° 반시계방향)',
    inverted: '상하 반전 (180°)',
    rotatedToastLandscape: '🔄 가로 모드 자동 전환',
    rotatedToastPortrait: '📱 세로 모드 자동 전환',
  },
  en: {
    title: 'Boida',
    subtitle: 'iPhone Mirroring',
    tools: 'Tools',
    mirroring: 'Mirroring',
    hideScreen: 'Hide Screen',
    disconnect: 'Disconnect',
    zoomIn: 'Zoom In (+)',
    zoomOut: 'Zoom Out (-)',
    fitScale: 'Fit 100%',
    close: 'Exit',
    screenHiddenMsg: 'Screen is hidden',
    modalClose: 'Close',
    rotate: 'Rotate Screen (R)',
    orientation: 'Orientation',
    autoRotate: 'Auto Orientation',
    portrait: 'Portrait (0°)',
    landscape90: 'Landscape (90° CW)',
    landscape270: 'Landscape (270° CCW)',
    inverted: 'Inverted (180°)',
    rotatedToastLandscape: '🔄 Auto switched to Landscape',
    rotatedToastPortrait: '📱 Auto switched to Portrait',
  }
}[getLocale()];

// ── Custom Header ─────────────────────────────────────────────
function Header({
  streaming, screenHidden, onToggleHide, onDisconnect, isFullscreen,
  audioInfo, onSelectAudioDevice, onSetVolume, onSetMute,
  qualityInfo, onSelectQuality,
  rotation = 0, onSetRotation, onToggleRotation,
  autoRotate = false, onToggleAutoRotate
}) {
  const [hoverExit, setHoverExit] = useState(false);
  const [hoverMin, setHoverMin] = useState(false);
  const [hoverToolsBtn, setHoverToolsBtn] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);

  // Floating toolbar state
  const [toolbarHovered, setToolbarHovered] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showRotateMenu, setShowRotateMenu] = useState(false);

  // Tool item hover states
  const [hoverPlus, setHoverPlus] = useState(false);
  const [hoverMinus, setHoverMinus] = useState(false);
  const [hover100, setHover100] = useState(false);
  const [hoverDisc, setHoverDisc] = useState(false);
  const [hoverAudio, setHoverAudio] = useState(false);
  const [hoverQuality, setHoverQuality] = useState(false);
  const [hoverRotate, setHoverRotate] = useState(false);

  const hideTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setToolbarHovered(true);
    if (isFullscreen) setHeaderHovered(true);
  };

  const handleMouseLeave = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setToolbarHovered(false);
      if (isFullscreen) setHeaderHovered(false);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const isToolbarVisible = streaming && (toolbarHovered || showAudioMenu || showQualityMenu || showRotateMenu || pinnedOpen);
  const topPos = isFullscreen ? (headerHovered ? 0 : -HEADER_H) : 0;

  return (
    <>
      {/* Invisible Hover Zone at top of screen to trigger slide down in Fullscreen */}
      {isFullscreen && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: HEADER_H + 16,
            zIndex: 999,
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* Backdrop for open menus */}
      {(showAudioMenu || showQualityMenu || showRotateMenu) && (
        <div
          onClick={() => {
            setShowAudioMenu(false);
            setShowQualityMenu(false);
            setShowRotateMenu(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1005,
          }}
        />
      )}

      {/* Main Title Bar */}
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'fixed', 
          top: topPos, 
          left: 0, 
          right: 0, 
          height: HEADER_H,
          WebkitAppRegion: isFullscreen ? 'no-drag' : 'drag',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          background: C.headerBg,
          borderBottom: `1px solid ${C.headerBorder}`,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1000,
          paddingRight: 12,
          gap: 6,
          transition: 'top 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}
      >
        {/* Left side: App Icon and Status next to traffic lights */}
        <div style={{
          position: 'absolute',
          left: isFullscreen ? 16 : (IS_WIN ? 12 : 80), // Windows: 12px, macOS: 80px
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'none',
          color: '#6e6e73',
          fontFamily: 'system-ui',
          transition: 'left 0.25s',
        }}>
          {streaming ? (
            <>
              <AppIcon size={20} color="#8e8e93" />
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#34c759',
                boxShadow: '0 0 4px rgba(52, 199, 89, 0.6)',
                display: 'inline-block',
              }} />
              <span className="header-mirror-text" style={{ fontSize: 11, fontWeight: 500, color: C.secondary }}>
                {L.mirroring}
              </span>
            </>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />

        {/* Streaming Mode: Compact "도구" pill toggle button on right */}
        {streaming && (
          <button
            onClick={() => setPinnedOpen(p => !p)}
            onMouseEnter={() => setHoverToolsBtn(true)}
            onMouseLeave={() => setHoverToolsBtn(false)}
            title={pinnedOpen ? '도구 패널 고정 해제' : '도구 패널 고정 열기'}
            style={{
              WebkitAppRegion: 'no-drag',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: (pinnedOpen || isToolbarVisible) ? C.accentBg : (hoverToolsBtn ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.035)'),
              border: (pinnedOpen || isToolbarVisible) ? `1px solid ${C.accentBorder}` : '1px solid rgba(0,0,0,0.08)',
              borderRadius: 12,
              padding: '2px 8px',
              color: (pinnedOpen || isToolbarVisible) ? C.accent : (hoverToolsBtn ? C.titleText : C.secondary),
              cursor: 'pointer',
              outline: 'none',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'system-ui',
              transition: 'all 0.15s',
            }}
          >
            <span>{L.tools}</span>
            <span style={{
              display: 'inline-flex',
              transform: isToolbarVisible ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <ChevronDownIcon />
            </span>
          </button>
        )}

        {/* Windows 전용: 최소화 버튼 */}
        {IS_WIN && (
          <button
            onMouseEnter={() => setHoverMin(true)}
            onMouseLeave={() => setHoverMin(false)}
            onClick={() => triggerIpc('window-minimize')}
            title="최소화"
            style={{
              WebkitAppRegion: 'no-drag',
              display: 'flex', alignItems: 'center',
              background: 'none', border: 'none', padding: '4px',
              color: hoverMin ? C.secondary : 'rgba(0,0,0,0.35)',
              cursor: 'pointer', outline: 'none', borderRadius: 4,
              transition: 'color 0.15s',
            }}
          >
            <MinusIcon />
          </button>
        )}

        {/* 종료 */}
        <button
          onMouseEnter={() => setHoverExit(true)}
          onMouseLeave={() => setHoverExit(false)}
          onClick={() => IS_WIN ? triggerIpc('window-close') : window.close()}
          title={L.close}
          style={{
            WebkitAppRegion: 'no-drag',
            display: 'flex', alignItems: 'center',
            background: 'none', border: 'none', padding: '4px',
            color: hoverExit ? C.redText : C.secondary,
            cursor: 'pointer', outline: 'none', borderRadius: 4,
            transition: 'color 0.15s',
          }}
        >
          <ExitIcon />
        </button>
      </div>

      {/* Floating Toolbar: Appears smoothly below the header on hover */}
      {streaming && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: isFullscreen ? (headerHovered ? HEADER_H + 6 : -60) : HEADER_H + 6,
            left: '50%',
            transform: isToolbarVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
            opacity: isToolbarVisible ? 1 : 0,
            pointerEvents: isToolbarVisible ? 'auto' : 'none',
            transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 1010,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14), 0 1px 3px rgba(0, 0, 0, 0.08)',
            borderRadius: 16,
            padding: '2px 5px',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            WebkitAppRegion: 'no-drag',
          }}
        >
          {/* 1. 비율 조절 (확대/100%/축소) - 간격 초슬림 조정 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: 'rgba(0,0,0,0.035)',
            padding: '1px 2px',
            borderRadius: 6,
          }}>
            <button
              onMouseEnter={() => setHoverPlus(true)}
              onMouseLeave={() => setHoverPlus(false)}
              onClick={() => triggerIpc('window-scale-plus')}
              title={L.zoomIn}
              style={{
                WebkitAppRegion: 'no-drag',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hoverPlus ? 'rgba(0,0,0,0.06)' : 'none',
                border: 'none', padding: '2px',
                color: hoverPlus ? C.accent : C.secondary,
                cursor: 'pointer', outline: 'none', borderRadius: 4,
                transition: 'all 0.15s',
              }}
            >
              <PlusIcon />
            </button>

            <button
              onMouseEnter={() => setHover100(true)}
              onMouseLeave={() => setHover100(false)}
              onClick={() => triggerIpc('window-scale-100')}
              title={L.fitScale}
              style={{
                WebkitAppRegion: 'no-drag',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hover100 ? 'rgba(0,0,0,0.06)' : 'none',
                border: 'none', padding: '1px 3px',
                color: hover100 ? C.accent : C.secondary,
                cursor: 'pointer', outline: 'none', borderRadius: 4,
                fontSize: 9.5, fontWeight: 700, fontFamily: 'system-ui',
                transition: 'all 0.15s',
              }}
            >
              100%
            </button>

            <button
              onMouseEnter={() => setHoverMinus(true)}
              onMouseLeave={() => setHoverMinus(false)}
              onClick={() => triggerIpc('window-scale-minus')}
              title={L.zoomOut}
              style={{
                WebkitAppRegion: 'no-drag',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hoverMinus ? 'rgba(0,0,0,0.06)' : 'none',
                border: 'none', padding: '2px',
                color: hoverMinus ? C.accent : C.secondary,
                cursor: 'pointer', outline: 'none', borderRadius: 4,
                transition: 'all 0.15s',
              }}
            >
              <MinusIcon />
            </button>
          </div>

          {/* 2. 구분선 */}
          <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)', margin: '0 1px', flexShrink: 0 }} />

          {/* 3. 화면 가리기 */}
          <button
            onClick={onToggleHide}
            title={screenHidden ? '화면 가리기 해제' : L.hideScreen}
            style={{
              WebkitAppRegion: 'no-drag',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: screenHidden ? C.accentBg : 'none',
              border: screenHidden ? `1px solid ${C.accentBorder}` : '1px solid transparent',
              padding: '3px',
              color: screenHidden ? C.accent : C.secondary,
              cursor: 'pointer', outline: 'none', borderRadius: 5,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!screenHidden) e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
            onMouseLeave={e => { if (!screenHidden) e.currentTarget.style.background = 'none'; }}
          >
            {screenHidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>

          {/* 4. 연결 끊기 */}
          <button
            onMouseEnter={() => setHoverDisc(true)}
            onMouseLeave={() => setHoverDisc(false)}
            onClick={onDisconnect}
            title={L.disconnect}
            style={{
              WebkitAppRegion: 'no-drag',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: hoverDisc ? C.redHoverBg : 'none',
              border: '1px solid transparent',
              padding: '3px',
              color: hoverDisc ? C.redText : C.secondary,
              cursor: 'pointer', outline: 'none', borderRadius: 5,
              transition: 'all 0.15s',
            }}
          >
            <DisconnectIcon />
          </button>

          {/* 5. 구분선 */}
          <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)', margin: '0 1px', flexShrink: 0 }} />

          {/* 6. 화질 / 비트레이트 설정 버튼 */}
          {qualityInfo && qualityInfo.presets && (
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setHoverQuality(true)}
                onMouseLeave={() => setHoverQuality(false)}
                onClick={() => {
                  setShowQualityMenu(v => !v);
                  setShowAudioMenu(false);
                }}
                title="화질 및 비트레이트 설정"
                style={{
                  WebkitAppRegion: 'no-drag',
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: showQualityMenu ? C.accentBg : (hoverQuality ? 'rgba(0,0,0,0.05)' : 'none'),
                  border: showQualityMenu ? `1px solid ${C.accentBorder}` : '1px solid transparent',
                  borderRadius: 5,
                  padding: '2px 5px',
                  color: showQualityMenu ? C.accent : (hoverQuality ? C.titleText : C.secondary),
                  cursor: 'pointer', outline: 'none',
                  fontSize: 10.5, fontWeight: 500, fontFamily: 'system-ui',
                  transition: 'all 0.15s',
                }}
              >
                <QualityIcon />
                <span style={{ maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {qualityInfo.presets[qualityInfo.currentId]?.shortName || qualityInfo.presets[qualityInfo.currentId]?.name.split(' ')[0] || '화질'}
                </span>
                <ChevronDownIcon />
              </button>
            </div>
          )}

          {/* 7. 오디오 출력 장치 & 볼륨 선택 버튼 (장치명 숨김, 스피커 아이콘 + 볼륨 수치만 표시) */}
          {audioInfo && (
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setHoverAudio(true)}
                onMouseLeave={() => setHoverAudio(false)}
                onWheel={(e) => {
                  e.stopPropagation();
                  if (onSetVolume) {
                    const delta = e.deltaY < 0 ? 5 : -5;
                    const cur = audioInfo.volume != null ? audioInfo.volume : 70;
                    const nextV = Math.max(0, Math.min(100, cur + delta));
                    onSetVolume(nextV);
                  }
                }}
                onClick={() => {
                  setShowAudioMenu(v => !v);
                  setShowQualityMenu(false);
                }}
                title="사운드 볼륨 및 출력 기기 (클릭 시 기기 선택, 휠로 볼륨 변경)"
                style={{
                  WebkitAppRegion: 'no-drag',
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: showAudioMenu ? C.accentBg : (hoverAudio ? 'rgba(0,0,0,0.05)' : 'none'),
                  border: showAudioMenu ? `1px solid ${C.accentBorder}` : '1px solid transparent',
                  borderRadius: 5,
                  padding: '2px 5px',
                  color: showAudioMenu ? C.accent : (hoverAudio ? C.titleText : C.secondary),
                  cursor: 'pointer', outline: 'none',
                  fontSize: 10.5, fontWeight: 500, fontFamily: 'system-ui',
                  transition: 'all 0.15s',
                }}
              >
                <VolumeIcon volume={audioInfo.volume != null ? audioInfo.volume : 70} isMuted={audioInfo.isMuted} size={12} />
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: audioInfo.isMuted ? C.redText : (showAudioMenu ? C.accent : C.secondary),
                }}>
                  {audioInfo.isMuted ? '음소거' : `${audioInfo.volume != null ? audioInfo.volume : 70}%`}
                </span>
                <ChevronDownIcon />
              </button>
            </div>
          )}

          {/* 8. 구분선 */}
          <div style={{ width: 1, height: 12, background: 'rgba(0,0,0,0.1)', margin: '0 1px', flexShrink: 0 }} />

          {/* 9. 화면 회전 (가로/세로) 버튼 */}
          <div style={{ position: 'relative' }}>
            <button
              onMouseEnter={() => setHoverRotate(true)}
              onMouseLeave={() => setHoverRotate(false)}
              onClick={() => {
                if (onToggleRotation) onToggleRotation();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowRotateMenu(v => !v);
                setShowAudioMenu(false);
                setShowQualityMenu(false);
              }}
              title={`${L.rotate} (우클릭: 상세 메뉴)`}
              style={{
                WebkitAppRegion: 'no-drag',
                display: 'flex', alignItems: 'center', gap: 3,
                background: showRotateMenu ? C.accentBg : (hoverRotate ? 'rgba(0,0,0,0.05)' : 'none'),
                border: showRotateMenu ? `1px solid ${C.accentBorder}` : '1px solid transparent',
                borderRadius: 5,
                padding: '2px 5px',
                color: (rotation !== 0 || showRotateMenu) ? C.accent : (hoverRotate ? C.titleText : C.secondary),
                cursor: 'pointer', outline: 'none',
                fontSize: 10.5, fontWeight: 500, fontFamily: 'system-ui',
                transition: 'all 0.15s',
              }}
            >
              <RotateIcon size={12} />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: (rotation !== 0 || showRotateMenu) ? C.accent : C.secondary,
              }}>
                {rotation === 0 ? '세로' : (rotation === 90 ? '가로' : (rotation === 270 ? '270°' : '180°'))}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRotateMenu(v => !v);
                  setShowAudioMenu(false);
                  setShowQualityMenu(false);
                }}
                style={{ display: 'inline-flex', padding: '1px' }}
                title="회전 옵션 메뉴"
              >
                <ChevronDownIcon />
              </span>
            </button>
          </div>

          {/* 화질 드롭다운 팝오버 (툴바 하단에 중앙 정렬) */}
          {showQualityMenu && qualityInfo && qualityInfo.presets && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 250,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)',
              padding: '6px',
              zIndex: 1020,
              WebkitAppRegion: 'no-drag',
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.secondary,
                padding: '6px 8px 4px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                marginBottom: 4,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>화질 및 비트레이트</span>
                <span style={{ fontSize: 10, color: '#8e8e93', fontWeight: 400 }}>선택 시 자동 재적용</span>
              </div>
              {Object.values(qualityInfo.presets).map(preset => {
                const isSelected = preset.id === qualityInfo.currentId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectQuality(preset.id);
                      setShowQualityMenu(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '7px 8px',
                      borderRadius: 6,
                      background: isSelected ? C.accentBg : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'background 0.12s',
                      marginBottom: 2,
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{
                        color: isSelected ? C.accent : C.titleText,
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 500,
                      }}>
                        {preset.name}
                      </span>
                      <span style={{
                        fontSize: 10,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: isSelected ? C.accent : 'rgba(0,0,0,0.06)',
                        color: isSelected ? '#fff' : C.secondary,
                        fontWeight: 500,
                      }}>
                        {preset.tag}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: isSelected ? 'rgba(0, 122, 255, 0.8)' : '#8e8e93',
                      marginTop: 2,
                    }}>
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 오디오 장치 & 볼륨 조절 드롭다운 팝오버 (툴바 하단에 중앙 정렬) */}
          {showAudioMenu && audioInfo && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 235,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)',
              padding: '8px 10px',
              zIndex: 1020,
              WebkitAppRegion: 'no-drag',
            }}>
              {/* 볼륨 조절 섹션 헤더 */}
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.secondary,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <span>소리 볼륨</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: audioInfo.isMuted ? C.redText : C.accent,
                }}>
                  {audioInfo.isMuted ? '음소거됨' : `${audioInfo.volume != null ? audioInfo.volume : 70}%`}
                </span>
              </div>

              {/* 볼륨 슬라이더 및 음소거 버튼 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '2px 0 6px',
              }}>
                <button
                  onClick={() => onSetMute && onSetMute(!audioInfo.isMuted)}
                  title={audioInfo.isMuted ? '음소거 해제' : '음소거'}
                  style={{
                    background: audioInfo.isMuted ? C.redHoverBg : 'rgba(0,0,0,0.05)',
                    border: audioInfo.isMuted ? `1px solid ${C.redHoverBorder}` : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 6,
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: audioInfo.isMuted ? C.redText : C.secondary,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <VolumeIcon volume={audioInfo.volume != null ? audioInfo.volume : 70} isMuted={audioInfo.isMuted} size={14} />
                </button>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={audioInfo.isMuted ? 0 : (audioInfo.volume != null ? audioInfo.volume : 70)}
                  onChange={(e) => onSetVolume && onSetVolume(Number(e.target.value))}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    accentColor: C.accent,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                />
              </div>

              {/* 기기 목록 구분선 */}
              {audioInfo.devices && audioInfo.devices.length > 0 && (
                <>
                  <div style={{
                    height: 1,
                    background: 'rgba(0,0,0,0.06)',
                    margin: '6px 0',
                  }} />

                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.secondary,
                    padding: '2px 0 4px',
                  }}>
                    사운드 출력 기기
                  </div>

                  {audioInfo.devices.map(dev => {
                    const isSelected = dev.id === audioInfo.currentId;
                    return (
                      <button
                        key={dev.id}
                        onClick={() => {
                          onSelectAudioDevice(dev.id);
                          setShowAudioMenu(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: isSelected ? C.accentBg : 'none',
                          border: 'none',
                          color: isSelected ? C.accent : C.titleText,
                          fontSize: 12,
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'background 0.12s',
                          marginBottom: 2,
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = 'none';
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
                          {dev.name}
                        </span>
                        {isSelected && <span style={{ fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* 회전 모드 드롭다운 팝오버 */}
          {showRotateMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 220,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)',
              padding: '6px',
              zIndex: 1020,
              WebkitAppRegion: 'no-drag',
            }}>
              {/* 회전 메뉴 헤더 */}
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.secondary,
                padding: '6px 8px 6px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                marginBottom: 4,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>화면 회전 및 방향</span>
                <span style={{ fontSize: 9.5, color: '#8e8e93', fontWeight: 400 }}>단축키: R</span>
              </div>

              {/* 스마트 자동 방향 인지 토글 */}
              <button
                onClick={() => {
                  if (onToggleAutoRotate) onToggleAutoRotate();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: autoRotate ? C.accentBg : 'none',
                  border: autoRotate ? `1px solid ${C.accentBorder}` : '1px solid transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>⚡</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: autoRotate ? C.accent : C.titleText }}>
                      {L.autoRotate}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#8e8e93' }}>
                      카메라 가로/세로 방향 자동 감지
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: autoRotate ? C.accent : '#8e8e93',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: autoRotate ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0,0,0,0.06)',
                }}>
                  {autoRotate ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 수동 회전 옵션 리스트 */}
              {[
                { angle: 0, label: L.portrait, icon: '📱' },
                { angle: 90, label: L.landscape90, icon: '🔄' },
                { angle: 270, label: L.landscape270, icon: '🔄' },
                { angle: 180, label: L.inverted, icon: '🔃' },
              ].map(opt => {
                const isSelected = rotation === opt.angle;
                return (
                  <button
                    key={opt.angle}
                    onClick={() => {
                      if (onSetRotation) onSetRotation(opt.angle);
                      setShowRotateMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 8px',
                      background: isSelected ? 'rgba(0, 122, 255, 0.08)' : 'none',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: isSelected ? C.accent : C.titleText,
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'none';
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {isSelected && <span style={{ color: C.accent, fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}


// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const canvasRef    = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [screenHidden, setScreenHidden] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstInstalling, setGstInstalling] = useState(false);
  const [gstError, setGstError] = useState('');
  const [gstDone, setGstDone] = useState(false);
  const [showBonjourModal, setShowBonjourModal] = useState(false);
  const [bonjourInstalling, setBonjourInstalling] = useState(false);
  const [bonjourError, setBonjourError] = useState('');
  const [bonjourDone, setBonjourDone] = useState(false);
  const [uxplayError, setUxplayError] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [download, setDownload] = useState(null); // null | { percent, status, error }
  const [serverInfo, setServerInfo] = useState(null);
  const [audioInfo, setAudioInfo] = useState(null);
  const [qualityInfo, setQualityInfo] = useState(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [autoRotate, setAutoRotate] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);

  const rotationRef = useRef(0);
  const autoRotateRef = useRef(false);
  const autoDetectRef = useRef({
    lastCheck: 0,
    offscreenCanvas: null,
    offscreenCtx: null,
    streakLandscape: 0,
    streakPortrait: 0,
  });

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 1800);
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate(prev => {
      const next = !prev;
      showToast(next ? '⚡ 자동 방향 인지: 켜짐' : '⚡ 자동 방향 인지: 꺼짐');
      return next;
    });
  }, [showToast]);

  const lastFrameRef = useRef(0);
  const busyRef      = useRef(false);
  const pendingRef   = useRef(null);
  const volumeDebounceRef = useRef(null);

  const handleSelectAudioDevice = useCallback((deviceId) => {
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('set-audio-device', deviceId).catch(() => {});
      setAudioInfo(prev => prev ? ({ ...prev, currentId: deviceId }) : null);
    }
  }, []);

  const handleSetVolume = useCallback((newVol) => {
    setAudioInfo(prev => prev ? ({ ...prev, volume: newVol, isMuted: newVol === 0 }) : null);
    if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
    volumeDebounceRef.current = setTimeout(() => {
      if (window.ipcRenderer) {
        window.ipcRenderer.invoke('set-audio-volume', { volume: newVol, deviceId: audioInfo?.currentId }).catch(() => {});
      }
    }, 40);
  }, [audioInfo?.currentId]);

  const handleSetMute = useCallback((isMuted) => {
    setAudioInfo(prev => prev ? ({ ...prev, isMuted }) : null);
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('set-audio-mute', { isMuted, deviceId: audioInfo?.currentId }).catch(() => {});
    }
  }, [audioInfo?.currentId]);

  const handleSelectQuality = useCallback((presetId) => {
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('set-quality-preset', presetId).then(res => {
        if (res && res.success) {
          setQualityInfo(prev => prev ? ({ ...prev, currentId: res.currentId }) : null);
        }
      }).catch(() => {});
    }
  }, []);

  const handleSetRotation = useCallback((angle) => {
    const norm = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
    rotationRef.current = norm;
    setRotation(norm);
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('set-rotation', norm).catch(() => {});
    }
  }, []);

  const handleToggleRotation = useCallback(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('toggle-rotation').then(res => {
        if (res && res.success) {
          rotationRef.current = res.rotation;
          setRotation(res.rotation);
          if (res.rotation === 90 || res.rotation === 270) {
            showToast(L.landscape90);
          } else {
            showToast(L.portrait);
          }
        }
      }).catch(() => {});
    } else {
      setRotation(r => {
        const next = r === 0 ? 90 : (r === 90 ? 270 : 0);
        rotationRef.current = next;
        showToast(next === 0 ? L.portrait : L.landscape90);
        return next;
      });
    }
  }, [showToast]);

  const detectOrientation = useCallback((bitmap) => {
    try {
      if (!autoDetectRef.current.offscreenCanvas) {
        const c = document.createElement('canvas');
        c.width = 108;
        c.height = 192;
        autoDetectRef.current.offscreenCanvas = c;
        autoDetectRef.current.offscreenCtx = c.getContext('2d', { willReadFrequently: true });
      }
      const octx = autoDetectRef.current.offscreenCtx;
      if (!octx) return;
      octx.drawImage(bitmap, 0, 0, 108, 192);
      const imgData = octx.getImageData(0, 0, 108, 192);
      const data = imgData.data;

      const getLum = (x, y) => {
        const cx = Math.max(0, Math.min(107, Math.round(x)));
        const cy = Math.max(0, Math.min(191, Math.round(y)));
        const i = (cy * 108 + cx) * 4;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };

      // ── 1. 카메라 앱 시그니처 판별 (셔터 버튼 탐색) ──────────────────────────
      // 카메라 앱의 독점적 특징: 하단 중앙(x ≈ 54, y ≈ 172)에 밝은 흰색 셔터 버튼(lum > 105)이 있고,
      // 그 양옆(x = 24, x = 84)은 완전히 검은색(lum < 42)입니다.
      let maxShutterBottom = 0;
      for (let sy = 164; sy <= 184; sy += 3) {
        for (let sx = 46; sx <= 62; sx += 4) {
          const l = getLum(sx, sy);
          if (l > maxShutterBottom) maxShutterBottom = l;
        }
      }
      const flankBL = getLum(24, 174);
      const flankBR = getLum(84, 174);
      const hasBottomShutter = (maxShutterBottom > 105 && flankBL < 42 && flankBR < 42);

      // 시계방향 270도 회전 시 셔터 버튼이 상단(y ≈ 18)으로 이동
      let maxShutterTop = 0;
      for (let sy = 10; sy <= 28; sy += 3) {
        for (let sx = 46; sx <= 62; sx += 4) {
          const l = getLum(sx, sy);
          if (l > maxShutterTop) maxShutterTop = l;
        }
      }
      const flankTL = getLum(24, 18);
      const flankTR = getLum(84, 18);
      const hasTopShutter = (maxShutterTop > 105 && flankTL < 42 && flankTR < 42);

      const isCameraApp = (hasBottomShutter || hasTopShutter);

      // 카메라 앱이 아니면 (유튜브, 사파리, 홈 화면 등) 절대 소프트웨어 회전을 개입하지 않음!
      if (!isCameraApp) {
        autoDetectRef.current.streakLandscape = 0;
        autoDetectRef.current.streakPortrait = 0;
        // 카메라 앱에서 나갔을 경우 즉시 0도로 복구
        if (rotationRef.current !== 0) {
          handleSetRotation(0);
        }
        return;
      }

      // ── 2. 카메라 앱 내 방향(가로/세로) 판정 ─────────────────────────────────
      const rowAvg = (y) => {
        let sum = 0, count = 0;
        for (let x = 24; x <= 84; x += 4) {
          sum += getLum(x, y);
          count++;
        }
        return count > 0 ? (sum / count) : 0;
      };

      const lumTop = rowAvg(28);
      const lumCenter = (rowAvg(80) + rowAvg(96) + rowAvg(112)) / 3;
      const contrastTop = lumCenter - lumTop;
      const ratioTop = lumCenter > 10 ? (lumTop / lumCenter) : 1.0;

      let targetAngle = 0;
      let isLandscape = false;
      let isPortrait = false;

      if (hasTopShutter) {
        // 셔터가 상단에 있으면 시계방향 270도 가로 모드
        isLandscape = true;
        targetAngle = 270;
      } else if (lumCenter > 25) {
        // 하단에 셔터가 있는 일반 상태:
        // 가로 모드: 상단(y=28)이 상단 검은 바가 됨 (ratio < 0.65 또는 contrast >= 25)
        // 세로 모드: 상단(y=28)이 활성 뷰파인더 영상 (ratio >= 0.70 및 contrast < 22)
        if (contrastTop >= 25 || ratioTop < 0.65) {
          isLandscape = true;
          targetAngle = 90;
        } else if (contrastTop < 20 && ratioTop >= 0.70) {
          isPortrait = true;
          targetAngle = 0;
        }
      }

      // Streaks & Hysteresis
      if (isLandscape && !isPortrait) {
        autoDetectRef.current.streakLandscape++;
        autoDetectRef.current.streakPortrait = 0;
      } else if (isPortrait && !isLandscape) {
        autoDetectRef.current.streakPortrait++;
        autoDetectRef.current.streakLandscape = 0;
      } else {
        autoDetectRef.current.streakLandscape = Math.max(0, autoDetectRef.current.streakLandscape - 1);
        autoDetectRef.current.streakPortrait = Math.max(0, autoDetectRef.current.streakPortrait - 1);
      }

      // Diagnostic logging to Electron terminal
      if (window.ipcRenderer) {
        window.ipcRenderer.send('log-detect', {
          cam: isCameraApp,
          top: Math.round(lumTop),
          center: Math.round(lumCenter),
          contrast: Math.round(contrastTop),
          ratio: Number(ratioTop.toFixed(2)),
          streakL: autoDetectRef.current.streakLandscape,
          streakP: autoDetectRef.current.streakPortrait,
          rot: rotationRef.current
        });
      }

      // 2회 연속 감지(~600ms) 시 부드럽게 전환
      if (autoDetectRef.current.streakLandscape >= 2 && rotationRef.current !== targetAngle && targetAngle !== 0) {
        handleSetRotation(targetAngle);
        showToast(targetAngle === 270 ? L.landscape270 : L.rotatedToastLandscape);
        autoDetectRef.current.streakLandscape = 0;
      } else if (autoDetectRef.current.streakPortrait >= 2 && rotationRef.current !== 0) {
        handleSetRotation(0);
        showToast(L.rotatedToastPortrait);
        autoDetectRef.current.streakPortrait = 0;
      }
    } catch (_) {}
  }, [handleSetRotation, showToast]);

  const handleGstInstall = useCallback(async () => {
    if (!window.ipcRenderer) return;
    setGstInstalling(true);
    setGstError('');
    try {
      const result = await window.ipcRenderer.invoke('install-gstreamer');
      if (result && result.success) {
        setGstDone(true);
      } else {
        setGstError(result?.error || '설치에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (e) {
      setGstError('설치 중 오류가 발생했습니다: ' + (e?.message || String(e)));
    }
    setGstInstalling(false);
  }, []);

  const handleBonjourInstall = useCallback(async () => {
    if (!window.ipcRenderer) return;
    setBonjourInstalling(true);
    setBonjourError('');
    try {
      const result = await window.ipcRenderer.invoke('install-bonjour');
      if (result && result.success) {
        setBonjourDone(true);
      } else {
        setBonjourError(result?.error || '설치에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (e) {
      setBonjourError('설치 중 오류가 발생했습니다: ' + (e?.message || String(e)));
    }
    setBonjourInstalling(false);
  }, []);

  const handleGstRestart = useCallback(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('restart-app').catch(() => {});
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setStreaming(false);
    setScreenHidden(false);
    setRotation(0);
    lastFrameRef.current = 0;
    fetch('/api/disconnect', { method: 'POST' }).catch(() => {});
  }, []);

  const drawFrame = useCallback(async (ab) => {
    if (busyRef.current) { pendingRef.current = ab; return; }
    busyRef.current = true;
    try {
      let bitmap;
      try {
        bitmap = await createImageBitmap(new Blob([ab], { type: 'image/jpeg' }), { colorSpaceConversion: 'none' });
      } catch (_) {
        bitmap = await createImageBitmap(new Blob([ab], { type: 'image/jpeg' }));
      }

      // Auto-orientation detection for portrait camera stream
      if (autoRotateRef.current && bitmap.width < bitmap.height) {
        const now = Date.now();
        if (now - autoDetectRef.current.lastCheck > 350) {
          autoDetectRef.current.lastCheck = now;
          detectOrientation(bitmap);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const cw = canvas.offsetWidth * dpr;
        const ch = canvas.offsetHeight * dpr;
        if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentRot = rotationRef.current;
        const isRot90 = (currentRot === 90 || currentRot === 270);
        const srcW = isRot90 ? bitmap.height : bitmap.width;
        const srcH = isRot90 ? bitmap.width : bitmap.height;
        const canvasW = canvas.width;
        const canvasH = canvas.height;

        // Calculate aspect ratio fit (letterbox/pillarbox)
        const ratio = Math.min(canvasW / srcW, canvasH / srcH);
        const drawW = bitmap.width * ratio;
        const drawH = bitmap.height * ratio;

        ctx.save();
        ctx.translate(canvasW / 2, canvasH / 2);
        if (currentRot !== 0) {
          ctx.rotate((currentRot * Math.PI) / 180);
        }
        ctx.drawImage(bitmap, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }
      bitmap.close();
    } catch (_) {}
    busyRef.current = false;
    if (pendingRef.current) { const n = pendingRef.current; pendingRef.current = null; drawFrame(n); }
  }, [detectOrientation]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let ws, retryTimer;
    let disposed = false;

    fetch('/api/info')
      .then(r => r.json())
      .then(d => setServerInfo(d))
      .catch(() => {});

    // 시작 시 GStreamer 확인
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('check-gstreamer').then(installed => {
        if (!installed) setShowGstModal(true);
        else {
          // GStreamer OK → Windows에서 Bonjour 추가 확인
          window.ipcRenderer.invoke('check-bonjour').then(ok => {
            if (!ok) setShowBonjourModal(true);
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    function connect() {
      ws = new WebSocket(`ws://${window.location.host}/ws`);
      ws.binaryType = 'arraybuffer';
      ws.onmessage = ({ data }) => {
        if (!(data instanceof ArrayBuffer)) return;
        lastFrameRef.current = Date.now();
        setStreaming(true);
        drawFrame(data);
      };
      ws.onclose = () => {
        if (!disposed) {
          retryTimer = setTimeout(connect, 800);
        }
      };
      ws.onerror  = () => ws.close();
    }
    connect();

    // Listen for events from Electron main process
    if (window.ipcRenderer) {
      const handleFs = (event, val) => {
        setIsFullscreen(val);
      };
      const handleStatus = (event, status) => {
        if (status === 'connected') {
          setStreaming(true);
        } else if (status === 'disconnected') {
          console.log('[보이다] AirPlay session closed by user. Restoring state...');
          handleDisconnect();
        }
      };

      window.ipcRenderer.on('fullscreen-changed', handleFs);
      window.ipcRenderer.on('airplay-status', handleStatus);

      const handleUpdate = (event, info) => setUpdateInfo(info);
      window.ipcRenderer.on('update-available', handleUpdate);

      const handleUxplayCrash = (event, msg) => setUxplayError(msg);
      const handleUxplayOutput = (event, msg) => console.log('[uxplay]', msg);
      window.ipcRenderer.on('uxplay-crash', handleUxplayCrash);
      window.ipcRenderer.on('uxplay-output', handleUxplayOutput);

      // uxplay-win 런타임 다운로드 이벤트
      const handleDlProgress = (_, { percent, status }) =>
        setDownload(d => ({ ...(d || {}), percent, status, error: null }));
      const handleDlDone = () =>
        setTimeout(() => setDownload(null), 1200);
      const handleDlError = (_, { message }) =>
        setDownload(d => ({ ...(d || {}), error: message }));
      window.ipcRenderer.on('uxplay-download-progress', handleDlProgress);
      window.ipcRenderer.on('uxplay-download-done',     handleDlDone);
      window.ipcRenderer.on('uxplay-download-error',    handleDlError);

      // 오디오 장치 목록 및 화질 프리셋 초기 로드
      window.ipcRenderer.invoke('get-audio-devices').then(info => {
        if (info && info.devices) setAudioInfo(info);
      }).catch(() => {});

      window.ipcRenderer.invoke('get-quality-presets').then(info => {
        if (info && info.presets) setQualityInfo(info);
      }).catch(() => {});

      const handleRotation = (event, rot) => {
        setRotation(rot);
      };
      window.ipcRenderer.on('rotation-changed', handleRotation);
      window.ipcRenderer.invoke('get-rotation').then(rot => {
        if (typeof rot === 'number') setRotation(rot);
      }).catch(() => {});

      const handleAudioUpdate = (event, info) => {
        if (info && info.devices) setAudioInfo(info);
      };
      window.ipcRenderer.on('audio-devices-updated', handleAudioUpdate);

      const handleDeviceChange = () => {
        window.ipcRenderer.send('audio-device-changed');
        window.ipcRenderer.invoke('get-audio-devices').then(info => {
          if (info && info.devices) setAudioInfo(info);
        }).catch(() => {});
      };
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      }

      return () => {
        disposed = true;
        clearTimeout(retryTimer);
        ws?.close();
        window.ipcRenderer.removeListener('fullscreen-changed', handleFs);
        window.ipcRenderer.removeListener('airplay-status', handleStatus);
        window.ipcRenderer.removeListener('update-available', handleUpdate);
        window.ipcRenderer.removeListener('uxplay-crash', handleUxplayCrash);
        window.ipcRenderer.removeListener('uxplay-output', handleUxplayOutput);
        window.ipcRenderer.removeListener('uxplay-download-progress', handleDlProgress);
        window.ipcRenderer.removeListener('uxplay-download-done',     handleDlDone);
        window.ipcRenderer.removeListener('uxplay-download-error',    handleDlError);
        window.ipcRenderer.removeListener('audio-devices-updated',    handleAudioUpdate);
        window.ipcRenderer.removeListener('rotation-changed',         handleRotation);
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
        }
      };
    }

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, [drawFrame, handleDisconnect]);

  // 키보드 단축키 'R': 회전 토글
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'r' || e.key === 'R') {
        if (streaming) {
          handleToggleRotation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [streaming, handleToggleRotation]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: streaming ? '#000' : C.winBg,
      position: 'relative', overflow: 'hidden', userSelect: 'none',
    }}>

      {/* uxplay-win 다운로드 화면 (Windows 최초 실행 시) */}
      {download !== null && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20000,
          background: `linear-gradient(160deg, #f5f5f7 0%, #e8e8ed 100%)`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 28,
          paddingTop: HEADER_H,
        }}>
          {/* 아이콘 */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(58,96,204,0.28)',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="dl-bg" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#6b8ff0"/>
                  <stop offset="1" stopColor="#3a60cc"/>
                </linearGradient>
              </defs>
              <rect fill="url(#dl-bg)" width="1024" height="1024" rx="230"/>
              <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
                <path strokeWidth="50" d="M823.03,374.92v-77.76c0-42.94-34.81-77.76-77.76-77.76h-466.55c-42.94,0-77.76,34.81-77.76,77.76v272.15c0,42.94,34.81,77.76,77.76,77.76h350.29"/>
                <path strokeWidth="38" d="M725.47,522.75c0-19.62,14.56-35.52,32.52-35.52h130.08c17.96,0,32.52,15.9,32.52,35.52v248.65c0,19.62-14.56,35.52-32.52,35.52h-130.08c-17.96,0-32.52-15.9-32.52-35.52v-248.65"/>
              </g>
            </svg>
          </div>

          {/* 타이틀 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 17, fontWeight: 700, color: C.titleText,
              fontFamily: 'system-ui', marginBottom: 6,
            }}>
              {download.error ? '다운로드 실패' : '화면 공유 엔진 다운로드 중...'}
            </div>
            <div style={{ fontSize: 12.5, color: C.secondary, fontFamily: 'system-ui' }}>
              {download.error
                ? download.error
                : '최초 실행 시 1회만 진행됩니다 (~60솄0)'
              }
            </div>
          </div>

          {/* 프로그레스 바 */}
          {!download.error && (
            <div style={{ width: '70%', maxWidth: 240 }}>
              <div style={{
                height: 6, borderRadius: 3,
                background: 'rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${download.percent || 0}%`,
                  background: `linear-gradient(90deg, ${C.accent}, #5a9eff)`,
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{
                marginTop: 8, fontSize: 11, color: C.secondary,
                fontFamily: 'system-ui', textAlign: 'center',
              }}>
                {download.status}
              </div>
            </div>
          )}

          {/* 에러 시 재시도 안내 */}
          {download.error && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: C.secondary, fontFamily: 'system-ui', marginBottom: 12 }}>
                인터넷 연결을 확인하고 앱을 재시작해 주세요.
              </div>
              <button
                onClick={() => triggerIpc('window-close')}
                style={{
                  background: C.accent, border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  padding: '8px 20px', borderRadius: 10,
                  cursor: 'pointer', fontFamily: 'system-ui',
                }}
              >
                닫기
              </button>
            </div>
          )}
        </div>
      )}
      <Header
        streaming={streaming}
        screenHidden={screenHidden}
        onToggleHide={() => setScreenHidden(h => !h)}
        onDisconnect={handleDisconnect}
        isFullscreen={isFullscreen}
        audioInfo={audioInfo}
        onSelectAudioDevice={handleSelectAudioDevice}
        onSetVolume={handleSetVolume}
        onSetMute={handleSetMute}
        qualityInfo={qualityInfo}
        onSelectQuality={handleSelectQuality}
        rotation={rotation}
        onSetRotation={handleSetRotation}
        onToggleRotation={handleToggleRotation}
        autoRotate={autoRotate}
        onToggleAutoRotate={handleToggleAutoRotate}
      />

      {/* 회전 상태 알림 토스트 (예: 🔄 가로 모드 자동 전환) */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.82)',
          color: '#fff',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 11.5,
          fontWeight: 500,
          fontFamily: 'system-ui',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 1050,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {toastMsg}
        </div>
      )}

      {/* Video canvas */}
      <canvas ref={canvasRef} style={{
        position: 'absolute',
        top: isFullscreen ? 0 : HEADER_H, 
        left: 0, 
        right: 0, 
        bottom: 0,
        width: '100%', 
        height: isFullscreen ? '100%' : `calc(100% - ${HEADER_H}px)`,
        display: streaming ? 'block' : 'none',
      }} />

      {/* Screen-hide overlay */}
      {streaming && screenHidden && (
        <div style={{
          position: 'absolute', 
          top: isFullscreen ? 0 : HEADER_H, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: C.winBg, zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12,
        }}>
          <EyeOffIcon />
          <span style={{ fontSize: 14, color: C.secondary, fontFamily: 'system-ui' }}>
            {L.screenHiddenMsg}
          </span>
        </div>
      )}

      {/* uxplay 크래시 알림 토스트 */}
      {uxplayError && (
        <div style={{
          position: 'absolute', bottom: 20, left: 16, right: 16,
          background: 'rgba(255,59,48,0.92)', backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '12px 14px', zIndex: 9999,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" width="18" height="18" style={{flexShrink:0,marginTop:1}}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{flex:1}}>
            <div style={{color:'#fff',fontSize:12,fontWeight:600,fontFamily:'system-ui',lineHeight:1.4}}>{uxplayError}</div>
          </div>
          <button onClick={() => setUxplayError('')} style={{
            background:'none',border:'none',color:'rgba(255,255,255,0.7)',fontSize:16,cursor:'pointer',padding:0,lineHeight:1
          }}>✕</button>
        </div>
      )}

      {/* Waiting screen */}
      {!streaming && (
        <div style={{
          position: 'absolute',
          top: HEADER_H, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          background: `linear-gradient(160deg, #f5f5f7 0%, #e8e8ed 100%)`,
          padding: '24px 32px 32px',
          gap: 0,
        }}>
          {/* Top spacer to push contents down to center-ish */}
          <div style={{ flex: 1.5 }} />

          {/* Main Logo & Info Group (Positioned slightly above vertical center) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateY(-25px)', // 화면 세로 정중앙에서 살짝 위로 이동
            flexShrink: 0,
          }}>
            {/* App icon */}
            <div style={{
              width: 80, height: 80, borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(58,96,204,0.28), 0 2px 8px rgba(0,0,0,0.12)',
              marginBottom: 16, flexShrink: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs>
                  <linearGradient id="bg-grad" x1="0" y1="1024" x2="1" y2="1023"
                    gradientTransform="translate(0 1048576) scale(1024 -1024)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#6b8ff0"/>
                    <stop offset="1" stopColor="#3a60cc"/>
                  </linearGradient>
                </defs>
                <rect fill="url(#bg-grad)" width="1024" height="1024" rx="230" ry="230"/>
                <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
                  <path strokeWidth="50" d="M823.03,374.92v-77.76c0-42.94-34.81-77.76-77.76-77.76h-466.55c-42.94,0-77.76,34.81-77.76,77.76v272.15c0,42.94,34.81,77.76,77.76,77.76h350.29"/>
                  <path strokeWidth="50" d="M512,802.59v-153.96,122.47"/>
                  <path strokeWidth="50" d="M395.36,802.59h194.39"/>
                  <path strokeWidth="38" d="M725.47,522.75c0-19.62,14.56-35.52,32.52-35.52h130.08c17.96,0,32.52,15.9,32.52,35.52v248.65c0,19.62-14.56,35.52-32.52,35.52h-130.08c-17.96,0-32.52-15.9-32.52-35.52v-248.65"/>
                  <path strokeWidth="38" d="M806.77,533.06h32.52"/>
                  <path strokeWidth="38" d="M823.03,749.32v.26"/>
                  <path strokeWidth="68" d="M609.2,401.69v63.11"/>
                  <path strokeWidth="68" d="M414.8,401.69v63.11"/>
                </g>
              </svg>
            </div>

            {/* App name */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                fontSize: 28, fontWeight: 700, color: C.titleText,
                fontFamily: 'system-ui', letterSpacing: -0.5, marginBottom: 4,
              }}>{L.title}</div>
              <div style={{ fontSize: 15, color: C.secondary, fontFamily: 'system-ui', letterSpacing: '0.02em', fontWeight: 500 }}>
                {L.subtitle}
              </div>
            </div>

            {/* Pulsing indicator */}
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: `2px solid ${C.accent}`,
                opacity: 0.35, animation: 'pulse 1.8s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: C.accent, opacity: 0.18,
              }} />
              <div style={{
                position: 'absolute', inset: 14, borderRadius: '50%',
                background: C.accent, opacity: 0.5,
              }} />
            </div>
          </div>

          {/* Bottom spacer to dynamically push logo group up */}
          <div style={{ flex: 2 }} />

          <div style={{ flex: 1 }} />

          {/* Copyright Footer */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            marginBottom: 8,
          }}>
            {/* Copyright Statement */}
            <div style={{
              fontSize: '11px',
              color: C.secondary,
              fontFamily: 'monospace',
              opacity: 1,
              textAlign: 'center',
            }}>
              Copyright &copy; 2026<br /> CREATOR JOSEPH(creatorjoseph@kakao.com)
            </div>
          </div>

        </div>
      )}

      {/* GStreamer Missing Installer Modal */}
      {showGstModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.94)',
            borderRadius: 24,
            padding: '32px 24px',
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.2)',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: 'system-ui',
          }}>
            {/* Warning Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(0,122,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.accent, marginBottom: 20,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            {/* Title & Description */}
            <div style={{ fontSize: 16, fontWeight: 700, color: C.titleText, marginBottom: 8, textAlign: 'center' }}>
              미러링 엔진 설치 필요
            </div>
            <div style={{ fontSize: 12.5, color: C.secondary, textAlign: 'center', lineHeight: 1.5, marginBottom: 24, padding: '0 8px' }}>
              {gstDone ? (
                <>설치 완료! 앱을 재시작하면<br />바로 미러링을 시작할 수 있습니다.</>
              ) : (
                <>화면 공유 엔진(GStreamer)이 없습니다.<br />원활한 미러링을 위해 최초 1회 자동 설치를 개시해 주세요. (5초 소요)</>
              )}
            </div>

            {gstError && (
              <div style={{ fontSize: 11, color: C.redText, background: C.redBg, border: `1px solid ${C.redBorder}`, padding: '8px 12px', borderRadius: 8, marginBottom: 16, textAlign: 'center', width: '100%' }}>
                {gstError}
              </div>
            )}

            {/* Install / Restart Button */}
            {gstDone ? (
              <button
                onClick={handleGstRestart}
                style={{
                  width: '100%',
                  background: '#34c759',
                  border: 'none',
                  padding: '12px 0',
                  borderRadius: 14,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#28a745'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#34c759'; }}
              >
                앱 재시작
              </button>
            ) : (
              <button
                onClick={handleGstInstall}
                disabled={gstInstalling}
                style={{
                  width: '100%',
                  background: C.accent,
                  border: 'none',
                  padding: '12px 0',
                  borderRadius: 14,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: gstInstalling ? 'default' : 'pointer',
                  transition: 'background 0.15s, opacity 0.15s',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(0,122,255,0.24)',
                  opacity: gstInstalling ? 0.8 : 1,
                }}
                onMouseEnter={e => { if(!gstInstalling) e.currentTarget.style.background = '#0062cc'; }}
                onMouseLeave={e => { if(!gstInstalling) e.currentTarget.style.background = C.accent; }}
              >
                {gstInstalling ? (
                  <>
                    <svg className="spinner" viewBox="0 0 50 50" style={{ width: 16, height: 16, stroke: '#fff', strokeWidth: 5, fill: 'none', strokeLinecap: 'round', animation: 'rotate 1s linear infinite' }}>
                      <circle cx="25" cy="25" r="20" />
                    </svg>
                    설치 중...
                  </>
                ) : '엔진 자동 설치 시작'}
              </button>
            )}

            {/* 종료 버튼 */}
            <button
              onClick={() => IS_WIN ? triggerIpc('window-close') : window.close()}
              style={{
                marginTop: 8,
                width: '100%', padding: '11px 0',
                borderRadius: 14, border: 'none',
                background: 'rgba(0,0,0,0.06)',
                color: C.secondary, fontSize: 15, fontWeight: 500,
                cursor: 'pointer', outline: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
            >
              앱 종료
            </button>
          </div>
        </div>
      )}


      {/* Bonjour(mDNS) 설치 모달 — Windows 전용 */}
      {showBonjourModal && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.94)', borderRadius: 24, padding: '32px 24px',
            width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.2)',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', fontFamily: 'system-ui',
          }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,149,0,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#ff9500', marginBottom:20 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
              </svg>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:C.titleText, marginBottom:8, textAlign:'center' }}>
              AirPlay 검색 서비스 필요
            </div>
            <div style={{ fontSize:12.5, color:C.secondary, textAlign:'center', lineHeight:1.5, marginBottom:24, padding:'0 8px' }}>
              {bonjourDone ? (
                <>설치 완료! 앱을 재시작하면<br />미러링 목록에 나타납니다.</>
              ) : (
                <>AirPlay 기기 검색을 위해 Bonjour가 필요합니다.<br />Apple 공식 서비스를 자동으로 설치합니다. (약 1분)</>
              )}
            </div>
            {bonjourError && (
              <div style={{ fontSize:11, color:C.redText, background:C.redBg, border:`1px solid ${C.redBorder}`,
                padding:'8px 12px', borderRadius:8, marginBottom:16, textAlign:'center', width:'100%' }}>
                {bonjourError}
              </div>
            )}
            {bonjourDone ? (
              <button onClick={handleGstRestart} style={{
                width:'100%', background:'#34c759', border:'none', padding:'12px 0',
                borderRadius:14, fontSize:13.5, fontWeight:700, color:'#ffffff', cursor:'pointer',
              }}>앱 재시작</button>
            ) : (
              <button onClick={handleBonjourInstall} disabled={bonjourInstalling} style={{
                width:'100%', background:'#ff9500', border:'none', padding:'12px 0',
                borderRadius:14, fontSize:13.5, fontWeight:700, color:'#ffffff',
                cursor: bonjourInstalling ? 'default' : 'pointer', opacity: bonjourInstalling ? 0.8 : 1,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:'0 4px 12px rgba(255,149,0,0.3)',
              }}>
                {bonjourInstalling ? (
                  <><svg viewBox="0 0 50 50" style={{width:16,height:16,stroke:'#fff',strokeWidth:5,fill:'none',animation:'rotate 1s linear infinite'}}><circle cx="25" cy="25" r="20"/></svg>설치 중...</>
                ) : 'Bonjour 자동 설치'}
              </button>
            )}
          </div>
        </div>
      )}


      {/* 업데이트 알림 모달 */}
      {updateInfo && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.96)',
            borderRadius: 24,
            padding: '28px 24px 24px',
            width: 310,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.2)',
            animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            fontFamily: 'system-ui',
          }}>
            {/* 아이콘 */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(52,199,89,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, fontSize: 26,
            }}>🎉</div>

            {/* 제목 */}
            <div style={{ fontSize: 15, fontWeight: 700, color: C.titleText, marginBottom: 4, textAlign: 'center' }}>
              새 버전이 출시되었습니다
            </div>

            {/* 버전 배지 */}
            <div style={{
              display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12,
            }}>
              <span style={{
                fontSize: 11, background: 'rgba(0,0,0,0.06)', color: C.secondary,
                padding: '3px 8px', borderRadius: 20, fontWeight: 600,
              }}>v{updateInfo.currentVersion}</span>
              <span style={{ fontSize: 11, color: C.secondary }}>→</span>
              <span style={{
                fontSize: 11, background: 'rgba(52,199,89,0.15)', color: '#1a7a38',
                padding: '3px 8px', borderRadius: 20, fontWeight: 700,
              }}>v{updateInfo.latestVersion}</span>
            </div>

            {/* 릴리즈 노트 (있을 경우) */}
            {updateInfo.releaseNotes && (
              <div style={{
                width: '100%', background: 'rgba(0,0,0,0.04)', borderRadius: 10,
                padding: '10px 12px', marginBottom: 16,
                fontSize: 11, color: C.secondary, lineHeight: 1.5,
                maxHeight: 72, overflowY: 'auto', textAlign: 'left',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {updateInfo.releaseNotes}
              </div>
            )}

            {/* 다운로드 버튼 */}
            <button
              onClick={() => {
                if (window.ipcRenderer) window.ipcRenderer.invoke('open-external', updateInfo.releaseUrl);
              }}
              style={{
                width: '100%', background: '#34c759', border: 'none',
                padding: '11px 0', borderRadius: 13,
                fontSize: 13, fontWeight: 700, color: '#fff',
                cursor: 'pointer', marginBottom: 8,
                boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#28a745'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#34c759'; }}
            >
              최신 버전 다운로드
            </button>

            {/* 나중에 버튼 */}
            <button
              onClick={() => setUpdateInfo(null)}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                padding: '8px 0', fontSize: 12.5, color: C.secondary,
                cursor: 'pointer', fontFamily: 'system-ui',
              }}
            >
              나중에
            </button>
          </div>
        </div>
      )}


      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.5); opacity: 0.08; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
    </div>
  );
}
