// components/ProjectileManager.ts
import * as THREE from 'three';

interface Spell {
  number: number;
  name: string;
  range: number;
  damage: number;
  cooldown: number;
  lastCast: number;
  color: number;
  type: string;
}

export class ProjectileManager {
  private scene: THREE.Scene;
  private obstacles: THREE.Mesh[];
  private projectiles: THREE.Object3D[] = [];
  private halfMapSize: number;

  constructor(scene: THREE.Scene, obstacles: THREE.Mesh[], halfMapSize: number) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.halfMapSize = halfMapSize;
  }

  public createProjectile(
    startPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    spell: Spell
  ) {
    let projectile: THREE.Object3D;

    switch (spell.type) {
      case 'fireball':
        projectile = this.createFireball(spell);
        break;
      case 'snowball':
        projectile = this.createSnowball(spell);
        break;
      case 'lightning':
        projectile = this.createLightningBolt(startPosition, targetPosition, spell);
        break;
      case 'poison':
        projectile = this.createPoisonCloud(spell);
        projectile.position.copy(targetPosition); // Chmura trucizny pojawia się na celu
        break;
      default:
        projectile = this.createBasicProjectile(spell);
        break;
    }

    if (spell.type !== 'lightning' && spell.type !== 'poison') {
      // Ustawienie początkowej pozycji dla ruchomych pocisków
      projectile.position.copy(startPosition);

      // Obliczenie kierunku i prędkości
      const direction = new THREE.Vector3().subVectors(targetPosition, startPosition).normalize();

      (projectile as any).velocity = direction.clone().multiplyScalar(20);
    }

    (projectile as any).damage = spell.damage;

    this.scene.add(projectile);
    this.projectiles.push(projectile);
  }

  private createFireball(spell: Spell): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(10, 16, 16);
    const texture = new THREE.TextureLoader().load('/textures/fire.png');
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const fireball = new THREE.Mesh(geometry, material);

    // Opcjonalnie: dodanie światła
    const light = new THREE.PointLight(0xff4500, 1, 500);
    fireball.add(light);

    return fireball;
  }

  private createSnowball(spell: Spell): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(10, 16, 16);
    const texture = new THREE.TextureLoader().load('/textures/snow.png');
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const snowball = new THREE.Mesh(geometry, material);

    return snowball;
  }

  private createLightningBolt(
    startPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    spell: Spell
  ): THREE.Object3D {
    const material = new THREE.LineBasicMaterial({ color: spell.color });

    // Tworzenie punktów dla linii
    const points = [];
    points.push(startPosition.clone());

    // Dodanie losowych przesunięć dla efektu zygzaka
    const midPoint = startPosition.clone().lerp(targetPosition, 0.5);
    midPoint.x += (Math.random() - 0.5) * 50;
    midPoint.y += (Math.random() - 0.5) * 50;
    midPoint.z += (Math.random() - 0.5) * 50;
    points.push(midPoint);

    points.push(targetPosition.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const lightningBolt = new THREE.Line(geometry, material);

    // Dodanie czasu życia dla błyskawicy
    (lightningBolt as any).lifetime = 0.1; // Błyskawica znika po 0.1 sekundy
    (lightningBolt as any).creationTime = performance.now();

    (lightningBolt as any).damage = spell.damage;
    (lightningBolt as any).targetPosition = targetPosition.clone();

    return lightningBolt;
  }

  private createPoisonCloud(spell: Spell): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(15, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: spell.color,
      opacity: 0.5,
      transparent: true,
    });

    const poisonCloud = new THREE.Mesh(geometry, material);

    // Dodanie efektu powiększania chmury
    (poisonCloud as any).growthRate = 0.05; // Chmura rośnie o 5% na klatkę
    (poisonCloud as any).maxSize = 2; // Maksymalny mnożnik rozmiaru
    (poisonCloud as any).currentSize = 1;

    // Dodanie czasu życia chmury
    (poisonCloud as any).lifetime = 5000; // Chmura trwa 5 sekund
    (poisonCloud as any).creationTime = performance.now();

    return poisonCloud;
  }

  private createBasicProjectile(spell: Spell): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(10, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: spell.color });
    const projectile = new THREE.Mesh(geometry, material);
    return projectile;
  }

  public update() {
    const currentTime = performance.now();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      const projectileData = projectile as any;
      const damage = projectileData.damage as number;

      if (projectile instanceof THREE.Line) {
        // Obsługa błyskawicy
        const lifetime = projectileData.lifetime;
        const creationTime = projectileData.creationTime;
        if (currentTime - creationTime >= lifetime * 1000) {
          // Usuwamy błyskawicę po upływie jej czasu życia
          this.scene.remove(projectile);
          this.projectiles.splice(i, 1);
          continue;
        }

        // Wykrywanie trafienia na pozycji celu
        this.checkCollision(projectileData.targetPosition, damage);

      } else if (projectile instanceof THREE.Mesh && projectileData.growthRate) {
        // Obsługa chmury trucizny
        projectileData.currentSize += projectileData.growthRate;
        if (projectileData.currentSize >= projectileData.maxSize) {
          projectileData.currentSize = projectileData.maxSize;
        }
        projectile.scale.set(
          projectileData.currentSize,
          projectileData.currentSize,
          projectileData.currentSize
        );

        // Sprawdzanie czasu życia
        const lifetime = projectileData.lifetime;
        const creationTime = projectileData.creationTime;
        if (currentTime - creationTime >= lifetime) {
          // Usuwamy chmurę trucizny po upływie jej czasu życia
          this.scene.remove(projectile);
          this.projectiles.splice(i, 1);
          continue;
        }

        // Opcjonalnie: zadawanie obrażeń obszarowych
        this.checkAreaDamage(projectile.position, projectileData.currentSize * 15, damage);

      } else {
        // Standardowe pociski (kula ognia, kula śnieżna)
        const velocity = projectileData.velocity as THREE.Vector3;
        if (velocity) {
          projectile.position.add(velocity);
        } else {
          console.error('Pocisk nie ma przypisanej prędkości:', projectile);
        }

        // Sprawdzanie kolizji z przeszkodami
        const projectileBoundingBox = new THREE.Box3().setFromObject(projectile);

        let hit = false;

        for (const obstacle of this.obstacles) {
          if (obstacle.name === 'floor' || obstacle.name === 'river') continue;

          const obstacleBox = new THREE.Box3().setFromObject(obstacle);
          if (projectileBoundingBox.intersectsBox(obstacleBox)) {
            // Trafienie w budynek
            this.applyDamage(obstacle, damage);

            // Usuwamy pocisk
            this.scene.remove(projectile);
            this.projectiles.splice(i, 1);
            hit = true;
            break;
          }
        }

        // Usuwanie pocisku po opuszczeniu granic mapy
        const boundary = this.halfMapSize;
        if (
          projectile.position.x < -boundary ||
          projectile.position.x > boundary ||
          projectile.position.z < -boundary ||
          projectile.position.z > boundary
        ) {
          this.scene.remove(projectile);
          this.projectiles.splice(i, 1);
          hit = true;
        }
      }
    }
  }

  private applyDamage(obstacle: THREE.Mesh, damage: number) {
    if (!obstacle.userData.hp) {
      obstacle.userData.hp = 100; // Domyślne HP
    }

    obstacle.userData.hp -= damage;
    console.log(
      `Budynek ${obstacle.name} otrzymał ${damage} obrażeń. Pozostałe HP: ${obstacle.userData.hp}`
    );

    if (obstacle.userData.hp <= 0) {
      this.scene.remove(obstacle);
      this.obstacles.splice(this.obstacles.indexOf(obstacle), 1);
      console.log('Zniszczono budynek:', obstacle.name);
    }
  }

  private checkCollision(position: THREE.Vector3, damage: number) {
    for (const obstacle of this.obstacles) {
      if (obstacle.name === 'floor' || obstacle.name === 'river') continue;

      const obstacleBox = new THREE.Box3().setFromObject(obstacle);
      if (obstacleBox.containsPoint(position)) {
        // Trafienie w budynek
        this.applyDamage(obstacle, damage);
        break;
      }
    }
  }

  private checkAreaDamage(center: THREE.Vector3, radius: number, damage: number) {
    const sphere = new THREE.Sphere(center, radius);

    for (const obstacle of this.obstacles) {
      if (obstacle.name === 'floor' || obstacle.name === 'river') continue;

      const obstacleBox = new THREE.Box3().setFromObject(obstacle);
      if (sphere.intersectsBox(obstacleBox)) {
        // Zadawanie obrażeń obszarowych
        this.applyDamage(obstacle, damage);
      }
    }
  }
}
