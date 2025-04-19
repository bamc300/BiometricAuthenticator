import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Test de Conexión Angular + Spring Boot</h1>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h3>Estado del Backend</h3>
        <p>Estado: <span [ngStyle]="{'color': backendStatus ? 'green' : 'red'}">
          {{ backendStatus ? 'CONECTADO' : 'DESCONECTADO' }}
        </span></p>
        <p>Mensaje: {{ backendMessage }}</p>
        <p>Timestamp: {{ backendTimestamp }}</p>
        <button (click)="checkBackendStatus()" style="padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Verificar Estado
        </button>
      </div>
    </div>
  `
})
export class TestAppComponent implements OnInit {
  backendStatus: boolean = false;
  backendMessage: string = 'No verificado';
  backendTimestamp: string = '-';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.checkBackendStatus();
  }

  checkBackendStatus() {
    this.backendMessage = 'Verificando...';
    
    this.http.get<any>('/api/health')
      .subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);
          this.backendStatus = response.status === 'UP';
          this.backendMessage = response.service || 'Servicio OK';
          this.backendTimestamp = new Date(response.timestamp).toLocaleString();
        },
        error: (error) => {
          console.error('Error al verificar el backend:', error);
          this.backendStatus = false;
          this.backendMessage = 'Error: ' + (error.message || 'No se pudo conectar');
          this.backendTimestamp = new Date().toLocaleString();
        }
      });
  }
}