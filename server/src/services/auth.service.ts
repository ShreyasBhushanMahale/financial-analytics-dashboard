import type { Types } from 'mongoose';
import { AppError } from '../errors/AppError.js';
import { UserModel, normalizeEmail, type User } from '../models/user.model.js';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '../utils/password.js';
import { signAccessToken } from './token.service.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: AuthUser;
}

// Copies named fields rather than spreading the document, so the password hash (or any field
// added later) can never reach a response by accident.
function toAuthUser(user: Pick<User, 'email' | 'name'> & { _id: Types.ObjectId }): AuthUser {
  return { id: user._id.toString(), email: user.email, name: user.name };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await UserModel.findOne({ email: normalizeEmail(email) })
    .select('+passwordHash')
    .lean();

  // An unknown email is still checked against a dummy hash: both failures then cost one bcrypt
  // compare, so response timing can't reveal which accounts exist.
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  const { token, expiresAt } = signAccessToken(user._id.toString());
  return { token, expiresAt, user: toAuthUser(user) };
}

export async function findAuthUser(id: string): Promise<AuthUser | null> {
  const user = await UserModel.findById(id).lean();
  return user ? toAuthUser(user) : null;
}
