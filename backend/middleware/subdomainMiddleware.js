const Restaurant = require('../models/Restaurant');

const subdomainMiddleware = async (req, res, next) => {
  const host = req.headers.host;
  
  // Skip for standard local development ports if they don't have subdomains
  // Usually host is something like 'pizzahub.localhost:5000' or 'pizzahub.yourdomain.com'
  
  const parts = host.split('.');
  
  // Simple logic: if more than 2 parts (e.g. sub.domain.com), first part is subdomain
  // On localhost: 'pizzahub.localhost:5000' -> parts are ['pizzahub', 'localhost:5000']
  // This needs to be robust for production too.
  
  let subdomain = null;
  
  if (parts.length > 2) {
    // sub.domain.com -> sub
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1].includes('localhost')) {
    // sub.localhost -> sub
    subdomain = parts[0];
  }

  if (subdomain && !['www', 'admin', 'superadmin'].includes(subdomain.toLowerCase())) {
    try {
      const restaurant = await Restaurant.findOne({ subdomain: subdomain.toLowerCase(), isDeleted: false });
      if (restaurant) {
        req.tenantId = restaurant._id;
        req.tenantSlug = restaurant.slug;
        req.isTenantRequest = true;
      }
    } catch (err) {
      console.error('Subdomain lookup error:', err);
    }
  }

  next();
};

module.exports = subdomainMiddleware;
