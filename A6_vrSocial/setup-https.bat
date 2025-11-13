@echo off
echo Installing mkcert globally...
call npm install -g mkcert
echo.
echo Creating SSL certificates...
call npx mkcert create-ca
call npx mkcert create-cert --key localhost-key.pem --cert localhost.pem localhost 192.168.1.89
echo.
echo ✅ SSL certificates created!
echo.
echo Now you can run: node server-https.js
echo.
pause
