# 🚀 Todo List — Backend FiscDoc (NestJS & MariaDB)

Feuille de route pour le développement de l'API réglementaire et de l'assistant IA **FiscDoc**.

---

## 🏗️ Architecture Globale

```text
[Phase 1: Refacto Clean Arch] ──> [Phase 2: Sécurité API Keys] ──> [Phase 3: Module Catégories] ──> [Phase 4: Module Documents] ──> [Phase 5: Audit Logs]
```
# Phase 0 : initialisation du back end , installation des dependance , test de connection avec mysql
- [x] test

# Phase 1 : Nettoyage & Architecture Propre
## Objectif : Isoler la connexion MariaDB (mysql2) dans un module dédié pour garder un projet scalable.

- [x] Créer le dossier src/common/database/

- [x] Créer database.provider.ts (configuration et export du pool mysql2)

- [x] Créer database.module.ts (export du token 'DATABASE_CONNECTION')

- [x] Refactoriser app.module.ts pour y importer DatabaseModule

- [x] Valider que l'endpoint /api/api-status fonctionne toujours


# Phase 2 : Authentification & Sécurité par Clé d'API
## Objectif : Sécuriser les routes de l'API via des en-têtes HTTP (x-api-key / x-api-secret).
- [x] Préparer la table api_keys dans MariaDB
- [ ] Créer le dossier src/common/guards/
- [ ] Implémenter api-key.guard.ts :
    - [ ] Intercepter les headers x-api-key et x-api-secret
    - [ ] Exécuter la requête SQL de vérification (is_active = 1, expiration) via un service
    - [ ] Lever une exception 401 Unauthorized si la clé est invalide
- [ ] Appliquer le Guard sur les routes sensibles (sera fait dans les prochaines phases)
## Tâches Additionnelles : Gestion des Clés d'API
## Objectif : Permettre à un administrateur de créer et gérer le cycle de vie des clés.

- [ ] **Création d'une clé d'API :**
    - [ ] Créer le `api-keys.controller.ts` pour exposer les endpoints de gestion.
    - [ ] Créer un DTO (Data Transfer Object) `create-api-key.dto.ts` pour valider les données d'entrée (ex: `name`, `userId`).
    - [ ] Implémenter la méthode `createApiKey` dans `api-keys.service.ts` (génération `publicKey`, `secret`, hachage et `INSERT` SQL).
    - [ ] Créer la route `POST /api-keys` qui retourne la clé publique et le secret *une seule fois*.

- [ ] **Suspension / Révocation d'une clé :**
    - [ ] Implémenter une méthode `updateApiKeyStatus` dans `api-keys.service.ts` (requête `UPDATE` pour modifier `is_active`).
    - [ ] Créer les routes `PATCH /api-keys/:id/suspend` et `PATCH /api-keys/:id/reactivate`.

# Phase 3 : Module Catégories (Gestion Hiérarchique)
## Objectif : Gérer l'arborescence des domaines (ex: sigFP ➔ Régies d'avances).

- [ ] Générer le module : npx nest g module modules/categories

- [ ] Créer le DTO create-category.dto.ts (code, name, parent_id, etc.)

- [ ] Implémenter categories.service.ts :

- [ ] findAll() : Récupérer toutes les catégories

- [ ] findTree() : Reconstituer l'arbre hiérarchique avec sous-catégories

- [ ] create() : Insertion SQL avec gestion des liens parents

- [ ] Implémenter categories.controller.ts (GET /categories, POST /categories)