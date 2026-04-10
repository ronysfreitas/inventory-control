import { z } from 'zod';

const numericInput = z.coerce
  .number({
    message: 'Informe um numero valido.'
  })
  .refine((value) => Number.isFinite(value), {
    message: 'Informe um numero valido.'
  });

const emailInput = z
  .string()
  .trim()
  .toLowerCase()
  .max(180, 'O e-mail deve ter no maximo 180 caracteres.')
  .refine((value) => z.email().safeParse(value).success, {
    message: 'Informe um e-mail valido.'
  });

const productBaseSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'Informe o codigo do produto.')
    .max(60, 'O codigo deve ter no maximo 60 caracteres.')
    .transform((value) => value.toUpperCase()),
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome do produto.')
    .max(180, 'O nome deve ter no maximo 180 caracteres.'),
  unidadeCompra: z
    .string()
    .trim()
    .min(1, 'Informe a unidade de compra.')
    .max(40, 'A unidade de compra deve ter no maximo 40 caracteres.'),
  estoqueMinimo: numericInput.nonnegative(
    'O estoque minimo nao pode ser negativo.'
  ),
  estoqueRegular: numericInput.nonnegative(
    'O estoque regular nao pode ser negativo.'
  ),
  estoqueInicial: numericInput.nonnegative(
    'O estoque inicial nao pode ser negativo.'
  )
});

function validateRegularStock(
  value: { estoqueMinimo: number; estoqueRegular: number },
  context: z.RefinementCtx
) {
  if (value.estoqueRegular < value.estoqueMinimo) {
    context.addIssue({
      code: 'custom',
      path: ['estoqueRegular'],
      message: 'O estoque regular deve ser maior ou igual ao estoque minimo.'
    });
  }
}

export const productInputSchema = productBaseSchema.superRefine(validateRegularStock);

export const productUpdateSchema = productBaseSchema
  .omit({
    estoqueInicial: true
  })
  .superRefine(validateRegularStock);

export const supplierInputSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome do fornecedor.')
    .max(180, 'O nome deve ter no maximo 180 caracteres.'),
  contato1: z
    .string()
    .trim()
    .max(120, 'O contato principal deve ter no maximo 120 caracteres.')
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  contato2: z
    .string()
    .trim()
    .max(120, 'O contato secundario deve ter no maximo 120 caracteres.')
    .optional()
    .transform((value) => value || undefined),
  email: z
    .union([emailInput, z.literal('')])
    .optional()
    .transform((value) => value || undefined)
});

export const entryInputSchema = z.object({
  codigoProduto: z
    .string()
    .trim()
    .min(1, 'Informe o codigo do produto.')
    .max(60)
    .transform((value) => value.toUpperCase()),
  data: z.string().trim().min(1, 'Informe a data da entrada.'),
  fornecedorId: z.coerce
    .number({
      message: 'Selecione um fornecedor.'
    })
    .int('Selecione um fornecedor valido.')
    .positive('Selecione um fornecedor valido.'),
  quantidade: numericInput.positive(
    'A quantidade da entrada deve ser maior que zero.'
  ),
  valorUnitario: numericInput.nonnegative(
    'O valor unitario nao pode ser negativo.'
  ),
  observacao: z
    .string()
    .trim()
    .max(300, 'A observacao deve ter no maximo 300 caracteres.')
    .optional()
    .transform((value) => value || undefined)
});

export const exitInputSchema = z.object({
  codigoProduto: z
    .string()
    .trim()
    .min(1, 'Informe o codigo do produto.')
    .max(60)
    .transform((value) => value.toUpperCase()),
  data: z.string().trim().min(1, 'Informe a data da saida.'),
  quantidade: numericInput.positive(
    'A quantidade da saida deve ser maior que zero.'
  ),
  observacao: z
    .string()
    .trim()
    .max(300, 'A observacao deve ter no maximo 300 caracteres.')
    .optional()
    .transform((value) => value || undefined)
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type SupplierInput = z.infer<typeof supplierInputSchema>;
export type EntryInput = z.infer<typeof entryInputSchema>;
export type ExitInput = z.infer<typeof exitInputSchema>;
