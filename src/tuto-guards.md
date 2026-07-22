# 📖 Tutoriel : Utiliser le `ApiKeyGuard`

Le `ApiKeyGuard` est conçu pour protéger les routes de notre API. Toute route qui utilise ce guard exigera que le client fournisse des en-têtes `x-api-key` et `x-api-secret` valides.

## Comment l'appliquer ?

Il suffit d'utiliser le décorateur `@UseGuards()` fourni par NestJS au-dessus d'un contrôleur ou d'une route spécifique.

### 1. Appliquer sur une route spécifique

Pour protéger une seule méthode (endpoint) d'un contrôleur :

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('documents')
export class DocumentsController {

  @Get()
  @UseGuards(ApiKeyGuard) // <-- Le Guard est appliqué ici !
  findAll() {
    // Cette logique ne sera exécutée que si le Guard valide la requête.
    return 'Cette donnée est protégée.';
  }
}
```

### 2. Appliquer sur un contrôleur entier

Pour protéger toutes les routes d'un contrôleur, placez le décorateur au-dessus de la classe du contrôleur.

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@UseGuards(ApiKeyGuard) // <-- Le Guard est appliqué à toutes les routes de ce contrôleur
@Controller('categories')
export class CategoriesController {

  @Get() // Protégé
  findAll() {
    // ...
  }

  @Post() // Protégé également
  create() {
    // ...
  }
}
```

C'est tout ! NestJS s'occupe du reste. Si une requête arrive sur une route protégée sans les bons en-têtes, le `ApiKeyGuard` lèvera automatiquement une erreur `401 Unauthorized` et la requête sera bloquée.