import type { PoolClient } from 'pg';

import { formatCurrency, formatQuantity } from '../formatters';
import { evaluatePurchasePriority } from '../prioridade';
import type {
  DailyMovementPoint,
  DashboardData,
  DashboardMetric,
  DashboardSupplier,
  EntryRecord,
  ExitRecord,
  ProductCatalogData,
  ProductDetailsData,
  ProductSupplierRankingItem,
  ProductWithPriority,
  StatusSummaryItem,
  SupplierCatalogData,
  SupplierListItem,
  SupplierOption
} from '../types';
import { isDatabaseConfigured, query, withTransaction } from './database';
import {
  entryInputSchema,
  exitInputSchema,
  productInputSchema,
  supplierInputSchema
} from './validation';

type NumericValue = number | string;

interface ProductQueryRow {
  id: NumericValue;
  codigo: string;
  nome: string;
  quantidade_por_unidade_compra: NumericValue;
  unidade_compra: string;
  estoque_minimo: NumericValue;
  estoque_atual: NumericValue;
  created_at: string;
  updated_at: string;
  ultima_entrada: string | null;
  ultima_saida: string | null;
}

interface SupplierQueryRow {
  id: NumericValue;
  nome: string;
  contato1: string;
  contato2: string | null;
  email: string | null;
  total_entradas: NumericValue | null;
  volume_anual: NumericValue | null;
}

interface SupplierRankingRow {
  id: NumericValue;
  nome: string;
  total_quantidade: NumericValue;
  total_entradas: NumericValue;
  ultima_entrega?: string | null;
}

interface DailyMovementRow {
  day: string;
  entradas: NumericValue;
  saidas: NumericValue;
}

interface EntryQueryRow {
  id: NumericValue;
  codigo_produto: string;
  data: string;
  fornecedor_id: NumericValue;
  fornecedor_nome: string;
  quantidade: NumericValue;
  valor_unitario: NumericValue;
  valor_total: NumericValue;
  observacao: string | null;
}

interface ExitQueryRow {
  id: NumericValue;
  codigo_produto: string;
  data: string;
  quantidade: NumericValue;
  observacao: string | null;
}

interface ProductIdRow {
  id: NumericValue;
  codigo: string;
}

function toNumber(value: NumericValue | null | undefined) {
  return Number(value ?? 0);
}

function normalizeProducts(rows: ProductQueryRow[]) {
  return rows
    .map<ProductWithPriority>((row) => ({
      id: toNumber(row.id),
      codigo: row.codigo,
      nome: row.nome,
      quantidadePorUnidadeCompra: toNumber(row.quantidade_por_unidade_compra),
      unidadeCompra: row.unidade_compra,
      estoqueMinimo: toNumber(row.estoque_minimo),
      estoqueAtual: toNumber(row.estoque_atual),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastEntryDate: row.ultima_entrada,
      lastExitDate: row.ultima_saida,
      priority: evaluatePurchasePriority(
        toNumber(row.estoque_atual),
        toNumber(row.estoque_minimo)
      )
    }))
    .sort((left, right) => {
      if (right.priority.score !== left.priority.score) {
        return right.priority.score - left.priority.score;
      }

      return left.codigo.localeCompare(right.codigo, 'pt-BR');
    });
}

function mapDailyMovement(rows: DailyMovementRow[]): DailyMovementPoint[] {
  return rows.map((row) => ({
    day: row.day,
    entradas: toNumber(row.entradas),
    saidas: toNumber(row.saidas),
    saldo: toNumber(row.entradas) - toNumber(row.saidas)
  }));
}

async function getProductsWithPriority() {
  const rows = await query<ProductQueryRow>(
    `
      SELECT
        p.id,
        p.codigo,
        p.nome,
        p.quantidade_por_unidade_compra,
        p.unidade_compra,
        p.estoque_minimo,
        p.estoque_atual,
        p.created_at::text,
        p.updated_at::text,
        (
          SELECT MAX(e.data_movimentacao)::text
          FROM entradas e
          WHERE e.produto_id = p.id
        ) AS ultima_entrada,
        (
          SELECT MAX(s.data_movimentacao)::text
          FROM saidas s
          WHERE s.produto_id = p.id
        ) AS ultima_saida
      FROM produtos p
      ORDER BY p.nome ASC
    `
  );

  return normalizeProducts(rows);
}

async function getDashboardMovementSeries() {
  const rows = await query<DailyMovementRow>(
    `
      SELECT
        TO_CHAR(days.day, 'YYYY-MM-DD') AS day,
        COALESCE(entries.total_entradas, 0) AS entradas,
        COALESCE(exits.total_saidas, 0) AS saidas
      FROM generate_series(
        CURRENT_DATE - INTERVAL '29 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS days(day)
      LEFT JOIN (
        SELECT
          data_movimentacao,
          SUM(quantidade) AS total_entradas
        FROM entradas
        WHERE data_movimentacao >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY data_movimentacao
      ) AS entries
        ON entries.data_movimentacao = days.day::date
      LEFT JOIN (
        SELECT
          data_movimentacao,
          SUM(quantidade) AS total_saidas
        FROM saidas
        WHERE data_movimentacao >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY data_movimentacao
      ) AS exits
        ON exits.data_movimentacao = days.day::date
      ORDER BY days.day ASC
    `
  );

  return mapDailyMovement(rows);
}

async function getTopSuppliersLastYear() {
  const rows = await query<SupplierRankingRow>(
    `
      SELECT
        f.id,
        f.nome,
        SUM(e.quantidade) AS total_quantidade,
        COUNT(*) AS total_entradas
      FROM entradas e
      INNER JOIN fornecedores f ON f.id = e.fornecedor_id
      WHERE e.data_movimentacao >= CURRENT_DATE - INTERVAL '365 days'
      GROUP BY f.id, f.nome
      ORDER BY total_quantidade DESC, total_entradas DESC, f.nome ASC
      LIMIT 6
    `
  );

  return rows.map<DashboardSupplier>((row: SupplierRankingRow) => ({
    id: toNumber(row.id),
    nome: row.nome,
    totalQuantidade: toNumber(row.total_quantidade),
    totalEntradas: toNumber(row.total_entradas)
  }));
}

function buildDashboardMetrics(
  products: ProductWithPriority[],
  movementSeries: DailyMovementPoint[]
): DashboardMetric[] {
  const totalProdutos = products.length;
  const produtosPrioritarios = products.filter(
    (item) => item.priority.label !== 'Baixa'
  ).length;
  const estoqueTotal = products.reduce((sum, item) => sum + item.estoqueAtual, 0);
  const entradas30Dias = movementSeries.reduce(
    (sum, item) => sum + item.entradas,
    0
  );
  const saidas30Dias = movementSeries.reduce((sum, item) => sum + item.saidas, 0);

  return [
    {
      label: 'Produtos cadastrados',
      value: `${totalProdutos}`,
      detail: `${produtosPrioritarios} exigem compra imediata ou monitoramento.`,
      tone: 'default'
    },
    {
      label: 'Saldo total em estoque',
      value: formatQuantity(estoqueTotal),
      detail: 'Soma do estoque atual de todos os produtos.',
      tone: 'low'
    },
    {
      label: 'Entradas em 30 dias',
      value: formatQuantity(entradas30Dias),
      detail: 'Volume recebido recentemente no estoque.',
      tone: 'medium'
    },
    {
      label: 'Saídas em 30 dias',
      value: formatQuantity(saidas30Dias),
      detail: `Balanço do período: ${formatQuantity(entradas30Dias - saidas30Dias)}.`,
      tone: 'high'
    }
  ];
}

function buildStatusSummary(products: ProductWithPriority[]): StatusSummaryItem[] {
  const totals = new Map<StatusSummaryItem['label'], number>([
    ['Crítica', 0],
    ['Alta', 0],
    ['Moderada', 0],
    ['Baixa', 0]
  ]);

  for (const product of products) {
    totals.set(
      product.priority.label,
      (totals.get(product.priority.label) ?? 0) + 1
    );
  }

  return Array.from(totals.entries()).map(([label, total]) => ({
    label,
    total
  }));
}

function emptyDashboardData(): DashboardData {
  return {
    databaseReady: false,
    metrics: [
      {
        label: 'Produtos cadastrados',
        value: '0',
        detail: 'Configure o PostgreSQL para começar a operar.',
        tone: 'default'
      },
      {
        label: 'Saldo total em estoque',
        value: '0',
        detail: 'Sem conexão com o banco no momento.',
        tone: 'low'
      },
      {
        label: 'Entradas em 30 dias',
        value: '0',
        detail: 'Os gráficos usarão dados reais assim que o banco for ligado.',
        tone: 'medium'
      },
      {
        label: 'Saídas em 30 dias',
        value: '0',
        detail: 'As rotas já estão prontas para registrar movimentações.',
        tone: 'high'
      }
    ],
    products: [],
    statusSummary: [
      { label: 'Crítica', total: 0 },
      { label: 'Alta', total: 0 },
      { label: 'Moderada', total: 0 },
      { label: 'Baixa', total: 0 }
    ],
    movementSeries: [],
    supplierRanking: []
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isDatabaseConfigured()) {
    return emptyDashboardData();
  }

  const [products, movementSeries, supplierRanking] = await Promise.all([
    getProductsWithPriority(),
    getDashboardMovementSeries(),
    getTopSuppliersLastYear()
  ]);

  return {
    databaseReady: true,
    metrics: buildDashboardMetrics(products, movementSeries),
    products,
    statusSummary: buildStatusSummary(products),
    movementSeries,
    supplierRanking
  };
}

export async function getProductCatalogData(): Promise<ProductCatalogData> {
  if (!isDatabaseConfigured()) {
    return {
      databaseReady: false,
      products: []
    };
  }

  return {
    databaseReady: true,
    products: await getProductsWithPriority()
  };
}

export async function getSupplierCatalogData(): Promise<SupplierCatalogData> {
  if (!isDatabaseConfigured()) {
    return {
      databaseReady: false,
      suppliers: []
    };
  }

  const rows = await query<SupplierQueryRow>(
    `
      SELECT
        f.id,
        f.nome,
        f.contato1,
        f.contato2,
        f.email,
        COUNT(e.id) AS total_entradas,
        COALESCE(
          SUM(
            CASE
              WHEN e.data_movimentacao >= CURRENT_DATE - INTERVAL '365 days' THEN e.quantidade
              ELSE 0
            END
          ),
          0
        ) AS volume_anual
      FROM fornecedores f
      LEFT JOIN entradas e ON e.fornecedor_id = f.id
      GROUP BY f.id
      ORDER BY f.nome ASC
    `
  );

  return {
    databaseReady: true,
    suppliers: rows.map<SupplierListItem>((row: SupplierQueryRow) => ({
      id: toNumber(row.id),
      nome: row.nome,
      contato1: row.contato1,
      contato2: row.contato2,
      email: row.email,
      totalEntradas: toNumber(row.total_entradas),
      volumeAnual: toNumber(row.volume_anual)
    }))
  };
}

async function getAllSuppliersOptions() {
  const rows = await query<SupplierQueryRow>(
    `
      SELECT
        f.id,
        f.nome,
        f.contato1,
        f.contato2,
        f.email,
        0 AS total_entradas,
        0 AS volume_anual
      FROM fornecedores f
      ORDER BY f.nome ASC
    `
  );

  return rows.map<SupplierOption>((row: SupplierQueryRow) => ({
    id: toNumber(row.id),
    nome: row.nome
  }));
}

export async function getProductDetailsData(
  codigoProduto: string
): Promise<ProductDetailsData> {
  if (!isDatabaseConfigured()) {
    return {
      databaseReady: false,
      product: null,
      entriesLast90Days: [],
      exitsLast90Days: [],
      suppliersLastYear: [],
      movementSeries: [],
      availableSuppliers: []
    };
  }

  const productRows = await query<ProductQueryRow>(
    `
      SELECT
        p.id,
        p.codigo,
        p.nome,
        p.quantidade_por_unidade_compra,
        p.unidade_compra,
        p.estoque_minimo,
        p.estoque_atual,
        p.created_at::text,
        p.updated_at::text,
        (
          SELECT MAX(e.data_movimentacao)::text
          FROM entradas e
          WHERE e.produto_id = p.id
        ) AS ultima_entrada,
        (
          SELECT MAX(s.data_movimentacao)::text
          FROM saidas s
          WHERE s.produto_id = p.id
        ) AS ultima_saida
      FROM produtos p
      WHERE p.codigo = $1
      LIMIT 1
    `,
    [codigoProduto]
  );

  const [row] = productRows;

  if (!row) {
    return {
      databaseReady: true,
      product: null,
      entriesLast90Days: [],
      exitsLast90Days: [],
      suppliersLastYear: [],
      movementSeries: [],
      availableSuppliers: await getAllSuppliersOptions()
    };
  }

  const [product] = normalizeProducts([row]);
  const productId = toNumber(row.id);

  const [entryRows, exitRows, supplierRows, movementRows, supplierOptions] =
    await Promise.all([
      query<EntryQueryRow>(
        `
          SELECT
            e.id,
            p.codigo AS codigo_produto,
            e.data_movimentacao::text AS data,
            f.id AS fornecedor_id,
            f.nome AS fornecedor_nome,
            e.quantidade,
            e.valor_unitario,
            (e.quantidade * e.valor_unitario) AS valor_total,
            e.observacao
          FROM entradas e
          INNER JOIN produtos p ON p.id = e.produto_id
          INNER JOIN fornecedores f ON f.id = e.fornecedor_id
          WHERE e.produto_id = $1
            AND e.data_movimentacao >= CURRENT_DATE - INTERVAL '90 days'
          ORDER BY e.data_movimentacao DESC, e.id DESC
        `,
        [productId]
      ),
      query<ExitQueryRow>(
        `
          SELECT
            s.id,
            p.codigo AS codigo_produto,
            s.data_movimentacao::text AS data,
            s.quantidade,
            s.observacao
          FROM saidas s
          INNER JOIN produtos p ON p.id = s.produto_id
          WHERE s.produto_id = $1
            AND s.data_movimentacao >= CURRENT_DATE - INTERVAL '90 days'
          ORDER BY s.data_movimentacao DESC, s.id DESC
        `,
        [productId]
      ),
      query<SupplierRankingRow>(
        `
          SELECT
            f.id,
            f.nome,
            SUM(e.quantidade) AS total_quantidade,
            COUNT(*) AS total_entradas,
            MAX(e.data_movimentacao)::text AS ultima_entrega
          FROM entradas e
          INNER JOIN fornecedores f ON f.id = e.fornecedor_id
          WHERE e.produto_id = $1
            AND e.data_movimentacao >= CURRENT_DATE - INTERVAL '365 days'
          GROUP BY f.id, f.nome
          ORDER BY total_quantidade DESC, total_entradas DESC, f.nome ASC
        `,
        [productId]
      ),
      query<DailyMovementRow>(
        `
          SELECT
            TO_CHAR(days.day, 'YYYY-MM-DD') AS day,
            COALESCE(entries.total_entradas, 0) AS entradas,
            COALESCE(exits.total_saidas, 0) AS saidas
          FROM generate_series(
            CURRENT_DATE - INTERVAL '89 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          ) AS days(day)
          LEFT JOIN (
            SELECT
              data_movimentacao,
              SUM(quantidade) AS total_entradas
            FROM entradas
            WHERE produto_id = $1
              AND data_movimentacao >= CURRENT_DATE - INTERVAL '89 days'
            GROUP BY data_movimentacao
          ) AS entries
            ON entries.data_movimentacao = days.day::date
          LEFT JOIN (
            SELECT
              data_movimentacao,
              SUM(quantidade) AS total_saidas
            FROM saidas
            WHERE produto_id = $1
              AND data_movimentacao >= CURRENT_DATE - INTERVAL '89 days'
            GROUP BY data_movimentacao
          ) AS exits
            ON exits.data_movimentacao = days.day::date
          ORDER BY days.day ASC
        `,
        [productId]
      ),
      getAllSuppliersOptions()
    ]);

  return {
    databaseReady: true,
    product,
    entriesLast90Days: entryRows.map<EntryRecord>((item: EntryQueryRow) => ({
      id: toNumber(item.id),
      codigoProduto: item.codigo_produto,
      data: item.data,
      fornecedorId: toNumber(item.fornecedor_id),
      fornecedorNome: item.fornecedor_nome,
      quantidade: toNumber(item.quantidade),
      valorUnitario: toNumber(item.valor_unitario),
      valorTotal: toNumber(item.valor_total),
      observacao: item.observacao
    })),
    exitsLast90Days: exitRows.map<ExitRecord>((item: ExitQueryRow) => ({
      id: toNumber(item.id),
      codigoProduto: item.codigo_produto,
      data: item.data,
      quantidade: toNumber(item.quantidade),
      observacao: item.observacao
    })),
    suppliersLastYear: supplierRows.map<ProductSupplierRankingItem>((item: SupplierRankingRow) => ({
      id: toNumber(item.id),
      nome: item.nome,
      totalQuantidade: toNumber(item.total_quantidade),
      totalEntradas: toNumber(item.total_entradas),
      ultimaEntrega: item.ultima_entrega ?? null
    })),
    movementSeries: mapDailyMovement(movementRows),
    availableSuppliers: supplierOptions
  };
}

async function findProductIdByCode(client: PoolClient, codigo: string) {
  const result = await client.query<ProductIdRow>(
    `
      SELECT id, codigo
      FROM produtos
      WHERE codigo = $1
      LIMIT 1
    `,
    [codigo]
  );

  const [product] = result.rows;

  if (!product) {
    throw new Error('Produto não encontrado para o código informado.');
  }

  return toNumber(product.id);
}

export async function createProduct(payload: unknown) {
  const input = productInputSchema.parse(payload);

  const rows = await query<{ id: NumericValue; codigo: string }>(
    `
      INSERT INTO produtos (
        codigo,
        nome,
        quantidade_por_unidade_compra,
        unidade_compra,
        estoque_minimo,
        estoque_atual
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, codigo
    `,
    [
      input.codigo,
      input.nome,
      input.quantidadePorUnidadeCompra,
      input.unidadeCompra,
      input.estoqueMinimo,
      input.estoqueInicial
    ]
  );

  return {
    id: toNumber(rows[0]?.id),
    codigo: rows[0]?.codigo
  };
}

export async function createSupplier(payload: unknown) {
  const input = supplierInputSchema.parse(payload);

  const rows = await query<{ id: NumericValue; nome: string }>(
    `
      INSERT INTO fornecedores (
        nome,
        contato1,
        contato2,
        email
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome
    `,
    [input.nome, input.contato1, input.contato2 ?? null, input.email ?? null]
  );

  return {
    id: toNumber(rows[0]?.id),
    nome: rows[0]?.nome
  };
}

export async function createEntry(payload: unknown) {
  const input = entryInputSchema.parse(payload);

  return withTransaction(async (client) => {
    const productId = await findProductIdByCode(client, input.codigoProduto);
    const result = await client.query<{ id: NumericValue }>(
      `
        INSERT INTO entradas (
          produto_id,
          fornecedor_id,
          data_movimentacao,
          quantidade,
          valor_unitario,
          observacao
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        productId,
        input.fornecedorId,
        input.data,
        input.quantidade,
        input.valorUnitario,
        input.observacao ?? null
      ]
    );

    return {
      id: toNumber(result.rows[0]?.id)
    };
  });
}

export async function createExit(payload: unknown) {
  const input = exitInputSchema.parse(payload);

  return withTransaction(async (client) => {
    const productId = await findProductIdByCode(client, input.codigoProduto);
    const result = await client.query<{ id: NumericValue }>(
      `
        INSERT INTO saidas (
          produto_id,
          data_movimentacao,
          quantidade,
          observacao
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [productId, input.data, input.quantidade, input.observacao ?? null]
    );

    return {
      id: toNumber(result.rows[0]?.id)
    };
  });
}

export function getFriendlyError(error: unknown) {
  if (typeof error === 'object' && error && 'issues' in error) {
    const zodError = error as {
      issues?: Array<{
        message: string;
      }>;
    };

    return zodError.issues?.[0]?.message ?? 'Dados inválidos.';
  }

  if (typeof error === 'object' && error && 'code' in error) {
    const databaseError = error as {
      code?: string;
      message?: string;
    };

    if (databaseError.code === '23505') {
      return 'Já existe um registro com este identificador único.';
    }

    if (databaseError.code === '23503') {
      return 'Não foi possível relacionar o registro informado. Revise produto e fornecedor.';
    }

    if (databaseError.code === 'P0001') {
      return databaseError.message ?? 'Regra de negócio do estoque não permitiu a operação.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocorreu um erro inesperado.';
}

export function summarizeProductBalance(product: ProductWithPriority) {
  return `${formatQuantity(product.estoqueAtual)} em estoque, mínimo ${formatQuantity(
    product.estoqueMinimo
  )}.`;
}

export function summarizeFinancialImpact(entries: EntryRecord[]) {
  const total = entries.reduce((sum, item) => sum + item.valorTotal, 0);
  return formatCurrency(total);
}
