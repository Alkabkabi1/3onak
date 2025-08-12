const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const responseRoutes = require('./routes/responseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const generalRequestRoutes = require('./routes/generalRequestRoutes');
const misconductRoutes = require('./routes/misconductRoutes');
const overviewRoutes = require('./routes/overviewRoutes');
const generalComplaintsRoutes = require('./routes/generalComplaintsRoutes');
const inpersonComplaintsRoutes = require('./routes/inpersonComplaintsRoutes');
const logsRoutes = require('./routes/logsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Backend is running successfully'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/general-requests', generalRequestRoutes);
app.use('/api/misconduct', misconductRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/general-complaints', generalComplaintsRoutes);
app.use('/api/inperson-complaints', inpersonComplaintsRoutes);
app.use('/api/logs', logsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
}); 