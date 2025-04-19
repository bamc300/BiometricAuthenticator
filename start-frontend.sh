#!/bin/bash
cd frontend
echo "N" | npx ng serve --port 5000 --host 0.0.0.0 --disable-host-check --proxy-config proxy.conf.json