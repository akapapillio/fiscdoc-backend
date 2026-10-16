import { Injectable, NotFoundException } from '@nestjs/common';
import { AskChatDto } from './dto/ask-chat.dto';
import { DocumentsService } from '../documents/documents.service';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private modelName: string;

 constructor(private readonly documentsService: DocumentsService) {
    // Lecture dynamique des variables du .env
    this.openai = new OpenAI({
      baseURL: process.env.LLM_BASE_URL || undefined, // Nécessaire si vous utilisez Groq ou Ollama
      apiKey: process.env.LLM_API_KEY || '',
    });

    this.modelName = process.env.LLM_MODEL || 'llama-3.1-8b-instant';
  }

  // Utilitaire simple pour nettoyer le HTML brut et alléger les tokens
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async askAssistant(dto: AskChatDto): Promise<{ reply: string }> {
    let systemInstruction = `Tu es l'assistant d'expertise documentaire de la plateforme FiscDoc.
Réponds aux questions de manière claire, concise et professionnelle.`;

    // 1. Si un document_id est fourni, on charge son contenu comme contexte
    if (dto.document_id) {
      const document = await this.documentsService.findOne(dto.document_id);
      if (!document) {
        throw new NotFoundException(`Document avec l'ID ${dto.document_id} introuvable.`);
      }

      const textContent = this.stripHtml(document.html_content || '');

      systemInstruction += `

=== CONTEXTE DOCUMENTAIRE ACTIF ===
Titre : ${document.title}
Statut : ${document.status}
Version : ${document.version}

Contenu de référence :
${textContent}
===================================

CONSIGNES STRICTES :
1. Base tes explications en priorité sur le contenu de référence ci-dessus.
2. Si la réponse ne se trouve pas dans le document, indique clairement que ce document spécifique ne contient pas l'information.
3. Sois précis sur les étapes, procédures et règles mentionnées.`;
    }

    // 2. Assemblage de l'historique de conversation
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemInstruction },
    ];

    // On injecte les messages précédents si fournis (ex: 4 derniers tours)
    if (dto.history && dto.history.length > 0) {
      for (const msg of dto.history.slice(-6)) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // On ajoute la dernière question de l'utilisateur
    messages.push({
      role: 'user',
      content: dto.message,
    });

    // 3. Appel au modèle LLM
    const completion = await this.openai.chat.completions.create({
      model: this.modelName,
      messages: messages,
      temperature: 0.2,
    });
    const reply = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

    return { reply };
  }
}