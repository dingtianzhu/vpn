// src/components/Layout/Sidebar.tsx
import React from 'react'
import {
  FaShieldAlt,
  FaGlobeAmericas,
  FaCog,
  FaUser,
  FaPowerOff,
} from 'react-icons/fa'
import type { PageId } from '../../types'

interface SidebarProps {
  activePage: PageId
  setActivePage: (p: PageId) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const menu: { id: PageId; icon: React.ReactNode }[] = [
    // 首页使用电源图标，和顶部 logo 区分开
    { id: 'home', icon: <FaPowerOff size={22} /> },
    { id: 'servers', icon: <FaGlobeAmericas size={22} /> },
    { id: 'settings', icon: <FaCog size={22} /> },
  ]

  return (
    <nav className="w-20 h-screen bg-vpn-panel flex flex-col items-center pt-10 pb-6 shadow-xl z-20">
      {/* 顶部 LOGO：下移一些，并用渐变圆角背景 */}
      <div className="mb-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg">
        <FaShieldAlt size={26} className="text-slate-900" />
      </div>

      {/* 菜单区域 */}
      <div className="flex-1 flex flex-col gap-6">
        {menu.map((item) => (
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

      {/* 底部用户图标 */}
      <button className="p-3 text-vpn-muted hover:text-white">
        <FaUser size={20} />
      </button>
    </nav>
  )
}

export default Sidebar