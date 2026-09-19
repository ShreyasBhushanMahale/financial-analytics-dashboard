import { z } from 'zod';
import { parseEnv } from '../../src/config/parseEnv.js';

// Separate from the server's env schema: the API has no reason to know the demo password.
const seedEnvSchema = z.object({
  DEMO_USER_EMAIL: z.email(),
  DEMO_USER_PASSWORD: z.string().min(8, 'must be at least 8 characters'),
  DEMO_USER_NAME: z.string().trim().min(1),
});

export interface DemoUserInput {
  email: string;
  password: string;
  name: string;
}

export function loadDemoUserFromEnv(): DemoUserInput {
  const values = parseEnv(seedEnvSchema);
  return {
    email: values.DEMO_USER_EMAIL,
    password: values.DEMO_USER_PASSWORD,
    name: values.DEMO_USER_NAME,
  };
}
