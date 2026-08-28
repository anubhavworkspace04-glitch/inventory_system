import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';

// Session token store mapping token -> userSnapshot
const tokenStore = new Map<string, any>();

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Auto-seed default admin user if database has no users
const ensureDefaultAdmin = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create({
      name: 'GG Admin',
      email: 'admin@ggglassware.com',
      passwordHash: hashPassword('admin123'),
      avatarUrl: '',
      role: 'admin',
      isActive: true
    });
    console.log('Default Admin User created: admin@ggglassware.com');
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ensureDefaultAdmin();

    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required fields.', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const inputHash = hashPassword(password);
    const isMatch = inputHash === user.passwordHash;

    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Generate session token
    const token = `token_${crypto.randomBytes(32).toString('hex')}`;
    const userSnapshot = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      role: user.role
    };

    tokenStore.set(token, userSnapshot);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: userSnapshot
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ensureDefaultAdmin();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required.', 401));
    }

    const token = authHeader.split(' ')[1];
    const session = tokenStore.get(token);

    let userDoc: any = null;
    if (session?.id) {
      userDoc = await User.findById(session.id);
    }
    if (!userDoc) {
      userDoc = await User.findOne({ isActive: true });
    }

    if (!userDoc) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }

    const userSnapshot = {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      avatarUrl: userDoc.avatarUrl || '',
      role: userDoc.role
    };

    tokenStore.set(token, userSnapshot);

    res.status(200).json({
      success: true,
      data: { user: userSnapshot }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required.', 401));
    }

    const token = authHeader.split(' ')[1];
    const session = tokenStore.get(token);

    const userId = session?.id || (await User.findOne({ isActive: true }))?._id;
    if (!userId) {
      return next(new AppError('User session invalid.', 401));
    }

    const { name, avatarUrl } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    if (name !== undefined) user.name = name.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

    await user.save();

    const updatedSnapshot = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      role: user.role
    };

    tokenStore.set(token, updatedSnapshot);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedSnapshot }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required.', 401));
    }

    const token = authHeader.split(' ')[1];
    const session = tokenStore.get(token);

    const userId = session?.id || (await User.findOne({ isActive: true }))?._id;
    if (!userId) {
      return next(new AppError('User session invalid.', 401));
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required.', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters long.', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    // Verify current password
    const currentHash = hashPassword(currentPassword);
    if (currentHash !== user.passwordHash) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    // Hash and update new password
    user.passwordHash = hashPassword(newPassword);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      tokenStore.delete(token);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};
