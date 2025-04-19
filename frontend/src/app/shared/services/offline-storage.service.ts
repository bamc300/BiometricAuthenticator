import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private readonly DB_NAME = 'auth-pwa-db';
  private readonly DB_VERSION = 1;
  private readonly USER_STORE = 'users';
  private readonly PENDING_ACTIONS_STORE = 'pendingActions';
  private db: IDBDatabase | null = null;

  constructor() {}

  /**
   * Initialize the IndexedDB database
   */
  init(): Observable<boolean> {
    return from(new Promise<boolean>((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('IndexedDB is not supported in this browser');
        resolve(false);
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject('Could not open IndexedDB');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB opened successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('Creating or upgrading IndexedDB database');

        // Create user store with username as key path
        if (!this.db.objectStoreNames.contains(this.USER_STORE)) {
          const userStore = this.db.createObjectStore(this.USER_STORE, { keyPath: 'username' });
          userStore.createIndex('email', 'email', { unique: true });
          console.log('User store created');
        }

        // Create pending actions store for offline operations
        if (!this.db.objectStoreNames.contains(this.PENDING_ACTIONS_STORE)) {
          const pendingStore = this.db.createObjectStore(this.PENDING_ACTIONS_STORE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Pending actions store created');
        }
      };
    })).pipe(
      catchError(error => {
        console.error('Error initializing IndexedDB:', error);
        return of(false);
      })
    );
  }

  /**
   * Cache user data for offline use
   */
  cacheUserData(user: User): Observable<boolean> {
    if (!this.db) {
      return this.init().pipe(
        tap(initialized => {
          if (!initialized) throw new Error('Failed to initialize IndexedDB');
        }),
        map(() => this.storeUserData(user))
      );
    }

    return of(this.storeUserData(user));
  }

  /**
   * Verify offline credentials
   */
  verifyOfflineCredentials(username: string, password: string): Observable<boolean> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(new Promise<boolean>((resolve) => {
      const transaction = this.db!.transaction([this.USER_STORE], 'readonly');
      const store = transaction.objectStore(this.USER_STORE);
      const request = store.get(username);

      request.onsuccess = () => {
        const userData = request.result;
        if (userData && userData.password === this.hashPassword(password)) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      request.onerror = () => {
        console.error('Error reading user data from IndexedDB');
        resolve(false);
      };
    }));
  }

  /**
   * Verify biometric authentication for offline use
   */
  verifyOfflineBiometric(username: string): Observable<boolean> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(new Promise<boolean>((resolve) => {
      const transaction = this.db!.transaction([this.USER_STORE], 'readonly');
      const store = transaction.objectStore(this.USER_STORE);
      const request = store.get(username);

      request.onsuccess = () => {
        const userData = request.result;
        if (userData && userData.biometricEnabled) {
          // In a real implementation, this would perform device biometric verification
          // For this implementation, we'll use WebAuthn API or simulate it
          
          if ('credentials' in navigator) {
            // Use WebAuthn to verify
            this.verifyWithWebAuthn(username)
              .then(() => resolve(true))
              .catch(() => resolve(false));
          } else {
            // Fallback to simulated verification (e.g., a confirmation dialog)
            const confirmed = window.confirm('Biometric authentication simulation: Press OK to authenticate or Cancel to fail authentication.');
            resolve(confirmed);
          }
        } else {
          resolve(false);
        }
      };

      request.onerror = () => {
        console.error('Error reading user data from IndexedDB');
        resolve(false);
      };
    }));
  }

  /**
   * Get cached user data
   */
  getCachedUser(username: string): Observable<User | null> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(new Promise<User | null>((resolve) => {
      const transaction = this.db!.transaction([this.USER_STORE], 'readonly');
      const store = transaction.objectStore(this.USER_STORE);
      const request = store.get(username);

      request.onsuccess = () => {
        const userData = request.result;
        if (userData) {
          // Omit sensitive fields from the returned data
          const { password, ...user } = userData;
          resolve(user as User);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Error reading user data from IndexedDB');
        resolve(null);
      };
    }));
  }

  /**
   * Queue action for sync when online
   */
  queueActionForSync(action: string, data: any): Observable<boolean> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(new Promise<boolean>((resolve) => {
      const transaction = this.db!.transaction([this.PENDING_ACTIONS_STORE], 'readwrite');
      const store = transaction.objectStore(this.PENDING_ACTIONS_STORE);
      const pendingAction = {
        action,
        data,
        timestamp: new Date().toISOString()
      };

      const request = store.add(pendingAction);

      request.onsuccess = () => {
        console.log('Action queued for sync:', action);
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error queuing action for sync');
        resolve(false);
      };
    }));
  }

  /**
   * Sync offline data when online
   */
  syncOfflineData(): Observable<boolean> {
    if (!navigator.onLine) {
      return of(false);
    }

    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(new Promise<boolean>((resolve) => {
      const transaction = this.db!.transaction([this.PENDING_ACTIONS_STORE], 'readwrite');
      const store = transaction.objectStore(this.PENDING_ACTIONS_STORE);
      const request = store.openCursor();
      let syncCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const pendingAction = cursor.value;
          console.log('Processing sync action:', pendingAction.action);
          
          // Here you would implement the actual sync logic with your API
          // This is a simplistic approach for demo purposes
          
          // After successful sync, remove the pending action
          const deleteRequest = cursor.delete();
          deleteRequest.onsuccess = () => {
            syncCount++;
            console.log('Action synced and removed from queue');
          };
          
          cursor.continue();
        } else {
          console.log(`Synced ${syncCount} pending actions`);
          resolve(true);
        }
      };

      request.onerror = () => {
        console.error('Error syncing offline data');
        resolve(false);
      };
    }));
  }

  /**
   * Private helper to store user data
   */
  private storeUserData(user: User): boolean {
    try {
      const transaction = this.db!.transaction([this.USER_STORE], 'readwrite');
      const store = transaction.objectStore(this.USER_STORE);
      
      // Enhance user object with password field for offline authentication
      // In a real app, this should be securely stored and encrypted
      const userData = {
        ...user,
        password: this.hashPassword(user.username) // This is just a placeholder, not secure
      };
      
      store.put(userData);
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  }

  /**
   * Simple pseudo-hash for demonstration
   * In a real application, use a proper hashing algorithm
   */
  private hashPassword(value: string): string {
    // This is NOT secure - just for demonstration
    return btoa(value + 'salt');
  }

  /**
   * Use WebAuthn API for biometric verification
   * Esta función implementa la autenticación biométrica en dispositivos móviles y de escritorio
   * incluso cuando el dispositivo no tiene configurada una contraseña de sistema operativo
   */
  private async verifyWithWebAuthn(username: string): Promise<boolean> {
    try {
      // Verificamos que WebAuthn esté soportado
      if (!window.PublicKeyCredential) {
        console.error('WebAuthn no está soportado en este navegador');
        throw new Error('WebAuthn not supported');
      }
      
      // Verificamos que haya un autenticador de plataforma disponible (biométrico o PIN)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        console.error('No se encontró autenticador de plataforma (biométrico, Face ID, Touch ID, etc.)');
        throw new Error('Platform authenticator not available');
      }
      
      console.log('Iniciando verificación biométrica para usuario:', username);
      
      // Generamos un desafío aleatorio (normalmente vendría del servidor)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Determinamos si estamos en un dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log('Dispositivo móvil detectado:', isMobile);
      
      // Verificamos primero si el usuario tiene credenciales almacenadas
      const storedCredential = this.getStoredCredentialId(username);
      if (!storedCredential) {
        console.error('No se encontraron credenciales biométricas para este usuario');
        return false;
      }
      
      // Configuramos las opciones de autenticación
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: 'required', // Esto obliga a usar biometría/PIN incluso sin contraseña de dispositivo
        allowCredentials: [{
          id: this.base64ToArrayBuffer(storedCredential),
          type: 'public-key',
          // Tipos de transporte válidos: 'internal', 'usb', 'nfc', 'ble', 'hybrid'
          transports: ['internal'] 
        }]
      };
      
      console.log('Solicitando autenticación biométrica...');
      
      try {
        // Esto activará el diálogo de autenticación biométrica en el dispositivo
        const credential = await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions
        });
        
        console.log('Autenticación biométrica completada con éxito');
        return !!credential;
      } catch (error) {
        console.error('Error durante la verificación biométrica:', error);
        // Si hay un error específico de verificación, lo registramos
        if (error && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError') {
          console.error('Usuario no autorizó la verificación biométrica o falló autenticación');
        }
        return false;
      }
    } catch (error) {
      console.error('Error general durante la configuración biométrica:', error);
      return false;
    }
  }
  
  /**
   * Registra una nueva credencial biométrica para un usuario
   * Esta función permite registrar Face ID, huella digital o PIN del dispositivo
   * incluso cuando el dispositivo no tiene configurada una contraseña de sistema operativo
   */
  public async registerBiometric(username: string, biometricType: string): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      console.error('WebAuthn no está soportado en este navegador');
      return false;
    }
    
    try {
      // Verificamos disponibilidad del autenticador biométrico
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        console.error('Autenticador biométrico no disponible en este dispositivo');
        return false;
      }
      
      // Generamos challenge aleatorio
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Convertimos el nombre de usuario a bytes para usar como ID
      const userId = new TextEncoder().encode(username);
      
      // Determinamos el tipo de autenticador según el dispositivo
      let authenticatorAttachment: AuthenticatorAttachment = 'platform'; // Usa sensor integrado (huella, face ID)
      let userVerification: UserVerificationRequirement = 'required'; // Obliga a usar biometría
      
      // Opciones de creación de credencial
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Auth PWA',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: username,
          displayName: username
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment,
          userVerification,
          requireResidentKey: false
        },
        attestation: 'none'
      };
      
      console.log('Solicitando registro biométrico para:', username);
      console.log('Tipo de biometría seleccionada:', biometricType);
      
      // Esto activará el diálogo para registrar la biometría
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;
      
      if (credential) {
        // Extraemos la información de credencial y la almacenamos
        const credentialId = this.arrayBufferToBase64(credential.rawId);
        this.storeCredentialId(username, credentialId);
        
        console.log('Registro biométrico completado exitosamente');
        return true;
      } else {
        console.error('Falló el registro biométrico - no se obtuvo credencial');
        return false;
      }
    } catch (error) {
      console.error('Error durante el registro biométrico:', error);
      // Errores específicos para informar al usuario
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'NotAllowedError') {
          console.error('Usuario rechazó el registro biométrico');
        } else if (error.name === 'NotSupportedError') {
          console.error('Método biométrico no soportado en este dispositivo');
        }
      }
      return false;
    }
  }
  
  /**
   * Almacena el ID de credencial biométrica para un usuario
   */
  private storeCredentialId(username: string, credentialId: string): void {
    try {
      // Intentamos abrir la base de datos
      const openRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      openRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.USER_STORE], 'readwrite');
        const store = transaction.objectStore(this.USER_STORE);
        
        // Primero obtenemos el usuario actual
        const getRequest = store.get(username);
        
        getRequest.onsuccess = () => {
          const userData = getRequest.result;
          if (userData) {
            // Actualizamos los datos biométricos
            userData.biometricCredentialId = credentialId;
            // Guardamos el usuario actualizado
            store.put(userData);
            console.log('Credencial biométrica almacenada para usuario:', username);
          } else {
            console.error('No se encontró el usuario para almacenar credencial biométrica');
          }
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      };
      
      openRequest.onerror = (error) => {
        console.error('Error al abrir la base de datos para almacenar credencial:', error);
      };
    } catch (error) {
      console.error('Error al almacenar credencial biométrica:', error);
    }
  }
  
  /**
   * Obtiene el ID de credencial biométrica para un usuario
   */
  private getStoredCredentialId(username: string): string | null {
    // Esta es una implementación síncrona simplificada 
    // para mantener compatible con la verificación biométrica
    try {
      // Intentamos recuperar desde localStorage como fallback temporal
      const userDataJson = localStorage.getItem(`user_${username}`);
      if (userDataJson) {
        const userData = JSON.parse(userDataJson);
        return userData.biometricCredentialId || null;
      }
    } catch (error) {
      console.error('Error al recuperar credencial biométrica:', error);
    }
    return null;
  }
  
  /**
   * Funciones auxiliares para convertir entre ArrayBuffer y Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
