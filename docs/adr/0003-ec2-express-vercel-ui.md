# ADR 0003: Express on EC2, the UI on Vercel

- **Status:** Accepted
- **Date:** 2026-10-19
- **Deciders:** POLARIS team

## Context

The hackathon requires a working agent on AWS, and names neither EC2 nor any other compute
option as mandatory, so the backend has to live on AWS in some form.

The parts of the system have completely different lifetimes:

- The **UI** is a static React build. It should always be up, so a judge who opens the link
  after the demo instance is stopped still sees something.
- The **API** needs a long-lived process, an outbound connection to Amazon Bedrock and a
  Decider 2B instance that may be a GPU box that bills by the hour.
- The **model calls cost money.** The cheapest safe arrangement keeps the UI always on and
  lets the expensive part be stopped.

## Decision

- The **Express API runs on EC2**, behind Caddy with automatic TLS, calling Bedrock through
  the instance's IAM role.
- The **React app is a static build on Vercel**, always deployed from `main`.
- **Decider 2B** runs on the same host or a separate GPU instance, reachable only from the
  API over localhost or a private network. Where it actually runs is stated plainly in the
  article rather than glossed over.
- The web app ships **recorded flights** so the demo works with the instance stopped, and
  shows a clear "observatory offline" screen instead of a blank page.

## Consequences

- A judge opening the Vercel link always gets a working page. If the API is down, the page
  says so and offers a recorded flight.
- The price of that arrangement is a **cross-origin** call from the Vercel origin to the EC2
  host. CORS on the server is locked to the app domain, and the SSE stream is connected
  directly to the EC2 hostname because a Vercel proxy would buffer it.
- EC2 stops when the demo is over. The UI does not, which is exactly the intended split.
- The GPU instance bills by the hour. The runbook covers stopping it, and the daily spend
  kill switch bounds the Bedrock side of the bill.
- No serverless function sits in the path of a 40-second model call.
