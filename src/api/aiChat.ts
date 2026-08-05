import { apiGet, apiPost, apiDelete } from './client';

export interface AiChatRequest {
  message?: string;
  audioBase64?: string;
  imageBase64?: string;
  audioFilename?: string;
}

export interface AiChatResponse {
  assistantMessageId: number;
  reply: string;
  transcribedText: string | null;
  createdAt: string;
}

export interface AiChatMessageDto {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  messageType: 'text' | 'audio' | 'image';
  createdAt: string;
}

export function sendChatMessage(
  token: string,
  request: AiChatRequest,
): Promise<AiChatResponse> {
  return apiPost<AiChatResponse>('/api/ai/chat', request, token);
}

export function getChatHistory(
  token: string,
  size = 50,
): Promise<AiChatMessageDto[]> {
  return apiGet<AiChatMessageDto[]>(`/api/ai/chat/history?size=${size}`, token);
}

export function clearChatHistory(token: string): Promise<void> {
  return apiDelete('/api/ai/chat/history', token);
}
