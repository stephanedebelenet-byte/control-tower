import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as IOServer, Socket } from 'socket.io'

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: any & {
    server: NetServer & {
      io: IOServer
    }
  }
}

export function initializeSocket(res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log('Socket.io already running')
    return res.socket.server.io
  }

  console.log('Initializing Socket.io')
  const io = new IOServer(res.socket.server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Real-time GPS updates - 60s intervals
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-fleet', (organizationId: string) => {
      socket.join(`fleet-${organizationId}`)
    })

    socket.on('vehicle-gps', (data: any) => {
      io.to(`fleet-${data.organizationId}`).emit('gps-update', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  res.socket.server.io = io
  return io
}
