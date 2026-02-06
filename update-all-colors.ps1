# Script to update all colors across the project

$files = Get-ChildItem -Path "." -Recurse -Include "*.tsx", "*.ts", "*.jsx", "*.js" -Exclude "node_modules", ".next", "dist"

$replacements = @{
    # Background colors
    'bg-slate-50 dark:bg-black' = 'bg-background-light dark:bg-background-dark'
    'bg-slate-50 dark:bg-\[#000000\]' = 'bg-background-light dark:bg-background-dark'
    'bg-white dark:bg-black' = 'bg-background-light dark:bg-background-dark'
    'bg-white dark:bg-\[#000000\]' = 'bg-background-light dark:bg-background-dark'

    # Specific dark:bg-black patterns
    'dark:bg-black(?!")' = 'dark:bg-background-dark'

    # Card and surface colors
    'bg-slate-100 dark:bg-slate-900' = 'bg-background-light dark:bg-card-dark'
    'bg-slate-100 dark:bg-slate-800' = 'bg-background-light dark:bg-card-dark'
    'bg-slate-50 dark:bg-slate-900' = 'bg-background-light dark:bg-card-dark'
    'bg-gray-100 dark:bg-gray-900' = 'bg-background-light dark:bg-card-dark'
    'bg-gray-50 dark:bg-gray-900' = 'bg-background-light dark:bg-card-dark'

    # Hover states
    'hover:bg-slate-100 dark:hover:bg-slate-900' = 'hover:bg-slate-100 dark:hover:bg-card-dark'
    'hover:bg-slate-100 dark:hover:bg-slate-800' = 'hover:bg-slate-100 dark:hover:bg-card-dark'
    'hover:bg-gray-100 dark:hover:bg-gray-900' = 'hover:bg-gray-100 dark:hover:bg-card-dark'
    'hover:bg-gray-100 dark:hover:bg-gray-800' = 'hover:bg-gray-100 dark:hover:bg-card-dark'

    # Text colors - keeping slate for now, as they are semantic
    # But updating very dark backgrounds
    'text-\[#0d141b\]' = 'text-text-light-primary'
    'text-\[#0d121b\]' = 'text-text-light-primary'
}

$count = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Encoding UTF8 | Out-String
        $originalContent = $content

        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $content = $content -replace $pattern, $replacement
        }

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Updated: $($file.FullName)"
            $count++
        }
    }
    catch {
        Write-Host "Error processing $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host "`nTotal files updated: $count" -ForegroundColor Green
