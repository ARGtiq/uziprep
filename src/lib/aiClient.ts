import { getAiSettings } from '@/lib/aiSettings';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Прямой запрос из браузера в OpenRouter. Ключ хранится только в
 * localStorage пользователя (localStorage.uziprep.ai.settings) — не
 * уходит никуда, кроме openrouter.ai. Подходит для личного инструмента;
 * для многопользовательского продакшна ключ стоило бы прятать за
 * бэкендом, но тут это осознанно не нужно.
 */
export async function askAiTutor(messages: ChatMessage[]): Promise<string> {
  const { apiKey, model } = getAiSettings();
  if (!apiKey) throw new Error('AI не настроен: добавь API-ключ OpenRouter в профиле');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'UziPrep',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Ты — репетитор для врача, готовящегося к первичной специализированной аккредитации по ультразвуковой диагностике в России. ' +
            'Отвечай кратко, по делу, на русском языке, используя медицинскую терминологию. Если вопрос касается конкретной станции ОСКЭ — ' +
            'опирайся на официальные алгоритмы и чек-листы.',
        },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ошибка OpenRouter (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'Не удалось получить ответ.';
}
