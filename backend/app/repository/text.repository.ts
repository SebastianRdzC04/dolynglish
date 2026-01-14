import Texto from '#models/texto'
import User from '#models/user'

export default class TextRepository {
  async createText(userId: User['id'], texto: string): Promise<Texto> {
    const text = new Texto()
    text.userId = userId
    text.texto = texto
    await text.save()
    return text
  }

  async getById(id: Texto['id']): Promise<Texto | null> {
    // obtener texto por id verificando que el delete at sea null
    return Texto.query().where('id', id).whereNull('deleted_at').first()
  }

  async getAllByUserId(userId: User['id']): Promise<Texto[]> {
    return Texto.query().where('user_id', userId).whereNull('deleted_at')
  }
}
