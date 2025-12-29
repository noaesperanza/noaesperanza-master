-- Atualizar senha do rrvalenca@gmail.com para newpassword123
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'rrvalenca@gmail.com';

-- Verificar atualização
SELECT
  id,
  email,
  raw_user_meta_data->>'type' as user_type,
  raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email = 'rrvalenca@gmail.com';