# POLARIS Deployment Architecture

## Topology Overview
POLARIS employs a distributed dual-host architecture:
- **Frontend SPA**: Hosted globally on Vercel Edge (`polaris-observatory.vercel.app`).
  - Configured with `vercel.json` SPA rewrites.
  - Bundled with self-hosted `@fontsource` typography and static replay flight logs in `public/replays/`.
- **Backend Services**: Hosted on AWS EC2 (`api.polaris-observatory.com`).
  - Express API (`:3000`) managing SSE dual-lane streaming and Bedrock Converse calls.
  - Strands Decider 2B (`:8000`) local Python inference server.
  - Caddy Web Server (`:80`, `:443`) handling automatic TLS, unbuffered SSE flushing (`flush_interval -1`), and CORS enforcement.
  - IAM Instance Profile (`polaris-ec2-profile`) invoking Bedrock models with zero hardcoded API keys.
