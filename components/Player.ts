// tor-game\components\Player.ts
import * as THREE from 'three';

export class Player {
  public mesh: THREE.Mesh;
  private speed: number = 2; // Zmniejszona prędkość dla płynniejszego ruchu
  private destination: THREE.Vector3;
  private isMoving: boolean = false;
  private obstacles: THREE.Mesh[];
  private halfMapSize: number;

  constructor(
    scene: THREE.Scene,
    obstacles: THREE.Mesh[],
    halfMapSize: number,
    initialPosition: THREE.Vector3 = new THREE.Vector3(0, 20, 60)
  ) {
    this.obstacles = obstacles;
    this.halfMapSize = halfMapSize;

    const geometry = new THREE.SphereGeometry(20, 32, 32); // Promień 20
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Zmieniono na MeshStandardMaterial
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(initialPosition);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    this.destination = this.mesh.position.clone();
  }

  public setDestination(destination: THREE.Vector3) {
    this.destination.copy(destination);
    this.isMoving = true;
    console.log(`Nowy cel ruchu: (${destination.x}, ${destination.y}, ${destination.z})`);
  }

  public update() {
    if (this.isMoving) {
      const direction = new THREE.Vector3().subVectors(this.destination, this.mesh.position);
      direction.y = 0; // Ignorujemy składową pionową
      const distance = direction.length();

      if (distance > 1) {
        direction.normalize();
        const moveDistance = Math.min(this.speed, distance); // Ruch tylko do celu, jeśli blisko

        const newPosition = this.mesh.position.clone().add(direction.multiplyScalar(moveDistance));

        // Sprawdzanie granic mapy
        const boundary = this.halfMapSize - 20; // 20 to margines
        if (
          newPosition.x < -boundary ||
          newPosition.x > boundary ||
          newPosition.z < -boundary ||
          newPosition.z > boundary
        ) {
          console.log('Gracz osiągnął granice mapy');
          this.isMoving = false;
          return;
        }

        // Tworzenie bounding boxa dla gracza w nowej pozycji
        const playerBoundingBox = new THREE.Box3().setFromObject(this.mesh).translate(direction.multiplyScalar(moveDistance));

        // Sprawdzanie kolizji z przeszkodami
        let collision = false;
        for (const obstacle of this.obstacles) {
          if (obstacle.name === 'floor' || obstacle.name === 'river' || obstacle.name === 'path') continue; // Wykluczamy ścieżki

          const obstacleBox = new THREE.Box3().setFromObject(obstacle);
          if (playerBoundingBox.intersectsBox(obstacleBox)) {
            collision = true;
            this.isMoving = false;
            console.log('Gracz zderzył się z:', obstacle.name);
            break;
          }
        }

        // Aktualizacja pozycji jeśli nie ma kolizji
        if (!collision) {
          this.mesh.position.copy(newPosition);
          console.log(`Gracz przesunął się do: (${newPosition.x}, ${newPosition.y}, ${newPosition.z})`);
        }
      } else {
        this.mesh.position.copy(this.destination);
        this.isMoving = false;
        console.log('Gracz osiągnął cel');
      }

      // Utrzymanie pozycji pionowej gracza
      const floorY = 20;
      this.mesh.position.y = floorY;
    }
  }
}
