import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';   // Activation de la validation globale (DTOs) --- ///////////////////////////

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activation de CORS avec support des headers x-api-key et x-api-secret
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Origines autorisées
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-api-secret'],
    credentials: true,
  });

  // Activation de la validation globale (DTOs) --- ///////////////////////////
  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist: true, // Supprime les champs non déclarés dans le DTO
  //   forbidNonWhitelisted: true, // Rejette la requête si des champs intrus sont présents (optionnel)
  // }));

  await app.listen(3000);
}
bootstrap();