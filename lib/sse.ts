import { prisma } from './prisma'

export interface SSEMessage {
  type: 'new_message' | 'message_updated' | 'message_deleted' | 'reaction_added' | 'reaction_removed'
  data: any
}

export class SSEManager {
  private clients: Map<string, ReadableStreamDefaultController[]> = new Map()

  addClient(channelId: string, controller: ReadableStreamDefaultController) {
    if (!this.clients.has(channelId)) {
      this.clients.set(channelId, [])
    }
    this.clients.get(channelId)!.push(controller)
  }

  removeClient(channelId: string, controller: ReadableStreamDefaultController) {
    const clients = this.clients.get(channelId)
    if (clients) {
      const index = clients.indexOf(controller)
      if (index > -1) {
        clients.splice(index, 1)
      }
      if (clients.length === 0) {
        this.clients.delete(channelId)
      }
    }
  }

  broadcast(channelId: string, message: SSEMessage) {
    const clients = this.clients.get(channelId)
    if (clients) {
      const data = `data: ${JSON.stringify(message)}\n\n`
      clients.forEach((controller) => {
        try {
          controller.enqueue(new TextEncoder().encode(data))
        } catch (error) {
          // Client disconnected, remove it
          this.removeClient(channelId, controller)
        }
      })
    }
  }
}

export const sseManager = new SSEManager()
