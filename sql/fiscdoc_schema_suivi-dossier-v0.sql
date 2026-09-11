-- ================================================================
-- SCHEMA COMPLET : SYSTEME DE SUIVI DE DOSSIERS (FiscDoc)
-- ================================================================
-- Structure :
--   PARTIE 1 : Rôles, permissions, employés (RBAC applicatif)
--   PARTIE 2 : Divisions et niveaux de visibilité
--   PARTIE 3 : Types de dossiers et dossiers (contenu flexible en JSON)
--   PARTIE 4 : Affectations des employés (division + rôle fonctionnel, historisé)
--   PARTIE 5 : Journal des mouvements de dossiers (historique, append-only)
--   PARTIE 6 : Jeu de données de départ
-- ================================================================


-- ================================================================
-- PARTIE 1 : ROLES, PERMISSIONS, EMPLOYES
-- (reprise de votre script d'origine, service_department retiré
--  car remplacé par la table employee_assignments en partie 4)
-- ================================================================

CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,          -- ex: 'ROLE_ADMIN', 'AGENT_ACCUEIL'
    `label` VARCHAR(100) NOT NULL,               -- ex: 'Administrateur', 'Agent d''accueil'
    `description` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `matricule` VARCHAR(50) UNIQUE NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rôles "système" globaux d'un employé (accès applicatif, pas lié à une division)
CREATE TABLE IF NOT EXISTS `employee_roles` (
    `employee_id` INT NOT NULL,
    `role_id` INT NOT NULL,
    PRIMARY KEY (`employee_id`, `role_id`),
    CONSTRAINT `fk_emp_roles_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_emp_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL UNIQUE,
    `label` VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role_id` INT NOT NULL,
    `permission_id` INT NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_role_perm_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_role_perm_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- PARTIE 2 : DIVISIONS ET NIVEAUX DE VISIBILITE
-- ================================================================

-- Niveaux : définissent la portée de déplacement d'un dossier
CREATE TABLE IF NOT EXISTS `division_levels` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,           -- ex: 'GENERAL', 'SECONDAIRE'
    `label` VARCHAR(100) NOT NULL,
    `sees_all` BOOLEAN NOT NULL DEFAULT FALSE,    -- si vrai, accès à toutes les divisions sans liste à maintenir
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `divisions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,           -- ex: 'ACCUEIL', 'SECRETARIAT', 'DIRECTION'
    `name` VARCHAR(150) NOT NULL,
    `level_id` INT NOT NULL,
    `parent_division_id` INT NULL,                -- hiérarchie/organigramme, optionnel
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_division_level` FOREIGN KEY (`level_id`) REFERENCES `division_levels` (`id`),
    CONSTRAINT `fk_division_parent` FOREIGN KEY (`parent_division_id`) REFERENCES `divisions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portée de visibilité : liste des divisions atteignables par un niveau
-- (utilisée uniquement si division_levels.sees_all = FALSE)
CREATE TABLE IF NOT EXISTS `division_visibility_scope` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `level_id` INT NOT NULL,
    `target_division_id` INT NOT NULL,
    CONSTRAINT `fk_scope_level` FOREIGN KEY (`level_id`) REFERENCES `division_levels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_scope_target` FOREIGN KEY (`target_division_id`) REFERENCES `divisions` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_scope` (`level_id`, `target_division_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exceptions ponctuelles : surchargent la règle du niveau pour un couple précis
-- de divisions, sans avoir à créer un niveau entier pour un cas isolé
CREATE TABLE IF NOT EXISTS `division_visibility_exceptions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `source_division_id` INT NOT NULL,
    `target_division_id` INT NOT NULL,
    `is_allowed` BOOLEAN NOT NULL,
    `reason` VARCHAR(255) NULL,
    CONSTRAINT `fk_exception_source` FOREIGN KEY (`source_division_id`) REFERENCES `divisions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_exception_target` FOREIGN KEY (`target_division_id`) REFERENCES `divisions` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_exception` (`source_division_id`, `target_division_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- PARTIE 3 : TYPES DE DOSSIERS ET DOSSIERS
-- ================================================================

-- Définit le schéma de champs attendu pour chaque type de dossier
CREATE TABLE IF NOT EXISTS `dossier_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,            -- ex: 'ACCUEIL', 'PLAINTE'
    `name` VARCHAR(150) NOT NULL,
    `fields_schema` JSON NOT NULL,                 -- liste des champs attendus (nom, type, obligatoire...)
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dossiers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reference_code` VARCHAR(50) NOT NULL UNIQUE,  -- référence interne lisible (ex: DOS-2026-00042)
    `dossier_type_id` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ouvert', -- ouvert / en_cours / cloture / rejete ...
    `current_division_id` INT NOT NULL,
    `created_by_employee_id` INT NOT NULL,
    `data` JSON NOT NULL,                          -- contenu métier variable, validé contre fields_schema
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_dossier_type` FOREIGN KEY (`dossier_type_id`) REFERENCES `dossier_types` (`id`),
    CONSTRAINT `fk_dossier_division` FOREIGN KEY (`current_division_id`) REFERENCES `divisions` (`id`),
    CONSTRAINT `fk_dossier_creator` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- PARTIE 4 : AFFECTATIONS (employé <-> division <-> rôle, historisé)
-- ================================================================
-- Remplace le champ "service_department" figé de la partie 1.
-- Un employé peut avoir plusieurs affectations actives simultanément
-- (multi-division) ; l'historique est conservé via date_end.

CREATE TABLE IF NOT EXISTS `employee_assignments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `division_id` INT NOT NULL,
    `role_id` INT NOT NULL,                        -- rôle fonctionnel dans cette division
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,                          -- NULL = affectation toujours active
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_assignment_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_assignment_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`),
    CONSTRAINT `fk_assignment_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index utile pour retrouver rapidement l'affectation active d'un employé
CREATE INDEX `idx_assignment_active` ON `employee_assignments` (`employee_id`, `end_date`);


-- ================================================================
-- PARTIE 5 : JOURNAL DES MOUVEMENTS (historique, append-only)
-- ================================================================

-- Catalogue des actions possibles (configurable, pas codé en dur)
CREATE TABLE IF NOT EXISTS `action_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,             -- ex: 'CREATION', 'TRANSFERT', 'SYNTHESE', 'CLOTURE'
    `label` VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dossier_movements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `dossier_id` INT NOT NULL,
    `source_division_id` INT NULL,                  -- NULL si c'est la création du dossier
    `destination_division_id` INT NOT NULL,
    `employee_id` INT NOT NULL,                     -- agent ayant réalisé l'action
    `action_type_id` INT NOT NULL,
    `previous_status` VARCHAR(50) NULL,
    `new_status` VARCHAR(50) NOT NULL,
    `comment` TEXT NULL,
    `action_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_movement_dossier` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_movement_source` FOREIGN KEY (`source_division_id`) REFERENCES `divisions` (`id`),
    CONSTRAINT `fk_movement_destination` FOREIGN KEY (`destination_division_id`) REFERENCES `divisions` (`id`),
    CONSTRAINT `fk_movement_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
    CONSTRAINT `fk_movement_action` FOREIGN KEY (`action_type_id`) REFERENCES `action_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour retrouver rapidement l'historique d'un dossier, ordonné dans le temps
CREATE INDEX `idx_movement_dossier_date` ON `dossier_movements` (`dossier_id`, `action_date`);


-- ================================================================
-- PARTIE 6 : JEU DE DONNEES DE DEPART
-- ================================================================

-- --- Rôles système (accès applicatif) + rôles fonctionnels (affectation) ---
INSERT INTO `roles` (`code`, `label`, `description`) VALUES
('ROLE_ADMIN', 'Administrateur Système', 'Accès total à la supervision, clés API et logs'),
('ROLE_FINANCE_OFFICER', 'Acteur Budgétaire / Régisseur', 'Accès aux guides d''exécutions financières et suivi des dossiers'),
('ROLE_EMPLOYEE', 'Employé / Agent Standard', 'Consultation documentaire basique et support IA'),
('AGENT_ACCUEIL', 'Agent d''accueil', 'Réceptionne et enregistre les dossiers entrants'),
('CHEF_DIVISION', 'Chef de division', 'Supervise une division et valide les dossiers');

-- --- Permissions ---
INSERT INTO `permissions` (`code`, `label`) VALUES
('VIEW_ADMIN_DASHBOARD', 'Afficher le tableau de bord Back-Office'),
('MANAGE_API_KEYS', 'Gérer les clés d''API externes'),
('VIEW_AUDIT_LOGS', 'Consulter le journal d''audit'),
('ACCESS_REGIE_PROCEDURES', 'Accéder aux procédures de régie d''avance');

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),   -- ROLE_ADMIN : toutes les permissions
(2, 4);                            -- ROLE_FINANCE_OFFICER : procédures spécifiques

-- --- Niveaux de division ---
INSERT INTO `division_levels` (`code`, `label`, `sees_all`) VALUES
('GENERAL', 'Général', TRUE),        -- voit et peut envoyer vers toutes les divisions
('SECONDAIRE', 'Secondaire', FALSE); -- limité aux divisions listées dans division_visibility_scope

-- --- Divisions ---
INSERT INTO `divisions` (`code`, `name`, `level_id`) VALUES
('ACCUEIL', 'Accueil', 2),        -- niveau Secondaire
('SECRETARIAT', 'Secrétariat', 2),-- niveau Secondaire
('DIRECTION', 'Direction', 1);    -- niveau Général

-- --- Portée de visibilité pour le niveau Secondaire ---
-- Exemple : l'Accueil (secondaire) ne peut envoyer que vers le Secrétariat
INSERT INTO `division_visibility_scope` (`level_id`, `target_division_id`) VALUES
(2, 2);  -- niveau SECONDAIRE -> peut cibler la division SECRETARIAT

-- --- Type de dossier "Accueil" avec son schéma de champs ---
INSERT INTO `dossier_types` (`code`, `name`, `fields_schema`) VALUES
('ACCUEIL', 'Dossier Accueil', JSON_ARRAY(
    JSON_OBJECT('nom', 'date_arrivee', 'type', 'date', 'obligatoire', TRUE),
    JSON_OBJECT('nom', 'objet', 'type', 'texte', 'obligatoire', TRUE),
    JSON_OBJECT('nom', 'ref_externe', 'type', 'texte', 'obligatoire', FALSE),
    JSON_OBJECT('nom', 'ministere', 'type', 'texte', 'obligatoire', TRUE)
));

-- --- Catalogue des actions ---
INSERT INTO `action_types` (`code`, `label`) VALUES
('CREATION', 'Création du dossier'),
('TRANSFERT', 'Transfert vers une autre division'),
('ENREGISTREMENT', 'Enregistrement dans le système'),
('SYNTHESE', 'Synthèse du dossier'),
('CLOTURE', 'Clôture du dossier'),
('REJET', 'Rejet du dossier');
