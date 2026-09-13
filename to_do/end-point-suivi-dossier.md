# 1. Authentification & Session (Auth)
## Ces endpoints gèrent la connexion et l'identité de l'agent qui utilise l'application.

- [ ] POST /auth/login : Authentifie l'agent (email/matricule + mot de passe) et retourne un token (JWT).

- [ ] GET /auth/me : Retourne les infos de l'agent connecté, ses rôles systèmes, et surtout son affectation active (sa division et son rôle fonctionnel actuels).

# Gestion des Dossiers (Le cœur métier) 
## C'est ici que se trouve la logique complexe (validation JSON, règles de visibilité).

- [x] GET /dossiers : Liste les dossiers. Accepte des filtres en query (ex: ?divisionId=2&status=ouvert pour voir les dossiers de l'accueil).

- [x] GET /dossiers/:id : Récupère les informations complètes d'un dossier spécifique.

- [x] POST /dossiers : Crée un nouveau dossier.
    - Logique back-end : Vérifie que le data JSON correspond au fields_schema du dossier_type_id. Insère le dossier ET crée automatiquement le premier dossier_movement (action: CREATION).

- [x] PATCH /dossiers/:id : Met à jour uniquement le contenu (data JSON) d'un dossier sans le changer de division (ex: ajout d'une information manquante).

- [ ] POST /dossiers/:id/transfer : Effectue une action ou déplace le dossier.
    - Logique back end : Prend la division cible et le nouveau statut. Vérifie la fonction peut_deplacer(source, cible) via la base de données. Si OK, met à jour le dossier et insère une nouvelle ligne dans dossier_movements.

# 3. Historique & Traçabilitéa
- [ ] GET /dossiers/:id/movements : Récupère l'historique complet (la chronologie) d'un dossier spécifique pour savoir par où il est passé.

- [ ] GET /actions : Liste les types d'actions possibles (Création, Transfert, Clôture...) pour alimenter les menus déroulants du front-end.

# 4. Configuration & Paramétrage (Mode Administrateur)
## Ces endpoints permettent de rendre le système flexible sans coder.

- [ ] GET /dossier-types : Liste les types de dossiers disponibles.

- [ ] POST /dossier-types : Ajoute un nouveau type de dossier avec son schéma JSON de validation.

- [ ] PATCH /dossier-types/:id : Modifie le schéma JSON d'un type de dossier existant.

- [ ] GET /divisions : Liste l'organigramme (les divisions).

- [ ] GET /divisions/:id/allowed-targets : Retourne la liste stricte des divisions vers lesquelles la division id a le droit d'envoyer un dossier (calcule les niveaux + exceptions à la volée).

# 5. Gestion des Employés & Affectations (RH)
## Pour gérer qui travaille où et avec quels droits.
- [ ] GET /employees : Liste le personnel.
- [ ] POST /employees : Crée un nouvel agent.
- [ ] PATCH /employees/:id : Modifie les infos d'un agent ou le désactive.
- [ ] GET /employees/:id/assignments : Affiche l'historique d'affectation d'un agent.
- [ ] POST /employees/:id/assignments : Affecte un agent à une nouvelle division avec un rôle spécifique (start_date = aujourd'hui).
- [ ] PATCH /assignments/:id/close : Clôture une affectation existante (end_date = aujourd'hui).

