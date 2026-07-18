import { useState } from 'react';
import { NavBar, type Tab } from '@/components/NavBar';
import { StationsScreen } from '@/screens/StationsScreen';
import { StationDetailScreen } from '@/screens/StationDetailScreen';
import { ExamScreen } from '@/screens/ExamScreen';
import { AiTutorScreen } from '@/screens/AiTutorScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

export default function App() {
  const [tab, setTab] = useState<Tab>('stations');
  const [openStationId, setOpenStationId] = useState<string | null>(null);

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
