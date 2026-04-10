CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS produtos (
  id BIGSERIAL PRIMARY KEY,
  codigo CITEXT NOT NULL UNIQUE,
  nome VARCHAR(180) NOT NULL,
  quantidade_por_unidade_compra NUMERIC(12, 2) NOT NULL CHECK (quantidade_por_unidade_compra > 0),
  unidade_compra VARCHAR(40) NOT NULL,
  estoque_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  estoque_atual NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (estoque_atual >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id BIGSERIAL PRIMARY KEY,
  nome CITEXT NOT NULL,
  contato1 VARCHAR(120) NOT NULL,
  contato2 VARCHAR(120),
  email CITEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fornecedores_email_chk CHECK (
    email IS NULL OR POSITION('@' IN email) > 1
  )
);

CREATE TABLE IF NOT EXISTS entradas (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  fornecedor_id BIGINT NOT NULL REFERENCES fornecedores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  data_movimentacao DATE NOT NULL,
  quantidade NUMERIC(12, 2) NOT NULL CHECK (quantidade > 0),
  valor_unitario NUMERIC(12, 2) NOT NULL CHECK (valor_unitario >= 0),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saidas (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  data_movimentacao DATE NOT NULL,
  quantidade NUMERIC(12, 2) NOT NULL CHECK (quantidade > 0),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos (codigo);
CREATE INDEX IF NOT EXISTS idx_entradas_produto_data ON entradas (produto_id, data_movimentacao DESC);
CREATE INDEX IF NOT EXISTS idx_entradas_fornecedor_data ON entradas (fornecedor_id, data_movimentacao DESC);
CREATE INDEX IF NOT EXISTS idx_saidas_produto_data ON saidas (produto_id, data_movimentacao DESC);

DROP TRIGGER IF EXISTS trg_produtos_touch_updated_at ON produtos;
CREATE TRIGGER trg_produtos_touch_updated_at
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_fornecedores_touch_updated_at ON fornecedores;
CREATE TRIGGER trg_fornecedores_touch_updated_at
BEFORE UPDATE ON fornecedores
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION aplicar_entrada_estoque()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE produtos
    SET estoque_atual = estoque_atual + NEW.quantidade
    WHERE id = NEW.produto_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.produto_id = OLD.produto_id THEN
      UPDATE produtos
      SET estoque_atual = estoque_atual + NEW.quantidade - OLD.quantidade
      WHERE id = NEW.produto_id;
    ELSE
      UPDATE produtos
      SET estoque_atual = estoque_atual - OLD.quantidade
      WHERE id = OLD.produto_id;

      UPDATE produtos
      SET estoque_atual = estoque_atual + NEW.quantidade
      WHERE id = NEW.produto_id;
    END IF;

    RETURN NEW;
  END IF;

  UPDATE produtos
  SET estoque_atual = estoque_atual - OLD.quantidade
  WHERE id = OLD.produto_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validar_saida_estoque()
RETURNS trigger AS $$
DECLARE
  saldo_disponivel NUMERIC(12, 2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT estoque_atual
    INTO saldo_disponivel
    FROM produtos
    WHERE id = NEW.produto_id
    FOR UPDATE;
  ELSE
    IF NEW.produto_id = OLD.produto_id THEN
      SELECT estoque_atual + OLD.quantidade
      INTO saldo_disponivel
      FROM produtos
      WHERE id = NEW.produto_id
      FOR UPDATE;
    ELSE
      SELECT estoque_atual
      INTO saldo_disponivel
      FROM produtos
      WHERE id = NEW.produto_id
      FOR UPDATE;
    END IF;
  END IF;

  IF saldo_disponivel IS NULL THEN
    RAISE EXCEPTION 'Produto informado para a saída não existe.';
  END IF;

  IF NEW.quantidade > saldo_disponivel THEN
    RAISE EXCEPTION 'Saldo insuficiente para registrar a saída. Disponível: %, solicitado: %.',
      saldo_disponivel,
      NEW.quantidade;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aplicar_saida_estoque()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE produtos
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.produto_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.produto_id = OLD.produto_id THEN
      UPDATE produtos
      SET estoque_atual = estoque_atual - NEW.quantidade + OLD.quantidade
      WHERE id = NEW.produto_id;
    ELSE
      UPDATE produtos
      SET estoque_atual = estoque_atual + OLD.quantidade
      WHERE id = OLD.produto_id;

      UPDATE produtos
      SET estoque_atual = estoque_atual - NEW.quantidade
      WHERE id = NEW.produto_id;
    END IF;

    RETURN NEW;
  END IF;

  UPDATE produtos
  SET estoque_atual = estoque_atual + OLD.quantidade
  WHERE id = OLD.produto_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aplicar_entrada_estoque ON entradas;
CREATE TRIGGER trg_aplicar_entrada_estoque
AFTER INSERT OR UPDATE OR DELETE ON entradas
FOR EACH ROW
EXECUTE FUNCTION aplicar_entrada_estoque();

DROP TRIGGER IF EXISTS trg_validar_saida_estoque ON saidas;
CREATE TRIGGER trg_validar_saida_estoque
BEFORE INSERT OR UPDATE ON saidas
FOR EACH ROW
EXECUTE FUNCTION validar_saida_estoque();

DROP TRIGGER IF EXISTS trg_aplicar_saida_estoque ON saidas;
CREATE TRIGGER trg_aplicar_saida_estoque
AFTER INSERT OR UPDATE OR DELETE ON saidas
FOR EACH ROW
EXECUTE FUNCTION aplicar_saida_estoque();

CREATE OR REPLACE VIEW vw_prioridade_compra AS
SELECT
  p.id,
  p.codigo,
  p.nome,
  p.quantidade_por_unidade_compra,
  p.unidade_compra,
  p.estoque_minimo,
  p.estoque_atual,
  CASE
    WHEN p.estoque_minimo <= 0 THEN 'Baixa'
    WHEN p.estoque_atual <= 0 THEN 'Crítica'
    WHEN p.estoque_atual < (p.estoque_minimo * 0.5) THEN 'Alta'
    WHEN p.estoque_atual < p.estoque_minimo THEN 'Moderada'
    ELSE 'Baixa'
  END AS prioridade_compra
FROM produtos p;
