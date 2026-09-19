import { UserModel, normalizeEmail } from '../../src/models/user.model.js';
import { hashPassword, verifyPassword } from '../../src/utils/password.js';
import type { DemoUserInput } from './seedEnv.js';

export type DemoUserOutcome = 'created' | 'updated' | 'unchanged';

export async function upsertDemoUser(input: DemoUserInput): Promise<DemoUserOutcome> {
  const email = normalizeEmail(input.email);
  const existing = await UserModel.findOne({ email }).select('+passwordHash');

  if (!existing) {
    await UserModel.create({
      email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
    });
    return 'created';
  }

  // bcrypt salts every hash, so re-hashing an unchanged password would still rewrite the user.
  // Comparing first keeps a repeat seed a true no-op.
  const passwordMatches = await verifyPassword(input.password, existing.passwordHash);
  if (passwordMatches && existing.name === input.name) return 'unchanged';

  existing.name = input.name;
  if (!passwordMatches) existing.passwordHash = await hashPassword(input.password);
  await existing.save();
  return 'updated';
}
