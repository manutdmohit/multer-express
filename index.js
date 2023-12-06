require('dotenv').config();

const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage }).array('images', 5); // 'images' is the field name, 5 is the maximum number of files allowed

// Route for handling multiple image uploads
app.post('/upload', upload, (req, res) => {
  // Check if files exist
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploadedImages = [];

  // Upload each image to Cloudinary
  const uploadPromises = req.files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'auto' }, (error, result) => {
          if (error) {
            reject({ file, error });
          } else {
            uploadedImages.push(result);
            resolve();
          }
        })
        .end(file.buffer);
    });
  });

  // Wait for all uploads to complete
  Promise.all(uploadPromises)
    .then(() => {
      // All files uploaded successfully
      res.json(uploadedImages);
    })
    .catch((error) => {
      // At least one file failed to upload
      res
        .status(500)
        .json({ error: 'One or more files failed to upload', details: error });
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
