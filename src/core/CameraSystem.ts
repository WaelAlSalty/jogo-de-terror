import * as THREE from 'three';

export interface SecurityCam {
  id: string;
  name: string;
  camera: THREE.PerspectiveCamera;
  baseYaw: number;
  basePitch: number;
}

export class CameraSystem {
  public cameras: SecurityCam[] = [];
  public activeCamIndex: number = 0;
  public isViewingCCTV: boolean = false;

  constructor(private scene: THREE.Scene) {}

  public addCamera(id: string, name: string, pos: THREE.Vector3, lookAtTarget: THREE.Vector3): void {
    // FOV de 82 graus para simular lente grande-angular / olho de peixe de CCTV
    const cam = new THREE.PerspectiveCamera(82, window.innerWidth / window.innerHeight, 0.1, 70);
    cam.position.copy(pos);
    cam.lookAt(lookAtTarget);

    // Carca?a f?sica presa na quina do teto
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85, roughness: 0.25 });
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.45), housingMat);
    housing.position.copy(pos);
    housing.lookAt(lookAtTarget);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
    );
    dome.position.set(0, -0.06, 0.15);
    housing.add(dome);

    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    led.position.set(0.09, -0.05, 0.22);
    housing.add(led);

    this.scene.add(housing);

    cam.rotation.order = 'YXZ';
    this.cameras.push({
      id,
      name,
      camera: cam,
      baseYaw: cam.rotation.y,
      basePitch: cam.rotation.x
    });
  }

  public getActiveCamera(): THREE.PerspectiveCamera | null {
    if (!this.isViewingCCTV || this.cameras.length === 0) return null;
    return this.cameras[this.activeCamIndex].camera;
  }

  public nextCamera(): void {
    if (this.cameras.length === 0) return;
    this.activeCamIndex = (this.activeCamIndex + 1) % this.cameras.length;
  }

  public prevCamera(): void {
    if (this.cameras.length === 0) return;
    this.activeCamIndex = (this.activeCamIndex - 1 + this.cameras.length) % this.cameras.length;
  }

  public update(time: number): void {
    if (this.isViewingCCTV && this.cameras[this.activeCamIndex]) {
      const active = this.cameras[this.activeCamIndex];
      // Oscila??o suave horizontal sem perder o ?ngulo voltado para o ch?o
      const panOffset = Math.sin(time * 0.9) * 0.22;
      active.camera.rotation.y = active.baseYaw + panOffset;
      active.camera.rotation.x = active.basePitch;
    }
  }
}
