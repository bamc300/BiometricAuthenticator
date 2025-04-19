import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h3>¡Bienvenido a Auth PWA!</h3>
        </div>
        <div class="card-body">
          <p class="card-text">Esta es una aplicación de autenticación segura con soporte para trabajo offline.</p>
          <p class="card-text">Características principales:</p>
          <ul>
            <li>Autenticación de dos factores</li>
            <li>Soporte biométrico</li>
            <li>Funcionamiento offline</li>
            <li>Sincronización automática</li>
          </ul>
          <div class="d-flex mt-4">
            <a routerLink="/login" class="btn btn-primary me-2">Iniciar Sesión</a>
            <a routerLink="/register" class="btn btn-secondary">Registrarse</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WelcomeComponent {}