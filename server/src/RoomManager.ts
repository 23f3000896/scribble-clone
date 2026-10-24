import { Server, Socket } from 'socket.io';
import { Room } from './Room.js';
import { Player } from './Player.js';
import { RoomSettings, AvatarData } from './types.js';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // socketId -> roomId
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public createRoom(socket: Socket, hostName: string, avatar: AvatarData, settings: Partial<RoomSettings>): Room {
    const roomId = this.generateRoomCode();
    const hostPlayer = new Player(socket.id, hostName, avatar, true);
    const room = new Room(roomId, hostPlayer, settings, this.io);

    this.rooms.set(roomId, room);
    this.playerRoomMap.set(socket.id, roomId);
    room.addPlayer(hostPlayer, socket);

    return room;
  }

  public joinRoom(socket: Socket, roomId: string, playerName: string, avatar: AvatarData): { success: boolean; error?: string; room?: Room } {
    const cleanCode = roomId.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { success: false, error: 'Room not found. Check the room code and try again.' };
    }

    if (room.players.size >= room.settings.maxPlayers) {
      return { success: false, error: 'Room is full!' };
    }

    const player = new Player(socket.id, playerName, avatar, false);
    const added = room.addPlayer(player, socket);
    if (!added) {
      return { success: false, error: 'Could not join room.' };
    }

    this.playerRoomMap.set(socket.id, cleanCode);
    return { success: true, room };
  }

  public joinPublicRoom(socket: Socket, playerName: string, avatar: AvatarData): { success: boolean; room: Room } {
    // Find an open, non-private room in LOBBY phase
    for (const room of this.rooms.values()) {
      if (!room.settings.isPrivate && room.game.phase === 'LOBBY' && room.players.size < room.settings.maxPlayers) {
        const player = new Player(socket.id, playerName, avatar, false);
        room.addPlayer(player, socket);
        this.playerRoomMap.set(socket.id, room.id);
        return { success: true, room };
      }
    }

    // Also consider rooms currently in game with space
    for (const room of this.rooms.values()) {
      if (!room.settings.isPrivate && room.game.phase !== 'GAME_OVER' && room.players.size < room.settings.maxPlayers) {
        const player = new Player(socket.id, playerName, avatar, false);
        room.addPlayer(player, socket);
        this.playerRoomMap.set(socket.id, room.id);
        return { success: true, room };
      }
    }

    // No open public room found, create one!
    const room = this.createRoom(socket, playerName, avatar, { isPrivate: false });
    return { success: true, room };
  }

  public getRoomBySocketId(socketId: string): Room | undefined {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase().trim());
  }

  public handleDisconnect(socketId: string) {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return;

    this.playerRoomMap.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.removePlayer(socketId);

    // If room is empty, clean it up after a grace period (e.g. 10 seconds)
    if (room.players.size === 0) {
      setTimeout(() => {
        const currentRoom = this.rooms.get(roomId);
        if (currentRoom && currentRoom.players.size === 0) {
          currentRoom.destroy();
          this.rooms.delete(roomId);
          console.log(`[RoomManager] Destroyed empty room: ${roomId}`);
        }
      }, 10000);
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }
}
