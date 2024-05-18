import { Body, Controller, Post, Sse } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { Ollama } from '@langchain/community/llms/ollama';

@Controller()
export class AppController {
  private messageSubject = new Subject<MessageEvent>();
  private ollama: Ollama;

  constructor() {
    this.ollama = new Ollama({
      baseUrl: 'http://localhost:11434', // Default value
      model: 'llama3',
    });
  }

  @Post('/chat')
  async handleMessage(@Body() body: { q: string }) {
    const stream = await this.ollama.stream(body.q);

    for await (const char of stream) {
      this.messageSubject.next({
        data: JSON.stringify({ answer: char, end: false }),
      } as MessageEvent);
    }

    this.messageSubject.next({
      data: JSON.stringify({ answer: '', end: true }),
    } as MessageEvent);
  }

  @Sse('/chat')
  getAnswer(): Observable<MessageEvent> {
    return this.messageSubject.asObservable();
  }
}
