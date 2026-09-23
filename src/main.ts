import * as THREE from 'three';
import { Engine } from './core/Engine';
import { AudioManager } from './core/AudioManager';
import { CameraSystem } from './core/CameraSystem';
import { MapGenerator } from './environment/MapGenerator';
import { Player } from './entities/Player';
import { Monster } from './entities/Monster';
import { RemotePlayer } from './entities/RemotePlayer';
import { NetworkManager } from './network/NetworkManager';
import { UIManager } from './ui/UIManager';
import { Door } from './entities/Door';
import { InteractiveCabinet } from './entities/InteractiveCabinet';
import { WeaponSystem } from './entities/WeaponSystem';
import { CollectibleItem } from './entities/CollectibleItem';

const engine = new Engine('game-container');
const audio = new AudioManager();
const ui = new UIManager();
const net = new NetworkManager();
const camSystem = new CameraSystem(engine.scene);

const map = new MapGenerator(engine.scene, audio, camSystem);
map.build();

const player = new Player(engine.camera, audio, map.spawnPosition);
const weapon = new WeaponSystem(player.camera, audio);
const monster = new Monster(engine.scene);
let remotePlayer: RemotePlayer | null = null;

let isPointerLocked = false;
let isBackpackOpen = false;
let isGameOver = false;
let heartbeatTimer = 0;
const clock = new THREE.Clock();

const inventoryKeys: Set<string> = new Set();

const raycaster = new THREE.Raycaster();
let targetedDoor: Door | null = null;
let targetedCabinet: InteractiveCabinet | null = null;
let targetedItem: CollectibleItem | null = null;

// Elementos da Interface
const backpackModal = document.getElementById('backpack-modal')!;
const btnBackpack = document.getElementById('btn-backpack')!;
const btnCloseBag = document.getElementById('btn-close-bag')!;
const btnTouchBag = document.getElementById('btn-touch-bag')!;
const btnTouchShoot = document.getElementById('btn-touch-shoot')!;
const btnTouchInteract = document.getElementById('btn-touch-interact')!;
const btnTouchCCTV = document.getElementById('btn-touch-cctv')!;
const touchControls = document.getElementById('touch-controls')!;
const rotateScreen = document.getElementById('rotate-device-screen')!;

const ammoDisplay = document.getElementById('ammo-display')!;
const keyDisplay = document.getElementById('key-display')!;
const escapedScreen = document.getElementById('escaped-screen')!;
const btnRestart = document.getElementById('btn-restart')!;

const cctvOverlay = document.getElementById('cctv-overlay')!;
const cctvTitle = document.getElementById('cctv-cam-title')!;
const cctvTime = document.getElementById('cctv-timestamp')!;
const btnToggleCCTV = document.getElementById('btn-toggle-cctv')!;
const btnCamPrev = document.getElementById('btn-cam-prev')!;
const btnCamNext = document.getElementById('btn-cam-next')!;
const btnCamExit = document.getElementById('btn-cam-exit')!;

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (isTouchDevice) {
  touchControls.style.display = 'block';
}

// 1. AUTO FULLSCREEN & ORIENTA??O HORIZONTAL (Landscape)
async function requestAutoLandscapeFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
    // Trava em modo paisagem se a API estiver dispon?vel no navegador
    if (screen.orientation && 'lock' in screen.orientation) {
      // @ts-ignore
      await screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (_) {}
}

function checkOrientation() {
  if (isTouchDevice) {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
      rotateScreen.classList.remove('hidden');
    } else {
      rotateScreen.classList.add('hidden');
    }
  }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
checkOrientation();

function updateKeyHUD() {
  const keysList: string[] = [];
  if (inventoryKeys.has('red_key')) keysList.push('Cirurgia');
  if (inventoryKeys.has('card_key')) keysList.push('Farm?cia');
  if (inventoryKeys.has('master_key')) keysList.push('SA?DA');
  keyDisplay.innerText = `CHAVES: ${keysList.length > 0 ? keysList.join(', ') : 'NENHUMA'}`;

  const slotRed = document.getElementById('status-red-key')!;
  const slotCard = document.getElementById('status-card-key')!;
  const slotMaster = document.getElementById('status-master-key')!;

  if (inventoryKeys.has('red_key')) { slotRed.innerText = 'NO BOLSO'; slotRed.style.color = '#ef4444'; }
  if (inventoryKeys.has('card_key')) { slotCard.innerText = 'NO BOLSO'; slotCard.style.color = '#38bdf8'; }
  if (inventoryKeys.has('master_key')) { slotMaster.innerText = 'NO BOLSO'; slotMaster.style.color = '#facc15'; }
}

function triggerEscape() {
  isGameOver = true;
  document.exitPointerLock();
  escapedScreen.classList.remove('hidden');
}

btnRestart.addEventListener('click', () => {
  window.location.reload();
});

function toggleBackpack(open?: boolean) {
  if (isGameOver) return;
  isBackpackOpen = open !== undefined ? open : !isBackpackOpen;
  if (isBackpackOpen) {
    backpackModal.classList.remove('hidden');
    document.exitPointerLock();
  } else {
    backpackModal.classList.add('hidden');
    if (ui.menuScreen.classList.contains('hidden') && !camSystem.isViewingCCTV && !isTouchDevice) {
      engine.renderer.domElement.requestPointerLock();
    }
  }
}

btnBackpack.addEventListener('click', () => toggleBackpack(true));
btnCloseBag.addEventListener('click', () => toggleBackpack(false));
btnTouchBag.addEventListener('click', (e) => { e.stopPropagation(); toggleBackpack(); });

function toggleCCTV(enable?: boolean) {
  if (isGameOver) return;
  camSystem.isViewingCCTV = enable !== undefined ? enable : !camSystem.isViewingCCTV;
  if (camSystem.isViewingCCTV) {
    cctvOverlay.classList.remove('hidden');
    document.exitPointerLock();
    if (camSystem.cameras.length > 0) {
      cctvTitle.innerText = camSystem.cameras[camSystem.activeCamIndex].name;
    }
  } else {
    cctvOverlay.classList.add('hidden');
    if (ui.menuScreen.classList.contains('hidden') && !isBackpackOpen && !isTouchDevice) {
      engine.renderer.domElement.requestPointerLock();
    }
  }
}

btnToggleCCTV.addEventListener('click', () => toggleCCTV(true));
btnCamExit.addEventListener('click', () => toggleCCTV(false));
btnTouchCCTV.addEventListener('click', (e) => { e.stopPropagation(); toggleCCTV(); });

btnCamNext.addEventListener('click', () => {
  camSystem.nextCamera();
  cctvTitle.innerText = camSystem.cameras[camSystem.activeCamIndex].name;
});

btnCamPrev.addEventListener('click', () => {
  camSystem.prevCamera();
  cctvTitle.innerText = camSystem.cameras[camSystem.activeCamIndex].name;
});

function tryInteract() {
  if (isGameOver) return;

  if (targetedItem && !targetedItem.isCollected) {
    inventoryKeys.add(targetedItem.type);
    targetedItem.collect(engine.scene);
    updateKeyHUD();
    return;
  }

  if (targetedDoor) {
    if (targetedDoor.isLocked) {
      if (targetedDoor.requiredKey && inventoryKeys.has(targetedDoor.requiredKey)) {
        targetedDoor.unlock();
        map.rebuildColliders();
        if (targetedDoor.isExitDoor) triggerEscape();
      }
    } else {
      if (targetedDoor.isExitDoor && !targetedDoor.isOpen) {
        triggerEscape();
        return;
      }
      targetedDoor.toggle();
      map.rebuildColliders();
    }

    if (net.conn?.open) {
      net.send({ type: 'door', doorId: targetedDoor.id, isOpen: targetedDoor.isOpen });
    }
    return;
  }

  if (targetedCabinet) {
    targetedCabinet.toggle();
    return;
  }
}

function handleShoot() {
  if (isGameOver || isBackpackOpen || camSystem.isViewingCCTV) return;
  const shotFired = weapon.shoot(player.camera, engine.scene, monster);
  if (shotFired) {
    ammoDisplay.innerText = `DARDOS: ${weapon.ammoCount} / 3`;
    document.getElementById('bag-ammo-count')!.innerText = `${weapon.ammoCount} Dardos`;
  }
}

btnTouchShoot.addEventListener('click', (e) => {
  e.stopPropagation();
  handleShoot();
});

btnTouchInteract.addEventListener('click', (e) => {
  e.stopPropagation();
  tryInteract();
});

// Teclado (PC)
window.addEventListener('keydown', (e) => {
  if (isGameOver) return;
  if (e.code === 'Tab') { e.preventDefault(); toggleBackpack(); return; }
  if (e.code === 'KeyC') { toggleCCTV(); return; }
  if (e.code === 'Escape') {
    if (isBackpackOpen) { toggleBackpack(false); return; }
    if (camSystem.isViewingCCTV) { toggleCCTV(false); return; }
  }

  if (isBackpackOpen || camSystem.isViewingCCTV) return;

  if (e.code === 'KeyW' || e.code === 'ArrowUp') player.moveState.forward = 1;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') player.moveState.forward = -1;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') player.moveState.right = -1;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') player.moveState.right = 1;
  if (e.code === 'KeyE') tryInteract();
});

window.addEventListener('keyup', (e) => {
  if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(e.code)) player.moveState.forward = 0;
  if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) player.moveState.right = 0;
});

// Mouse (PC)
engine.renderer.domElement.addEventListener('mousedown', (e) => {
  if (isTouchDevice || isGameOver || isBackpackOpen || camSystem.isViewingCCTV) return;
  if (ui.menuScreen.classList.contains('hidden')) {
    if (!isPointerLocked) {
      engine.renderer.domElement.requestPointerLock();
      audio.init();
      return;
    }
    if (e.button === 0) {
      if (targetedItem || targetedDoor || targetedCabinet) {
        tryInteract();
      } else {
        handleShoot();
      }
    }
  }
});

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === engine.renderer.domElement;
});

document.addEventListener('mousemove', (e) => {
  if (!isPointerLocked || isGameOver || isBackpackOpen || camSystem.isViewingCCTV) return;
  player.rotation.yaw -= e.movementX * 0.0022;
  player.rotation.pitch -= e.movementY * 0.0022;
  player.rotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, player.rotation.pitch));
});

// =========================================================
// SISTEMA TOUCH NATIVO (Mobile)
// =========================================================
if (isTouchDevice) {
  // 1. Joystick Esquerdo: Movimenta??o
  const joyZone = document.getElementById('joystick-left')!;
  const knob = document.getElementById('knob-left')!;
  let moveTouchId: number | null = null;
  let startX = 0;
  let startY = 0;

  joyZone.addEventListener('touchstart', (e) => {
    audio.init();
    const t = e.changedTouches[0];
    moveTouchId = t.identifier;
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === moveTouchId) {
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const dist = Math.min(42, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);
        const kx = Math.cos(angle) * dist;
        const ky = Math.sin(angle) * dist;
        knob.style.transform = `translate(${kx}px, ${ky}px)`;
        player.moveState.right = kx / 42;
        player.moveState.forward = -(ky / 42);
      }
    }
  }, { passive: true });

  const resetMoveJoy = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchId) {
        moveTouchId = null;
        knob.style.transform = 'translate(0px, 0px)';
        player.moveState.right = 0;
        player.moveState.forward = 0;
      }
    }
  };
  window.addEventListener('touchend', resetMoveJoy, { passive: true });
  window.addEventListener('touchcancel', resetMoveJoy, { passive: true });

  // 2. Touch Look Zone: Arrastar com os dedos na direita para virar a c?mera
  const lookZone = document.getElementById('touch-look-zone')!;
  let lookTouchId: number | null = null;
  let lastLookX = 0;
  let lastLookY = 0;

  lookZone.addEventListener('touchstart', (e) => {
    if (isGameOver || isBackpackOpen || camSystem.isViewingCCTV) return;
    const t = e.changedTouches[0];
    lookTouchId = t.identifier;
    lastLookX = t.clientX;
    lastLookY = t.clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchId) {
        const deltaX = t.clientX - lastLookX;
        const deltaY = t.clientY - lastLookY;
        lastLookX = t.clientX;
        lastLookY = t.clientY;

        // Sensibilidade do deslize nos dedos
        const sens = 0.0042;
        player.rotation.yaw -= deltaX * sens;
        player.rotation.pitch -= deltaY * sens;
        player.rotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, player.rotation.pitch));
      }
    }
  }, { passive: true });

  const resetLookTouch = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId) {
        lookTouchId = null;
      }
    }
  };
  window.addEventListener('touchend', resetLookTouch, { passive: true });
  window.addEventListener('touchcancel', resetLookTouch, { passive: true });
}

document.getElementById('btn-fullscreen')!.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

function startNetworking(roomId: string, isHost: boolean) {
  audio.init();
  requestAutoLandscapeFullscreen();
  ui.setError('Conectando aos servidores...');
  net.connect(
    roomId,
    isHost,
    () => {
      ui.showHUD(isHost ? `SALA: ${roomId} (HOST)` : `SALA: ${roomId} (CLIENTE)`);
      if (!remotePlayer) remotePlayer = new RemotePlayer(engine.scene);
    },
    (pkt) => {
      if (pkt.type === 'player' && remotePlayer) {
        remotePlayer.syncTransform(pkt.x || 0, pkt.y || 0, pkt.z || 0, pkt.rotY || 0);
      }
      if (pkt.type === 'monster' && !net.isHost) {
        monster.mesh.position.set(pkt.x || 0, pkt.y || 0, pkt.z || 0);
      }
      if (pkt.type === 'door' && pkt.doorId) {
        const d = map.doors.find(x => x.id === pkt.doorId);
        if (d && typeof pkt.isOpen === 'boolean') {
          d.setOpen(pkt.isOpen);
          map.rebuildColliders();
        }
      }
    },
    (err) => ui.setError(err)
  );
}

document.getElementById('btn-host')!.addEventListener('click', () => {
  const code = ui.roomInput.value.trim();
  if (!code) return ui.setError('Digite um codigo para a sala!');
  startNetworking(code, true);
});

document.getElementById('btn-join')!.addEventListener('click', () => {
  const code = ui.roomInput.value.trim();
  if (!code) return ui.setError('Digite o codigo da sala!');
  startNetworking(code, false);
});

document.getElementById('btn-solo')!.addEventListener('click', () => {
  audio.init();
  requestAutoLandscapeFullscreen();
  ui.showHUD('MODO: EXPLORACAO SOLO');
});

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  const date = new Date();
  cctvTime.innerText = date.toTimeString().split(' ')[0];

  let doorChanged = false;
  map.doors.forEach(d => {
    if (d.update(delta)) doorChanged = true;
  });
  if (doorChanged) map.rebuildColliders();

  map.cabinets.forEach(c => c.update(delta));
  map.items.forEach(i => i.update(time));
  weapon.update(delta);

  // Raycast de Mira para Intera??es
  raycaster.setFromCamera(new THREE.Vector2(0, 0), player.camera);
  const activeItems = map.items.filter(i => !i.isCollected).map(i => i.mesh);
  const doorMeshes = map.doors.map(d => d.doorMesh);
  const cabinetMeshes = map.cabinets.map(c => c.doorMesh);

  const itemHits = raycaster.intersectObjects(activeItems, true);
  const doorHits = raycaster.intersectObjects(doorMeshes);
  const cabHits = raycaster.intersectObjects(cabinetMeshes);

  let hasInteractTarget = false;

  if (itemHits.length > 0 && itemHits[0].distance < 3.0) {
    let topGroup = itemHits[0].object;
    while (topGroup.parent && !topGroup.userData.isCollectible) {
      topGroup = topGroup.parent as THREE.Mesh;
    }
    targetedItem = map.items.find(i => i.id === topGroup.userData.itemId) || null;
    targetedDoor = null;
    targetedCabinet = null;
    if (targetedItem) {
      hasInteractTarget = true;
      ui.showInteract(`[E] PEGAR ${targetedItem.name.toUpperCase()}`);
      btnTouchInteract.innerText = 'PEGAR';
    }
  } else if (doorHits.length > 0 && doorHits[0].distance < 3.2) {
    targetedDoor = map.doors.find(d => d.doorMesh === doorHits[0].object) || null;
    targetedItem = null;
    targetedCabinet = null;
    if (targetedDoor) {
      hasInteractTarget = true;
      if (targetedDoor.isLocked) {
        const hasKey = targetedDoor.requiredKey && inventoryKeys.has(targetedDoor.requiredKey);
        if (hasKey) {
          ui.showInteract(`[E] USAR CHAVE E DESTRANCAR`);
          btnTouchInteract.innerText = 'USAR CHAVE';
        } else {
          ui.showInteract(`[TRANCADA: PRECISA DA ${targetedDoor.requiredKey?.replace('_', ' ').toUpperCase()}]`);
          btnTouchInteract.innerText = 'TRANCADA';
        }
      } else {
        ui.showInteract(targetedDoor.isOpen ? '[E] FECHAR PORTA' : '[E] ABRIR PORTA');
        btnTouchInteract.innerText = targetedDoor.isOpen ? 'FECHAR' : 'ABRIR';
      }
    }
  } else if (cabHits.length > 0 && cabHits[0].distance < 3.0) {
    targetedCabinet = map.cabinets.find(c => c.doorMesh === cabHits[0].object) || null;
    targetedItem = null;
    targetedDoor = null;
    hasInteractTarget = true;
    ui.showInteract(targetedCabinet?.isOpen ? '[E] FECHAR ARM?RIO' : '[E] ABRIR ARM?RIO');
    btnTouchInteract.innerText = targetedCabinet?.isOpen ? 'FECHAR' : 'ABRIR';
  } else {
    targetedItem = null;
    targetedDoor = null;
    targetedCabinet = null;
    ui.showInteract(null);
  }

  // No celular: s? exibe o bot?o se estiver apontando para algo interativo
  if (isTouchDevice) {
    if (hasInteractTarget && !isBackpackOpen && !camSystem.isViewingCCTV && !isGameOver) {
      btnTouchInteract.classList.remove('hidden');
    } else {
      btnTouchInteract.classList.add('hidden');
    }
  }

  // Luzes de emerg?ncia
  const flicker = Math.sin(time * 7) + Math.sin(time * 19);
  const isFlickering = flicker > 1.3;
  map.emergencyLights.forEach(light => {
    light.intensity = isFlickering ? 0.3 : 2.5;
  });

  if (!camSystem.isViewingCCTV && !isBackpackOpen && !isGameOver) {
    player.update(delta, map.colliders);
  }

  camSystem.update(time);

  const isAuthority = net.isHost || !net.peer;
  monster.update(delta, time, player.camera.position, isAuthority);

  if (net.isHost && net.conn?.open) {
    net.send({
      type: 'monster',
      x: monster.mesh.position.x,
      y: monster.mesh.position.y,
      z: monster.mesh.position.z
    });
  }

  const dist = monster.mesh.position.distanceTo(player.camera.position);
  const dangerRatio = Math.max(0, 1 - dist / 15);
  ui.setDanger(dangerRatio);

  heartbeatTimer += delta * (1 + dangerRatio * 2.8);
  if (heartbeatTimer > 1.2) {
    audio.playHeartbeat(dangerRatio);
    heartbeatTimer = 0;
  }

  if (net.conn?.open) {
    net.send({
      type: 'player',
      x: player.camera.position.x,
      y: player.camera.position.y,
      z: player.camera.position.z,
      rotY: player.rotation.yaw
    });
  }

  const activeSecurityCam = camSystem.getActiveCamera();
  if (activeSecurityCam) {
    engine.renderer.render(engine.scene, activeSecurityCam);
  } else {
    engine.render();
  }
}

animate();
