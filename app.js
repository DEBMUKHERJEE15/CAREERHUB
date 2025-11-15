import express from "express";
import cors from "cors";

// Routes
import atsRoutes from "./routes/atsRoutes.js";
import jobsRoutes from "./routes/jobsRoutes.js";
import coursesRoutes from "./routes/coursesRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/ats", atsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/events", eventsRoutes);

// Default Route
app.get("/", (req, res) => {
  res.json({ message: "CareerHub Backend Running..." });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
