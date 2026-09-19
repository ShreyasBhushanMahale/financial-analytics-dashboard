import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

// 12 rounds costs roughly 200-300 ms per hash: slow enough to hurt brute force, fast enough for a login.
const BCRYPT_COST = 12;

/**
 * A real hash of random bytes, made once at startup with the same cost as real hashes. Login
 * compares against it when an email is unknown, so that path takes as long as a wrong password.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), BCRYPT_COST);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
