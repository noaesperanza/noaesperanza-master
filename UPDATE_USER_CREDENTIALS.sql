-- Script to update user credentials
-- For rrvalenca@gmail.com: set new password and ensure admin type
-- For rregovasconcelos@gmail.com: change to patient type

-- First, check current users
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email IN ('rrvalenca@gmail.com', 'rregovasconcelos@gmail.com');

-- Update password for rrvalenca@gmail.com (set to 'newpassword123' for testing)
-- Note: In production, use proper hashing
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'rrvalenca@gmail.com';

-- Ensure rrvalenca@gmail.com is admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    '"admin"'
)
WHERE email = 'rrvalenca@gmail.com';

-- Change rregovasconcelos@gmail.com to patient
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    '"patient"'
)
WHERE email = 'rregovasconcelos@gmail.com';

-- Verify changes
SELECT id, email, raw_user_meta_data->>'type' as user_type FROM auth.users WHERE email IN ('rrvalenca@gmail.com', 'rregovasconcelos@gmail.com');