import User from '#models/user'
import { createUserValidator, updateUserValidator } from '#validators/user'
import { Infer } from '@vinejs/vine/types'

type CreateUserPayload = Infer<typeof createUserValidator>
type UpdateUserPayload = Infer<typeof updateUserValidator>

export default class UserRepository {
  async findOne(id: User['id']): Promise<User | null> {
    return User.query().where('id', id).whereNull('deleted_at').first()
  }

  async getByEmail(email: User['email']): Promise<User | null> {
    return User.query().where('email', email).whereNull('deleted_at').first()
  }

  async findAll(): Promise<User[]> {
    return User.query().whereNull('deleted_at')
  }

  async getPaginated(page: number, limit: number) {
    return User.query().whereNull('deleted_at').paginate(page, limit)
  }

  async create(payload: CreateUserPayload): Promise<User> {
    return User.create(payload)
  }

  async update(id: User['id'], payload: UpdateUserPayload): Promise<User | null> {
    const user = await User.query().where('id', id).whereNull('deleted_at').first()
    if (!user) return null
    user.merge(payload)
    await user.save()
    return user
  }

  async delete(id: User['id']): Promise<boolean> {
    const user = await User.query().where('id', id).whereNull('deleted_at').first()
    if (!user) return false
    await user.delete()
    return true
  }

  async restore(id: User['id']): Promise<User | null> {
    const user = await User.query().where('id', id).whereNotNull('deleted_at').first()
    if (!user) return null
    user.deletedAt = null
    await user.save()
    return user
  }
}
