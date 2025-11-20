# Joint Relay (WSS) Deployment

The Quest build expects to talk to the joint relay over `wss://` on port `4444`. The relay now supports production certificates without editing the file—just point it at your Let’s Encrypt pair via environment variables.

## 1. Locate certificates

On the EC2 host, find the paths to your cert and key. Common Greenlock/Let’s Encrypt locations:

- `/etc/letsencrypt/live/jordan77.httpsexample.xyz/fullchain.pem`
- `/etc/letsencrypt/live/jordan77.httpsexample.xyz/privkey.pem`
- `~/.config/greenlock/live/jordan77.httpsexample.xyz/`

If the files live elsewhere, that is fine—note the absolute paths.

## 2. Launch (or restart) the relay with TLS

```bash
cd /home/ubuntu/Game-551-fall-2025-MJ/A5_siteauth
export JOINT_RELAY_PORT=4444
export JOINT_RELAY_CERT_PATH="/etc/letsencrypt/live/jordan77.httpsexample.xyz/fullchain.pem"
export JOINT_RELAY_KEY_PATH="/etc/letsencrypt/live/jordan77.httpsexample.xyz/privkey.pem"
pm2 start tools/joint-relay-server.js --name joint-relay --update-env
pm2 save
```

Environment overrides:

- `JOINT_RELAY_CA_PATH` – optional chain bundle (defaults to `chain.pem` next to the cert).
- `JOINT_RELAY_FORCE_HTTP=1` – forces plain WS for local testing.
- `JOINT_RELAY_CERT_PEM`/`JOINT_RELAY_KEY_PEM` – allows inline cert/key text (replace literal `\n`).

## 3. Verify connectivity

1. Hit `https://jordan77.httpsexample.xyz:4444/` – you should see the “Joint Relay Test Server (WSS enabled)” page with a valid lock.
2. Open `https://jordan77.httpsexample.xyz/vr-social/landing.html` and click **Connect**. The relay status should flip to “connected” immediately on desktop and Quest.
3. If the page still shows `ws://`, make sure no shell exported `JOINT_RELAY_FORCE_HTTP`.

## 4. Troubleshooting

- `pm2 logs joint-relay` will print the exact certificate path that was detected.
- If the relay cannot find certs, it falls back to localhost dev files. Set the env vars explicitly to avoid that scenario.
- Change ports by exporting `JOINT_RELAY_PORT`, but keep the landing page default (4444) in sync if you do.
