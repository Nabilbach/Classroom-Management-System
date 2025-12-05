@echo off
:: Clear Windows Icon Cache to show new icon

echo Clearing Windows icon cache...

:: Stop Windows Explorer
taskkill /f /im explorer.exe >nul 2>&1

:: Delete icon cache files
echo Deleting icon cache files...
cd /d "%userprofile%\AppData\Local"
attrib -h IconCache.db >nul 2>&1
del IconCache.db >nul 2>&1
attrib -h Microsoft\Windows\Explorer\iconcache_*.db >nul 2>&1
del Microsoft\Windows\Explorer\iconcache_*.db >nul 2>&1

:: Restart Windows Explorer
echo Restarting Windows Explorer...
start explorer.exe

echo.
echo Done! Icon cache cleared.
echo Please check your desktop shortcut now.
echo.
pause
