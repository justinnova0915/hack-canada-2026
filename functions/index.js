const { onRequest } = require("firebase-functions/v2/https");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pipelineController = require("./src/controllers/pipelineController");
const budgetController = require("./src/controllers/budgetController");

const app = express();

app.use(cors({ origin: true }));
// Increase JSON payload size to allow huge base64 strings from Web
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Set up multer for temporary in-memory storage of uploaded images
const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Fridge App AI Pipeline running on Firebase Functions" });
});

// Main AI Pipeline Endpoint (Native Form Data)
app.post("/api/upload-receipt", upload.single("image"), pipelineController.processReceiptImage);

// New AI Pipeline Endpoint (Web Base64 JSON)
app.post("/api/upload-receipt-base64", pipelineController.processReceiptImageBase64);

// AI Budget Advice Endpoint
app.post("/api/budget-advice", budgetController.getBudgetAdvice);

// Export the Express app as a Firebase Function
// Configuring timeout to 5 minutes and memory to 1GB for AI operations
exports.api = onRequest({ timeoutSeconds: 300, memory: "1GiB" }, app);