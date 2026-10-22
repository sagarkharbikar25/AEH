# Architectural Pattern: Confidence-Adaptive Hierarchical Tool Selection

> **Pattern Name:** Confidence-Adaptive Hierarchical Tool Selection with Strands Decider 2B  
> **Hackathon:** AWS Strands Decider Agent Hackathon (`#strands-decider-2b`, `#tool-selection`)  
> **License:** Apache-2.0  
> **Package:** `@polaris/router`  
> **Numbers Status:** Traced directly from `bench/results.json` (evaluated across 432 test split queries; simulated local model run)

---

## 1. Problem Statement: The Tool Overload Tax

Large Language Models integrated with enterprise agents or multi-server Model Context Protocol (MCP) clusters frequently have access to hundreds of tools (e.g., 240+ API endpoints across cloud, CRM, billing, storage, and workflows).

Sending 240 tool schemas to Amazon Bedrock Converse on every user turn incurs severe penalties:
1. **Prompt Token Explosion**: 240 schemas consume ~20,400 input tokens per turn.
2. **TTFT Latency Penalty**: Processing 20k tokens delays Time-To-First-Token to 1,150ms – 1,450ms.
3. **Economic Waste**: On Claude 3 Haiku, 1,000 requests with 240 tools cost ~$5.19 in input tokens alone (or ~$51.90 per 10k).

---

## 2. The Solution: Strands Decider 2B Pre-Router

Instead of sending 240 tool definitions to Amazon Bedrock Converse, **POLARIS places Strands Decider 2B in front of Bedrock**. 

In two fast, local calls (~36ms p50), Decider 2B narrows 240 tools down to **1 to 6 relevant candidates**. Bedrock Converse receives **only** the shortlisted tools, reducing input tokens from ~20,400 to ~410 tokens (~98% reduction) and cutting latency by over 80%.

```
User Prompt: "Schedule team sync tomorrow at 4pm for 45 mins"
   │
   ▼
[Decider 2B: Call 1] ───► Needs Tool? (noul) = YES (confidence >= 0.25)
                         Category? (choice)  = calendar (0.94)
   │
   ▼
[Decider 2B: Call 2] ───► In-Category Tool (choice) = calendar.create_event (0.96)
   │
   ▼
[Confidence-Adaptive Tiering]
Combined Score = P(category) × P(tool | category) = 0.94 × 0.96 = 0.9024
Score >= 0.85 ───► Tier: DIRECT (Send exactly 1 tool)
   │
   ▼
[Amazon Bedrock Converse]
Receives: ONLY calendar.create_event schema (~410 tokens vs 20,400 tokens)
Returns: Validated parameters { title: "Team Sync", startTime: "2026-10-23T16:00:00" }
```

---

## 3. Exact Strands Decider 2B Request Bodies

Decider 2B serves a single typed endpoint: `POST /v1/systemone`.

### Call 1: Gating & Constellation Selection
Evaluates whether an external tool is required and identifies the top category cluster in a single inference pass:

```json
POST /v1/systemone
Content-Type: application/json

{
  "state": "Schedule team sync tomorrow at 4pm with platform engineering",
  "questions": {
    "needs_tool": {
      "type": "noul",
      "instructions": "Does this request require calling an external tool or API, rather than answering from general knowledge?"
    },
    "category": {
      "type": "choice",
      "instructions": "Which tool category cluster does this user request target?",
      "options": {
        "calendar": "Events, reminders, scheduling and meeting rooms",
        "tickets": "Issues, service requests, triage and support workflow",
        "messaging": "Email, chat channels, notifications and scheduled sends",
        "files": "Document storage, folders, sharing, archives and scanning",
        "crm": "Contacts, leads, accounts, deals and pipeline activity",
        "billing": "Invoices, payments, subscriptions, credits and revenue",
        "inventory": "Stock levels, warehouses, purchase orders and shipments",
        "hr": "Employee records, leave, attendance, payroll and hiring",
        "analytics": "Reports, dashboards, metrics, funnels and alerts",
        "identity": "User accounts, roles, permissions, API keys and sessions",
        "knowledge": "Wiki pages, spaces, revisions, comments and publishing",
        "workflows": "Automation, triggers, action steps, approvals and schedules"
      }
    }
  }
}
```

### Call 2: In-Category Tool Candidate Ranking
Evaluates tool candidates within the top-ranked category (and secondary category if probability is split):

```json
POST /v1/systemone
Content-Type: application/json

{
  "state": "Schedule team sync tomorrow at 4pm with platform engineering",
  "questions": {
    "tool_calendar": {
      "type": "choice",
      "instructions": "Which calendar tool best matches the user's action?",
      "options": {
        "calendar.create_event": "Schedules calendar event with start time, duration, and attendees",
        "calendar.delete_event": "Deletes an existing event from the calendar and notifies attendees",
        "calendar.find_free_slots": "Scans calendar for mutual free slots across multiple attendee schedules",
        "calendar.reschedule_meeting": "Changes the time or date of an existing scheduled meeting",
        "calendar.book_room": "Reserves conference room or video conference link for meeting"
      }
    }
  }
}
```

---

## 4. The 4,096-Token Budget & Why Hierarchical Routing is Required

Strands Decider 2B has a strict **4,096-token context window**.
- 240 tools with descriptors and input schemas total ~20,000+ tokens, exceeding Decider's entire context.
- Single-choice over 240 tool names consumes ~2,000 prompt tokens and suffers from severe option attention degradation.
- **Hierarchical decomposition solves this**:
  - Call 1 uses 12 category options (~180 tokens).
  - Call 2 evaluates 20 tools within the targeted constellation (~320 tokens).
  - Both calls easily fit inside the context window and execute with minimal latency (~36ms).

---

## 5. Confidence-Adaptive Shortlist Tiers

Rather than a brittle top-1 gate, Polaris dynamically sets shortlist width using calibrated thresholds:

| Tier | Min Combined Score | Shortlist Count | Intent |
|---|:---:|:---:|---|
| **Direct** | $\ge 0.85$ | **1 tool** | Definitive match; maximum latency and token savings. |
| **Narrow** | $0.55 - 0.85$ | **3 tools** | High-probability cluster; Bedrock resolves parameter nuances. |
| **Wide** | $0.30 - 0.55$ | **6 tools** | Cross-cutting or ambiguous prompt; broad safety net. |
| **Fallback** | $< 0.30$ | **12 tools + `ask_clarification`** | Low confidence; provides candidate tools plus clarification fallback. |
| **No-Tool** | Gate $< 0.25$ | **0 tools** | General knowledge / conversation; zero tool schemas sent to Bedrock. |

The composite score is calculated as:
$$P(\text{tool}) = P(\text{category}) \times P(\text{tool} \mid \text{category})$$

---

## 6. Curl-Only Recipe

Test local Decider 2B routing from the command line:

```bash
# 1. Start local Strands Decider 2B server
strands-decider serve strands-decider-2b --port 8000

# 2. Probe needs_tool and category
curl -X POST http://localhost:8000/v1/systemone \
  -H "Content-Type: application/json" \
  -d '{
    "state": "Create an invoice for ACME Corp for $1,200",
    "questions": {
      "needs_tool": { "type": "noul", "instructions": "Does this request need an external tool?" },
      "category": {
        "type": "choice",
        "instructions": "Pick category",
        "options": {
          "billing": "Invoices, payments, subscriptions and revenue",
          "calendar": "Events, meetings and schedules"
        }
      }
    }
  }'
```

---

## 7. 5-Line TypeScript Drop-In Usage

```typescript
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { compileCatalog, shortlistTools } from "@polaris/router";

// 1. Compile tool catalog once
const catalog = compileCatalog(tools);

// 2. Shortlist 240 tools to 1–6 in ~36ms
const { tools: shortlist, tier, bedrockToolConfig } = await shortlistTools(userPrompt, catalog, {
  deciderUrl: "http://localhost:8000"
});

// 3. Bedrock Converse receives ONLY the shortlisted tools
const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const response = await bedrock.send(new ConverseCommand({
  modelId: "anthropic.claude-3-haiku-20240307-v1:0",
  messages: [{ role: "user", content: [{ text: userPrompt }] }],
  toolConfig: bedrockToolConfig
}));
```

---

## 8. Empirical Harvest (`bench/results.json`)

Evaluated against the 432-query test split:

| Configuration | Recall@k / Accuracy | Avg Input Tokens | Avg Latency | Cost per 1,000 Reqs |
|---|:---:|:---:|:---:|:---:|
| **Config A: All Tools Baseline** | 78.5% | 20,400 tokens | 1,250 ms | $5.190 |
| **Config B: Flat Top-K** | 64.2% | 1,850 tokens | 380 ms | $0.552 |
| **Config C: Hierarchical POLARIS** | 57.9% | **410 tokens** | **226 ms** | **$0.213** |

- **Token Reduction**: 20,400 → 410 tokens (**97.9% savings**).
- **Latency Speedup**: 1,250 ms → 226 ms (**5.5× faster TTFT**).
- **Cost Savings**: **$4.98 saved per 1,000 requests** ($49.80 saved per 10,000 invocations).
- **Decider Router p50**: **36 ms** (p95: 36 ms).

---

## 9. Known Failure Modes & Mitigations

1. **Category Boundary Ambiguity**: Prompts that span two constellations (e.g., "Schedule invoice reminder") can cause misclassification.
   - *Mitigation*: Call 2 evaluates top-2 categories, ensuring candidate tools from both categories enter the ranking pool.
2. **Shortfall on Fallback Queries**: Vague instructions ("clean up my items") lack keyword tokens.
   - *Mitigation*: Fallback tier materializes the `ask_clarification` tool to interactively prompt the user for clarification.
3. **No-Tool False Positives**: Explanatory prompts mentioning tools ("Explain how calendar sync works").
   - *Mitigation*: Gated `needs_tool` question evaluated prior to category selection; negative answers bypass tools entirely.
