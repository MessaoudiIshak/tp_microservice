const PersonnelServiceClient = require('../src/services/PersonnelServiceClient');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Planning Service - Personnel Service Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PERSONNEL_SERVICE_URL = 'http://localhost:3002';
  });

  describe('findDoctorBySpeciality', () => {
    it('should return a doctor when doctors are available', async () => {
      const mockDoctors = [
        {
          id: 1,
          name: 'Dr. Ahmed',
          speciality: 'cardio',
          available: true,
        },
        {
          id: 2,
          name: 'Dr. Fatima',
          speciality: 'cardio',
          available: true,
        },
      ];

      axios.get.mockResolvedValue({
        data: { doctors: mockDoctors },
      });

      const result = await PersonnelServiceClient.findDoctorBySpeciality('cardio');

      expect(axios.get).toHaveBeenCalledWith('http://localhost:3002/personnel/doctors', {
        params: { speciality: 'cardio' },
      });
      expect(result).toEqual(mockDoctors[0]);
    });

    it('should return null when no doctors are available', async () => {
      axios.get.mockResolvedValue({
        data: { doctors: [] },
      });

      const result = await PersonnelServiceClient.findDoctorBySpeciality('cardio');

      expect(result).toBeNull();
    });

    it('should throw error when API call fails', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(
        PersonnelServiceClient.findDoctorBySpeciality('cardio')
      ).rejects.toThrow('Unable to fetch doctors from Personnel Service');
    });

    it('should handle API response without doctors array', async () => {
      axios.get.mockResolvedValue({
        data: {},
      });

      const result = await PersonnelServiceClient.findDoctorBySpeciality('cardio');

      expect(result).toBeNull();
    });
  });

  describe('getDoctorById', () => {
    it('should return a doctor when found', async () => {
      const mockDoctor = {
        id: 1,
        name: 'Dr. Ahmed',
        speciality: 'cardio',
      };

      axios.get.mockResolvedValue({
        data: mockDoctor,
      });

      const result = await PersonnelServiceClient.getDoctorById(1);

      expect(axios.get).toHaveBeenCalledWith('http://localhost:3002/personnel/doctors/1');
      expect(result).toEqual(mockDoctor);
    });

    it('should throw error when doctor not found', async () => {
      axios.get.mockRejectedValue(new Error('Not Found'));

      await expect(
        PersonnelServiceClient.getDoctorById(999)
      ).rejects.toThrow('Doctor not found');
    });
  });
});
