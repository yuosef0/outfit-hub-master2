# Comprehensive cleanup: replace light+dark patterns with dark-only for always-dark theme
$files = Get-ChildItem -Path "app","components" -Recurse -Filter "*.tsx"
$totalUpdated = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $originalContent = $content

    # === Pattern 1: Replace "light-bg dark:dark-bg" with just dark-bg ===
    # Red status colors
    $content = $content -replace 'bg-red-50 dark:bg-red-900/20', 'bg-red-900/20'
    $content = $content -replace 'bg-red-100 dark:bg-red-900/30', 'bg-red-900/30'
    $content = $content -replace 'bg-red-100 dark:bg-red-900\b', 'bg-red-900'
    $content = $content -replace 'border-red-200 dark:border-red-800', 'border-red-800'
    $content = $content -replace 'text-red-600 dark:text-red-400', 'text-red-400'
    $content = $content -replace 'text-red-700 dark:text-red-300', 'text-red-300'
    $content = $content -replace 'text-red-700 dark:text-red-400', 'text-red-400'
    $content = $content -replace 'text-red-800 dark:text-red-200', 'text-red-200'
    $content = $content -replace 'hover:bg-red-200 dark:hover:bg-red-900/30', 'hover:bg-red-900/40'
    $content = $content -replace 'hover:bg-red-200\b', 'hover:bg-red-900/40'

    # Yellow status colors
    $content = $content -replace 'bg-yellow-50 dark:bg-yellow-900/20', 'bg-yellow-900/20'
    $content = $content -replace 'bg-yellow-100 dark:bg-yellow-900/30', 'bg-yellow-900/30'
    $content = $content -replace 'bg-yellow-100 dark:bg-yellow-900\b', 'bg-yellow-900'
    $content = $content -replace 'border-yellow-200 dark:border-yellow-800', 'border-yellow-800'
    $content = $content -replace 'text-yellow-600 dark:text-yellow-400', 'text-yellow-400'
    $content = $content -replace 'text-yellow-700 dark:text-yellow-400', 'text-yellow-400'
    $content = $content -replace 'text-yellow-800 dark:text-yellow-200', 'text-yellow-200'
    $content = $content -replace 'hover:bg-yellow-200\b', 'hover:bg-yellow-900/40'

    # Green status colors
    $content = $content -replace 'bg-green-50 dark:bg-green-900/20', 'bg-green-900/20'
    $content = $content -replace 'bg-green-100 dark:bg-green-900/20', 'bg-green-900/20'
    $content = $content -replace 'bg-green-100 dark:bg-green-900/30', 'bg-green-900/30'
    $content = $content -replace 'border-green-200 dark:border-green-800', 'border-green-800'
    $content = $content -replace 'text-green-600 dark:text-green-400', 'text-green-400'
    $content = $content -replace 'text-green-700 dark:text-green-400', 'text-green-400'
    $content = $content -replace 'hover:bg-green-200\b', 'hover:bg-green-900/40'

    # Blue status colors
    $content = $content -replace 'bg-blue-50 dark:bg-blue-900/20', 'bg-blue-900/20'
    $content = $content -replace 'border-blue-200 dark:border-blue-800', 'border-blue-800'
    $content = $content -replace 'text-blue-700 dark:text-blue-300', 'text-blue-300'
    $content = $content -replace 'text-blue-800 dark:text-blue-200', 'text-blue-200'
    $content = $content -replace 'text-blue-900 dark:text-blue-100', 'text-blue-100'

    # Purple status colors
    $content = $content -replace 'bg-purple-100 dark:bg-purple-900/30', 'bg-purple-900/30'
    $content = $content -replace 'text-purple-600 dark:text-purple-400', 'text-purple-400'
    $content = $content -replace 'text-purple-700 dark:text-purple-400', 'text-purple-400'

    # Amber status colors
    $content = $content -replace 'bg-amber-100 dark:bg-amber-900/30', 'bg-amber-900/30'
    $content = $content -replace 'text-amber-700 dark:text-amber-400', 'text-amber-400'

    # Pink / Teal
    $content = $content -replace 'bg-pink-50 dark:bg-pink-900/20', 'bg-pink-900/20'
    $content = $content -replace 'bg-teal-50 dark:bg-teal-900/20', 'bg-teal-900/20'

    # Primary
    $content = $content -replace 'bg-primary/10 dark:bg-primary/20', 'bg-primary/20'

    # Slate/gray special patterns
    $content = $content -replace 'bg-slate-200 dark:bg-slate-700', 'bg-card-light'
    $content = $content -replace 'from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-900', 'from-slate-700 to-slate-900'

    # === Pattern 2: Remove redundant dark: prefixes ===
    $content = $content -replace ' dark:text-text-light-secondary', ''
    $content = $content -replace ' dark:text-text-light-primary', ''
    $content = $content -replace ' dark:bg-surface-dark', ''
    $content = $content -replace ' dark:bg-surface-light', ''
    $content = $content -replace ' dark:border-background-dark', ''
    $content = $content -replace ' dark:text-primary\b', ''
    $content = $content -replace ' dark:bg-neutral-900', ''
    $content = $content -replace ' dark:shadow-none', ''
    $content = $content -replace ' dark:bg-transparent', ''
    $content = $content -replace ' dark:bg-gray-900\b', ''
    $content = $content -replace ' dark:bg-\[#0a0a0a\]', ''
    $content = $content -replace ' dark:!bg-slate-800', ''
    $content = $content -replace ' dark:!bg-black/70', ''
    $content = $content -replace ' dark:border-\[#101622\]', ''
    $content = $content -replace ' dark:border-slate-700', ''

    # Remove redundant dark:hover prefixes
    $content = $content -replace ' dark:hover:border-primary', ''
    $content = $content -replace ' dark:hover:text-white', ''
    $content = $content -replace ' dark:hover:text-gray-200', ''
    $content = $content -replace ' dark:hover:text-slate-200', ''
    $content = $content -replace ' dark:hover:text-slate-700', ''
    $content = $content -replace ' dark:hover:border-gray-700', ''
    $content = $content -replace ' dark:hover:bg-red-900/10', ''
    $content = $content -replace ' dark:hover:bg-red-900/30', ''
    $content = $content -replace ' dark:hover:bg-primary/30', ''
    $content = $content -replace ' dark:hover:bg-surface-light', ''

    # === Pattern 3: Special cases ===
    # Placeholder colors
    $content = $content -replace 'placeholder:text-\[#4c669a\] dark:placeholder:text-text-light-secondary', 'placeholder:text-text-light-secondary'
    $content = $content -replace 'placeholder-gray-400 dark:placeholder-gray-600', 'placeholder-text-light-secondary'
    $content = $content -replace ' dark:placeholder-gray-500', ''
    $content = $content -replace ' dark:placeholder-gray-600', ''

    # Text color with hex fallback
    $content = $content -replace 'text-\[#4c669a\] dark:text-text-light-secondary', 'text-text-light-secondary'

    # SVG dark:invert -> invert (always dark bg)
    $content = $content -replace ' dark:invert', ' invert'

    # border-gray-100/50 -> border-border-light/50
    $content = $content -replace 'border-gray-100/50', 'border-border-light/50'

    # text-primary dark:text-blue-400 -> text-primary
    $content = $content -replace 'text-primary dark:text-blue-400', 'text-primary'

    # border-green-200 (standalone) -> border-green-800
    $content = $content -replace 'border-green-200\b', 'border-green-800'

    # Clean double spaces
    $content = $content -replace '  +', ' '

    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $totalUpdated++
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! Updated $totalUpdated files."
