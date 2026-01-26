/**
 * Abstracción de almacenamiento seguro
 * Maneja la diferencia entre plataformas (mobile vs web)
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Interfaz para el servicio de almacenamiento
 */
export interface IStorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

/**
 * Servicio de almacenamiento seguro
 * - En móvil: usa expo-secure-store (encriptado)
 * - En web: usa localStorage (no encriptado pero funcional)
 */
class SecureStorageService implements IStorageService {
  private isWeb = Platform.OS === 'web';

  /**
   * Obtiene un valor del almacenamiento
   */
  async getItem(key: string): Promise<string | null> {
    if (this.isWeb) {
      return this.getWebItem(key);
    }
    return SecureStore.getItemAsync(key);
  }

  /**
   * Guarda un valor en el almacenamiento
   */
  async setItem(key: string, value: string): Promise<void> {
    if (this.isWeb) {
      return this.setWebItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  }

  /**
   * Elimina un valor del almacenamiento
   */
  async deleteItem(key: string): Promise<void> {
    if (this.isWeb) {
      return this.deleteWebItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  }

  // Métodos privados para web
  private getWebItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      console.warn('localStorage not available');
    }
    return null;
  }

  private setWebItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      console.warn('localStorage not available');
    }
  }

  private deleteWebItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      console.warn('localStorage not available');
    }
  }
}

/**
 * Instancia singleton del servicio de almacenamiento
 */
export const secureStorage = new SecureStorageService();
