// Migration script: LocalStorage → Supabase
// Run this in browser console or as a one-time script

import { supabase } from '../src/lib/supabase/client'

// LocalStorage keys (copy from storage.ts)
const PREFIX = 'owo-tea:day:'
const ROSTER_KEY = 'owo-tea:roster'
const HOLIDAY_KEY = 'owo-tea:holidays'

// Helper functions
const dateKey = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const readDay = (key: string) => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const readRoster = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ROSTER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const readHoliday = (key: string) => {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(HOLIDAY_KEY)
    if (!raw) return false
    const holidays = JSON.parse(raw)
    return holidays[key] || false
  } catch {
    return false
  }
}

const listStoredDays = () => {
  if (typeof window === 'undefined') return []
  const keys: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k?.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length))
  }
  return keys.sort().reverse()
}

// Migration functions
export async function migrateMembers() {
  console.log('🔄 Migrating members from localStorage...')

  const roster = readRoster()
  console.log(`Found ${roster.length} members in localStorage`)

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
        console.error(`❌ Failed to migrate member ${member.name}:`, error)
      } else {
        console.log(`✅ Migrated member: ${member.name}`)
      }
    } catch (err) {
      console.error(`❌ Error migrating member ${member.name}:`, err)
    }
  }

  console.log('✅ Members migration completed')
}

export async function migrateDayData() {
  console.log('🔄 Migrating day data from localStorage...')

  const dayKeys = listStoredDays()
  console.log(`Found ${dayKeys.length} days in localStorage`)

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
        console.error(`❌ Failed to migrate day ${key}:`, error)
      } else {
        console.log(`✅ Migrated day: ${key}`)
      }
    } catch (err) {
      console.error(`❌ Error migrating day ${key}:`, err)
    }
  }

  console.log('✅ Day data migration completed')
}

export async function runFullMigration() {
  console.log('🚀 Starting full migration from localStorage to Supabase...')

  try {
    await migrateMembers()
    await migrateDayData()
    console.log('🎉 Full migration completed successfully!')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  }
}

// Auto-run if this is the main execution
if (typeof window !== 'undefined') {
  // For browser console usage
  ;(window as any).migrateToSupabase = runFullMigration
  ;(window as any).migrateMembers = migrateMembers
  ;(window as any).migrateDayData = migrateDayData
  console.log('📌 Migration functions available:')
  console.log('  - migrateToSupabase() // Run full migration')
  console.log('  - migrateMembers()   // Migrate only members')
  console.log('  - migrateDayData()   // Migrate only day data')
}
