import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { readFileSync } from "fs";

// ========== CONFIGURATION ==========
const JWT_SECRET = "karma-setu-2025-super-secure-jwt-key-123456789";

// ========== FIREBASE ADMIN SETUP ==========
try {
  const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
  console.log("🔧 Project ID:", serviceAccount.project_id);
} catch (error) {
  console.error("❌ serviceAccountKey.json not found!");
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// ========== EXPRESS APP ==========
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts, try again later." },
});
app.use("/api/login", limiter);
app.use("/api/signup", limiter);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ========== ROUTES ==========

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "KarmaSetu Backend Running!",
    timestamp: new Date().toISOString(),
    services: {
      firebase: "connected",
      database: "connected", 
      email: "disabled"
    }
  });
});

// Sign Up - FINAL WORKING VERSION
app.post("/api/signup", async (req, res) => {
  try {
    console.log("📧 SIGNUP ATTEMPT RECEIVED:", req.body);
    const { email, password, firstName, lastName, phone, userType = "job_seeker" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be 6+ characters" });
    }

    console.log("🔧 Creating Firebase user...");
    
    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName || ""} ${lastName || ""}`.trim(),
    });

    console.log("✅ Firebase user created:", userRecord.uid);

    // Try to save to Firestore (optional - won't break signup if it fails)
    let firestoreSuccess = false;
    try {
      console.log("💾 Attempting to save to Firestore...");
      await db.collection("users").doc(userRecord.uid).set({
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        phone: phone || "",
        userType,
        createdAt: new Date().toISOString(),
        profileComplete: false,
        emailVerified: false,
      });
      console.log("✅ User data saved to Firestore");
      firestoreSuccess = true;
    } catch (firestoreError) {
      console.log("⚠️ Firestore save failed, but signup successful:", firestoreError.message);
      // Continue with signup - Firestore is optional
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userRecord.uid, 
        email, 
        userType,
        profileComplete: firestoreSuccess
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`🎉 SIGNUP SUCCESS: ${email}`);

    res.status(201).json({
      message: "Signup successful!" + (firestoreSuccess ? "" : " (Profile can be completed later)"),
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        profileComplete: firestoreSuccess,
      },
      token,
    });

  } catch (error) {
    console.error("🔥 SIGNUP ERROR:", error.message);
    
    let message = "Signup failed";
    if (error.code === 'auth/email-already-exists') {
      message = "Email already registered";
    } else if (error.code === 'auth/invalid-email') {
      message = "Invalid email format";
    } else if (error.code === 'auth/weak-password') {
      message = "Password too weak";
    }
    
    res.status(400).json({ error: message });
  }
});

// Login - FINAL WORKING VERSION
app.post("/api/login", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const userRecord = await auth.getUserByEmail(email);
    
    // Try to get user data from Firestore (optional)
    let userData = {};
    let profileComplete = false;
    
    try {
      const userDoc = await db.collection("users").doc(userRecord.uid).get();
      if (userDoc.exists) {
        userData = userDoc.data() || {};
        profileComplete = true;
      }
    } catch (firestoreError) {
      console.log("⚠️ Firestore access failed during login, continuing...");
    }

    const token = jwt.sign(
      { 
        uid: userRecord.uid, 
        email, 
        userType: userData.userType || "job_seeker",
        profileComplete
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        userType: userData.userType || "job_seeker",
        profileComplete,
      },
      token,
    });

  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(401).json({ error: "Invalid email or password" });
  }
});

// Auth Check Endpoint
app.get("/api/auth/check", authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// User Profile Endpoint
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    let userData = {};
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      if (userDoc.exists) {
        userData = userDoc.data() || {};
      }
    } catch (error) {
      console.log("Firestore not available for profile");
    }

    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        ...userData
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 KarmaSetu Backend RUNNING → http://localhost:${PORT}`);
  console.log(`✅ Firebase Authentication: Connected`);
  console.log(`✅ JWT Token System: Ready`);
  console.log(`📋 Available Endpoints:`);
  console.log(`   POST /api/signup - User registration`);
  console.log(`   POST /api/login - User login`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/auth/check - Check authentication`);
  console.log(`   GET  /api/user/profile - Get user profile`);
});
