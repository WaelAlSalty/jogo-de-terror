import * as THREE from 'three';
import { RoomDef } from '../environment/MapGenerator';

export class MapRenderer {
  private miniCanvas: HTMLCanvasElement;
  private miniCtx: CanvasRenderingContext2D;
  private bigCanvas: HTMLCanvasElement;
  private bigCtx: CanvasRenderingContext2D;

  constructor() {
    this.miniCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    this.miniCtx = this.miniCanvas.getContext('2d')!;

    this.bigCanvas = document.getElementById('bigmap-canvas') as HTMLCanvasElement;
    this.bigCtx = this.bigCanvas.getContext('2d')!;
  }

  // 1. MINIMAPA ESTILO GTA (Mapa fixo, apenas a seta do jogador se move e roda)
  public renderMinimap(
    playerPos: THREE.Vector3,
    playerYaw: number,
    rooms: RoomDef[],
    friendPos: THREE.Vector3 | null,
    monsterPos: THREE.Vector3
  ): void {
    const ctx = this.miniCtx;
    const w = this.miniCanvas.width;
    const h = this.miniCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const zoom = 1.6;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    // Recorte circular do radar
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    // Fundo do radar
    ctx.fillStyle = '#030705';
    ctx.fillRect(0, 0, w, h);

    // Grelha t?tica fixa de fundo
    ctx.strokeStyle = 'rgba(31, 61, 50, 0.4)';
    ctx.lineWidth = 1;
    for (let r = 25; r <= 80; r += 25) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Transla??o centrada no jogador (sem rodar o mapa!)
    ctx.save();
    ctx.translate(cx - playerPos.x * zoom, cy - playerPos.z * zoom);

    // Corredor Principal Fixo
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(-5 * zoom, -45 * zoom, 10 * zoom, 90 * zoom);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-5 * zoom, -45 * zoom, 10 * zoom, 90 * zoom);

    // Quartos e Salas Fixos
    for (const r of rooms) {
      const rx = (r.x - r.width / 2) * zoom;
      const rz = (r.z - r.depth / 2) * zoom;
      const rw = r.width * zoom;
      const rd = r.depth * zoom;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.fillRect(rx, rz, rw, rd);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(rx, rz, rw, rd);
    }

    // Marcador do Amigo no radar
    if (friendPos) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(friendPos.x * zoom, friendPos.z * zoom, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Marcador do Monstro no radar
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(monsterPos.x * zoom, monsterPos.z * zoom, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Fecha o espa?o do mundo fixo

    // 2. DESENHO DA SETA DO JOGADOR NO CENTRO DO RADAR (A seta roda sobre si mesma)
    ctx.save();
    ctx.translate(cx, cy);
    // Rota??o da seta alinhada com a orienta??o da c?mara no mundo
    ctx.rotate(-playerYaw);

    // Cone de vis?o da lanterna saindo da seta
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 32, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45);
    ctx.closePath();
    ctx.fill();

    // Seta t?tica verde do jogador
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -9);      // Ponta para a frente
    ctx.lineTo(6, 6);       // Asa direita
    ctx.lineTo(0, 2);       // Recuo traseiro
    ctx.lineTo(-6, 6);      // Asa esquerda
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore(); // Fim do clip do minimapa
  }

  // 2. MAPA COMPLETO T?TICO ESTILO GTA (Tela Inteira)
  public renderBigMap(
    playerPos: THREE.Vector3,
    playerYaw: number,
    rooms: RoomDef[],
    friendPos: THREE.Vector3 | null,
    monsterPos: THREE.Vector3
  ): void {
    const ctx = this.bigCtx;
    const w = this.bigCanvas.width;
    const h = this.bigCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 7.5;

    ctx.clearRect(0, 0, w, h);

    // Fundo escuro militar
    ctx.fillStyle = '#030705';
    ctx.fillRect(0, 0, w, h);

    // Grelha militar
    ctx.strokeStyle = 'rgba(31, 61, 50, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Per?metro Externo Fixo
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 45 * scale, cy - 45 * scale, 90 * scale, 90 * scale);

    // Corredor Central Fixo
    ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.fillRect(cx - 5 * scale, cy - 45 * scale, 10 * scale, 90 * scale);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(cx - 5 * scale, cy - 45 * scale, 10 * scale, 90 * scale);
    ctx.setLineDash([]);

    // C?modos e Nomes Fixos
    for (const r of rooms) {
      const rx = cx + (r.x - r.width / 2) * scale;
      const rz = cy + (r.z - r.depth / 2) * scale;
      const rw = r.width * scale;
      const rd = r.depth * scale;

      ctx.fillStyle = 'rgba(15, 30, 24, 0.85)';
      ctx.fillRect(rx, rz, rw, rd);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, rz, rw, rd);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '10px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(r.name.toUpperCase(), rx + rw / 2, rz + rd / 2 + 3);
    }

    // Amigo
    if (friendPos) {
      const fx = cx + friendPos.x * scale;
      const fz = cy + friendPos.z * scale;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(fx, fz, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px Consolas';
      ctx.fillText('AMIGO', fx, fz - 10);
    }

    // Monstro
    const mx = cx + monsterPos.x * scale;
    const mz = cy + monsterPos.z * scale;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(mx, mz, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, mz, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px Consolas';
    ctx.fillText('! AMEA?A !', mx, mz - 12);

    // Seta do Jogador no Mapa Grande (Move-se pela planta e roda na dire??o do olhar)
    const px = cx + playerPos.x * scale;
    const pz = cy + playerPos.z * scale;

    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-playerYaw);

    // Cone de vis?o
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 40, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45);
    ctx.closePath();
    ctx.fill();

    // Seta
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px Consolas';
    ctx.fillText('VOC?', px, pz + 20);
  }
}
