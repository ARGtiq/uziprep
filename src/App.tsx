import { useEffect, useState } from 'react';
import { NavBar, type Tab } from '@/components/NavBar';
import { StationsScreen } from '@/screens/StationsScreen';
import { StationDetailScreen } from '@/screens/StationDetailScreen';
import { ExamScreen } from '@/screens/ExamScreen';
import { AiTutorScreen } from '@/screens/AiTutorScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { useAuth } from '@/lib/useAuth';
import { pushLocalChanges } from '@/lib/sync';

export default function App() {
  const [tab, setTab] = useState<Tab>('stations');
  const [openStationId, setOpenStationId] = useState<string | null>(null);
  const { session } = useAuth();

  // Фоновая отправка накопленных локальных изменений (чек-листы,
  // результаты ordering) в Supabase, пока пользователь залогинен и
  // есть сеть. Первичный полный sync (pull+push) делает ProfileScreen
  // при входе — тут только регулярный "долив" новых изменений.
  useEffect(() => {
    if (!session) return;
    const push = () => pushLocalChanges(session.user.id);
    push();
    const interval = setInterval(push, 20000);
    window.addEventListener('online', push);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', push);
    };
  }, [session]);

  function changeTab(t: Tab) {
    setOpenStationId(null);
    setTab(t);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px]">
      <NavBar active={tab} onChange={changeTab} variant="rail" />
      <main className="min-w-0 flex-1 p-4 pb-24 md:p-6">
        {tab === 'stations' &&
          (openStationId ? (
            <StationDetailScreen stationId={openStationId} onBack={() => setOpenStationId(null)} />
          ) : (
            <StationsScreen onOpenStation={setOpenStationId} onGoExam={() => changeTab('exam')} />
          ))}
        {tab === 'exam' && <ExamScreen />}
        {tab === 'ai' && <AiTutorScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </main>
      <NavBar active={tab} onChange={changeTab} variant="bottom" />
    </div>
  );
}
