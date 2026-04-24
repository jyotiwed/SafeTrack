import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import * as apiUtils from '../../utils/api';

// Mock axios
vi.mock('axios');

describe('API Utils', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication API', () => {
    
    it('should login user successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'test_token_123',
          user: { id: 1, email: 'test@example.com' }
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await apiUtils.loginUser('test@example.com', 'password123');
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123'
        })
      );
      expect(result.access_token).toBe('test_token_123');
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      axios.post.mockRejectedValue(mockError);
      
      await expect(apiUtils.loginUser('test@example.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
    });

    it('should register new user', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'newuser@example.com',
          full_name: 'New User'
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await apiUtils.registerUser({
        email: 'newuser@example.com',
        full_name: 'New User',
        password: 'SecurePass123'
      });
      
      expect(result.email).toBe('newuser@example.com');
    });

    it('should logout user', async () => {
      axios.post.mockResolvedValue({ data: { message: 'Logged out' } });
      
      const result = await apiUtils.logoutUser();
      
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'));
    });

    it('should refresh access token', async () => {
      const mockResponse = {
        data: { access_token: 'new_token_456' }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await apiUtils.refreshToken('old_token');
      
      expect(result.access_token).toBe('new_token_456');
    });
  });

  describe('Incident API', () => {
    
    it('should fetch all incidents', async () => {
      const mockIncidents = [
        { id: 1, title: 'Flood', type: 'flood' },
        { id: 2, title: 'Earthquake', type: 'earthquake' }
      ];
      
      axios.get.mockResolvedValue({ data: mockIncidents });
      
      const result = await apiUtils.getIncidents();
      
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/incidents'));
      expect(result).toHaveLength(2);
    });

    it('should fetch incident by ID', async () => {
      const mockIncident = {
        id: 1,
        title: 'Test Flood',
        type: 'flood',
        latitude: 20.5937,
        longitude: 78.9629
      };
      
      axios.get.mockResolvedValue({ data: mockIncident });
      
      const result = await apiUtils.getIncidentById(1);
      
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/incidents/1'));
      expect(result.id).toBe(1);
    });

    it('should create new incident', async () => {
      const newIncident = {
        title: 'New Flood',
        description: 'Heavy rainfall',
        incident_type: 'flood',
        latitude: 20.5937,
        longitude: 78.9629
      };
      
      axios.post.mockResolvedValue({ data: { id: 1, ...newIncident } });
      
      const result = await apiUtils.createIncident(newIncident);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/incidents'),
        newIncident
      );
      expect(result.title).toBe('New Flood');
    });

    it('should update incident', async () => {
      const update = { status: 'resolved' };
      
      axios.put.mockResolvedValue({ data: { id: 1, ...update } });
      
      const result = await apiUtils.updateIncident(1, update);
      
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/1'),
        update
      );
      expect(result.status).toBe('resolved');
    });

    it('should delete incident', async () => {
      axios.delete.mockResolvedValue({ data: { message: 'Deleted' } });
      
      await apiUtils.deleteIncident(1);
      
      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/incidents/1'));
    });

    it('should fetch incidents by type', async () => {
      const mockIncidents = [
        { id: 1, title: 'Flood 1', type: 'flood' },
        { id: 2, title: 'Flood 2', type: 'flood' }
      ];
      
      axios.get.mockResolvedValue({ data: mockIncidents });
      
      const result = await apiUtils.getIncidentsByType('flood');
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/incidents'),
        expect.objectContaining({
          params: expect.objectContaining({ type: 'flood' })
        })
      );
    });

    it('should fetch incidents near location', async () => {
      const mockIncidents = [
        { id: 1, latitude: 20.59, longitude: 78.96 }
      ];
      
      axios.get.mockResolvedValue({ data: mockIncidents });
      
      const result = await apiUtils.getIncidentsNear(20.5937, 78.9629, 50);
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/incidents/nearby'),
        expect.objectContaining({
          params: expect.objectContaining({
            latitude: 20.5937,
            longitude: 78.9629,
            radius: 50
          })
        })
      );
    });
  });

  describe('Prediction API', () => {
    
    it('should fetch predictions', async () => {
      const mockPredictions = [
        { id: 1, type: 'flood', risk: 0.75 },
        { id: 2, type: 'earthquake', risk: 0.45 }
      ];
      
      axios.get.mockResolvedValue({ data: mockPredictions });
      
      const result = await apiUtils.getPredictions();
      
      expect(result).toHaveLength(2);
    });

    it('should fetch predictions by type', async () => {
      const mockPredictions = [
        { id: 1, type: 'flood', risk: 0.75 }
      ];
      
      axios.get.mockResolvedValue({ data: mockPredictions });
      
      const result = await apiUtils.getPredictionsByType('flood');
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/predictions'),
        expect.objectContaining({
          params: expect.objectContaining({ type: 'flood' })
        })
      );
      expect(result[0].type).toBe('flood');
    });

    it('should fetch high-risk predictions', async () => {
      const mockPredictions = [
        { id: 1, type: 'flood', risk: 0.85 },
        { id: 2, type: 'cyclone', risk: 0.75 }
      ];
      
      axios.get.mockResolvedValue({ data: mockPredictions });
      
      const result = await apiUtils.getHighRiskPredictions(0.7);
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/predictions/high-risk'),
        expect.objectContaining({
          params: expect.objectContaining({ threshold: 0.7 })
        })
      );
    });

    it('should create prediction', async () => {
      const newPrediction = {
        prediction_type: 'flood',
        location: 'Mumbai',
        risk_level: 0.75
      };
      
      axios.post.mockResolvedValue({ data: { id: 1, ...newPrediction } });
      
      const result = await apiUtils.createPrediction(newPrediction);
      
      expect(result.prediction_type).toBe('flood');
    });
  });

  describe('Task API', () => {
    
    it('should fetch user tasks', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'pending' },
        { id: 2, title: 'Task 2', status: 'in_progress' }
      ];
      
      axios.get.mockResolvedValue({ data: mockTasks });
      
      const result = await apiUtils.getUserTasks();
      
      expect(result).toHaveLength(2);
    });

    it('should fetch task by ID', async () => {
      const mockTask = {
        id: 1,
        title: 'Evacuation Task',
        status: 'pending',
        priority: 'high'
      };
      
      axios.get.mockResolvedValue({ data: mockTask });
      
      const result = await apiUtils.getTaskById(1);
      
      expect(result.id).toBe(1);
    });

    it('should create task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium'
      };
      
      axios.post.mockResolvedValue({ data: { id: 1, ...newTask } });
      
      const result = await apiUtils.createTask(newTask);
      
      expect(result.title).toBe('New Task');
    });

    it('should update task', async () => {
      const update = { status: 'completed', progress: 100 };
      
      axios.put.mockResolvedValue({ data: { id: 1, ...update } });
      
      const result = await apiUtils.updateTask(1, update);
      
      expect(result.status).toBe('completed');
    });

    it('should delete task', async () => {
      axios.delete.mockResolvedValue({ data: { message: 'Deleted' } });
      
      await apiUtils.deleteTask(1);
      
      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/tasks/1'));
    });
  });

  describe('Alert API', () => {
    
    it('should fetch alerts', async () => {
      const mockAlerts = [
        { id: 1, message: 'Flood Alert', severity: 'high' },
        { id: 2, message: 'Earthquake Alert', severity: 'critical' }
      ];
      
      axios.get.mockResolvedValue({ data: mockAlerts });
      
      const result = await apiUtils.getAlerts();
      
      expect(result).toHaveLength(2);
    });

    it('should fetch active alerts', async () => {
      const mockAlerts = [
        { id: 1, message: 'Active Alert', is_active: true }
      ];
      
      axios.get.mockResolvedValue({ data: mockAlerts });
      
      const result = await apiUtils.getActiveAlerts();
      
      expect(result[0].is_active).toBe(true);
    });

    it('should acknowledge alert', async () => {
      axios.post.mockResolvedValue({ data: { message: 'Alert acknowledged' } });
      
      await apiUtils.acknowledgeAlert(1);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/alerts/1/acknowledge'),
        expect.any(Object)
      );
    });
  });

  describe('Analytics API', () => {
    
    it('should fetch incident statistics', async () => {
      const mockStats = {
        total_incidents: 150,
        by_type: { flood: 50, earthquake: 40, cyclone: 30 },
        by_status: { reported: 60, resolved: 90 }
      };
      
      axios.get.mockResolvedValue({ data: mockStats });
      
      const result = await apiUtils.getIncidentStatistics();
      
      expect(result.total_incidents).toBe(150);
      expect(result.by_type.flood).toBe(50);
    });

    it('should fetch prediction accuracy', async () => {
      const mockAccuracy = { overall: 0.85, by_type: { flood: 0.88, earthquake: 0.82 } };
      
      axios.get.mockResolvedValue({ data: mockAccuracy });
      
      const result = await apiUtils.getPredictionAccuracy();
      
      expect(result.overall).toBe(0.85);
    });

    it('should fetch response metrics', async () => {
      const mockMetrics = {
        average_response_time: 45,
        fastest_response: 5,
        slowest_response: 180
      };
      
      axios.get.mockResolvedValue({ data: mockMetrics });
      
      const result = await apiUtils.getResponseMetrics();
      
      expect(result.average_response_time).toBe(45);
    });
  });

  describe('Error Handling', () => {
    
    it('should handle 401 Unauthorized error', async () => {
      const mockError = {
        response: { status: 401, data: { message: 'Unauthorized' } }
      };
      
      axios.get.mockRejectedValue(mockError);
      
      try {
        await apiUtils.getIncidents();
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle 404 Not Found error', async () => {
      const mockError = {
        response: { status: 404, data: { message: 'Not found' } }
      };
      
      axios.get.mockRejectedValue(mockError);
      
      try {
        await apiUtils.getIncidentById(999);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle network error', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      
      await expect(apiUtils.getIncidents()).rejects.toThrow('Network Error');
    });

    it('should handle timeout error', async () => {
      const mockError = new Error('Request timeout');
      mockError.code = 'ECONNABORTED';
      
      axios.get.mockRejectedValue(mockError);
      
      await expect(apiUtils.getIncidents()).rejects.toThrow();
    });
  });

  describe('Request Interceptors', () => {
    
    it('should add authorization header to requests', async () => {
      const testToken = 'test_token_123';
      localStorage.setItem('access_token', testToken);
      
      axios.get.mockResolvedValue({ data: [] });
      
      await apiUtils.getIncidents();
      
      expect(axios.get).toHaveBeenCalled();
      const callConfig = axios.get.mock.calls[0][1];
      expect(callConfig?.headers?.Authorization).toContain(testToken);
    });
  });
});