// --------------------------------------------------------
// BACKEND: Login / Signup for your Frontend
// --------------------------------------------------------

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import admin from "firebase-admin";

// ----------- FIREBASE ADMIN INITIALIZATION ---------------
admin.initializeApp({
    credential: admin.credential.cert("./serviceAccountKey.json"), // Path to your service account JSON
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --------------------------------------------------------
// 🔹 SIGN UP (Email + Password) – BACKEND OPTIONAL
// --------------------------------------------------------
// Frontend already signs up directly using Firebase Auth.
// However, backend can create user manually if needed.

app.post("/api/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Create Firebase user
        const userRecord = await auth.createUser({
            email,
            password,
        });

        // Create Firestore profile
        await db.doc(`users/${userRecord.uid}`).set({
            email,
            createdAt: new Date().toISOString(),
        });

        return res.json({
            status: "success",
            uid: userRecord.uid,
        });

    } catch (err) {
        return res.status(400).json({
            status: "error",
            message: err.message,
        });
    }
});

// --------------------------------------------------------
// 🔹 LOGIN – (NOT REQUIRED, front-end uses signInWithEmailAndPassword)
// --------------------------------------------------------
// Backend login useful if you want sessions or JWT tokens.

app.post("/api/login", async (req, res) => {
    return res.status(400).json({
        message: "Frontend already handles login directly via Firebase Auth."
    });
});


// --------------------------------------------------------
// 🔹 GENERATE CUSTOM TOKEN (Used by your frontend for initialAuthToken)
// --------------------------------------------------------

app.post("/api/get-custom-token", async (req, res) => {
    try {
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: "UID is required." });
        }

        const customToken = await auth.createCustomToken(uid);

        return res.json({
            status: "success",
            token: customToken
        });
    } 
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});


// --------------------------------------------------------
// 🔹 OPTIONAL: CREATE ANONYMOUS USER & RETURN CUSTOM TOKEN
// --------------------------------------------------------

app.post("/api/anonymous", async (req, res) => {
    try {
        const anonUser = await auth.createUser({});

        const token = await auth.createCustomToken(anonUser.uid);

        return res.json({
            uid: anonUser.uid,
            token
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
});


// --------------------------------------------------------
// SERVER START
// --------------------------------------------------------

app.listen(5000, () => {
    console.log("🔥 Backend running on http://localhost:5000");
});
