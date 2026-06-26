export interface LearningComponent {
  id: string;
  title: string;
  shortDescription: string;
  type: 'unit' | 'assessment';
  approximateDurationMinutes: number;
  metadata: Record<string, any>;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  type: 'start' | 'end' | 'unit' | 'assessment';
  label: string;
  position: NodePosition;
  componentId?: string | null;
}

export interface ConditionRule {
  id: string;
  sourceType: 'unit' | 'assessment';
  sourceNodeId: string;
  metric: 'score' | 'score_range' | 'passed' | 'completion' | string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
  value?: any;
  range?: {
    min: number;
    max: number;
    minInclusive?: boolean;
    maxInclusive?: boolean;
  };
}

export interface EdgeConditions {
  operator: 'AND' | 'OR';
  rules: ConditionRule[];
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  isDefault: boolean;
  priority: number;
  conditions: EdgeConditions;
}

export interface CanvasConfig {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published';
  version?: number;
  canvas: CanvasConfig;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface EvaluateRequest {
  currentNodeId: string;
  metrics: Record<string, any>;
}

export interface EvaluateResponse {
  nextNodeId: string | null;
}
