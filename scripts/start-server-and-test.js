const { spawn } = require('child_process')
const http = require('http')

// Function to check if server is ready
function checkServer(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      timeout: 2000
    }, (res) => {
      resolve(res.statusCode === 200)
    })
    
    req.on('error', () => resolve(false))
    req.end()
  })
}

// Function to wait for server
async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Checking server (attempt ${i + 1}/${maxAttempts})...`)
    const isReady = await checkServer(port)
    if (isReady) {
      console.log('Server is ready!')
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw new Error('Server failed to start within timeout period')
}

async function main() {
  console.log('Starting dev server...')
  
  // Start dev server
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  })
  
  // Wait for server to be ready
  try {
    await waitForServer(5173) // Try default Vite port first
    await waitForServer(5174) // Try alternative port
    await waitForServer(5175) // Try another alternative port
  } catch (error) {
    console.error('Failed to start server:', error.message)
    devServer.kill()
    process.exit(1)
  }
  
  console.log('Running Cypress tests...')
  
  // Run Cypress
  const cypress = spawn('npx', ['cypress', 'run'], {
    stdio: 'inherit',
    shell: true
  })
  
  cypress.on('close', (code) => {
    console.log(`Cypress tests completed with code: ${code}`)
    devServer.kill()
    process.exit(code)
  })
}

main().catch(console.error)