"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
type OrbitControlsType = ComponentRef<typeof OrbitControls>;

type Props = { light: boolean; reduced: boolean; active: boolean; reset: number; onReady: () => void; onFailure: () => void; onRobotReact: () => void; onIdle: () => void };
type Input = { x: number; y: number; down: boolean; dragging: boolean; moved: number; startX: number; startY: number; pulse: number; hovered: boolean };
const DEFAULT_CAMERA: [number, number, number] = [6.8, 5.1, 9.1];
const TARGET: [number, number, number] = [0, 1.35, 0];
const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;
function resetCamera(controls: OrbitControlsType, camera: THREE.Camera) {
  // Flush damping before assigning the default pose; leftover drag inertia
  // must not move the camera again immediately after Reset or Home.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  camera.position.set(...DEFAULT_CAMERA);
  controls.target.set(...TARGET);
  controls.update();
  controls.enableDamping = damping;
}


function seeded(seed: number) { let n=seed; return () => { n=(n*1664525+1013904223)>>>0; return n/4294967296; }; }

export function Robot({ input, reduced, light, onReact }: { input: React.RefObject<Input>; reduced: boolean; light: boolean; onReact: () => void }) {
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const eyes = useRef<THREE.Group>(null!);
  const pupils = useRef<THREE.Group>(null!);
  const arm = useRef<THREE.Group>(null!);
  const antenna = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);
  const nextBlink = useRef(2.4);
  const blinkStart = useRef(-10);
  const blinkCount = useRef(0);
  const smile = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.12, -.17, .537), new THREE.Vector3(0, -.21, .55), new THREE.Vector3(.12, -.17, .537)]), 16, .013, 5, false), []);
  const eyeColor = light ? '#04cdb1' : '#53ffe1';
  const shellColor = light ? '#7897b7' : '#294566';
  const target = useMemo(() => new THREE.Vector3(), []);
  const local = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => smile.dispose(), [smile]);
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, .04);
    if (!reduced) elapsed.current += dt;
    const t = elapsed.current;
    const i = input.current;
    const excitement = Math.max(0, 1 - (performance.now() - i.pulse) / 1300);
    root.current.position.y = 2.22 + (reduced ? 0 : Math.sin(t * 1.45) * .085 + excitement * Math.sin(excitement * Math.PI) * .16);
    root.current.rotation.z = reduced ? 0 : Math.sin(t * .75) * .028;
    // A world-space cursor target is transformed into head-local coordinates,
    // so gaze remains independent of OrbitControls and works from every angle.
    head.current.getWorldPosition(origin);
    target.set(i.x, i.y, .5).unproject(camera).sub(camera.position).normalize().multiplyScalar(camera.position.distanceTo(origin)).add(camera.position);
    head.current.worldToLocal(local.copy(target));
    const gazeX = clamp(local.x * .09, -.083, .083);
    const gazeY = clamp(local.y * .07, -.065, .065);
    pupils.current.position.x = reduced ? gazeX : damp(pupils.current.position.x, gazeX, 9, dt);
    pupils.current.position.y = reduced ? gazeY : damp(pupils.current.position.y, gazeY, 9, dt);
    head.current.rotation.y = damp(head.current.rotation.y, i.dragging ? 0 : clamp(local.x * .016, -.15, .15), 5, dt);
    head.current.rotation.x = damp(head.current.rotation.x, i.dragging ? 0 : clamp(-local.y * .012, -.09, .09), 5, dt);
    if (!reduced && t >= nextBlink.current) {
      blinkStart.current = t;
      blinkCount.current += 1;
      nextBlink.current = t + 2.8 + (Math.sin(blinkCount.current * 17.3) * .5 + .5) * 2.5;
    }
    const blinkTime = t - blinkStart.current;
    const blink = !reduced && blinkTime < .22 ? Math.max(.035, 1 - Math.sin(blinkTime / .22 * Math.PI)) : 1;
    eyes.current.scale.y = blink;
    // A short wave and happy wide eyes react to a click without blocking orbit.
    arm.current.rotation.z = damp(arm.current.rotation.z, -.25 - excitement * (.9 + Math.sin(t * 14) * .22), 9, dt);
    const antennaScale = 1 + (reduced ? 0 : excitement * .25 + (i.hovered ? .08 : 0));
    antenna.current.scale.setScalar(antennaScale);
    if (eyes.current.userData) eyes.current.userData.blink = blink;
  });
  const react = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5 || input.current.dragging) return;
    event.stopPropagation(); input.current.pulse = performance.now(); onReact();
  };
  return <group name="portfolio-robot" ref={root} position={[0, 2.22, 0]} onPointerOver={() => { input.current.hovered = true; }} onPointerOut={() => { input.current.hovered = false; }} onClick={react}>
    <group name="robot-head" ref={head} position={[0, .6, 0]}>
      <RoundedBox args={[1.27, .95, .9]} radius={.25} smoothness={3} castShadow><meshStandardMaterial color={shellColor} metalness={.72} roughness={.28}/></RoundedBox>
      <RoundedBox args={[1.075, .71, .12]} radius={.2} smoothness={3} position={[0, 0, .453]}><meshStandardMaterial color="#081526" metalness={.3} roughness={.22}/></RoundedBox>
      <RoundedBox args={[1.11, .75, .075]} radius={.2} smoothness={3} position={[0, 0, .427]}><meshStandardMaterial color="#085c72" emissive="#12bba6" emissiveIntensity={.5} metalness={.6} roughness={.35}/></RoundedBox>
      <group name="robot-eyes" ref={eyes} position={[0, .055, .532]}>
        {[-.245,.245].map(x => <mesh key={x} position={[x,0,0]} scale={[1,1.15,.34]}><sphereGeometry args={[.16,24,16]}/><meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2} toneMapped={false}/></mesh>)}
        <group name="robot-pupils" ref={pupils}>
          {[-.245,.245].map(x => <group key={x} position={[x,0,.057]}><mesh scale={[1,1.12,.35]}><sphereGeometry args={[.071,20,12]}/><meshBasicMaterial color="#052431"/></mesh><mesh position={[-.021,.032,.023]}><sphereGeometry args={[.024,12,8]}/><meshBasicMaterial color="#e5fffd" toneMapped={false}/></mesh></group>)}
      </group>
      </group>
      <mesh geometry={smile}><meshBasicMaterial color="#7aeaff" toneMapped={false}/></mesh>
      {[-1,1].map(side => <group key={side} position={[side*.665,0,0]} rotation={[0,0,Math.PI/2]}><mesh><cylinderGeometry args={[.185,.185,.14,24]}/><meshStandardMaterial color={shellColor} metalness={.75} roughness={.3}/></mesh><mesh position={[0,side<0?.076:-.076,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.125,.018,8,24]}/><meshBasicMaterial color="#32e4ee" toneMapped={false}/></mesh></group>)}
      <mesh position={[0,.63,0]} rotation={[0,0,-.13]}><cylinderGeometry args={[.025,.03,.36,12]}/><meshStandardMaterial color="#729fba" metalness={.85} roughness={.2}/></mesh>
      <mesh ref={antenna} position={[.025,.83,0]}><sphereGeometry args={[.085,20,14]}/><meshStandardMaterial color="#6dffcf" emissive="#32ffc0" emissiveIntensity={2} toneMapped={false}/></mesh>
      <mesh position={[0,0,-.46]}><circleGeometry args={[.25,24]}/><meshStandardMaterial color="#172b46" metalness={.65} roughness={.4}/></mesh>
      <mesh position={[0,0,-.47]} rotation={[0,Math.PI,0]}><torusGeometry args={[.2,.018,8,24]}/><meshBasicMaterial color="#8468ff"/></mesh>
    </group>
    <RoundedBox args={[.83,.75,.64]} radius={.23} smoothness={3} position={[0,-.22,0]} castShadow><meshStandardMaterial color={light?'#aec1d7':'#54758c'} metalness={.7} roughness={.3}/></RoundedBox>
    <RoundedBox args={[.47,.29,.045]} radius={.07} smoothness={2} position={[0,-.17,.325]}><meshStandardMaterial color="#092637" metalness={.5} roughness={.4}/></RoundedBox>
    {[0,1,2].map(n=><mesh key={n} position={[-.11+n*.11,-.17,.354]}><boxGeometry args={[.055,.08,.014]}/><meshBasicMaterial color={n===2?'#aa86ff':'#4ef4cd'} toneMapped={false}/></mesh>)}
    <group name="robot-wave-arm" ref={arm} position={[-.48,.02,0]} rotation={[0,0,-.25]}><mesh position={[0,-.23,0]}><capsuleGeometry args={[.105,.27,5,12]}/><meshStandardMaterial color={shellColor} metalness={.7} roughness={.35}/></mesh><mesh position={[0,-.48,.02]}><sphereGeometry args={[.125,16,12]}/><meshStandardMaterial color="#9ab8cd" metalness={.65} roughness={.3}/></mesh></group>
    <group position={[.48,.02,0]} rotation={[0,0,.27]}><mesh position={[0,-.23,0]}><capsuleGeometry args={[.105,.27,5,12]}/><meshStandardMaterial color={shellColor} metalness={.7} roughness={.35}/></mesh><mesh position={[0,-.48,.02]}><sphereGeometry args={[.125,16,12]}/><meshStandardMaterial color="#9ab8cd" metalness={.65} roughness={.3}/></mesh></group>
    {[-.22,.22].map(x=><RoundedBox key={x} args={[.24,.19,.36]} radius={.08} smoothness={2} position={[x,-.67,.04]}><meshStandardMaterial color={shellColor} metalness={.7} roughness={.3}/></RoundedBox>)}
    <mesh position={[0,-.65,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.2,24]}/><meshBasicMaterial color="#51d8ff" transparent opacity={.45} depthWrite={false}/></mesh>
  </group>;
}

export function City({ light, reduced }: { light: boolean; reduced: boolean }) {
  const windows = useRef<THREE.InstancedMesh>(null!);
  const timer = useRef(0);
  const cars = useRef<(THREE.Group | null)[]>([]);
  const buildings = useMemo(() => {
    const random=seeded(72);
    const result: {x:number;z:number;w:number;d:number;h:number;tone:number}[]=[];
    for (let row=0;row<5;row++) for(let col=0;col<5;col++) {
      if(row===2&&col===2)continue;
      const edge=Math.abs(row-2)+Math.abs(col-2);
      result.push({x:(col-2)*1.03,z:(row-2)*1.03,w:.48+random()*.2,d:.48+random()*.2,h:.32+random()*(edge>2?1.2:.55),tone:Math.floor(random()*3)});
    }
    return result;
  },[]);
  const windowData=useMemo(()=>{
    const result:{p:[number,number,number];s:[number,number,number];c:string}[]=[];
    const colors=['#60e7ff','#b28aff','#42f0c5'];
    for(const b of buildings)for(let floor=0;floor<Math.floor(b.h/.15);floor++)for(let col=0;col<3;col++) {
      if((floor+col+b.tone)%5===0)continue;
      const y=.12+floor*.15;
      result.push({p:[b.x+(col-1)*b.w*.25,y,b.z+b.d/2+.006],s:[.055,.045,.01],c:colors[b.tone]});
      result.push({p:[b.x+b.w/2+.006,y,b.z+(col-1)*b.d*.25],s:[.01,.045,.055],c:colors[(b.tone+1)%3]});
      result.push({p:[b.x+(col-1)*b.w*.25,y,b.z-b.d/2-.006],s:[.055,.045,.01],c:colors[(b.tone+1)%3]});
      result.push({p:[b.x-b.w/2-.006,y,b.z+(col-1)*b.d*.25],s:[.01,.045,.055],c:colors[b.tone]});
    }
    return result;
  },[buildings]);
  useLayoutEffect(()=>{
    const dummy=new THREE.Object3D();const color=new THREE.Color();
    windowData.forEach((w,i)=>{dummy.position.set(...w.p);dummy.scale.set(...w.s);dummy.updateMatrix();windows.current.setMatrixAt(i,dummy.matrix);windows.current.setColorAt(i,color.set(w.c));});
    windows.current.instanceMatrix.needsUpdate=true;if(windows.current.instanceColor)windows.current.instanceColor.needsUpdate=true;
  },[windowData]);
  useFrame((_,delta)=>{
    if(!reduced)timer.current+=Math.min(delta,.04);
    cars.current.forEach((car,i)=>{
      if(!car)return;
      const t=(timer.current*(.26+i*.014)+i*1.9)%8;
      const side=Math.floor(t/2),progress=(t%2)/2;
      const lane=i%2===0?2.66:1.54;
      if(side===0){car.position.set(-lane+progress*lane*2,.065,lane);car.rotation.y=Math.PI/2;}
      else if(side===1){car.position.set(lane,.065,lane-progress*lane*2);car.rotation.y=Math.PI;}
      else if(side===2){car.position.set(lane-progress*lane*2,.065,-lane);car.rotation.y=-Math.PI/2;}
      else{car.position.set(-lane,.065,-lane+progress*lane*2);car.rotation.y=0;}
    });
  });
  const tones=light?['#6a82a5','#536d98','#8796b8']:['#132846','#213050','#26395c'];
  return <group>
    <mesh position={[0,-.2,0]} receiveShadow><cylinderGeometry args={[3.65,3.85,.32,64]}/><meshStandardMaterial color={light?'#8196b2':'#111f38'} metalness={.8} roughness={.38}/></mesh>
    <mesh position={[0,-.025,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[3.62,64]}/><meshStandardMaterial color={light?'#3c5274':'#081527'} metalness={.6} roughness={.5}/></mesh>
    {[3.65,3.79].map((r,i)=><mesh key={r} position={[0,-.12-i*.1,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[r,.018,5,96]}/><meshBasicMaterial color={i?'#9967ff':'#2ae6e5'} toneMapped={false}/></mesh>)}
    {[-2.66,-1.54,-.51,.51,1.54,2.66].map(v=><group key={v}>
      <mesh position={[v,.001,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.19,Math.sqrt(Math.max(0,3.6**2-v**2))*2]}/><meshStandardMaterial color="#142337" roughness={.9}/></mesh>
      <mesh position={[0,.002,v]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[Math.sqrt(Math.max(0,3.6**2-v**2))*2,.19]}/><meshStandardMaterial color="#142337" roughness={.9}/></mesh>
    </group>)}
    {buildings.map((b,i)=><group key={i} position={[b.x,0,b.z]}>
      <mesh position={[0,b.h/2,0]} castShadow receiveShadow><boxGeometry args={[b.w,b.h,b.d]}/><meshStandardMaterial color={tones[b.tone]} metalness={.65} roughness={.3}/></mesh>
      <mesh position={[0,b.h+.025,0]}><boxGeometry args={[b.w+.025,.035,b.d+.025]}/><meshStandardMaterial color={tones[(b.tone+1)%3]} metalness={.8} roughness={.3}/></mesh>
      {i%3===0&&<><mesh position={[0,b.h+.1,0]}><cylinderGeometry args={[.012,.012,.18,6]}/><meshStandardMaterial color="#6784a4"/></mesh><mesh position={[0,b.h+.2,0]}><sphereGeometry args={[.025,8,6]}/><meshBasicMaterial color={i%2?'#b38aff':'#4dffee'} toneMapped={false}/></mesh></>}
      {i%4===0&&<mesh position={[-b.w/2-.007,b.h/2,0]}><boxGeometry args={[.012,b.h*.85,.026]}/><meshBasicMaterial color="#8e72ff" toneMapped={false}/></mesh>}
    </group>)}
    <instancedMesh name="city-windows" ref={windows} args={[undefined,undefined,windowData.length]} frustumCulled={false}><boxGeometry args={[1,1,1]}/><meshBasicMaterial toneMapped={false}/></instancedMesh>
    <mesh position={[0,.015,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.54,.57,48]}/><meshBasicMaterial color="#41f1da" transparent opacity={.65} toneMapped={false}/></mesh>
    <mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.8,.81,48]}/><meshBasicMaterial color="#7865e8" toneMapped={false}/></mesh>
    {Array.from({length:10},(_,i)=><group name={`city-vehicle-${i}`} key={i} ref={node=>{cars.current[i]=node;}}>
      <RoundedBox args={[.075,.045,.16]} radius={.015} smoothness={1}><meshStandardMaterial color={i%2?'#b6d9ef':'#a98aca'} metalness={.5} roughness={.35}/></RoundedBox>
      <mesh position={[0,.025,0]}><boxGeometry args={[.052,.025,.065]}/><meshStandardMaterial color="#1c3f5c" metalness={.6} roughness={.2}/></mesh>
      <mesh position={[0,0,.084]}><boxGeometry args={[.058,.016,.012]}/><meshBasicMaterial color="#b7faff" toneMapped={false}/></mesh>
      <mesh position={[0,0,-.084]}><boxGeometry args={[.058,.014,.012]}/><meshBasicMaterial color="#ff6cba" toneMapped={false}/></mesh>
    </group>)}
  </group>;
}

function Atmosphere({ reduced, light }: { reduced: boolean; light: boolean }) {
  const particles=useRef<THREE.Points>(null!);
  const positions=useMemo(()=>{const random=seeded(184);const arr=new Float32Array(90*3);for(let i=0;i<90;i++){arr[i*3]=(random()-.5)*8;arr[i*3+1]=random()*4+.1;arr[i*3+2]=(random()-.5)*8;}return arr;},[]);
  useFrame((_,dt)=>{if(!reduced)particles.current.rotation.y+=Math.min(dt,.04)*.025;});
  return <points ref={particles}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial size={.025} color={light?'#2587a2':'#8be2ff'} transparent opacity={.6} sizeAttenuation depthWrite={false}/></points>;
}

export function World({ input, light, reduced, reset, onReact }: { input: React.RefObject<Input>; light: boolean; reduced: boolean; reset: number; onReact: () => void }) {
  const world=useRef<THREE.Group>(null!);
  const controls=useRef<OrbitControlsType>(null!);
  const {camera,gl,invalidate}=useThree();
  useEffect(()=>{
    resetCamera(controls.current,camera);invalidate();
  },[reset,camera,invalidate]);
  useEffect(()=>{
    const canvas=gl.domElement;
    const down=(event:PointerEvent)=>{input.current.down=true;input.current.moved=0;input.current.startX=event.clientX;input.current.startY=event.clientY;};
    const move=(event:PointerEvent)=>{const b=canvas.getBoundingClientRect();input.current.x=(event.clientX-b.left)/b.width*2-1;input.current.y=1-(event.clientY-b.top)/b.height*2;if(input.current.down){input.current.moved=Math.hypot(event.clientX-input.current.startX,event.clientY-input.current.startY);input.current.dragging=input.current.moved>4;}invalidate();};
    const up=()=>{input.current.down=false;input.current.dragging=false;};
    const leave=()=>{input.current.x=0;input.current.y=0;up();invalidate();};
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Home'){event.preventDefault();resetCamera(controls.current,camera);invalidate();return;}
      const offset=camera.position.clone().sub(controls.current.target);const spherical=new THREE.Spherical().setFromVector3(offset);let handled=true;
      if(event.key==='ArrowLeft')spherical.theta-=.15;else if(event.key==='ArrowRight')spherical.theta+=.15;else if(event.key==='ArrowUp')spherical.phi=clamp(spherical.phi-.1,.3,1.42);else if(event.key==='ArrowDown')spherical.phi=clamp(spherical.phi+.1,.3,1.42);else if(event.key==='+'||event.key==='=')spherical.radius=clamp(spherical.radius-.6,6,16);else if(event.key==='-')spherical.radius=clamp(spherical.radius+.6,6,16);else handled=false;
      if(handled){event.preventDefault();camera.position.copy(controls.current.target).add(offset.setFromSpherical(spherical));controls.current.update();invalidate();}
    };
    canvas.tabIndex=0;canvas.setAttribute('aria-label','3D robot city. Arrow keys rotate, plus or minus zoom, Home resets.');canvas.setAttribute('role','img');
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key);
    return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',key);};
  },[camera,gl,invalidate,input]);
  useFrame((_,delta)=>{
    const i=input.current;const dt=Math.min(delta,.04);
    const tiltX=reduced||i.dragging?0:i.y*.025;const tiltZ=reduced||i.dragging?0:-i.x*.035;
    const oldX=world.current.rotation.x,oldZ=world.current.rotation.z;
    world.current.rotation.x=damp(oldX,tiltX,5,dt);world.current.rotation.z=damp(oldZ,tiltZ,5,dt);
    if(reduced&&(Math.abs(oldX-tiltX)>.001||Math.abs(oldZ-tiltZ)>.001))invalidate();
  });
  return <>
    <ambientLight intensity={light?1.8:.85}/>
    <hemisphereLight args={[light?'#e6f5ff':'#79b6ff',light?'#637e96':'#171429',light?1.8:1.1]}/>
    <directionalLight position={[4,8,5]} intensity={light?3:2.5} color="#c4e6ff"/>
    <directionalLight position={[-5,4,-3]} intensity={light?2:3.5} color="#a387ff"/>
    <pointLight position={[-2,2,3]} intensity={light?5:14} color="#36ffdb" distance={9} decay={2}/>
    <pointLight position={[3,1,-2]} intensity={light?7:20} color="#9864ff" distance={9} decay={2}/>
    <group ref={world}>
      <City light={light} reduced={reduced}/>
      <Robot input={input} reduced={reduced} light={light} onReact={onReact}/>
      <Atmosphere reduced={reduced} light={light}/>
    </group>
    <OrbitControls ref={controls} makeDefault target={TARGET} enablePan={false} enableDamping={!reduced} dampingFactor={.075} rotateSpeed={.65} zoomSpeed={.7} minDistance={6} maxDistance={16} minPolarAngle={.3} maxPolarAngle={1.42} touches={{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}}/>
  </>;
}

function Unsupported({onFailure}: {onFailure: () => void}) { useEffect(onFailure, [onFailure]); return null; }

function FrameBudget({active,reduced}:{active:boolean;reduced:boolean}) {
  const invalidate=useThree(state=>state.invalidate);
  useEffect(()=>{
    if(!active)return;
    invalidate();
    if(reduced)return;
    const timer=setInterval(invalidate, 1000/30);
    return()=>clearInterval(timer);
  },[active,reduced,invalidate]);
  return null;
}

export default function CityCanvas(props: Props) {
  const input=useRef<Input>({x:0,y:0,down:false,dragging:false,moved:0,startX:0,startY:0,pulse:-10000,hovered:false});
  const idleTimer=useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanup=useRef<(() => void) | null>(null);
  useEffect(()=>()=>{if(idleTimer.current)clearTimeout(idleTimer.current);cleanup.current?.();},[]);
  const react=()=>{props.onRobotReact();if(idleTimer.current)clearTimeout(idleTimer.current);idleTimer.current=setTimeout(props.onIdle,1800);};
  return <Canvas fallback={<Unsupported onFailure={props.onFailure}/>} camera={{position:DEFAULT_CAMERA,fov:40,near:.1,far:70}} dpr={1} frameloop={!props.active?'never':'demand'} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{
    gl.setClearColor(0x000000,0);gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=props.light?1:.95;
    const lost=(event:Event)=>{event.preventDefault();props.onFailure();};gl.domElement.addEventListener('webglcontextlost',lost);
    cleanup.current=()=>gl.domElement.removeEventListener('webglcontextlost',lost);props.onReady();
  }}><FrameBudget active={props.active} reduced={props.reduced}/><World input={input} light={props.light} reduced={props.reduced} reset={props.reset} onReact={react}/></Canvas>;
}
