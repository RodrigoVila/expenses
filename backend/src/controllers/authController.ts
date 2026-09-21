import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { authService } from '../services/authService';
import { User } from '../models/User';
import { HttpError } from '../middleware/errorHandler';

const googleLoginSchema = z.object({
  credential: z.string().min(1),
});

export const authController = {
  loginWithGoogle: asyncHandler(async (req: Request, res: Response) => {
    const { credential } = googleLoginSchema.parse(req.body);
    const profile = await authService.verifyGoogleToken(credential);
    const { user, created } = await authService.findOrCreateUser(profile);
    const token = authService.generateJWT(user._id.toString());
    res.json({
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        isAdmin: user.isAdmin,
      },
      created,
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.userId) throw new HttpError(401, 'No autenticado');
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    res.json({
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
      isAdmin: user.isAdmin,
    });
  }),
};
