# 보이다 (Boida)

> **iPhone · iPad 화면을 Mac / Windows PC로 무선 미러링하는 AirPlay 수신 앱**

AirPlay 2 프로토콜을 이용해 Apple 기기의 화면을 실시간으로 PC에 표시합니다.  
GStreamer 기반의 오픈소스 엔진 [UxPlay](https://github.com/antimof/UxPlay)를 내장하고 있어 별도 설치 없이 바로 사용할 수 있습니다.

---

## 📋 시스템 요구사항

| 플랫폼 | 최소 사양 |
|--------|-----------|
| **macOS** | macOS 11 Big Sur 이상 (Intel · Apple Silicon 모두 지원) |
| **Windows** | Windows 10 / 11 (64-bit) |
| **네트워크** | iPhone / iPad와 **같은 Wi-Fi** 네트워크 |

---

## 📥 설치 방법

### macOS

1. [Releases 페이지](https://github.com/creatorjosephkr/Boida/releases/latest)에서 최신 버전을 다운로드합니다.

   | 파일 | 대상 |
   |------|------|
   | `Boida-v*-universal.dmg` | Intel + Apple Silicon 통합 **(권장)** |
   | `Boida-v*-arm64.dmg` | Apple Silicon (M1/M2/M3) 전용 |
   | `Boida-v*-x64.dmg` | Intel Mac 전용 |

2. DMG 파일을 열고 **Boida.app**을 `/Applications` 폴더로 드래그합니다.

3. 처음 실행 시 **GStreamer 설치 모달**이 나타나면 **"엔진 자동 설치 시작"** 버튼을 클릭합니다.
   - 관리자 비밀번호 입력 후 약 30초 내에 설치가 완료됩니다.
   - 설치 완료 후 **"앱 재시작"** 버튼을 클릭하면 바로 사용 가능합니다.
   - ※ GStreamer 설치는 **최초 1회만** 필요합니다.

> **⚠️ "개발자를 확인할 수 없습니다" 경고 시**  
> **시스템 설정 → 개인 정보 보호 및 보안** 에서 **"확인 없이 열기"** 를 클릭하세요.

---

### Windows

1. [Releases 페이지](https://github.com/creatorjosephkr/Boida/releases/latest)에서 `Boida-v*-x64-Setup.exe` 를 다운로드합니다.

2. 설치 파일을 실행하면 자동으로 설치됩니다.

3. 처음 실행 시 **GStreamer 설치 모달**이 나타나면 **"엔진 자동 설치 시작"** 버튼을 클릭합니다.
   - 관리자 권한 승인 후 자동으로 설치됩니다.
   - 설치 완료 후 **"앱 재시작"** 버튼을 클릭하면 바로 사용 가능합니다.

> **⚠️ Windows Defender SmartScreen 경고 시**  
> **"추가 정보"** → **"실행"** 을 클릭하세요.

---

## 📱 사용 방법

1. **보이다(Boida)** 앱을 실행합니다.
2. iPhone / iPad에서 **제어 센터** → **화면 미러링** 을 탭합니다.
3. 목록에서 **"보이다(Boida)"** 를 선택합니다.
4. 연결되면 PC 화면에 iPhone / iPad 화면이 실시간으로 표시됩니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| 🔄 자동 재연결 | 연결이 끊어져도 자동으로 재연결 대기 |
| 🔲 전체화면 | 더블클릭 또는 메뉴로 전체화면 전환 |
| ↕️ 크기 조절 | `+` / `-` 버튼으로 창 크기 조절 |
| 🔇 연결 끊기 | 헤더의 끊기 버튼으로 미러링 종료 |

---

## 🗑️ 제거 방법

단순히 앱만 삭제하면 **GStreamer 라이브러리** 등 시스템에 설치된 구성 요소가 남게 됩니다.  
완전한 제거를 위해 **Boida Uninstaller**를 사용하세요.

### Boida Uninstaller 사용법

1. [Releases 페이지](https://github.com/creatorjosephkr/Boida/releases/latest)에서 `Boida-Uninstaller-universal.zip` 을 다운로드합니다.
2. ZIP 압축을 해제합니다.
3. **Boida Uninstaller.app** 을 더블클릭하여 실행합니다.  
   *(설치 불필요 — 어디서든 바로 실행 가능)*
4. 제거할 항목을 선택하고 **"N개 항목 모두 제거"** 버튼을 클릭합니다.
5. 관리자 비밀번호를 입력하면 자동으로 제거됩니다.

### 제거 대상 항목

| 항목 | 경로 | 권한 |
|------|------|------|
| Boida 앱 | `/Applications/Boida.app` | 관리자 |
| GStreamer 라이브러리 | `/Library/Frameworks/GStreamer.framework` | 관리자 |
| GStreamer 패키지 영수증 | `pkgutil` 레코드 | 관리자 |
| Boida 환경설정 | `~/Library/Preferences/com.boida.mirror.plist` | 일반 |
| Boida 앱 데이터 | `~/Library/Application Support/Boida` | 일반 |
| Boida 캐시 | `~/Library/Caches/com.boida.mirror` | 일반 |
| Boida 로그 | `~/Library/Logs/Boida` | 일반 |

---

## 🔄 업데이트

앱 실행 시 자동으로 최신 버전을 확인합니다.  
새 버전이 출시되면 앱 내에서 알림 모달이 표시되며, **"최신 버전 다운로드"** 버튼으로 Releases 페이지로 이동합니다.

---

## ❓ 자주 묻는 질문

**Q. iPhone이 목록에 나타나지 않아요.**  
A. iPhone과 PC가 **같은 Wi-Fi 네트워크**에 연결되어 있는지 확인하세요. 공유기의 **AP 격리(AP Isolation)** 기능이 켜져 있으면 연결되지 않습니다.

**Q. macOS에서 "Library not loaded" 오류가 발생해요.**  
A. GStreamer가 설치되지 않은 경우입니다. 앱을 재실행하면 설치 모달이 나타납니다.

**Q. 화면이 끊기거나 지연이 심해요.**  
A. Wi-Fi 신호 강도를 확인하세요. 5GHz 대역 사용을 권장합니다.

**Q. Windows에서 방화벽 경고가 떠요.**  
A. AirPlay 통신을 위한 네트워크 접근 허용이 필요합니다. **"허용"** 을 클릭하세요.

---

## 📄 라이선스

이 앱은 [UxPlay](https://github.com/antimof/UxPlay) (GPLv3) 및 [GStreamer](https://gstreamer.freedesktop.org/) (LGPL) 오픈소스 프로젝트를 사용합니다.

---

## 📬 문의

버그 리포트 및 기능 제안: [Issues](https://github.com/creatorjosephkr/Boida/issues)
