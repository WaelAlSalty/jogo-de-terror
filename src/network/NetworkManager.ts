import Peer, { DataConnection } from 'peerjs';

export interface PacketData {
  type: 'player' | 'monster' | 'door';
  x?: number;
  y?: number;
  z?: number;
  rotY?: number;
  doorId?: string;
  isOpen?: boolean;
}

export class NetworkManager {
  public peer: Peer | null = null;
  public conn: DataConnection | null = null;
  public isHost: boolean = false;

  public connect(roomId: string, host: boolean, onOpen: () => void, onData: (data: PacketData) => void, onError: (err: string) => void): void {
    this.isHost = host;
    const peerId = host ? `spz-${roomId}` : undefined;

    this.peer = new Peer(peerId);

    this.peer.on('open', () => {
      onOpen();
      if (!this.isHost) {
        this.conn = this.peer!.connect(`spz-${roomId}`);
        this.bindEvents(onData);
      }
    });

    this.peer.on('connection', (c) => {
      this.conn = c;
      this.bindEvents(onData);
    });

    this.peer.on('error', (err) => {
      onError(err.message || 'Falha na conex?o PeerJS');
    });
  }

  private bindEvents(onData: (data: PacketData) => void): void {
    if (!this.conn) return;
    this.conn.on('data', (d) => onData(d as PacketData));
  }

  public send(packet: PacketData): void {
    if (this.conn && this.conn.open) {
      this.conn.send(packet);
    }
  }
}
