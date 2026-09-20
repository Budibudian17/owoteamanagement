import { useState } from 'react'
import { supabase } from '../lib/supabase/client'

// LocalStorage keys
const PREFIX = 'owo-tea:day:'
const ROSTER_KEY = 'owo-tea:roster'
const HOLIDAY_KEY = 'owo-tea:holidays'

const readRoster = () => {
  try {
    const raw = localStorage.getItem(ROSTER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const readDay = (key: string) => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const readHoliday = (key: string) => {
  try {
    const raw = localStorage.getItem(HOLIDAY_KEY)
    if (!raw) return false
    const holidays = JSON.parse(raw)
    return holidays[key] || false
  } catch {
    return false
  }
}

const listStoredDays = () => {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length))
  }
  return keys.sort().reverse()
}

export default function MigratePage() {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
    console.log(message)
  }

  const migrateMembers = async () => {
    addLog('🔄 Migrating members...')
    const roster = readRoster()
    addLog(`Found ${roster.length} members in localStorage`)

    for (const member of roster) {
      try {
        const { error } = await supabase.from('members').upsert({
          id: member.id,
          name: member.name,
          base_salary: member.baseSalary,
          multiplier: member.multiplier,
          bonus: member.bonus || 0,
          active: member.active !== false,
        })

        if (error) {
          addLog(`❌ Failed to migrate ${member.name}: ${error.message}`)
        } else {
          addLog(`✅ Migrated: ${member.name}`)
        }
      } catch (err) {
        addLog(`❌ Error migrating ${member.name}: ${err}`)
      }
    }
  }

  const migrateDayData = async () => {
    addLog('🔄 Migrating day data...')
    const dayKeys = listStoredDays()
    addLog(`Found ${dayKeys.length} days in localStorage`)

    for (const key of dayKeys) {
      const dayData = readDay(key)
      if (!dayData) continue

      const isHoliday = readHoliday(key)

      try {
        const { error } = await supabase.from('day_data').upsert({
          date: key,
          cups: dayData.cups || 0,
          price_per_cup: dayData.pricePerCup || 0,
          revenue: dayData.revenue || 0,
          payroll_mode: dayData.payrollMode || 'share',
          salary_share_pct: dayData.salarySharePct || 50,
          capital_mode: dayData.capitalMode || 'detail',
          manual_capital: dayData.manualCapital || 0,
          manual_payroll: dayData.manualPayroll || 0,
          is_holiday: isHoliday || dayData.isHoliday || false,
          materials: dayData.materials || [],
          members: dayData.members || [],
        })

        if (error) {
          addLog(`❌ Failed to migrate ${key}: ${error.message}`)
        } else {
          addLog(`✅ Migrated: ${key}`)
        }
      } catch (err) {
        addLog(`❌ Error migrating ${key}: ${err}`)
      }
    }
  }

  const runMigration = async () => {
    setStatus('migrating')
    setLogs([])

    try {
      await migrateMembers()
      await migrateDayData()
      setStatus('success')
      addLog('🎉 Migration completed successfully!')
    } catch (err) {
      setStatus('error')
      addLog(`❌ Migration failed: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Migrate LocalStorage to Supabase</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-600 mb-4">
            This will migrate all your existing data from localStorage to Supabase database.
          </p>

          <button
            onClick={runMigration}
            disabled={status === 'migrating'}
            className={`px-6 py-3 rounded-lg font-medium ${
              status === 'migrating'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {status === 'migrating' ? 'Migrating...' : 'Start Migration'}
          </button>

          {status === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Migration completed!</p>
              <p className="text-green-600 text-sm mt-1">
                You can now delete this page and use the Supabase database.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ Migration failed</p>
              <p className="text-red-600 text-sm mt-1">Check the logs below for details.</p>
            </div>
          )}
        </div>

        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Migration Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
