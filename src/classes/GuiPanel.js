import * as THREE from 'three';
import * as dat from 'lil-gui';
import { Value } from 'three/examples/jsm/inspector/ui/Values.js';

export class GuiPanel {
  constructor(physics) {
    this.physics = physics;
    this.gui = new dat.GUI();

    this.energy = {
      kinetic: 0,
      potential: 0,
      total: 0
    }; 
    this.restPhysicsValues = { 
        momentum : 0 
    };
    this.buildGui();
  
   }

   buildGui () {
    this.gui.add(this.physics,"mass",1,7,0.5).name("Mass").onChange((value)=>{
        this.physics.setMass(value);
    });
    this.gui.add(this.physics,"angle", -90*Math.PI/180, -1*Math.PI/180).name("Angle").onChange((value)=>{
        this.physics.setAngle(value);
    });
    this.gui.add(this.physics,"damping",0,0.05,0.001).name("Damping").onChange((value)=>{
        this.physics.setDamping(value);
    });
    this.gui.add(this.physics,"activeBalls",1,5,1).name("Balls").onChange((value)=>{
        this.physics.setActiveBalls(value);
    });
    //     this.gui.add(this.ballGroup,"setRopeLength", 1.5, 3.5, 1).name("Length").onChange((value)=>{
    //     this.physics.setActiveBalls(value);
    // });
    this.gui.add(this.physics, "move").name("Move");
    this.gui.add(this.physics, "stop").name("Stop");

    const energyFolder = this.gui.addFolder("Energy");
    energyFolder.add(this.energy,"kinetic").name("Kinetic Energy").listen();
    energyFolder.add(this.energy,"potential").name("Potential Energy").listen();
    energyFolder.add(this.energy,"total").name("Total Energy").listen();

    const physicsValues = this.gui.addFolder("Rest Physics Values");
    physicsValues.add(this.restPhysicsValues, "momentum").name("Momentum").listen();

   }

   updatEnergy (values) {
    this.energy.kinetic = values.kinetic;
    this.energy.potential = values.potential;
    this.energy.total = values.total;
   }

   updateMomentum (value) {
    this.restPhysicsValues.momentum = value;
   }
}