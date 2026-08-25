@echo off
setlocal
title FrameForge - detection du PC
REM ================================================================
REM   FrameForge - Analyse AUTOMATIQUE du PC
REM   Double-clique ce fichier : il lit ta carte graphique, ton
REM   processeur et ta RAM, puis ouvre FrameForge avec le resultat.
REM   Il n'installe rien et n'envoie rien a un serveur.
REM
REM   Quand ton site sera EN LIGNE, remplace l'adresse SITE ci-dessous
REM   par ton URL (exemple : https://mon-site.fr)
REM ================================================================
set "SITE=http://localhost:5173"
echo.
echo   Analyse de ton PC en cours, patiente une seconde...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $g=(Get-CimInstance Win32_VideoController | Where-Object { $_.Name -and $_.Name -notmatch 'Basic|Remote|Virtual|Meta|Parsec|DameWare|Mirror|Citrix' } | Sort-Object AdapterRAM -Descending | Select-Object -First 1 -ExpandProperty Name); if(-not $g){$g=(Get-CimInstance Win32_VideoController | Select-Object -First 1 -ExpandProperty Name)}; if(-not $g){$g='Inconnu'}; $c=Get-CimInstance Win32_Processor | Select-Object -First 1; $o=[pscustomobject]@{gpu=$g; cpu=($c.Name).Trim(); cores=[int]$c.NumberOfCores; ram=[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB)}; $code='FF1-'+([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(($o | ConvertTo-Json -Compress))).TrimEnd('=').Replace('+','-').Replace('/','_')); $url='%SITE%/verificateur#pc='+$code; Write-Host ''; Write-Host ('  Carte graphique : '+$o.gpu) -ForegroundColor Cyan; Write-Host ('  Processeur      : '+$o.cpu+' ('+$o.cores+' coeurs)') -ForegroundColor Cyan; Write-Host ('  Memoire (RAM)   : '+$o.ram+' Go') -ForegroundColor Cyan; Write-Host ''; Write-Host '  Ouverture de FrameForge avec ton materiel...' -ForegroundColor Green; Start-Process $url; try { Set-Clipboard -Value $code } catch { }; Write-Host ''; Write-Host '  Si le site ne s ouvre pas, colle ce code sur la page Verificateur :' -ForegroundColor DarkGray; Write-Host ('     '+$code) -ForegroundColor Yellow"
echo.
pause
endlocal
