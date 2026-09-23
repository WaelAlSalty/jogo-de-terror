import * as THREE from 'three';
import { ProceduralTextures } from './ProceduralTextures';
import { Door } from '../entities/Door';
import { AudioManager } from '../core/AudioManager';
import { CameraSystem } from '../core/CameraSystem';
import { FurnitureBuilder } from './FurnitureBuilder';
import { InteractiveCabinet } from '../entities/InteractiveCabinet';
import { CollectibleItem } from '../entities/CollectibleItem';

export class MapGenerator {
  public colliders: THREE.Box3[] = [];
  public emergencyLights: THREE.PointLight[] = [];
  public doors: Door[] = [];
  public cabinets: InteractiveCabinet[] = [];
  public items: CollectibleItem[] = [];
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

    // Piso e Teto
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    this.scene.add(floorMesh);

    const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilingMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(0, h, 0);
    this.scene.add(ceilMesh);

    // Ilumina??o Geral N?tida
    const amb = new THREE.AmbientLight(0x718096, 2.4);
    this.scene.add(amb);

    const sun = new THREE.DirectionalLight(0xf8fafc, 0.8);
    sun.position.set(0, 10, 0);
    this.scene.add(sun);

    // 1. LIMITES EXTERNOS DA CL?NICA
    this.createWall(0, -11, w, 0.3, h, wallMat);  // Parede Norte

    // Parede Sul com a GRANDE PORTA DE SA?DA FINAL NO CENTRO
    this.createWall(-7, 11, 12, 0.3, h, wallMat);
    this.createWall(7, 11, 12, 0.3, h, wallMat);
    const exitDoor = new Door('door_exit', 0, 11, 0, this.scene, this.audio, wallMat, true, 'master_key', true);
    this.doors.push(exitDoor);

    this.createWall(-13, 0, 0.3, d, h, wallMat); // Parede Oeste
    this.createWall(13, 0, 0.3, d, h, wallMat);  // Parede Leste

    // ====================================================================
    // PLANTA DOS C?MODOS
    // ====================================================================

    // PAREDES DO CORREDOR CENTRAL (Largura de 4 metros)
    // Lado Oeste do Corredor Central
    this.createWall(-4, 7, 0.3, 8, h, wallMat);   // Segmento Sul
    this.createWall(-4, -7, 0.3, 8, h, wallMat);  // Segmento Norte
    // Lado Leste do Corredor Central
    this.createWall(4, 7, 0.3, 8, h, wallMat);    // Segmento Sul
    this.createWall(4, -7, 0.3, 8, h, wallMat);   // Segmento Norte

    // Parede Divis?ria Horizontal Oeste (divide Sala Cir?rgica e Enfermaria)
    this.createWall(-8.5, 0, 9, 0.3, h, wallMat);
    // Parede Divis?ria Horizontal Leste (divide Farm?cia e Vesti?rio)
    this.createWall(8.5, 0, 9, 0.3, h, wallMat);

    // ====================================================================
    // PORTAS ENCAIXADAS NOS V?OS DAS PAREDES
    // ====================================================================
    // 1. Porta da Sala Cir?rgica (Trancada com chave vermelha)
    const doorSurg = new Door('door_cirurgia', -4, -1.5, Math.PI / 2, this.scene, this.audio, wallMat, true, 'red_key');
    this.doors.push(doorSurg);

    // 2. Porta da Enfermaria (Aberta livremente para busca inicial)
    const doorEnf = new Door('door_enfermaria', -4, 1.5, Math.PI / 2, this.scene, this.audio, wallMat, false, null);
    this.doors.push(doorEnf);

    // 3. Porta da Farm?cia (Trancada com cart?o de acesso)
    const doorPharm = new Door('door_farmacia', 4, -1.5, Math.PI / 2, this.scene, this.audio, wallMat, true, 'card_key');
    this.doors.push(doorPharm);

    // 4. Porta do Vesti?rio (Livre)
    const doorVest = new Door('door_vestiario', 4, 1.5, Math.PI / 2, this.scene, this.audio, wallMat, false, null);
    this.doors.push(doorVest);

    // ====================================================================
    // MOB?LIAS POSICIONADAS NAS PAREDES (Sem bloquear passagens)
    // ====================================================================
    // --- SAGU?O CENTRAL ---
    FurnitureBuilder.createOfficeDeskWithPC(0, -6, Math.PI, this.scene, this.colliders);
    // Arm?rio da recep??o agora encostado na parede norte
    const cabLobby = new InteractiveCabinet('cab_lobby', -2, -10.3, 0, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabLobby);

    // --- SALA DE CIRURGIA (Noroeste) ---
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const surgTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 2.6), metalMat);
    surgTable.position.set(-8.5, 0.42, -5.5);
    surgTable.userData.isCollider = true;
    this.scene.add(surgTable);

    const cabSurg = new InteractiveCabinet('cab_surg', -12.3, -5.5, Math.PI / 2, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabSurg);

    // ITENS DE FUGA:
    // Chave Mestra da Sa?da Dourada escondida dentro do arm?rio da cirurgia!
    const masterKey = new CollectibleItem('master_key', 'Chave Mestra da Sa?da', 'master_key', -12.1, 1.25, -5.5, this.scene, this.audio);
    this.items.push(masterKey);

    // --- ENFERMARIA (Sudoeste) ---
    FurnitureBuilder.createHospitalBed(-10.5, 4.5, Math.PI / 2, this.scene, this.colliders);
    FurnitureBuilder.createHospitalBed(-10.5, 7.5, Math.PI / 2, this.scene, this.colliders);
    FurnitureBuilder.createLockersRow(-12.4, 2, Math.PI / 2, this.scene, this.colliders);

    // Cart?o de Acesso colocado em cima de uma das camas
    const cardKey = new CollectibleItem('card_key', 'Cart?o da Farm?cia', 'card_key', -10.5, 0.9, 4.5, this.scene, this.audio);
    this.items.push(cardKey);

    // --- FARM?CIA (Nordeste) ---
    const cabPharm = new InteractiveCabinet('cab_pharm', 12.3, -5.5, -Math.PI / 2, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabPharm);

    // Chave Vermelha da Cirurgia guardada dentro da farm?cia
    const redKey = new CollectibleItem('red_key', 'Chave Vermelha de Cirurgia', 'red_key', 8.5, 1.2, -10.2, this.scene, this.audio);
    this.items.push(redKey);

    // --- VESTI?RIO (Sudeste) ---
    FurnitureBuilder.createLockersRow(8.5, 10.3, 0, this.scene, this.colliders);
    const cabVest = new InteractiveCabinet('cab_vest', 12.3, 5.5, -Math.PI / 2, this.scene, this.audio, this.colliders);
    this.cabinets.push(cabVest);

    // Luzes de Alerta nos Quartos
    const surgLight = new THREE.PointLight(0x38bdf8, 2.2, 12);
    surgLight.position.set(-8.5, 2.9, -5.5);
    this.scene.add(surgLight);

    const exitLight = new THREE.PointLight(0xef4444, 3.5, 10);
    exitLight.position.set(0, 2.9, 10.2);
    this.scene.add(exitLight);
    this.emergencyLights.push(exitLight);

    // C?meras CCTV
    this.camSystem.cameras = [];
    this.camSystem.addCamera('cam_1', 'CAM 01 // SAGU?O & SA?DA', new THREE.Vector3(0, 2.8, -9), new THREE.Vector3(0, 0.8, 10));
    this.camSystem.addCamera('cam_2', 'CAM 02 // SALA CIR?RGICA', new THREE.Vector3(-12, 2.8, -10), new THREE.Vector3(-8.5, 0.5, -5.5));
    this.camSystem.addCamera('cam_3', 'CAM 03 // ENFERMARIA', new THREE.Vector3(-12, 2.8, 10), new THREE.Vector3(-8.5, 0.6, 5.5));
    this.camSystem.addCamera('cam_4', 'CAM 04 // FARM?CIA', new THREE.Vector3(12, 2.8, -10), new THREE.Vector3(8.5, 0.8, -5));

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
