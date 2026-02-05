const PatientModel = require('../src/models/PatientModel');
const bcrypt = require('bcryptjs');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs');

const db = require('../src/db');

describe('Patient Service - Patient Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    it('should create patient with hashed password', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            name: 'Ahmed Ali',
            email: 'ahmed@test.com',
          },
        ],
      };

      bcrypt.hash.mockResolvedValue('hashedPassword123');
      db.query.mockResolvedValue(mockResult);

      const result = await PatientModel.createPatient(
        'Ahmed Ali',
        'ahmed@test.com',
        'password123'
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe('getPatientByEmail', () => {
    it('should retrieve patient by email', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            name: 'Ahmed Ali',
            email: 'ahmed@test.com',
            password: 'hashedPassword123',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await PatientModel.getPatientByEmail('ahmed@test.com');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1'),
        ['ahmed@test.com']
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should return undefined if patient not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await PatientModel.getPatientByEmail('nonexistent@test.com');

      expect(result).toBeUndefined();
    });
  });

  describe('getPatientById', () => {
    it('should retrieve patient by id', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            name: 'Ahmed Ali',
            email: 'ahmed@test.com',
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await PatientModel.getPatientById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    it('should return undefined if patient not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await PatientModel.getPatientById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await PatientModel.verifyPassword(
        'password123',
        'hashedPassword123'
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await PatientModel.verifyPassword(
        'wrongPassword',
        'hashedPassword123'
      );

      expect(result).toBe(false);
    });
  });
});
