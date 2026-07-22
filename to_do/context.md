# Architecture & Objectif du Backend

Le backend sert de coeur réglementaire et d'assistant IA : il reçoit du contenu (pages HTML, cours, textes de loi), gère les catégories, sécurise les accès pour les applications clientes (ex: WordPress, Front-end React) via des clés d'API, et enregistre un journal d'audit strict.

# Feuille de Route par Étapes
[1. Infra & Connexion] ──> [2. Sécurité API Keys] ──> [3. Module Catégories] ──> [4. Module Documents] ──> [5. Traçabilité Audit]