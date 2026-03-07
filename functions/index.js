import * as cors from "cors";
import * as express from "express";
import { onRequest } from "firebase-functions/v2/https";

// 1. Create your Express app instance
const app = express();

// 2. Enable CORS so your Pixel app can talk to it
app.use(cors({ origin: true }));

// 3. Add a test route to make sure it's working
app.get("/hello", (req, res) => {
    res.send("Hello from Hack Canada Backend!");
});

// 4. Export the 'api' function to Firebase
export const api = onRequest(app);