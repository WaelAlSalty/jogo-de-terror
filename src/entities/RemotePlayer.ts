import * as THREE from 'three';

export class RemotePlayer {
  public mesh: THREE.Group;
  private flashlight: THREE.SpotLight;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.7, 12), bodyMat);
    body.position.y = 0.85;
    this.mesh.add(body);

    this.flashlight = new THREE.SpotLight(0xfff0dd, 4.0, 20, Math.PI / 5, 0.5);
    this.flashlight.position.set(0, 1.4, 0);

    const target = new THREE.Object3D();
    target.position.set(0, 1.4, -1);
    this.mesh.add(this.flashlight);
    this.mesh.add(target);
    this.flashlight.target = target;

    scene.add(this.mesh);
  }

  public syncTransform(x: number, y: number, z: number, rotY: number): void {
    this.mesh.position.set(x, y - 1.6, z);
    this.mesh.rotation.y = rotY;
  }

  public destroy(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }
}
