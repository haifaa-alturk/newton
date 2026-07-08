
import * as THREE from 'three';

const MIN_RADIUS = 0.15;
const MAX_RADIUS = 0.55;
const MIN_ROPE = 1.5;
const MAX_ROPE = 3.5; 

const _TOP_ROPE_Z = [0.015, -0.015];   
const _BALL_ROPE_Z = [0.08, -0.08];    

export default class BallGroup {
 
    get ballRadius () {
      return this.physics.ballRadius ?? 0.25;
    }

    get ropeLength () {
      return this.physics.stringLength ?? 2.0;
    }

  constructor(scene, cradleFrame, physicsEngine, options = {}) {
    this.scene = scene;
    this.cradleFrame = cradleFrame;
    this.physics = physicsEngine;
    this.group = new THREE.Group();

    this.ballCount  = options.ballCount  ?? 5;
    
    this._vec3a = new THREE.Vector3();
this._vec3b = new THREE.Vector3();
this._quat = new THREE.Quaternion();



    this.topY = 5.0; 

    this.spacing = this.ballRadius * 2 + 0.02;
    this.balls      = [];
    this.ropeGroups = []; 

    this._build();
    this.scene.add(this.group);

    window.addEventListener('keydown', (e) => this._onKey(e));
  }

 
_updateTopY() {
  this.topY = 5.0; 
}
  _build() {
    this.balls.forEach(b => this.group.remove(b));
    this.ropeGroups.forEach(rg => rg.forEach(r => this.group.remove(r)));
    this.balls      = [];
    this.ropeGroups = [];

    this._updateTopY(); // هون لل الارتفاع والستاند قبل البناء

    this.spacing = this.ballRadius * 2 + 0.02;
    const startX = -((this.ballCount - 1) * this.spacing) / 2;

    const ballMat = new THREE.MeshPhysicalMaterial({
      color:     0xaabbcc,
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 0.5,
    });

    const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x444455,
    roughness: 0.6,
    metalness: 0.3,
});
   

const ropeGeometry =
    new THREE.CylinderGeometry(
      0.02,
    0.02,
        1,
        6
    );

    for (let i = 0; i < this.ballCount; i++) {
      const x   = startX + i * this.spacing;
      const ballY = this.topY - this.ropeLength - this.ballRadius; 

      const geo  = new THREE.SphereGeometry(this.ballRadius, 32, 32);
      const ball = new THREE.Mesh(geo, ballMat);
      ball.position.set(x, ballY, 0);
      ball.castShadow    = true;
      ball.receiveShadow = true;
      ball.userData.restX = x;
      ball.userData.index = i;
      this.group.add(ball);
      this.balls.push(ball);


const ropes = _TOP_ROPE_Z.map((topZ, j) => {
        const rope = new THREE.Mesh(ropeGeometry, ropeMat);
        rope.castShadow = true;
        this.group.add(rope);

        this._placeRope(
          rope,
          x, this.topY, topZ,
          x, ballY + this.ballRadius, _BALL_ROPE_Z[j]
        );

        return rope;
      });
      this.ropeGroups.push(ropes);
    }
  }

updateRopes() {
    this.balls.forEach((ball, i) => {
      const x = ball.position.x;
      const y = ball.position.y;
      const restX = ball.userData.restX;

      this.ropeGroups[i].forEach((rope, j) => {
        this._placeRope(
          rope,
          restX, this.topY, _TOP_ROPE_Z[j],
          x, y + this.ballRadius, _BALL_ROPE_Z[j]
        );
      });
    });
  }

  // هون حساب مركز الكرة 
  _ballY() {
    return this.topY - this.ropeLength - this.ballRadius;
  }

  //تغيير طول الخيط 
  changeRopeLength(delta) {
    // حطينا حد لتطويل الخيط
    this.physics.stringLength = Math.max(MIN_ROPE, Math.min(MAX_ROPE, this.physics.stringLength + delta));
    const newY = this._ballY();
    this.balls.forEach(ball => {
      ball.position.y = newY;
    });
    this.updateRopes(); 
  }


  changeRadius(delta) {
    const newR = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, this.ballRadius + delta));
    if (newR === this.physics.ballRadius) return;
    this.physics.setRadius(newR);
    this._build(); 
  }

  _onKey(e) {
    switch (e.key) {
      case '+': case '=': this.changeRadius(+0.05);  break;
      case '-':           this.changeRadius(-0.05);  break;
      case ']':           this.changeRopeLength(+0.3); break;
      case '[':           this.changeRopeLength(-0.3); break;
    }
  }

  update(angles) {
  
    angles.forEach((angle, i) => {
      if (!this.balls[i]) return;
      const restX = this.balls[i].userData.restX;
      this.balls[i].position.x = restX + Math.sin(angle) * this.ropeLength;
      this.balls[i].position.y = this.topY - Math.cos(angle) * this.ropeLength - this.ballRadius;
    });
    this.updateRopes();
  }
  _placeRope(mesh, ax, ay, az, bx, by, bz) {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (len < 0.001) {
      mesh.scale.y = 0.001;
      return;
    }

   const clampedLen = len;

    const nx = dx / len;
    const ny = dy / len;
    const nz = dz / len;

    const endX = ax + nx * clampedLen;
    const endY = ay + ny * clampedLen;
    const endZ = az + nz * clampedLen;

    mesh.position.set((ax + endX) * 0.5, (ay + endY) * 0.5, (az + endZ) * 0.5);

    this._quat.setFromUnitVectors(
      this._vec3a.set(0, 1, 0),
      this._vec3b.set(nx, ny, nz)
    );
    mesh.quaternion.copy(this._quat);

    mesh.scale.y = clampedLen;
  }
}