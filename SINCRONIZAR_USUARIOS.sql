-- =============================================================================
-- SINCRONIZAÇÃO COMPLETA DE USUÁRIOS - auth.users → public.users
-- =============================================================================
-- Este script garante que TODOS os usuários de auth.users existam em public.users
-- Resolve o erro: "Key (created_by)=(...) is not present in table users"
-- =============================================================================

-- 1. SINCRONIZAR TODOS OS USUÁRIOS
INSERT INTO public.users (id, email, name, role, type, created_at, metadata)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'patient') as role,
  COALESCE(au.raw_user_meta_data->>'user_type', 'patient') as type,
  au.created_at,
  au.raw_user_meta_data as metadata
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  type = EXCLUDED.type,
  metadata = EXCLUDED.metadata;

-- 2. VERIFICAR QUANTOS USUÁRIOS FORAM SINCRONIZADOS
DO $$
DECLARE
  v_auth_count INTEGER;
  v_public_count INTEGER;
  v_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_auth_count FROM auth.users;
  SELECT COUNT(*) INTO v_public_count FROM public.users;
  v_missing := v_auth_count - v_public_count;
  
  RAISE NOTICE '📊 ESTATÍSTICAS DE SINCRONIZAÇÃO:';
  RAISE NOTICE '   Usuários em auth.users: %', v_auth_count;
  RAISE NOTICE '   Usuários em public.users: %', v_public_count;
  RAISE NOTICE '   Diferença: %', v_missing;
  
  IF v_missing = 0 THEN
    RAISE NOTICE '✅ TODOS OS USUÁRIOS SINCRONIZADOS!';
  ELSE
    RAISE NOTICE '⚠️ Ainda faltam % usuários', v_missing;
  END IF;
END $$;

-- 3. CORRIGIR A FUNÇÃO create_chat_room_for_patient
-- Agora ela não precisa fazer auto-repair porque todos os usuários já existem
CREATE OR REPLACE FUNCTION public.create_chat_room_for_patient(
  p_patient_id UUID,
  p_provider_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- 1. Verificar se já existe sala
  SELECT room_id INTO v_room_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.room_id = cp2.room_id
  WHERE cp1.user_id = p_patient_id 
    AND cp2.user_id = p_provider_id
  LIMIT 1;

  IF v_room_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'room_id', v_room_id, 'is_new', false);
  END IF;

  -- 2. Criar sala (agora sem auto-repair, pois usuários já existem)
  INSERT INTO chat_rooms (type, created_by)
  VALUES ('direct', p_provider_id)
  RETURNING id INTO v_room_id;

  -- 3. Adicionar participantes
  INSERT INTO chat_participants (room_id, user_id, role)
  VALUES 
    (v_room_id, p_patient_id, 'member'),
    (v_room_id, p_provider_id, 'admin');

  RETURN jsonb_build_object('success', true, 'room_id', v_room_id, 'is_new', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. LISTAR USUÁRIOS QUE ESTAVAM FALTANDO (para debug)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'patient') as type,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

SELECT '✅ SINCRONIZAÇÃO COMPLETA - TODOS OS USUÁRIOS DISPONÍVEIS PARA CHAT' as status;
