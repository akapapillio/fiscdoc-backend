-- =========================================================================
-- SCRIPT D'INSERTION (SEEDS) POUR LE DÉVELOPPEMENT
-- =========================================================================

-- 1. Création des utilisateurs

-- Un administrateur qui peut tout gérer
INSERT INTO `users` (`id`, `email`, `name`, `role`) VALUES
('d290f1ee-6c54-4b01-90e6-d701748f0851', 'admin@fisc.doc', 'Super Admin', 'ADMIN');

-- Un client API qui représente une application externe
INSERT INTO `users` (`id`, `email`, `name`, `role`) VALUES
('a1b2c3d4-e5f6-4890-a234-567890abcdef', 'client@frontend-1.com', 'Front-End 1', 'API_CLIENT');


-- 2. Création des clés d'API associées

-- Clé pour l'administrateur (pour ses propres scripts, etc.)
-- Secret en clair : admin-secret-CHANGE-ME
INSERT INTO `api_keys` (`id`, `name`, `public_key`, `hashed_secret`, `user_id`) VALUES
('a7b9a8f0-5d4f-4a3c-9d2a-8fbe1b2a3c4d', 'Clé Admin Dev', 'fpk_admin_d290f1ee6c544b0190e6d7', '$2b$10$w/FL.S.sRz4Wd2yJ.iUq.O/l.S3G/j5Y.Zz3.K/j.L/k.S/j.L/k', 'd290f1ee-6c54-4b01-90e6-d701748f0851');

-- Clé pour l'application "Front-End 1"
-- Secret en clair : frontend-secret-CHANGE-ME
INSERT INTO `api_keys` (`id`, `name`, `public_key`, `hashed_secret`, `user_id`) VALUES
('c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f', 'Clé pour Front-End 1', 'fpk_frontend_a1b2c3d4e5f6789012', '$2b$10$Gd82o6Qecz2dLAEJe6If3.pLJdF/SH6Zqx3mq4AUpQQkAUAFftPzi', 'a1b2c3d4-e5f6-7890-1234-567890abcdef');

-- Note : Les `hashed_secret` ci-dessus sont des exemples. Vous devez générer les vôtres.
-- Le premier hash correspond à 'admin-secret-CHANGE-ME'
-- Le second hash correspond à 'frontend-secret-CHANGE-ME'


UPDATE INTO `api_keys` (`id`, `name`, `public_key`, `hashed_secret`, `user_id`) VALUES
('c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f', 'Clé pour Front-End 1', 'fpk_frontend_a1b2c3d4e5f6789012', '$2b$10$Gd82o6Qecz2dLAEJe6If3.pLJdF/SH6Zqx3mq4AUpQQkAUAFftPzi', 'a1b2c3d4-e5f6-7890-1234-567890abcdef');


UPDATE `api_keys` 
SET 
  `name` = 'Clé pour Front-End 1', 
  `public_key` = 'fpk_frontend_a1b2c3d4e5f6789012', 
  `hashed_secret` = '$2b$10$Gd82o6Qecz2dLAEJe6If3.pLJdF/SH6Zqx3mq4AUpQQkAUAFftPzi', 
  `user_id` = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
WHERE `id` = 'c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f';


UPDATE `users`
SET
  `id` = 'a1b2c3d4-e5f6-7890-123-567890abcdef'
WHERE
`id` = 'a1b2c3d4-e5f6-7890-1234-567890abcdef' ; 

-- 1. Désactiver la vérification des clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Mettre à jour l'utilisateur avec le nouvel ID (36 caractères)
UPDATE users 
SET id = 'a1b2c3d4-e5f6-4890-a234-567890abcdef' 
WHERE id = 'a1b2c3d4-e5f6-7890-123-567890abcdef';

-- 3. Mettre à jour les tables liées pour conserver la cohérence
UPDATE api_keys 
SET user_id = 'a1b2c3d4-e5f6-4890-a234-567890abcdef' 
WHERE user_id = 'a1b2c3d4-e5f6-7890-123-567890abcdef';

UPDATE documents 
SET author_id = 'a1b2c3d4-e5f6-4890-a234-567890abcdef' 
WHERE author_id = 'a1b2c3d4-e5f6-7890-123-567890abcdef';

UPDATE audit_logs 
SET user_id = 'a1b2c3d4-e5f6-4890-a234-567890abcdef' 
WHERE user_id = 'a1b2c3d4-e5f6-7890-123-567890abcdef';

-- 4. Toujours réactiver la vérification !
SET FOREIGN_KEY_CHECKS = 1;