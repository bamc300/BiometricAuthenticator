import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  
  constructor() { }

  /**
   * Verifica si el dispositivo soporta autenticación biométrica mediante WebAuthn
   * Esta implementación es más flexible y funciona en más navegadores y dispositivos
   */
  public isBiometricSupported(): Observable<boolean> {
    // Si la API no está disponible, no hay soporte
    if (!window.PublicKeyCredential) {
      console.log('WebAuthn API no disponible en este navegador');
      return of(false);
    }
    
    // Verificamos si hay un autenticador de plataforma disponible
    // Este método verifica sensores de huella, FaceID, Windows Hello, etc.
    return from(PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
      .pipe(
        map(available => {
          console.log('Autenticador de plataforma biométrica disponible:', available);
          return available;
        }),
        catchError(error => {
          console.error('Error al verificar soporte biométrico:', error);
          // En caso de error, asumimos que hay soporte para permitir el intento
          return of(true);
        })
      );
  }

  /**
   * Registra una nueva credencial biométrica
   * @param username Nombre de usuario
   * @param displayName Nombre para mostrar
   */
  public registerCredential(username: string, displayName: string = ''): Observable<{ credentialId: string }> {
    if (!window.PublicKeyCredential) {
      return of({ credentialId: '' }).pipe(
        catchError(() => of({ credentialId: '' }))
      );
    }
    
    // Generamos challenge aleatorio (normalmente debería venir del servidor)
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    // Convertimos el nombre de usuario a bytes para usar como ID
    const userId = new TextEncoder().encode(username);
    
    const createCredentialOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Auth PWA',
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: username,
        displayName: displayName || username
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // 'platform' usa sensores del dispositivo, 'cross-platform' usa llaves USB/NFC
        userVerification: 'preferred', // 'preferred' es más flexible que 'required'
        requireResidentKey: false
      }
    };
    
    // Intentamos crear la credencial
    return from(navigator.credentials.create({
      publicKey: createCredentialOptions
    })).pipe(
      map((credential: any) => {
        if (!credential) {
          throw new Error('Credencial no creada');
        }
        
        // Extraemos el ID de la credencial y lo convertimos a base64
        const credentialId = this.arrayBufferToBase64(credential.rawId);
        console.log('Credencial biométrica registrada:', credentialId);
        
        // En una implementación real, estos datos se enviarían al servidor
        return { credentialId };
      }),
      catchError(error => {
        console.error('Error al registrar credencial biométrica:', error);
        throw error;
      })
    );
  }
  
  /**
   * Verifica una credencial biométrica existente
   * @param username Nombre de usuario
   * @param credentialId ID de la credencial almacenada
   */
  public verifyCredential(username: string, credentialId: string): Observable<boolean> {
    if (!window.PublicKeyCredential || !credentialId) {
      return of(false);
    }
    
    // Generamos challenge aleatorio (normalmente debería venir del servidor)
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    const getCredentialOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      userVerification: 'preferred', // 'preferred' es más flexible que 'required'
      allowCredentials: [{
        id: this.base64ToArrayBuffer(credentialId),
        type: 'public-key',
        transports: ['internal', 'ble', 'nfc', 'usb'] // Soportamos múltiples transportes
      }]
    };
    
    // Intentamos verificar la credencial
    return from(navigator.credentials.get({
      publicKey: getCredentialOptions
    })).pipe(
      map(credential => {
        if (!credential) {
          return false;
        }
        console.log('Verificación biométrica exitosa');
        return true;
      }),
      catchError(error => {
        console.error('Error al verificar credencial biométrica:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Verifica si el navegador actual está en modo incógnito/privado
   */
  public isIncognitoMode(): Observable<boolean> {
    return new Observable(observer => {
      // Método simplificado para detectar modo incógnito
      try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
        observer.next(false); // No es incógnito
      } catch (e) {
        observer.next(true); // Es incógnito
      } finally {
        observer.complete();
      }
    });
  }
  
  /**
   * Convierte un ArrayBuffer a string base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  /**
   * Convierte un string base64 a ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}