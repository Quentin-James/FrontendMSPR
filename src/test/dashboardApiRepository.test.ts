import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardApiRepository } from '../services/dashboard/dashboardApiRepository'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

describe('DashboardApiRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('charge les 3 endpoints API et mappe les donnees', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([{ patient_id: 1, age: 30, gender: 'male', weight_kg: 80, height_cm: 180, bmi: 24, disease_type: 'none', severity: 'low', physical_activity_level: 'medium', daily_caloric_intake: 2000, cholesterol_mg_dl: 150, blood_pressure_mmhg: '120/80', glucose_mg_dl: 90, weekly_exercise_frequency: 3, adherence_to_diet: 'medium' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 1, age: 30, gender: 'male', weight_kg: 80, height_m: 1.8, max_bpm: 180, avg_bpm: 130, resting_bpm: 60, session_duration_hours: 1, calories_burned: 500, workout_type: 'running', fat_percentage: 18, water_intake_liters: 2, workout_frequency_days_week: 4, experience_level: 'intermediate', bmi: 24 }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 1, food_item: 'oatmeal', category: 'breakfast', calories_kcal: 250, protein_g: 10, carbohydrates_g: 40, fat_g: 5, fiber_g: 6, sugars_g: 4, sodium_mg: 120, cholesterol_mg: 0, meal_type: 'breakfast', water_intake_ml: 250 }]))

    const repository = new DashboardApiRepository()
    const data = await repository.load()

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(data.patients).toHaveLength(1)
    expect(data.healthProfiles).toHaveLength(1)
    expect(data.dietPreferences).toHaveLength(1)
    expect(data.exerciseTracking).toHaveLength(1)
    expect(data.foodNutrition).toHaveLength(1)
  })

  it('propage une erreur explicite en cas d echec API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({}, false, 500))

    const repository = new DashboardApiRepository()

    await expect(repository.loadCleaningTab('diet')).rejects.toThrow('Erreur API diet: 500')
  })
})

