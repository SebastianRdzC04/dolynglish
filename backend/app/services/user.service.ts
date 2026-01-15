import User from '#models/user'
import { createUserValidator, updateUserValidator } from '#validators/user'
import { Infer } from '@vinejs/vine/types'
import { inject } from '@adonisjs/core'
import UserRepository from '../repository/user.repository.js'

type CreateUserPayload = Infer<typeof createUserValidator>
type UpdateUserPayload = Infer<typeof updateUserValidator>

@inject()
export default class UsersService {
  constructor(private repository: UserRepository) {}

  async findOne(id: User['id']) {
    return this.repository.findOne(id)
  }

  async getByEmail(email: User['email']) {
    return this.repository.getByEmail(email)
  }

  async findAll() {
    return this.repository.findAll()
  }

  async getPaginated(page: number, limit: number) {
    return this.repository.getPaginated(page, limit)
  }

  async create(payload: CreateUserPayload) {
    return this.repository.create(payload)
  }

  async update(id: User['id'], payload: UpdateUserPayload) {
    return this.repository.update(id, payload)
  }

  async delete(id: User['id']) {
    return this.repository.delete(id)
  }

  async restore(id: User['id']) {
    return this.repository.restore(id)
  }
}
