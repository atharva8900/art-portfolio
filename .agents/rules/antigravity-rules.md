---
trigger: always_on
---

After implementing a new feature or fixing a bug:
1. Ensure the localhost dev server is running and reloaded.
2. Provide a detailed, step-by-step guide for the user to test the changes.
3. List the specific expected behaviors for each verification step.
4. Never deploy when I specifically don't tell you to; always follow our deployment workflow.
5. Due to GitHub credential/login prompts, stage and commit verified changes, then instruct the user to execute `git push origin main` manually in their terminal.

## Typography & Copy Rules
- **No Em-Dashes ("—")**: Never use the em-dash ("—" or `&mdash;`) anywhere in UI copy, customer-facing text, documentation, or code comments. Use clean standard punctuation instead, such as a hyphen (`-`), colon (`:`), comma (`,`), parentheses, or natural sentence phrasing.