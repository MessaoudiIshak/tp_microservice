const bcrypt = require('bcryptjs');
const pool = require('./db');

class PatientModel {
  async createPatient(name, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO patients (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
    `;
    
    const result = await pool.query(query, [name, email, hashedPassword]);
    return result.rows[0];
  }

  async getPatientByEmail(email) {
    const query = 'SELECT id, name, email, password FROM patients WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async getPatientById(id) {
    const query = 'SELECT id, name, email FROM patients WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async verifyPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }
}

module.exports = new PatientModel();
