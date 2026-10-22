#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# POLARIS EC2 HOST INITIALIZATION SCRIPT (Ubuntu 22.04 LTS / 24.04 LTS)
# Installs Python 3.10+, strands-decider, Node.js 20+, and Caddy Web Server
# ==============================================================================

echo ">>> [1/5] Updating base system packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git build-essential python3 python3-pip python3-venv

echo ">>> [2/5] Installing Strands Decider 2B..."
python3 -m venv /opt/strands-venv
/opt/strands-venv/bin/pip install --upgrade pip
/opt/strands-venv/bin/pip install strands-decider

echo ">>> [3/5] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g npm@latest

echo ">>> [4/5] Installing Caddy reverse proxy with automatic TLS..."
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update -y
sudo apt-get install -y caddy

echo ">>> [5/5] Host initialization complete! Verify services with systemctl status caddy."
