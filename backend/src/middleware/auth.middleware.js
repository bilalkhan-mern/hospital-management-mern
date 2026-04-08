import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { normalizeAdminType } from '../utils/admin.utils.js';

export const protect = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(new AppError('Authentication required.', StatusCodes.UNAUTHORIZED));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User not found.', StatusCodes.UNAUTHORIZED));
    }

    if (!user.isActive) {
      return next(new AppError('User account is inactive.', StatusCodes.FORBIDDEN));
    }

    if (user.role === 'admin') {
      user.adminType = normalizeAdminType(user);
    }

    req.user = user;
    next();
  } catch (_error) {
    next(new AppError('Invalid or expired token.', StatusCodes.UNAUTHORIZED));
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission for this action.', StatusCodes.FORBIDDEN));
  }

  next();
};

export const requireSuperAdmin = (req, _res, next) => {
  if (req.user.role !== 'admin' || normalizeAdminType(req.user) !== 'super_admin') {
    return next(new AppError('Only super admin can perform this action.', StatusCodes.FORBIDDEN));
  }

  next();
};
