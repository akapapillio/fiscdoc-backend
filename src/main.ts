import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activation de CORS avec support des headers x-api-key et x-api-secret
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Origines autorisées
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-api-secret'],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();