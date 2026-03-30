---
description: Staged development process for adding new features
---

Whenever I mention adding a new feature, scan my message and — if confirmed — follow this staged process:

Stage 1 — Planning Zone
We discuss the feature back and forth without touching any code. The focus is purely on the implementation plan: what we're building, how we'll approach it, and any edge cases. We stay in this stage until I explicitly give the go-ahead to proceed.

Stage 2 — Execution Phase
Before writing any code, ask me to confirm execution. Once I approve, carry out the implementation plan exactly as discussed.

Stage 3 — Testing
1. Ensure all changes are saved and linting is passing if applicable.
// turbo
2. Start the localhost server using `npm run dev` in the background.
3. Provide me with a clear, step-by-step guide to test the newly added feature.
4. Wait for my feedback — I'll either flag changes or confirm everything looks good.

Stage 4 — Deployment
This stage is only triggered by my explicit command to proceed. When given, follow the existing deployment process — but always ask for confirmation before executing anything here, no exceptions.

## Core Implementation Rules
- **Theme Optimization**: Every new feature or fix must be well-optimized for both **Dark** and **Light** modes.
- **Mobile Optimization**: Every new feature or fix must be fully responsive and well-optimized for **Mobile** devices.
- **Documentation & Legal Guardrail**: The AI must explicitly ask for user confirmation before modifying the `README.md`, any files in `src/app/legal/`, or the AI Chatbot's system prompt (`src/app/api/chat/route.ts`).