# TestFlight ビルド・サブミット 一括実行スクリプト
#
# 前提：
#   - Apple Developer Program アクティベーション済
#   - npm install -g eas-cli  実行済
#   - eas login 実行済（Expo アカウントでログイン）
#   - App Store Connect で App 作成済（Bundle ID: com.maruibussan.ranger）
#   - eas.json の submit.production.ios に appleId/ascAppId/appleTeamId 入力済
#
# 使い方：
#   cd app
#   powershell.exe -ExecutionPolicy Bypass -File scripts/testflight-build.ps1
#
# 動作：
#   1. iOS 認証情報の確認・自動生成
#   2. production プロファイルでiOSビルド（30〜60分、EASクラウド側）
#   3. ビルド完了後、TestFlight にサブミット（10分＋Apple側処理）

$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TestFlight ビルド＆サブミット" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: ログイン状態確認
Write-Host "[Step 1/4] EAS ログイン状態確認" -ForegroundColor Yellow
$whoami = & eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: eas login が必要です" -ForegroundColor Red
    Write-Host "  eas login を実行してから再度このスクリプトを起動してください"
    Pop-Location
    exit 1
}
Write-Host "  ログイン中: $whoami" -ForegroundColor Green
Write-Host ""

# Step 2: 認証情報チェック
Write-Host "[Step 2/4] iOS 認証情報の確認（必要なら自動生成）" -ForegroundColor Yellow
Write-Host "  ※ 初回は Apple ID と App-specific password の入力が必要です"
Write-Host "  ※ App-specific password は https://appleid.apple.com で発行"
Write-Host ""
Read-Host "  Enter で続行（Ctrl+Cで中止）"

# eas credentials は対話的なので、このスクリプトでは案内のみ
Write-Host "  以下のコマンドを別ターミナルで実行してください："
Write-Host "    eas credentials" -ForegroundColor Cyan
Write-Host "    -> Platform: iOS"
Write-Host "    -> Build profile: production"
Write-Host "    -> Action: Configure all credentials"
Write-Host ""
Read-Host "  認証情報の設定が完了したら Enter"

# Step 3: ビルド
Write-Host "[Step 3/4] iOS production ビルド開始" -ForegroundColor Yellow
Write-Host "  所要：30〜60分（EAS クラウドビルド）"
Write-Host ""

& eas build --platform ios --profile production --non-interactive
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: ビルド失敗" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "  ビルド完了" -ForegroundColor Green
Write-Host ""

# Step 4: サブミット
Write-Host "[Step 4/4] TestFlight にサブミット" -ForegroundColor Yellow
Write-Host ""

& eas submit --platform ios --profile production --latest --non-interactive
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: サブミット失敗。eas submit を手動実行してください" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  完了！" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "次のステップ："
Write-Host "  1. App Store Connect → TestFlight → 内部テスト"
Write-Host "  2. テスター（社長など）を追加"
Write-Host "  3. 招待メールが送信される"
Write-Host ""

Pop-Location
