# GARRISON 360: DATABASE PERMISSIONS HARDENING
# This script ensures that only the CURRENT user can access the local.db file.

$dbFile = "database/db/local.db"

if (Test-Path $dbFile) {
    Write-Host "--- Hardening Permissions for $dbFile ---" -ForegroundColor Cyan
    
    # Disable inheritance and remove all inherited permissions
    $acl = Get-Acl $dbFile
    $acl.SetAccessRuleProtection($true, $false)
    Set-Acl $dbFile $acl
    
    # Grant FullControl to the CURRENT USER only
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentUser, "FullControl", "Allow")
    $acl = Get-Acl $dbFile
    $acl.AddAccessRule($rule)
    Set-Acl $dbFile $acl
    
    Write-Host "[OK] Permissions locked. Only $currentUser can access the database file." -ForegroundColor Green
} else {
    Write-Host "[WARN] Database file not found at $dbFile. Run the server first to create it." -ForegroundColor Yellow
}
