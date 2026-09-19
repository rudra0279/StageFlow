import { ROLES } from '../constants/roles.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.toUpperCase();
    const normalizedRoles = roles.map((r) => r.toUpperCase());
    if (!req.user || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'Guest'}' is not authorized to perform this action.`
      });
    }
    next();
  };
};

export const requireOrganizer = authorize(ROLES.ORGANIZER, 'organizer');
export const requireAnchor = authorize(ROLES.ANCHOR, 'anchor');
