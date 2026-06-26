import { spawn } from 'child_process';

console.log('🚀 Orquestador Sabor.io: Encendiendo motores...\n');

// 1. Ejecutar Backend
const backend = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });

// 2. Ejecutar Frontend (Vite)
const frontend = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });

// Si presionas Ctrl + C en la terminal, mata ambos procesos limpiamente
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando el salón y liberando puertos...');
  backend.kill();
  frontend.kill();
  process.exit();
});