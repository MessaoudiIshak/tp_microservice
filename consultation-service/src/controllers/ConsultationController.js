const ConsultationModel = require('../models/ConsultationModel');

class ConsultationController {
  async createConsultation(req, res) {
    try {
      const { doctorId, patientId, speciality, appointmentId, consultationDate } = req.body;

      if (!doctorId || !patientId || !speciality || !appointmentId || !consultationDate) {
        return res.status(400).json({ 
          error: 'All fields (doctorId, patientId, speciality, appointmentId, consultationDate) are required' 
        });
      }

      // Check if consultation already exists for this appointment
      const existing = await ConsultationModel.getConsultationByAppointmentId(appointmentId);
      if (existing) {
        return res.status(409).json({ 
          error: 'Consultation already exists for this appointment' 
        });
      }

      const consultation = await ConsultationModel.createConsultation(
        doctorId,
        patientId,
        speciality,
        appointmentId,
        consultationDate
      );
      
      res.status(201).json({
        message: 'Consultation created successfully',
        consultation,
      });
    } catch (error) {
      console.error('Create consultation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getConsultations(req, res) {
    try {
      const { patientId, doctorId, appointmentId } = req.query;

      let consultations;

      if (patientId) {
        consultations = await ConsultationModel.getConsultationsByPatientId(patientId);
      } else if (doctorId) {
        consultations = await ConsultationModel.getConsultationsByDoctorId(doctorId);
      } else if (appointmentId) {
        const consultation = await ConsultationModel.getConsultationByAppointmentId(appointmentId);
        consultations = consultation ? [consultation] : [];
      } else {
        consultations = await ConsultationModel.getAllConsultations();
      }

      res.json({
        consultations,
        count: consultations.length,
      });
    } catch (error) {
      console.error('Get consultations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getConsultationById(req, res) {
    try {
      const { consultationId } = req.params;
      const consultation = await ConsultationModel.getConsultationById(consultationId);

      if (!consultation) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      res.json(consultation);
    } catch (error) {
      console.error('Get consultation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateConsultationNotes(req, res) {
    try {
      const { consultationId } = req.params;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({ error: 'Notes are required' });
      }

      const consultation = await ConsultationModel.updateConsultationNotes(consultationId, notes);

      if (!consultation) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      res.json({
        message: 'Consultation notes updated',
        consultation,
      });
    } catch (error) {
      console.error('Update consultation notes error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new ConsultationController();
