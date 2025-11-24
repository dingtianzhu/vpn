// src/components/Settings/ConnectionSettings.tsx
import React from 'react'
import { useVpn } from '../../hooks/useVpn'

const ConnectionSettings: React.FC = () => {
  const { settings, updateSettings } = useVpn()

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-vpn-muted uppercase tracking-wide">
        Connection
      </h2>

      {/* DNS */}
      <div className="bg-vpn-panel rounded-xl p-4 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">DNS</span>
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          <button
            onClick={() => updateSettings({ dnsMode: 'cloudflare' })}
            className={`px-3 py-1 rounded-full text-xs border ${
              settings.dnsMode === 'cloudflare'
                ? 'bg-vpn-primary/20 border-vpn-primary text-vpn-primary'
                : 'border-white/10 text-vpn-muted'
            }`}
          >
            Cloudflare (1.1.1.1)
          </button>
          <button
            onClick={() => updateSettings({ dnsMode: 'google' })}
            className={`px-3 py-1 rounded-full text-xs border ${
              settings.dnsMode === 'google'
                ? 'bg-vpn-primary/20 border-vpn-primary text-vpn-primary'
                : 'border-white/10 text-vpn-muted'
            }`}
          >
            Google (8.8.8.8)
          </button>
          <button
            onClick={() => updateSettings({ dnsMode: 'custom' })}
            className={`px-3 py-1 rounded-full text-xs border ${
              settings.dnsMode === 'custom'
                ? 'bg-vpn-primary/20 border-vpn-primary text-vpn-primary'
                : 'border-white/10 text-vpn-muted'
            }`}
          >
            Custom
          </button>
        </div>

        {settings.dnsMode === 'custom' && (
          <input
            type="text"
            className="mt-3 w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-vpn-primary"
            placeholder="e.g. 9.9.9.9,1.1.1.1"
            value={settings.customDns}
            onChange={(e) =>
              updateSettings({ customDns: e.target.value.trim() })
            }
          />
        )}
      </div>

      {/* MTU */}
      <div className="bg-vpn-panel rounded-xl p-4 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">MTU</span>
        </div>
        <p className="text-xs text-vpn-muted">
          较小的 MTU（如 1280）可以减少某些网站打不开或访问很慢的问题；
          如果网络稳定可以尝试 1420 或 1500。
        </p>
        <div className="flex gap-3 mt-2 flex-wrap">
          {[1280, 1420, 1500].map((v) => (
            <button
              key={v}
              onClick={() => updateSettings({ mtu: v })}
              className={`px-3 py-1 rounded-full text-xs border ${
                settings.mtu === v
                  ? 'bg-vpn-primary/20 border-vpn-primary text-vpn-primary'
                  : 'border-white/10 text-vpn-muted'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ConnectionSettings