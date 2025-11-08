@echo off
setlocal enabledelayedexpansion

set "WSL_PATH=/mnt/e/Tiny_Walnut_Games/vLLM-Bootstrap/server"
set "COMMAND=%*"

if "!COMMAND!"=="" (
  wsl -d Ubuntu bash -c "cd !WSL_PATH! && npm run manage-users list"
) else (
  wsl -d Ubuntu bash -c "cd !WSL_PATH! && npm run manage-users !COMMAND!"
)
