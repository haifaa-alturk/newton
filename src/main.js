import * as THREE from 'three';
import { SceneManager } from './classes/SceneManager.js';
import IntroScreen from './classes/IntroScreen.js';

const sceneManager = new SceneManager();

const clock = new THREE.Clock();

const introScreen = new IntroScreen({
  containerId: 'app',
  soundEnabled: true,
  onStart: () => {
    console.log('Intro complete, starting simulation');
    sceneManager.container.style.display = 'block';
  }
});

introScreen.mount();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  sceneManager.update(delta);
  sceneManager.render();
}

animate();