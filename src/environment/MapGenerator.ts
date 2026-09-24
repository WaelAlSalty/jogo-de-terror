import * as THREE from 'three';
import { ProceduralTextures } from './ProceduralTextures';
import { Door } from '../entities/Door';
import { AudioManager } from '../core/AudioManager';
import { CameraSystem } from '../core/CameraSystem';
import { FurnitureBuilder } from './FurnitureBuilder';
import { InteractiveCabinet } from '../entities/InteractiveCabinet';
import { CollectibleItem } from '../entities/CollectibleItem';
import { CharacterLoader } from '../entities/CharacterLoader';

export class MapGenerator {
  public colliders: THREE.Box3[] = [];
  public emergencyLights: THREE.PointLight[] = [];
  public doors: Door[] = [];
  public cabinets: InteractiveCabinet[] = [];
  public items: CollectibleItem[] = [];
  public character: CharacterLoader | null = null;
  public spawnPosition: THREE.Vector3 = new THREE.Vector3(0, 1.6, 2);

  constructor(private scene: THREE.Scene, private audio: AudioManager, private camSystem: CameraSystem) {}

  public build(): void {
    const tileTex = ProceduralTextures.createHospitalTileTexture();
    tileTex.repeat.set(8, 8);

    const wallTex = ProceduralTextures.createConcreteWallTexture();
    wallTex.repeat.set(2, 1);

    const floorMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.35, metalness: 0.05 });
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.1 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x18201d, roughness: 0.95 });

    const w = 26;
    const d = 22;
    const h = 3.2;

    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    this.scene.add(floorMesh);

    const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilingMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(0, h, 0);
    this.scene.add(ceilMesh);

    const amb = new THREE.AmbientLight(0x718096, 2.4);
    this.scene.add(amb);

    const sun = new THREE.DirectionalLight(0xf8fafc, 0.8);
    sun.position.set(0, 10, 0);
    this.scene.add(sun);

    // Limites Externos
    this.createWall(0, -11, w, 0.3, h, wallMat);

    // Parede Sul com Porta de Saida
    this.createWall(-7, 11, 12, 0.3, h, wallMat);
    this.createWall(7, 11, 12, 0.3, h, wallMat);
    const exitDoor = new Door('door_exit', 0, 11, 0, this.scene, this.audio, wallMat, true, 'master_key', true);
    this.doors.push(exitDoor);

    this.createWall(-13, 0, 0.3, d, h, wallMat);
    this.createWall(13, 0, 0.3, d, h, wallMat);

    // Divisorias do Corredor Central (4 metros de largura)
    this.createWall(-4, 7, 0.3, 8, h, wallMat);
    this.createWall(-4, -7, 0.3, 8, h, wallMat);
    this.createWall(4, 7, 0.3, 8, h, wallMat);
    this.createWall(4, -7, 0.3, 8, h, wallMat);

    // Divisorias Horizontais
    this.createWall(-8.5, 0, 9, 0.3, h, wallMat);
    this.createWall(8.5, 0, 9, 0.3, h, wallMat);

    // Portas nos vaos
    const doorSurg = new Door('door_cirurgia', -4, -1.5, Math.PI / 2, this.scene, this.audio, wallMat, true, 'red_key');
    this.doors.push(doorSurg);

    const doorEnf = new Door('door_enfermaria', -4, 1.5, Math.PI / 2, this.scene, this.audio, wallMat, false, null);
    this.doors.push(doorEnf);

    const doorPharm = new Door('door_farmacia', 4, -1.5, Math.PI / 2, this.scene, this.audio, wallMat, true, 'card_key');
    this.doors.push(doorPharm);

    const doorVest = new Door('door_vestiario', 4, 1.5, Math.PI / 2, this.scene, this.audio, wallMat, false, null);
    this.doors.push(doorVest);

    // Recepcao
    FurnitureBuilder.createOfficeDeskWithPC(0, -6, Math.PI, this.scene, this.colliders);
    const cabLobby = new InteractiveCabinet('cab_lobby', -2, -10.3, 0, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabLobby);

    // Sala de Cirurgia
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const surgTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 2.6), metalMat);
    surgTable.position.set(-8.5, 0.42, -5.5);
    surgTable.userData.isCollider = true;
    this.scene.add(surgTable);

    const cabSurg = new InteractiveCabinet('cab_surg', -12.3, -5.5, Math.PI / 2, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabSurg);

    const masterKey = new CollectibleItem('master_key', 'Chave Mestra da Saida', 'master_key', -12.1, 1.25, -5.5, this.scene, this.audio);
    this.items.push(masterKey);

    // Posicionada na Sala de Cirurgia, nivelada com o ch?o e virada em dire??o ? entrada
    this.character = new CharacterLoader(-6.5, 0, -6.5, Math.PI / 3, this.scene, this.audio, this.colliders);

    // Enfermaria
    FurnitureBuilder.createHospitalBed(-10.5, 4.5, Math.PI / 2, this.scene, this.colliders);
    FurnitureBuilder.createHospitalBed(-10.5, 7.5, Math.PI / 2, this.scene, this.colliders);
    FurnitureBuilder.createLockersRow(-12.4, 2, Math.PI / 2, this.scene, this.colliders);

    const cardKey = new CollectibleItem('card_key', 'Cartao da Farmacia', 'card_key', -10.5, 0.9, 4.5, this.scene, this.audio);
    this.items.push(cardKey);

    // Farmacia
    const cabPharm = new InteractiveCabinet('cab_pharm', 12.3, -5.5, -Math.PI / 2, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabPharm);

    const redKey = new CollectibleItem('red_key', 'Chave Vermelha de Cirurgia', 'red_key', 8.5, 1.2, -10.2, this.scene, this.audio);
    this.items.push(redKey);

    // Vestiario
    FurnitureBuilder.createLockersRow(8.5, 10.3, 0, this.scene, this.colliders);
    const cabVest = new InteractiveCabinet('cab_vest', 12.3, 5.5, -Math.PI / 2, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabVest);

    // Luzes locais
    const surgLight = new THREE.PointLight(0x38bdf8, 2.4, 12);
    surgLight.position.set(-8.5, 2.9, -5.5);
    this.scene.add(surgLight);

    const exitLight = new THREE.PointLight(0xef4444, 3.5, 10);
    exitLight.position.set(0, 2.9, 10.2);
    this.scene.add(exitLight);
    this.emergencyLights.push(exitLight);

    // Cameras CCTV
    this.camSystem.cameras = [];
    this.camSystem.addCamera('cam_1', 'CAM 01 // SAGUAO & SAIDA', new THREE.Vector3(0, 2.95, -10.2), new THREE.Vector3(0, 1.0, 3.0));
    this.camSystem.addCamera('cam_2', 'CAM 02 // SALA CIRURGICA', new THREE.Vector3(-12.2, 2.95, -10.2), new THREE.Vector3(-7.5, 0.6, -4.5));
    this.camSystem.addCamera('cam_3', 'CAM 03 // ENFERMARIA', new THREE.Vector3(-12.2, 2.95, 10.2), new THREE.Vector3(-7.5, 0.8, 4.5));
    this.camSystem.addCamera('cam_4', 'CAM 04 // FARMACIA', new THREE.Vector3(12.2, 2.95, -10.2), new THREE.Vector3(7.5, 0.7, -4.5));

    this.scene.updateMatrixWorld(true);
    this.rebuildColliders();
  }

  private createWall(x: number, z: number, w: number, d: number, h: number, mat: THREE.Material): void {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    wall.position.set(x, h / 2, z);
    wall.userData.isCollider = true;
    this.scene.add(wall);
  }

  public rebuildColliders(): void {
    this.colliders = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData.isCollider) {
        this.colliders.push(new THREE.Box3().setFromObject(obj));
      }
    });

    for (const d of this.doors) {
      if (d.leftFrame) this.colliders.push(new THREE.Box3().setFromObject(d.leftFrame));
      if (d.rightFrame) this.colliders.push(new THREE.Box3().setFromObject(d.rightFrame));
      if (!d.isOpen && d.doorMesh) {
        this.colliders.push(new THREE.Box3().setFromObject(d.doorMesh));
      }
    }
  }
}
