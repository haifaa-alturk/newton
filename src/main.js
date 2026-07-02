
import * as THREE from 'three';
import { SceneManager } from './classes/SceneManager.js';
import IntroScreen from './classes/IntroScreen.js';

import { PhysicsEngine } from './classes/PhysicsEngine.js'; 

const sceneManager = new SceneManager();


const physicsEngine = new PhysicsEngine({
  ballCount: 5,
  stringLength: 2.0, 
  ballRadius: 0.25,  
  restitution: 0.99, 
  damping: 0.004    
});
//تجريبي
// لنقم بسحب الكرة لبدء التأرجح فوراً عند التشغيل
physicsEngine.setAngle(0, -Math.PI / 4); // سحب الكرة الأولى بزاوية 45 درجة (بالراديان)
// physicsEngine.setAngle(1, -Math.PI / 4); // اختياري: يمكنك سحب الثانية أيضاً إذا أردتِ

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
  

  const safeDelta = Math.min(delta, 0.03); 
  physicsEngine.step(safeDelta, 1); 


  const currentAngles = physicsEngine.getAngles();
  if (sceneManager.balls) {
    sceneManager.balls.update(currentAngles);
  }
  
  sceneManager.update(delta);
  sceneManager.render();
}

animate();