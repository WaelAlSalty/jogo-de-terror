import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';

export class Door {
  public id: string;
  public group: THREE.Group;
  public pivot: THREE.Group;
  public doorMesh: THREE.Mesh;
  public leftFrame: THREE.Mesh;
  public rightFrame: THREE.Mesh;
  public isOpen: boolean = false;
  public isLocked: boolean = false;
  public requiredKey: string | null = null;
  public isExitDoor: boolean = false;

  private isAnimating: boolean = false;
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private audio: AudioManager;
  private doorWidth: number = 1.8;

  constructor(
    id: string, 
    x: number, 
    z: number, 
    rotationY: number, 
    scene: THREE.Scene, 
    audio: AudioManager, 
    wallMat: THREE.Material,
    locked: boolean = false,
    requiredKey: string | null = null,
    isExit: boolean = false
  ) {
    this.id = id;
    this.audio = audio;
    this.isLocked = locked;
    this.requiredKey = requiredKey;
    this.isExitDoor = isExit;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this.group.rotation.y = rotationY;

    // Batentes de metal
    const frameGeo = new THREE.BoxGeometry(0.12, 3.2, 0.28);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });

    this.leftFrame = new THREE.Mesh(frameGeo, frameMat);
    this.leftFrame.position.set(-0.95, 1.6, 0);
    this.group.add(this.leftFrame);

    this.rightFrame = new THREE.Mesh(frameGeo, frameMat);
    this.rightFrame.position.set(0.95, 1.6, 0);
    this.group.add(this.rightFrame);

    this.pivot = new THREE.Group();
    this.pivot.position.set(-0.9, 0, 0);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Cor diferente para a Porta de Sa?da Final
    ctx.fillStyle = isExit ? '#7f1d1d' : '#3f2e24';
    ctx.fillRect(0, 0, 256, 512);
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 232, 488);

    if (isExit) {
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SA?DA', 128, 200);
      ctx.fillText('EXIT', 128, 240);
    } else {
      ctx.fillStyle = '#0f1715';
      ctx.fillRect(68, 50, 120, 110);
    }

    const doorTex = new THREE.CanvasTexture(canvas);
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: isExit ? 0.4 : 0.65,
      metalness: isExit ? 0.4 : 0.2
    });

    const doorGeo = new THREE.BoxGeometry(this.doorWidth, 2.9, 0.08);
    this.doorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.doorMesh.position.set(this.doorWidth / 2, 1.45, 0);

    // Ma?aneta / Barra Antip?nico
    const knobMat = new THREE.MeshStandardMaterial({ color: isExit ? 0xef4444 : 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    if (isExit) {
      const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.12), knobMat);
      pushBar.position.set(this.doorWidth / 2, 1.25, 0.08);
      this.doorMesh.add(pushBar);
    } else {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 12), knobMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(this.doorWidth - 0.2, 1.35, 0.07);
      this.doorMesh.add(knob);
    }

    this.pivot.add(this.doorMesh);
    this.group.add(this.pivot);
    scene.add(this.group);
  }

  public unlock(): void {
    this.isLocked = false;
    this.toggle();
  }

  public toggle(): void {
    if (this.isLocked) return;
    this.isOpen = !this.isOpen;
    this.targetAngle = this.isOpen ? -Math.PI / 2 : 0;
    this.isAnimating = true;
    this.audio.playDoorCreek(this.isOpen);
  }

  public setOpen(open: boolean): void {
    if (this.isOpen !== open) {
      this.toggle();
    }
  }

  public update(delta: number): boolean {
    if (this.isAnimating) {
      this.currentAngle = THREE.MathUtils.lerp(this.currentAngle, this.targetAngle, delta * 7);
      this.pivot.rotation.y = this.currentAngle;

      if (Math.abs(this.currentAngle - this.targetAngle) < 0.008) {
        this.currentAngle = this.targetAngle;
        this.pivot.rotation.y = this.targetAngle;
        this.isAnimating = false;
        return true;
      }
    }
    return false;
  }
}
