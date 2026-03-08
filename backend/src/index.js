require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pipelineController = require('./controllers/pipelineController');
const budgetController = require('./controllers/budgetController');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Pipeline running locally' });
});

// Receipt processing
app.post('/api/upload-receipt', upload.single('image'), pipelineController.processReceiptImage);
app.post('/api/upload-receipt-base64', pipelineController.processReceiptImageBase64);

// AI Budget Advice
app.post('/api/budget-advice', budgetController.getBudgetAdvice);

app.listen(port, () => {
  console.log(`AI Pipeline server listening on port ${port}`);
});
