// src/pages/Settings.tsx
import React from 'react'
import ConnectionSettings from '../components/Settings/ConnectionSettings'
import AppearanceSettings from '../components/Settings/AppearanceSettings'

const Settings: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <ConnectionSettings />
      <AppearanceSettings />
    </div>
  )
}

export default Settings