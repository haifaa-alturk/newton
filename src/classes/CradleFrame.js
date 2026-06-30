import * as THREE from 'three';

const TABLE_W = 12;
const TABLE_D = 12;
const TABLE_H = 0.2;

const BASE_W = 8.5;
const BASE_D = 3.5;
const BASE_H = 0.3;

const BAR_LEN = 6.5;
const BAR_RAD = 0.035;
const BAR_Y = 5.0;

const ROD_RAD = 0.03;
const LEG_SPREAD_X = 0.6;
const LEG_SPREAD_Z = 1.2;

function cylinderBetween(a, b, radius, mat, segs = 8) {
  const start = new THREE.Vector3().copy(a);
  const end = new THREE.Vector3().copy(b);
  const dir = new THREE.Vector3().copy(end).sub(start);
  const len = dir.length();
  const mid = new THREE.Vector3().copy(start).add(dir.clone().multiplyScalar(0.5));
  const geo = new THREE.CylinderGeometry(radius, radius, len, segs);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(mid);
  const up = new THREE.Vector3(0, 1, 0);
  const norm = dir.clone().normalize();
  if (Math.abs(norm.dot(up)) < 0.9999) {
    mesh.quaternion.setFromUnitVectors(up, norm);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class CradleFrame {
  constructor() {
    this.group = new THREE.Group();
    this.metalMat = new THREE.MeshPhysicalMaterial({
      color: 0x8899aa,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.1,
      clearcoatRoughness: 0.3,
    });
    this.baseWoodMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a2010,
      roughness: 0.55,
      metalness: 0.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
    });
    this.tableMat = new THREE.MeshPhysicalMaterial({
      color: 0x7a6b55,
      roughness: 0.65,
      metalness: 0.0,
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    });
    this._buildTable();
    this._buildBase();
    this._buildSupports();
    this._buildHorizontalBar();
    this._buildJoints();
  }

  _buildTable() {
    const geo = new THREE.BoxGeometry(TABLE_W, TABLE_H, TABLE_D);
    const mesh = new THREE.Mesh(geo, this.tableMat);
    mesh.position.y = -TABLE_H / 2;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.group.add(mesh);
  }

  _buildBase() {
    const geo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
    const mesh = new THREE.Mesh(geo, this.baseWoodMat);
    mesh.position.y = BASE_H / 2;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.group.add(mesh);
  }

  _buildSupports() {
    const topL = new THREE.Vector3(-BAR_LEN / 2, BAR_Y, 0);
    const topR = new THREE.Vector3(BAR_LEN / 2, BAR_Y, 0);
    const baseY = BASE_H;

    const lFwd = new THREE.Vector3(-BAR_LEN / 2 - LEG_SPREAD_X, baseY, -LEG_SPREAD_Z);
    const lBwd = new THREE.Vector3(-BAR_LEN / 2 - LEG_SPREAD_X, baseY, LEG_SPREAD_Z);
    const rFwd = new THREE.Vector3(BAR_LEN / 2 + LEG_SPREAD_X, baseY, -LEG_SPREAD_Z);
    const rBwd = new THREE.Vector3(BAR_LEN / 2 + LEG_SPREAD_X, baseY, LEG_SPREAD_Z);

    this.group.add(cylinderBetween(topL, lFwd, ROD_RAD, this.metalMat));
    this.group.add(cylinderBetween(topL, lBwd, ROD_RAD, this.metalMat));
    this.group.add(cylinderBetween(topR, rFwd, ROD_RAD, this.metalMat));
    this.group.add(cylinderBetween(topR, rBwd, ROD_RAD, this.metalMat));
  }

  _buildHorizontalBar() {
    const geo = new THREE.CylinderGeometry(BAR_RAD, BAR_RAD, BAR_LEN, 12);
    const mesh = new THREE.Mesh(geo, this.metalMat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(0, BAR_Y, 0);
    mesh.castShadow = true;
    this.group.add(mesh);

    const capGeo = new THREE.SphereGeometry(BAR_RAD, 8, 8);
    const capL = new THREE.Mesh(capGeo, this.metalMat);
    capL.position.set(-BAR_LEN / 2, BAR_Y, 0);
    this.group.add(capL);
    const capR = new THREE.Mesh(capGeo, this.metalMat);
    capR.position.set(BAR_LEN / 2, BAR_Y, 0);
    this.group.add(capR);
  }

  _buildJoints() {
    const baseY = BASE_H;
    const jointGeo = new THREE.CylinderGeometry(ROD_RAD * 2.2, ROD_RAD * 2.2, 0.025, 8);

    const positions = [
      [-BAR_LEN / 2 - LEG_SPREAD_X, -LEG_SPREAD_Z],
      [-BAR_LEN / 2 - LEG_SPREAD_X, LEG_SPREAD_Z],
      [BAR_LEN / 2 + LEG_SPREAD_X, -LEG_SPREAD_Z],
      [BAR_LEN / 2 + LEG_SPREAD_X, LEG_SPREAD_Z],
    ];

    for (const [x, z] of positions) {
      const plate = new THREE.Mesh(jointGeo, this.metalMat);
      plate.position.set(x, baseY, z);
      this.group.add(plate);
    }
  }
}
// import * as THREE from 'three';

// // تكبير حجم الطاولة والقاعدة
// const TABLE_W = 16;   // زاد من 12
// const TABLE_D = 12;   // زاد من 9
// const TABLE_H = 0.2;

// const BASE_W = 8.5;   // زاد من 5.2 ليناسب الكرات الكبيرة
// const BASE_D = 3.5;   // زاد من 1.0 ليعطي عمق وثبات للستاند
// const BASE_H = 0.3;   // زاد من 0.18 ليصبح أسمك وأجمل

// const BAR_LEN = 6.5;  // زاد من 4.4
// const BAR_RAD = 0.05; // زاد من 0.035
// // تم حذف BAR_Y الثابت

// const ROD_RAD = 0.045; // زاد من 0.03
// const LEG_SPREAD_X = 0.6;
// const LEG_SPREAD_Z = 1.2; // زاد ليناسب عرض القاعدة الجديد

// function cylinderBetween(a, b, radius, mat, segs = 8) {
//   const start = new THREE.Vector3().copy(a);
//   const end = new THREE.Vector3().copy(b);
//   const dir = new THREE.Vector3().copy(end).sub(start);
//   const len = dir.length();
//   const mid = new THREE.Vector3().copy(start).add(dir.clone().multiplyScalar(0.5));
//   const geo = new THREE.CylinderGeometry(radius, radius, len, segs);
//   const mesh = new THREE.Mesh(geo, mat);
//   mesh.position.copy(mid);
//   const up = new THREE.Vector3(0, 1, 0);
//   const norm = dir.clone().normalize();
//   if (Math.abs(norm.dot(up)) < 0.9999) {
//     mesh.quaternion.setFromUnitVectors(up, norm);
//   }
//   mesh.castShadow = true;
//   mesh.receiveShadow = true;
//   return mesh;
// }

// export class CradleFrame {
//   constructor() {
//     this.group = new THREE.Group();
    
//     // سنضع الأجزاء المتحركة (البار والأعمدة) في مجموعة منفصلة ليسهل رفعها وخفضها
//     this.movingStructure = new THREE.Group();
//     this.group.add(this.movingStructure);

//     this.metalMat = new THREE.MeshPhysicalMaterial({
//       color: 0x8899aa,
//       metalness: 0.92,
//       roughness: 0.22,
//       clearcoat: 0.1,
//       clearcoatRoughness: 0.3,
//     });
//     this.baseWoodMat = new THREE.MeshPhysicalMaterial({
//       color: 0x3a2010,
//       roughness: 0.55,
//       metalness: 0.0,
//       clearcoat: 0.3,
//       clearcoatRoughness: 0.4,
//     });
//     this.tableMat = new THREE.MeshPhysicalMaterial({
//       color: 0x7a6b55,
//       roughness: 0.65,
//       metalness: 0.0,
//       clearcoat: 0.15,
//       clearcoatRoughness: 0.5,
//     });

//     this._buildTable();
//     this._buildBase();
//     this._buildJoints();

//     // الارتفاع الافتراضي المبدئي
//     this.updateHeight(2.0, 0.25); 
//   }

//   // دالة لتحديث ارتفاع الأعمدة والبار بناءً على طول الخيط وحجم الكرة ديناميكياً
//   // سنثبت الارتفاع عند 5.0 ليعطي مظهراً مرتفعاً وضخماً يتسع لكل الأطوال
//   updateHeight(ropeLength, ballRadius) {
//     // إذا كان الهيكل مبنياً بالفعل، لا داعي لإعادة البناء بالكامل
//     if (this.movingStructure.children.length > 0) return;

//     this.barY = 5.0; 

//     this._buildSupports();
//     this._buildHorizontalBar();
//   }

//   _buildTable() {
//     const geo = new THREE.BoxGeometry(TABLE_W, TABLE_H, TABLE_D);
//     const mesh = new THREE.Mesh(geo, this.tableMat);
//     mesh.position.y = -TABLE_H / 2;
//     mesh.receiveShadow = true;
//     mesh.castShadow = true;
//     this.group.add(mesh);
//   }

//   _buildBase() {
//     const geo = new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D);
//     const mesh = new THREE.Mesh(geo, this.baseWoodMat);
//     mesh.position.y = BASE_H / 2;
//     mesh.receiveShadow = true;
//     mesh.castShadow = true;
//     this.group.add(mesh);
//   }

//   _buildSupports() {
//     const topL = new THREE.Vector3(-BAR_LEN / 2, this.barY, 0);
//     const topR = new THREE.Vector3(BAR_LEN / 2, this.barY, 0);
//     const baseY = BASE_H;

//     const lFwd = new THREE.Vector3(-BAR_LEN / 2 - LEG_SPREAD_X, baseY, -LEG_SPREAD_Z);
//     const lBwd = new THREE.Vector3(-BAR_LEN / 2 - LEG_SPREAD_X, baseY, LEG_SPREAD_Z);
//     const rFwd = new THREE.Vector3(BAR_LEN / 2 + LEG_SPREAD_X, baseY, -LEG_SPREAD_Z);
//     const rBwd = new THREE.Vector3(BAR_LEN / 2 + LEG_SPREAD_X, baseY, LEG_SPREAD_Z);

//     this.movingStructure.add(cylinderBetween(topL, lFwd, ROD_RAD, this.metalMat));
//     this.movingStructure.add(cylinderBetween(topL, lBwd, ROD_RAD, this.metalMat));
//     this.movingStructure.add(cylinderBetween(topR, rFwd, ROD_RAD, this.metalMat));
//     this.movingStructure.add(cylinderBetween(topR, rBwd, ROD_RAD, this.metalMat));
//   }

//   _buildHorizontalBar() {
//     const geo = new THREE.CylinderGeometry(BAR_RAD, BAR_RAD, BAR_LEN, 12);
//     const mesh = new THREE.Mesh(geo, this.metalMat);
//     mesh.rotation.z = Math.PI / 2;
//     mesh.position.set(0, this.barY, 0);
//     mesh.castShadow = true;
//     this.movingStructure.add(mesh);

//     const capGeo = new THREE.SphereGeometry(BAR_RAD, 8, 8);
//     const capL = new THREE.Mesh(capGeo, this.metalMat);
//     capL.position.set(-BAR_LEN / 2, this.barY, 0);
//     this.movingStructure.add(capL);
//     const capR = new THREE.Mesh(capGeo, this.metalMat);
//     capR.position.set(BAR_LEN / 2, this.barY, 0);
//     this.movingStructure.add(capR);
//   }

//   _buildJoints() {
//     const baseY = BASE_H;
//     const jointGeo = new THREE.CylinderGeometry(ROD_RAD * 2.2, ROD_RAD * 2.2, 0.04, 8);

//     const positions = [
//       [-BAR_LEN / 2 - LEG_SPREAD_X, -LEG_SPREAD_Z],
//       [-BAR_LEN / 2 - LEG_SPREAD_X, LEG_SPREAD_Z],
//       [BAR_LEN / 2 + LEG_SPREAD_X, -LEG_SPREAD_Z],
//       [BAR_LEN / 2 + LEG_SPREAD_X, LEG_SPREAD_Z],
//     ];

//     for (const [x, z] of positions) {
//       const plate = new THREE.Mesh(jointGeo, this.metalMat);
//       plate.position.set(x, baseY, z);
//       this.group.add(plate);
//     }
//   }
// }
