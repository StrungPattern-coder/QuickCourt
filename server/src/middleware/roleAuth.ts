import { Request, Response, NextFunction } from 'express';
// import { UserRole } from '@prisma/client';

// The Express Request interface is already extended in auth.ts
// No need to redeclare it here

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

export const checkOwnerRole = checkRole(['OWNER', 'ADMIN']);
export const checkUserRole = checkRole(['USER', 'OWNER', 'ADMIN']);
export const checkAdminRole = checkRole(['ADMIN']);

// Middleware to check if user owns the resource
export const checkResourceOwnership = (resourceField: string = 'ownerId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Admin can access all resources
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Get resource ID from params or body
    const resourceOwnerId = req.body[resourceField] || req.params[resourceField];
    
    if (resourceOwnerId && resourceOwnerId !== req.user.id) {
      return res.status(403).json({
        error: 'You can only access your own resources',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};
