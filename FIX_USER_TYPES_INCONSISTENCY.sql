-- Fix inconsistency in user types
-- Update user_type to match type for Ricardo's accounts

-- For profrvalenca@gmail.com and rrvlenca@gmail.com, set user_type to admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{user_type}',
    '"admin"'
)
WHERE email IN ('profrvalenca@gmail.com', 'rrvlenca@gmail.com');

-- For rregovasconcelos@gmail.com, ensure user_type is patient
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{user_type}',
    '"patient"'
)
WHERE email = 'rregovasconcelos@gmail.com';

-- Verify all users
SELECT id, email, raw_user_meta_data->>'type' as type, raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email IN ('profrvalenca@gmail.com', 'rrvlenca@gmail.com', 'rrvalenca@gmail.com', 'rregovasconcelos@gmail.com');