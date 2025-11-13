@echo off
echo ========================================
echo Starting ngrok tunnel for VR Social App
echo ========================================
echo.
echo 1. Make sure Node server is running on port 8080
echo 2. ngrok will create an HTTPS tunnel
echo 3. Look for the "Forwarding" line below
echo 4. Copy the https:// URL
echo 5. Add /landing.html to the end
echo 6. Open on your Quest!
echo.
echo ========================================
echo.
ngrok http 8080
