import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  roomId: string
  timestamp: number
  read: boolean
}

interface ChatRoom {
  id: string
  name: string
  participants: string[]
  artisanName: string
  artisanId: string
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
}

interface OnlineUser {
  userId: string
  socketId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const mockRooms: ChatRoom[] = [
  {
    id: 'room-1',
    name: 'Amadou Diallo - Mission Plomberie',
    participants: ['user-1', 'artisan-1'],
    artisanName: 'Amadou Diallo',
    artisanId: 'artisan-1',
    lastMessage: 'Je peux venir demain matin',
    lastMessageTime: Date.now() - 1800000,
    unreadCount: 2,
  },
  {
    id: 'room-2',
    name: 'Fatou Ndiaye - Électricité',
    participants: ['user-1', 'artisan-2'],
    artisanName: 'Fatou Ndiaye',
    artisanId: 'artisan-2',
    lastMessage: 'Le devis est prêt',
    lastMessageTime: Date.now() - 7200000,
    unreadCount: 0,
  },
  {
    id: 'room-3',
    name: 'Kofi Mensah - Menuiserie',
    participants: ['user-1', 'artisan-3'],
    artisanName: 'Kofi Mensah',
    artisanId: 'artisan-3',
    lastMessage: 'Merci pour votre confiance !',
    lastMessageTime: Date.now() - 86400000,
    unreadCount: 1,
  },
]

const mockMessages: Record<string, ChatMessage[]> = {
  'room-1': [
    {
      id: 'm1',
      content: 'Bonjour, j\'ai une fuite d\'eau urgente dans ma cuisine',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-1',
      timestamp: Date.now() - 3600000,
      read: true,
    },
    {
      id: 'm2',
      content: 'Bonjour ! Je suis disponible. Pouvez-vous me donner l\'adresse ?',
      senderId: 'artisan-1',
      senderName: 'Amadou Diallo',
      roomId: 'room-1',
      timestamp: Date.now() - 3500000,
      read: true,
    },
    {
      id: 'm3',
      content: 'Oui, Médina Corniche, Dakar',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-1',
      timestamp: Date.now() - 3400000,
      read: true,
    },
    {
      id: 'm4',
      content: 'D\'accord, je connais bien le quartier. C\'est quel étage ?',
      senderId: 'artisan-1',
      senderName: 'Amadou Diallo',
      roomId: 'room-1',
      timestamp: Date.now() - 3000000,
      read: true,
    },
    {
      id: 'm5',
      content: '2ème étage, porte gauche',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-1',
      timestamp: Date.now() - 2800000,
      read: true,
    },
    {
      id: 'm6',
      content: 'Parfait. La fuite est-elle au robinet ou au tuyau ?',
      senderId: 'artisan-1',
      senderName: 'Amadou Diallo',
      roomId: 'room-1',
      timestamp: Date.now() - 2600000,
      read: true,
    },
    {
      id: 'm7',
      content: 'C\'est au niveau du tuyau sous l\'évier, l\'eau coule en continu',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-1',
      timestamp: Date.now() - 2400000,
      read: true,
    },
    {
      id: 'm8',
      content: 'Je peux venir demain matin',
      senderId: 'artisan-1',
      senderName: 'Amadou Diallo',
      roomId: 'room-1',
      timestamp: Date.now() - 1800000,
      read: false,
    },
  ],
  'room-2': [
    {
      id: 'm9',
      content: 'Bonjour Fatou, j\'ai besoin d\'une installation électrique pour ma nouvelle boutique',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-2',
      timestamp: Date.now() - 14400000,
      read: true,
    },
    {
      id: 'm10',
      content: 'Bonjour ! Avec plaisir. Quelle est la surface de la boutique ?',
      senderId: 'artisan-2',
      senderName: 'Fatou Ndiaye',
      roomId: 'room-2',
      timestamp: Date.now() - 14000000,
      read: true,
    },
    {
      id: 'm11',
      content: 'Environ 50m², avec 3 pièces',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-2',
      timestamp: Date.now() - 13600000,
      read: true,
    },
    {
      id: 'm12',
      content: 'Le devis est prêt',
      senderId: 'artisan-2',
      senderName: 'Fatou Ndiaye',
      roomId: 'room-2',
      timestamp: Date.now() - 7200000,
      read: true,
    },
  ],
  'room-3': [
    {
      id: 'm13',
      content: 'Bonjour Kofi, je voudrais des étagères sur mesure pour mon salon',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-3',
      timestamp: Date.now() - 172800000,
      read: true,
    },
    {
      id: 'm14',
      content: 'Bonjour ! Quel type de bois préférez-vous ?',
      senderId: 'artisan-3',
      senderName: 'Kofi Mensah',
      roomId: 'room-3',
      timestamp: Date.now() - 170000000,
      read: true,
    },
    {
      id: 'm15',
      content: 'Je pensais à du bois d\'acajou, c\'est possible ?',
      senderId: 'user-1',
      senderName: 'Vous',
      roomId: 'room-3',
      timestamp: Date.now() - 168000000,
      read: true,
    },
    {
      id: 'm16',
      content: 'Merci pour votre confiance !',
      senderId: 'artisan-3',
      senderName: 'Kofi Mensah',
      roomId: 'room-3',
      timestamp: Date.now() - 86400000,
      read: false,
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const onlineUsers = new Map<string, OnlineUser>() // userId -> OnlineUser
const userSockets = new Map<string, string>()     // socketId -> userId
const userRooms = new Map<string, Set<string>>()  // userId -> Set<roomId>

let messageIdCounter = 100

function generateMessageId(): string {
  messageIdCounter += 1
  return `m${messageIdCounter}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulate artisan auto-replies
// ─────────────────────────────────────────────────────────────────────────────

const autoReplies: Record<string, string[]> = {
  'artisan-1': [
    'D\'accord, je note ça.',
    'Pas de souci, je me déplace rapidement.',
    'Je vous envoie ma disponibilité.',
    'Très bien, on se voit demain alors !',
    'Je vais vérifier et je vous reviens.',
  ],
  'artisan-2': [
    'C\'est noté !',
    'Je prépare le devis modifié.',
    'Aucun problème, on peut adapter.',
    'Je suis disponible cette semaine.',
    'Parfait, je m\'en occupe.',
  ],
  'artisan-3': [
    'Excellente idée !',
    'Je peux faire un croquis pour vous.',
    'Le délai sera d\'environ 5 jours.',
    'Oui, c\'est tout à fait réalisable.',
    'Je vous montrerai des échantillons.',
  ],
}

function getRandomReply(artisanId: string): string {
  const replies = autoReplies[artisanId] || ['Bien reçu !', 'D\'accord.', 'Je note.']
  return replies[Math.floor(Math.random() * replies.length)]
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket.io Connection Handler
// ─────────────────────────────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[Chat] Connected: ${socket.id}`)

  // ── Authenticate / Identify ──────────────────────────────────────────────

  socket.on('authenticate', (data: { userId: string }) => {
    const { userId } = data

    // Track online user
    onlineUsers.set(userId, { userId, socketId: socket.id })
    userSockets.set(socket.id, userId)
    userRooms.set(userId, new Set())

    console.log(`[Chat] User ${userId} authenticated from ${socket.id}`)

    // Send rooms list
    const userRoomsList = mockRooms.filter((r) => r.participants.includes(userId))
    socket.emit('rooms', userRoomsList)

    // Broadcast online status
    io.emit('user-online', { userId })
  })

  // ── Join Room ────────────────────────────────────────────────────────────

  socket.on('join-room', (data: { roomId: string }) => {
    const userId = userSockets.get(socket.id)
    if (!userId) return

    socket.join(data.roomId)

    // Track room membership
    const rooms = userRooms.get(userId)
    if (rooms) {
      rooms.add(data.roomId)
    }

    // Send messages for this room
    const messages = mockMessages[data.roomId] || []
    socket.emit('room-messages', { roomId: data.roomId, messages })

    // Mark messages as read
    const room = mockRooms.find((r) => r.id === data.roomId)
    if (room && room.participants.includes(userId)) {
      room.unreadCount = 0
      messages.forEach((m) => {
        if (m.senderId !== userId) {
          m.read = true
        }
      })
      // Notify room of read receipts
      io.to(data.roomId).emit('messages-read', {
        roomId: data.roomId,
        readBy: userId,
      })
    }

    console.log(`[Chat] User ${userId} joined room ${data.roomId}`)
  })

  // ── Leave Room ───────────────────────────────────────────────────────────

  socket.on('leave-room', (data: { roomId: string }) => {
    const userId = userSockets.get(socket.id)
    if (!userId) return

    socket.leave(data.roomId)

    const rooms = userRooms.get(userId)
    if (rooms) {
      rooms.delete(data.roomId)
    }

    console.log(`[Chat] User ${userId} left room ${data.roomId}`)
  })

  // ── Send Message ─────────────────────────────────────────────────────────

  socket.on('send-message', (data: { roomId: string; content: string; senderId: string; senderName: string }) => {
    const userId = userSockets.get(socket.id)
    if (!userId) return

    const message: ChatMessage = {
      id: generateMessageId(),
      content: data.content,
      senderId: data.senderId,
      senderName: data.senderName,
      roomId: data.roomId,
      timestamp: Date.now(),
      read: false,
    }

    // Store message
    if (!mockMessages[data.roomId]) {
      mockMessages[data.roomId] = []
    }
    mockMessages[data.roomId].push(message)

    // Update room last message
    const room = mockRooms.find((r) => r.id === data.roomId)
    if (room) {
      room.lastMessage = data.content
      room.lastMessageTime = message.timestamp

      // Increment unread for other participants
      room.participants.forEach((pId) => {
        if (pId !== userId) {
          // Check if the other user is in this room
          const otherRooms = userRooms.get(pId)
          if (!otherRooms || !otherRooms.has(data.roomId)) {
            room.unreadCount += 1
          }
        }
      })
    }

    // Broadcast message to room
    io.to(data.roomId).emit('new-message', message)

    // Send updated rooms list to all participants
    room?.participants.forEach((pId) => {
      const onlineUser = onlineUsers.get(pId)
      if (onlineUser) {
        const userRoomsList = mockRooms.filter((r) => r.participants.includes(pId))
        io.to(onlineUser.socketId).emit('rooms', userRoomsList)
      }
    })

    console.log(`[Chat] ${data.senderName} in ${data.roomId}: ${data.content}`)

    // ── Auto-reply from artisan (simulated) ──────────────────────────────────
    const artisanId = room?.artisanId
    if (artisanId && data.senderId !== artisanId) {
      // Reply after a short delay (1.5 - 4 seconds)
      const delay = 1500 + Math.random() * 2500
      setTimeout(() => {
        const replyContent = getRandomReply(artisanId)
        const reply: ChatMessage = {
          id: generateMessageId(),
          content: replyContent,
          senderId: artisanId,
          senderName: room?.artisanName || 'Artisan',
          roomId: data.roomId,
          timestamp: Date.now(),
          read: false,
        }

        // Store
        if (!mockMessages[data.roomId]) {
          mockMessages[data.roomId] = []
        }
        mockMessages[data.roomId].push(reply)

        // Update room
        if (room) {
          room.lastMessage = replyContent
          room.lastMessageTime = reply.timestamp
        }

        // Broadcast
        io.to(data.roomId).emit('new-message', reply)

        // Update rooms
        room?.participants.forEach((pId) => {
          const onlineUser = onlineUsers.get(pId)
          if (onlineUser) {
            const userRoomsList = mockRooms.filter((r) => r.participants.includes(pId))
            io.to(onlineUser.socketId).emit('rooms', userRoomsList)
          }
        })
      }, delay)
    }
  })

  // ── Typing Indicator ─────────────────────────────────────────────────────

  socket.on('typing', (data: { roomId: string; userId: string; userName: string }) => {
    socket.to(data.roomId).emit('user-typing', {
      roomId: data.roomId,
      userId: data.userId,
      userName: data.userName,
    })
  })

  socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
    socket.to(data.roomId).emit('user-stop-typing', {
      roomId: data.roomId,
      userId: data.userId,
    })
  })

  // ── Read Receipts ────────────────────────────────────────────────────────

  socket.on('mark-read', (data: { roomId: string; userId: string }) => {
    const messages = mockMessages[data.roomId]
    if (messages) {
      messages.forEach((m) => {
        if (m.senderId !== data.userId) {
          m.read = true
        }
      })
    }

    const room = mockRooms.find((r) => r.id === data.roomId)
    if (room) {
      room.unreadCount = 0
    }

    io.to(data.roomId).emit('messages-read', {
      roomId: data.roomId,
      readBy: data.userId,
    })
  })

  // ── Disconnect ───────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const userId = userSockets.get(socket.id)
    if (userId) {
      onlineUsers.delete(userId)
      userSockets.delete(socket.id)
      userRooms.delete(userId)
      io.emit('user-offline', { userId })
      console.log(`[Chat] User ${userId} disconnected`)
    } else {
      console.log(`[Chat] Socket ${socket.id} disconnected`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[Chat] Socket error (${socket.id}):`, error)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[Chat] Chat WebSocket service running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Chat] Received SIGTERM, shutting down...')
  httpServer.close(() => {
    console.log('[Chat] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Chat] Received SIGINT, shutting down...')
  httpServer.close(() => {
    console.log('[Chat] Server closed')
    process.exit(0)
  })
})
