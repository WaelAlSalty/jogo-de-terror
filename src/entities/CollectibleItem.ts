import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';

export type ItemType = 'red_key' | 'master_key' | 'card_key';

export class CollectibleItem {
  public id: string;
  public name: string;
  public type: ItemType;
  public mesh: THREE.Group;
  public isCollected: boolean = false;
  private glowLight: THREE.PointLight;
  private audio: AudioManager;

  constructor(id: string, name: string, type: ItemType, x: number, y: number, z: number, scene: THREE.Scene, audio: AudioManager) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.audio = audio;

    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);

    let colorHex = 0xef4444;
    if (type === 'master_key') colorHex = 0xfacc15;
    if (type === 'card_key') colorHex = 0x38bdf8;

    const keyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.9,
      roughness: 0.2,
      emissive: colorHex,
      emissiveIntensity: 0.3
    });

    if (type === 'card_key') {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.18), keyMat);
      this.mesh.add(card);
    } else {
      // Formato de Chave
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16), keyMat);
      ring.rotation.x = Math.PI / 2;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8), keyMat);
      stem.rotation.z = Math.PI / 2;
      stem.position.set(0.07, 0, 0);

      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.03), keyMat);
      tooth.position.set(0.11, 0, 0.018);

      this.mesh.add(ring);
      this.mesh.add(stem);
      this.mesh.add(tooth);
    }

    this.glowLight = new THREE.PointLight(colorHex, 1.2, 2.5);
    this.glowLight.position.set(0, 0.1, 0);
    this.mesh.add(this.glowLight);

    this.mesh.userData.isCollectible = true;
    this.mesh.userData.itemId = id;

    scene.add(this.mesh);
  }

  public update(time: number): void {
    if (!this.isCollected) {
      this.mesh.rotation.y = time * 2;
      this.mesh.position.y += Math.sin(time * 4) * 0.0008;
    }
  }

  public collect(scene: THREE.Scene): void {
    this.isCollected = true;
    scene.remove(this.mesh);
  }
}
