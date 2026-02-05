const express = require('express');
const AppointmentController = require('../controllers/AppointmentController');

const router = express.Router();

router.post('/rdv', (req, res) => AppointmentController.createAppointment(req, res));
router.get('/rdv', (req, res) => AppointmentController.getAppointments(req, res));
router.get('/rdv/:appointmentId', (req, res) => AppointmentController.getAppointmentById(req, res));
router.patch('/rdv/:appointmentId/status', (req, res) => AppointmentController.updateAppointmentStatus(req, res));

module.exports = router;
