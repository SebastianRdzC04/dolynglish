import vine from '@vinejs/vine'

export const userIdParamValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)

export const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(2).maxLength(100),
    email: vine.string().email(),
    password: vine.string().minLength(6).maxLength(100),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(2).maxLength(100).optional(),
    email: vine.string().email().optional(),
    roleId: vine.number().positive().optional(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(6).maxLength(100),
    newPassword: vine.string().minLength(6).maxLength(100),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)
