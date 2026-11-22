# 보이다(Boida) — 아이폰 미러링

<p align="center">
  <b>아이폰 화면을 Windows PC · Mac에서 무선으로 미러링</b><br/>
  AirPlay 기반 · 아이폰에 별도 앱 설치 없음 · 완전 무료
</p>

<p align="center">
  <a href="../../releases/latest">
    <img src="https://img.shields.io/github/v/release/creatorjosephkr/Boida?label=최신버전&style=for-the-badge&color=3a60cc" alt="Download"/>
  </a>
  <img src="https://img.shields.io/badge/Windows-10%2F11-0078D4?style=for-the-badge&logo=windows" alt="Windows"/>
  <img src="https://img.shields.io/badge/macOS-12%2B-000000?style=for-the-badge&logo=apple" alt="macOS"/>
  <img src="https://img.shields.io/badge/License-Free-brightgreen?style=for-the-badge" alt="Free"/>
</p>

---

## ✨ 주요 기능

- 📱 **AirPlay 기반** — 아이폰 제어 센터에서 바로 미러링
- 🖥️ **Windows · Mac 동시 지원** — 한 앱으로 두 플랫폼 모두
- ⚡ **저지연 스트리밍** — H.264 하드웨어 디코딩
- 🎵 **오디오 포함** — 영상 + 소리 동시 전송
- 🔌 **별도 설치 없음** — GStreamer 엔진 자동 내장/다운로드
- 💸 **완전 무료** — 광고 없음, 구독 없음

---

## 🆕 v2.0.0 업데이트

### 주요 변경사항

| 항목 | 내용 |
|------|------|
| 📷 **카메라 방향 자동 인지 및 회전** | 아이폰 카메라 앱 실행 시 가로/세로 방향을 실시간 자동 감지하여 창 크기 및 비디오 방향 동적 전환 |
| 🔄 **원클릭 회전 도구 및 단축키** | 플로팅 툴바에 회전(`[ ↻ ]`) 버튼 추가 및 키보드 `R` 키 즉시 회전 지원 |
| 🎛️ **플로팅 툴바(Floating Toolbar)** | 마우스 호버 시 펼쳐지는 미니멀 애플 글래스모피즘 도구 패널 |
| ⚡ **화질 및 비트레이트 설정** | 1080p 60fps부터 대역폭 절약 모드까지 5단계 맞춤 프리셋 지원 |
| 🔊 **소리 볼륨 조절 및 음소거** | 마우스 휠 및 팝오버 슬라이더로 하드웨어 볼륨 직접 조절 |
| 🛡️ **장시간 안정성 최적화** | `-vsync no` / `-async no` 적용으로 2시간 30분 이상 연속 미러링 시 오디오 끊김/일그러짐 완전 해결 |

---

## 📥 다운로드

👉 **[최신 버전 다운로드](../../releases/latest)**

| 파일 | 플랫폼 | 설명 |
|------|--------|------|
| `Boida-v2.0.0-macOS-arm64.dmg` | macOS Apple Silicon | M1 / M2 / M3 / M4 |
| `Boida-v2.0.0-macOS-intel-x64.dmg` | macOS Intel | 인텔 Mac 전용 |
| `Boida-v2.0.0-Windows-X64.exe` | Windows 10/11 (64-bit) | Windows 설치 파일 |

---

## 🚀 설치 방법

### Windows

#### 1단계 — 설치 전 차단 해제 (필수!)

Windows 11의 스마트 앱 컨트롤이 서명되지 않은 앱을 차단할 수 있습니다.

> **`Boida-v1.1.0-x64.exe` 파일을 우클릭 → 속성 → 하단 "차단 해제" 체크 → 확인**

<details>
<summary>📸 차단 해제 방법 자세히 보기</summary>

1. 다운로드한 `Boida-v1.1.0-x64.exe` 파일에서 **마우스 우클릭**
2. **속성** 클릭
3. 일반 탭 하단 _"이 파일은 다른 컴퓨터에서 왔으며..."_ 옆 **☑ 차단 해제** 체크
4. **확인** → 파일 실행

</details>

#### 2단계 — 설치 및 실행

1. `Boida-v1.1.0-x64.exe` 실행 후 설치 완료
2. **보이다(Boida)** 앱 실행
3. **최초 실행 시**: 미러링 엔진 자동 다운로드 (~60초) — 인터넷 연결 필요
4. 아이폰과 PC를 **같은 Wi-Fi**에 연결
5. 아이폰 **제어 센터** → **화면 미러링** → **Boida** 선택
6. 미러링 시작! 🎉

> 💡 미러링 엔진은 최초 1회만 다운로드됩니다. 이후 실행부터는 즉시 시작됩니다.

---

### macOS

1. `Boida-v1.1.0-universal.dmg` 다운로드 후 열기
2. **Boida.app**을 **응용 프로그램** 폴더로 드래그
3. Boida.app 실행

<details>
<summary>⚠️ "개발자를 확인할 수 없음" 경고 해결 방법</summary>

**방법 A** — 우클릭으로 열기
1. Finder에서 Boida.app **우클릭**
2. **열기** 선택 → 경고창에서 **열기** 클릭

**방법 B** — 시스템 설정에서 허용
1. **시스템 설정** → **개인정보 보호 및 보안**
2. 하단 "Boida가 차단되었습니다" 옆 **허용** 클릭

</details>

4. 아이폰과 Mac을 **같은 Wi-Fi**에 연결
5. 아이폰 **제어 센터** → **화면 미러링** → **보이다(Boida)** 선택
6. 미러링 시작! 🎉

---

## 📋 시스템 요구사항

|  | Windows | macOS |
|--|---------|-------|
| **OS** | Windows 10 / 11 (64bit) | macOS 12 Monterey 이상 |
| **네트워크** | 아이폰과 동일한 Wi-Fi | 아이폰과 동일한 Wi-Fi |
| **인터넷** | 최초 실행 시 필요 (엔진 다운로드) | 불필요 |
| **추가 설치** | 없음 (자동) | GStreamer (앱이 자동 안내) |

---

## 🔧 문제 해결

<details>
<summary>📱 아이폰 미러링 목록에 보이다가 안 보일 때</summary>

1. **같은 Wi-Fi 확인** — 아이폰과 PC가 동일 공유기에 연결되어 있는지 확인
2. **AP 격리 비활성화** — 공유기 설정에서 Client Isolation(AP 격리) 기능 끄기
3. **Bonjour 서비스** — 앱 재실행 후 Bonjour 설치 모달이 나타나면 설치
4. **방화벽 허용** — Windows Defender 방화벽에서 Boida 허용
5. **레지스트리 초기화** — PowerShell에서 아래 명령 실행 후 앱 재시작:
   ```powershell
   Remove-Item "$env:TEMP\boida-gst-registry*.bin" -EA SilentlyContinue
   ```

</details>

<details>
<summary>🔗 목록에는 보이지만 연결이 안 될 때</summary>

1. **GStreamer 레지스트리 초기화** — 위 PowerShell 명령어 실행 후 재시작
2. **방화벽 포트 허용** — 관리자 PowerShell에서 실행:
   ```powershell
   netsh advfirewall firewall add rule name="Boida AirPlay TCP" dir=in action=allow protocol=TCP localport=5000,7000,7100
   netsh advfirewall firewall add rule name="Boida AirPlay UDP" dir=in action=allow protocol=UDP localport=6000-6009
   ```
3. **백신 예외 추가** — `%LOCALAPPDATA%\Boida\` 경로를 백신 예외 목록에 추가
4. **IP 대역 확인** — 아이폰과 PC의 IP 앞 3자리가 동일한지 확인 (예: 192.168.1.xxx)

</details>

<details>
<summary>🛡️ Windows에서 앱 실행이 차단될 때</summary>

설치 파일 **우클릭 → 속성 → 차단 해제** 체크 후 재설치하세요.

또는 관리자 PowerShell에서:
```powershell
Unblock-File -Path "$env:USERPROFILE\Downloads\Boida-v1.1.0-x64.exe"
```

</details>

---

## 🛠️ 기술 스택

- [Electron](https://www.electronjs.org/) — 크로스플랫폼 데스크탑 앱
- [UxPlay](https://github.com/FDH2/UxPlay) — AirPlay 서버 (오픈소스)
- [GStreamer](https://gstreamer.freedesktop.org/) — 미디어 파이프라인
- [React](https://react.dev/) — UI

---

## 💬 문의 · 후원

사용 중 문제가 있거나 건의사항이 있으시면 [Issues](../../issues)에 남겨주세요.

앱 개발 후원을 해주시면 큰 힘이 됩니다 ❤️

- 💳 **PayPal** — [paypal.me/tech1010](https://www.paypal.com/paypalme/tech1010)
- ☕ **카카오페이** — 앱 내 후원 버튼
- 📧 **이메일** — creatorjoseph@kakao.com

---

<p align="center">
  Copyright © 2026 CREATOR JOSEPH · Made with ❤️ in Korea
</p>
