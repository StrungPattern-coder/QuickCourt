import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
// import { UserRole, UserStatus } from '@prisma/client';
// import { prisma } from '../utils/prisma.js';

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string; // UserRole;
        status: string; // UserStatus;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log('🔍 Auth middleware called for:', req.method, req.path);
  console.log('🔑 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
  
  const header = req.headers.authorization;
  if (!header) {
    console.log('❌ No authorization header found');
    return res.status(401).json({ 
      error: 'Missing Authorization header',
      code: 'MISSING_AUTH_HEADER'
    });
  }
  
  const token = header.replace('Bearer ', '');
  console.log('🎫 Token extracted, length:', token.length);
  
  try {
    const payload = verifyAccessToken(token);
    console.log('✅ Token verified successfully. Payload:', payload);
    
    // For now, just use the token payload without database lookup
    req.user = {
      id: payload.sub,
      email: payload.email || '',
      role: payload.role || 'USER',
      status: 'ACTIVE'
    };
    
    console.log('👤 User set on request:', req.user);
    next();
  } catch (e) {
    console.log('❌ Token verification failed:', e);
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🔐 Role check for roles:', roles);
    console.log('👤 Current user:', req.user);
    
    if (!req.user) {
      console.log('❌ No user found on request');
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHENTICATED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ Role mismatch. Required:', roles, 'User has:', req.user.role);
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}`,
        code: 'FORBIDDEN'
      });
    }
    
    console.log('✅ Role check passed');
    next();
  };
}
