# fiscdoc-backend
API REST sécurisée de Gestion Documentaire (GED) et d'assistance réglementaire (sigFP/sigMP, régies d'avances). Ingestion de pages HTML, authentification par clés d'API (Key/Secret), versioning, traçabilité stricte (Audit Logs) et intégration de chatbot IA (RAG).  Stack : NestJS • TypeScript • PostgreSQL • Prisma ORM • AI SDK (Gemini/OpenAI)

# FiscDoc - API Backend x)

API REST sécurisée de Gestion Documentaire (GED) et d'assistance réglementaire pour les finances publiques (sigFP/sigMP, régies d'avances).

Ce dépôt contient le code source du backend (API) du projet FiscDoc.

##  Technologies utilisées

- **Framework :** [NestJS](https://nestjs.com/) (Node.js)
- **Langage :** [TypeScript](https://www.typescriptlang.org/) (100% typé)
- **Base de données :** [Mysql]
- **ORM :** [Prisma ORM](https://www.prisma.io/)
- **IA / Chatbot :** Vercel AI SDK & Google Gemini / OpenAI (RAG)

##  Fonctionnalités clés du Backend

- **Ingestion HTML :** API d'upload de documents et pages (ex: issues de WordPress).
- **Sécurité :** Authentification robuste via un système de couples de clés `API Key` / `Secret Key` (secrets hachés en base de données).
- **Traçabilité :** Gestion du versioning des documents et journalisation stricte des actions (`Audit Logs`).
- **Moteur de Chat :** Route de complétion IA contextuelle (RAG) basée sur le contenu des documents financiers.

##  Installation et Démarrage Local

### Prérequis

Assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/) (v20 ou supérieure)
- [PostgreSQL](https://www.postgresql.org/)
