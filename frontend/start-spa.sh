#!/bin/bash

# Navegar al directorio del frontend
cd frontend

# Establecer el registro NPM para evitar problemas con registros privados
npm set registry=https://registry.npmjs.org/

# Iniciar el servidor de desarrollo con configuración adecuada
echo "N" | npx ng serve --port 5000 --host 0.0.0.0 --disable-host-check --proxy-config proxy.conf.json