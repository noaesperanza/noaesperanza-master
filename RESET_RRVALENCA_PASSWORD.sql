-- ATUALIZAR SENHA DO USUÁRIO rrvalenca@gmail.com PARA 123@456
-- Execute este comando no SQL Editor do Supabase Dashboard

UPDATE auth.users
SET encrypted_password = crypt('123@456', gen_salt('bf'))
WHERE email = 'rrvalenca@gmail.com';

-- Verificar se a atualização foi bem-sucedida
SELECT
  id,
  email,
  raw_user_meta_data->>'type' as user_type,
  raw_user_meta_data->>'name' as name,
  created_at
FROM auth.users
WHERE email = 'rrvalenca@gmail.com';