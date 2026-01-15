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

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
router.post('/mensaje', [IasController, 'mensaje'])
router
  .get('/generate-text', [IasController, 'generateText'])
  .use(middleware.auth({ guards: ['api'] }))
router
  .post('/response-text/:id', [IasController, 'responseText'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register'])
  })
  .prefix('/auth')
