const visionService = require('../services/visionService');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const axios = require('axios');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadStream = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "receipts" },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Build enhanced URL with Cloudinary transformations for AI
const getEnhancedUrl = (publicId) => {
  return cloudinary.url(publicId, {
    transformation: [
      { effect: "improve" },
      { effect: "sharpen" }
    ],
    secure: true
  });
};

const fetchEnhancedImageBuffer = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
};

exports.processReceiptImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    const imageBuffer = req.file.buffer;

    console.log('[Pipeline] 1. Uploading Image to Cloudinary...');
    const uploadResult = await uploadStream(imageBuffer);

    console.log('[Pipeline] 2. Fetching enhanced image from Cloudinary...');
    const enhancedUrl = getEnhancedUrl(uploadResult.public_id);
    const enhancedBuffer = await fetchEnhancedImageBuffer(enhancedUrl);

    console.log('[Pipeline] 3. Analyzing enhanced image with Gemini...');
    const receiptData = await visionService.extractReceiptData(enhancedBuffer);

    // Attach the Cloudinary secure URL (original quality for viewing)
    receiptData.imageUrl = uploadResult.secure_url;

    console.log('[Pipeline] Process Complete!');

    res.json({
      success: true,
      data: receiptData
    });

  } catch (error) {
    console.error('[Pipeline Error]', error);
    res.status(500).json({ error: 'An error occurred during pipeline processing.', details: error.message });
  }
};

exports.processReceiptImageBase64 = async (req, res) => {
    try {
      if (!req.body || !req.body.image) {
        return res.status(400).json({ error: 'No base64 image provided in JSON body.' });
      }

      const base64String = req.body.image.replace(/^data:image\/\w+;base64,/, "");

      console.log('[Pipeline Base64] 1. Uploading Image to Cloudinary...');
      const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64String}`, {
        folder: "receipts"
      });

      console.log('[Pipeline Base64] 2. Fetching enhanced image from Cloudinary...');
      const enhancedUrl = getEnhancedUrl(uploadResult.public_id);
      const enhancedBuffer = await fetchEnhancedImageBuffer(enhancedUrl);
      const enhancedBase64 = enhancedBuffer.toString('base64');

      console.log('[Pipeline Base64] 3. Analyzing enhanced image with Gemini...');
      const receiptData = await visionService.extractReceiptData(enhancedBase64);

      // Attach the Cloudinary secure URL (original quality for viewing)
      receiptData.imageUrl = uploadResult.secure_url;

      console.log('[Pipeline Base64] Process Complete!');
      res.json({
        success: true,
        data: receiptData
      });

    } catch (error) {
      console.error('[Pipeline Base64 Error]', error);
      res.status(500).json({ error: 'An error occurred during pipeline base64 processing.', details: error.message });
    }
  };
