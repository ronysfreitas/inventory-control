export type PriorityLabel = 'Crítica' | 'Alta' | 'Moderada' | 'Baixa';
export type PriorityTone = 'critical' | 'high' | 'medium' | 'low';

export interface ProductBase {
  id: number;
  codigo: string;
  nome: string;
  unidadeCompra: string;
  estoqueMinimo: number;
  estoqueAtual: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPriority {
  label: PriorityLabel;
  tone: PriorityTone;
  score: number;
  gap: number;
  coverage: number | null;
  reason: string;
}

export interface ProductWithPriority extends ProductBase {
  priority: ProductPriority;
  lastEntryDate: string | null;
  lastExitDate: string | null;
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  tone?: PriorityTone | 'default';
}

export interface DashboardSupplier {
  id: number;
  nome: string;
  totalQuantidade: number;
  totalEntradas: number;
}

export interface StatusSummaryItem {
  label: PriorityLabel;
  total: number;
}

export interface DailyMovementPoint {
  day: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface DashboardData {
  databaseReady: boolean;
  metrics: DashboardMetric[];
  products: ProductWithPriority[];
  statusSummary: StatusSummaryItem[];
  movementSeries: DailyMovementPoint[];
  supplierRanking: DashboardSupplier[];
}

export interface SupplierListItem {
  id: number;
  nome: string;
  contato1: string | null;
  contato2: string | null;
  email: string | null;
  totalEntradas: number;
}

export interface ProductCatalogData {
  databaseReady: boolean;
  products: ProductWithPriority[];
}

export interface SupplierCatalogData {
  databaseReady: boolean;
  suppliers: SupplierListItem[];
}

export interface EntryRecord {
  id: number;
  codigoProduto: string;
  data: string;
  fornecedorId: number;
  fornecedorNome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacao: string | null;
}

export interface ExitRecord {
  id: number;
  codigoProduto: string;
  data: string;
  quantidade: number;
  observacao: string | null;
}

export interface ProductSupplierRankingItem {
  id: number;
  nome: string;
  totalQuantidade: number;
  totalEntradas: number;
  ultimaEntrega: string | null;
}

export interface SupplierOption {
  id: number;
  nome: string;
}

export interface ProductSuggestion {
  id: number;
  codigo: string;
  nome: string;
}

export interface ProductDetailsData {
  databaseReady: boolean;
  product: ProductWithPriority | null;
  entriesLast90Days: EntryRecord[];
  exitsLast90Days: ExitRecord[];
  suppliersLastYear: ProductSupplierRankingItem[];
  movementSeries: DailyMovementPoint[];
  availableSuppliers: SupplierOption[];
}
