import type { DashboardData } from '../types/dashboard'
import { DashboardApiRepository } from './dashboard/dashboardApiRepository'

const defaultRepository = new DashboardApiRepository()

export async function loadDashboardData(): Promise<DashboardData> {
  return defaultRepository.load()
}
