# JobBoard Backend - AI Coding Guidelines

## Architecture Overview
This is an Express.js backend for a Job Application Tracker using in-memory JSON data structures (no database). The app manages job listings and application tracking with RESTful APIs.

**Key Components:**
- `index.js`: Main server file with routes and in-memory data arrays
- In-memory arrays: `jobs`, `applications`
- Hardcoded port: 3001

## Data Patterns
Use in-memory arrays for data storage with JSON file persistence. Generate IDs using `Date.now().toString()`. Data loads from `jobs.json` and `applications.json` on startup and saves after modifications.

**Example data structure:**
```javascript
let jobs = [];
let applications = [];
```

**Add new item with persistence:**
```javascript
const id = Date.now().toString();
jobs.push({ id, ...data, createdAt: new Date() });
saveJobs(); // Persist to jobs.json
```

## API Route Structure
Routes follow REST conventions with consistent error handling.

**Validation:** Check required fields (company, jobLink) before operations.

**Response patterns:**
- Success: `res.json(data)` or `res.status(201).json(data)`
- Errors: `res.status(400/404/500).json({ error: message })`

## Summary Calculations
For summary endpoints, use array methods like filter and reduce.

**Example status breakdown:**
```javascript
const statusBreakdown = applications.reduce((acc, a) => {
  const key = a.status || 'unknown';
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
```

## Development Workflow
- Start server: `npm start`
- Data persists in `jobs.json` and `applications.json` files
- Use Postman/Insomnia for API testing
- Check console for server status and file load/save errors

## Code Style
- Use synchronous operations (no async/await needed)
- Destructure request body: `const { company, jobLink } = req.body;`
- Use string IDs for route params
- Include location/jobType/status as optional fields

## Common Patterns
- Date filtering: Use `new Date()` comparisons for date ranges
- Count queries: `array.length` for totals
- Update operations: Find and modify array elements directly

Reference: [index.js](index.js) for route implementations</content>
<parameter name="filePath">c:\jobBoard\jd-server\.github\copilot-instructions.md