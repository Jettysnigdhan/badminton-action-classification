<#
.SYNOPSIS
Launch the Python model server and the Next.js website in two separate PowerShell windows.

.DESCRIPTION
This helper assumes the repository root contains:
- .venv\Scripts\python.exe
- model\model.pt
- website\package.json

Usage:
  .\start_servers.ps1
#>

param(
    [string]$ModelPort = "8000",
    [string]$WebsitePort = "3000"
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$modelDir = Join-Path $repoRoot "model"
$websiteDir = Join-Path $repoRoot "website"
$modelPath = Join-Path $modelDir "model.pt"
$pythonSrcDir = Join-Path $modelDir "src"

# Determine Python executable:
# Priority: repo .venv -> activated VIRTUAL_ENV -> 'python' on PATH
$pythonDefault = Join-Path $repoRoot ".venv\Scripts\python.exe"
if (Test-Path $pythonDefault) {
    $python = $pythonDefault
} elseif ($env:VIRTUAL_ENV) {
    $pythonFromEnv = Join-Path $env:VIRTUAL_ENV "Scripts\python.exe"
    if (Test-Path $pythonFromEnv) {
        $python = $pythonFromEnv
    } else {
        $python = "python"
    }
} else {
    # Try searching parent directories for a .venv folder (common when repo is opened from a parent folder)
    $found = $false
    $cwd = $repoRoot
    for ($i = 0; $i -lt 4 -and -not $found; $i++) {
        $candidate = Join-Path $cwd ".venv\Scripts\python.exe"
        if (Test-Path $candidate) {
            $python = $candidate
            $found = $true
            break
        }
        $cwd = Split-Path $cwd -Parent
        if (-not $cwd) { break }
    }
    if (-not $found) {
        $python = "python"
    }
}

if (-not (Test-Path $python)) {
    Write-Error "Python executable not found: $python"
    exit 1
}

if (-not (Test-Path $modelPath)) {
    Write-Error "Model file not found: $modelPath"
    exit 1
}

Write-Host "Starting model server from: $modelDir"
$pythonCommand = @"
Set-Location '$modelDir'
`$env:MODEL_PATH = '$modelPath'
`$env:PYTHONPATH = '$pythonSrcDir'
Write-Host 'Using Python:' '$python'
Write-Host 'Loading model from:' '$modelPath'
& '$python' -m uvicorn badminton.serving.app:app --host 127.0.0.1 --port $ModelPort
"@
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    $pythonCommand
) -WorkingDirectory $repoRoot -WindowStyle Normal

Start-Sleep -Seconds 2
Write-Host "Starting website from: $websiteDir"
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$websiteDir'; npm run dev"
) -WorkingDirectory $repoRoot -WindowStyle Normal

Write-Host "Website will be available at http://localhost:$WebsitePort"
Write-Host "Model server will be available at http://127.0.0.1:$ModelPort"
