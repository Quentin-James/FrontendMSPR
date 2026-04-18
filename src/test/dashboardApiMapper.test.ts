import { describe, expect, it } from 'vitest'
import {
  mapHealthProfilesFromDietRows,
  mapPatientsFromDietRows,
  normalizeRowsPayload,
  toCleaningRow,
  toDietPreference,
  toFoodNutrition,
} from '../services/dashboard/dashboardApiMapper'

describe('dashboardApiMapper', () => {
  it('normalise un payload tableau direct ou encapsule', () => {
    expect(normalizeRowsPayload([{ id: 1 }])).toEqual([{ id: 1 }])
    expect(normalizeRowsPayload({ data: [{ id: 2 }] })).toEqual([{ id: 2 }])
    expect(normalizeRowsPayload({ other: [] })).toEqual([])
  })

  it('convertit une entree libre en CleaningRow', () => {
    const row = toCleaningRow({ id: 10, active: true, nested: { a: 1 } })
    expect(row.id).toBe(10)
    expect(row.active).toBe(true)
    expect(row.nested).toBe('[object Object]')
  })

  it('mappe correctement une ligne diet vers DietPreference', () => {
    const preference = toDietPreference({
      id: '7',
      patient_id: '45',
      dietary_restrictions: 'low-sodium',
      allergies: 'nuts',
      preferred_cuisine: 'mediterranean',
      weekly_exercise_frequency: '4',
      adherence_to_diet: 'HIGH',
    })

    expect(preference).toEqual({
      id: 7,
      patientId: 45,
      dietaryRestrictions: 'low-sodium',
      allergies: 'nuts',
      preferredCuisine: 'mediterranean',
      weeklyExerciseFrequency: 4,
      adherenceToDiet: 'high',
    })
  })

  it('derive patients et profils depuis les lignes diet', () => {
    const rows = [
      {
        id: 1,
        patient_id: '10',
        age: '36',
        gender: 'male',
        weight_kg: '82',
        height_cm: '179',
        bmi: '25.6',
        disease_type: 'diabetes',
        severity: 'medium',
        blood_pressure_mmhg: '130/85',
        glucose_mg_dl: '126',
      },
    ]

    const patients = mapPatientsFromDietRows(rows)
    const profiles = mapHealthProfilesFromDietRows(rows)

    expect(patients).toHaveLength(1)
    expect(patients[0]).toMatchObject({ id: 10, age: 36, bmi: 25.6 })
    expect(profiles).toHaveLength(1)
    expect(profiles[0]).toMatchObject({ patientId: 10, diseaseType: 'diabetes', glucoseMgDl: 126 })
  })

  it('mappe nutrition avec alias de colonnes heterogenes', () => {
    const item = toFoodNutrition({
      Food_Name: 'Avocado toast',
      food_category: 'Breakfast',
      caloric_value: '320 kcal',
      meal: 'breakfast',
      sodium: '180',
    })

    expect(item.foodItem).toBe('Avocado toast')
    expect(item.category).toBe('Breakfast')
    expect(item.caloriesKcal).toBe(320)
    expect(item.mealType).toBe('breakfast')
    expect(item.sodiumMg).toBe(180)
  })
})

