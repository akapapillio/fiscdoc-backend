-- =========================================================================
-- SCRIPT DE CRÉATION DE LA BASE DE DONNÉES FISCDOC (MARIADB / MYSQL)
-- Moteur : InnoDB (Pour la sécurité et les clés étrangères)
-- =========================================================================

-- 1. Table des Utilisateurs
CREATE TABLE `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(191) UNIQUE NOT NULL,
  `name` VARCHAR(100),
  `role` ENUM('ADMIN', 'USER', 'API_CLIENT') DEFAULT 'USER',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table des Clés d'API (Authentification externe, ex: WordPress)
CREATE TABLE `api_keys` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL, -- Ex: "Plugin WordPress Prod"
  `public_key` VARCHAR(36) UNIQUE NOT NULL, -- Identifiant transmis dans le header
  `hashed_secret` VARCHAR(255) NOT NULL, -- Secret haché (Bcrypt/Argon2)
  `is_active` TINYINT(1) DEFAULT 1,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `user_id` VARCHAR(36) NOT NULL,
  -- RELATION : Si l'utilisateur saute, ses clés d'accès sautent aussi
  CONSTRAINT `fk_apikeys_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table des Catégories Dynamiques & Hiérarchiques
CREATE TABLE `categories` (
  `id` VARCHAR(36) PRIMARY KEY,
  `code` VARCHAR(50) UNIQUE NOT NULL, -- Ex: "REGIE_AVANCE", "TEXTE_LOI"
  `name` VARCHAR(100) NOT NULL, -- Ex: "Régie d'Avances"
  `description` TEXT NULL, -- Contexte métier pour aider l'IA
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `parent_id` VARCHAR(36) NULL, -- Lien pour créer des sous-catégories
  -- RELATION : Si une catégorie parente saute, ses sous-catégories sautent (CASCADE)
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table des Documents (Leçons, Tutos, Procédures HTML)
CREATE TABLE `documents` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(191) NOT NULL,
  `category_id` VARCHAR(36) NOT NULL, -- Clé étrangère vers categories
  `status` ENUM('BROUILLON', 'VALIDE', 'ARCHIVE') DEFAULT 'BROUILLON',
  `html_content` LONGTEXT NOT NULL, -- Parfait pour les pages complexes issues de WP
  `version` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `author_id` VARCHAR(36) NOT NULL, -- Clé étrangère vers users
  
  -- RELATIONS : Sécurité stricte, impossible de supprimer un auteur ou une catégorie liée à un document existant
  CONSTRAINT `fk_documents_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_documents_author` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Journal d'Audit (Traçabilité financière sigFP/sigMP et IA)
CREATE TABLE `audit_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL, -- Ex: "DOCUMENT_UPLOAD", "CHAT_QUERY"
  `details` JSON NOT NULL, -- Données flexibles (Historique des questions de l'IA)
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `user_id` VARCHAR(36) NULL, -- Clé étrangère vers users (Optionnelle)
  
  -- RELATION : Si l'utilisateur est archivé, on garde la ligne d'audit intacte (SET NULL)
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;