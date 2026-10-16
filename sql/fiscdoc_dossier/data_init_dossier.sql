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