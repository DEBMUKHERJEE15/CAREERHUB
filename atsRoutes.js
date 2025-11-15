import express from "express";
import multer from "multer";
import { analyzeATS } from "../controllers/atsController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/check", upload.single("resume"), analyzeATS);

export default router;
