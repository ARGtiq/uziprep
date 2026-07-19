import { useEffect, useState } from 'react';
import { NavBar, type Tab } from '@/components/NavBar';
import { StationsScreen } from '@/screens/StationsScreen';
import { StationDetailScreen } from '@/screens/StationDetailScreen';
import { WeakSpotsScreen } from '@/screens/WeakSpotsScreen';
import { ExamScreen } from '@/screens/ExamScreen';
import { AiTutorScreen } from '@/screens/AiTutorScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/lib/useAuth';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { pushLocalChanges, pushMiscState } from '@/lib/sync';
import { getStationById } from '@/data/stations';
import { touchStreak } from '@/lib/streakAndXp';
import { shouldShowWarmup } from '@/lib/dailyWarmup';
import { DailyWarmupModal } from '@/components/DailyWarmupModal';
import { ChangelogModal, shouldShowChangelog, markChangelogSeen } from '@/components/ChangelogModal';
import { UpdateBanner } from '@/components/UpdateBanner';

type StationsView = { mode: 'list' } | { mode: 'detail'; stationId: string } | { mode: 'weakspots' };

export default function App() {
  const [tab, setTab] = useState<Tab>('stations');
  const [stationsView, setStationsView] = useState<StationsView>({ mode: 'list' });
  // Последняя открытая станция — переживает переход на другие вкладки,
  // чтобы AI-репетитор мог подхватить контекст, даже если пользователь
  // уже ушёл со станции на вкладку "AI".
  const [lastStationId, setLastStationId] = useState<string | null>(null);
  const { session } = useAuth();
  const online = useOnlineStatus();
  const [showWarmup, setShowWarmup] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    touchStreak();
    if (shouldShowWarmup()) setShowWarmup(true);
    if (shouldShowChangelog()) setShowChangelog(true);
    else if (!localStorage.getItem('uziprep.lastSeenVersion')) markChangelogSeen(); // первая установка — просто запоминаем версию
  }, []);

  useEffect(() => {
    if (!session || !online) return;
    const push = () => {
      pushLocalChanges(session.user.id);
      pushMiscState(session.user.id);
    };
    push();
    const interval = setInterval(push, 20000);
    window.addEventListener('online', push);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', push);
    };
  }, [session, online]);

  function changeTab(t: Tab) {
    setStationsView({ mode: 'list' });
    setTab(t);
  }

  function openStation(id: string) {
    setStationsView({ mode: 'detail', stationId: id });
    setLastStationId(id);
  }

  const lastStation = lastStationId ? getStationById(lastStationId) : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px]">
      <OfflineBanner />
      <UpdateBanner />
      {showChangelog && (
        <ChangelogModal
          onClose={() => {
            markChangelogSeen();
            setShowChangelog(false);
          }}
        />
      )}
      {!showChangelog && showWarmup && <DailyWarmupModal onClose={() => setShowWarmup(false)} />}
      <NavBar active={tab} onChange={changeTab} variant="rail" />
      <main className="min-w-0 flex-1 p-4 pb-24 md:p-6">
        {tab === 'stations' && stationsView.mode === 'detail' && (
          <StationDetailScreen stationId={stationsView.stationId} onBack={() => setStationsView({ mode: 'list' })} />
        )}
        {tab === 'stations' && stationsView.mode === 'weakspots' && (
          <WeakSpotsScreen onOpenStation={openStation} />
        )}
        {tab === 'stations' && stationsView.mode === 'list' && (
          <StationsScreen
            onOpenStation={openStation}
            onGoExam={() => changeTab('exam')}
            onOpenWeakSpots={() => setStationsView({ mode: 'weakspots' })}
          />
        )}
        {tab === 'exam' && <ExamScreen />}
        {tab === 'ai' && <AiTutorScreen stationId={lastStation?.id} stationTitle={lastStation?.title} />}
        {tab === 'profile' && <ProfileScreen />}
      </main>
      <NavBar active={tab} onChange={changeTab} variant="bottom" />
    </div>
  );
}
