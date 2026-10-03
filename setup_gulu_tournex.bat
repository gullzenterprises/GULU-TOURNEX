@echo off
setlocal EnableExtensions

REM ============================================
REM GULU TOURNEX - Project Setup
REM ============================================

REM If this BAT file is inside GULU-TOURNEX, use that folder.
REM Otherwise create GULU-TOURNEX beside this BAT file.
for %%I in ("%~dp0.") do set "BASE=%%~fI"
for %%I in ("%BASE%") do set "BASE_NAME=%%~nxI"

if /I "%BASE_NAME%"=="GULU-TOURNEX" (
    set "ROOT=%BASE%"
) else (
    set "ROOT=%BASE%\GULU-TOURNEX"
)

echo.
echo ============================================
echo        GULU TOURNEX PROJECT SETUP
echo ============================================
echo.
echo Project folder:
echo %ROOT%
echo.

REM Create main folders
mkdir "%ROOT%" 2>nul
mkdir "%ROOT%\frontend" 2>nul
mkdir "%ROOT%\backend" 2>nul
mkdir "%ROOT%\database" 2>nul
mkdir "%ROOT%\docs" 2>nul
mkdir "%ROOT%\assets" 2>nul

REM Create starter frontend files
if not exist "%ROOT%\frontend\index.html" (
    >"%ROOT%\frontend\index.html" echo ^<!DOCTYPE html^>
    >>"%ROOT%\frontend\index.html" echo ^<html lang="en"^>
    >>"%ROOT%\frontend\index.html" echo ^<head^>
    >>"%ROOT%\frontend\index.html" echo     ^<meta charset="UTF-8"^>
    >>"%ROOT%\frontend\index.html" echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
    >>"%ROOT%\frontend\index.html" echo     ^<title^>GULU TOURNEX^</title^>
    >>"%ROOT%\frontend\index.html" echo     ^<link rel="stylesheet" href="style.css"^>
    >>"%ROOT%\frontend\index.html" echo ^</head^>
    >>"%ROOT%\frontend\index.html" echo ^<body^>
    >>"%ROOT%\frontend\index.html" echo     ^<main^>
    >>"%ROOT%\frontend\index.html" echo         ^<h1^>GULU TOURNEX^</h1^>
    >>"%ROOT%\frontend\index.html" echo         ^<p^>Project setup complete.^</p^>
    >>"%ROOT%\frontend\index.html" echo     ^</main^>
    >>"%ROOT%\frontend\index.html" echo     ^<script src="script.js"^>^</script^>
    >>"%ROOT%\frontend\index.html" echo ^</body^>
    >>"%ROOT%\frontend\index.html" echo ^</html^>
)

if not exist "%ROOT%\frontend\style.css" (
    >"%ROOT%\frontend\style.css" echo * { box-sizing: border-box; }
    >>"%ROOT%\frontend\style.css" echo body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
    >>"%ROOT%\frontend\style.css" echo main { min-height: 100vh; display: grid; place-items: center; text-align: center; padding: 24px; }
)

if not exist "%ROOT%\frontend\script.js" (
    >"%ROOT%\frontend\script.js" echo console.log("GULU TOURNEX demo loaded.");
)

REM Create documentation files
if not exist "%ROOT%\README.md" (
    >"%ROOT%\README.md" echo # GULU TOURNEX
    >>"%ROOT%\README.md" echo.
    >>"%ROOT%\README.md" echo Project workspace for the GULU TOURNEX website.
    >>"%ROOT%\README.md" echo.
    >>"%ROOT%\README.md" echo Build stages will be added step by step.
)

if not exist "%ROOT%\.gitignore" (
    >"%ROOT%\.gitignore" echo node_modules/
    >>"%ROOT%\.gitignore" echo .env
    >>"%ROOT%\.env" rem This line is intentionally a no-op placeholder.
)

REM Remove accidental placeholder .env created by some CMD parsing scenarios.
if exist "%ROOT%\.env" del /q "%ROOT%\.env" 2>nul

REM Keep empty folders visible to Git later
if not exist "%ROOT%\backend\.gitkeep" type nul > "%ROOT%\backend\.gitkeep"
if not exist "%ROOT%\database\.gitkeep" type nul > "%ROOT%\database\.gitkeep"
if not exist "%ROOT%\docs\.gitkeep" type nul > "%ROOT%\docs\.gitkeep"
if not exist "%ROOT%\assets\.gitkeep" type nul > "%ROOT%\assets\.gitkeep"

echo.
echo ============================================
echo SETUP COMPLETE
echo ============================================
echo.
echo Created:
echo   GULU-TOURNEX\
echo     frontend\
echo       index.html
echo       style.css
echo       script.js
echo     backend\
echo     database\
echo     docs\
echo     assets\
echo     README.md
echo     .gitignore
echo.
echo Open the project in VS Code:
echo   code "%ROOT%"
echo.
echo Press any key to close...
pause >nul

endlocal
