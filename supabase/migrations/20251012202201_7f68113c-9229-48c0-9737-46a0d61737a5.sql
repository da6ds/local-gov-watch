-- Clean up duplicate 2024 Austin legislation data
-- Keep only the 2025 versions to show current data

-- Delete the 2024 duplicate ordinances (keeping 2025 versions)
DELETE FROM legislation
WHERE jurisdiction_id = '1e42532f-a7f2-44cc-ba2b-59422c79d47f'
  AND external_id IN (
    'ORD-2024-001',
    'ORD-2024-002', 
    'ORD-2024-003',
    'ORD-2024-004',
    'ORD-2024-005'
  );

-- Delete old January 2024 ordinance
DELETE FROM legislation
WHERE jurisdiction_id = '1e42532f-a7f2-44cc-ba2b-59422c79d47f'
  AND external_id = 'C20-2024-017';

-- Delete items with NULL external_id from 2024
DELETE FROM legislation
WHERE jurisdiction_id = '1e42532f-a7f2-44cc-ba2b-59422c79d47f'
  AND external_id IS NULL
  AND introduced_at < '2025-01-01';