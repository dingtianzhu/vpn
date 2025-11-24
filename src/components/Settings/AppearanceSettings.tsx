// src/components/Settings/AppearanceSettings.tsx
import React from 'react'
import { useTheme } from '../../context/ThemeContext'

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme, toggleTheme } = useTheme()

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-vpn-muted uppercase tracking-wide">
        Appearance
      </h2>

      <div className="bg-vpn-panel rounded-xl p-4 border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Theme</span>
          <button
            onClick={toggleTheme}
            className="text-xs px-2 py-1 rounded-full border border-white/10 text-vpn-muted hover:border-vpn-primary hover:text-vpn-primary transition-colors"
          >
            Toggle
          </button>
        </div>

        <div className="flex gap-3 mt-1 flex-wrap">
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1 rounded-full text-xs border ${
              theme === 'dark'
                ? 'bg-vpn-primary/20 border-vpn-primary text-vpn-primary'
                : 'border-white/10 text-vpn-muted'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1 rounded-full text-xs border ${
              theme === 'light'
                ? 'bg-white/20 border-white text-slate-900'
                : 'border-white/10 text-vpn-muted'
            }`}
          >
            Light
          </button>
        </div>

        <p className="text-xs text-vpn-muted">
          深色主题适合弱光环境，亮色主题更接近日间使用体验。主题设置仅影响本机，
          并会自动保存。
        </p>
      </div>
    </section>
  )
}

export default AppearanceSettings