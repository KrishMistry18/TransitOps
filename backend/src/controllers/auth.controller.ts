import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check account lockout
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return res.status(423).json({ message: 'Account locked. Try again later.' });
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | undefined = undefined;
      
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      
      user.failedLoginAttempts = lockedUntil ? 0 : attempts; // reset counter on lockout
      if (lockedUntil) {
        user.lockedUntil = lockedUntil;
      }
      await user.save();

      if (lockedUntil) {
        return res.status(423).json({ message: 'Account locked due to 5 failed attempts.' });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // On success: reset
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();

    // 7 day token expiry
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await UserModel.findById(req.user.userId).select('email name role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
