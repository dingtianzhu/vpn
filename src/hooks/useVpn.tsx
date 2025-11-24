// src/hooks/useVpn.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { VpnStatus, VPNSettings, ServerNode } from '../types'
import { SERVER_LIST } from '../data/servers'

interface VpnContextValue {
  status: VpnStatus
  isBusy: boolean
  error: string | null
  currentServer: ServerNode
  setCurrentServer: (s: ServerNode) => void
  settings: VPNSettings
  updateSettings: (patch: Partial<VPNSettings>) => void
  connectOrToggle: () => Promise<void>
}

const VpnContext = createContext<VpnContextValue | undefined>(undefined)

const defaultSettings: VPNSettings = {
  mtu: 1280,
  dnsMode: 'cloudflare',
  customDns: '',
}

function buildConfig(server: ServerNode, settings: VPNSettings): string {
  let dns = ''
  if (settings.dnsMode === 'cloudflare') {
    dns = '1.1.1.1,1.0.0.1'
  } else if (settings.dnsMode === 'google') {
    dns = '8.8.8.8,8.8.4.4'
  } else {
    dns = settings.customDns || '1.1.1.1'
  }

  return server.baseConfig
    .replace(/__DNS__/g, dns)
    .replace(/__MTU__/g, String(settings.mtu))
}

export const VpnProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<VpnStatus>('disconnected')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentServer, setCurrentServer] = useState<ServerNode>(SERVER_LIST[0])
  const [settings, setSettings] = useState<VPNSettings>(defaultSettings)

  // 监听来自主进程的状态变化
  useEffect(() => {
    if (!window.electron) return
    window.electron.ipcRenderer.onStatusChange((s) => {
      if (s === 'connected' || s === 'disconnected' || s === 'connecting') {
        setStatus(s as VpnStatus)
      }
    })
  }, [])

  const updateSettings = (patch: Partial<VPNSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const connectOrToggle = async () => {
    if (!window.electron) {
      setError('Electron 环境未加载')
      return
    }

    setError(null)

    if (status === 'disconnected') {
      setStatus('connecting')
      setIsBusy(true)
      try {
        const finalConfig = buildConfig(currentServer, settings)
        await window.electron.ipcRenderer.connectVpn(finalConfig)
      } catch (err: any) {
        console.error('连接失败:', err)
        const msg = String(err?.message || err)
        if (msg.includes('User did not grant permission')) {
          setStatus('disconnected')
        } else {
          setStatus('disconnected')
          setError('连接失败：' + msg)
        }
      } finally {
        setIsBusy(false)
      }
    } else {
      // 断开
      setIsBusy(true)
      try {
        await window.electron.ipcRenderer.disconnectVpn()
      } catch (err) {
        console.error('断开失败:', err)
      } finally {
        setIsBusy(false)
      }
    }
  }

  return (
    <VpnContext.Provider
      value={{
        status,
        isBusy,
        error,
        currentServer,
        setCurrentServer,
        settings,
        updateSettings,
        connectOrToggle,
      }}
    >
      {children}
    </VpnContext.Provider>
  )
}

export function useVpn() {
  const ctx = useContext(VpnContext)
  if (!ctx) throw new Error('useVpn must be used within VpnProvider')
  return ctx
}