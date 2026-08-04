const { spawn } = require('child_process')
const http = require('http')

// Vite picks the next free port when 5173 is taken, so probe a small range.
// The previous version awaited each port in turn, so a successful 5173 was
// followed by a 30-second wait on 5174 and then a thrown failure: the e2e
// script could not pass even when the server and the tests were both fine.
const PORTS = [5173, 5174, 5175]

function isUp(port) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port, path: '/', timeout: 2000 }, (res) =>
      resolve(res.statusCode === 200)
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })
}

async function waitForAnyPort(maxAttempts = 45) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const port of PORTS) {
      if (await isUp(port)) {
        console.log(`Server ready on port ${port}`)
        return port
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`No dev server on ports ${PORTS.join(', ')} after ${maxAttempts} attempts`)
}

async function main() {
  console.log('Starting dev server...')
  const devServer = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true })

  const stopServer = () => {
    if (!devServer.killed) devServer.kill()
  }
  process.on('exit', stopServer)
  process.on('SIGINT', () => process.exit(130))
  process.on('SIGTERM', () => process.exit(143))

  let port
  try {
    port = await waitForAnyPort()
  } catch (error) {
    console.error(error.message)
    stopServer()
    process.exit(1)
  }

  console.log('Running Cypress...')
  const cypress = spawn(
    'npx',
    ['cypress', 'run', '--config', `baseUrl=http://localhost:${port}`],
    { stdio: 'inherit', shell: true }
  )

  cypress.on('close', (code) => {
    stopServer()
    process.exit(code ?? 1)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
