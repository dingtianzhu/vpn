// src/App.tsx
import React, { useState } from 'react'
import Sidebar from './components/Layout/Sidebar'
import Home from './pages/Home'
import Servers from './pages/Servers'
import Settings from './pages/Settings'
import type { PageId } from './types'
import { VpnProvider } from './hooks/useVpn'
import { ThemeProvider, useTheme } from './context/ThemeContext'

const AppShell: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('home')
  const { theme } = useTheme()

  // 深色主题：保持你原来的 vpn 深色风格
  // 浅色主题：柔和蓝灰背景 + 深色文字
  const rootClass =
    theme === 'dark'
      ? 'flex h-screen w-screen bg-vpn-bg text-vpn-text font-sans overflow-hidden select-none'
      : 'flex h-screen w-screen bg-[#E8F0FA] text-slate-900 font-sans overflow-hidden select-none'

  return (
    <VpnProvider>
      <div className={rootClass}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 h-full relative">
          {activePage === 'home' && <Home />}
          {activePage === 'servers' && <Servers />}
          {activePage === 'settings' && <Settings />}
        </main>
      </div>
    </VpnProvider>
  )
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}

export default App