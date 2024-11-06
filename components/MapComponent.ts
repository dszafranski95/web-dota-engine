// tor-game\components\MapComponent.ts
import * as THREE from 'three';

export const createMap = (scene: THREE.Scene) => {
  // Ustawienia
  const mapSize = 20000;
  const halfMapSize = mapSize / 2;

  // Parametry rzeki
  const riverWidth = 800;
  const riverHeight = 20;

  // Teren (tekstura trawy)
  const floorThickness = 10;
  const floorGeometry = new THREE.BoxGeometry(mapSize, floorThickness, mapSize);
  const floorTexture = new THREE.TextureLoader().load('/textures/grass.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(200, 200);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.set(0, -floorThickness / 2, 0);
  floorMesh.name = 'floor';
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const obstacles: THREE.Mesh[] = [];
  obstacles.push(floorMesh);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-halfMapSize, 2000, -halfMapSize);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const baseSize = 500;
  const towerHeight = 300;
  const towerRadius = 60;

  // Funkcja do tworzenia bazy
  const createBase = (x: number, z: number, color: number, name: string) => {
    const baseGeometry = new THREE.CylinderGeometry(baseSize / 2, baseSize / 2, 200, 32, 1, false);
    const baseMaterial = new THREE.MeshStandardMaterial({ color });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(x, 100, z);
    baseMesh.name = name;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.userData = { hp: 1000 };
    obstacles.push(baseMesh);
    scene.add(baseMesh);
  };

  // Funkcja do tworzenia wieży
  const createTower = (x: number, z: number, color: number, name: string) => {
    const geometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    const tower = new THREE.Mesh(geometry, material);
    tower.position.set(x, towerHeight / 2, z);
    tower.name = name;
    tower.castShadow = true;
    tower.receiveShadow = true;
    tower.userData = { hp: 100 };
    obstacles.push(tower);
    scene.add(tower);

    // Dodanie etykiety nad wieżą
    const labelText = name.split('_').pop(); // Pobranie numeru z nazwy wieży
    if (labelText) {
      createLabel(labelText, x, towerHeight + 50, z, scene);
    }
  };

  // Funkcja do tworzenia etykiety (liczby lub litery)
  const createLabel = (text: string, x: number, y: number, z: number, scene: THREE.Scene) => {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (context) {
      // Tło przezroczyste
      context.clearRect(0, 0, size, size);
      // Ustawienia tekstu
      context.font = 'Bold 100px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      // Rysowanie tekstu
      context.fillText(text, size / 2, size / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(200, 200, 1); // Skalowanie etykiety
    sprite.position.set(x, y, z);
    sprite.renderOrder = 1;
    sprite.name = `label_${text}`;
    scene.add(sprite);
  };

  const roadWidth = 800;
  const roadTexture = new THREE.TextureLoader().load('/textures/path.jpg');
  roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(20, 1);

  // Funkcja do tworzenia ścieżki
  const createPath = (start: { x: number; z: number }, end: { x: number; z: number }, id: number) => {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const distance = Math.hypot(dx, dz);
    const geometry = new THREE.BoxGeometry(distance, 20, roadWidth);
    const material = new THREE.MeshStandardMaterial({ map: roadTexture });
    const roadMesh = new THREE.Mesh(geometry, material);
    roadMesh.rotation.y = -Math.atan2(dz, dx);
    roadMesh.position.set((start.x + end.x) / 2, -floorThickness / 2 + 1, (start.z + end.z) / 2);
    roadMesh.receiveShadow = true;
    roadMesh.name = `path_${id}`;
    scene.add(roadMesh);
  };

  // Ścieżki po prawej i lewej stronie mapy
  const pathSegmentRight1 = { start: { x: -halfMapSize + 1000, z: -halfMapSize + 1000 }, end: { x: halfMapSize - 1000, z: -halfMapSize + 1000 } };
  const pathSegmentRight2 = { start: { x: halfMapSize - 1000, z: -halfMapSize + 1000 }, end: { x: halfMapSize - 1000, z: halfMapSize - 1000 } };

  const pathSegmentLeft1 = { start: { x: -halfMapSize + 1000, z: halfMapSize - 1000 }, end: { x: halfMapSize - 1000, z: halfMapSize - 1000 } };
  const pathSegmentLeft2 = { start: { x: -halfMapSize + 1000, z: -halfMapSize + 1000 }, end: { x: -halfMapSize + 1000, z: halfMapSize - 1000 } };

  // Tworzenie ścieżek z ID
  createPath(pathSegmentRight1.start, pathSegmentRight1.end, 1);
  createPath(pathSegmentRight2.start, pathSegmentRight2.end, 2);

  createPath(pathSegmentLeft1.start, pathSegmentLeft1.end, 3);
  createPath(pathSegmentLeft2.start, pathSegmentLeft2.end, 4);

  // Umieszczanie baz
  createBase(-halfMapSize + 1000, -halfMapSize + 1000, 0x0000ff, 'blue_base');
  createBase(halfMapSize - 1000, halfMapSize - 1000, 0xff0000, 'red_base');

  // Centralna ścieżka od bazy do bazy
  const centralPath = { start: { x: -halfMapSize + 1000, z: -halfMapSize + 1000 }, end: { x: halfMapSize - 1000, z: halfMapSize - 1000 } };
  createPath(centralPath.start, centralPath.end, 5);

  // Ręczne definiowanie pozycji wież dla obu drużyn
  // Wieże niebieskie - symetryczne do czerwonych
  const blueTowerPositions: Array<{ x: number; z: number }> = [
    { x: -4000, z: -9000 },
    { x: -1000, z: -9000 },
    { x: 4000, z: -9000 },
    
    { x: -6000, z: -6000 },
    { x: -4000, z: -4000 },
    { x: -1800, z: -1800 },

    { x: -9000, z: -4000 },
    { x: -9000, z: 1000 },
    { x: -9000, z: 6000 },
  ];

  // Wieże czerwone
  const redTowerPositions: Array<{ x: number; z: number }> = [
    { x: 4000, z: 9000 },
    { x: -1000, z: 9000 },
    { x: -6000, z: 9000 },
    
    { x: 6000, z: 6000 },
    { x: 4000, z: 4000 },
    { x: 1800, z: 1800 },

    { x: 9000, z: 4000 },
    { x: 9000, z: -1000 },
    { x: 9000, z: -6000 },
  ];

  // Tworzenie wież dla drużyny niebieskiej
  blueTowerPositions.forEach((pos, index) => {
    createTower(pos.x, pos.z, 0x0000ff, `blue_tower_${index + 1}`);
  });

  // Tworzenie wież dla drużyny czerwonej
  redTowerPositions.forEach((pos, index) => {
    createTower(pos.x, pos.z, 0xff0000, `red_tower_${index + 1}`);
  });

  // Funkcja do tworzenia wież bazowych z etykietami literowymi
  const createBaseTurret = (x: number, z: number, color: number, team: 'blue' | 'red', label: string) => {
    const geometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    const turret = new THREE.Mesh(geometry, material);
    turret.position.set(x, towerHeight / 2, z);
    turret.name = `${team}_base_turret_${label}`;
    turret.castShadow = true;
    turret.receiveShadow = true;
    turret.userData = { hp: 200 };
    obstacles.push(turret);
    scene.add(turret);

    // Dodanie etykiety literowej nad wieżą bazową
    createLabel(label, x, towerHeight + 50, z, scene);
  };

  // Wieże bazowe otaczające bazę niebieską z etykietami A, B, C
  const blueBaseLabels = ['A', 'B', 'C'];
  const blueBasePositions = [
    { x: -halfMapSize + 900, z: -halfMapSize + 2400 },
    { x: -halfMapSize + 2000, z: -halfMapSize + 2100 },
    { x: -halfMapSize + 2400, z: -halfMapSize + 1000 },
  ];

  blueBasePositions.forEach((pos, index) => {
    createBaseTurret(pos.x, pos.z, 0x0000ff, 'blue', blueBaseLabels[index]);
  });

  // Wieże bazowe otaczające bazę czerwoną z etykietami A, B, C
  const redBaseLabels = ['A', 'B', 'C'];
  const redBasePositions = [
    { x: halfMapSize - 900, z: halfMapSize - 2400 },
    { x: halfMapSize - 2000, z: halfMapSize - 2100 },
    { x: halfMapSize - 2400, z: halfMapSize - 1000 },
  ];

  redBasePositions.forEach((pos, index) => {
    createBaseTurret(pos.x, pos.z, 0xff0000, 'red', redBaseLabels[index]);
  });

  const createRiver = () => {
    const riverLength = Math.hypot(mapSize, mapSize);
    const geometry = new THREE.BoxGeometry(riverLength, riverHeight, riverWidth);
    const texture = new THREE.TextureLoader().load('/textures/water.jpg');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(riverLength / 500, riverWidth / 200);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const riverMesh = new THREE.Mesh(geometry, material);
    riverMesh.rotation.y = Math.atan2(mapSize, mapSize);
    riverMesh.position.set(0, 0, 0);
    riverMesh.receiveShadow = true;
    scene.add(riverMesh);
  };

  createRiver();

  // Funkcja do tworzenia terenu bazy
  const createBaseTerrain = (x: number, z: number, radius: number, color: number) => {
    const geometry = new THREE.CircleGeometry(radius, 64);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/textures/base_terrain.jpg');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    const material = new THREE.MeshStandardMaterial({ map: texture, color });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(x, 0.1, z);
    terrain.receiveShadow = true;
    scene.add(terrain);
  };

  createBaseTerrain(-halfMapSize + 1000, -halfMapSize + 1000, 1500, 0x003300);
  createBaseTerrain(halfMapSize - 1000, halfMapSize - 1000, 1500, 0x330000);

  return { obstacles, mapSize };
};
