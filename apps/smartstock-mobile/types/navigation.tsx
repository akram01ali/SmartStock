export interface Component {
  componentName: string;
  amount: number;
  measure: string;
  lastScanned: string;
  scannedBy: string;
  durationOfDevelopment: number;
  triggerMinAmount: number;
  supplier: string;
  cost: number;
  type: string;
  description?: string;
  image?: string;
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
