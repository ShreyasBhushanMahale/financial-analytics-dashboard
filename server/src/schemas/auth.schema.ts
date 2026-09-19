import { z } from 'zod';

// No password rules here beyond "present and bounded": a login error must never hint at the policy.
export const loginBodySchema = z.object({
  // Trimmed before the format check, so a pasted address with stray spaces still works.
  email: z.string().trim().max(254).pipe(z.email()),
  password: z.string().min(1).max(128),
});
