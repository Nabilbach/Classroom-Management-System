$dbs = @(
  'C:/Users/nabil/OneDrive/Documents/Classroom Management System/classroom.db',
  'C:/Users/nabil/OneDrive/Documents/Classroom Management System/classroom_dev.db',
  'C:/Users/nabil/OneDrive/Documents/Classroom Management System/classroom_test.db',
  'C:/Users/nabil/OneDrive/Documents/Classroom Management System/classroom_backup_safe.db',
  'C:/Users/nabil/OneDrive/Documents/Classroom Management System/classroom_before_restore_2025-09-26T14-53-53-289Z.db',
  'C:/Users/nabil/OneDrive/Documents/Classroom Management System/classroom.before_attendance_fix.2025-09-29.db'
)

foreach ($db in $dbs) {
  Write-Host "DB: $db"
  if (-Not (Test-Path $db)) {
    Write-Host "  File not found"
    continue
  }

  # Check FollowUps table
  $fuExists = sqlite3 "$db" "SELECT name FROM sqlite_master WHERE type='table' AND name='FollowUps';" 2>$null
  if ([string]::IsNullOrEmpty($fuExists)) {
    Write-Host "  FollowUps: table_missing"
  } else {
    $fuCount = sqlite3 "$db" "SELECT COUNT(1) FROM FollowUps;" 2>$null
    Write-Host "  FollowUps: $fuCount"
  }

  # Check StudentAssessments table
  $saExists = sqlite3 "$db" "SELECT name FROM sqlite_master WHERE type='table' AND name='StudentAssessments';" 2>$null
  if ([string]::IsNullOrEmpty($saExists)) {
    Write-Host "  StudentAssessments: table_missing"
  } else {
    $saCount = sqlite3 "$db" "SELECT COUNT(1) FROM StudentAssessments;" 2>$null
    Write-Host "  StudentAssessments: $saCount"
  }

  Write-Host "---"
}
