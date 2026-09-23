import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';

export class InteractiveCabinet {
  public id: string;
  public group: THREE.Group;
  public doorPivot: THREE.Group;
  public doorMesh: THREE.Mesh;
  public isOpen: boolean = false;
  private isAnimating: boolean = false;
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private audio: AudioManager;

  constructor(id: string, x: number, z: number, rotY: number, scene: THREE.Scene, audio: AudioManager, colliders: THREE.Box3[]) {
    this.id = id;
    this.audio = audio;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this.group.rotation.y = rotY;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.2 });
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa7f3d0,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.15
    });

    // Caixa do arm?rio (oca por dentro)
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.3, 0.08), bodyMat);
    back.position.set(0, 1.15, -0.26);
    this.group.add(back);

    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.6), bodyMat);
    sideL.position.set(-0.76, 1.15, 0);
    this.group.add(sideL);

    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.6), bodyMat);
    sideR.position.set(0.76, 1.15, 0);
    this.group.add(sideR);

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.6), bodyMat);
    top.position.set(0, 2.26, 0);
    this.group.add(top);

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.6), bodyMat);
    bottom.position.set(0, 0.04, 0);
    this.group.add(bottom);

    // Prateleiras internas com itens vis?veis
    for (const h of [0.65, 1.2, 1.75]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.03, 0.5), shelfMat);
      shelf.position.set(0, h, 0);
      this.group.add(shelf);

      // Frasco / Seringa m?dica dentro do arm?rio
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 })
      );
      bottle.position.set(Math.random() * 0.8 - 0.4, h + 0.09, 0);
      this.group.add(bottle);
    }

    // Dobradi?a na borda esquerda da porta
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-0.76, 0, 0.3);

    // Folha da porta com vidro e puxador
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.2, 0.06), bodyMat);
    doorFrame.position.set(0.76, 1.15, 0);

    const glassCenter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.02), glassMat);
    glassCenter.position.set(0.76, 1.15, 0);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8),
      shelfMat
    );
    handle.position.set(1.4, 1.15, 0.06);

    this.doorMesh = doorFrame;
    this.doorMesh.userData.isCabinetDoor = true;
    this.doorPivot.add(doorFrame);
    this.doorPivot.add(glassCenter);
    this.doorPivot.add(handle);
    this.group.add(this.doorPivot);

    scene.add(this.group);
    colliders.push(new THREE.Box3().setFromObject(this.group));
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    this.targetAngle = this.isOpen ? -Math.PI / 1.7 : 0;
    this.isAnimating = true;
    this.audio.playDoorCreek(this.isOpen);
  }

  public update(delta: number): void {
    if (this.isAnimating) {
      this.currentAngle = THREE.MathUtils.lerp(this.currentAngle, this.targetAngle, delta * 8);
      this.doorPivot.rotation.y = this.currentAngle;
      if (Math.abs(this.currentAngle - this.targetAngle) < 0.01) {
        this.currentAngle = this.targetAngle;
        this.doorPivot.rotation.y = this.targetAngle;
        this.isAnimating = false;
      }
    }
  }
}
