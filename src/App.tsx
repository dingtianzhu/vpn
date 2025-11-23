import React, { useState } from 'react'
import Sidebar from './components/Layout/Sidebar'
import Home from './pages/Home'
import Servers from './pages/Servers'
import type { PageId } from './types'
import { SERVER_LIST, ServerNode } from './data/servers'

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('home')
  const [currentServer, setCurrentServer] = useState<ServerNode>(SERVER_LIST[0])

  return (
    <div className="flex h-screen w-screen bg-vpn-bg text-vpn-text font-sans overflow-hidden select-none">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 h-full bg-vpn-bg relative">
        {activePage === 'home' && (
          <Home
            currentServer={currentServer}
            onChangeServerRequest={() => setActivePage('servers')}
          />
        )}

        {activePage === 'servers' && (
          <Servers
            currentServer={currentServer}
            onSelect={(server) => {
              setCurrentServer(server)
              setActivePage('home')
            }}
          />
        )}

        {activePage === 'settings' && (
          <div className="flex h-full items-center justify-center text-vpn-muted">
            Settings page (TODO)
          </div>
        )}
      </main>
    </div>
  )
}

export default App