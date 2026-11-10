<#
  Minimal static file server for local preview of this site.
  Node/Python are not installed on this machine, so PowerShell's HttpListener
  is used instead. Loopback only, read-only, no directory listing.
#>

param(
  [int]$Port = 8123
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

$pidFile = Join-Path $root '.serve.pid'
$PID | Out-File -FilePath $pidFile -Encoding ascii -NoNewline

Write-Host "Serving $root on http://127.0.0.1:$Port/ (pid $PID)"

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
  '.pdf'  = 'application/pdf'
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath)
    if ($rel -eq '/' -or $rel -eq '') { $rel = '/index.html' }

    $full = Join-Path $root ($rel.TrimStart('/') -replace '/', '\')
    $full = [IO.Path]::GetFullPath($full)

    if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $res.Close()
      continue
    }

    if (Test-Path -LiteralPath $full -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($full)
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-store')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes("404 Not found: $rel")
      $res.ContentType = 'text/plain; charset=utf-8'
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.Close()
  } catch {
    Write-Host "Request error: $($_.Exception.Message)"
    try { $ctx.Response.Abort() } catch {}
  }
}
