import React from 'react'
import { motion } from 'framer-motion'
import { FaPowerOff } from 'react-icons/fa'
import type { VpnStatus } from '../../types'

interface ConnectButtonProps {
  status: VpnStatus
  onClick: () => void
}

const ConnectButton: React.FC<ConnectButtonProps> = ({ status, onClick }) => {
  const styles: Record<
    VpnStatus,
    { border: string; icon: string; shadow: string; text: string }
  > = {
    disconnected: {
      border: 'border-vpn-muted',
      icon: 'text-vpn-muted',
      shadow: '',
      text: 'CONNECT',
    },
    connecting: {
      border: 'border-yellow-500',
      icon: 'text-yellow-500',
      shadow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]',
      text: 'CONNECTING...',
    },
    connected: {
      border: 'border-vpn-primary',
      icon: 'text-vpn-primary',
      shadow: 'shadow-[0_0_50px_rgba(16,185,129,0.6)]',
      text: 'CONNECTED',
    },
  }

  const currentStyle = styles[status]

  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {(status === 'connecting' || status === 'connected') && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-inherit z-0 ${currentStyle.shadow}`}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div
        className={`relative z-10 w-48 h-48 rounded-full border-4 bg-vpn-panel flex flex-col items-center justify-center transition-all duration-500 ${currentStyle.border} ${currentStyle.shadow}`}
      >
        <FaPowerOff
          className={`text-5xl mb-2 transition-colors duration-500 ${currentStyle.icon}`}
        />
        <span
          className={`text-sm font-bold tracking-widest ${currentStyle.icon}`}
        >
          {currentStyle.text}
        </span>
      </div>
    </div>
  )
}

export default ConnectButton