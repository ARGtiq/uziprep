import { getAiSettings } from '@/lib/aiSettings';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT =
  'Ты — репетитор для врача, готовящегося к первичной специализированной аккредитации по ультразвуковой ' +
  'диагностике в России. Отвечай кратко, по делу, на русском языке, используя медицинскую терминологию. ' +
  'Если вопрос касается конкретной станции ОСКЭ — опирайся на официальные алгоритмы и чек-листы.';

/**
 * Явно различаем сетевую ошибку (нет интернета, DNS, CORS-блок) от
 * ответа с ошибкой от самого API (неверный ключ, лимит, 5xx) — экрану
 * нужно показывать разные сообщения.
 */
export class NetworkError extends Error {}
export class ApiError extends Error {}

function buildSystemPrompt(stationContext?: string): string {
  if (!stationContext) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\nСейчас пользователь смотрит станцию: ${stationContext}. Если вопрос не уточняет другую станцию — считай, что речь про неё.`;
}

async function* streamOpenRouter(messages: ChatMessage[], stationContext?: string): AsyncGenerator<string> {
  const { openrouterKey, openrouterModel } = getAiSettings();
  if (!openrouterKey) throw new ApiError('Не задан API-ключ OpenRouter');

  let res: Response;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openrouterKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'UziPrep',
      },
      body: JSON.stringify({
        model: openrouterModel,
        stream: true,
        messages: [{ role: 'system', content: buildSystemPrompt(stationContext) }, ...messages],
      }),
    });
  } catch {
    throw new NetworkError('Нет соединения с сетью');
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`Ошибка OpenRouter (${res.status}): ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // неполный чанк JSON — пропускаем, накопится в следующей итерации
      }
    }
  }
}

async function* streamGoogle(messages: ChatMessage[], stationContext?: string): AsyncGenerator<string> {
  const { googleKey, googleModel } = getAiSettings();
  if (!googleKey) throw new ApiError('Не задан API-ключ Google AI');

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:streamGenerateContent?alt=sse&key=${googleKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: buildSystemPrompt(stationContext) }] },
        }),
      },
    );
  } catch {
    throw new NetworkError('Нет соединения с сетью');
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`Ошибка Google AI (${res.status}): ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (delta) yield delta as string;
      } catch {
        // неполный чанк — пропускаем
      }
    }
  }
}

/**
 * Стримит ответ токен-за-токеном из выбранного в настройках провайдера.
 * stationContext — человекочитаемое название/описание открытой станции,
 * подмешивается в system prompt, чтобы репетитор понимал, о чём речь.
 */
export function streamAiTutor(messages: ChatMessage[], stationContext?: string): AsyncGenerator<string> {
  const { provider } = getAiSettings();
  return provider === 'google' ? streamGoogle(messages, stationContext) : streamOpenRouter(messages, stationContext);
}

/**
 * Разовый запрос без сохранения в историю диалога — для одноразовых
 * генераций вроде мнемоник, где не нужен полноценный чат-контекст.
 */
export async function askAiTutorOnce(prompt: string): Promise<string> {
  let full = '';
  for await (const chunk of streamAiTutor([{ role: 'user', content: prompt }])) {
    full += chunk;
  }
  return full || 'Не удалось получить ответ.';
}
