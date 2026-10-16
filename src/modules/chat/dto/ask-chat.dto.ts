export class AskChatDto {
  message!: string;
  document_id?: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}