const pool = require('./db');

class AppointmentModel {
  async createAppointment(date, doctorId, speciality, patientId, status = 'UPCOMING') {
    const query = `
      INSERT INTO appointments (date, doctor_id, speciality, patient_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, date, doctor_id, speciality, patient_id, status
    `;
    
    const result = await pool.query(query, [date, doctorId, speciality, patientId, status]);
    return result.rows[0];
  }

  async getAppointmentById(id) {
    const query = `
      SELECT id, date, doctor_id, speciality, patient_id, status
      FROM appointments
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getAppointmentsByPatientId(patientId) {
    const query = `
      SELECT id, date, doctor_id, speciality, patient_id, status
      FROM appointments
      WHERE patient_id = $1
      ORDER BY date DESC
    `;
    
    const result = await pool.query(query, [patientId]);
    return result.rows;
  }

  async getAppointmentsByDoctorId(doctorId) {
    const query = `
      SELECT id, date, doctor_id, speciality, patient_id, status
      FROM appointments
      WHERE doctor_id = $1
      ORDER BY date DESC
    `;
    
    const result = await pool.query(query, [doctorId]);
    return result.rows;
  }

  async updateAppointmentStatus(id, status) {
    const query = `
      UPDATE appointments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, date, doctor_id, speciality, patient_id, status
    `;
    
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  async getAppointmentsByStatus(status) {
    const query = `
      SELECT id, date, doctor_id, speciality, patient_id, status
      FROM appointments
      WHERE status = $1
      ORDER BY date DESC
    `;
    
    const result = await pool.query(query, [status]);
    return result.rows;
  }
}

module.exports = new AppointmentModel();
