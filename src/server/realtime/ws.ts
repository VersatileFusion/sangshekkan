import type { Server } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';

type Room = string;

class WsHub {
  private wss?: WebSocketServer;
  private socketToRooms = new Map<WebSocket, Set<Room>>();
  private roomToSockets = new Map<Room, Set<WebSocket>>();

  attach(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
      if (!this.wss) return;
      const url = req.url || '';
      if (!url.startsWith('/api/ws')) return;
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.bind(ws);
      });
    });
  }

  private bind(ws: WebSocket) {
    this.socketToRooms.set(ws, new Set());
    ws.on('message', (buf) => {
      try {
        const msg = JSON.parse(String(buf));
        if (msg?.type === 'subscribe' && Array.isArray(msg.rooms)) {
          for (const r of msg.rooms as string[]) this.subscribe(ws, r);
        }
      } catch {}
    });
    ws.on('close', () => this.cleanup(ws));
  }

  private subscribe(ws: WebSocket, room: Room) {
    let sockets = this.roomToSockets.get(room);
    if (!sockets) { sockets = new Set(); this.roomToSockets.set(room, sockets); }
    sockets.add(ws);
    this.socketToRooms.get(ws)?.add(room);
  }

  private cleanup(ws: WebSocket) {
    const rooms = this.socketToRooms.get(ws);
    if (rooms) {
      for (const r of rooms) this.roomToSockets.get(r)?.delete(ws);
    }
    this.socketToRooms.delete(ws);
  }

  notifyStudent(studentId: string, payload: any) {
    this.broadcast(`student:${studentId}`, payload);
  }

  broadcastPanel(panelType: 'TOP_STUDENTS' | 'FAMILY_CHAT', payload: any) {
    this.broadcast(`panel:${panelType}`, payload);
  }

  private broadcast(room: Room, payload: any) {
    const subs = this.roomToSockets.get(room);
    if (!subs) return;
    const data = JSON.stringify(payload);
    for (const ws of subs) try { ws.send(data); } catch {}
  }
}

export const wsHub = new WsHub();



