import { Schema, model } from 'mongoose';

export interface User {
  email: string;
  passwordHash: string;
  name: string;
}

const userSchema = new Schema<User>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    // Excluded from every query result unless explicitly selected, so it can't leak into a response.
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
  },
  { versionKey: false },
);

// Login looks users up by email.
userSchema.index({ email: 1 }, { unique: true });

export const UserModel = model<User>('User', userSchema);

/** Emails are stored normalised; lookups must normalise the same way or "Analyst@…" won't match. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
