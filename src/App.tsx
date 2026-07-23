import { useEffect, useState } from 'react';
import { NavBar, type Tab } from '@/components/NavBar';
import { StationsScreen } from '@/screens/StationsScreen';
import { StationDetailScreen } from '@/screens/StationDetailScreen';
import { WeakSpotsScreen } from '@/screens/WeakSpotsScreen';
import { MnemonicsScreen } from '@/screens/MnemonicsScreen';
import { StatsDashboardScreen } from '@/screens/StatsDashboardScreen';
import { CharacterGate } from '@/screens/CharacterGate';
import { StationOverviewScreen } from '@/screens/StationOverviewScreen';
import { CheatSheetScreen } from '@/screens/CheatSheetScreen';
import { UziRitualScreen } from '@/screens/UziRitualScreen';
import { OskeStructureScreen } from '@/screens/OskeStructureScreen';
import { ActionPatternScreen } from '@/screens/ActionPatternScreen';
import { StudyPlanScreen } from '@/screens/StudyPlanScreen';
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
import { OnboardingModal } from '@/components/OnboardingModal';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { checkAndNotify } from '@/lib/reminders';

type StationsView =
  | { mode: 'list' }
  | { mode: 'detail'; stationId: string }
  | { mode: 'weakspots' }
  | { mode: 'mnemonics' }
  | { mode: 'stats' }
  | { mode: 'character' }
  | { mode: 'overview' }
  | { mode: 'cheatsheet' }
  | { mode: 'uzi-ritual' }
  | { mode: 'oske-structure' }
  | { mode: 'action-pattern' };

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
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());

  useEffect(() => {
    touchStreak();
    // В самую первую сессию (онбординг) разминку не показываем —
    // человек ещё даже не понял, что это за приложение, а мы уже
    // грузим его вопросами. shouldShowWarmup() при этом НЕ помечаем
    // "уже показано", чтобы разминка нормально появилась завтра.
    if (!showOnboarding && shouldShowWarmup()) setShowWarmup(true);
    if (shouldShowChangelog()) setShowChangelog(true);
    else if (!localStorage.getItem('uziprep.lastSeenVersion')) markChangelogSeen(); // первая установка — просто запоминаем версию
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Раньше переход на "Станция" / "Слабые места" / "Мнемоники" и т.д.
  // никак не трогал историю браузера — аппаратная/жестовая кнопка
  // "назад" на телефоне не находила, куда вернуться внутри приложения,
  // и просто закрывала вкладку/приложение целиком. Теперь при входе в
  // любой такой подэкран кладём запись в историю, а popstate (когда
  // юзер жмёт системную "назад") перехватываем и возвращаем в список
  // станций вместо выхода из приложения.
  useEffect(() => {
    if (stationsView.mode !== 'list') {
      window.history.pushState({ uziprepSubview: true }, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationsView.mode]);

  useEffect(() => {
    function handlePopState() {
      setStationsView((prev) => (prev.mode !== 'list' ? { mode: 'list' } : prev));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  function goBack() {
    window.history.back();
  }

  function changeTab(t: Tab) {
    setStationsView({ mode: 'list' });
    setTab(t);
  }

  function openStation(id: string) {
    setStationsView({ mode: 'detail', stationId: id });
    setLastStationId(id);
  }

  /** Переход из вкладки "План" сразу в конкретный подэкран вкладки "Станции", минуя список. */
  function goToStationsSubview(view: StationsView) {
    setTab('stations');
    setStationsView(view);
  }

  const lastStation = lastStationId ? getStationById(lastStationId) : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px]">
      <OfflineBanner />
      {showOnboarding && <OnboardingModal onDone={() => setShowOnboarding(false)} />}
      {!showOnboarding && showChangelog && (
        <ChangelogModal
          onClose={() => {
            markChangelogSeen();
            setShowChangelog(false);
          }}
        />
      )}
      {!showOnboarding && !showChangelog && showWarmup && <DailyWarmupModal onClose={() => setShowWarmup(false)} />}
      <NavBar active={tab} onChange={changeTab} variant="rail" />
      <main className="min-w-0 flex-1 p-4 pb-24 md:p-6">
        {tab === 'stations' && stationsView.mode === 'detail' && (
          <StationDetailScreen stationId={stationsView.stationId} onBack={goBack} />
        )}
        {tab === 'stations' && stationsView.mode === 'weakspots' && (
          <WeakSpotsScreen onOpenStation={openStation} />
        )}
        {tab === 'stations' && stationsView.mode === 'mnemonics' && (
          <MnemonicsScreen onBack={goBack} onOpenStation={openStation} />
        )}
        {tab === 'stations' && stationsView.mode === 'stats' && (
          <StatsDashboardScreen onBack={goBack} />
        )}
        {tab === 'stations' && stationsView.mode === 'character' && (
          <CharacterGate onBack={goBack} onOpenStats={() => setStationsView({ mode: 'stats' })} />
        )}
        {tab === 'stations' && stationsView.mode === 'overview' && <StationOverviewScreen onBack={goBack} onOpenCheatSheet={() => setStationsView({ mode: 'cheatsheet' })} />}
        {tab === 'stations' && stationsView.mode === 'cheatsheet' && <CheatSheetScreen onBack={goBack} />}
        {tab === 'stations' && stationsView.mode === 'uzi-ritual' && (
          <UziRitualScreen onBack={goBack} onOpenStation={openStation} onOpenActionPattern={() => setStationsView({ mode: 'action-pattern' })} />
        )}
        {tab === 'stations' && stationsView.mode === 'oske-structure' && <OskeStructureScreen onBack={goBack} />}
        {tab === 'stations' && stationsView.mode === 'action-pattern' && <ActionPatternScreen onBack={goBack} />}
        {tab === 'stations' && stationsView.mode === 'list' && (
          <StationsScreen
            onOpenStation={openStation}
            onGoExam={() => changeTab('exam')}
            onOpenWeakSpots={() => setStationsView({ mode: 'weakspots' })}
            onOpenMnemonics={() => setStationsView({ mode: 'mnemonics' })}
            onOpenCharacter={() => setStationsView({ mode: 'character' })}
            onOpenOverview={() => setStationsView({ mode: 'overview' })}
            onOpenUziRitual={() => setStationsView({ mode: 'uzi-ritual' })}
            onOpenOskeStructure={() => setStationsView({ mode: 'oske-structure' })}
          />
        )}
        {tab === 'exam' && <ExamScreen />}
        {tab === 'ai' && <AiTutorScreen stationId={lastStation?.id} stationTitle={lastStation?.title} />}
        {tab === 'plan' && (
          <StudyPlanScreen
            onOpenUziRitual={() => goToStationsSubview({ mode: 'uzi-ritual' })}
            onOpenOskeStructure={() => goToStationsSubview({ mode: 'oske-structure' })}
            onOpenActionPattern={() => goToStationsSubview({ mode: 'action-pattern' })}
            onOpenStation={(id) => {
              setTab('stations');
              openStation(id);
            }}
          />
        )}
        {tab === 'profile' && <ProfileScreen />}
      </main>
      <NavBar active={tab} onChange={changeTab} variant="bottom" />
    </div>
  );
}
