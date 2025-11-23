import React from 'react'
import { SERVER_LIST, ServerNode } from '../data/servers'
import { FaCheck, FaSignal } from 'react-icons/fa'

interface ServersProps {
  currentServer: ServerNode
  onSelect: (server: ServerNode) => void
}

const Servers: React.FC<ServersProps> = ({ currentServer, onSelect }) => {
  return (
    <div className="h-full flex flex-col p-6">
      <h1 className="text-2xl font-bold mb-6">Select Location</h1>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {SERVER_LIST.map((server) => (
          <button
            key={server.id}
            onClick={() => onSelect(server)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              currentServer.id === server.id
                ? 'bg-vpn-primary/10 border-vpn-primary'
                : 'bg-vpn-panel border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{server.flag}</span>
              <div className="text-left">
                <div className="font-bold text-white">{server.country}</div>
                <div className="text-sm text-vpn-muted">{server.city}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-vpn-muted">
                <FaSignal />
                <span>{server.ping}ms</span>
              </div>
              {currentServer.id === server.id && (
                <FaCheck className="text-vpn-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Servers