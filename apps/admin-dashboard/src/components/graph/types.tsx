import { Node, Edge, Position, XYPosition } from '@xyflow/react';

interface NodeData {
  label: string;
  [key: string]: unknown;
}

export interface GraphNode extends Node {
  id: string;
  data: NodeData;
}

export interface GraphEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type: 'smoothstep';
  animated: boolean;
  label?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RelationshipDialogState {
  isOpen: boolean;
  sourceComponent: string;
  targetComponent: string;
  currentAmount: number;
}

export interface ComponentData {
  componentName: string;
  description?: string;
  inventory?: number;
  [key: string]: any;
}

export interface FlowProps {
  initialComponent?: string;
}

export interface ApiError {
  message: string;
}

export enum Measures {
  Centimeters = 'centimeters',
  Meters = 'meters',
  Amount = 'amount',
}

export enum TypeOfComponent {
  Printer = 'printer',
  Group = 'group',
  Component = 'component',
  Assembly = 'assembly',
}

export interface ComponentCreate {
  componentName: string;
  amount: number;
  measure: Measures;
  scannedBy: string;
  durationOfDevelopment: number;
  triggerMinAmount: number;
  supplier: string;
  cost: number;
  type: TypeOfComponent;
  lastScanned: string;
  description?: string;
  image?: string;
}

export interface ComponentUpdate {
  amount?: number;
  measure?: Measures;
  scannedBy?: string;
  durationOfDevelopment?: number;
  triggerMinAmount?: number;
  supplier?: string;
  cost?: number;
  type?: TypeOfComponent;
  description?: string;
  image?: string;
}

export interface ComponentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  component: ComponentCreate | null;
  mode: 'create' | 'edit';
  initialComponent?: string;
  onSubmit: (
    data: ComponentCreate,
    relationshipData?: { amount: number },
  ) => Promise<void>;
}

export interface FormFieldProps {
  label: string;
  name: string;
  value: any;
  onChange: (name: string, value: any) => void;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  precision?: number;
  textColor: string;
  inputBg: string;
  borderColor: string;
  optionBg?: string;
  optionColor?: string;
  isReadOnly?: boolean;
}
