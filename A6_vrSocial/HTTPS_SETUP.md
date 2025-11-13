# Using ngrok to expose your VR app with HTTPS

## Step 1: Install ngrok
1. Download from: https://ngrok.com/download
2. Extract ngrok.exe to your A6_vrSocial folder
3. Sign up for free account at https://ngrok.com
4. Run: `ngrok config add-authtoken YOUR_TOKEN`

## Step 2: Start ngrok tunnel
```bash
ngrok http 8080
```

This will give you an HTTPS URL like:
```
https://abc123.ngrok-free.app
```

## Step 3: Use the HTTPS URL on Quest
Open the ngrok HTTPS URL in your Quest browser!

## Alternative: Self-Signed Certificate (More Complex)

If you prefer local HTTPS without tunneling, you need to:
1. Generate SSL certificate
2. Modify server.js to use HTTPS
3. Trust the certificate on Quest (harder)

ngrok is much easier for development!
