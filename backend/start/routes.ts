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

const IasController = () => import('#controllers/ias_controller')
const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/user_controller')

// Health check
router.get('/', async () => {
  return {
    message: 'Dolynglish API is running',
    data: {
      version: '1.0.0',
      status: 'healthy',
    },
  }
})

// Endpoint de prueba de IA (sin autenticación)
router.post('/mensaje', [IasController, 'mensaje'])

// Rutas de autenticación
router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register'])
  })
  .prefix('/auth')

// Opciones de generación (público, sin autenticación)
router.get('/readings/options', [IasController, 'getGenerationOptions'])

// Rutas de perfil de usuario
router
  .group(() => {
    // Perfil del usuario autenticado
    router.get('/profile', [UserController, 'getProfile'])

    // Datos de racha del usuario
    // Query params: days (opcional, default 10, max 30)
    router.get('/streak', [UserController, 'getStreak'])

    // Perfil completo con streak (combinado para optimizar requests)
    router.get('/me', [UserController, 'getMe'])
  })
  .prefix('/user')
  .use(middleware.auth({ guards: ['api'] }))

// Rutas protegidas de lecturas
router
  .group(() => {
    // Generar nuevo texto de lectura
    // Query params opcionales: category, size, timePeriod, seed
    router.post('/generate', [IasController, 'generateText'])

    // Obtener lecturas pendientes del usuario
    router.get('/pending', [IasController, 'getPendingReadings'])

    // Obtener lecturas completadas del usuario
    router.get('/completed', [IasController, 'getCompletedReadings'])

    // Obtener una lectura específica
    router.get('/:id', [IasController, 'getReading'])

    // Enviar respuesta de comprensión para evaluación
    router.post('/:id/evaluate', [IasController, 'responseText'])
  })
  .prefix('/readings')
  .use(middleware.auth({ guards: ['api'] }))

// Mantener rutas legacy para compatibilidad (deprecated)
router
  .get('/generate-text', [IasController, 'generateText'])
  .use(middleware.auth({ guards: ['api'] }))
router
  .post('/response-text/:id', [IasController, 'responseText'])
  .use(middleware.auth({ guards: ['api'] }))
