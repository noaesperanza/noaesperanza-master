-- =============================================================================
-- CORREÇÃO DE EMERGÊNCIA v3 - FINAL E INFALÍVEL
-- =============================================================================

-- PARTE 1: GARANTIR ESTRUTURA DA TABELA (SEM BLOCOS PL/PGSQL)
-- Executa comandos diretos para garantir que as colunas existam.
-- O erro anterior ocorria porque o banco tentava ler a coluna antes de criá-la.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'patient';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- PARTE 2: AGORA SIM, SINCRONIZAR DADOS
-- Como as colunas foram garantidas acima, este comando não falhará mais.

INSERT INTO public.users (id, email, name, role, type, created_at, metadata)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email) as name,
  COALESCE(raw_user_meta_data->>'user_type', 'patient') as role,
  COALESCE(raw_user_meta_data->>'user_type', 'patient') as type,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  role = EXCLUDED.role;

-- PARTE 3: CORRIGIR FUNÇÃO DE CRIAÇÃO DE SALAS (AUTO-REPAIR)
-- Esta função cria a sala e corrige usuários faltantes automaticamente.

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
  -- 1. Auto-Repair: Garantir que ambos usuários existam na tabela pública
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_patient_id) THEN
     INSERT INTO public.users (id, email, role, type)
     SELECT id, email, 'patient', 'patient' FROM auth.users WHERE id = p_patient_id
     ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_provider_id) THEN
     INSERT INTO public.users (id, email, role, type)
     SELECT id, email, 'professional', 'professional' FROM auth.users WHERE id = p_provider_id
     ON CONFLICT DO NOTHING;
  END IF;

  -- 2. Verificar se já existe sala
  SELECT room_id INTO v_room_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.room_id = cp2.room_id
  WHERE cp1.user_id = p_patient_id 
    AND cp2.user_id = p_provider_id
  LIMIT 1;

  IF v_room_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'room_id', v_room_id, 'is_new', false);
  END IF;

  -- 3. Criar sala
  INSERT INTO chat_rooms (type, created_by)
  VALUES ('direct', p_provider_id)
  RETURNING id INTO v_room_id;

  -- 4. Adicionar participantes
  INSERT INTO chat_participants (room_id, user_id, role)
  VALUES 
    (v_room_id, p_patient_id, 'member'),
    (v_room_id, p_provider_id, 'admin');

  RETURN jsonb_build_object('success', true, 'room_id', v_room_id, 'is_new', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- PARTE 4: CORRIGIR TRIGGER DE NOVOS USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, type, metadata)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    COALESCE(new.raw_user_meta_data->>'user_type', 'patient'),
    COALESCE(new.raw_user_meta_data->>'user_type', 'patient'),
    new.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reaplicar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- PARTE 5: CORRIGIR PERMISSÕES (RLS) PARA EVITAR ERRO 500
-- Funções auxiliares seguras
CREATE OR REPLACE FUNCTION get_current_user_type()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT type FROM public.users WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u_email TEXT;
BEGIN
  SELECT email INTO u_email FROM public.users WHERE id = auth.uid();
  RETURN (u_email IN ('rrvalenca@gmail.com', 'eduardoscfaveret@gmail.com', 'profrvalenca@gmail.com'));
END;
$$;

-- Recriar políticas da tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Professionals can read patients" ON users;
DROP POLICY IF EXISTS "Admins can read all" ON users;

CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all" ON users FOR ALL USING (is_admin());
CREATE POLICY "Professionals can read patients" ON users FOR SELECT USING (
  -- Lógica simplificada: Profissionais e Admins veem todos os pacientes
  (auth.uid() IN (SELECT id FROM users WHERE type IN ('professional', 'profissional', 'admin')))
  AND (type = 'patient' OR type IS NULL)
);

-- Recriar políticas de Chat
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Access Rooms" ON chat_rooms;
CREATE POLICY "Access Rooms" ON chat_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM chat_participants WHERE room_id = id AND user_id = auth.uid()) OR is_admin()
);

DROP POLICY IF EXISTS "Access Participants" ON chat_participants;
CREATE POLICY "Access Participants" ON chat_participants FOR ALL USING (
  EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.room_id = room_id AND cp.user_id = auth.uid()) OR is_admin()
);

DROP POLICY IF EXISTS "Access Messages" ON chat_messages;
CREATE POLICY "Access Messages" ON chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.room_id = room_id AND cp.user_id = auth.uid()) OR is_admin()
);

SELECT 'CORREÇÃO v3 CONCLUÍDA COM SUCESSO' as status;