export interface ProductionStage {
  id?: string;
  stageName: string;
  duration: number;
  order: number;
}

export interface Component {
  componentName: string;
  amount: number;
  measure: string;
  lastScanned: string;
  scannedBy: string;
  productionStages?: ProductionStage[];
  triggerMinAmount: number;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  image?: string;
  location?: string;
}

export type RootStackParamList = {
  Home: undefined;
  Inventory: undefined;
  Components: {
    component: Component;
    editMode?: boolean;
  };
  QRScanner: undefined;
  MyPath: undefined;
  DocumentCategories: undefined;
  Wiki: undefined;
  Settings: undefined;
  Login: undefined;
  Register: undefined;
};
