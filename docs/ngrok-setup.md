# Ngrok Workflow for Local HTTPS Testing

WebXR on Quest requires HTTPS with a publicly trusted certificate. Instead of fighting LAN certificates and firewalls, run your local stack normally and expose it through ngrok tunnels.

## 1. Install ngrok

1. Download and install ngrok for Windows from <https://ngrok.com/download>.
2. In PowerShell, register your auth token (from the ngrok dashboard):
   ```powershell
   ngrok config add-authtoken <YOUR_TOKEN>
   ```

## 2. Configure tunnels

1. Copy `A6_vrSocial/ngrok.template.yml` to `%USERPROFILE%\.ngrok2\ngrok.yml` (overwrite if you already have one).
2. Replace `YOUR_TOKEN_HERE` with your real token.
3. The template exposes three local ports:
   - `5501` → Live Server (static site)
   - `4000` → Express HTTPS API
   - `4444` → Joint relay WebSocket (TLS tunnel)

> Tip: If you prefer a per-project config, run ngrok with `--config "path\to\ngrok.template.yml"` instead of copying.

## 3. Start local servers

From the repo root:

```powershell
cd "C:\Users\stram\OneDrive\Documents\GitHub\Game-551-fall-2025-MJ"
# 1. Live Server (VS Code extension) – ensure it is running on port 5501
# 2. HTTPS API (new terminal)
cd .\A6_vrSocial
npm run https-api
# 3. Joint relay (another terminal)
$env:JOINT_RELAY_FORCE_HTTP = '1'
npm run relay
```

The scripts simply call the Node entry points (`node server-https.js` and `node tools/joint-relay-server.js`), so you can still run the raw commands if you prefer.
When you are done, clear the override with `Remove-Item Env:JOINT_RELAY_FORCE_HTTP`.

## 4. Start ngrok

In a new terminal:

```powershell
npm run tunnel
```

`npm run tunnel` shells out to `ngrok start --all`, so make sure the `ngrok` binary is on your `PATH`. ngrok prints three HTTPS URLs, one per tunnel. Each ends with `.ngrok-free.app` and already has a trusted certificate. The bundled config points the relay tunnel at HTTP because ngrok’s free plan cannot create TLS upstreams; the external URL is still served over `https://` / `wss://`.

## 5. Connect the app

1. Open the Live Server tunnel URL in your desktop browser to verify it loads (e.g. `https://abcd-1234.ngrok-free.app`).
2. In the landing UI:
   - Set **Rooms API** to the API tunnel URL (e.g. `https://wxyz-5678.ngrok-free.app`).
   - Set the **Joint Relay** field to the relay tunnel, using `wss://` (e.g. `wss://pqrs-9012.ngrok-free.app`).
   - Click **Connect** for the relay.
3. Put the same Live Server URL into the Quest Browser. Because the certificate is public, it just works—no extra trust steps required.

You can save the API and relay URLs: they persist in `localStorage`, so you only need to paste them once per session.

## 6. Shut down

When finished:

- Stop ngrok (`Ctrl+C`).
- Stop the relay and API node processes.
- Close Live Server or leave it for the next session.

---

### Optional: Reserved domains

Free ngrok URLs change each run. If you need consistent addresses, upgrade ngrok or use an alternative such as Cloudflare Tunnel. The landing page inputs support any HTTPS/WSS origin, so you can swap providers without code changes.
