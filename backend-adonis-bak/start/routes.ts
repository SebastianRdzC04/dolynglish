/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/user_controller')
const ReadingsController = () => import('#controllers/readings_controller')
const ExplanationsController = () => import('#controllers/explanations_controller')
const IasController = () => import('#controllers/ias_controller')

// ── Health check ────────────────────────────────────────────────────────────
router.get('/', async () => {
  return {
    message: 'Dolynglish API is running',
    data: {
      version: '1.0.0',
      status: 'healthy',
    },
  }
})

// ── Authentication ──────────────────────────────────────────────────────────
router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register'])
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth({ guards: ['api'] }))
    router.get('/me', [AuthController, 'me']).use(middleware.auth({ guards: ['api'] }))
  })
  .prefix('/auth')

// ── Generation options (public, no auth) ────────────────────────────────────
router.get('/readings/options', [ReadingsController, 'options'])

// ── User profile ────────────────────────────────────────────────────────────
router
  .group(() => {
    router.get('/profile', [UserController, 'getProfile'])
    router.get('/streak', [UserController, 'getStreak'])
    router.get('/me', [UserController, 'getMe'])
  })
  .prefix('/user')
  .use(middleware.auth({ guards: ['api'] }))

// ── Readings (protected) ───────────────────────────────────────────────────
router
  .group(() => {
    // Generate a new reading (body JSON: category, size, difficulty, timePeriod, seed)
    router.post('/', [ReadingsController, 'store'])

    // List pending readings
    router.get('/pending', [ReadingsController, 'pending'])

    // List completed readings
    router.get('/completed', [ReadingsController, 'completed'])

    // Get a single reading
    router.get('/:id', [ReadingsController, 'show'])

    // Soft-delete a pending reading → 204
    router.delete('/:id', [ReadingsController, 'destroy'])

    // Submit comprehension response for evaluation
    router.post('/:id/evaluate', [ReadingsController, 'evaluate'])

    // Explain a text selection in context
    router.post('/:id/explanations', [ExplanationsController, 'store'])
  })
  .prefix('/readings')
  .use(middleware.auth({ guards: ['api'] }))

// ── Test / debug endpoints ──────────────────────────────────────────────────
// These are NOT used by the production app. Grouped under /test for clarity.
router
  .group(() => {
    router.post('/mensaje', [IasController, 'mensaje'])

    // Legacy aliases that point to the real controllers (kept for manual testing)
    router.get('/generate-text', [ReadingsController, 'store'])
    router.post('/response-text/:id', [ReadingsController, 'evaluate'])
  })
  .prefix('/test')
  .use(middleware.auth({ guards: ['api'] }))
