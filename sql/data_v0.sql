-- Génération manuelle d'UUIDs simples pour l'exemple
INSERT INTO `categories` (`id`, `code`, `name`, `description`) VALUES 
('cat-1', 'LECON', 'Cours & Apprentissage', 'Théorie générale des finances'),
('cat-2', 'TEXTE_LOI', 'Décrets & Réglementation', 'Textes de lois officiels pour sourcer l\'IA'),
('cat-3', 'SIGFP', 'Système sigFP', 'Manuels et procédures pour la gestion budgétaire'),
('cat-4', 'SIGMP', 'Système sigMP', 'Procédures de passation des marchés publics');

-- Insertion d'une sous-catégorie pour sigFP (la régie d'avances)
INSERT INTO `categories` (`id`, `code`, `name`, `description`, `parent_id`) VALUES 
('sub-cat-1', 'REGIE_AVANCE', 'Régies d\'avances', 'Gestion, plafonds et pièces justificatives des régies', 'cat-3');