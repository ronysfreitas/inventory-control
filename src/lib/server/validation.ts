import { z } from 'zod';

const numericInput = z.coerce
  .number({
    message: 'Informe um número válido.'
  })
  .refine((value) => Number.isFinite(value), {
    message: 'Informe um número válido.'
  });

export const productInputSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'Informe o código do produto.')
    .max(60, 'O código deve ter no máximo 60 caracteres.')
    .transform((value) => value.toUpperCase()),
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome do produto.')
    .max(180, 'O nome deve ter no máximo 180 caracteres.'),
  unidadeCompra: z
    .string()
    .trim()
    .min(1, 'Informe a unidade de compra.')
    .max(40, 'A unidade de compra deve ter no máximo 40 caracteres.'),
  estoqueMinimo: numericInput.nonnegative(
    'O estoque mínimo não pode ser negativo.'
  ),
  estoqueInicial: numericInput.nonnegative(
    'O estoque inicial não pode ser negativo.'
  )
});

export const supplierInputSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome do fornecedor.')
    .max(180, 'O nome deve ter no máximo 180 caracteres.'),
  contato1: z
    .string()
    .trim()
    .min(3, 'Informe o contato principal.')
    .max(120, 'O contato principal deve ter no máximo 120 caracteres.'),
  contato2: z
    .string()
    .trim()
    .max(120, 'O contato secundário deve ter no máximo 120 caracteres.')
    .optional()
    .transform((value) => value || undefined),
  email: z
    .email('Informe um e-mail válido.')
    .max(180, 'O e-mail deve ter no máximo 180 caracteres.')
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)
});

export const entryInputSchema = z.object({
  codigoProduto: z
    .string()
    .trim()
    .min(1, 'Informe o código do produto.')
    .max(60)
    .transform((value) => value.toUpperCase()),
  data: z.string().trim().min(1, 'Informe a data da entrada.'),
  fornecedorId: z.coerce
    .number({
      message: 'Selecione um fornecedor.'
    })
    .int('Selecione um fornecedor válido.')
    .positive('Selecione um fornecedor válido.'),
  quantidade: numericInput.positive(
    'A quantidade da entrada deve ser maior que zero.'
  ),
  valorUnitario: numericInput.nonnegative(
    'O valor unitário não pode ser negativo.'
  ),
  observacao: z
    .string()
    .trim()
    .max(300, 'A observação deve ter no máximo 300 caracteres.')
    .optional()
    .transform((value) => value || undefined)
});

export const exitInputSchema = z.object({
  codigoProduto: z
    .string()
    .trim()
    .min(1, 'Informe o código do produto.')
    .max(60)
    .transform((value) => value.toUpperCase()),
  data: z.string().trim().min(1, 'Informe a data da saída.'),
  quantidade: numericInput.positive(
    'A quantidade da saída deve ser maior que zero.'
  ),
  observacao: z
    .string()
    .trim()
    .max(300, 'A observação deve ter no máximo 300 caracteres.')
    .optional()
    .transform((value) => value || undefined)
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type SupplierInput = z.infer<typeof supplierInputSchema>;
export type EntryInput = z.infer<typeof entryInputSchema>;
export type ExitInput = z.infer<typeof exitInputSchema>;
