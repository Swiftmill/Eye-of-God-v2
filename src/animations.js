import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 1.8, 3.5);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);

export function getDefaultCameraPosition() {
  return DEFAULT_CAMERA_POSITION.clone();
}

export function getDefaultCameraTarget() {
  return DEFAULT_CAMERA_TARGET.clone();
}

export function zoomToNode({ camera, cameraTarget, node, reduceMotion }) {
  if (!node || !node.position) return;
  const focusPoint = node.position.clone();
  const offsetDirection = focusPoint.clone().normalize();
  const distance = 2.2;
  const targetPosition = offsetDirection.multiplyScalar(distance);
  targetPosition.add(new THREE.Vector3(0, 0.2, 0));
  const lookTarget = focusPoint.clone().multiplyScalar(0.6);

  if (reduceMotion) {
    camera.position.copy(targetPosition);
    cameraTarget.copy(lookTarget);
    return;
  }

  gsap.to(camera.position, {
    duration: 1.5,
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    ease: 'power2.out'
  });

  gsap.to(cameraTarget, {
    duration: 1.5,
    x: lookTarget.x,
    y: lookTarget.y,
    z: lookTarget.z,
    ease: 'power2.out'
  });
}

export function resetCameraPosition({ camera, cameraTarget, reduceMotion }) {
  if (reduceMotion) {
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    cameraTarget.copy(DEFAULT_CAMERA_TARGET);
    return;
  }

  gsap.to(camera.position, {
    duration: 1.2,
    x: DEFAULT_CAMERA_POSITION.x,
    y: DEFAULT_CAMERA_POSITION.y,
    z: DEFAULT_CAMERA_POSITION.z,
    ease: 'power2.out'
  });

  gsap.to(cameraTarget, {
    duration: 1.2,
    x: DEFAULT_CAMERA_TARGET.x,
    y: DEFAULT_CAMERA_TARGET.y,
    z: DEFAULT_CAMERA_TARGET.z,
    ease: 'power2.out'
  });
}
