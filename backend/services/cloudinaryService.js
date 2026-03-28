const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage for restaurant-specific uploads
const createStorage = (restaurantId, folder = 'general') => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `restaurants/${restaurantId}/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
    }
  });
};

// Multer middleware for image uploads
const uploadImage = (restaurantId, folder = 'general') => {
  // In dev mode without Cloudinary keys, use memory storage
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    const memStorage = multer.memoryStorage();
    return multer({
      storage: memStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      }
    });
  }

  const storage = createStorage(restaurantId, folder);
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });
};

// Generic upload middleware (determines restaurantId from req)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload buffer to cloudinary
const uploadToCloudinary = async (buffer, restaurantId, folder = 'general') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    // Dev mode: return a placeholder URL
    return `https://via.placeholder.com/400x400?text=${folder}`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `restaurants/${restaurantId}/${folder}`,
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// Delete image from cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    return;
  }
  try {
    // Extract public_id from URL
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;
    const publicId = parts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

module.exports = { cloudinary, upload, uploadImage, uploadToCloudinary, deleteFromCloudinary };
