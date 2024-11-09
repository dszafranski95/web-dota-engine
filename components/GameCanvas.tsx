// components/GameCanvas.tsx
"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createMap, updateHealthBar } from './MapComponent';
import { OrbitControls } from 'three-stdlib';
import SkillBar from './SkillBar';
import { Player } from './Player';
import { SpellManager } from './SpellManager';
import { ProjectileManager } from './ProjectileManager';

const GameCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Stan cooldown dla czarów
  const [spellCooldownsState, setSpellCooldownsState] = useState<{ [key: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  useEffect(() => {
    // Inicjalizacja sceny
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Tło czarne

    // Inicjalizacja kamery
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );

    // Inicjalizacja renderera
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current?.appendChild(renderer.domElement);

    // Tworzenie mapy i przeszkód
    const { obstacles, mapSize } = createMap(scene);
    const halfMapSize = mapSize / 2;

    // Inicjalizacja gracza z początkową pozycją
    const playerInitialPosition = new THREE.Vector3(0, 20, 60); // Możesz zmienić początkową pozycję
    const player = new Player(scene, obstacles, halfMapSize, playerInitialPosition);

    // Dodanie AxesHelpera
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);

    // Dodanie kontroli kamery
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(player.mesh.position);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minPolarAngle = 0;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.NONE,
      MIDDLE: THREE.MOUSE.NONE,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    // Ustawienie kamery
    camera.position.set(
      player.mesh.position.x + 500,
      player.mesh.position.y + 500,
      player.mesh.position.z + 500
    );
    camera.lookAt(player.mesh.position);

    // Raycaster i wektor myszy
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Referencje do podłogi i terenu
    const floor = obstacles.find((obj) => obj.name === 'floor') as THREE.Mesh;
    const terrain = obstacles.find((obj) => obj.name === 'terrain') as THREE.Mesh;

    // Inicjalizacja menedżera pocisków
    const projectileManager = new ProjectileManager(scene, obstacles, halfMapSize);

    // Inicjalizacja menedżera czarów
    const spellManager = new SpellManager(
      scene,
      camera,
      renderer,
      player.mesh,
      obstacles,
      projectileManager,
      floor,
      terrain
    );

    // Obsługa kliknięć myszy
    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      if (event.button === 0 && !spellManager.isSelectingTarget) {
        // Lewy przycisk myszy - ruch gracza
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        for (let i = 0; i < intersects.length; i++) {
          const intersect = intersects[i];
          // Pomiń drogi
          if (
            intersect.object.name === 'floor' ||
            intersect.object.name === 'terrain' ||
            (intersect.object.userData && intersect.object.userData.isRoad) // Pomiń drogi
          ) {
            player.setDestination(intersect.point.clone());
            break;
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

    // Funkcja obracania etykiet zdrowia w stronę kamery
    const rotateHealthBars = () => {
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh && (object as THREE.Mesh).userData.healthBar) {
          const healthBar = (object as THREE.Mesh).userData.healthBar as THREE.Sprite;
          healthBar.lookAt(camera.position);
        }
      });
    };

    // Funkcja animacji
    const animate = () => {
      requestAnimationFrame(animate);

      // Aktualizacja gracza
      player.update();

      // Aktualizacja menedżera czarów
      spellManager.update();

      // Aktualizacja menedżera pocisków
      projectileManager.update();

      // Obracanie etykiet zdrowia
      rotateHealthBars();

      // Aktualizacja kamery
      controls.target.copy(player.mesh.position);
      controls.update();

      // Aktualizacja stanu cooldownów
      setSpellCooldownsState(spellManager.getCooldowns());

      renderer.render(scene, camera);
    };
    animate();

    // Obsługa zmiany rozmiaru okna
    const resizeHandler = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', resizeHandler);

    // Czyszczenie po odmontowaniu komponentu
    return () => {
      window.removeEventListener('resize', resizeHandler);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('contextmenu', (event) => event.preventDefault());
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      renderer.dispose();
      spellManager.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SkillBar spellCooldowns={spellCooldownsState} />
    </div>
  );
};

export default GameCanvas;
