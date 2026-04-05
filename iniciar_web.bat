@echo off
echo ===========================================
echo   Iniciant el servidor web (MotorSin)...
echo ===========================================
echo.

:: Comprova si python està instal·lat
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Iniciant servidor amb Python al port 8000...
    start http://localhost:8000
    python -m http.server 8000
    pause
    exit /b
)

:: Si no funciona, prova amb la comanda 'py' típica de Windows
py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Iniciant servidor amb Python al port 8000...
    start http://localhost:8000
    py -m http.server 8000
    pause
    exit /b
)

:: Si tampoc té Python, t'obrirà la web directament (sense localhost)
echo No s'ha trobat ni Node.js ni Python actius al teu ordinador.
echo Obrint la pagina web directament des del disc...
start index.html
pause
