const DoctorController = require('../src/controllers/DoctorController');
const DoctorModel = require('../src/models/DoctorModel');

jest.mock('../src/db');
jest.mock('../src/models/DoctorModel');

describe('Personnel Service - Doctor Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      query: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createDoctor', () => {
    it('should return 400 if required fields missing', async () => {
      mockReq.body = { name: 'Dr. Ahmed' };

      await DoctorController.createDoctor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Name, email, and speciality are required',
      });
    });

    it('should create doctor successfully', async () => {
      const newDoctor = {
        id: 1,
        name: 'Dr. Fatima',
        email: 'fatima@hospital.com',
        speciality: 'cardio',
        service: 'Cardiology',
        available: true,
      };

      mockReq.body = {
        name: 'Dr. Fatima',
        email: 'fatima@hospital.com',
        speciality: 'cardio',
        service: 'Cardiology',
      };

      DoctorModel.createDoctor.mockResolvedValue(newDoctor);

      await DoctorController.createDoctor(mockReq, mockRes);

      expect(DoctorModel.createDoctor).toHaveBeenCalledWith(
        'Dr. Fatima',
        'fatima@hospital.com',
        'cardio',
        'Cardiology'
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Doctor created successfully',
          doctor: newDoctor,
        })
      );
    });
  });

  describe('getDoctorsBySpeciality', () => {
    it('should return 400 if speciality missing', async () => {
      mockReq.query = {};

      await DoctorController.getDoctorsBySpeciality(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Speciality query parameter is required',
      });
    });

    it('should return doctors by speciality', async () => {
      const mockDoctors = [
        {
          id: 1,
          name: 'Dr. Fatima',
          email: 'fatima@hospital.com',
          speciality: 'cardio',
          available: true,
        },
        {
          id: 2,
          name: 'Dr. Ahmed',
          email: 'ahmed@hospital.com',
          speciality: 'cardio',
          available: true,
        },
      ];

      mockReq.query = { speciality: 'cardio' };

      DoctorModel.getDoctorsBySpeciality.mockResolvedValue(mockDoctors);

      await DoctorController.getDoctorsBySpeciality(mockReq, mockRes);

      expect(DoctorModel.getDoctorsBySpeciality).toHaveBeenCalledWith('cardio');
      expect(mockRes.json).toHaveBeenCalledWith({
        doctors: mockDoctors,
        count: 2,
      });
    });

    it('should return empty array if no doctors found', async () => {
      mockReq.query = { speciality: 'neurology' };

      DoctorModel.getDoctorsBySpeciality.mockResolvedValue([]);

      await DoctorController.getDoctorsBySpeciality(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        doctors: [],
        count: 0,
      });
    });
  });

  describe('getDoctorById', () => {
    it('should return 404 if doctor not found', async () => {
      mockReq.params = { doctorId: '999' };

      DoctorModel.getDoctorById.mockResolvedValue(null);

      await DoctorController.getDoctorById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Doctor not found',
      });
    });

    it('should return doctor by id', async () => {
      const mockDoctor = {
        id: 1,
        name: 'Dr. Fatima',
        email: 'fatima@hospital.com',
        speciality: 'cardio',
        available: true,
      };

      mockReq.params = { doctorId: '1' };

      DoctorModel.getDoctorById.mockResolvedValue(mockDoctor);

      await DoctorController.getDoctorById(mockReq, mockRes);

      expect(DoctorModel.getDoctorById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(mockDoctor);
    });
  });

  describe('getAllDoctors', () => {
    it('should return all doctors', async () => {
      const mockDoctors = [
        { id: 1, name: 'Dr. Fatima', speciality: 'cardio' },
        { id: 2, name: 'Dr. Ahmed', speciality: 'dental' },
      ];

      DoctorModel.getAllDoctors.mockResolvedValue(mockDoctors);

      await DoctorController.getAllDoctors(mockReq, mockRes);

      expect(DoctorModel.getAllDoctors).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        doctors: mockDoctors,
        count: 2,
      });
    });
  });

  describe('updateDoctor', () => {
    it('should return 400 if required fields missing', async () => {
      mockReq.params = { doctorId: '1' };
      mockReq.body = { name: 'Dr. Fatima' };

      await DoctorController.updateDoctor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if doctor not found', async () => {
      mockReq.params = { doctorId: '999' };
      mockReq.body = {
        name: 'Dr. Fatima',
        email: 'fatima@hospital.com',
        speciality: 'cardio',
      };

      DoctorModel.updateDoctor.mockResolvedValue(null);

      await DoctorController.updateDoctor(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Doctor not found',
      });
    });

    it('should update doctor successfully', async () => {
      const updatedDoctor = {
        id: 1,
        name: 'Dr. Fatima Updated',
        email: 'fatima.new@hospital.com',
        speciality: 'cardio',
        available: true,
      };

      mockReq.params = { doctorId: '1' };
      mockReq.body = {
        name: 'Dr. Fatima Updated',
        email: 'fatima.new@hospital.com',
        speciality: 'cardio',
        service: 'Cardiology',
      };

      DoctorModel.updateDoctor.mockResolvedValue(updatedDoctor);

      await DoctorController.updateDoctor(mockReq, mockRes);

      expect(DoctorModel.updateDoctor).toHaveBeenCalledWith(
        '1',
        'Dr. Fatima Updated',
        'fatima.new@hospital.com',
        'cardio',
        'Cardiology'
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Doctor updated successfully',
          doctor: updatedDoctor,
        })
      );
    });
  });

  describe('setAvailability', () => {
    it('should return 400 if available status missing', async () => {
      mockReq.params = { doctorId: '1' };
      mockReq.body = {};

      await DoctorController.setAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Available status is required',
      });
    });

    it('should return 404 if doctor not found', async () => {
      mockReq.params = { doctorId: '999' };
      mockReq.body = { available: false };

      DoctorModel.setAvailability.mockResolvedValue(null);

      await DoctorController.setAvailability(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should update doctor availability', async () => {
      const updatedDoctor = {
        id: 1,
        name: 'Dr. Fatima',
        speciality: 'cardio',
        available: false,
      };

      mockReq.params = { doctorId: '1' };
      mockReq.body = { available: false };

      DoctorModel.setAvailability.mockResolvedValue(updatedDoctor);

      await DoctorController.setAvailability(mockReq, mockRes);

      expect(DoctorModel.setAvailability).toHaveBeenCalledWith('1', false);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Doctor availability updated',
          doctor: updatedDoctor,
        })
      );
    });
  });
});
