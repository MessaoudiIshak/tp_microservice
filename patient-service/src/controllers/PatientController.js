const jwt = require('jsonwebtoken');
const PatientModel = require('../models/PatientModel');

class PatientController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingPatient = await PatientModel.getPatientByEmail(email);
      if (existingPatient) {
        return res.status(409).json({ error: 'Patient already exists' });
      }

      const patient = await PatientModel.createPatient(name, email, password);
      
      res.status(201).json({
        message: 'Patient registered successfully',
        patient,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const patient = await PatientModel.getPatientByEmail(email);
      if (!patient) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await PatientModel.verifyPassword(password, patient.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: patient.id, email: patient.email, name: patient.name },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req, res) {
    try {
      const { patientId } = req.params;
      const patient = await PatientModel.getPatientById(patientId);

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      res.json(patient);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new PatientController();
