const express = require('express');
const router = express.Router();
const { 
    getComplaintStats, 
    getComplaintsForExport, 
    getAnalysisAndSuggestions,
    getInPersonComplaintsStats,
    getInPersonComplaintsForExport
} = require('../controllers/reportController');

// Routes for complaint reports
router.get('/stats', getComplaintStats);
router.get('/export-data', getComplaintsForExport);
router.get('/analysis', getAnalysisAndSuggestions);

// Routes for in-person complaints
router.get('/inperson-complaints', getInPersonComplaintsStats);
router.get('/inperson-complaints-export', getInPersonComplaintsForExport);

module.exports = router; 