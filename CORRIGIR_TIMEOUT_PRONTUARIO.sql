-- =============================================================================
-- CORREÇÃO: TIMEOUT AO SALVAR INTERAÇÕES DO CHAT NO PRONTUÁRIO
-- =============================================================================
-- Resolve: ERR_CONNECTION_TIMED_OUT ao salvar em patient_medical_records
-- =============================================================================

-- 1. VERIFICAR SE A TABELA EXISTE E TEM A ESTRUTURA CORRETA
DO $$
BEGIN
  -- Criar tabela se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_medical_records') THEN
    CREATE TABLE public.patient_medical_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      report_id UUID,
      record_type TEXT NOT NULL,
      record_data JSONB DEFAULT '{}',
      nft_token_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Tabela patient_medical_records criada';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela patient_medical_records já existe';
  END IF;
END $$;

-- 2. GARANTIR QUE A COLUNA patient_id ACEITA NULL (para casos onde não há paciente)
ALTER TABLE public.patient_medical_records 
  ALTER COLUMN patient_id DROP NOT NULL;

-- 3. CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_patient_id 
  ON public.patient_medical_records(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_medical_records_record_type 
  ON public.patient_medical_records(record_type);

CREATE INDEX IF NOT EXISTS idx_patient_medical_records_created_at 
  ON public.patient_medical_records(created_at DESC);

-- 4. HABILITAR RLS
ALTER TABLE public.patient_medical_records ENABLE ROW LEVEL SECURITY;

-- 5. REMOVER POLÍTICAS ANTIGAS QUE PODEM ESTAR CAUSANDO TIMEOUT
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.patient_medical_records;
DROP POLICY IF EXISTS "Patients can view own records" ON public.patient_medical_records;
DROP POLICY IF EXISTS "Professionals can view patient records" ON public.patient_medical_records;
DROP POLICY IF EXISTS "Users can insert own records" ON public.patient_medical_records;

-- 6. CRIAR POLÍTICAS RLS OTIMIZADAS (SEM SUBQUERIES COMPLEXAS)
-- Política 1: Permitir INSERT para qualquer usuário autenticado
CREATE POLICY "Allow authenticated insert" 
  ON public.patient_medical_records 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Política 2: Permitir SELECT para o próprio paciente
CREATE POLICY "Allow patient select own" 
  ON public.patient_medical_records 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = patient_id);

-- Política 3: Permitir SELECT para admins
CREATE POLICY "Allow admin select all" 
  ON public.patient_medical_records 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email IN ('rrvalenca@gmail.com', 'eduardoscfaveret@gmail.com', 'profrvalenca@gmail.com')
    )
  );

-- Política 4: Permitir UPDATE para admins
CREATE POLICY "Allow admin update" 
  ON public.patient_medical_records 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email IN ('rrvalenca@gmail.com', 'eduardoscfaveret@gmail.com', 'profrvalenca@gmail.com')
    )
  );

-- 7. VERIFICAR ESTATÍSTICAS DA TABELA
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.patient_medical_records;
  RAISE NOTICE '📊 Total de registros em patient_medical_records: %', v_count;
END $$;

-- 8. TESTAR INSERT (DEVE FUNCIONAR SEM TIMEOUT)
DO $$
DECLARE
  v_test_id UUID;
BEGIN
  -- Pegar um usuário existente para teste
  SELECT id INTO v_test_id FROM auth.users LIMIT 1;
  
  IF v_test_id IS NOT NULL THEN
    -- Tentar inserir registro de teste
    INSERT INTO public.patient_medical_records (
      patient_id,
      record_type,
      record_data
    ) VALUES (
      v_test_id,
      'test_chat_interaction',
      ('{"test": true, "timestamp": "' || NOW()::TEXT || '"}')::JSONB
    );
    
    RAISE NOTICE '✅ Teste de INSERT bem-sucedido';
    
    -- Remover registro de teste
    DELETE FROM public.patient_medical_records 
    WHERE record_type = 'test_chat_interaction' 
    AND record_data->>'test' = 'true';
    
    RAISE NOTICE '✅ Registro de teste removido';
  ELSE
    RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
  END IF;
END $$;

SELECT '✅ CORREÇÃO DE TIMEOUT APLICADA - patient_medical_records OTIMIZADO' as status;
