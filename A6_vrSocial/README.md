# VR Social Platform - A6

Multi-user VR social platform with Gaussian splats, hand tracking, and voice chat.

## Phase 1: Hand Tracking Test

This initial version tests:
- ✅ Three.js + WebXR setup
- ✅ Quest hand tracking
- ✅ Basic VR environment
- ✅ Socket.io server ready for multiplayer

## Setup Instructions

### Local Development

1. Install dependencies:
```bash
cd A6_vrSocial
npm install
```

2. Run the server:
```bash
npm start
```

3. Open browser:
```
http://localhost:8080
```

### Testing on Quest

1. Make sure your Quest is on the same network
2. Find your computer's local IP (run `ipconfig` on Windows)
3. On Quest browser, navigate to: `http://YOUR-IP:8080`
4. Click "Enter VR" button
5. Enable hand tracking in Quest settings if not already enabled

### Deploy to EC2

1. SSH into your EC2 instance:
```bash
ssh -i ~/.ssh/mark.pem ubuntu@98.90.250.62
```

2. Clone/pull the repository:
```bash
cd ~
git pull origin main  # or clone if first time
```

3. Navigate to project and install:
```bash
cd Game-551-fall-2025-MJ/A6_vrSocial
npm install
```

4. Run with PM2:
```bash
pm2 start server.js --name vr-social
pm2 save
```

5. Access from Quest:
```
https://your-domain.com:8080
```

## What's Working

- ✅ Basic VR scene with grid floor
- ✅ Hand tracking visualization
- ✅ Reference cubes to see depth
- ✅ Socket.io server ready for multiplayer
- ✅ WebXR VR button

## Next Steps

1. Test hand tracking on Quest
2. Add avatar system
3. Add multiplayer position sync
4. Integrate Gaussian splat loader
5. Add voice chat

## Current Status

**Framework chosen:** Three.js + WebXR (you already know it!)
**Server:** Express + Socket.io
**Ready to test:** Yes! Deploy and test on Quest

## Notes

- Hand tracking requires Quest 2/3/Pro with hand tracking enabled
- Make sure to enable hand tracking in Quest settings
- Browser must support WebXR (Quest browser does)
