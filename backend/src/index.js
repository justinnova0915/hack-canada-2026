require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pipelineController = require('./controllers/pipelineController');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
// Increase JSON payload size to allow huge base64 strings from Web
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up multer for temporary in-memory storage of uploaded images
// We could also write to disk, but buffer is easier for Google Vision
const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fridge App AI Pipeline running' });
});

// Main AI Pipeline Endpoint (Native Form Data)
app.post('/api/upload-fridge', upload.single('image'), pipelineController.processFridgeImage);

// New AI Pipeline Endpoint (Web Base64 JSON)
app.post('/api/upload-fridge-base64', pipelineController.processFridgeImageBase64);


app.listen(port, () => {
  console.log(`AI Pipeline server listening on port ${port}`);
});
