import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AskChatDto } from './dto/ask-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async ask(@Body() askChatDto: AskChatDto) {
    return this.chatService.askAssistant(askChatDto);
  }
}