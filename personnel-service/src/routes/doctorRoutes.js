const express = require('express');
const DoctorController = require('../controllers/DoctorController');

const router = express.Router();

router.post('/doctors', (req, res) => DoctorController.createDoctor(req, res));
router.get('/doctors', (req, res) => DoctorController.getDoctorsBySpeciality(req, res));
router.get('/doctors/all', (req, res) => DoctorController.getAllDoctors(req, res));
router.get('/doctors/:doctorId', (req, res) => DoctorController.getDoctorById(req, res));
router.put('/doctors/:doctorId', (req, res) => DoctorController.updateDoctor(req, res));
router.patch('/doctors/:doctorId/availability', (req, res) => DoctorController.setAvailability(req, res));

module.exports = router;
