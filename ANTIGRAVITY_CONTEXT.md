# ANTIGRAVITY_CONTEXT.md — AuraSuite Master Architecture Context

**Last Updated:** Phase 1 Master AI Agent & Knowledge Foundation  
**Repository:** `https://github.com/ibraheemashshuraim-alt/aurasuite.git`  
**Active Branch:** `main`  
**Production URL:** `https://aurasuite-kappa.vercel.app`  
**Target Deployment:** GitHub ➔ Vercel (Frontend & Server-Side APIs) + Supabase (PostgreSQL & Realtime)  

---

## 1. Project Purpose & High-Level Philosophy
AuraSuite is a high-performance, multi-tenant AI operations and team management SaaS platform for modern organizations. It soft-switches across 3 business modes:
1. **Software House Mode**: Kanban boards, worker onboarding, client portals, AI payouts.
2. **Academy Mode**: Teachers, students, assignments, and curriculum tracking.
3. **Factory Mode**: Raw material inventory, assembly production lines, shift attendance.

### Core Architectural Principle
AuraSuite is the **MAIN PRODUCT**. External AI providers (Gemini, Groq, OpenAI, Claude, Ollama) and computer automation daemons (Personal Jarvis) are decoupled behind clean provider and connector abstractions. AuraSuite does not depend on any single provider or hardcoded engine.

**Deployment Architecture:**
- **Zero Separate Backend Servers**: No Go backend, no Railway, no Render, no VPS.
- **Next.js App Router (Server-Side Routes & Server Actions)** handles all API logic, AES-256 BYOK encryption, context assembly, and agent dispatching on Vercel.
- **Supabase** acts as the single source of truth for persistence and live event broadcasting (`supabase_realtime`).

---

## 2. Master AI Agent & Knowledge Foundation

| Layer | Implementation Location | Responsibilities |
| :--- | :--- | :--- |
| **BYOK Security & Crypto** | `frontend/lib/ai/crypto.js` | AES-256-GCM authenticated encryption for user API keys using server-side `AURA_MASTER_KEY`. |
| **AI Provider Abstraction** | `frontend/lib/ai/providers/` | Unified `generateAI` dispatcher supporting Gemini, Groq, OpenAI, Claude, and Ollama. |
| **Master Knowledge System** | `frontend/lib/ai/knowledge/` | Embedded platform rules + Supabase `knowledge_items` table with category and tag filtering. |
| **Central Context Builder** | `frontend/lib/ai/context/` | Assembles System Instructions + Brand Voice/Instructions + Agent Persona + Knowledge + Task Data. |
| **Agent State Machine** | `frontend/lib/ai/orchestrator/` | Realtime state transitions (`idle`, `thinking`, `researching`, `creating`, `generating`, `completed`, `failed`). |
| **Agent Orchestrator** | `frontend/lib/ai/orchestrator/` | Manages task execution, in-memory BYOK key decryption, model calls, and result persistence. |
| **Jarvis Connector** | `frontend/lib/ai/jarvis/` | Decoupled computer-use abstraction and `MockJarvisConnector` for OS automation. |
| **Verification Engine** | `frontend/lib/ai/jarvis/` | 5-stage verification lifecycle (`COMMAND ➔ ACTION ➔ ACTUAL RESULT CHECK ➔ VERIFICATION ➔ SUCCESS/FAILED`). |
| **Agent Town Integration** | `frontend/components/AgentTown.js` | 2D pixel-art office synchronized to live Supabase Realtime agent states with dynamic thought bubbles. |

---

## 3. Server-Side APIs & Endpoints

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/agents/dispatch` | Dispatches an agent task through the Master Orchestrator |
| `POST` | `/api/providers/config` | Securely encrypts and saves user BYOK API keys (AES-256-GCM) |
| `GET` | `/api/providers/config` | Lists active providers with safe display hints only (`...4a1b`) |
| `POST` | `/api/business/profile` | Saves brand voice, audience, tone, and Do/Don't rules |
| `GET` | `/api/business/profile` | Retrieves saved brand guidelines for the organization |
| `GET` / `POST` | `/api/knowledge` | Queries and adds knowledge items |
| `POST` | `/api/jarvis/verify` | Runs 5-stage verification loop for computer tasks |

---

## 4. BYOK Security Model (AES-256-GCM)
1. **Master Encryption Key (`AURA_MASTER_KEY`)**:
   - 32-byte secret stored exclusively in server-side environment variables (`frontend/.env.local`).
   - Never sent to client/browser, never stored in database, never committed in source code.
2. **Database Storage (`ai_provider_configs`)**:
   - Stores only `encrypted_api_key` (Base64), `nonce` (Base64), and safe `key_hint` (`...4a1b`).
3. **In-Memory Decryption**:
   - Decrypted in server RAM only for the duration of the external provider HTTP request.

---

## 5. Computer Task Verification Protocol
**Critical Requirement:** A computer task is NEVER considered successful merely because an agent reports "Done".
$$\text{COMMAND} \longrightarrow \text{ACTION} \longrightarrow \text{ACTUAL RESULT CHECK} \longrightarrow \text{VERIFICATION} \longrightarrow \text{SUCCESS / FAILED}$$
- Rejects generic "Done" claims unless exact criteria is satisfied.
- Logs every verification attempt to `verification_records`.

---

## 6. Database Migration
File: `db/migrations/001_phase1_agent_foundation.sql`
Tables:
- `business_profiles`
- `knowledge_items`
- `ai_provider_configs`
- `agent_definitions` (Saima, Dani, Mianzi, Zohaib, Aura)
- `agent_tasks`
- `agent_executions`
- `verification_records`
- Realtime enabled for live synchronization.
