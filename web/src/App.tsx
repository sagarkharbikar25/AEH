import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { FirstLight } from './components/FirstLight';
import { AtlasPage } from './pages/AtlasPage';
import { AlmanacPage } from './pages/AlmanacPage';
import { IndexPage } from './pages/IndexPage';
import { MethodPage } from './pages/MethodPage';
import { DevErrorsPage } from './pages/DevErrorsPage';
import { ErrorScreen } from './components/ErrorScreen';

export const App: React.FC = () => {
  const [splashFinished, setSplashFinished] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('polaris_first_light_played'));
  });

  return (
    <BrowserRouter>
      {/* First Light Splash (plays once per session) */}
      {!splashFinished && (
        <FirstLight onComplete={() => setSplashFinished(true)} />
      )}

      <div className="min-h-screen flex flex-col bg-[var(--ink-900)] text-[var(--parchment)]">
        <Navigation />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<AtlasPage />} />
            <Route path="/almanac" element={<AlmanacPage />} />
            <Route path="/index" element={<IndexPage />} />
            <Route path="/method" element={<MethodPage />} />
            <Route path="/dev/errors" element={<DevErrorsPage />} />
            <Route path="*" element={<ErrorScreen variant="not_found" />} />
          </Routes>
        </main>

        {/* Observatory Footer */}
        <footer className="border-t border-[var(--line)] py-6 text-center text-xs font-mono text-[var(--parchment-muted)] bg-[var(--ink-900)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>POLARIS · AWS Strands Decider Agent Hackathon</span>
            <span className="text-[var(--brass)]">#strands-decider-2b #tool-selection</span>
            <span>Apache-2.0 License · Zero Third-Party Trademarks</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};
