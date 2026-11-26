const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Upload an image buffer to Cloudinary when configured, or persist locally under /uploads.
 */
const uploadImageFile = async (file, folder = 'foodrescue') => {
  if (!file || !file.buffer) return '';

  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result.secure_url);
        }
      );
      stream.end(file.buffer);
    });
  }

  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  const ext = EXTENSION_MAP[file.mimetype] || '.jpg';
  const filename = `${folder.replace(/[^a-z0-9_-]/gi, '_')}-${Date.now()}-${crypto
    .randomBytes(6)
    .toString('hex')}${ext}`;
  const targetPath = path.join(UPLOADS_DIR, filename);
  await fs.promises.writeFile(targetPath, file.buffer);
  return `/uploads/${filename}`;
};

module.exports = { uploadImageFile };
