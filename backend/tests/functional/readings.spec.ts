import { test } from '@japa/runner'
import User from '#models/user'
import Reading from '#models/reading'
import db from '@adonisjs/lucid/services/db'

test.group('Readings | CRUD operations', (group) => {
  let user: User
  let bearerToken: string

  group.setup(async () => {
    await db.from('access_tokens').delete()
    await db.from('readings').delete()
    await db.from('users').delete()

    user = await User.create({
      fullName: 'Reading User',
      email: 'reading@example.com',
      password: 'password123',
    })

    const token = await User.accessTokens.create(user)
    bearerToken = token.value!.release()
  })

  group.each.setup(async () => {
    // Clean readings between tests but keep the user
    await db.from('readings').delete()
  })

  test('GET /readings/options returns generation options without auth', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/readings/options')

    response.assertStatus(200)
    assert.properties(response.body(), ['message', 'data'])
  })

  test('GET /readings/pending returns empty list for new user', async ({ client, assert }) => {
    const response = await client
      .get('/readings/pending')
      .header('Authorization', `Bearer ${bearerToken}`)

    response.assertStatus(200)
    assert.equal(response.body().data.pendingCount, 0)
    assert.isArray(response.body().data.readings)
  })

  test('GET /readings/pending rejects unauthenticated request', async ({ client }) => {
    const response = await client.get('/readings/pending')

    response.assertStatus(401)
  })

  test('GET /readings/completed returns empty list for new user', async ({ client, assert }) => {
    const response = await client
      .get('/readings/completed')
      .header('Authorization', `Bearer ${bearerToken}`)

    response.assertStatus(200)
    assert.equal(response.body().data.count, 0)
    assert.isArray(response.body().data.readings)
  })

  test('GET /readings/:id returns a specific reading', async ({ client, assert }) => {
    const reading = await Reading.create({
      userId: user.id,
      title: 'Test Reading',
      description: 'A test reading',
      content: 'Content of the test reading for testing purposes.',
      category: 'technology',
      difficulty: 'easy',
      wordCount: 8,
      status: 'pending',
    })

    const response = await client
      .get(`/readings/${reading.id}`)
      .header('Authorization', `Bearer ${bearerToken}`)

    response.assertStatus(200)
    assert.equal(response.body().data.id, reading.id)
    assert.equal(response.body().data.title, 'Test Reading')
  })

  test('GET /readings/:id returns 404 for non-existent reading', async ({ client }) => {
    const response = await client
      .get('/readings/99999')
      .header('Authorization', `Bearer ${bearerToken}`)

    response.assertStatus(404)
  })

  test('GET /readings/:id returns 403 for another user reading', async ({ client }) => {
    const otherUser = await User.create({
      fullName: 'Other',
      email: 'other@example.com',
      password: 'password123',
    })

    const reading = await Reading.create({
      userId: otherUser.id,
      title: 'Other Reading',
      description: 'Not yours',
      content: 'This belongs to someone else.',
      category: 'history',
      difficulty: 'medium',
      wordCount: 6,
      status: 'pending',
    })

    const response = await client
      .get(`/readings/${reading.id}`)
      .header('Authorization', `Bearer ${bearerToken}`)

    response.assertStatus(403)
  })

  test('DELETE /readings/:id soft-deletes a pending reading with 204', async ({
    client,
    assert,
  }) => {
    const reading = await Reading.create({
      userId: user.id,
      title: 'To Delete',
      description: 'Will be deleted',
      content: 'Content to delete.',
      category: 'education',
      difficulty: 'easy',
      wordCount: 3,
      status: 'pending',
    })

    const response = await client
      .delete(`/readings/${reading.id}`)
      .header('Authorization', `Bearer ${bearerToken}`)

    response.assertStatus(204)

    // Verify it's soft-deleted (not returned in pending)
    const pendingResponse = await client
      .get('/readings/pending')
      .header('Authorization', `Bearer ${bearerToken}`)

    assert.equal(pendingResponse.body().data.pendingCount, 0)
  })

  test('DELETE /readings/:id returns 404 for non-existent reading', async ({ client }) => {
    const response = await client
      .delete('/readings/99999')
      .header('Authorization', `Bearer ${bearerToken}`)

    response.assertStatus(404)
  })
})

test.group('Readings | Validation', (group) => {
  let bearerToken: string

  group.setup(async () => {
    await db.from('access_tokens').delete()
    await db.from('readings').delete()
    await db.from('users').delete()

    const user = await User.create({
      fullName: 'Validation User',
      email: 'validate@example.com',
      password: 'password123',
    })

    const token = await User.accessTokens.create(user)
    bearerToken = token.value!.release()
  })

  test('POST /readings/:id/evaluate rejects empty body', async ({ client }) => {
    const user = await User.findByOrFail('email', 'validate@example.com')
    const reading = await Reading.create({
      userId: user.id,
      title: 'Eval Test',
      description: 'For evaluation',
      content: 'Content to evaluate.',
      category: 'technology',
      difficulty: 'easy',
      wordCount: 3,
      status: 'pending',
    })

    const response = await client
      .post(`/readings/${reading.id}/evaluate`)
      .header('Authorization', `Bearer ${bearerToken}`)
      .json({})

    response.assertStatus(422)
  })

  test('POST /readings/:id/evaluate rejects when reading is already completed', async ({
    client,
  }) => {
    const user = await User.findByOrFail('email', 'validate@example.com')
    const reading = await Reading.create({
      userId: user.id,
      title: 'Already Done',
      description: 'Already completed',
      content: 'Already evaluated content.',
      category: 'technology',
      difficulty: 'easy',
      wordCount: 3,
      status: 'completed',
      score: 90,
      passed: true,
    })

    const response = await client
      .post(`/readings/${reading.id}/evaluate`)
      .header('Authorization', `Bearer ${bearerToken}`)
      .json({ userResponse: 'My understanding of the text' })

    response.assertStatus(400)
  })
})
