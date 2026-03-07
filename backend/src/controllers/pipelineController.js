const visionService = require('../services/visionService');

exports.processReceiptImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    const imageBuffer = req.file.buffer;

    console.log('[Pipeline] 1. Analyzing Image with Google Vision...');
    const receiptData = await visionService.extractReceiptData(imageBuffer);
    
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
  
      console.log('[Pipeline Base64] 1. Analyzing Image with Gemini...');
      const receiptData = await visionService.extractReceiptData(base64String);
  
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
