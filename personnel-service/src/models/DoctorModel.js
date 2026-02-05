const pool = require('./db');

class DoctorModel {
  async createDoctor(name, email, speciality, service) {
    const query = `
      INSERT INTO doctors (name, email, speciality, service, available)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, name, email, speciality, service, available
    `;
    
    const result = await pool.query(query, [name, email, speciality, service]);
    return result.rows[0];
  }

  async getDoctorsBySpeciality(speciality) {
    const query = `
      SELECT id, name, email, speciality, service, available
      FROM doctors
      WHERE speciality = $1 AND available = TRUE
      ORDER BY name
    `;
    
    const result = await pool.query(query, [speciality]);
    return result.rows;
  }

  async getDoctorById(id) {
    const query = `
      SELECT id, name, email, speciality, service, available
      FROM doctors
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getAllDoctors() {
    const query = `
      SELECT id, name, email, speciality, service, available
      FROM doctors
      ORDER BY speciality, name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  async updateDoctor(id, name, email, speciality, service) {
    const query = `
      UPDATE doctors
      SET name = $1, email = $2, speciality = $3, service = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, speciality, service, available
    `;
    
    const result = await pool.query(query, [name, email, speciality, service, id]);
    return result.rows[0];
  }

  async setAvailability(id, available) {
    const query = `
      UPDATE doctors
      SET available = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, speciality, service, available
    `;
    
    const result = await pool.query(query, [available, id]);
    return result.rows[0];
  }
}

module.exports = new DoctorModel();
