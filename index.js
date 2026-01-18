require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

connectDB();

// Jobs Routes
app.get('/jobs', async (req, res) => {
  try {
    const db = client.db(process.env.DB_NAME);
    const jobs = await db.collection('jobs').find().toArray();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/jobs/:id', async (req, res) => {
  try {
    const db = client.db(process.env.DB_NAME);
    const job = await db.collection('jobs').findOne({ _id: new ObjectId(req.params.id) });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/jobs', async (req, res) => {
  try {
    const { company, jobLink, location, jobType } = req.body;
    if (!company || !jobLink) {
      return res.status(400).json({ error: 'Company and jobLink are required' });
    }
    const db = client.db(process.env.DB_NAME);
    const result = await db.collection('jobs').insertOne({
      company,
      jobLink,
      location,
      jobType,
      createdAt: new Date()
    });
    res.status(201).json({
      _id: result.insertedId,
      company,
      jobLink,
      location,
      jobType,
      createdAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Applications Routes
app.get('/applications', async (req, res) => {
  try {
    const db = client.db(process.env.DB_NAME);
    const applications = await db.collection('applications').find().toArray();
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/applications/:id', async (req, res) => {
  try {
    const db = client.db(process.env.DB_NAME);
    const application = await db.collection('applications').findOne({ _id: new ObjectId(req.params.id) });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/applications', async (req, res) => {
  try {
    const { company, jobLink, location, jobType, status } = req.body;
    if (!company || !jobLink) {
      return res.status(400).json({ error: 'Company and jobLink are required' });
    }
    const db = client.db(process.env.DB_NAME);
    const result = await db.collection('applications').insertOne({
      company,
      jobLink,
      location,
      jobType,
      status,
      appliedAt: new Date()
    });
    res.status(201).json({
      _id: result.insertedId,
      company,
      jobLink,
      location,
      jobType,
      status,
      appliedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/applications/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const db = client.db(process.env.DB_NAME);
    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summary Route
app.get('/applications-summary', async (req, res) => {
  try {
    const db = client.db(process.env.DB_NAME);
    const total = await db.collection('applications').countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayCount = await db.collection('applications').countDocuments({
      appliedAt: { $gte: today, $lt: tomorrow }
    });
    const statusBreakdown = await db.collection('applications').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    const breakdown = statusBreakdown.reduce((acc, item) => {
      acc[item._id || 'unknown'] = item.count;
      return acc;
    }, {});
    res.json({
      total,
      today: todayCount,
      statusBreakdown: breakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});