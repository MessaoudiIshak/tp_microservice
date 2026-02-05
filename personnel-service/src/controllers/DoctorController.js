const DoctorModel = require('../models/DoctorModel');

class DoctorController {
  async createDoctor(req, res) {
    try {
      const { name, email, speciality, service } = req.body;

      if (!name || !email || !speciality) {
        return res.status(400).json({ error: 'Name, email, and speciality are required' });
      }

      const doctor = await DoctorModel.createDoctor(name, email, speciality, service);
      
      res.status(201).json({
        message: 'Doctor created successfully',
        doctor,
      });
    } catch (error) {
      console.error('Create doctor error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDoctorsBySpeciality(req, res) {
    try {
      const { speciality } = req.query;

      if (!speciality) {
        return res.status(400).json({ error: 'Speciality query parameter is required' });
      }

      const doctors = await DoctorModel.getDoctorsBySpeciality(speciality);
      
      res.json({
        doctors,
        count: doctors.length,
      });
    } catch (error) {
      console.error('Get doctors by speciality error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDoctorById(req, res) {
    try {
      const { doctorId } = req.params;
      const doctor = await DoctorModel.getDoctorById(doctorId);

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      res.json(doctor);
    } catch (error) {
      console.error('Get doctor error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllDoctors(req, res) {
    try {
      const doctors = await DoctorModel.getAllDoctors();
      
      res.json({
        doctors,
        count: doctors.length,
      });
    } catch (error) {
      console.error('Get all doctors error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateDoctor(req, res) {
    try {
      const { doctorId } = req.params;
      const { name, email, speciality, service } = req.body;

      if (!name || !email || !speciality) {
        return res.status(400).json({ error: 'Name, email, and speciality are required' });
      }

      const doctor = await DoctorModel.updateDoctor(doctorId, name, email, speciality, service);

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      res.json({
        message: 'Doctor updated successfully',
        doctor,
      });
    } catch (error) {
      console.error('Update doctor error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async setAvailability(req, res) {
    try {
      const { doctorId } = req.params;
      const { available } = req.body;

      if (available === undefined) {
        return res.status(400).json({ error: 'Available status is required' });
      }

      const doctor = await DoctorModel.setAvailability(doctorId, available);

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      res.json({
        message: 'Doctor availability updated',
        doctor,
      });
    } catch (error) {
      console.error('Set availability error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new DoctorController();
