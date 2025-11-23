import React, { useState, useEffect } from 'react'
import ConnectButton from '../components/Dashboard/ConnectButton'
import { FaArrowUp, FaArrowDown, FaMapMarkerAlt } from 'react-icons/fa'
import type { VpnStatus } from '../types'
import type { ServerNode } from '../data/servers'

interface HomeProps {
  currentServer: ServerNode
  onChangeServerRequest: () => void
}

interface StatsState {
  ip: string
  download: number // MB/s
  upload: number   // MB/s
  latency: number  // ms
}

const initialStats: StatsState = {
  ip: 'Hidden',
  download: 0,
  upload: 0,
  latency: 0,
}

const Home: React.FC<HomeProps> = ({ currentServer, onChangeServerRequest }) => {
  const [status, setStatus] = useState<VpnStatus>('disconnected')
  const [stats, setStats] = useState<StatsState>(initialStats)

  // 监听主进程发回的 VPN 状态
  useEffect(() => {
    if (!window.electron) return

    const unsubscribe = window.electron.ipcRenderer.onStatusChange(
      (newStatus: string) => {
        if (
          newStatus === 'connected' ||
          newStatus === 'disconnected' ||
          newStatus === 'connecting'
        ) {
          setStatus(newStatus as VpnStatus)
        }
      },
    )

    return () => {
      // @ts-ignore
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  // 根据连接状态，动态刷新 IP / 上下行 / 延迟
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (status === 'connected') {
      // 1) 刚连上的时候，查一次公网 IP
      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => {
          setStats((prev) => ({ ...prev, ip: data.ip || prev.ip }))
        })
        .catch(() => {
          setStats((prev) => ({ ...prev, ip: 'Unknown' }))
        })

      // 2) 启动一个定时器，每秒模拟刷新一次速率和延迟
      timer = setInterval(() => {
        setStats((prev) => {
          // 模拟下载/上传：给一点波动，让界面看起来“活着”
          const nextDown = Math.max(
            0,
            prev.download + (Math.random() - 0.4) * 5,
          ) // ±2MB/s 左右波动
          const nextUp = Math.max(0, prev.upload + (Math.random() - 0.4) * 1.5)

          // 模拟延迟：围绕当前服务器的基准 ping 上下浮动
          const basePing = currentServer.ping || 60
          const nextLatency = Math.max(
            5,
            basePing + (Math.random() - 0.5) * 20,
          )

          return {
            ...prev,
            download: parseFloat(nextDown.toFixed(2)),
            upload: parseFloat(nextUp.toFixed(2)),
            latency: Math.round(nextLatency),
          }
        })
      }, 1000)
    } else {
      // 断开时重置
      setStats(initialStats)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [status, currentServer])

  const handleConnect = async () => {
    if (!window.electron) {
      alert('Electron 环境未加载，无法发起连接')
      return
    }

    if (status === 'disconnected') {
      setStatus('connecting')
      try {
        await window.electron.ipcRenderer.connectVpn(currentServer.config)
      } catch (err: any) {
        console.error('连接失败:', err)
        const message: string = err?.message || String(err)

        if (message.includes('User did not grant permission')) {
          setStatus('disconnected')
          return
        }

        setStatus('disconnected')
        alert('连接失败：' + message)
      }
    } else {
      try {
        await window.electron.ipcRenderer.disconnectVpn()
      } catch (err) {
        console.error('断开失败:', err)
        setStatus('disconnected')
      }
    }
  }

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
          {status === 'connected' ? 'SECURE CONNECTION ACTIVE' : 'UNPROTECTED'}
        </div>
      </div>

      {/* 中间主体 */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 gap-8">
        <ConnectButton status={status} onClick={handleConnect} />

        {/* 选中服务器 + 切换入口 */}
        <button
          onClick={onChangeServerRequest}
          className="flex items-center gap-3 px-6 py-3 bg-vpn-panel rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
        >
          <span className="text-3xl">{currentServer.flag}</span>
          <div className="text-left">
            <div className="text-xs text-vpn-muted">Selected Server</div>
            <div className="font-bold">
              {currentServer.city}, {currentServer.country}
            </div>
          </div>
          <FaMapMarkerAlt className="text-vpn-primary ml-2" />
        </button>
      </div>

      {/* 底部统计：下载 / 上传 / 延迟 / IP */}
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

// 小组件：底部每一格统计
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