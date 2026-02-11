const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(cors());
app.use(express.json());

function readDb() {
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2) + "\n");
}

// View All API - Return array of all jobs
// Supports optional query filters: ?jobTitle=...&classification=...&location=...
app.get("/api/jobs", (req, res) => {
  const { jobs } = readDb();
  const { jobTitle, classification, location } = req.query;

  const filtered = jobs.filter((job) => {
    if (jobTitle && !job.jobTitle.toLowerCase().includes(jobTitle.toLowerCase())) return false;
    if (classification && !job.classification.toLowerCase().includes(classification.toLowerCase())) return false;
    if (location && !job.location.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });

  res.json(filtered);
});

// Add Job API - Add a new job to the collection
app.post("/api/jobs", (req, res) => {
  const { jobTitle, classification, location } = req.body;

  if (!jobTitle || !classification || !location) {
    return res.status(400).json({ error: "jobTitle, classification, and location are required" });
  }

  const db = readDb();
  const nextId = db.jobs.length > 0 ? Math.max(...db.jobs.map((j) => j.id)) + 1 : 1;
  const newJob = { id: nextId, jobTitle, classification, location };

  db.jobs.push(newJob);
  writeDb(db);

  res.status(201).json(newJob);
});

// Update Job API - Update an existing job in the collection
app.put("/api/jobs/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { jobTitle, classification, location } = req.body;

  const db = readDb();
  const index = db.jobs.findIndex((job) => job.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (jobTitle) db.jobs[index].jobTitle = jobTitle;
  if (classification) db.jobs[index].classification = classification;
  if (location) db.jobs[index].location = location;

  writeDb(db);

  res.json(db.jobs[index]);
});

// Delete Job API - Delete a job from the collection
app.delete("/api/jobs/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = readDb();
  const index = db.jobs.findIndex((job) => job.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Job not found" });
  }

  const deleted = db.jobs.splice(index, 1)[0];
  writeDb(db);

  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`Scout backend running on http://localhost:${PORT}`);
});
