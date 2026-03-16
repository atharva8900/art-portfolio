# Copy-Paste Guide for Antigravity Customizations

Follow these steps to add the rules and workflows directly to your Antigravity agent settings.

## 1. Adding Rules
Rules help me follow your specific preferences automatically.

### Steps:
1. Open the **Customizations** tab in the sidebar (the gear icon or the "Back to Agent" screen).
2. Click on the **Rules** tab.
3. Click the **+ Workspace** button (this applies rules only to this "art-website" project).
4. Copy and paste the following:

**Name**: `Testing & Feature Flow`
**Rule**:
```text
After implementing a new feature or fixing a bug:
1. Ensure the localhost dev server is running and reloaded.
2. Provide a detailed, step-by-step guide for the user to test the changes.
3. List the specific expected behaviors for each verification step.
```

---

## 2. Adding the Deployment Workflow
Workflows allow me to run complex multi-step tasks with a single command.

### Steps:
1. In the same **Customizations** tab, click on the **Workflows** tab.
2. Click **+ Workspace**.
3. Copy and paste the following:

**Name**: `deploy`
**Workflow Content**:
```markdown
# Deployment Workflow

1. **Verification**: Run `npm run build` and `npm run lint`.
2. **Summary**: I will report any errors found and attempt to fix them.
3. **Notify User**: I will present the final verified state and request your approval.
4. **Detailed Security Audit**:
   - Check for hardcoded secrets/keys.
   - Verify Supabase RLS policies for table security.
   - Guard sensitive API routes with auth checks.
   - Validate inputs in API routes.
   - Sync environment variables in `.env.local`.
5. **Next Step**: Once all checks pass, wait for the user to say "git push". (I will NEVER push automatically).
```

---

## 3. How to use them
Once added:
- I will follow the **Testing Rule** automatically whenever I finish a coding task.
- To start the deployment process, you can just say: `@antigravity run the deploy workflow`.
