import * as THREE from 'three';

export interface SecurityCam {
  id: string;
  name: string;
  camera: THREE.PerspectiveCamera;
  baseYaw: number;
}

export class CameraSystem {
  public cameras: SecurityCam[] = [];
  public activeCamIndex: number = 0;
  public isViewingCCTV: boolean = false;

  constructor(private scene: THREE.Scene) {}

  public addCamera(id: string, name: string, pos: THREE.Vector3, lookAtTarget: THREE.Vector3): void {
    const cam = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 70);
    cam.position.copy(pos);
    cam.lookAt(lookAtTarget);

    const dir = new THREE.Vector3().subVectors(lookAtTarget, pos);
    const baseYaw = Math.atan2(-dir.x, -dir.z);

    // Cria a carca?a visual da c?mara de seguran?a presa no teto/parede
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.8, roughness: 0.3 });
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.4), housingMat);
    housing.position.copy(pos);
    housing.lookAt(lookAtTarget);

    // LED vermelho de grava??o piscante
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    led.position.set(0, -0.05, 0.2);
    housing.add(led);

    this.scene.add(housing);

    this.cameras.push({
      id,
      name,
      camera: cam,
      baseYaw
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
    // Oscila??o suave de seguran?a (Pan da c?mara)
    if (this.isViewingCCTV && this.cameras[this.activeCamIndex]) {
      const active = this.cameras[this.activeCamIndex];
      const panOffset = Math.sin(time * 0.8) * 0.35;
      active.camera.rotation.y = active.baseYaw + panOffset;
    }
  }
}
