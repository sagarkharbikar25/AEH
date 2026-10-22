# POLARIS Operations Runbook

## 1. Quick Service Controls

### Status Check
```bash
sudo systemctl status decider
sudo systemctl status polaris-api
sudo systemctl status caddy
```

### Restarting Services
```bash
# Restart Decider 2B router (port 8000)
sudo systemctl restart decider

# Restart Express API (port 3000)
sudo systemctl restart polaris-api

# Reload Caddy reverse proxy
sudo systemctl reload caddy
```

### Viewing Live Logs
```bash
# Decider 2B inference logs
sudo journalctl -u decider -f -n 100

# Polaris Express & SSE stream logs
sudo journalctl -u polaris-api -f -n 100

# Caddy access logs
sudo journalctl -u caddy -f -n 100
```

---

## 2. Health & Readiness Diagnostics
Check local endpoint status:
```bash
# Check probe
curl -s http://localhost:3000/api/health | jq .

# Check spend budget ledger status
curl -s http://localhost:3000/api/spend | jq .
```

Expected health JSON:
```json
{
  "api": "up",
  "decider": "ready",
  "bedrock": "connected",
  "version": "1.0.0",
  "uptimeSeconds": 4120
}
```

---

## 3. Daily Budget Alarm & Kill-Switch
If the daily spend kill-switch trips (`BUDGET_EXHAUSTED` HTTP 429):
1. Review today's spend via `GET /api/spend`.
2. To raise the ceiling temporarily, set `MAX_BUDGET_USD=50.00` in `/var/www/polaris/.env`.
3. Restart the API: `sudo systemctl restart polaris-api`.
4. Note: Daily spend counter resets automatically at 00:00:00 UTC.

---

## 4. GPU EC2 Instance Lifecycle (G4dn)
To minimize hackathon cloud expenses:
1. Stop the GPU instance when inactive:
   ```bash
   aws ec2 stop-instances --instance-ids i-0xxxxxxxxxxxxxx
   ```
2. Start the GPU instance before live demos:
   ```bash
   aws ec2 start-instances --instance-ids i-0xxxxxxxxxxxxxx
   ```
3. Elastic IP remains attached so `api.polaris-observatory.com` DNS resolution does not break.
