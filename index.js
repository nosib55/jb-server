const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const jobsFile = path.join(__dirname, 'jobs.json');
const applicationsFile = path.join(__dirname, 'applications.json');

// Load data from JSON files
let jobs = [];
let applications = [];

function loadData() {
  try {
    if (fs.existsSync(jobsFile)) {
      jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading jobs:', err);
  }
  try {
    if (fs.existsSync(applicationsFile)) {
      applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading applications:', err);
  }
}

function saveJobs() {
  try {
    fs.writeFileSync(jobsFile, JSON.stringify(jobs, null, 2));
  } catch (err) {
    console.error('Error saving jobs:', err);
  }
}

function saveApplications() {
  try {
    fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));
  } catch (err) {
    console.error('Error saving applications:', err);
  }
}

loadData();

// Jobs Routes
app.get('/jobs', (req, res) => {
  res.json(jobs);
});

app.get('/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/jobs', (req, res) => {
  const { company, jobLink, location, jobType } = req.body;
  if (!company || !jobLink) {
    return res.status(400).json({ error: 'Company and jobLink are required' });
  }
  const id = Date.now().toString();
  const newJob = {
    id,
    company,
    jobLink,
    location,
    jobType,
    createdAt: new Date()
  };
  jobs.push(newJob);
  saveJobs();
  res.status(201).json(newJob);
});

// Applications Routes
app.get('/applications', (req, res) => {
  res.json(applications);
});

app.get('/applications/:id', (req, res) => {
  const application = applications.find(a => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  res.json(application);
});

app.post('/applications', (req, res) => {
  const { company, jobLink, location, jobType, status } = req.body;
  if (!company || !jobLink) {
    return res.status(400).json({ error: 'Company and jobLink are required' });
  }
  const id = Date.now().toString();
  const newApplication = {
    id,
    company,
    jobLink,
    location,
    jobType,
    status,
    appliedAt: new Date()
  };
  applications.push(newApplication);
  saveApplications();
  res.status(201).json(newApplication);
});

app.patch('/applications/:id', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  const application = applications.find(a => a.id === req.params.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  application.status = status;
  saveApplications();
  res.json({ message: 'Application updated' });
});

// Summary Route
app.get('/applications-summary', (req, res) => {
  const total = applications.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayCount = applications.filter(a => {
    const appliedDate = new Date(a.appliedAt);
    return appliedDate >= today && appliedDate < tomorrow;
  }).length;
  const statusBreakdown = applications.reduce((acc, a) => {
    const key = a.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  res.json({
    total,
    today: todayCount,
    statusBreakdown
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});