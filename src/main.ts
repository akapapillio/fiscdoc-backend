import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';   // Activation de la validation globale (DTOs) --- ///////////////////////////

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('fiscdocback');

  // 1. Origines de base toujours autorisées
  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  // 2. Récupération et découpage des origines supplémentaires depuis le .env
  const envOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : [];

  // 3. Fusion des deux tableaux (et élimination des doublons potentiels)
  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

  // Activation de CORS avec support des headers x-api-key et x-api-secret
  app.enableCors({
    origin: allowedOrigins, // Origines autorisées (statiques + .env)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-api-secret'],
    credentials: true,
  });

  // Activation de la validation globale (DTOs) --- ///////////////////////////
  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist: true, // Supprime les champs non déclarés dans le DTO
  //   forbidNonWhitelisted: true, // Rejette la requête si des champs intrus sont présents (optionnel)
  // }));

  // '0.0.0.0' est indispensable pour que le serveur écoute sur l'IP du réseau et pas seulement sur localhost
  await app.listen(3000, '0.0.0.0');
}
bootstrap();