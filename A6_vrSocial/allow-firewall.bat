@echo off
echo Adding Windows Firewall rule for Node.js on port 8080...
netsh advfirewall firewall add rule name="Node VR Server 8080" dir=in action=allow protocol=TCP localport=8080
echo.
echo Firewall rule added successfully!
echo.
echo You can now access the server from Quest at:
echo http://192.168.1.89:8080/landing.html
echo.
pause
