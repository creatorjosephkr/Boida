# 보이다 (Boida) ─ iPhone Screen Mirroring App for macOS & Windows

[한국어 설명은 아래를 참고하세요.](#한국어-설명)

Boida is a robust, zero-configuration desktop mirroring client designed for macOS and Windows. Utilizing AirPlay technology, it allows you to cast your iPhone or iPad screen to your computer instantly over Wi-Fi without installing companion apps on your iOS device. It maintains a strict aspect ratio layout and features dynamic window scaling.

---

## Key Features

- **🔌 Plug & Play (Zero Setup)**: Uses standard Apple AirPlay. Simply select **"보이다(Boida)"** from your iOS Control Center under Screen Mirroring.
- **📐 Strict Aspect Ratio Lock**: Automatically resizes and scales, locking window dimensions precisely to the connected device's resolution (Portrait/Landscape) including the window header space.
- **🔍 Quick Window Controls**: Fast scaling buttons (`+` Zoom In, `-` Zoom Out, `100%` scale match) seamlessly integrated directly into the custom title bar.
- **🕶️ Fullscreen Auto-Hide Controls**: Enter fullscreen using the native green maximize button; the header seamlessly slides off-screen and glides down only when your mouse cursor hovers near the top edge.
- **🔒 True Disconnect detection**: Eliminates frame-watchdog timeouts. The mirroring state cleanly closes immediately only when you explicitly stop mirroring on your iPhone.
- **🌐 Automatic OS Language Match**: Smooth localization setup. Detects system language and automatically loads English or Korean dynamically.

---

## Installation & Setup

1. Make sure your computer and iOS device are connected to the **same Wi-Fi network**.
2. Run the Boida application.
3. Open the **Control Center** on your iPhone/iPad.
4. Tap **Screen Mirroring** (icon with two overlapping screens) and select **"보이다(Boida)"**.
5. Your screen will instantly cast to your computer.

---

## Development & Packaging

This project is built using Electron, React (Vite), and bundles precompiled native GStreamer & UxPlay engines.

### System Prerequisites
Ensure you have Node.js installed. If you are developing locally on macOS:
```bash
brew install gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad gst-libav
```

### Install Dependencies
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
# and in another terminal tab:
npm start
```

### Build Production Packages (DMG / EXE)
```bash
# Package for macOS (DMG)
npm run dist:mac

# Package for Windows (NSIS installer)
npm run dist:win

# Build both simultaneously
npm run dist:all
```

---

# 한국어 설명

**보이다(Boida)**는 macOS 및 Windows 환경을 위한 강력하고 가벼운 아이폰 화면 미러링 데스크톱 앱입니다. iOS 기기에 별도의 앱을 설치할 필요 없이 Wi-Fi를 통한 기본 AirPlay 기술만으로 아이폰/아이패드 화면을 PC에 즉시 송출하며, 비율 왜곡 없는 고품질 스케일링을 지원합니다.

## 주요 기능

- **🔌 플러그 앤 플레이 (무설정)**: 아이폰의 제어 센터에서 **"보이다(Boida)"** 기기만 선택하면 즉시 미러링이 활성화됩니다.
- **📐 완벽한 가로세로 비율 유지**: 기기 화면 비율(세로/가로 모드)과 헤더 바의 높이(38px)를 정확히 반영하여 창을 늘리거나 줄여도 검은 여백 없이 꽉 찬 비율을 유지합니다.
- **🔍 간편한 줌 기능**: 커스텀 타이틀바에 설계된 보기 비율 조절 그룹 버튼(`+` 확대, `-` 축소, `100%` 원본 비율)으로 쉽게 크기를 조절할 수 있습니다.
- **🕶️ 전체화면 최적화**: 초록색 신호등 버튼으로 전체화면에 진입하면 헤더 바가 자동으로 화면 밖으로 숨겨지며, 마우스를 화면 최상단에 올릴 때만 부드럽게 미끄러지듯 노출됩니다.
- **🔒 안정적인 소켓 기반 연결 관리**: 프레임 미전송 대기 타이머 대신 실제 네트워크 소켓 종료 이벤트를 감지하여, 발표 중에 정지화면이 오랫동안 유지되어도 절대 미러링이 튕기지 않습니다.
- **🌐 OS 언어 자동 감지**: 시스템 표시 언어를 감지하여 앱의 모든 메뉴와 안내 메시지를 자동으로 한국어 또는 영어로 대응시킵니다.

## 사용 방법

1. 미러링할 컴퓨터와 아이폰(또는 아이패드)이 **동일한 Wi-Fi 공유기**에 연결되어 있는지 확인합니다.
2. 보이다(Boida) 데스크톱 애플리케이션을 실행합니다.
3. 아이폰의 **제어 센터**를 열고 **화면 미러링** 아이콘을 터치합니다.
4. 기기 목록 중 **"보이다(Boida)"**를 터치해 연결합니다.

## 개발 및 빌드 패키징

이 프로젝트는 Electron, React, Vite로 구축되었으며 내부에 컴파일된 uxplay 바이너리 자원을 포함하고 있습니다.

### 사전 설치 요건
로컬 개발을 위해 Node.js가 필요하며, macOS 환경의 경우 아래 GStreamer 의존 라이브러리를 설치해 줍니다.
```bash
brew install gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad gst-libav
```

### 의존성 패키지 설치
```bash
npm install
```

### 개발 실행
```bash
npm run dev
# 또 다른 터미널 탭에서 실행:
npm start
```

### 배포 패키지 빌드 (DMG / EXE)
```bash
# macOS 용 배포본 패키징 (dmg)
npm run dist:mac

# Windows 용 배포본 패키징 (installer exe)
npm run dist:win
```
