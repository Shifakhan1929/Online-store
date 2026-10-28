import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { generateToken } from '../utils/jwt.js';
import { Role } from '../generated/prisma/enums.js';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Check for existing user by normalized email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  // Hash password securely with bcryptjs (salt rounds: 10)
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(input.password, saltRounds);

  try {
    // Explicitly enforce Role.CUSTOMER; never allow client input to override role
    const newUser = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({
      userId: newUser.id,
      role: newUser.role,
    });

    return {
      user: newUser,
      token,
    };
  } catch (error: any) {
    // Catch Prisma unique constraint violation code P2002 if a race condition occurs
    if (error?.code === 'P2002') {
      throw new ConflictError('A user with this email address already exists');
    }
    throw error;
  }
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Find user by normalized email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Generic error message to prevent account enumeration
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password using bcryptjs
  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
};

export const getMe = async (userId: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User account not found');
  }

  return user;
};
