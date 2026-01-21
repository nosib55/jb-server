require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ✅ ENV variables
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;

// ✅ Default Image URL
const DEFAULT_IMAGE_URL =
  "https://i.ibb.co.com/7dVRmKtm/Chat-GPT-Image-Jan-21-2026-09-27-35-AM.png"; 

let db;

// ✅ Connect MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
  }
}
connectDB();

// ✅ DB Check Middleware
function checkDB(req, res, next) {
  if (!db) {
    return res.status(500).json({ error: "Database not connected yet" });
  }
  next();
}

// =======================================================
// ✅ JOB ROUTES (Public)
// Fields: position, jobLink, appliedDateTime, imageUrl
// =======================================================

// ✅ GET all jobs
app.get("/jobs", checkDB, async (req, res) => {
  try {
    const jobs = await db
      .collection("jobs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching jobs" });
  }
});

// ✅ POST job
app.post("/jobs", checkDB, async (req, res) => {
  try {
    const { position, jobLink, appliedDateTime, imageUrl } = req.body;

    if (!position || !jobLink) {
      return res.status(400).json({
        error: "Position and Job Link are required",
      });
    }

    const newJob = {
      id: Date.now().toString(),
      position,
      jobLink,
      appliedDateTime: appliedDateTime || new Date().toISOString(),
      imageUrl: imageUrl || DEFAULT_IMAGE_URL,
      createdAt: new Date().toISOString(),
    };

    await db.collection("jobs").insertOne(newJob);
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: "Error creating job" });
  }
});

// =======================================================
// ✅ APPLICATION ROUTES
// Fields: companyName, jobPostLink, jobType, location, status, appliedDateTime
// ✅ PATCH updates ONLY status
// =======================================================

// ✅ GET all applications
app.get("/applications", checkDB, async (req, res) => {
  try {
    const applications = await db
      .collection("applications")
      .find({})
      .sort({ appliedDateTime: -1 })
      .toArray();

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching applications" });
  }
});

// ✅ GET application by id
app.get("/applications/:id", checkDB, async (req, res) => {
  try {
    const application = await db
      .collection("applications")
      .findOne({ id: req.params.id });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: "Error fetching application" });
  }
});

// ✅ POST new application
app.post("/applications", checkDB, async (req, res) => {
  try {
    const {
      companyName,
      jobPostLink,
      location,
      jobType,
      status,
      appliedDateTime,
    } = req.body;

    if (!companyName || !jobPostLink) {
      return res.status(400).json({
        error: "Company Name and Job Post Link are required",
      });
    }

    const newApplication = {
      id: Date.now().toString(),
      companyName,
      jobPostLink,
      location: location || "Not specified",
      jobType: jobType || "Remote",
      status: status || "Applied",
      appliedDateTime: appliedDateTime || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("applications").insertOne(newApplication);
    res.status(201).json(newApplication);
  } catch (error) {
    res.status(500).json({ error: "Error creating application" });
  }
});

// ✅ PATCH update ONLY status
app.patch("/applications/:id", checkDB, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const result = await db.collection("applications").updateOne(
      { id: req.params.id },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ message: "✅ Status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating status" });
  }
});

// =======================================================
// ✅ SUMMARY ROUTE
// =======================================================
app.get("/applications-summary", checkDB, async (req, res) => {
  try {
    const applications = await db.collection("applications").find({}).toArray();

    const totalApplications = applications.length;

    const todayStr = new Date().toISOString().split("T")[0];
    const todayApplications = applications.filter((a) =>
      String(a.appliedDateTime || "").startsWith(todayStr)
    ).length;

    const statusBreakdown = applications.reduce((acc, cur) => {
      const key = cur.status || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalApplications,
      todayApplications,
      statusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching applications summary" });
  }
});

// =======================================================
// ✅ Start Server
// =======================================================
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log("✅ Routes:");
  console.log("GET    /jobs");
  console.log("POST   /jobs");
  console.log("GET    /applications");
  console.log("GET    /applications/:id");
  console.log("POST   /applications");
  console.log("PATCH  /applications/:id");
  console.log("GET    /applications-summary");
});
