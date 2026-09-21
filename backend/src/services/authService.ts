import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env, isAdminEmail } from '../config/env';
import { User, type IUser } from '../models/User';
import { HttpError } from '../middleware/errorHandler';
import { seedDefaultCategoriesForUser } from '../seed/defaultCategories';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface JWTPayload {
  userId: string;
}

export const authService = {
  /**
   * Verifica un id_token de Google (credential del componente @react-oauth/google).
   * Devuelve el perfil del usuario si es válido.
   */
  async verifyGoogleToken(credential: string): Promise<{
    googleId: string;
    email: string;
    name: string;
    picture: string | null;
  }> {
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new HttpError(401, 'Token de Google inválido');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new HttpError(401, 'Token de Google incompleto');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      picture: payload.picture ?? null,
    };
  },

  /**
   * Busca o crea el usuario. En el primer login, seedea sus categorías default.
   */
  async findOrCreateUser(profile: {
    googleId: string;
    email: string;
    name: string;
    picture: string | null;
  }): Promise<{ user: IUser; created: boolean }> {
    const isAdmin = isAdminEmail(profile.email);

    let user = await User.findOne({ googleId: profile.googleId });
    if (user) {
      user.name = profile.name;
      user.picture = profile.picture;
      user.email = profile.email;
      user.isAdmin = isAdmin; // reevaluamos por si el email cambió estatus
      await user.save();
      return { user, created: false };
    }

    user = await User.create({ ...profile, isAdmin });
    await seedDefaultCategoriesForUser(user._id.toString());
    return { user, created: true };
  },

  generateJWT(userId: string): string {
    return jwt.sign({ userId } as JWTPayload, env.JWT_SECRET, { expiresIn: '30d' });
  },

  verifyJWT(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch {
      throw new HttpError(401, 'Token inválido o expirado');
    }
  },
};
