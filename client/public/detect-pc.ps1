# ============================================================================
#  FrameForge - Analyse locale du materiel (version lisible)
# ----------------------------------------------------------------------------
#  Ce script LIT uniquement : ta carte graphique, ton processeur et ta RAM,
#  puis OUVRE FrameForge dans ton navigateur avec le resultat.
#
#  Il n'installe rien, ne modifie rien, et N'ENVOIE RIEN a un serveur :
#  les infos voyagent dans le FRAGMENT de l'URL (#...), qui reste dans ton
#  navigateur et n'est jamais transmis. Le code source est lisible ci-dessous.
#
#  Pour l'executer : clic droit -> "Executer avec PowerShell",
#  ou :  powershell -ExecutionPolicy Bypass -File detect-pc.ps1
# ============================================================================

# >> Quand ton site sera EN LIGNE, remplace cette adresse par ton URL (ex : https://mon-site.fr)
$SiteUrl = 'http://localhost:5173'

$ErrorActionPreference = 'SilentlyContinue'

# --- Carte graphique : celle avec le plus de VRAM (souvent la dediee),
#     en ignorant les peripheriques virtuels (bureau a distance, capture, etc.) ---
$gpu = Get-CimInstance Win32_VideoController |
    Where-Object { $_.Name -and $_.Name -notmatch 'Basic|Remote|Virtual|Meta|Parsec|DameWare|Mirror|Citrix' } |
    Sort-Object AdapterRAM -Descending |
    Select-Object -First 1 -ExpandProperty Name
if (-not $gpu) { $gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1 -ExpandProperty Name }
if (-not $gpu) { $gpu = 'Inconnu' }

# --- Processeur : nom + nombre de coeurs physiques ---
$cpuObj = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpu    = ($cpuObj.Name).Trim()
$cores  = [int]$cpuObj.NumberOfCores
if (-not $cpu) { $cpu = 'Inconnu' }

# --- RAM totale, arrondie au Go ---
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)

# --- On empaquette tout dans un petit code (JSON -> base64 URL-safe) ---
$json = ([pscustomobject]@{ gpu = $gpu; cpu = $cpu; cores = $cores; ram = $ram } | ConvertTo-Json -Compress)
$code = 'FF1-' + ([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$url  = "$SiteUrl/verificateur#pc=$code"

# --- Affichage + ouverture automatique du site ---
Write-Host ''
Write-Host '  FrameForge - materiel detecte' -ForegroundColor Cyan
Write-Host '  -----------------------------'
Write-Host ("  Carte graphique : {0}" -f $gpu)
Write-Host ("  Processeur      : {0} ({1} coeurs)" -f $cpu, $cores)
Write-Host ("  Memoire (RAM)   : {0} Go" -f $ram)
Write-Host ''
Write-Host '  Ouverture de FrameForge avec ton materiel...' -ForegroundColor Green
Start-Process $url

Write-Host ''
Write-Host '  Si le site ne s ouvre pas tout seul, colle ce code sur la page Verificateur :' -ForegroundColor DarkGray
Write-Host "     $code" -ForegroundColor Yellow
try { Set-Clipboard -Value $code } catch { }
Write-Host ''
Read-Host '  Appuie sur Entree pour fermer'
