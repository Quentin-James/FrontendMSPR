import { describe, expect, it } from 'vitest'
import {
  nutritionMealAverageMetrics,
  topNutritionFoodsMetrics,
} from '../services/analytics'
import type { DashboardData } from '../types/dashboard'

function emptyData(): DashboardData {
  return {
    patients: [],
    healthProfiles: [],
    dietPreferences: [],
    foodNutrition: [],
    exerciseTracking: [],
  }
}

describe('analytics nutrition metrics', () => {
  it('ignore les calories invalides et normalise les mealType vides', () => {
    const data = emptyData()
    data.foodNutrition = [
      {
        id: 1,
        foodItem: 'item-1',
        category: 'cat',
        caloriesKcal: 350,
        proteinG: 0,
        carbohydratesG: 0,
        fatG: 0,
        fiberG: 0,
        sugarsG: 0,
        sodiumMg: 0,
        cholesterolMg: 0,
        mealType: 'breakfast',
        waterIntakeMl: 0,
      },
      {
        id: 2,
        foodItem: 'item-2',
        category: 'cat',
        caloriesKcal: 200,
        proteinG: 0,
        carbohydratesG: 0,
        fatG: 0,
        fiberG: 0,
        sugarsG: 0,
        sodiumMg: 0,
        cholesterolMg: 0,
        mealType: '',
        waterIntakeMl: 0,
      },
      {
        id: 3,
        foodItem: 'item-3',
        category: 'cat',
        caloriesKcal: 0,
        proteinG: 0,
        carbohydratesG: 0,
        fatG: 0,
        fiberG: 0,
        sugarsG: 0,
        sodiumMg: 0,
        cholesterolMg: 0,
        mealType: 'dinner',
        waterIntakeMl: 0,
      },
    ]

    expect(nutritionMealAverageMetrics(data)).toEqual([
      { label: 'Breakfast', value: 350 },
      { label: 'Unknown', value: 200 },
    ])
  })

  it('retire les aliments sans calories et fallback sur category si foodItem vide', () => {
    const data = emptyData()
    data.foodNutrition = [
      {
        id: 1,
        foodItem: '',
        category: 'fruit',
        caloriesKcal: 95,
        proteinG: 0,
        carbohydratesG: 0,
        fatG: 0,
        fiberG: 0,
        sugarsG: 0,
        sodiumMg: 0,
        cholesterolMg: 0,
        mealType: 'snack',
        waterIntakeMl: 0,
      },
      {
        id: 2,
        foodItem: 'burger',
        category: 'fast food',
        caloriesKcal: 530,
        proteinG: 0,
        carbohydratesG: 0,
        fatG: 0,
        fiberG: 0,
        sugarsG: 0,
        sodiumMg: 0,
        cholesterolMg: 0,
        mealType: 'dinner',
        waterIntakeMl: 0,
      },
      {
        id: 3,
        foodItem: 'water',
        category: 'drink',
        caloriesKcal: 0,
        proteinG: 0,
        carbohydratesG: 0,
        fatG: 0,
        fiberG: 0,
        sugarsG: 0,
        sodiumMg: 0,
        cholesterolMg: 0,
        mealType: 'snack',
        waterIntakeMl: 0,
      },
    ]

    expect(topNutritionFoodsMetrics(data, 5)).toEqual([
      { label: 'Burger', value: 530 },
      { label: 'Fruit', value: 95 },
    ])
  })
})

