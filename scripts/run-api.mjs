/**
 * API'yi her zaman repo kökünden başlatır (frontend içinden çalıştırılsa bile).
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const proc = spawn(
  process.platform === 'win32' ? 'python' : 'python3',
  ['-m', 'uvicorn', 'main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'],
  { cwd: root, stdio: 'inherit', shell: true },
)

proc.on('exit', (code) => process.exit(code ?? 0))
