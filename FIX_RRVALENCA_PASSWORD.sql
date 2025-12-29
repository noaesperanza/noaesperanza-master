-- Atualizar senha do rrvalenca@gmail.com
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'rrvalenca@gmail.com';

-- Verificar se foi atualizado
SELECT id, email, raw_user_meta_data->>'type' as type, raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email = 'rrvalenca@gmail.com';