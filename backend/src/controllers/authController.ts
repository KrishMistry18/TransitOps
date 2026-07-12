import { Request, Response } from 'express';
import { db } from '../config/dbService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = db.getUsers().find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      return res.status(423).json({ message: 'Account locked. Try again later.' });
    }

    const isValid = await bcrypt.compare(password, (user as any).passwordHash);

    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockedUntil = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      db.updateUser(user.id, { failedLoginAttempts: attempts, lockedUntil });

      if (lockedUntil) {
        return res.status(423).json({ message: 'Account locked due to 5 failed attempts.' });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    db.updateUser(user.id, { failedLoginAttempts: 0, lockedUntil: null });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

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
    const user = db.getUsers().find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
