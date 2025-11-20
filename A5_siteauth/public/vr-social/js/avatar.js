// Simple Avatar Factory for VR Social
// Exports: createAvatar({ style, color, name }) -> THREE.Group
// Styles: 'capsule' (default), 'robot'

import * as THREE from 'three';

export function createAvatar(user = {}) {
  const style = (user.style || 'capsule').toLowerCase();
  const color = new THREE.Color(user.color || '#44cc66');
  const name = user.name || 'Guest';

  const root = new THREE.Group();
  root.name = 'Avatar';

  if (style === 'robot') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.0, 0.3),
      new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.8 })
    );
    body.position.y = 1.1;

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.0, roughness: 1.0 })
    );
    head.position.y = 1.6;

    root.add(body, head);
  } else {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 1.0, 8, 16),
      new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.7 })
    );
    body.position.y = 1.2;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    head.position.y = 1.7;

    root.add(body, head);
  }

  // Name tag
  const label = makeNameTag(name);
  label.position.y = 1.95;
  root.add(label);

  // Prepare hands container (optional; populated on demand)
  const hands = new THREE.Group();
  hands.name = 'Hands';
  root.add(hands);
  root.userData.hands = hands;

  return root;
}

export function makeNameTag(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.65;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.9, 0.22, 1);
  return sprite;
}

export function updateNameTag(avatarGroup, newText) {
  const sprite = avatarGroup.children.find(c => c.isSprite);
  if (!sprite) return;
  const canvas = sprite.material.map.image;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.65;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(newText, canvas.width / 2, canvas.height / 2);
  sprite.material.map.needsUpdate = true;
}

export function createOrUpdateHands(avatarGroup, color = '#ffffff', left, right) {
  const hands = avatarGroup.userData.hands || avatarGroup;
  // Ensure left/right meshes
  let leftMesh = hands.getObjectByName('LeftHand');
  let rightMesh = hands.getObjectByName('RightHand');
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), emissive: new THREE.Color(color).multiplyScalar(0.2) });
  if (!leftMesh) {
    leftMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), mat);
    leftMesh.name = 'LeftHand';
    hands.add(leftMesh);
  }
  if (!rightMesh) {
    rightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), mat.clone());
    rightMesh.name = 'RightHand';
    hands.add(rightMesh);
  }
  if (left && left.position) {
    leftMesh.visible = true;
    leftMesh.position.set(left.position.x, left.position.y, left.position.z);
    if (left.quaternion) leftMesh.quaternion.set(left.quaternion.x, left.quaternion.y, left.quaternion.z, left.quaternion.w);
  } else {
    leftMesh.visible = false;
  }
  if (right && right.position) {
    rightMesh.visible = true;
    rightMesh.position.set(right.position.x, right.position.y, right.position.z);
    if (right.quaternion) rightMesh.quaternion.set(right.quaternion.x, right.quaternion.y, right.quaternion.z, right.quaternion.w);
  } else {
    rightMesh.visible = false;
  }
}
