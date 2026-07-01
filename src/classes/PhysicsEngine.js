const _G = 9.81;
const _FIXED_DT = 1 / 240; 

export class PhysicsEngine {
  constructor({ ballCount = 5, stringLength = 2.0, ballRadius = 0.25, mass = 1, damping = 0.004 } = {}) {

    this.ballCount = ballCount;
    this.stringLength = stringLength;
    this.ballRadius = ballRadius;
    this.ballDiameter = this.ballRadius * 2;
    this.damping = damping; 

    
    this.masses = new Array(this.ballCount).fill(mass);
    this.angles = new Float64Array(this.ballCount);
    this.angularVelocities = new Float64Array(this.ballCount);

    
    this.collisionEvents = [];

    
    this._restX = new Float64Array(this.ballCount);
    this.updateRestPositions();
  }

  
  updateRestPositions() {
    this.ballDiameter = this.ballRadius * 2;
    for (let i = 0; i < this.ballCount; i++) {
      this._restX[i] = (i - (this.ballCount - 1) / 2) * this.ballDiameter;
    }
  }

  
  step(frameDelta, speedMultiplier = 1) {
    this.collisionEvents = [];
    const totalTime = frameDelta * speedMultiplier;
    
    
    const numSubsteps = Math.max(1, Math.ceil(totalTime / _FIXED_DT));
    const dt = totalTime / numSubsteps;

    for (let s = 0; s < numSubsteps; s++) {
      
      this._integrate(dt);
    }
  }

  
  _integrate(dt) {
    const L = this.stringLength;
    const gL = _G / L;

    for (let i = 0; i < this.ballCount; i++) {
      
      const acc = -gL * Math.sin(this.angles[i]) - this.damping * this.angularVelocities[i];
      
      
      this.angularVelocities[i] += acc * dt;
      
    
      this.angles[i] += this.angularVelocities[i] * dt;
    }
  }

  // تابع لحساب موقع الكرة 
  _getX(index) {
    return this._restX[index] + this.stringLength * Math.sin(this.angles[index]);
  }

  // تابع لحساب السرعة الخطية للكرة
  _getLinearVelocity(index) {
    return this.stringLength * this.angularVelocities[index] * Math.cos(this.angles[index]);
  }
}