# 보이다 (Boida) ─ iPhone Screen Mirroring App for macOS & Windows

[한국어 설명은 아래를 참고하세요.](#한국어-설명)

Boida is a lightweight and robust desktop mirroring application designed for macOS and Windows. Utilizing Apple's native AirPlay technology, it allows you to cast your iPhone or iPad screen to your computer instantly over Wi-Fi, without installing any companion apps on your iOS device. 

It maintains a strict aspect ratio layout, features dynamic window scaling, and offers an optimized presentation interface.

---

## Key Features

- **🔌 Plug & Play (Zero Setup)**: Uses standard Apple AirPlay. Simply select **"보이다(Boida)"** from your iOS Control Center under Screen Mirroring.
- **📐 Strict Aspect Ratio Lock**: Automatically resizes and scales, locking window dimensions precisely to the connected device's resolution (Portrait/Landscape) including the window header space.
- **🔍 Quick Window Controls**: Fast scaling buttons (`+` Zoom In, `-` Zoom Out, `100%` scale match) seamlessly integrated directly into the custom title bar.
- **🕶️ Fullscreen Auto-Hide Controls**: Enter fullscreen using the native green maximize button; the header seamlessly slides off-screen and glides down only when your mouse cursor hovers near the top edge.
- **🔒 True Connection Management**: Eliminates frame-watchdog timeouts. The mirroring state cleanly closes immediately only when you explicitly stop mirroring on your iPhone.
- **🌐 Automatic OS Language Match**: Smooth localization setup. Detects system language and automatically loads English or Korean dynamically.

---

## Installation & Setup

### For macOS Users (`.dmg`)
1. Download the latest `Boida-vX.X.X-arm64/x64.dmg` installer.
2. Double-click the `.dmg` file to open the installation window.
3. Drag the **보이다(Boida)** icon into your **Applications** folder.
4. Open your Applications folder and launch **보이다(Boida)**. *(Note: On first launch, you might need to allow permission under System Settings > Security).*

### For Windows Users (`.exe`)
1. Download the latest `Boida-Setup-vX.X.X.exe` installer.
2. Double-click the installer to run the setup wizard.
3. Follow the prompt instructions to complete the installation.
4. Launch **보이다(Boida)** using the desktop shortcut or from the Start menu.

---

## How to Use Mirroring

1. Make sure your computer and iOS device are connected to the **same Wi-Fi network**.
2. Run the **Boida** desktop application.
3. Open the **Control Center** on your iPhone/iPad:
   - *For iPhones with Face ID*: Swipe down from the top-right corner of the screen.
   - *For iPhones with Touch ID*: Swipe up from the bottom edge of the screen.
4. Tap the **Screen Mirroring** icon (two overlapping rectangles).
5. Select **"보이다(Boida)"** from the device list.
6. Your iPhone screen will instantly appear on your desktop with perfectly locked aspect ratios.
7. To stop, simply open the Control Center on your iPhone, tap Screen Mirroring, and select **Stop Mirroring**.

---

# 한국어 설명

**보이다(Boida)**는 macOS 및 Windows 환경을 위한 가볍고 강력한 아이폰 화면 미러링 데스크톱 애플리케이션입니다. iOS 기기에 별도의 앱을 설치할 필요 없이 Wi-Fi를 통한 기본 AirPlay 기술만으로 아이폰/아이패드 화면을 PC에 즉시 송출하며, 프레젠테이션 및 앱 시연을 위한 다양한 유틸리티를 지원합니다.

## 주요 기능

- **🔌 플러그 앤 플레이 (무설정)**: 아이폰의 제어 센터에서 **"보이다(Boida)"** 기기만 선택하면 즉시 미러링이 활성화됩니다.
- **📐 완벽한 가로세로 비율 유지**: 기기 화면 비율(세로/가로 모드)과 헤더 바의 높이(38px)를 정확히 반영하여 창을 늘리거나 줄여도 검은 여백 없이 꽉 찬 비율을 유지합니다.
- **🔍 간편한 줌 기능**: 커스텀 타이틀바에 설계된 보기 비율 조절 그룹 버튼(`+` 확대, `-` 축소, `100%` 원본 비율)으로 쉽게 크기를 조절할 수 있습니다.
- **🕶️ 전체화면 최적화**: 초록색 신호등 버튼으로 전체화면에 진입하면 헤더 바가 자동으로 화면 밖으로 숨겨지며, 마우스를 화면 최상단에 올릴 때만 부드럽게 미끄러지듯 노출됩니다.
- **🔒 안정적인 소켓 기반 연결 관리**: 미전송 대기 타이머 대신 실제 네트워크 소켓 종료 이벤트를 감지하여, 발표 중에 정지화면이 오랫동안 유지되어도 절대 미러링이 튕기지 않습니다.
- **🌐 OS 언어 자동 감지**: 시스템 표시 언어를 감지하여 앱의 모든 메뉴와 안내 메시지를 자동으로 한국어 또는 영어로 대응시킵니다.

---

## 설치 및 실행 방법

### macOS 사용자용 설치 안내 (`.dmg`)
1. 배포된 `Boida-vX.X.X-arm64/x64.dmg` 파일을 다운로드합니다.
2. 다운로드한 `.dmg` 파일을 더블 클릭하여 설치창을 엽니다.
3. **보이다(Boida)** 앱 아이콘을 **Applications (응용 프로그램)** 폴더로 드래그 앤 드롭합니다.
4. 응용 프로그램 폴더에서 **보이다(Boida)**를 실행합니다. *(최초 실행 시 Mac 보안 설정에 따라 실행 허용이 필요할 수 있습니다).*

### Windows 사용자용 설치 안내 (`.exe`)
1. 배포된 `Boida-Setup-vX.X.X.exe` 설치 파일을 다운로드합니다.
2. 다운로드한 `.exe` 파일을 더블 클릭하여 설치 마법사를 실행합니다.
3. 화면의 지시에 따라 설치 프로세스를 완료합니다.
4. 바탕화면 바로가기 아이콘 또는 시작 메뉴에서 **보이다(Boida)**를 실행합니다.

---

## 미러링 연결 사용법

1. 컴퓨터와 아이폰(또는 아이패드)이 **동일한 Wi-Fi 공유기**에 연결되어 있는지 확인합니다.
2. 데스크톱에서 **보이다(Boida)** 애플리케이션을 실행합니다.
3. 아이폰/아이패드의 **제어 센터**를 열어줍니다:
   - *Face ID 지원 모델*: 화면 오른쪽 위 모서리에서 아래로 쓸어내립니다.
   - *Home 버튼 모델*: 화면 아래쪽 가장자리에서 위로 쓸어올립니다.
4. 겹쳐진 사각형 모양의 **화면 미러링** 아이콘을 터치합니다.
5. 검색된 기기 목록에서 **"보이다(Boida)"**를 선택하여 연결합니다.
6. 컴퓨터 모니터에 아이폰 화면이 비율 왜곡 없이 즉시 나타납니다.
7. 미러링을 종료하려면 아이폰 제어 센터의 화면 미러링 메뉴에서 **미러링 중단**을 선택해 줍니다.
