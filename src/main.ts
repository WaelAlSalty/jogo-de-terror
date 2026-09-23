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

// Invent?rio de Chaves Coletadas
const inventoryKeys: Set<string> = new Set();

const raycaster = new THREE.Raycaster();
let targetedDoor: Door | null = null;
let targetedCabinet: InteractiveCabinet | null = null;
let targetedItem: CollectibleItem | null = null;

// Elementos da Interface
const backpackModal = document.getElementById('backpack-modal')!;
const btnBackpack = document.getElementById('btn-backpack')!;
const btnCloseBag = document.getElementById('btn-close-bag')!;
const btnTouchBag = document.getElementById('btn-touch-bag');
const btnTouchShoot = document.getElementById('btn-touch-shoot');
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
const btnTouchCCTV = document.getElementById('btn-touch-cctv');

function updateKeyHUD() {
  const keysList: string[] = [];
  if (inventoryKeys.has('red_key')) keysList.push('Cirurgia');
  if (inventoryKeys.has('card_key')) keysList.push('Farm?cia');
  if (inventoryKeys.has('master_key')) keysList.push('SA?DA');
  keyDisplay.innerText = `CHAVES: ${keysList.length > 0 ? keysList.join(', ') : 'NENHUMA'}`;

  // Atualiza slots da mochila
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
    if (ui.menuScreen.classList.contains('hidden') && !camSystem.isViewingCCTV) {
      engine.renderer.domElement.requestPointerLock();
    }
  }
}

btnBackpack.addEventListener('click', () => toggleBackpack(true));
btnCloseBag.addEventListener('click', () => toggleBackpack(false));
btnTouchBag?.addEventListener('click', () => toggleBackpack());

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
    if (ui.menuScreen.classList.contains('hidden') && !isBackpackOpen) {
      engine.renderer.domElement.requestPointerLock();
    }
  }
}

btnToggleCCTV.addEventListener('click', () => toggleCCTV(true));
btnCamExit.addEventListener('click', () => toggleCCTV(false));
btnTouchCCTV?.addEventListener('click', () => toggleCCTV());

btnCamNext.addEventListener('click', () => {
  camSystem.nextCamera();
  cctvTitle.innerText = camSystem.cameras[camSystem.activeCamIndex].name;
});

btnCamPrev.addEventListener('click', () => {
  camSystem.prevCamera();
  cctvTitle.innerText = camSystem.cameras[camSystem.activeCamIndex].name;
});

// A??es de Intera??o (Coleta de itens, portas ou arm?rios)
function tryInteract() {
  if (isGameOver) return;

  // 1. Coleta de Item (Chave / Cart?o)
  if (targetedItem && !targetedItem.isCollected) {
    inventoryKeys.add(targetedItem.type);
    targetedItem.collect(engine.scene);
    updateKeyHUD();
    return;
  }

  // 2. Intera??o com Porta
  if (targetedDoor) {
    if (targetedDoor.isLocked) {
      if (targetedDoor.requiredKey && inventoryKeys.has(targetedDoor.requiredKey)) {
        targetedDoor.unlock();
        map.rebuildColliders();
        if (targetedDoor.isExitDoor) {
          triggerEscape();
        }
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

  // 3. Intera??o com Arm?rio
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

btnTouchShoot?.addEventListener('click', () => handleShoot());

window.addEventListener('keydown', (e) => {
  if (isGameOver) return;
  if (e.code === 'Tab') {
    e.preventDefault();
    toggleBackpack();
    return;
  }
  if (e.code === 'KeyC') {
    toggleCCTV();
    return;
  }
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

engine.renderer.domElement.addEventListener('mousedown', (e) => {
  if (isGameOver || isBackpackOpen || camSystem.isViewingCCTV) return;
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

document.getElementById('btn-touch-interact')?.addEventListener('click', () => tryInteract());

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === engine.renderer.domElement;
});

document.addEventListener('mousemove', (e) => {
  if (!isPointerLocked || isGameOver || isBackpackOpen || camSystem.isViewingCCTV) return;
  player.rotation.yaw -= e.movementX * 0.0022;
  player.rotation.pitch -= e.movementY * 0.0022;
  player.rotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, player.rotation.pitch));
});

if ('ontouchstart' in window) {
  function setupJoy(zoneId: string, knobId: string, onMove: (x: number, y: number) => void, onEnd: () => void) {
    const zone = document.getElementById(zoneId)!;
    const knob = document.getElementById(knobId)!;
    let tId: number | null = null;
    let startX = 0;
    let startY = 0;

    zone.addEventListener('touchstart', (e) => {
      audio.init();
      const t = e.changedTouches[0];
      tId = t.identifier;
      startX = t.clientX;
      startY = t.clientY;
    });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === tId) {
          const dx = t.clientX - startX;
          const dy = t.clientY - startY;
          const dist = Math.min(45, Math.hypot(dx, dy));
          const angle = Math.atan2(dy, dx);
          const kx = Math.cos(angle) * dist;
          const ky = Math.sin(angle) * dist;
          knob.style.transform = `translate(${kx}px, ${ky}px)`;
          onMove(kx / 45, ky / 45);
        }
      }
    });

    const finish = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === tId) {
          tId = null;
          knob.style.transform = 'translate(0px, 0px)';
          onEnd();
        }
      }
    };
    window.addEventListener('touchend', finish);
    window.addEventListener('touchcancel', finish);
  }

  setupJoy('joystick-left', 'knob-left', (x, y) => {
    player.moveState.right = x;
    player.moveState.forward = -y;
  }, () => {
    player.moveState.right = 0;
    player.moveState.forward = 0;
  });

  setupJoy('joystick-right', 'knob-right', (x, y) => {
    player.rotation.yaw -= x * 0.045;
    player.rotation.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, player.rotation.pitch - y * 0.03));
  }, () => {});
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
  ui.showHUD('MODO: EXPLORACAO SOLO');
});

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  const date = new Date();
  cctvTime.innerText = date.toTimeString().split(' ')[0];

  // Atualiza portas, arm?rios e itens
  let doorChanged = false;
  map.doors.forEach(d => {
    if (d.update(delta)) doorChanged = true;
  });
  if (doorChanged) map.rebuildColliders();

  map.cabinets.forEach(c => c.update(delta));
  map.items.forEach(i => i.update(time));
  weapon.update(delta);

  // Raycast de Mira para Intera??es (Itens > Portas > Arm?rios)
  raycaster.setFromCamera(new THREE.Vector2(0, 0), player.camera);
  const activeItems = map.items.filter(i => !i.isCollected).map(i => i.mesh);
  const doorMeshes = map.doors.map(d => d.doorMesh);
  const cabinetMeshes = map.cabinets.map(c => c.doorMesh);

  const itemHits = raycaster.intersectObjects(activeItems, true);
  const doorHits = raycaster.intersectObjects(doorMeshes);
  const cabHits = raycaster.intersectObjects(cabinetMeshes);

  if (itemHits.length > 0 && itemHits[0].distance < 3.0) {
    let topGroup = itemHits[0].object;
    while (topGroup.parent && !topGroup.userData.isCollectible) {
      topGroup = topGroup.parent as THREE.Mesh;
    }
    targetedItem = map.items.find(i => i.id === topGroup.userData.itemId) || null;
    targetedDoor = null;
    targetedCabinet = null;
    if (targetedItem) {
      ui.showInteract(`[E] PEGAR ${targetedItem.name.toUpperCase()}`);
    }
  } else if (doorHits.length > 0 && doorHits[0].distance < 3.2) {
    targetedDoor = map.doors.find(d => d.doorMesh === doorHits[0].object) || null;
    targetedItem = null;
    targetedCabinet = null;
    if (targetedDoor) {
      if (targetedDoor.isLocked) {
        const hasKey = targetedDoor.requiredKey && inventoryKeys.has(targetedDoor.requiredKey);
        if (hasKey) {
          ui.showInteract(`[E] USAR CHAVE E DESTRANCAR`);
        } else {
          ui.showInteract(`[TRANCADA: PRECISA DA ${targetedDoor.requiredKey?.replace('_', ' ').toUpperCase()}]`);
        }
      } else {
        ui.showInteract(targetedDoor.isOpen ? '[E] FECHAR PORTA' : '[E] ABRIR PORTA');
      }
    }
  } else if (cabHits.length > 0 && cabHits[0].distance < 3.0) {
    targetedCabinet = map.cabinets.find(c => c.doorMesh === cabHits[0].object) || null;
    targetedItem = null;
    targetedDoor = null;
    ui.showInteract(targetedCabinet?.isOpen ? '[E] FECHAR ARM?RIO' : '[E] ABRIR ARM?RIO');
  } else {
    targetedItem = null;
    targetedDoor = null;
    targetedCabinet = null;
    ui.showInteract(null);
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
