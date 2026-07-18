import { useState } from 'react';
import { isAiConfigured } from '@/lib/aiSettings';
import { askAiTutor, type ChatMessage } from '@/lib/aiClient';
import { Icon } from '@/components/Icon';

const SUGGESTIONS = [
  'Как считать ФВ ЛЖ по Симпсону?',
  'Расскажи алгоритм БСЛР 30:2',
  'Ошибки при УЗИ щитовидной железы',
  'Что оценивают на станции "Консультирование"?',
];

export function AiTutorScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAiConfigured();

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const reply = await askAiTutor(next);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить ответ');
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">AI-репетитор</h1>
        <p className="mb-4 text-sm text-on-surface-variant">
          Спросите об алгоритме, критериях оценки или разберите ошибки.
        </p>
        <div className="rounded-m3-md bg-secondary-container p-3.5 text-sm text-on-secondary-container">
          AI не настроен. Добавь API-ключ OpenRouter во вкладке{' '}
          <b>Профиль → AI-репетитор</b>, чтобы задавать вопросы.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col md:h-[calc(100vh-100px)]">
      <h1 className="mb-1 text-xl font-semibold">AI-репетитор</h1>
      <p className="mb-4 text-sm text-on-surface-variant">
        Спросите об алгоритме, критериях оценки или разберите ошибки.
      </p>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 &&
          SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="mb-2 block w-full rounded-m3-md bg-surface-container-low p-3.5 text-left text-sm"
            >
              {s}
            </button>
          ))}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2.5 max-w-[85%] rounded-m3-md p-3 text-sm leading-relaxed ${
              m.role === 'user' ? 'ml-auto bg-primary-container text-on-primary-container' : 'bg-surface-container-low'
            }`}
          >
            {m.content}
          </div>
        ))}

        {loading && <div className="mb-2.5 w-fit rounded-m3-md bg-surface-container-low p-3 text-sm text-on-surface-variant">Печатает...</div>}
        {error && <div className="mb-2.5 rounded-m3-md bg-error/10 p-3 text-sm text-error">{error}</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ваш вопрос..."
          className="flex-1 rounded-full border border-outline-variant bg-surface px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Отправить"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-50"
        >
          <Icon name="arrow_forward" size={18} />
        </button>
      </form>
    </div>
  );
}
