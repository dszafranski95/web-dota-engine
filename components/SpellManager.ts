// components/SpellManager.ts
import * as THREE from 'three';
import { ProjectileManager } from './ProjectileManager';

interface Spell {
  number: number;
  name: string;
  range: number;
  damage: number;
  cooldown: number;
  lastCast: number;
  color: number;
  type: string; // Dodane pole 'type' dla identyfikacji rodzaju czaru
}

export class SpellManager {
  private spells: { [key: number]: Spell } = {};
  private spellCooldownsState: { [key: number]: number } = {};
  public isSelectingTarget: boolean = false; // Zmienione na publiczne, aby dostępne było w GameCanvas
  private currentSpell: Spell | null = null;
  private targetMarker: THREE.Mesh;
  private rangeCircle: THREE.Mesh;
  private player: THREE.Mesh;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.Renderer;
  private raycaster: THREE.Raycaster;
  private floor: THREE.Mesh | undefined;
  private terrain: THREE.Mesh | undefined;
  private obstacles: THREE.Mesh[];
  private projectileManager: ProjectileManager;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    player: THREE.Mesh,
    obstacles: THREE.Mesh[],
    projectileManager: ProjectileManager,
    floor?: THREE.Mesh,
    terrain?: THREE.Mesh
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.player = player;
    this.obstacles = obstacles;
    this.projectileManager = projectileManager;
    this.floor = floor;
    this.terrain = terrain;
    this.raycaster = new THREE.Raycaster();

    // Definicja czarów
    this.defineSpells();

    // Tworzenie celownika
    this.targetMarker = this.createTargetMarker();
    scene.add(this.targetMarker);

    // Tworzenie okręgu zasięgu
    this.rangeCircle = this.createRangeCircle();
    scene.add(this.rangeCircle);

    // Obsługa myszy
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private defineSpells() {
    this.spells = {
      1: {
        number: 1,
        name: 'Fireball',
        range: 200,
        damage: 10,
        cooldown: 0,
        lastCast: 0,
        color: 0xff4500,
        type: 'fireball',
      },
      2: {
        number: 2,
        name: 'Snowball',
        range: 300,
        damage: 20,
        cooldown: 5000,
        lastCast: 0,
        color: 0x1e90ff,
        type: 'snowball',
      },
      3: {
        number: 3,
        name: 'Lightning Bolt',
        range: 400,
        damage: 30,
        cooldown: 15000,
        lastCast: 0,
        color: 0xffff00,
        type: 'lightning',
      },
      4: {
        number: 4,
        name: 'Poison Cloud',
        range: 500,
        damage: 50,
        cooldown: 60000,
        lastCast: 0,
        color: 0x32cd32,
        type: 'poison',
      },
    };

    // Inicjalizacja stanów cooldownów
    for (const spellNum in this.spells) {
      this.spellCooldownsState[spellNum] = 0;
    }
  }

  private createTargetMarker(): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(10, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.x = -Math.PI / 2; // Ustawienie płaszczyzny poziomej
    marker.visible = false;
    return marker;
  }

  private createRangeCircle(): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(1, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      opacity: 0.3,
      transparent: true,
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = -Math.PI / 2; // Poziomo na ziemi
    circle.position.copy(this.player.position);
    circle.visible = false;
    return circle;
  }

  private onMouseMove = (event: MouseEvent) => {
    if (this.isSelectingTarget && this.currentSpell) {
      const mouse = new THREE.Vector2();
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(mouse, this.camera);

      const intersectObjects = [];
      if (this.floor) intersectObjects.push(this.floor);
      if (this.terrain) intersectObjects.push(this.terrain);

      if (intersectObjects.length === 0) {
        console.error('Brak obiektów do przecięcia w onMouseMove.');
        return;
      }

      const intersects = this.raycaster.intersectObjects(intersectObjects, true);
      if (intersects.length > 0) {
        let point = intersects[0].point;
        const distance = this.player.position.distanceTo(point);
        if (distance > this.currentSpell.range) {
          const direction = point.clone().sub(this.player.position).normalize();
          point = this.player.position.clone().add(direction.multiplyScalar(this.currentSpell.range));
        }
        this.targetMarker.position.set(point.x, 1, point.z);
      }
    }
  };

  private onMouseDown = (event: MouseEvent) => {
    event.preventDefault();

    if (event.button === 2) {
      // Prawy przycisk myszy - potwierdzenie rzutu czaru
      if (this.isSelectingTarget && this.currentSpell) {
        this.castSpell(this.currentSpell);
        this.isSelectingTarget = false;
        this.currentSpell = null;
        this.targetMarker.visible = false;
        this.rangeCircle.visible = false;
      }
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const spellNum = parseInt(event.key);
    if (spellNum >= 1 && spellNum <= 4) {
      const spell = this.spells[spellNum];
      const now = Date.now();
      const cooldown = spell.cooldown;
      const lastCast = spell.lastCast;
      if (cooldown > 0 && now - lastCast < cooldown) {
        console.log(`Czar ${spellNum} jest w trakcie odnowienia.`);
        return;
      }
      // Wejście w tryb celowania
      this.isSelectingTarget = true;
      this.currentSpell = spell;

      // Wyświetlenie celownika na pozycji gracza
      this.targetMarker.position.copy(this.player.position);
      this.targetMarker.visible = true;

      // Wyświetlenie okręgu zasięgu
      this.rangeCircle.visible = true;
      this.rangeCircle.scale.set(spell.range, spell.range, spell.range);
    }
  };

  private castSpell(spell: Spell) {
    const now = Date.now();

    // Sprawdzenie cooldown
    const cooldown = spell.cooldown;
    const lastCast = spell.lastCast;
    if (cooldown > 0 && now - lastCast < cooldown) {
      console.log(`Czar ${spell.number} jest w trakcie odnowienia.`);
      return;
    }

    // Aktualizacja ostatniego czasu użycia czaru
    spell.lastCast = now;

    // Aktualizacja stanu cooldown
    this.spellCooldownsState[spell.number] = cooldown;

    // Tworzenie pocisku
    this.projectileManager.createProjectile(
      this.player.position.clone(),
      this.targetMarker.position.clone(),
      spell
    );
  }

  public update() {
    // Aktualizacja cooldownów
    const now = Date.now();
    for (const key in this.spells) {
      const spellNum = Number(key);
      const spell = this.spells[spellNum];
      const cooldown = spell.cooldown;
      const lastCast = spell.lastCast;
      const timeSinceLastCast = now - lastCast;
      const remainingCooldown = cooldown - timeSinceLastCast;

      if (remainingCooldown <= 0) {
        this.spellCooldownsState[spellNum] = 0;
      } else {
        this.spellCooldownsState[spellNum] = remainingCooldown;
      }
    }

    // Aktualizacja pozycji okręgu zasięgu
    if (this.rangeCircle.visible) {
      this.rangeCircle.position.copy(this.player.position);
    }

    // Animacja celownika
    if (this.targetMarker.visible) {
      this.targetMarker.rotation.z += 0.05;
    }
  }

  public getCooldowns() {
    return this.spellCooldownsState;
  }

  public dispose() {
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
