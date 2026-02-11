import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

test.group('Auth | register + login + me + logout', (group) => {
  group.each.setup(async () => {
    await db.from('access_tokens').delete()
    await db.from('readings').delete()
    await db.from('users').delete()
  })

  test('register creates a new user and returns token', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    response.assertStatus(200)
    assert.properties(response.body(), ['token', 'user'])
    assert.equal(response.body().user.email, 'test@example.com')
  })

  test('register rejects duplicate email', async ({ client }) => {
    await User.create({
      fullName: 'Existing',
      email: 'dup@example.com',
      password: 'password123',
    })

    const response = await client.post('/auth/register').json({
      fullName: 'Another',
      email: 'dup@example.com',
      password: 'password123',
    })

    response.assertStatus(400)
  })

  test('login returns token for valid credentials', async ({ client, assert }) => {
    await User.create({
      fullName: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    })

    const response = await client.post('/auth/login').json({
      email: 'login@example.com',
      password: 'password123',
    })

    response.assertStatus(200)
    assert.properties(response.body(), ['token', 'user'])
  })

  test('login rejects invalid credentials', async ({ client }) => {
    await User.create({
      fullName: 'Login User',
      email: 'login2@example.com',
      password: 'password123',
    })

    const response = await client.post('/auth/login').json({
      email: 'login2@example.com',
      password: 'wrongpassword',
    })

    response.assertStatus(401)
  })

  test('GET /auth/me returns authenticated user profile', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Me User',
      email: 'me@example.com',
      password: 'password123',
    })

    const token = await User.accessTokens.create(user)

    const response = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${token.value!.release()}`)

    response.assertStatus(200)
    assert.equal(response.body().data.email, 'me@example.com')
  })

  test('GET /auth/me rejects unauthenticated request', async ({ client }) => {
    const response = await client.get('/auth/me')

    response.assertStatus(401)
  })

  test('POST /auth/logout revokes the token', async ({ client }) => {
    const user = await User.create({
      fullName: 'Logout User',
      email: 'logout@example.com',
      password: 'password123',
    })

    const token = await User.accessTokens.create(user)
    const bearerToken = token.value!.release()

    const logoutResponse = await client
      .post('/auth/logout')
      .header('Authorization', `Bearer ${bearerToken}`)

    logoutResponse.assertStatus(200)

    // Token should no longer be valid
    const meResponse = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${bearerToken}`)

    meResponse.assertStatus(401)
  })
})
