-- 1. Création des utilisateurs

-- Un administrateur qui peut tout gérer
INSERT INTO `users` (`id`, `email`, `name`, `role`) VALUES
('d290f1ee-6c54-4b01-90e6-d701748f0851', 'admin@fisc.doc', 'Super Admin', 'ADMIN');

-- Un client API qui représente une application externe
INSERT INTO `users` (`id`, `email`, `name`, `role`) VALUES
('a1b2c3d4-e5f6-4890-a234-567890abcdef', 'client@frontend-1.com', 'Front-End 1', 'API_CLIENT');

INSERT INTO `api_keys` (`id`, `name`, `public_key`, `hashed_secret`, `user_id`) VALUES
('c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f', 'Clé pour Front-End 1', 'fpk_frontend_a1b2c3d4e5f6789012', '$2b$10$Gd82o6Qecz2dLAEJe6If3.pLJdF/SH6Zqx3mq4AUpQQkAUAFftPzi', 'a1b2c3d4-e5f6-7890-1234-567890abcdef');

-- Note : Les `hashed_secret` ci-dessus sont des exemples. Mila migenerer nentsika tsika , dia mampiasa bcrypt
-- Le premier hash correspond à 'admin-secret-CHANGE-ME'
-- Le second hash correspond à 'frontend-secret-CHANGE-ME'





INSERT INTO `categories` (`id`, `code`, `name`, `description`) VALUES 
('cat-1', 'LECON', 'Cours & Apprentissage', 'Théorie générale'),
('cat-2', 'TEXTE_LOI', 'Décrets & Réglementation', 'Textes de lois officiels pour sourcer l\'IA'),
('cat-3', 'SIGFP', 'Système sigFP', 'Manuels et les procédures avec SIIGFP'),
('cat-4', 'SIGMP', 'Système sigMP', 'les procédures de SIGMP');

-- Insertion d'une sous-catégorie pour sigFP (la régie d'avances)
INSERT INTO `categories` (`id`, `code`, `name`, `description`, `parent_id`) VALUES 
('sub-cat-1', 'REGIE_AVANCE', 'Régies d\'avances', 'Gestion, plafonds et pièces justificatives des régies', 'cat-3');