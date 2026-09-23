import * as THREE from 'three';

export class Monster {
  public mesh: THREE.Group;
  private head: THREE.Mesh;
  private speed: number = 2.4;
  public isStunned: boolean = false;
  private stunTimer: number = 0;
  private eyeLight!: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x161c18,
      roughness: 0.35,
      metalness: 0.2
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 2.3, 12), skinMat);
    body.position.y = 1.15;
    body.userData.isMonster = true;
    this.mesh.add(body);

    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), skinMat);
    this.head.position.set(0, 2.3, 0);
    this.head.scale.set(0.85, 1.35, 0.9);
    this.head.userData.isMonster = true;
    this.mesh.add(this.head);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    eye.position.set(0, 2.35, 0.22);
    this.mesh.add(eye);

    this.eyeLight = new THREE.PointLight(0xff0033, 2.2, 5);
    this.eyeLight.position.copy(eye.position);
    this.mesh.add(this.eyeLight);

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 1.8, 8), skinMat);
      arm.position.set(side * 0.42, 1.3, 0.1);
      arm.rotation.z = side * 0.22;
      arm.userData.isMonster = true;
      this.mesh.add(arm);
    }

    this.mesh.position.set(0, 0, -10);
    scene.add(this.mesh);
  }

  public stun(duration: number): void {
    this.isStunned = true;
    this.stunTimer = duration;
    this.eyeLight.color.setHex(0x38bdf8); // Olho fica azul ao ser sedado
  }

  public update(delta: number, time: number, targetPos: THREE.Vector3, isHostOrSolo: boolean): void {
    if (this.isStunned) {
      this.stunTimer -= delta;
      // Anima??o de cambalear desorientado
      this.head.rotation.x = 0.5 + Math.sin(time * 6) * 0.15;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.eyeLight.color.setHex(0xff0033);
      }
      return;
    }

    if (isHostOrSolo) {
      const dist = this.mesh.position.distanceTo(targetPos);
      if (dist > 1.2) {
        const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
        dir.y = 0;
        this.mesh.position.addScaledVector(dir, this.speed * delta);
        this.mesh.lookAt(targetPos.x, this.mesh.position.y, targetPos.z);
      }
    }

    this.head.rotation.z = Math.sin(time * 16) * 0.14;
    this.head.position.x = (Math.random() - 0.5) * 0.03;
  }
}
