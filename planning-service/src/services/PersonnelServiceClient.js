const axios = require('axios');

class PersonnelServiceClient {
  constructor() {
    this.baseURL = process.env.PERSONNEL_SERVICE_URL || 'http://localhost:3002';
  }

  async findDoctorBySpeciality(speciality) {
    try {
      const response = await axios.get(`${this.baseURL}/personnel/doctors`, {
        params: { speciality },
      });

      const doctors = response.data.doctors || [];
      
      if (doctors.length === 0) {
        return null;
      }

      // Return the first available doctor
      return doctors[0];
    } catch (error) {
      console.error('Error calling Personnel Service:', error.message);
      throw new Error('Unable to fetch doctors from Personnel Service');
    }
  }

  async getDoctorById(doctorId) {
    try {
      const response = await axios.get(`${this.baseURL}/personnel/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor:', error.message);
      throw new Error('Doctor not found');
    }
  }
}

module.exports = new PersonnelServiceClient();
