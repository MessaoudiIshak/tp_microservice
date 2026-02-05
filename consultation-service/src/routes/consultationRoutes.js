const express = require('express');
const ConsultationController = require('../controllers/ConsultationController');

const router = express.Router();

router.post('/consultations', (req, res) => ConsultationController.createConsultation(req, res));
router.get('/consultations', (req, res) => ConsultationController.getConsultations(req, res));
router.get('/consultations/:consultationId', (req, res) => ConsultationController.getConsultationById(req, res));
router.patch('/consultations/:consultationId/notes', (req, res) => ConsultationController.updateConsultationNotes(req, res));

module.exports = router;
