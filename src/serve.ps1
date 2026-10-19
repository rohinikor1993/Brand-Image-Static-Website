# Local preview server for the Brand Image website, used by "Start website.bat"
# when Node.js is not installed. Needs nothing beyond Windows PowerShell 5.1 (built into Windows 10/11).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File src\serve.ps1 -Port 3000
#
# Serves the "site" folder at http://localhost:PORT on this computer only (127.0.0.1),
# skips ports that other programs are using, and opens the default browser.

param(
  [int]$Port = 3000,
  [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'

$sitePath = Join-Path $PSScriptRoot '..\site'
if (-not (Test-Path -LiteralPath $sitePath -PathType Container)) {
  Write-Host "  The 'site' folder was not found next to 'src'. Keep the project folders together."
  exit 1
}
$root = (Resolve-Path -LiteralPath $sitePath).Path

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.js' = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.webmanifest' = 'application/manifest+json'
  '.xml' = 'application/xml'
  '.txt' = 'text/plain; charset=utf-8'
  '.webp' = 'image/webp'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.ico' = 'image/x-icon'
  '.woff2' = 'font/woff2'
}

# True when some other program already answers on [::1]:port (browsers try that address first).
function Test-Ipv6Busy([int]$p) {
  $client = $null
  try {
    $client = New-Object System.Net.Sockets.TcpClient -ArgumentList ([System.Net.Sockets.AddressFamily]::InterNetworkV6)
    $attempt = $client.BeginConnect([System.Net.IPAddress]::IPv6Loopback, $p, $null, $null)
    if ($attempt.AsyncWaitHandle.WaitOne(300) -and $client.Connected) { return $true }
    return $false
  } catch {
    return $false
  } finally {
    if ($client) { $client.Close() }
  }
}

$listener = $null
$startPort = $Port
for ($p = $startPort; $p -lt $startPort + 30; $p++) {
  if (Test-Ipv6Busy $p) { continue }
  $candidate = New-Object System.Net.Sockets.TcpListener -ArgumentList ([System.Net.IPAddress]::Loopback), $p
  try { $candidate.ExclusiveAddressUse = $true } catch { }
  try {
    $candidate.Start()
    $listener = $candidate
    $Port = $p
    break
  } catch {
    continue
  }
}
if (-not $listener) {
  Write-Host "  Could not find a free port between $startPort and $($startPort + 29)."
  exit 1
}

$url = "http://localhost:$Port/"
Write-Host ''
Write-Host "  Brand Image website is running at $url"
if ($Port -ne $startPort) { Write-Host "  (port $startPort is used by another program, so $Port is used instead)" }
Write-Host '  Keep this window open while you look around. Close it to stop.'
Write-Host ''
if (-not $NoOpen) { Start-Process $url }

$ascii = [System.Text.Encoding]::ASCII
while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $client.ReceiveTimeout = 1500
    $client.SendTimeout = 10000
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader -ArgumentList $stream, $ascii, $false, 4096, $true
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) { continue }
    while ($true) {
      $header = $reader.ReadLine()
      if ($header -eq $null -or $header -eq '') { break }
    }
    $parts = $requestLine.Split(' ')
    if ($parts.Length -lt 2) { continue }
    $method = $parts[0]
    $target = $parts[1].Split('?')[0]
    try { $relative = [System.Uri]::UnescapeDataString($target) } catch { $relative = '/' }
    if ($relative.EndsWith('/')) { $relative += 'index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $relative.TrimStart('/')))
    $status = '200 OK'
    if (-not $file.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $status = '404 Not Found'
      $file = Join-Path $root '404.html'
    }
    $body = [System.IO.File]::ReadAllBytes($file)
    $extension = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
    $type = 'application/octet-stream'
    if ($types.ContainsKey($extension)) { $type = $types[$extension] }
    $head = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
    $headBytes = $ascii.GetBytes($head)
    $stream.Write($headBytes, 0, $headBytes.Length)
    if ($method -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
    $stream.Flush()
  } catch {
    # a browser closed the connection early or sent nothing; serve the next request
  } finally {
    $client.Close()
  }
}
