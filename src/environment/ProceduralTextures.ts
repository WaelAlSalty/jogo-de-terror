import * as THREE from 'three';

export class ProceduralTextures {
  public static createHospitalTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1c2421';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#090d0b';
    ctx.lineWidth = 4;
    const size = 64;
    for (let i = 0; i <= 512; i += size) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    for (let j = 0; j < 350; j++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 40 + 5;
      ctx.fillStyle = Math.random() > 0.8 ? 'rgba(38, 5, 5, 0.4)' : 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  public static createConcreteWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#26332c';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 9000; i++) {
      const v = Math.random() * 35;
      ctx.fillStyle = `rgba(${v}, ${v + 10}, ${v}, 0.18)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    for (let x = 0; x < 512; x += 32) {
      if (Math.random() > 0.45) {
        const grad = ctx.createLinearGradient(x, 0, x, 512);
        grad.addColorStop(0, 'rgba(8, 14, 10, 0.85)');
        grad.addColorStop(1, 'rgba(25, 35, 25, 0.1)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, Math.random() * 28 + 8, 512);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
}
