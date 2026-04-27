$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidStudioJbr = "C:\Program Files\Android\Android Studio\jbr"

if (-not (Test-Path "$androidStudioJbr\bin\java.exe")) {
  throw "Android Studio Java runtime was not found at $androidStudioJbr"
}

$env:JAVA_HOME = $androidStudioJbr
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:GRADLE_USER_HOME = Join-Path $env:USERPROFILE ".gradle-smart-tour-build"

Set-Location (Join-Path $projectRoot "android")
.\gradlew.bat bundleRelease
