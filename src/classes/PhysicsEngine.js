  const _FIXED_DT = 1 / 240; 
  const _MAX_COLLISION_PASSES = 6;
  const _COS_CLAMP = 0.05;
  const _CLOSING_EPSILON = 0.001;

  export class PhysicsEngine {
    constructor({ ballCount = 5, stringLength = 2.0, ballRadius = 0.25, mass = 1, restitution = 0.99, damping = 0.004,soundManager=null } = {}) {
      this.ballCount = ballCount;
      this.activeBalls = 0;
      this.stringLength = stringLength;
      this.ballRadius = ballRadius;
      this.ballDiameter = this.ballRadius * 2;
      this.restitution = restitution; 
      this.damping = damping;         
      this.soundManager = soundManager ;
      this.masses = new Array(this.ballCount).fill(mass);
      this.mass=mass;
      this.angle=0
      this.angles = new Float64Array(this.ballCount);
      this.angularVelocities = new Float64Array(this.ballCount);
      this.gravity = 9.81;
      this.planet = "Earth";

    
      this._prevContactState = new Set();
      this._currentContactState = new Set();
      this.collisionEvents = [];

      
      this._restX = new Float64Array(this.ballCount);
      this.updateRestPositions();
    }

  getAngles() {
    return Array.from(this.angles);
  }
    
    updateRestPositions() {
      this.ballDiameter = this.ballRadius * 2;
      for (let i = 0; i < this.ballCount; i++) {
        this._restX[i] = (i - (this.ballCount - 1) / 2) * this.ballDiameter;
      }
    }

    setAngle(angle) {
      this.angle=angle;
    }

  // السرعة الابتدائية 
    setAngularVelocity(index, v) {
      this.angularVelocities[index] = v;
    }
    
    step(frameDelta, speedMultiplier = 1) {
      this.collisionEvents = []; 
      const totalTime = frameDelta * speedMultiplier;
      
      const numSubsteps = Math.max(1, Math.ceil(totalTime / _FIXED_DT));
      const dt = totalTime / numSubsteps;

      for (let s = 0; s < numSubsteps; s++) {
        this._integrate(dt);         
        this._resolveCollisions();    
        
        this._prevContactState = this._currentContactState;
        this._currentContactState = new Set();
      }
    }

  _integrate(dt) {
      const L = this.stringLength;
      const gL = this.gravity / L;
      
      // أقل سرعة
      const VELOCITY_THRESHOLD = 0.0001; 
      const ANGLE_THRESHOLD = 0.0005;

      for (let i = 0; i < this.ballCount; i++) {
        //التسارع   
        const acc = -gL * Math.sin(this.angles[i]) - this.damping * this.angularVelocities[i];
        
        this.angularVelocities[i] += acc * dt;
        this.angles[i] += this.angularVelocities[i] * dt;

        // التخامد
        if (Math.abs(this.angularVelocities[i]) < VELOCITY_THRESHOLD && Math.abs(this.angles[i]) < ANGLE_THRESHOLD) {
          this.angularVelocities[i] = 0;
          this.angles[i] = 0;
        }
      }
    }

    
    _resolveCollisions() {
      const freshEvents = [];
      const seenThisSubstep = new Set();

      for (let pass = 0; pass < _MAX_COLLISION_PASSES; pass++) {
        let hit = false;
        
        for (let i = 0; i < this.ballCount - 1; i++) {
          const j = i + 1;

        const xi = this._getX(i);
        const xj = this._getX(j);

        if (Math.abs(xj - xi) >= this.ballDiameter) continue;

        const vi = this._getLinearVelocity(i);
        const vj = this._getLinearVelocity(j);

        const approaching = (xj - xi) > 0 && vi > vj;
        if (!approaching) continue;
          
          this._resolvePair(i, j); 
          hit = true;
          this._currentContactState.add(i);

          
          const closing = vi - vj > 0;
          const wasContact = this._prevContactState.has(i);
          
        if (closing && !wasContact && !seenThisSubstep.has(i)) {
            seenThisSubstep.add(i);
            const intensity = Math.min(1, Math.abs(vi - vj) / 3); 
            freshEvents.push({ index: i, intensity });

            if(this.soundManager){
              this.soundManager.resumeAudioContext();
              this.soundManager.playCollisionSound(intensity);
            }
          }
        }
        if (!hit) break;
      }

      for (const ev of freshEvents) {
        this.collisionEvents.push(ev);
      }
    }

    
    _resolvePair(i, j) {
      const L = this.stringLength;
      const e = this.restitution;
      const m1 = this.masses[i];
      const m2 = this.masses[j];

      const cosI = Math.cos(this.angles[i]);
      const cosJ = Math.cos(this.angles[j]);

      const vi = L * this.angularVelocities[i] * cosI;
      const vj = L * this.angularVelocities[j] * cosJ;
      
    
      const v1New = ((m1 - e * m2) * vi + (1 + e) * m2 * vj) / (m1 + m2);
      const v2New = ((m2 - e * m1) * vj + (1 + e) * m1 * vi) / (m1 + m2);

      const safeCosI = Math.abs(cosI) < 0.01 ? 0.01 * Math.sign(cosI) : cosI;
      const safeCosJ = Math.abs(cosJ) < 0.01 ? 0.01 * Math.sign(cosJ) : cosJ;


      this.angularVelocities[i] = v1New / (L * safeCosI);
      this.angularVelocities[j] = v2New / (L * safeCosJ);

      this._separate(i, j); 
    }

    _separate(i, j) {
      const xi = this._getX(i);
      const xj = this._getX(j);
      const overlap = this.ballDiameter - Math.abs(xj - xi);
      if (overlap <= 0) return;

      const L = this.stringLength;
      const sensI = L * Math.cos(this.angles[i]);
      const sensJ = L * Math.cos(this.angles[j]);

      if (xi < xj)
      {
        this.angles[i] -= ((overlap / this.stringLength) * 0.001);
        this.angles[j] += ((overlap / this.stringLength) * 0.001);
      }
      else
      {
        this.angles[j] -= (overlap / this.stringLength * 0.001);
        this.angles[i] += (overlap / this.stringLength * 0.001);
      }

    }

    
    _getX(index) {
      return this._restX[index] + this.stringLength * Math.sin(this.angles[index]);
    }

    _getLinearVelocity(index) {
      return this.stringLength * this.angularVelocities[index] * Math.cos(this.angles[index]);
    }

  
    getEnergy() {
      let ke = 0; 
      let pe = 0; 
      const L = this.stringLength;
      const g = this.gravity;

      for (let i = 0; i < this.ballCount; i++) {
        const m = this.masses[i];
        const v = this._getLinearVelocity(i);
      
        ke += 0.5 * m * v * v; 
        
        pe += m * g * L * (1 - Math.cos(this.angles[i]));
      }

      return {
        kinetic: ke,
        potential: pe,
        total: ke + pe
      }; 
    }
    
    setMass(mass) {
      this.masses.fill(mass);
      this.mass=mass;
    }

    setActiveBalls(balls) {
      this.activeBalls=balls;
    }

    setDamping(damping) {
      this.damping=damping;
    }

    setRadius(radius) {
      this.ballRadius = radius;
      this.ballDiameter = radius *2;
      this.updateRestPositions();
    }

    setRopeLength(L) {
      this.stringLength = L;
    }

    setPlanet(planet) {
      const planets = {
    "Earth - 9.81": 9.81,
    "Moon - 1.62": 1.62,
    "Mars - 3.71": 3.71,
    "Jupiter - 24.79": 24.79,
    "Venus - 8.87": 8.87,
    "Mercury - 3.2": 3.7
      };

      this.gravity = planets[planet];
      this.planet = planet;
    }

    move() {
      for (let i=0; i<this.activeBalls;i++)
      {
      this.angles[i] = this.angle;
      const v = Math.sqrt(2*this.gravity*this.stringLength*(1-Math.cos(this.angle))) /this.stringLength;
      this.angularVelocities[i] = -v;
      }
    }

    stop() {
      this.activeBalls=0;
      for (let i=0; i<this.ballCount;i++)
      {
      this.angularVelocities[i] = 0;
      this.angles[i]=0;
      }
    }

    getTotalMomentum() {
      let p = 0; 
      for (let i = 0; i < this.ballCount; i++) {
    
        p += this.masses[i] * this._getLinearVelocity(i);
      }
      return p;
    }
  }