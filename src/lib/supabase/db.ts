import { supabase } from './client'
import type { Material, Member, DayData } from '../owo/types'

// ==================== MEMBERS ====================

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name')

  if (error) throw error

  return data.map(m => ({
    id: m.id,
    name: m.name,
    baseSalary: Number(m.base_salary),
    multiplier: Number(m.multiplier),
    bonus: Number(m.bonus),
    active: m.active,
  }))
}

export async function createMember(member: Omit<Member, 'id'>): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: member.name,
      base_salary: member.baseSalary,
      multiplier: member.multiplier,
      bonus: member.bonus,
      active: member.active ?? true,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    baseSalary: Number(data.base_salary),
    multiplier: Number(data.multiplier),
    bonus: Number(data.bonus),
    active: data.active,
  }
}

export async function updateMember(id: string, member: Partial<Member>): Promise<Member> {
  const updateData: any = {}
  if (member.name !== undefined) updateData.name = member.name
  if (member.baseSalary !== undefined) updateData.base_salary = member.baseSalary
  if (member.multiplier !== undefined) updateData.multiplier = member.multiplier
  if (member.bonus !== undefined) updateData.bonus = member.bonus
  if (member.active !== undefined) updateData.active = member.active

  const { data, error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    baseSalary: Number(data.base_salary),
    multiplier: Number(data.multiplier),
    bonus: Number(data.bonus),
    active: data.active,
  }
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}

// ==================== MATERIALS ====================

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name')

  if (error) throw error

  return data.map(m => ({
    id: m.id,
    name: m.name,
    qty: 0, // Materials are templates, qty is per day
    unit: m.unit,
    price: Number(m.price),
  }))
}

export async function createMaterial(material: Omit<Material, 'id' | 'qty'>): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      name: material.name,
      unit: material.unit,
      price: material.price,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    qty: 0,
    unit: data.unit,
    price: Number(data.price),
  }
}

export async function updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
  const updateData: any = {}
  if (material.name !== undefined) updateData.name = material.name
  if (material.unit !== undefined) updateData.unit = material.unit
  if (material.price !== undefined) updateData.price = material.price

  const { data, error } = await supabase
    .from('materials')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    qty: 0,
    unit: data.unit,
    price: Number(data.price),
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw error
}

// ==================== DAY DATA ====================

export async function getDayData(date: Date): Promise<DayData | null> {
  const dateStr = date.toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('day_data')
    .select('*')
    .eq('date', dateStr)
    .maybeSingle()

  if (error) {
    console.error('Error fetching day data:', error)
    return null
  }

  if (!data) return null

  const members = data.members as Member[] || []
  
  // If day has no members, load from members table
  if (members.length === 0) {
    const allMembers = await getMembers()
    return {
      materials: data.materials as Material[],
      cups: data.cups,
      pricePerCup: Number(data.price_per_cup),
      revenue: Number(data.revenue),
      members: allMembers.map(m => ({ ...m, bonus: 0, active: true, withdrawn: 0 })),
      payrollMode: data.payroll_mode as any,
      salarySharePct: Number(data.salary_share_pct),
      capitalMode: data.capital_mode as any,
      manualCapital: Number(data.manual_capital),
      manualPayroll: Number(data.manual_payroll),
      isHoliday: data.is_holiday,
      date: data.date,
    }
  }

  return {
    materials: data.materials as Material[],
    cups: data.cups,
    pricePerCup: Number(data.price_per_cup),
    revenue: Number(data.revenue),
    members: members,
    payrollMode: data.payroll_mode as any,
    salarySharePct: Number(data.salary_share_pct),
    capitalMode: data.capital_mode as any,
    manualCapital: Number(data.manual_capital),
    manualPayroll: Number(data.manual_payroll),
    isHoliday: data.is_holiday,
    date: data.date,
  }
}

export async function saveDayData(date: Date, dayData: DayData): Promise<DayData> {
  const dateStr = date.toISOString().split('T')[0]

  // First check if record exists
  const { data: existingData } = await supabase
    .from('day_data')
    .select('date')
    .eq('date', dateStr)
    .maybeSingle()

  const rowData = {
    date: dateStr,
    cups: dayData.cups,
    price_per_cup: dayData.pricePerCup,
    revenue: dayData.revenue,
    payroll_mode: dayData.payrollMode,
    salary_share_pct: dayData.salarySharePct,
    capital_mode: dayData.capitalMode,
    manual_capital: dayData.manualCapital,
    manual_payroll: dayData.manualPayroll,
    is_holiday: dayData.isHoliday,
    materials: dayData.materials,
    members: dayData.members,
  }

  let result
  if (existingData) {
    // Update existing record
    result = await supabase
      .from('day_data')
      .update(rowData)
      .eq('date', dateStr)
      .select()
      .single()
  } else {
    // Insert new record
    result = await supabase
      .from('day_data')
      .insert(rowData)
      .select()
      .single()
  }

  const { data, error } = result

  if (error) {
    console.error('Error saving day data:', error)
    throw error
  }

  if (!data) {
    console.error('No data returned from save operation')
    throw new Error('Failed to save day data')
  }

  return {
    materials: data.materials as Material[],
    cups: data.cups,
    pricePerCup: Number(data.price_per_cup),
    revenue: Number(data.revenue),
    members: data.members as Member[],
    payrollMode: data.payroll_mode as any,
    salarySharePct: Number(data.salary_share_pct),
    capitalMode: data.capital_mode as any,
    manualCapital: Number(data.manual_capital),
    manualPayroll: Number(data.manual_payroll),
    isHoliday: data.is_holiday,
    date: data.date || dateStr,
  }
}

export async function getDayDataRange(startDate: Date, endDate: Date): Promise<DayData[]> {
  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('day_data')
    .select('*')
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date')

  if (error) throw error

  return data.map(d => ({
    materials: d.materials as Material[],
    cups: d.cups,
    pricePerCup: Number(d.price_per_cup),
    revenue: Number(d.revenue),
    members: d.members as Member[],
    payrollMode: d.payroll_mode as any,
    salarySharePct: Number(d.salary_share_pct),
    capitalMode: d.capital_mode as any,
    manualCapital: Number(d.manual_capital),
    manualPayroll: Number(d.manual_payroll),
    isHoliday: d.is_holiday,
    date: d.date,
  }))
}

export async function deleteDayData(date: Date): Promise<void> {
  const dateStr = date.toISOString().split('T')[0]
  const { error } = await supabase.from('day_data').delete().eq('date', dateStr)
  if (error) throw error
}

// ==================== APP SETTINGS ====================

export async function getSetting(key: string): Promise<any> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) {
    console.error('Error fetching setting:', error)
    return null
  }

  return data?.value || null
}

export async function setSetting(key: string, value: any): Promise<void> {
  const { data: existingData } = await supabase
    .from('app_settings')
    .select('key')
    .eq('key', key)
    .maybeSingle()

  if (existingData) {
    // Update existing setting
    const { error } = await supabase
      .from('app_settings')
      .update({ value })
      .eq('key', key)
    if (error) throw error
  } else {
    // Insert new setting
    const { error } = await supabase
      .from('app_settings')
      .insert({ key, value })
    if (error) throw error
  }
}
