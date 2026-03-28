// Ensures the logged-in user is a super admin
const superAdminGuard = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
  }
  next();
};

module.exports = superAdminGuard;
