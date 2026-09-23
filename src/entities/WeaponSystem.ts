import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';
import { Monster } from './Monster';

export class WeaponSystem {
  public gunMesh: THREE.Group;
  public ammoCount: number = 3;
  private audio: AudioManager;
  private isAiming: boolean = false;
  private muzzleFlash!: THREE.PointLight;
  private recoilOffset: number = 0;

  constructor(camera: THREE.PerspectiveCamera, audio: AudioManager) {
    this.audio = audio;
    this.gunMesh = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8 });
    const dartTubeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.2 });

    // Cano da pistola pneum?tica de sedativo
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 12), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.1);
    this.gunMesh.add(barrel);

    // C?mara de ar pressurizado
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12), dartTubeMat);
    chamber.rotation.x = Math.PI / 2;
    chamber.position.set(0, -0.01, 0.02);
    this.gunMesh.add(chamber);

    // Empunhadura
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.06), gripMat);
    grip.rotation.x = 0.25;
    grip.position.set(0, -0.08, 0.08);
    this.gunMesh.add(grip);

    // Muzzle Flash suave
    this.muzzleFlash = new THREE.PointLight(0x38bdf8, 0, 3);
    this.muzzleFlash.position.set(0, 0.03, -0.32);
    this.gunMesh.add(this.muzzleFlash);

    // Posi??o na m?o direita em 1? pessoa
    this.gunMesh.position.set(0.24, -0.22, -0.45);
    camera.add(this.gunMesh);
  }

  public shoot(camera: THREE.PerspectiveCamera, scene: THREE.Scene, monster: Monster): boolean {
    if (this.ammoCount <= 0) return false;
    this.ammoCount--;
    this.recoilOffset = 0.08;

    // Dispara dardo vis?vel com rastro de luz
    const dart = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    dart.position.copy(camera.position);
    dart.rotation.copy(camera.rotation);

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dart.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    scene.add(dart);

    this.muzzleFlash.intensity = 3.0;

    // Raycast para verificar se acertou o monstro
    const ray = new THREE.Raycaster(camera.position, dir, 0.1, 35);
    const hits = ray.intersectObject(monster.mesh, true);

    if (hits.length > 0) {
      monster.stun(5.0); // Atordoa o monstro por 5 segundos
    }

    // Anima??o r?pida do proj?til
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      dart.position.addScaledVector(dir, 35 * 0.016);
      if (elapsed > 0.6) {
        scene.remove(dart);
        clearInterval(interval);
      }
    }, 16);

    return true;
  }

  public update(delta: number): void {
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - delta * 0.8);
      this.gunMesh.position.z = -0.45 + this.recoilOffset;
      this.gunMesh.rotation.x = this.recoilOffset * 2.5;
    } else {
      this.gunMesh.position.z = THREE.MathUtils.lerp(this.gunMesh.position.z, -0.45, delta * 10);
      this.gunMesh.rotation.x = THREE.MathUtils.lerp(this.gunMesh.rotation.x, 0, delta * 10);
    }
    if (this.muzzleFlash.intensity > 0) {
      this.muzzleFlash.intensity = Math.max(0, this.muzzleFlash.intensity - delta * 20);
    }
  }
}
