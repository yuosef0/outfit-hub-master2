# Final cleanup pass for remaining dark:bg-gray-* and other remnants
$files = Get-ChildItem -Path "app","components" -Recurse -Filter "*.tsx"

$totalUpdated = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $originalContent = $content

    # Remove remaining dark:bg-gray-* patterns (they follow bg-card-light or bg-surface-light already)
    $content = $content -replace ' dark:bg-gray-600', ''
    $content = $content -replace ' dark:bg-gray-700', ''
    $content = $content -replace ' dark:bg-gray-800', ''
    $content = $content -replace ' dark:hover:bg-gray-600', ''
    $content = $content -replace ' dark:hover:bg-gray-700', ''
    $content = $content -replace ' dark:hover:bg-gray-800', ''
    $content = $content -replace ' dark:group-hover:bg-gray-700', ''
    $content = $content -replace ' dark:checked:bg-primary', ''
    $content = $content -replace ' dark:peer-focus:ring-primary/40', ''
    $content = $content -replace ' dark:text-text-light-primary', ''
    $content = $content -replace ' dark:hover:bg-surface-light', ''
    $content = $content -replace ' dark:bg-black', ''

    # Fix bg-[#cfd7e7] -> bg-border-light
    $content = $content -replace 'bg-\[#cfd7e7\]', 'bg-border-light'

    # Fix bg-gray-50 -> bg-card-light
    $content = $content -replace 'bg-gray-50', 'bg-card-light'

    # Fix text-gray-300 (for star ratings etc)
    $content = $content -replace "text-gray-300 dark:text-text-light-secondary", "text-text-light-secondary"
    $content = $content -replace 'text-gray-300', 'text-text-light-secondary'

    # Fix bg-black (for Apple auth button) -> bg-surface-light
    $content = $content -replace 'bg-black ', 'bg-surface-light '

    # Fix hover:bg-gray-800
    $content = $content -replace 'hover:bg-gray-800', 'hover:bg-card-light'

    # Clean double spaces
    $content = $content -replace '  +', ' '

    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $totalUpdated++
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! Updated $totalUpdated files."
