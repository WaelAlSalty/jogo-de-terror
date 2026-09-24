import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AudioManager } from '../core/AudioManager';

export class CharacterLoader {
  public mesh: THREE.Group;
  public isInteracted: boolean = false;
  public name: string = 'Dra. Elena';
  public role: string = 'PESQUISADORA';
  private audio: AudioManager;
  private mixer: THREE.AnimationMixer | null = null;
  private nameplateSprite!: THREE.Sprite;

  constructor(
    x: number,
    y: number,
    z: number,
    rotY: number,
    scene: THREE.Scene,
    audio: AudioManager,
    colliders: THREE.Box3[],
    characterName: string = 'Dra. Elena'
  ) {
    this.name = characterName;
    this.audio = audio;
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = rotY;
    this.mesh.userData.isCharacter = true;

    scene.add(this.mesh);

    // Cria a placa de nome 3D flutuante (Sprite)
    this.createNameplate();

    const loader = new GLTFLoader();
    loader.load(
      './character.glb',
      (gltf) => {
        // Remove manequim de fallback se existir (mantendo a placa de nome)
        const toRemove = this.mesh.children.filter(c => c !== this.nameplateSprite);
        toRemove.forEach(c => this.mesh.remove(c));

        const model = gltf.scene;

        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const minY = box.min.y;
        const height = box.max.y - box.min.y;

        // Nivelamento no chao
        if (minY < 0) {
          model.position.y = -minY;
        }

        // Posiciona a placa logo acima da cabeca da personagem
        this.nameplateSprite.position.y = Math.max(1.9, height + 0.25);

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.isCharacter = true;
          }
        });

        this.mesh.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        colliders.push(new THREE.Box3().setFromObject(this.mesh));
      },
      undefined,
      () => {
        this.buildFallbackModel();
        colliders.push(new THREE.Box3().setFromObject(this.mesh));
      }
    );
  }

  private createNameplate(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Fundo do cracha medico
    ctx.fillStyle = 'rgba(10, 20, 16, 0.85)';
    ctx.roundRect(10, 10, 492, 140, 16);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.roundRect(10, 10, 492, 140, 16);
    ctx.stroke();

    // Texto do Nome
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.name.toUpperCase(), 256, 68);

    // Subtitulo / Funcao
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px Consolas, monospace';
    ctx.fillText(`[ ${this.role} ]`, 256, 114);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.nameplateSprite = new THREE.Sprite(spriteMat);
    this.nameplateSprite.position.set(0, 2.0, 0);
    this.nameplateSprite.scale.set(1.5, 0.5, 1.0);
    this.mesh.add(this.nameplateSprite);
  }

  private buildFallbackModel(): void {
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.5,
      metalness: 0.1
    });

    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1
    });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.7, 12), clothMat);
    torso.position.y = 0.95;
    torso.userData.isCharacter = true;
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
    head.position.y = 1.45;
    head.userData.isCharacter = true;
    this.mesh.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
    hair.position.set(0, 1.48, -0.02);
    hair.scale.set(1.0, 1.1, 0.9);
    hair.userData.isCharacter = true;
    this.mesh.add(hair);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.65, 8), clothMat);
    legL.position.set(-0.1, 0.35, 0.1);
    legL.rotation.x = 0.2;
    legL.userData.isCharacter = true;
    this.mesh.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.65, 8), clothMat);
    legR.position.set(0.1, 0.35, 0.1);
    legR.rotation.x = 0.2;
    legR.userData.isCharacter = true;
    this.mesh.add(legR);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.55, 8), skinMat);
    armL.position.set(-0.24, 0.9, 0.05);
    armL.rotation.z = 0.2;
    armL.userData.isCharacter = true;
    this.mesh.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.55, 8), skinMat);
    armR.position.set(0.24, 0.9, 0.05);
    armR.rotation.z = -0.2;
    armR.userData.isCharacter = true;
    this.mesh.add(armR);
  }

  public interact(): string {
    this.isInteracted = true;
    return `${this.name.toUpperCase()}: "Voc? conseguiu entrar! A chave mestra da sa?da est? escondida no arm?rio de cirurgia... pegue e vamos embora!"`;
  }

  public update(delta: number, time: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }
    // Levita??o suave do crach?
    if (this.nameplateSprite) {
      this.nameplateSprite.position.y += Math.sin(time * 3) * 0.0006;
    }
  }
}
