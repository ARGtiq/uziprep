import { useState } from 'react';
import { hasCharacter } from '@/lib/character';
import { CharacterCreationModal } from '@/components/CharacterCreationModal';
import { CharacterScreen } from '@/screens/CharacterScreen';

interface Props {
  onBack: () => void;
  onOpenStats: () => void;
}

/** Показывает создание персонажа при первом заходе, иначе — сам экран. */
export function CharacterGate({ onBack, onOpenStats }: Props) {
  const [exists, setExists] = useState(hasCharacter);

  if (!exists) {
    return <CharacterCreationModal onDone={() => setExists(true)} />;
  }

  return <CharacterScreen onBack={onBack} onOpenStats={onOpenStats} />;
}
