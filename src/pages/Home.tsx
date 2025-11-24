// src/pages/Home.tsx
import React, { useEffect, useState } from 'react'
import { FaArrowUp, FaArrowDown, FaMapMarkerAlt } from 'react-icons/fa'
import ConnectButton from '../components/Dashboard/ConnectButton'
import { useVpn } from '../hooks/useVpn'

interface StatsState {
  ip: string
  download: number
  upload: number
  latency: number
}

const initialStats: StatsState = {
  ip: 'Hidden',
  download: 0,
  upload: 0,
  latency: 0,
}

const Home: React.FC = () => {
  const { status, isBusy, currentServer, connectOrToggle, error } = useVpn()
  const [stats, setStats] = useState<StatsState>(initialStats)

  // IP + 速率/延迟动态模拟
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (status === 'connected') {
      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => {
          setStats((prev) => ({ ...prev, ip: data.ip || prev.ip }))
        })
        .catch(() => {
          setStats((prev) => ({ ...prev, ip: 'Unknown' }))
        })

      timer = setInterval(() => {
        setStats((prev) => {
          const nextDown = Math.max(
            0,
            prev.download + (Math.random() - 0.4) * 5,
          )
          const nextUp = Math.max(
            0,
            prev.upload + (Math.random() - 0.4) * 1.5,
          )
          const basePing = currentServer.ping || 60
          const nextLatency = Math.max(
            5,
            basePing + (Math.random() - 0.5) * 20,
          )
          return {
            ip: prev.ip,
            download: parseFloat(nextDown.toFixed(2)),
            upload: parseFloat(nextUp.toFixed(2)),
            latency: Math.round(nextLatency),
          }
        })
      }, 1000)
    } else {
      setStats(initialStats)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [status, currentServer])

  const statusText =
    status === 'connected'
      ? 'SECURE CONNECTION ACTIVE'
      : status === 'connecting'
      ? 'CONNECTING...'
      : 'UNPROTECTED'

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full">
      {/* 背景地图 */}
      <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] opacity-5 bg-center bg-no-repeat bg-contain pointer-events-none" />

      {/* 顶部状态条 */}
      <div className="h-16 flex items-center justify-center border-b border-white/5 z-10">
        <div
          className={`px-4 py-1 rounded-full text-xs font-bold bg-black/20 border transition-colors ${
            status === 'connected'
              ? 'border-vpn-primary text-vpn-primary'
              : 'border-vpn-danger text-vpn-danger'
          }`}
        >
          {statusText}
        </div>
      </div>

      {/* 中间主体 */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 gap-8">
        <ConnectButton
          status={status}
          onClick={connectOrToggle}
          disabled={isBusy}
        />

        <button className="flex items-center gap-3 px-6 py-3 bg-vpn-panel rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
          <span className="text-3xl">{currentServer.flag}</span>
          <div className="text-left">
            <div className="text-xs text-vpn-muted">Selected Server</div>
            <div className="font-bold">
              {currentServer.city}, {currentServer.country}
            </div>
          </div>
          <FaMapMarkerAlt className="text-vpn-primary ml-2" />
        </button>

        {error && (
          <div className="mt-4 text-sm text-red-400 max-w-md text-center">
            {error}
          </div>
        )}
      </div>

      {/* 底部统计栏 */}
      <div className="h-24 bg-vpn-panel/50 backdrop-blur-md border-t border-white/5 grid grid-cols-4 divide-x divide-white/5">
        <StatItem
          icon={<FaArrowDown />}
          label="DOWNLOAD"
          value={
            status === 'connected'
              ? `${stats.download.toFixed(2)} MB/s`
              : '-'
          }
          color="text-cyan-400"
        />
        <StatItem
          icon={<FaArrowUp />}
          label="UPLOAD"
          value={
            status === 'connected'
              ? `${stats.upload.toFixed(2)} MB/s`
              : '-'
          }
          color="text-orange-400"
        />
        <StatItem
          icon={<span className="font-mono text-xs">RTT</span>}
          label="LATENCY"
          value={
            status === 'connected'
              ? `${stats.latency || currentServer.ping} ms`
              : '-'
          }
          color="text-emerald-400"
        />
        <StatItem
          icon={<span className="font-mono text-xs">IP</span>}
          label="IP ADDRESS"
          value={status === 'connected' ? stats.ip : 'Hidden'}
          color="text-white"
        />
      </div>
    </div>
  )
}

const StatItem: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  color: string
}> = ({ icon, label, value, color }) => (
  <div className="flex flex-col items-center justify-center gap-1">
    <div className="flex items-center gap-2 text-vpn-muted text-xs">
      {icon} {label}
    </div>
    <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
  </div>
)

export default Home