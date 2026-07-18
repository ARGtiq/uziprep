import { useEffect, useState } from 'react';
import { NavBar, type Tab } from '@/components/NavBar';
import { StationsScreen } from '@/screens/StationsScreen';
import { StationDetailScreen } from '@/screens/StationDetailScreen';
import { ExamScreen } from '@/screens/ExamScreen';
import { AiTutorScreen } from '@/screens/AiTutorScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/lib/useAuth';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { pushLocalChanges } from '@/lib/sync';
import { getStationById } from '@/data/stations';

export default function App() {
  const [tab, setTab] = useState<Tab>('stations');
  const [openStationId, setOpenStationId] = useState<string | null>(null);
  // Последняя открытая станция — переживает переход на другие вкладки,
  // чтобы AI-репетитор мог подхватить контекст, даже если пользователь
  // уже ушёл со станции на вкладку "AI".
  const [lastStationId, setLastStationId] = useState<string | null>(null);
  const { session } = useAuth();
  const online = useOnlineStatus();

  useEffect(() => {
    if (!session || !online) return;
    const push = () => pushLocalChanges(session.user.id);
    push();
    const interval = setInterval(push, 20000);
    window.addEventListener('online', push);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', push);
    };
  }, [session, online]);

  function changeTab(t: Tab) {
    setOpenStationId(null);
    setTab(t);
  }

  function openStation(id: string) {
    setOpenStationId(id);
    setLastStationId(id);
  }

  const lastStation = lastStationId ? getStationById(lastStationId) : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px]">
      <OfflineBanner />
      <NavBar active={tab} onChange={changeTab} variant="rail" />
      <main className="min-w-0 flex-1 p-4 pb-24 md:p-6">
        {tab === 'stations' &&
          (openStationId ? (
            <StationDetailScreen stationId={openStationId} onBack={() => setOpenStationId(null)} />
          ) : (
            <StationsScreen onOpenStation={openStation} onGoExam={() => changeTab('exam')} />
          ))}
        {tab === 'exam' && <ExamScreen />}
        {tab === 'ai' && (
          <AiTutorScreen stationId={lastStation?.id} stationTitle={lastStation?.title} />
        )}
        {tab === 'profile' && <ProfileScreen />}
      </main>
      <NavBar active={tab} onChange={changeTab} variant="bottom" />
    </div>
  );
}
