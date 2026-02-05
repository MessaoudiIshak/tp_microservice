const AppointmentModel = require('../models/AppointmentModel');
const PersonnelServiceClient = require('../services/PersonnelServiceClient');
const publisher = require('../rabbitmq/publisher');

class AppointmentController {
  /**
   * Create Appointment Workflow:
   * 1. Validate patient ID and appointment date
   * 2. Call Personnel Service to find available doctor with speciality
   * 3. If no doctor found, return error
   * 4. Create appointment in database with UPCOMING status
   * 5. Publish APPOINTMENT_CREATED event to RabbitMQ
   * 6. Return appointment confirmation
   */
  async createAppointment(req, res) {
    try {
      const { date, speciality, patientId } = req.body;

      // Validation
      if (!date || !speciality || !patientId) {
        return res.status(400).json({ 
          error: 'Date, speciality, and patientId are required' 
        });
      }

      // Step 2: Find available doctor with speciality
      console.log(`Finding doctor with speciality: ${speciality}`);
      const doctor = await PersonnelServiceClient.findDoctorBySpeciality(speciality);

      if (!doctor) {
        return res.status(404).json({ 
          error: `No available doctor found for speciality: ${speciality}` 
        });
      }

      // Step 3: Create appointment in database
      console.log(`Creating appointment for patient ${patientId} with doctor ${doctor.id}`);
      const appointment = await AppointmentModel.createAppointment(
        date,
        doctor.id,
        speciality,
        patientId,
        'UPCOMING'
      );

      // Step 4: Publish event to RabbitMQ
      console.log(`Publishing APPOINTMENT_CREATED event for appointment ${appointment.id}`);
      await publisher.publishEvent('APPOINTMENT_CREATED', {
        appointmentId: appointment.id,
        rdvId: appointment.id, // RDV = Rendez-vous (appointment)
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId: patientId,
        speciality: speciality,
        date: date,
        status: 'UPCOMING',
      });

      // Step 5: Return confirmation
      res.status(201).json({
        message: 'Appointment created successfully',
        appointment: {
          ...appointment,
          doctor: {
            id: doctor.id,
            name: doctor.name,
            speciality: doctor.speciality,
          },
        },
      });
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getAppointments(req, res) {
    try {
      const { patientId, doctorId, status } = req.query;

      let appointments;

      if (patientId) {
        appointments = await AppointmentModel.getAppointmentsByPatientId(patientId);
      } else if (doctorId) {
        appointments = await AppointmentModel.getAppointmentsByDoctorId(doctorId);
      } else if (status) {
        appointments = await AppointmentModel.getAppointmentsByStatus(status);
      } else {
        return res.status(400).json({ 
          error: 'Provide patientId, doctorId, or status query parameter' 
        });
      }

      res.json({
        appointments,
        count: appointments.length,
      });
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAppointmentById(req, res) {
    try {
      const { appointmentId } = req.params;
      const appointment = await AppointmentModel.getAppointmentById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Get appointment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateAppointmentStatus(req, res) {
    try {
      const { appointmentId } = req.params;
      const { status } = req.body;

      const validStatuses = ['UPCOMING', 'DONE', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      const appointment = await AppointmentModel.updateAppointmentStatus(appointmentId, status);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json({
        message: 'Appointment status updated',
        appointment,
      });
    } catch (error) {
      console.error('Update appointment status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AppointmentController();
