const express = require('express');
const PatientController = require('../controllers/PatientController');

const router = express.Router();

router.post('/register', (req, res) => PatientController.register(req, res));
router.post('/login', (req, res) => PatientController.login(req, res));
router.get('/profile/:patientId', (req, res) => PatientController.getProfile(req, res));

module.exports = router;
