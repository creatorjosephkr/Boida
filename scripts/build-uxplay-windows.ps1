# ============================================================
# build-uxplay-windows.ps1
# Windows에서 uxplay.exe 자동 빌드 스크립트
# 실행: PowerShell을 관리자 권한으로 열고 이 스크립트 실행
# ============================================================

$ErrorActionPreference = "Stop"
$MSYS2_DIR = "C:\msys64"
$PACMAN = "$MSYS2_DIR\usr\bin\pacman.exe"
$BASH = "$MSYS2_DIR\usr\bin\bash.exe"

Write-Host "=== Boida: uxplay.exe 빌드 시작 ===" -ForegroundColor Cyan

# ── 1. MSYS2 설치 확인 / 설치 ─────────────────────────────────
if (-not (Test-Path $MSYS2_DIR)) {
    Write-Host "[1/4] MSYS2 설치 중..." -ForegroundColor Yellow
    $installer = "$env:TEMP\msys2-installer.exe"
    $msys2Url = "https://github.com/msys2/msys2-installer/releases/download/2024-01-13/msys2-x86_64-20240113.exe"
    Write-Host "    다운로드: $msys2Url"
    Invoke-WebRequest -Uri $msys2Url -OutFile $installer -UseBasicParsing
    Start-Process -FilePath $installer -ArgumentList "install --confirm-command --accept-messages --root C:/msys64" -Wait
    Remove-Item $installer -Force
    Write-Host "    MSYS2 설치 완료" -ForegroundColor Green
} else {
    Write-Host "[1/4] MSYS2 이미 설치됨: $MSYS2_DIR" -ForegroundColor Green
}

# ── 2. 패키지 업데이트 및 의존성 설치 ──────────────────────────
Write-Host "[2/4] 패키지 설치 중 (GStreamer, cmake, uxplay)..." -ForegroundColor Yellow
$packages = @(
    "mingw-w64-x86_64-gcc",
    "mingw-w64-x86_64-cmake",
    "mingw-w64-x86_64-ninja",
    "mingw-w64-x86_64-gstreamer",
    "mingw-w64-x86_64-gst-plugins-base",
    "mingw-w64-x86_64-gst-plugins-good",
    "mingw-w64-x86_64-gst-plugins-bad",
    "mingw-w64-x86_64-libplist",
    "mingw-w64-x86_64-openssl",
    "mingw-w64-x86_64-pkg-config"
)

$pkgList = $packages -join " "
& $BASH -lc "pacman -Syu --noconfirm 2>&1; pacman -S --noconfirm $pkgList 2>&1"

Write-Host "    패키지 설치 완료" -ForegroundColor Green

# ── 3. UxPlay 소스 클론 & 빌드 ────────────────────────────────
Write-Host "[3/4] UxPlay 빌드 중..." -ForegroundColor Yellow
$buildScript = @'
set -e
cd /tmp
rm -rf UxPlay
git clone --depth 1 https://github.com/FDH2/UxPlay.git
cd UxPlay
mkdir build && cd build
cmake .. \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/mingw64 \
  -DGST_MACOS_SDK=OFF \
  2>&1
ninja 2>&1
echo "BUILD_SUCCESS"
'@

$result = & $BASH -lc $buildScript 2>&1
if ($result -notcontains "BUILD_SUCCESS" -and ($result | Out-String) -notmatch "BUILD_SUCCESS") {
    Write-Host "빌드 실패! 오류:" -ForegroundColor Red
    $result | Select-Object -Last 20
    exit 1
}
Write-Host "    빌드 완료" -ForegroundColor Green

# ── 4. uxplay.exe + 필수 DLL 복사 ─────────────────────────────
Write-Host "[4/4] 파일 복사 중..." -ForegroundColor Yellow

# 스크립트 위치 기준으로 출력 폴더 설정
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDir = Join-Path $scriptDir "..\receiver\resources\bin"
$outputDir = [System.IO.Path]::GetFullPath($outputDir)

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# uxplay.exe 복사
$uxplayExe = "$MSYS2_DIR\tmp\UxPlay\build\uxplay.exe"
if (-not (Test-Path $uxplayExe)) {
    # 빌드 경로가 다를 수 있으니 검색
    $uxplayExe = Get-ChildItem "$MSYS2_DIR\tmp\UxPlay" -Recurse -Filter "uxplay.exe" | Select-Object -First 1 -ExpandProperty FullName
}

if (-not $uxplayExe -or -not (Test-Path $uxplayExe)) {
    Write-Host "uxplay.exe를 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

Copy-Item $uxplayExe $outputDir -Force
Write-Host "    복사: uxplay.exe → $outputDir" -ForegroundColor Green

# 필수 MSYS2 DLL 복사 (uxplay 의존성)
$mingwBin = "$MSYS2_DIR\mingw64\bin"
$requiredDlls = & $BASH -lc "ldd /tmp/UxPlay/build/uxplay.exe 2>/dev/null | grep '/mingw64' | awk '{print `$3}'" 2>&1
foreach ($dll in $requiredDlls) {
    $dll = $dll.Trim()
    if ($dll -and (Test-Path $dll)) {
        $dllWin = $dll -replace '^/mingw64', $mingwBin -replace '/', '\'
        if (Test-Path $dllWin) {
            Copy-Item $dllWin $outputDir -Force
            Write-Host "    복사: $(Split-Path -Leaf $dllWin)" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "=== 완료! ===" -ForegroundColor Cyan
Write-Host "uxplay.exe가 다음 위치에 저장됨:" -ForegroundColor White
Write-Host "  $outputDir" -ForegroundColor White
Write-Host ""
Write-Host "이제 맥에서 'npm run dist:win' 으로 재빌드하면 됩니다." -ForegroundColor Yellow
