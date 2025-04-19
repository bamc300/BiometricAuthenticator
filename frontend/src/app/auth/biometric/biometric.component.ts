import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { OfflineStorageService } from '../../shared/services/offline-storage.service';
import { BiometricService } from '../../shared/services/biometric.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-biometric',
  templateUrl: './biometric.component.html',
  styleUrls: ['./biometric.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class BiometricComponent implements OnInit {
  username: string = '';
  returnUrl: string = '/dashboard';
  action: string = 'verify'; // 'verify' or 'enroll'
  loading: boolean = false;
  error: string = '';
  success: string = '';
  isOffline: boolean = !navigator.onLine;
  biometricSupported: boolean = false;
  isBiometricMismatch: boolean = false;
  biometricOptions: string[] = ['fingerprint', 'face', 'device-password'];
  selectedBiometricOption: string = 'fingerprint';
  isExplicitVerification: boolean = false;
  storedBiometricId: string = '';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private offlineStorageService: OfflineStorageService,
    private biometricService: BiometricService
  ) {}

  ngOnInit(): void {
    // Get parameters from the route
    this.route.queryParams.subscribe(params => {
      this.username = params['username'] || '';
      this.returnUrl = params['returnUrl'] || '/dashboard';
      this.action = params['action'] || 'verify';
      this.isOffline = params['offline'] === 'true' || !navigator.onLine;
    });
    
    // Comprobar si hay biometría almacenada para este usuario
    if (this.username && window.localStorage) {
      try {
        const storedId = localStorage.getItem(`biometric_${this.username}`);
        if (storedId) {
          this.storedBiometricId = storedId;
          console.log('Credencial biométrica encontrada para:', this.username);
        }
      } catch (e) {
        console.error('Error al acceder a almacenamiento local:', e);
      }
    }
    
    // Verificar soporte de biometría usando el nuevo servicio
    this.biometricService.isBiometricSupported().subscribe(supported => {
      this.biometricSupported = supported;
      console.log('Soporte biométrico detectado:', supported);
      
      // Ajustar opciones biométricas según el dispositivo
      this.determineBiometricType();
      
      // Si no se detecta soporte pero estamos en un dispositivo móvil o moderno,
      // forzamos a true para permitir el intento (muchos dispositivos reportan false incorrectamente)
      if (!supported) {
        const isMobileOrModern = /iPhone|iPad|iPod|Android/.test(navigator.userAgent) || 
                               (/Chrome/.test(navigator.userAgent) && parseInt((/Chrome\/([0-9]+)/.exec(navigator.userAgent) || ['', '0'])[1]) >= 89);
        
        if (isMobileOrModern) {
          console.log('Forzando soporte biométrico para dispositivo móvil o navegador moderno');
          this.biometricSupported = true;
        }
      }
    });
    
    // Configurar escucha de eventos online/offline
    window.addEventListener('online', () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);
  }
  
  /**
   * Determina el tipo de biometría disponible en el dispositivo
   */
  private determineBiometricType(): void {
    // En dispositivos móviles, determinamos el tipo de autenticación típico
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // iOS generalmente usa Face ID en modelos recientes o Touch ID en modelos más antiguos
      if (
        navigator.userAgent.includes('iPhone X') || 
        navigator.userAgent.includes('iPhone 11') ||
        navigator.userAgent.includes('iPhone 12') ||
        navigator.userAgent.includes('iPhone 13') ||
        navigator.userAgent.includes('iPhone 14') ||
        navigator.userAgent.includes('iPhone 15') ||
        parseInt(navigator.userAgent.match(/iPhone OS (\d+)_/)?.[1] || '0') >= 12
      ) {
        this.selectedBiometricOption = 'face'; // Probablemente Face ID
      } else {
        this.selectedBiometricOption = 'fingerprint'; // Probablemente Touch ID
      }
    } else if (/Android/.test(navigator.userAgent)) {
      // Android típicamente usa huella digital o desbloqueo facial
      this.selectedBiometricOption = 'fingerprint'; // Por defecto en Android
    } else if (/Windows/.test(navigator.userAgent)) {
      // En Windows podría ser Windows Hello (facial, huella o PIN)
      this.selectedBiometricOption = 'face'; // Windows Hello facial 
    } else if (/Mac/.test(navigator.userAgent)) {
      // MacOS usa Touch ID en modelos recientes
      this.selectedBiometricOption = 'fingerprint'; // Touch ID
    } else {
      // En otros dispositivos, usamos contraseña del dispositivo
      this.selectedBiometricOption = 'device-password';
    }
  }

  verifyBiometric(): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    this.isExplicitVerification = true;
    this.isBiometricMismatch = false;
    
    if (this.isOffline) {
      this.performOfflineBiometricVerification();
    } else {
      this.performOnlineBiometricVerification();
    }
  }
  
  enrollBiometric(): void {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    // Validamos que tengamos un nombre de usuario
    if (!this.username) {
      this.loading = false;
      this.error = 'Se requiere un nombre de usuario para registrar la autenticación biométrica.';
      return;
    }
    
    console.log('Iniciando registro biométrico para:', this.username);
    console.log('Tipo de biometría seleccionada:', this.selectedBiometricOption);
    
    // Usamos el servicio biométrico mejorado para registrar las credenciales
    this.biometricService.registerCredential(this.username, this.username)
      .subscribe({
        next: (result) => {
          if (result && result.credentialId) {
            // Guardamos el ID de credencial en localStorage
            try {
              localStorage.setItem(`biometric_${this.username}`, result.credentialId);
              this.storedBiometricId = result.credentialId;
              
              this.loading = false;
              this.success = '¡Autenticación biométrica registrada con éxito!';
              console.log('Credencial biométrica registrada exitosamente');
              
              // También notificamos al backend si estamos online
              if (navigator.onLine) {
                this.authService.enrollBiometric(this.username, this.selectedBiometricOption).subscribe({
                  next: (response) => {
                    console.log('Inscripción biométrica sincronizada con el servidor');
                  },
                  error: (err) => {
                    console.error('Error al sincronizar inscripción biométrica con el servidor:', err);
                    // No mostramos error al usuario ya que el registro local fue exitoso
                  }
                });
              }
              
              // Redirigir al login después de registro exitoso
              setTimeout(() => {
                this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
              }, 2000);
            } catch (e) {
              console.error('Error al guardar credencial biométrica:', e);
              this.error = 'Error al guardar la información biométrica localmente.';
              this.loading = false;
            }
          } else {
            this.loading = false;
            this.error = 'No se pudo completar el registro biométrico. No se generó una credencial válida.';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error durante el registro biométrico:', error);
          
          // Ofrecemos mensajes de error específicos para mejorar la experiencia de usuario
          if (error.name === 'NotAllowedError') {
            this.error = 'No autorizó el uso del sensor biométrico o canceló la operación.';
          } else if (error.name === 'SecurityError') {
            this.error = 'Error de seguridad. Asegúrese de estar usando HTTPS.';
          } else if (error.name === 'NotSupportedError') {
            this.error = 'Su dispositivo no soporta el tipo de autenticación biométrica seleccionado.';
          } else if (typeof error === 'string') {
            this.error = error;
          } else {
            this.error = 'Error al registrar la autenticación biométrica: ' + (error.message || 'Error desconocido');
          }
        }
      });
  }
  
  /**
   * Intenta determinar la razón específica por la que la autenticación biométrica no está disponible
   */
  private async checkBiometricAvailabilityReason(): Promise<string> {
    // Verificamos si estamos en modo incógnito/privado mediante otro método
    try {
      // Esta función usa un método alternativo para detectar modo incógnito
      // sin depender de RequestFileSystem
      const detectIncognito = async (): Promise<boolean> => {
        // Intentamos escribir en localStorage como prueba
        try {
          localStorage.setItem('test', '1');
          localStorage.removeItem('test');
          return false; // Si podemos escribir, no estamos en incógnito
        } catch (e) {
          return true; // Si hay error al escribir, probablemente estamos en incógnito
        }
      };
      
      const isIncognito = await detectIncognito();
      if (isIncognito) {
        return 'incognito';
      }
    } catch (e) {
      console.log('Error al detectar modo incógnito:', e);
    }
    
    // Verificamos si es un dispositivo móvil sin sensores biométricos configurados
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // En iOS podemos intentar verificar si hay Face ID o Touch ID
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Verificamos si es un modelo iPhone X o superior (probablemente tiene Face ID)
        if (/iPhone X|iPhone 1[1-9]/i.test(navigator.userAgent)) {
          return 'not-configured'; // Probablemente tiene Face ID pero no está configurado
        }
        return 'not-configured'; // Probablemente tiene Touch ID pero no está configurado
      }
      
      // Para Android asumimos que tiene sensor pero no está configurado
      if (/Android/i.test(navigator.userAgent)) {
        return 'not-configured';
      }
    }
    
    // Si no podemos determinar específicamente, devolvemos 'no-sensors'
    return 'no-sensors';
  }
  
  private performOnlineBiometricVerification(): void {
    this.authService.verifyBiometric(this.username).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Biometric verification successful!';
        
        // Set auth token from the response
        this.authService.setAuthToken(response.token);
        
        // Cache user data for offline use
        if (response.user) {
          this.offlineStorageService.cacheUserData(response.user);
        }
        
        // Redirect to original destination
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 1000);
      },
      error: (err) => {
        this.loading = false;
        
        // Analizamos si es un error específico de biometría
        const errorMessage = err.error?.message || 'Biometric verification failed. Please try again.';
        
        // Detectamos si el error es por no coincidencia biométrica
        if (errorMessage.includes('biometric') || 
            errorMessage.includes('verification failed') ||
            errorMessage.includes('does not match') ||
            errorMessage.includes('no coincide') ||
            err.status === 403) {
          this.isBiometricMismatch = true;
        }
        
        this.error = errorMessage;
      }
    });
  }
  
  private performOfflineBiometricVerification(): void {
    // En modo offline, usamos las capacidades biométricas nativas del dispositivo
    console.log('Iniciando verificación biométrica offline para usuario:', this.username);
    
    // Obtenemos la credencial almacenada para este usuario
    let credentialId = this.storedBiometricId;
    
    // Si no se cargó en el init, intentamos obtenerla de localStorage
    if (!credentialId && window.localStorage) {
      try {
        credentialId = localStorage.getItem(`biometric_${this.username}`) || '';
        if (credentialId) {
          console.log('Credencial biométrica encontrada para:', this.username);
        }
      } catch (e) {
        console.error('Error al acceder a almacenamiento local:', e);
      }
    }
    
    // Si no hay credencial almacenada, mostramos error específico
    if (!credentialId) {
      this.loading = false;
      this.error = 'No se encontró información biométrica registrada para este usuario. Por favor, complete el proceso de registro biométrico primero.';
      return;
    }
    
    // Verificamos la credencial con el servicio biométrico
    this.biometricService.verifyCredential(this.username, credentialId)
      .subscribe({
        next: (isValid) => {
          this.loading = false;
          
          if (isValid) {
            this.success = '¡Verificación biométrica exitosa!';
            console.log('Verificación biométrica completada con éxito');
            
            // Configurar modo offline si estamos en ese estado
            if (this.isOffline) {
              this.authService.setOfflineMode(true);
            }
            
            // Redirigir al destino original
            setTimeout(() => {
              this.router.navigateByUrl(this.returnUrl);
            }, 1000);
          } else {
            this.error = 'La verificación biométrica ha fallado. Intente nuevamente.';
            console.error('Verificación biométrica fallida');
            // Marcamos como error de coincidencia biométrica
            this.isBiometricMismatch = true;
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error durante la verificación biométrica:', err);
          
          // Proporcionamos mensajes de error más descriptivos
          if (err.name === 'NotAllowedError') {
            this.error = 'Verificación cancelada. No ha permitido el acceso biométrico.';
          } else if (err.name === 'SecurityError') {
            this.error = 'Error de seguridad en la verificación biométrica.';
          } else if (typeof err === 'string' && (err.includes('match') || err.includes('coincide'))) {
            this.error = 'La verificación biométrica ha fallado. No coincide con los datos registrados.';
            this.isBiometricMismatch = true;
          } else {
            this.error = 'Error durante la verificación biométrica: ' + (err.message || 'Error desconocido');
          }
        }
      });
  }
  
  skipBiometric(): void {
    // This is only for registration flow when user can't use biometrics
    if (this.action === 'enroll') {
      this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
    }
  }
  
  cancelAndGoBack(): void {
    if (this.action === 'verify') {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/register']);
    }
  }
}
