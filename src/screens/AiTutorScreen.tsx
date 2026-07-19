import { useEffect, useRef, useState } from 'react';
import { isAiConfigured } from '@/lib/aiSettings';
import { streamAiTutor, NetworkError, ApiError, type ChatMessage } from '@/lib/aiClient';
import { getThreadMessages, appendThreadMessage, clearThread } from '@/lib/db';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { Icon } from '@/components/Icon';
import { renderSimpleMarkdown } from '@/lib/simpleMarkdown';

const GENERAL_SUGGESTIONS = [
  'Как считать ФВ ЛЖ по Симпсону?',
  'Расскажи алгоритм БСЛР 30:2',
  'Ошибки при УЗИ щитовидной железы',
  'Что оценивают на станции "Консультирование"?',
];

interface Props {
  stationId?: string;
  stationTitle?: string;
}

export function AiTutorScreen({ stationId, stationTitle }: Props) {
  const threadKey = stationId ?? 'general';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAiConfigured();
  const online = useOnlineStatus();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getThreadMessages(threadKey).then((rows) => setMessages(rows.map(({ role, content }) => ({ role, content }))));
  }, [threadKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streamingText]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    if (!online) {
      setError('Нет соединения с сетью — AI-репетитор недоступен офлайн');
      return;
    }
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    await appendThreadMessage(threadKey, userMsg);

    setLoading(true);
    setStreamingText('');
    let full = '';
    try {
      for await (const chunk of streamAiTutor(next, stationTitle)) {
        full += chunk;
        setStreamingText(full);
      }
      const assistantMsg: ChatMessage = { role: 'assistant', content: full || 'Не удалось получить ответ.' };
      setMessages((prev) => [...prev, assistantMsg]);
      await appendThreadMessage(threadKey, assistantMsg);
    } catch (e) {
      if (e instanceof NetworkError) setError('Нет соединения с сетью, попробуй ещё раз позже');
      else if (e instanceof ApiError) setError(e.message);
      else setError('Не удалось получить ответ');
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  }

  async function handleClear() {
    await clearThread(threadKey);
    setMessages([]);
  }

  if (!configured) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">AI-репетитор</h1>
        <p className="mb-4 text-sm text-on-surface-variant">Спросите об алгоритме, критериях оценки или разберите ошибки.</p>
        <div className="rounded-m3-md bg-secondary-container p-3.5 text-sm text-on-secondary-container">
          AI не настроен. Добавь API-ключ во вкладке <b>Профиль → AI-репетитор</b>, чтобы задавать вопросы.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col md:h-[calc(100vh-100px)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">AI-репетитор</h1>
          {stationTitle ? (
            <p className="text-xs text-on-surface-variant">
              Контекст: <span className="font-medium text-primary">{stationTitle}</span>
            </p>
          ) : (
            <p className="text-xs text-on-surface-variant">Общий чат — открой станцию, чтобы задавать вопросы по ней</p>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="shrink-0 text-xs text-on-surface-variant underline">
            Очистить историю
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 &&
          !streamingText &&
          GENERAL_SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="mb-2 block w-full rounded-m3-md bg-surface-container-low p-3.5 text-left text-sm">
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
            {m.role === 'assistant' ? renderSimpleMarkdown(m.content) : m.content}
          </div>
        ))}

        {loading && (
          <div className="mb-2.5 max-w-[85%] rounded-m3-md bg-surface-container-low p-3 text-sm leading-relaxed">
            {streamingText ? renderSimpleMarkdown(streamingText) : 'Печатает...'}
          </div>
        )}
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
          placeholder={online ? 'Ваш вопрос...' : 'Нет сети...'}
          disabled={!online}
          className="flex-1 rounded-full border border-outline-variant bg-surface px-4 py-2.5 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !online}
          aria-label="Отправить"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-50"
        >
          <Icon name="arrow_forward" size={18} />
        </button>
      </form>
    </div>
  );
}
