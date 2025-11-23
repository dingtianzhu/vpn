import React from 'react'
import { FaShieldAlt, FaGlobeAmericas, FaCog, FaUser } from 'react-icons/fa'
import type { PageId } from '../../types'

interface SidebarProps {
  activePage: PageId
  setActivePage: (page: PageId) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const menuItems: { id: PageId; icon: React.ReactNode }[] = [
    { id: 'home', icon: <FaShieldAlt size={22} /> },
    { id: 'servers', icon: <FaGlobeAmericas size={22} /> },
    { id: 'settings', icon: <FaCog size={22} /> },
  ]

  return (
    <nav className="w-20 h-screen bg-vpn-panel flex flex-col items-center py-6 shadow-xl z-20">
      <div className="mb-10 text-vpn-primary">
        <FaShieldAlt size={32} />
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`p-3 rounded-xl transition-all ${
              activePage === item.id
                ? 'bg-vpn-primary/20 text-vpn-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-vpn-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <button className="p-3 text-vpn-muted hover:text-white">
        <FaUser size={20} />
      </button>
    </nav>
  )
}

export default Sidebar