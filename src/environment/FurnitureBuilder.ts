import * as THREE from 'three';

export class FurnitureBuilder {
  private static metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
  private static darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
  private static rustCabinetMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.3 });
  private static deskMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.5 });
  private static mattressMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.7 });
  private static pillowMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
  private static glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x99f6e4,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.15
  });

  // 1. Arm?rio M?dico com Portas de Vidro e Puxadores
  public static createMedicalCabinet(x: number, z: number, rotY: number, scene: THREE.Scene, colliders: THREE.Box3[]): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Corpo do arm?rio
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.3, 0.6), this.rustCabinetMat);
    body.position.y = 1.15;
    group.add(body);

    // V?o com vidros frontais
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.05), this.glassMat);
    glass.position.set(0, 1.25, 0.3);
    group.add(glass);

    // Divis?ria central e prateleiras internas vis?veis
    for (let h of [0.7, 1.2, 1.7]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.5), this.metalMat);
      shelf.position.set(0, h, 0);
      group.add(shelf);
    }

    // Puxadores cromados
    for (let side of [-0.08, 0.08]) {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8), this.metalMat);
      handle.position.set(side, 1.2, 0.33);
      group.add(handle);
    }

    // P?s de a?o
    for (let px of [-0.7, 0.7]) {
      for (let pz of [-0.22, 0.22]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8), this.metalMat);
        leg.position.set(px, 0.075, pz);
        group.add(leg);
      }
    }

    scene.add(group);
    colliders.push(new THREE.Box3().setFromObject(group));
    return group;
  }

  // 2. Fileira de Arm?rios de Vesti?rio (Lockers)
  public static createLockersRow(x: number, z: number, rotY: number, scene: THREE.Scene, colliders: THREE.Box3[]): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const lockerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.5 });
    const lockerW = 0.6;
    const count = 3;

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * lockerW;
      const locker = new THREE.Mesh(new THREE.BoxGeometry(lockerW - 0.04, 2.1, 0.55), lockerMat);
      locker.position.set(offset, 1.05, 0);
      group.add(locker);

      // Frestas de ventila??o superiores
      for (let s = 1.6; s <= 1.8; s += 0.08) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), this.darkMetalMat);
        vent.position.set(offset, s, 0.28);
        group.add(vent);
      }

      // Fechadura / Trinco
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), this.metalMat);
      lock.position.set(offset + 0.18, 1.1, 0.28);
      group.add(lock);
    }

    scene.add(group);
    colliders.push(new THREE.Box3().setFromObject(group));
    return group;
  }

  // 3. Cama Hospitalar com Suporte de Soro
  public static createHospitalBed(x: number, z: number, rotY: number, scene: THREE.Scene, colliders: THREE.Box3[]): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Estrutura tubular da base
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 2.3), this.metalMat);
    frame.position.y = 0.45;
    group.add(frame);

    // Colch?o hospitalar
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 2.15), this.mattressMat);
    mattress.position.set(0, 0.65, 0);
    group.add(mattress);

    // Travesseiro
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.45), this.pillowMat);
    pillow.position.set(0, 0.82, -0.75);
    group.add(pillow);

    // Cabeceira e Peseira tubulares
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.08), this.metalMat);
    headboard.position.set(0, 0.8, -1.15);
    group.add(headboard);

    const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.08), this.metalMat);
    footboard.position.set(0, 0.7, 1.15);
    group.add(footboard);

    // 4 Rodinhas de metal
    for (let px of [-0.55, 0.55]) {
      for (let pz of [-0.95, 0.95]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), this.darkMetalMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(px, 0.15, pz);
        group.add(wheel);
      }
    }

    // Suporte vertical de soro acoplado na lateral
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 8), this.metalMat);
    pole.position.set(0.65, 1.1, -0.9);
    group.add(pole);

    const ivBag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.06), this.glassMat);
    ivBag.position.set(0.65, 1.8, -0.9);
    group.add(ivBag);

    scene.add(group);
    colliders.push(new THREE.Box3().setFromObject(group));
    return group;
  }

  // 4. Mesa de Recep??o com Computador CRT
  public static createOfficeDeskWithPC(x: number, z: number, rotY: number, scene: THREE.Scene, colliders: THREE.Box3[]): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Tampo da mesa
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.0), this.deskMat);
    top.position.y = 0.85;
    group.add(top);

    // Gaveteiro lateral direito
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.9), this.deskMat);
    cabinet.position.set(0.7, 0.42, 0);
    group.add(cabinet);

    // Pernas met?licas do lado esquerdo
    for (let pz of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.82, 8), this.metalMat);
      leg.position.set(-0.9, 0.41, pz);
      group.add(leg);
    }

    // Monitor CRT com tela azulada emissiva
    const pcBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.38, 0.4), this.darkMetalMat);
    pcBody.position.set(0.1, 1.08, -0.1);
    group.add(pcBody);

    const pcScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.28), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    pcScreen.position.set(0.1, 1.08, 0.11);
    group.add(pcScreen);

    // Teclado
    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.16), this.metalMat);
    keyboard.position.set(0.1, 0.9, 0.25);
    group.add(keyboard);

    scene.add(group);
    colliders.push(new THREE.Box3().setFromObject(group));
    return group;
  }
}
