import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import User from '#models/user'
import Texto from '#models/texto'
import type {
  StreakDay,
  StreakResponse,
  StreakUpdateResult,
  StreakEvaluationData,
} from '../types/streak.js'

@inject()
export default class StreakService {
  /**
   * Obtiene los datos de racha completos de un usuario
   * @param userId - ID del usuario
   * @param historyDays - Número de días de historial a devolver (default 10)
   */
  async getStreakData(userId: number, historyDays: number = 10): Promise<StreakResponse> {
    const user = await User.find(userId)
    if (!user) {
      return {
        currentStreak: 0,
        todayCompleted: false,
        lastActivityDate: null,
        history: this.generateEmptyHistory(historyDays),
      }
    }

    const history = await this.calculateHistory(userId, historyDays)
    const todayCompleted = history.length > 0 && history[0].completed

    return {
      currentStreak: user.currentStreak ?? 0,
      todayCompleted,
      lastActivityDate: user.lastStreakDate?.toISODate() ?? null,
      history,
    }
  }

  /**
   * Actualiza la racha después de una evaluación exitosa (passed = true)
   * @param userId - ID del usuario
   * @returns Resultado de la actualización de racha
   */
  async updateStreakOnPass(userId: number): Promise<StreakUpdateResult> {
    const user = await User.find(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }

    const today = DateTime.now().startOf('day')
    const todayDate = today.toISODate()!
    const previousStreak = user.currentStreak ?? 0
    const lastStreakDate = user.lastStreakDate?.startOf('day')

    // Si ya completó hoy, no actualizar la racha
    if (lastStreakDate && lastStreakDate.toISODate() === todayDate) {
      return {
        previousStreak,
        newStreak: previousStreak,
        streakBroken: false,
        streakExtended: false,
        firstCompletionToday: false,
      }
    }

    let newStreak: number
    let streakBroken = false
    let streakExtended = false

    if (!lastStreakDate) {
      // Primera vez que completa un texto
      newStreak = 1
      streakExtended = true
    } else {
      const daysDiff = today.diff(lastStreakDate, 'days').days

      if (daysDiff <= 1) {
        // Completó ayer (daysDiff === 1) - extender racha
        newStreak = previousStreak + 1
        streakExtended = true
      } else {
        // Más de un día sin completar, racha rota
        newStreak = 1
        streakBroken = true
      }
    }

    // Actualizar usuario
    user.currentStreak = newStreak
    user.lastStreakDate = today
    await user.save()

    return {
      previousStreak,
      newStreak,
      streakBroken,
      streakExtended,
      firstCompletionToday: true,
    }
  }

  /**
   * Obtiene datos de streak para incluir en respuesta de evaluación
   */
  async getStreakEvaluationData(userId: number): Promise<StreakEvaluationData> {
    const user = await User.find(userId)
    const today = DateTime.now().startOf('day')

    if (!user) {
      return {
        currentStreak: 0,
        streakExtended: false,
        todayCompleted: false,
      }
    }

    const todayCompleted =
      user.lastStreakDate?.startOf('day').toISODate() === today.toISODate()

    return {
      currentStreak: user.currentStreak ?? 0,
      streakExtended: todayCompleted, // Se acaba de extender si completó hoy
      todayCompleted,
    }
  }

  /**
   * Calcula el historial de los últimos N días
   * @param userId - ID del usuario
   * @param days - Número de días a incluir
   */
  private async calculateHistory(userId: number, days: number): Promise<StreakDay[]> {
    const today = DateTime.now().startOf('day')
    const startDate = today.minus({ days: days - 1 })

    // Obtener textos completados exitosamente en el rango de fechas
    const completedTexts = await Texto.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .where('passed', true)
      .whereNull('deleted_at')
      .where('updated_at', '>=', startDate.toSQL())
      .orderBy('updated_at', 'desc')

    // Agrupar por fecha
    const completionsByDate = new Map<string, number>()

    for (const texto of completedTexts) {
      const dateKey = texto.updatedAt.startOf('day').toISODate()!
      const current = completionsByDate.get(dateKey) ?? 0
      completionsByDate.set(dateKey, current + 1)
    }

    // Generar historial para los últimos N días
    const history: StreakDay[] = []

    for (let i = 0; i < days; i++) {
      const date = today.minus({ days: i })
      const dateKey = date.toISODate()!
      const textsCompleted = completionsByDate.get(dateKey) ?? 0

      history.push({
        date: dateKey,
        completed: textsCompleted > 0,
        textsCompleted,
      })
    }

    return history
  }

  /**
   * Genera un historial vacío para los últimos N días
   */
  private generateEmptyHistory(days: number): StreakDay[] {
    const today = DateTime.now().startOf('day')
    const history: StreakDay[] = []

    for (let i = 0; i < days; i++) {
      const date = today.minus({ days: i })
      history.push({
        date: date.toISODate()!,
        completed: false,
        textsCompleted: 0,
      })
    }

    return history
  }
}
