$files = Get-ChildItem -Path "d:\uyirinai\apps\mobile" -Recurse -Include *.tsx,*.ts,*.js,*.json -File
foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw
    $updated = $content -replace '(?i)kizuna','Uyirinai'
    Set-Content -Path $f.FullName -Value $updated
}
