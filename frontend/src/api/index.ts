import axios from 'axios';
import type { 
  LearningComponent, 
  LearningPath, 
  EvaluateRequest, 
  EvaluateResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getComponents: async (): Promise<{ items: LearningComponent[]; totalCount: number }> => {
    const response = await client.get('/api/components');
    return response.data;
  },

  getAllLearningPaths: async (): Promise<LearningPath[]> => {
    const response = await client.get('/api/learning-paths');
    return response.data;
  },

  getLearningPath: async (id: string): Promise<LearningPath> => {
    const response = await client.get(`/api/learning-paths/${id}`);
    return response.data;
  },

  saveLearningPath: async (path: LearningPath): Promise<LearningPath> => {
    const response = await client.post('/api/learning-paths', path);
    return response.data;
  },

  deleteLearningPath: async (id: string): Promise<void> => {
    await client.delete(`/api/learning-paths/${id}`);
  },

  evaluateNextNode: async (pathId: string, request: EvaluateRequest): Promise<EvaluateResponse> => {
    const response = await client.post(`/api/learning-paths/${pathId}/evaluate`, request);
    return response.data;
  },
};
