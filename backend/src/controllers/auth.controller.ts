import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { User, PublicUser } from '../types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
}

function issueToken(user: User): string {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(req.body);

    const existing = await query<User>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [email, passwordHash, firstName, lastName]
    );
    const user = result.rows[0];

    // Every user gets an empty cart on signup
    await query('INSERT INTO carts (user_id) VALUES ($1)', [user.id]);

    const token = issueToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = issueToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query<User>('SELECT * FROM users WHERE id = $1', [req.user!.sub]);
    const user = result.rows[0];
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}
