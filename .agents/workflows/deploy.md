---
description: Build, Lint, and Security Audit before manual push (Verified).
---

# Deployment Workflow

1. **Verification**
   Run build and lint checks to ensure codebase integrity.
   // turbo
   `npm run build`
   // turbo
   `npm run lint`

2. **Error Handling & Reporting**
   If errors exist, I will attempt to fix them automatically (e.g., unused imports, simple type fixes). I will provide a summary of all findings.

3. **Codebase Cleanup**
   Scan the repository for unnecessary files (e.g., temporary logs, redundant test scripts, or unused assets). I will list the candidate files and the reason for deletion, then wait for your explicit approval before performing any `rm` operations.
   **Critical Requirement**: For every proposed deletion, I must answer:
   - "Are those files necessary currently with what we are doing?"
   - "Will it affect anything from our project?"

4. **User Notification**
   Present the final verified and cleaned state, and request your explicit approval to proceed with the security audit.

4. **Detailed Security Audit**
   - **Secrets Check**: Scan code for hardcoded API keys or credentials.
   - **Database Security**: Verify Supabase RLS (Row Level Security) policies.
   - **Auth Protection**: Ensure sensitive routes are protected by authentication logic.
   - **Input Validation**: Check API routes for proper validation (Zod/Schema checks).
   - **Environment Guard**: Confirm all variables in `.env.local` are accounted for.

5. **Final Confirmation**
   After the audit, I will provide a final report.
   I will **NEVER** push automatically. I will wait for you to say "git push" before finishing.
