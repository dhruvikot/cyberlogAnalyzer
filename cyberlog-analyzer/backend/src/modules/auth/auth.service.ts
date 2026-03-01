import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/database'
import { env } from '../../config/env'
import { AppError } from '../../middleware/error.middleware'
import { JwtPayload } from '../../types'

export const authService = {
  async login(email: string, password: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new AppError(401, 'Invalid email or password')
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash)
    if (!passwordValid) {
      throw new AppError(401, 'Invalid email or password')
    }

    const payload: JwtPayload = { userId: user.id, email: user.email }
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRY,
    })

    return token
  },

  async signup(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new AppError(409, 'An account with this email already exists')
    }

    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters')
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email } as JwtPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    )

    return { user, token }
  },

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new AppError(404, 'User not found')
    }

    return user
  },
}
