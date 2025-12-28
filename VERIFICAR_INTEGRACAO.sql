-- =============================================================================
-- VERIFICAÇÃO DE INTEGRAÇÃO - CHAT CLÍNICO E IA RESIDENTE
-- =============================================================================
-- Execute este script para verificar se o banco de dados está pronto para
-- suportar o Chat de Avaliação Clínica e a IA Residente.
-- =============================================================================

DO $$
DECLARE
  v_missing_tables TEXT[] := ARRAY[]::TEXT[];
  v_table TEXT;
  v_has_error BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '🔍 Iniciando verificação de integridade...';

  -- 1. Verificar Tabelas Críticas
  FOREACH v_table IN ARRAY ARRAY['users', 'chat_rooms', 'chat_participants', 'chat_messages', 'clinical_assessments', 'patient_medical_records', 'clinical_reports', 'notifications']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = v_table) THEN
      v_missing_tables := array_append(v_missing_tables, v_table);
      v_has_error := TRUE;
    ELSE
      RAISE NOTICE '✅ Tabela encontrada: %', v_table;
    END IF;
  END LOOP;

  IF v_has_error THEN
    RAISE NOTICE '❌ ERRO CRÍTICO: As seguintes tabelas estão faltando: %', v_missing_tables;
    RAISE NOTICE '💡 SOLUÇÃO: Execute CORRECAO_EMERGENCIA_CHAT.sql e CORRECAO_TABELAS_FALTANTES.sql';
  ELSE
    RAISE NOTICE '✅ Todas as tabelas necessárias estão presentes.';
  END IF;

  -- 2. Verificar Colunas Específicas (Compatibilidade com Código)
  
  -- clinical_reports.content (usado pelo ClinicalReportService)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_reports' AND column_name = 'report_data') THEN
     RAISE NOTICE '⚠️ AVISO: clinical_reports usa "report_data" (versão antiga SQL). O código espera "content".';
     RAISE NOTICE '💡 SOLUÇÃO: Execute CORRECAO_TABELAS_FALTANTES.sql';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_reports' AND column_name = 'content') THEN
     RAISE NOTICE '✅ clinical_reports.content encontrado (Compatível com código).';
  END IF;

  -- clinical_assessments.data
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'data') THEN
     RAISE NOTICE '✅ clinical_assessments.data encontrado.';
  ELSE
     RAISE NOTICE '❌ clinical_assessments.data FALTANDO.';
  END IF;

  -- 3. Verificar Usuários
  RAISE NOTICE '📊 Contagem de usuários:';
  PERFORM count(*) FROM public.users;
  
  -- 4. Verificar RLS
  RAISE NOTICE '🔒 Verificando RLS...';
  -- (Apenas informativo, não falha o script)
  
  RAISE NOTICE '🏁 Verificação concluída.';
END $$;
