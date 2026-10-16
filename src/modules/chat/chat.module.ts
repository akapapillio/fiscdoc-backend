import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    DocumentsModule, // Permet au ChatService d'accéder aux documents pour le contexte RAG
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService], // Exporté si un autre module souhaite poser des questions à l'IA
})
export class ChatModule {}