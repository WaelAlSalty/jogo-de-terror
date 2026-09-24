import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AudioManager } from '../core/AudioManager';

export class CharacterLoader {
  public mesh: THREE.Group;
  public isInteracted: boolean = false;
  private audio: AudioManager;
  private mixer: THREE.AnimationMixer | null = null;

  constructor(
    x: number,
    y: number,
    z: number,
    rotY: number,
    scene: THREE.Scene,
    audio: AudioManager,
    colliders: THREE.Box3[]
  ) {
    this.audio = audio;
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = rotY;
    this.mesh.userData.isCharacter = true;

    scene.add(this.mesh);

    // Tenta carregar o modelo .glb da pasta public/
    const loader = new GLTFLoader();
    loader.load(
      './character.glb',
      (gltf) => {
        // Remove manequim temporario se existir
        while (this.mesh.children.length > 0) {
          this.mesh.remove(this.mesh.children[0]);
        }

        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0);
        model.position.set(0, 0, 0);

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.isCharacter = true;
          }
        });

        this.mesh.add(model);

        // Se o modelo tiver animacao embutida (ex: respirando/sentado do Mixamo)
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        colliders.push(new THREE.Box3().setFromObject(this.mesh));
      },
      undefined,
      () => {
        // Fallback: se ainda nao houver character.glb na pasta public, cria um manequim est?tico
        this.buildFallbackModel();
        colliders.push(new THREE.Box3().setFromObject(this.mesh));
      }
    );
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

    // Tronco
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.7, 12), clothMat);
    torso.position.y = 0.95;
    torso.userData.isCharacter = true;
    this.mesh.add(torso);

    // Cabeca e Cabelo
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
    head.position.y = 1.45;
    head.userData.isCharacter = true;
    this.mesh.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
    hair.position.set(0, 1.48, -0.02);
    hair.scale.set(1.0, 1.1, 0.9);
    hair.userData.isCharacter = true;
    this.mesh.add(hair);

    // Pernas (sentada/encolhida)
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.65, 8), clothMat);
    legL.position.set(-0.1, 0.35, 0.1);
    legL.rotation.x = 0.2;
    legL.userData.isCharacter = true;
    this.mesh.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.65, clothMat));
    legR.position.set(0.1, 0.35, 0.1);
    legR.rotation.x = 0.2;
    legR.userData.isCharacter = true;
    this.mesh.add(legR);

    // Bracos
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
    return 'SOBREVIVENTE: "Cuidado... a chave da saida esta trancada no armario de cirurgia!"';
  }

  public update(delta: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}
