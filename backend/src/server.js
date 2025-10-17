import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: ["http://localhost:5173", "https://streamify-gktv.onrender.com"],
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json());
app.use(cookieParser());

// Maintenance mode middleware
app.use((req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    const maintenanceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #1f2937;
            color: #f3f4f6;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            border: 1px solid #3b82f6;
            border-radius: 0.75rem;
            background-color: #111827;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            max-width: 42rem;
            width: 100%;
            margin: 0 1rem;
            padding: 2rem;
            text-align: center;
        }
        .icon {
            width: 4rem;
            height: 4rem;
            margin: 0 auto 1.5rem;
            color: #3b82f6;
        }
        h1 {
            font-size: 1.875rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
        }
        p {
            font-size: 1.125rem;
            opacity: 0.7;
            margin-bottom: 1rem;
        }
        .small-text {
            font-size: 0.875rem;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
        </div>
        <h1>Website Under Maintenance</h1>
        <p>We're currently performing some maintenance on our site. Please check back soon!</p>
        <p class="small-text">We apologize for any inconvenience this may cause.</p>
    </div>
</body>
</html>`;
    return res.send(maintenanceHTML);
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Serve static files and handle SPA routing for non-API routes
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  } else {
    res.status(404).json({ message: "API endpoint not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
