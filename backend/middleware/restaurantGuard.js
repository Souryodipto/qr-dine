// Ensures restaurant can only access their own data
// Attaches restaurantId from JWT to req for use in routes
const restaurantGuard = (req, res, next) => {
  if (!req.user || req.user.role !== 'restaurant') {
    return res.status(403).json({ message: 'Access denied. Restaurant owner privileges required.' });
  }
  
  // Attach restaurant ID from JWT for all downstream queries
  req.restaurantId = req.user.restaurantId;
  
  // If a restaurantId is in request params or body, verify it matches the JWT
  const paramRestaurantId = req.params.restaurantId || req.body.restaurantId;
  if (paramRestaurantId && paramRestaurantId !== req.restaurantId) {
    return res.status(403).json({ message: 'Access denied. You can only access your own restaurant data.' });
  }
  
  next();
};

module.exports = restaurantGuard;
