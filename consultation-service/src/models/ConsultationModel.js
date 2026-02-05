const pool = require('./db');

class ConsultationModel {
  async createConsultation(doctorId, patientId, speciality, appointmentId, consultationDate) {
    const query = `
      INSERT INTO consultations (doctor_id, patient_id, speciality, appointment_id, consultation_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, doctor_id, patient_id, speciality, appointment_id, consultation_date
    `;
    
    const result = await pool.query(query, [
      doctorId,
      patientId,
      speciality,
      appointmentId,
      consultationDate,
    ]);
    return result.rows[0];
  }

  async getConsultationById(id) {
    const query = `
      SELECT id, doctor_id, patient_id, speciality, appointment_id, consultation_date, notes
      FROM consultations
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getConsultationsByPatientId(patientId) {
    const query = `
      SELECT id, doctor_id, patient_id, speciality, appointment_id, consultation_date, notes
      FROM consultations
      WHERE patient_id = $1
      ORDER BY consultation_date DESC
    `;
    
    const result = await pool.query(query, [patientId]);
    return result.rows;
  }

  async getConsultationsByDoctorId(doctorId) {
    const query = `
      SELECT id, doctor_id, patient_id, speciality, appointment_id, consultation_date, notes
      FROM consultations
      WHERE doctor_id = $1
      ORDER BY consultation_date DESC
    `;
    
    const result = await pool.query(query, [doctorId]);
    return result.rows;
  }

  async getConsultationByAppointmentId(appointmentId) {
    const query = `
      SELECT id, doctor_id, patient_id, speciality, appointment_id, consultation_date, notes
      FROM consultations
      WHERE appointment_id = $1
    `;
    
    const result = await pool.query(query, [appointmentId]);
    return result.rows[0];
  }

  async updateConsultationNotes(id, notes) {
    const query = `
      UPDATE consultations
      SET notes = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, doctor_id, patient_id, speciality, appointment_id, consultation_date, notes
    `;
    
    const result = await pool.query(query, [notes, id]);
    return result.rows[0];
  }

  async getAllConsultations() {
    const query = `
      SELECT id, doctor_id, patient_id, speciality, appointment_id, consultation_date, notes
      FROM consultations
      ORDER BY consultation_date DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new ConsultationModel();
