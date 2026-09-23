import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';

export class Player {
  public camera: THREE.PerspectiveCamera;
  public flashlight: THREE.SpotLight;
  public moveState = { forward: 0, right: 0 };
  public rotation = { yaw: 0, pitch: 0 };

  private walkTimer: number = 0;
  private readonly walkSpeed: number = 4.8;
  private audio: AudioManager;

  constructor(camera: THREE.PerspectiveCamera, audio: AudioManager, startPos: THREE.Vector3) {
    this.camera = camera;
    this.audio = audio;

    this.camera.position.copy(startPos);

    this.flashlight = new THREE.SpotLight(0xfffdf5, 14.0, 40, Math.PI / 3.8, 0.35, 1.0);
    this.flashlight.position.set(0, 0, 0);

    const target = new THREE.Object3D();
    target.position.set(0, 0, -1);
    this.camera.add(this.flashlight);
    this.camera.add(target);
    this.flashlight.target = target;
  }

  public update(delta: number, colliders: THREE.Box3[]): void {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.rotation.yaw;
    this.camera.rotation.x = this.rotation.pitch;

    // Altura fixa do olho humano (1.6m) sem necessidade de c?lculos de escada
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 1.6, delta * 6);

    if (this.moveState.forward !== 0 || this.moveState.right !== 0) {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();

      const side = new THREE.Vector3().crossVectors(this.camera.up, dir).negate();

      const moveVec = new THREE.Vector3();
      moveVec.addScaledVector(dir, this.moveState.forward);
      moveVec.addScaledVector(side, this.moveState.right);
      moveVec.normalize().multiplyScalar(this.walkSpeed * delta);

      const radius = 0.22;
      const curX = this.camera.position.x;
      const curZ = this.camera.position.z;
      const curY = this.camera.position.y;

      const nextX = curX + moveVec.x;
      const boxX = new THREE.Box3(
        new THREE.Vector3(nextX - radius, curY - 0.9, curZ - radius),
        new THREE.Vector3(nextX + radius, curY + 0.3, curZ + radius)
      );

      let collideX = false;
      for (let i = 0; i < colliders.length; i++) {
        if (boxX.intersectsBox(colliders[i])) {
          collideX = true;
          break;
        }
      }
      if (!collideX) {
        this.camera.position.x = nextX;
      }

      const nextZ = curZ + moveVec.z;
      const boxZ = new THREE.Box3(
        new THREE.Vector3(this.camera.position.x - radius, curY - 0.9, nextZ - radius),
        new THREE.Vector3(this.camera.position.x + radius, curY + 0.3, nextZ + radius)
      );

      let collideZ = false;
      for (let i = 0; i < colliders.length; i++) {
        if (boxZ.intersectsBox(colliders[i])) {
          collideZ = true;
          break;
        }
      }
      if (!collideZ) {
        this.camera.position.z = nextZ;
      }

      this.walkTimer += delta * 12;
      this.camera.position.y += Math.sin(this.walkTimer) * 0.025;
      if (Math.sin(this.walkTimer) > 0.98) {
        this.audio.playFootstep();
      }
    }
  }
}
