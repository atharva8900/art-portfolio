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

3. **Detailed Security Audit**
   - **Secrets Check**: Scan code for hardcoded API keys or credentials.
   - **Database Security**: Verify Supabase RLS (Row Level Security) policies.
   - **Auth Protection**: Ensure sensitive routes are protected by authentication logic.
   - **Input Validation**: Check API routes for proper validation (Zod/Schema checks).
   - **Environment Guard**: Confirm all variables in `.env.local` are accounted for.

4. **User Notification**
   Present the final verified and audited state, and request your explicit approval to proceed with the final cleanup and push.

5. **Codebase Cleanup**
   Scan the repository for unnecessary files (e.g., temporary logs, redundant test scripts, or unused assets). I will list the candidate files and the reason for deletion, then wait for your explicit approval before performing any `rm` operations.
   **Critical Requirement**: For every proposed deletion, I must answer:
   - "Are those files necessary currently with what we are doing?"
   - "Will it affect anything from our project?"

6. **Final Confirmation & Manual Push**
   After the cleanup and git commit:
   - **Commit Message Rule**: The git commit message must **ONLY** describe specific changes made to the website/code. Do **NOT** mention anything about the deployment process (verification, audit, cleanup, etc) in the commit message.
   - Example: "Fix admin access for X email, update commission toggle logic, fix payout auth" (GOOD)
   - Example: "Completed deployment audit and pushed changes" (BAD)
   - **Manual Push Rule**: Git push triggers interactive browser/credential login prompts. Therefore, always stage and commit the verified changes, and then **instruct the user to run `git push origin main` manually** in their terminal instead of running `git push` autonomously.
