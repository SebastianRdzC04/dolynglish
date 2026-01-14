/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const IasController = () => import('#controllers/ias_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
router.post('/mensaje', [IasController, 'mensaje'])
router.get('/generate-text', [IasController, 'generateText'])
