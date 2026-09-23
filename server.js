const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Real-time GPS tracking
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-fleet', (organizationId) => {
      socket.join(`fleet-${organizationId}`)
      console.log(`Socket ${socket.id} joined fleet-${organizationId}`)
    })

    socket.on('vehicle-gps', (data) => {
      console.log(`GPS update from ${data.vehicleId}:`, data)
      io.to(`fleet-${data.organizationId}`).emit('gps-update', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  const port = process.env.PORT || 3000
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
