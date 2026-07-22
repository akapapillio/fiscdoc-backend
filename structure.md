src/
├── common/                         # Tout ce qui est partagé dans toute l'API
│   ├── database/
│   │   ├── database.module.ts      # Exporte la connexion MySQL
│   │   └── database.provider.ts    # Pool mysql2 avec ConfigService
│   ├── decorators/                 # Décorateurs personnalisés (ex: @CurrentUser())
│   ├── guards/                     # Sécurité globale
│   │   └── api-key.guard.ts        # Vérifie les en-têtes x-api-key / secret
│   └── interfaces/                 # Types globaux TypeScript (ex: RequestWithUser)
│
├── modules/                        # Les briques métier de FiscDoc
│   ├── api-keys/                   # Gestion des clés d'accès
│   │   ├── api-keys.module.ts
│   │   ├── api-keys.service.ts     # Requetes SQL vers table api_keys
│   │   └── dto/                    # Validation des données entrantes (Data Transfer Object)
│   │       └── create-api-key.dto.ts
│   │
│   ├── categories/                 # Arbre hiérarchique des catégories
│   │   ├── categories.controller.ts# GET /api/categories
│   │   ├── categories.module.ts
│   │   ├── categories.service.ts   # Requetes SQL (ex: parent_id)
│   │   └── dto/
│   │
│   ├── documents/                  # Stockage et lecture des cours/HTML
│   │   ├── documents.controller.ts # POST /api/documents, GET /api/documents
│   │   ├── documents.module.ts
│   │   ├── documents.service.ts    # Requetes SQL vers table documents
│   │   └── dto/
│   │       ├── create-document.dto.ts
│   │       └── update-document.dto.ts
│   │
│   └── audit/                      # Journal d'audit (sigFP / sigMP / IA)
│       ├── audit.module.ts
│       └── audit.service.ts        # Insertions automatiques dans audit_logs
│
├── app.controller.ts               # Endpoint de santé (/api/api-status)
├── app.module.ts                   # Module racine qui rassemble tous les modules
└── main.ts                         # Point d'entrée de l'application (Prefix /api, etc.)