const PatientController = require('../src/controllers/PatientController');
const PatientModel = require('../src/models/PatientModel');
const jwt = require('jsonwebtoken');

jest.mock('../src/db');
jest.mock('../src/models/PatientModel');
jest.mock('jsonwebtoken');

describe('Patient Service - Patient Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('register', () => {
    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { name: 'Ahmed', email: 'ahmed@test.com' };

      await PatientController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'All fields are required',
      });
    });

    it('should return 409 if patient already exists', async () => {
      mockReq.body = {
        name: 'Ahmed Ali',
        email: 'ahmed@test.com',
        password: 'password123',
      };

      PatientModel.getPatientByEmail.mockResolvedValue({
        id: 1,
        email: 'ahmed@test.com',
      });

      await PatientController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Patient already exists',
      });
    });

    it('should register new patient successfully', async () => {
      const newPatient = {
        id: 1,
        name: 'Ahmed Ali',
        email: 'ahmed@test.com',
      };

      mockReq.body = {
        name: 'Ahmed Ali',
        email: 'ahmed@test.com',
        password: 'password123',
      };

      PatientModel.getPatientByEmail.mockResolvedValue(null);
      PatientModel.createPatient.mockResolvedValue(newPatient);

      await PatientController.register(mockReq, mockRes);

      expect(PatientModel.createPatient).toHaveBeenCalledWith(
        'Ahmed Ali',
        'ahmed@test.com',
        'password123'
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Patient registered successfully',
          patient: newPatient,
        })
      );
    });
  });

  describe('login', () => {
    it('should return 400 if email or password missing', async () => {
      mockReq.body = { email: 'ahmed@test.com' };

      await PatientController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email and password are required',
      });
    });

    it('should return 401 if patient not found', async () => {
      mockReq.body = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      PatientModel.getPatientByEmail.mockResolvedValue(null);

      await PatientController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
      });
    });

    it('should return 401 if password is incorrect', async () => {
      const patient = {
        id: 1,
        email: 'ahmed@test.com',
        name: 'Ahmed Ali',
        password: 'hashedPassword123',
      };

      mockReq.body = {
        email: 'ahmed@test.com',
        password: 'wrongPassword',
      };

      PatientModel.getPatientByEmail.mockResolvedValue(patient);
      PatientModel.verifyPassword.mockResolvedValue(false);

      await PatientController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
      });
    });

    it('should return JWT token on successful login', async () => {
      const patient = {
        id: 1,
        email: 'ahmed@test.com',
        name: 'Ahmed Ali',
        password: 'hashedPassword123',
      };

      const mockToken = 'jwt.token.here';

      mockReq.body = {
        email: 'ahmed@test.com',
        password: 'password123',
      };

      PatientModel.getPatientByEmail.mockResolvedValue(patient);
      PatientModel.verifyPassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue(mockToken);

      await PatientController.login(mockReq, mockRes);

      expect(PatientModel.verifyPassword).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123'
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          email: 'ahmed@test.com',
          name: 'Ahmed Ali',
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: '24h' })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: mockToken,
          patient: expect.objectContaining({
            id: 1,
            name: 'Ahmed Ali',
            email: 'ahmed@test.com',
          }),
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should return 404 if patient not found', async () => {
      mockReq.params = { patientId: '999' };

      PatientModel.getPatientById.mockResolvedValue(null);

      await PatientController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Patient not found',
      });
    });

    it('should return patient profile', async () => {
      const patient = {
        id: 1,
        name: 'Ahmed Ali',
        email: 'ahmed@test.com',
      };

      mockReq.params = { patientId: '1' };

      PatientModel.getPatientById.mockResolvedValue(patient);

      await PatientController.getProfile(mockReq, mockRes);

      expect(PatientModel.getPatientById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(patient);
    });
  });
});
