import { useState } from 'react';
import { saveCharacter, CLASS_META, type CharacterClass } from '@/lib/character';
import { CharacterAvatar } from '@/components/CharacterAvatar';
import { Icon } from '@/components/Icon';

interface Props {
  onDone: () => void;
}

/**
 * Персонаж — своя, оригинальная система, а не персонаж какой-либо
 * книги/игры (даже если тебе хочется назвать его в честь любимого
 * героя — это только твой личный ярлык в поле "имя", не контент,
 * который мы написали или нарисовали от лица чужой франшизы).
 */
export function CharacterCreationModal({ onDone }: Props) {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');

  function create() {
    saveCharacter({ name: name.trim() || 'Без имени', class: selectedClass, createdAt: Date.now() });
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 md:items-center">
      <div className="w-full max-w-md rounded-t-m3-lg bg-surface p-6 md:rounded-m3-lg">
        <h2 className="mb-1 text-center text-lg font-semibold">Создай персонажа</h2>
        <p className="mb-4 text-center text-xs text-on-surface-variant">
          Растёт вместе с твоим прогрессом в подготовке — свой, не привязан ни к какой книге или игре
        </p>

        <div className="mb-4 flex justify-center">
          <CharacterAvatar characterClass={selectedClass} tier={1} size={88} />
        </div>

        <label className="mb-1 block text-xs text-on-surface-variant">Имя</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Придумай имя..."
          maxLength={24}
          className="mb-4 w-full rounded-m3-sm border border-outline-variant bg-surface px-3 py-2 text-sm"
        />

        <label className="mb-2 block text-xs text-on-surface-variant">Класс</label>
        <div className="mb-5 flex flex-col gap-2">
          {(Object.keys(CLASS_META) as CharacterClass[]).map((c) => (
            <button
              key={c}
              onClick={() => setSelectedClass(c)}
              className={`flex items-center gap-3 rounded-m3-md border p-3 text-left ${
                selectedClass === c ? 'border-primary bg-primary-container' : 'border-outline-variant'
              }`}
            >
              <div className="flex-1">
                <b className="text-sm">{CLASS_META[c].label}</b>
                <div className="text-xs text-on-surface-variant">{CLASS_META[c].blurb}</div>
              </div>
              {selectedClass === c && <Icon name="check_circle" size={18} className="shrink-0 text-primary" />}
            </button>
          ))}
        </div>

        <button onClick={create} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-on-primary">
          В путь
        </button>
      </div>
    </div>
  );
}
