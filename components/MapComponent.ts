// tor-game\components\MapComponent.ts
import * as THREE from 'three';

export const createMap = (scene: THREE.Scene) => {
  // Ustawienia
  const mapSize = 8000; // Rozmiar mapy
  const halfMapSize = mapSize / 2;

  // Teren (tekstura trawy)
  const floorThickness = 10;
  const floorGeometry = new THREE.BoxGeometry(mapSize, floorThickness, mapSize);
  const floorTexture = new THREE.TextureLoader().load('/textures/grass.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.set(0, -floorThickness / 2, 0);
  floorMesh.name = 'floor';
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Tablica przeszkód do zarządzania obiektami kolidującymi
  const obstacles: THREE.Mesh[] = [];
  obstacles.push(floorMesh);

  // Oświetlenie
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(-halfMapSize, 1000, -halfMapSize);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Rozmiary elementów
  const baseSize = 300;
  const towerHeight = 200;
  const towerRadius = 40;

  // Funkcja pomocnicza do tworzenia baz
  const createBase = (x: number, z: number, color: number, name: string) => {
    const geometry = new THREE.BoxGeometry(baseSize, 150, baseSize);
    const material = new THREE.MeshStandardMaterial({ color });
    const base = new THREE.Mesh(geometry, material);
    base.position.set(x, 75, z);
    base.name = name;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData = { hp: 500 };
    obstacles.push(base);
    scene.add(base);
  };

  // Funkcja pomocnicza do tworzenia wież
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
  };

  // Umieszczanie baz
  createBase(-halfMapSize + 700, -halfMapSize + 700, 0x0000ff, 'blue_base');
  createBase(halfMapSize - 700, halfMapSize - 700, 0xff0000, 'red_base');

  // Umieszczanie wież w każdej bazie
  const basePositions = [
    { x: -halfMapSize + 1000, z: -halfMapSize + 1000 },
    { x: -halfMapSize + 1300, z: -halfMapSize + 700 },
    { x: -halfMapSize + 700, z: -halfMapSize + 1300 },
    { x: halfMapSize - 1000, z: halfMapSize - 1000 },
    { x: halfMapSize - 1300, z: halfMapSize - 700 },
    { x: halfMapSize - 700, z: halfMapSize - 1300 },
  ];
  basePositions.forEach((pos, index) => {
    const teamColor = index < 3 ? 0x0000ff : 0xff0000;
    const teamName = index < 3 ? 'blue' : 'red';
    createTower(pos.x, pos.z, teamColor, `${teamName}_base_tower_${index + 1}`);
  });

  // Tworzenie ścieżek (tylko środkowa)
  const roadWidth = 400;
  const roadTexture = new THREE.TextureLoader().load('/textures/path.jpg');
  roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;

  const createPath = (start: { x: number; z: number }, end: { x: number; z: number }) => {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const distance = Math.hypot(dx, dz);
    const geometry = new THREE.BoxGeometry(distance, 10, roadWidth);
    const material = new THREE.MeshStandardMaterial({ map: roadTexture });
    const roadMesh = new THREE.Mesh(geometry, material);
    roadMesh.rotation.y = -Math.atan2(dz, dx);
    roadMesh.position.set((start.x + end.x) / 2, 0, (start.z + end.z) / 2);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);
  };

  // Definicja tylko środkowej ścieżki
  const centerLane = [
    { x: -halfMapSize + 700, z: -halfMapSize + 700 },  // Początkowa pozycja
    { x: halfMapSize - 700, z: halfMapSize - 700 },
  ];

  // Tworzenie środkowej ścieżki
  createPath(centerLane[0], centerLane[1]);

  // Obszar dżungli z drzewami
  const createTree = (x: number, z: number) => {
    const geometry = new THREE.CylinderGeometry(5, 20, 100, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const tree = new THREE.Mesh(geometry, material);
    tree.position.set(x, 50, z);
    tree.name = 'tree';
    tree.castShadow = true;
    scene.add(tree);
  };

  // Losowe rozmieszczenie drzew w obszarze dżungli
  const jungleArea = [
    { xMin: -halfMapSize + 1000, xMax: halfMapSize - 1000, zMin: -halfMapSize + 2000, zMax: halfMapSize - 2000 },
  ];
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * (jungleArea[0].xMax - jungleArea[0].xMin) + jungleArea[0].xMin;
    const z = Math.random() * (jungleArea[0].zMax - jungleArea[0].zMin) + jungleArea[0].zMin;
    if (Math.abs(x) > 1000 || Math.abs(z) > 1000) createTree(x, z); // Unikaj środka/środkowej ścieżki
  }

  return { obstacles, mapSize };
};
