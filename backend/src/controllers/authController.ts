import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  schoolName: string;
  schoolLocation: string;
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, role, schoolName, schoolLocation } = req.body as {
      email: string;
      password: string;
      name: string;
      role: 'teacher' | 'student';
      schoolName?: string;
      schoolLocation?: string;
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email is already registered.' });
      return;
    }

    const user = new User({
      name,
      email,
      password,
      role: role ?? 'teacher',
      schoolName: schoolName ?? '',
      schoolLocation: schoolLocation ?? '',
    });

    await user.save();

    const payload: JwtPayload = {
      id: (user._id as { toString(): string }).toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      schoolName: user.schoolName ?? '',
      schoolLocation: user.schoolLocation ?? '',
    };

    const token = signToken(payload);

    res.cookie('flux_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: payload.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolName: user.schoolName,
          schoolLocation: user.schoolLocation,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ success: false, message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const payload: JwtPayload = {
      id: (user._id as { toString(): string }).toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      schoolName: user.schoolName ?? '',
      schoolLocation: user.schoolLocation ?? '',
    };

    const token = signToken(payload);

    res.cookie('flux_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: payload.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolName: user.schoolName,
          schoolLocation: user.schoolLocation,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ success: false, message });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: (user._id as { toString(): string }).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        schoolName: user.schoolName,
        schoolLocation: user.schoolLocation,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    res.status(500).json({ success: false, message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.cookie('flux_token', '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 0,
    expires: new Date(0)
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}
