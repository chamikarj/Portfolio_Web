"use client";

import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

type Props={light:boolean;reduced:boolean;active:boolean;reset:number;onReady:()=>void;onRobotReact:()=>void;onIdle:()=>void};
const CAMERA:[number,number,number]=[6.8,5.1,9.1];
const TARGET:[number,number,number]=[0,1.35,0];

/** Actual Three.js geometry projected by SVGRenderer when GPU/WebGL is unavailable.
 * The camera, depth sorting, gaze, blinking and orbit controls remain fully live.
 * This is a lower-detail software renderer, never an image or recorded animation.
 */
export default function SoftwareCity(props:Props){
 const host=useRef<HTMLDivElement>(null);
 const current=useRef(props);current.current=props;
 const api=useRef<{start:()=>void;stop:()=>void;reset:()=>void}|null>(null);
 useEffect(()=>{
  if(!host.current)return;
  const container=host.current;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,70);camera.position.set(...CAMERA);
  const renderer=new SVGRenderer();renderer.setQuality('high');renderer.setPrecision(2);renderer.overdraw=.4;
  const svg=renderer.domElement;svg.setAttribute('role','img');svg.setAttribute('tabindex','0');svg.setAttribute('aria-label','Interactive 3D robot city in compatibility mode. Drag to rotate, pinch or scroll to zoom; arrow keys rotate, Home resets.');svg.style.touchAction='none';
  svg.classList.add('city-software');container.appendChild(svg);
  const controls=new OrbitControls(camera,svg);controls.target.set(...TARGET);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.075;controls.rotateSpeed=.65;controls.zoomSpeed=.7;controls.minDistance=6;controls.maxDistance=16;controls.minPolarAngle=.3;controls.maxPolarAngle=1.42;
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;controls.update();
  const ambient=new THREE.AmbientLight('#b6d1ff',1.6);scene.add(ambient);
  const key=new THREE.DirectionalLight('#d7f2ff',2.8);key.position.set(4,8,5);scene.add(key);
  const rim=new THREE.DirectionalLight('#a685ff',1.3);rim.position.set(-5,3,-3);scene.add(rim);
  const world=new THREE.Group();scene.add(world);
  const themed:{material:THREE.MeshLambertMaterial;dark:string;light:string}[]=[];
  const material=(dark:string,light=dark,emissive=false)=>{
   if(emissive)return new THREE.MeshBasicMaterial({color:dark,side:THREE.FrontSide});
   const m=new THREE.MeshLambertMaterial({color:current.current.light?light:dark});themed.push({material:m,dark,light});return m;
  };
  const shell=material('#304f70','#789ab8'),body=material('#608699','#9ab3c8'),glass=material('#061325','#081d32'),cyan=material('#53ffe1','#53ffe1',true),purple=material('#a680ff','#a680ff',true),dark=material('#072634','#072634',true),white=material('#e9ffff','#e9ffff',true);
  const box=(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material,round=0)=>{
   const geometry=round?new RoundedBoxGeometry(w,h,d,1,round):new THREE.BoxGeometry(w,h,d);
   const mesh=new THREE.Mesh(geometry,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  };
  const ball=(parent:THREE.Object3D,r:number,x:number,y:number,z:number,m:THREE.Material,segments=10)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,segments,6),m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
  const ring=(parent:THREE.Object3D,r:number,tube:number,y:number,m:THREE.Material)=>{const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,tube,4,40),m);mesh.rotation.x=Math.PI/2;mesh.position.y=y;mesh.renderOrder=-15;parent.add(mesh);return mesh;};
  const robot=new THREE.Group();robot.name='compatibility-robot';robot.position.y=2.22;world.add(robot);
  const head=new THREE.Group();head.position.y=.6;robot.add(head);
  box(head,1.27,.95,.9,0,0,0,shell,.22);
  box(head,1.11,.76,.095,0,0,.43,material('#119b98','#119b98',true),.16);
  box(head,1.075,.71,.12,0,0,.46,glass,.17);
  const eyes=new THREE.Group();eyes.position.set(0,.055,.54);head.add(eyes);
  const pupils=new THREE.Group();eyes.add(pupils);
  for(const x of [-.245,.245]){
   ball(eyes,.16,x,0,0,cyan,14).scale.set(1,1.15,.34);
   ball(pupils,.071,x,0,.058,dark,12).scale.set(1,1.12,.35);
   ball(pupils,.023,x-.021,.032,.081,white,8);
  }
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.12,-.17,.548),new THREE.Vector3(0,-.21,.561),new THREE.Vector3(.12,-.17,.548)]);
  head.add(new THREE.Mesh(new THREE.TubeGeometry(curve,10,.014,4,false),cyan));
  for(const side of [-1,1]){ball(head,.17,side*.65,0,0,shell);ball(head,.105,side*.72,0,.03,cyan).scale.set(.15,1,1);}
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.32,6),body);stem.position.set(0,.61,0);head.add(stem);
  const antenna=ball(head,.085,.015,.82,0,cyan);
  box(head,.36,.29,.05,0,0,-.46,glass,.06);
  box(head,.1,.18,.02,0,0,-.491,purple,.02);
  box(robot,.83,.75,.64,0,-.22,0,body,.19);box(robot,.47,.29,.05,0,-.17,.33,glass,.06);
  for(let i=0;i<3;i++)box(robot,.055,.08,.014,-.11+i*.11,-.17,.36,i===2?purple:cyan);
  const arms:THREE.Group[]=[];
  for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.48,.02,0);arm.rotation.z=side*.25;robot.add(arm);arms.push(arm);
   const limb=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.27,3,8),shell);limb.position.y=-.23;arm.add(limb);ball(arm,.125,0,-.48,.02,body);
   box(robot,.24,.19,.36,side*.22,-.67,.04,shell,.06);
  }
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(3.65,3.85,.32,40),material('#162a45','#718eab'));platform.position.y=-.2;platform.renderOrder=-30;world.add(platform);
  const top=new THREE.Mesh(new THREE.CircleGeometry(3.62,40),material('#09192c','#3c526c'));top.rotation.x=-Math.PI/2;top.position.y=-.025;top.renderOrder=-20;world.add(top);
  ring(world,3.65,.018,-.1,cyan);ring(world,3.79,.014,-.24,purple);
  const road=material('#14263b','#334e6a');
  for(const v of [-2.66,-1.54,-.51,.51,1.54,2.66]){
   const length=Math.sqrt(3.6**2-v**2)*2;
   box(world,.18,.012,length,v,-.01,0,road).renderOrder=-10;box(world,length,.012,.18,0,-.009,v,road).renderOrder=-10;
  }
  const buildingMaterials=[material('#263f60','#7d94b2'),material('#253452','#6b83a2'),material('#2d4969','#8da1b9')];
  const windowMaterials=[material('#60dfff','#60dfff',true),material('#b28aff','#b28aff',true),cyan];
  let seed=72;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
   if(row===2&&col===2)continue;
   const x=(col-2)*1.03,z=(row-2)*1.03,w=.48+random()*.2,d=.48+random()*.2;
   const h=.32+random()*(Math.abs(row-2)+Math.abs(col-2)>2?1.2:.55),tone=Math.floor(random()*3);
   box(world,w,h,d,x,h/2,z,buildingMaterials[tone]);box(world,w+.025,.035,d+.025,x,h+.02,z,buildingMaterials[(tone+1)%3]);
   const floors=Math.min(3,Math.floor(h/.3));
   for(let floor=0;floor<floors;floor++)for(let c=0;c<2;c++){
    const yy=.12+floor*.3,offset=(c-.5)*.2;
    // Flat luminous windows need two triangles rather than twelve per box.
    const window = (xx:number,zz:number,rotation:number,m:THREE.Material) => {
     const pane=new THREE.Mesh(new THREE.PlaneGeometry(.055,.055),m);
     pane.position.set(xx,yy,zz);pane.rotation.y=rotation;world.add(pane);
    };
    window(x+offset,z+d/2+.008,0,windowMaterials[tone]);
    window(x+offset,z-d/2-.008,Math.PI,windowMaterials[(tone+1)%3]);
    window(x+w/2+.008,z+offset,Math.PI/2,windowMaterials[(tone+1)%3]);
    window(x-w/2-.008,z+offset,-Math.PI/2,windowMaterials[tone]);
   }
   if((row+col)%3===0){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.18,4),shell);pole.position.set(x,h+.1,z);world.add(pole);ball(world,.024,x,h+.2,z,cyan,6);}
  }
  ring(world,.57,.012,.018,cyan);
  const vehicles:THREE.Group[]=[];
  for(let i=0;i<6;i++){const car=new THREE.Group();box(car,.075,.045,.16,0,0,0,i%2?body:shell,.01);box(car,.05,.025,.06,0,.03,0,glass);box(car,.055,.014,.01,0,0,.085,white);box(car,.055,.014,.01,0,0,-.085,purple);world.add(car);vehicles.push(car);}
  const particles:THREE.Mesh[]=[];
  for(let i=0;i<12;i++)particles.push(ball(world,.012,(random()-.5)*7,.5+random()*3.3,(random()-.5)*7,i%2?cyan:purple,4));
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),target=new THREE.Vector3(),origin=new THREE.Vector3(),local=new THREE.Vector3();
  let frame=0,lastPaint=0,elapsed=0,lastTime=0,blinkStart=-10,nextBlink=2.5,blinkCount=0,down=false,dragging=false,startX=0,startY=0,pulse=-10000,lastLight:boolean|null=null,idleTimer:ReturnType<typeof setTimeout>|null=null,disposed=false;
  const resize=()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();start();};
  const paint=(now:number)=>{
   frame=0;if(disposed||!current.current.active)return;
   const p=current.current,interactive=down||dragging;
   if(now-lastPaint<(interactive?40:83)){frame=requestAnimationFrame(paint);return;}
   const dt=Math.min(lastTime?(now-lastTime)/1000:.016,.12);lastTime=now;lastPaint=now;if(!p.reduced)elapsed+=dt;
   if(lastLight!==p.light){lastLight=p.light;themed.forEach(({material,dark,light})=>material.color.set(p.light?light:dark));renderer.setClearColor(new THREE.Color(p.light?'#ffffff':'#0c1730'),0);ambient.intensity=p.light?2.1:1.6;key.intensity=p.light?2.7:2.1;}
   controls.enableDamping=!p.reduced;controls.update();
   const excitement=Math.max(0,1-(now-pulse)/1300);
   robot.position.y=2.22+(p.reduced?0:Math.sin(elapsed*1.45)*.085+excitement*Math.sin(excitement*Math.PI)*.16);
   robot.rotation.z=p.reduced?0:Math.sin(elapsed*.75)*.025;
   head.getWorldPosition(origin);target.set(pointer.x,pointer.y,.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(camera.position.distanceTo(origin)).add(camera.position);head.worldToLocal(local.copy(target));
   pupils.position.x=THREE.MathUtils.damp(pupils.position.x,THREE.MathUtils.clamp(local.x*.09,-.083,.083),10,dt);pupils.position.y=THREE.MathUtils.damp(pupils.position.y,THREE.MathUtils.clamp(local.y*.07,-.065,.065),10,dt);
   head.rotation.y=THREE.MathUtils.damp(head.rotation.y,dragging?0:THREE.MathUtils.clamp(local.x*.016,-.15,.15),5,dt);
   if(!p.reduced&&elapsed>nextBlink){blinkStart=elapsed;blinkCount++;nextBlink=elapsed+2.8+(Math.sin(blinkCount*17.3)*.5+.5)*2.5;}
   const bt=elapsed-blinkStart;eyes.scale.y=!p.reduced&&bt<.22?Math.max(.035,1-Math.sin(bt/.22*Math.PI)):1;
   arms[0].rotation.z=-.25-(p.reduced?0:excitement*(.9+Math.sin(elapsed*14)*.2));antenna.scale.setScalar(1+(p.reduced?0:excitement*.2));
   world.rotation.x=THREE.MathUtils.damp(world.rotation.x,p.reduced||dragging?0:pointer.y*.025,5,dt);world.rotation.z=THREE.MathUtils.damp(world.rotation.z,p.reduced||dragging?0:-pointer.x*.035,5,dt);
   vehicles.forEach((car,i)=>{const t=(elapsed*(.26+i*.014)+i*1.9)%8,side=Math.floor(t/2),q=(t%2)/2,lane=i%2?1.54:2.66;if(side===0){car.position.set(-lane+q*lane*2,.065,lane);car.rotation.y=Math.PI/2;}else if(side===1){car.position.set(lane,.065,lane-q*lane*2);car.rotation.y=Math.PI;}else if(side===2){car.position.set(lane-q*lane*2,.065,-lane);car.rotation.y=-Math.PI/2;}else{car.position.set(-lane,.065,-lane+q*lane*2);car.rotation.y=0;}});
   renderer.render(scene,camera);svg.style.backgroundColor='transparent';
   if(!p.reduced||down)frame=requestAnimationFrame(paint);
  };
  function start(){if(!frame&&!disposed&&current.current.active)frame=requestAnimationFrame(paint);}
  const reset=()=>{const damping=controls.enableDamping;controls.enableDamping=false;controls.update();camera.position.set(...CAMERA);controls.target.set(...TARGET);controls.update();controls.enableDamping=damping;world.rotation.set(0,0,0);pointer.set(0,0);start();};
  api.current={start,stop:()=>{cancelAnimationFrame(frame);frame=0;lastTime=0;},reset};
  const move=(event:PointerEvent)=>{const b=svg.getBoundingClientRect();pointer.set((event.clientX-b.left)/b.width*2-1,1-(event.clientY-b.top)/b.height*2);if(down)dragging=Math.hypot(event.clientX-startX,event.clientY-startY)>4;start();};
  const pointerDown=(event:PointerEvent)=>{down=true;dragging=false;startX=event.clientX;startY=event.clientY;start();};
  const up=()=>{down=false;dragging=false;start();};
  const leave=()=>{if(!down){pointer.set(0,0);start();}};
  const click=(event:MouseEvent)=>{if(Math.hypot(event.clientX-startX,event.clientY-startY)>5)return;ray.setFromCamera(pointer,camera);if(ray.intersectObject(robot,true).length){pulse=performance.now();current.current.onRobotReact();if(idleTimer)clearTimeout(idleTimer);idleTimer=setTimeout(()=>current.current.onIdle(),1800);start();}};
  const keydown=(event:KeyboardEvent)=>{if(event.key==='Home'){event.preventDefault();reset();return;}const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);let handled=true;if(event.key==='ArrowLeft')spherical.theta-=.15;else if(event.key==='ArrowRight')spherical.theta+=.15;else if(event.key==='ArrowUp')spherical.phi=THREE.MathUtils.clamp(spherical.phi-.1,.3,1.42);else if(event.key==='ArrowDown')spherical.phi=THREE.MathUtils.clamp(spherical.phi+.1,.3,1.42);else if(event.key==='+'||event.key==='=')spherical.radius=THREE.MathUtils.clamp(spherical.radius-.6,6,16);else if(event.key==='-')spherical.radius=THREE.MathUtils.clamp(spherical.radius+.6,6,16);else handled=false;if(handled){event.preventDefault();camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));controls.update();start();}};
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',pointerDown);svg.addEventListener('pointerleave',leave);svg.addEventListener('click',click);svg.addEventListener('keydown',keydown);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);controls.addEventListener('change',start);
  const observer=new ResizeObserver(resize);observer.observe(container);resize();current.current.onReady();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();svg.removeEventListener('pointermove',move);svg.removeEventListener('pointerdown',pointerDown);svg.removeEventListener('pointerleave',leave);svg.removeEventListener('click',click);svg.removeEventListener('keydown',keydown);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(idleTimer)clearTimeout(idleTimer);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});svg.remove();api.current=null;};
 },[]);
 useEffect(()=>{if(props.active)api.current?.start();else api.current?.stop();},[props.active,props.reduced,props.light]);
 useEffect(()=>{api.current?.reset();},[props.reset]);
 return <div className="city-software-host" ref={host} data-renderer="three-svg"/>;
}
