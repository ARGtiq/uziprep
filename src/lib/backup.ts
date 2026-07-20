import { db } from '@/lib/db';
import { APP_VERSION } from '@/version';

/**
 * Полный бэкап — все Dexie-таблицы + relevant localStorage-ключи в
 * один JSON-файл. Не завязан на Supabase (работает и для гостя без
 * аккаунта) — экспорт/импорт вручную как альтернатива облачному синку,
 * или как способ перенести прогресс на новое устройство без Supabase.
 */
export interface BackupData {
  appVersion: string;
  exportedAt: number;
  progress: unknown[];
  examAttempts: unknown[];
  blockMastery: unknown[];
  questionStats: unknown[];
  mnemonics: unknown[];
  whyExplanations: unknown[];
  chatMessages: unknown[];
  localStorage: Record<string, string>;
}

const LS_KEYS_TO_BACKUP = [
  'uziprep.streak',
  'uziprep.xp',
  'uziprep.ai.settings',
  'uziprep.theme.preference',
  'uziprep.theme.source',
  'uziprep.theme.seed',
  'uziprep.theme.colorfulIcons',
  'uziprep.theme.fontScale',
  'uziprep.examDate',
  'uziprep.reminders.enabled',
  'uziprep.reminders.time',
  'uziprep.scenarioViewMode',
  'uziprep.character',
];

export async function exportBackup(): Promise<BackupData> {
  const [progress, examAttempts, blockMastery, questionStats, mnemonics, whyExplanations, chatMessages] = await Promise.all([
    db.progress.toArray(),
    db.examAttempts.toArray(),
    db.blockMastery.toArray(),
    db.questionStats.toArray(),
    db.mnemonics.toArray(),
    db.whyExplanations.toArray(),
    db.chatMessages.toArray(),
  ]);
  const localStorageDump: Record<string, string> = {};
  for (const key of LS_KEYS_TO_BACKUP) {
    const v = localStorage.getItem(key);
    if (v !== null) localStorageDump[key] = v;
  }
  return {
    appVersion: APP_VERSION,
    exportedAt: Date.now(),
    progress,
    examAttempts,
    blockMastery,
    questionStats,
    mnemonics,
    whyExplanations,
    chatMessages,
    localStorage: localStorageDump,
  };
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `uziprep-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Импорт полностью ЗАМЕНЯЕТ локальные данные (не мержит) — это
 * "восстановление из бэкапа", а не тонкое слияние. Если нужен именно
 * перенос между устройствами без потери текущего прогресса — сначала
 * экспортировать оба устройства и решать конфликты вручную (за
 * пределами этой простой реализации).
 */
export async function importBackup(data: BackupData) {
  await db.progress.clear();
  await db.examAttempts.clear();
  await db.blockMastery.clear();
  await db.questionStats.clear();
  await db.mnemonics.clear();
  await db.whyExplanations.clear();
  await db.chatMessages.clear();

  if (data.progress?.length) await db.progress.bulkPut(data.progress as never[]);
  if (data.examAttempts?.length) await db.examAttempts.bulkPut(data.examAttempts as never[]);
  if (data.blockMastery?.length) await db.blockMastery.bulkPut(data.blockMastery as never[]);
  if (data.questionStats?.length) await db.questionStats.bulkPut(data.questionStats as never[]);
  if (data.mnemonics?.length) await db.mnemonics.bulkPut(data.mnemonics as never[]);
  if (data.whyExplanations?.length) await db.whyExplanations.bulkPut(data.whyExplanations as never[]);
  if (data.chatMessages?.length) await db.chatMessages.bulkPut(data.chatMessages as never[]);

  for (const [key, value] of Object.entries(data.localStorage ?? {})) {
    localStorage.setItem(key, value);
  }
}
