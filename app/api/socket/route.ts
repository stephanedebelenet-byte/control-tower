import { NextApiRequest } from 'next'
import { NextApiResponseWithSocket, initializeSocket } from '@/lib/socket'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (req.method === 'GET') {
    const io = initializeSocket(res)
    res.status(200).json({ connected: true, sockets: io.engine.clientsCount })
  } else {
    res.status(405).end()
  }
}
