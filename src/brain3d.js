/* ═══════════════════════════════════════════════════════════
   AI BRAIN — Realistic 3D Animated Brain (Three.js)
   Procedural brain with cortical folds, neural pulses, glow
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';

// ─── Simplex-like noise (compact 3D) ───
function hash(x, y, z) {
  let h = x * 374761393 + y * 668265263 + z * 1274126177;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) / 2147483648;
}

function smoothNoise3D(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash(ix, iy, iz), b = hash(ix + 1, iy, iz);
  const c = hash(ix, iy + 1, iz), d = hash(ix + 1, iy + 1, iz);
  const e = hash(ix, iy, iz + 1), f = hash(ix + 1, iy, iz + 1);
  const g = hash(ix, iy + 1, iz + 1), h1 = hash(ix + 1, iy + 1, iz + 1);

  const x1 = a + (b - a) * ux, x2 = c + (d - c) * ux;
  const x3 = e + (f - e) * ux, x4 = g + (h1 - g) * ux;
  const y1 = x1 + (x2 - x1) * uy, y2 = x3 + (x4 - x3) * uy;
  return y1 + (y2 - y1) * uz;
}

function fbm(x, y, z, octaves) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise3D(x * freq, y * freq, z * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

export function initBrain3D() {
  const canvas = document.getElementById('hero-brain-canvas');
  if (!canvas) return;

  const container = canvas.parentElement;
  let width = container.clientWidth;
  let height = container.clientHeight;

  // ─── Scene ───
  const scene = new THREE.Scene();

  // ─── Camera ───
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.z = 3.8;

  // ─── Renderer ───
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ─── Lighting ───
  const ambientLight = new THREE.AmbientLight(0x1a2a4a, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0x88ccff, 1.0);
  mainLight.position.set(2, 3, 4);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x7b61ff, 0.4);
  fillLight.position.set(-3, -1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0x00d4ff, 0.8, 10);
  rimLight.position.set(0, 0, -3);
  scene.add(rimLight);

  const topGlow = new THREE.PointLight(0x00ffa3, 0.3, 8);
  topGlow.position.set(0, 3, 1);
  scene.add(topGlow);

  // ─── Brain Group (for floating + rotation) ───
  const brainGroup = new THREE.Group();
  scene.add(brainGroup);

  // ═══════════════════════════════════════════
  //  BRAIN MESH — Procedural cortical folds
  // ═══════════════════════════════════════════

  const brainGeo = new THREE.SphereGeometry(1.2, 128, 96);
  const posAttr = brainGeo.getAttribute('position');
  const normalAttr = brainGeo.getAttribute('normal');
  const vertexCount = posAttr.count;

  // Store original positions for animation
  const origPositions = new Float32Array(posAttr.array);

  // Deform to brain shape
  const v = new THREE.Vector3();
  for (let i = 0; i < vertexCount; i++) {
    v.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));

    const nx = v.x, ny = v.y, nz = v.z;
    const r = v.length();
    const dir = v.clone().normalize();

    // ── Brain hemispheres: slightly elongated front-to-back, wider left-right ──
    let scale = 1.0;
    scale *= 1.0 + 0.08 * Math.abs(dir.x); // wider at sides
    scale *= 1.0 - 0.06 * dir.z * dir.z;   // slightly flatter front-back  
    scale *= 1.0 - 0.15 * Math.max(0, -dir.y); // flatten bottom

    // ── Central fissure (longitudinal) ──
    const centerGroove = Math.exp(-Math.pow(dir.x, 2) * 40) * 0.06;
    scale -= centerGroove;

    // ── Sylvian fissure (lateral) ──
    const lateralGroove = Math.exp(-Math.pow(dir.y - 0.1, 2) * 30) *
                          Math.exp(-Math.pow(Math.abs(dir.x) - 0.5, 2) * 10) * 0.04;
    scale -= lateralGroove;

    // ── Cortical folds (gyri and sulci) — multi-octave noise ──
    const foldNoise = fbm(nx * 3.5, ny * 3.5, nz * 3.5, 5);
    scale += (foldNoise - 0.5) * 0.14;

    // ── Fine detail wrinkles ──
    const detail = fbm(nx * 8, ny * 8, nz * 8, 3);
    scale += (detail - 0.5) * 0.04;

    // ── Temporal lobe bulge ──
    const temporalBulge = Math.exp(-Math.pow(dir.y + 0.3, 2) * 8) *
                          (1.0 - Math.exp(-dir.x * dir.x * 4)) * 0.06;
    scale += temporalBulge;

    // ── Frontal lobe prominence ──
    const frontalBulge = Math.exp(-Math.pow(dir.z - 0.6, 2) * 5) *
                         Math.exp(-Math.pow(dir.y - 0.2, 2) * 3) * 0.05;
    scale += frontalBulge;

    // ── Occipital lobe ──
    const occipitalBulge = Math.exp(-Math.pow(dir.z + 0.7, 2) * 6) *
                           Math.exp(-Math.pow(dir.y, 2) * 4) * 0.04;
    scale += occipitalBulge;

    v.copy(dir).multiplyScalar(r * scale);

    posAttr.setXYZ(i, v.x, v.y, v.z);
    origPositions[i * 3] = v.x;
    origPositions[i * 3 + 1] = v.y;
    origPositions[i * 3 + 2] = v.z;
  }

  brainGeo.computeVertexNormals();

  // ─── Brain Material — custom shader for neural pulses ───
  const brainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      lightDir: { value: new THREE.Vector3(0.4, 0.6, 0.8).normalize() },
      lightDir2: { value: new THREE.Vector3(-0.6, -0.2, 0.4).normalize() },
      viewPos: { value: camera.position },
      baseColor: { value: new THREE.Color(0x1a2845) },
      foldColor: { value: new THREE.Color(0x0d1a30) },
      highlightColor: { value: new THREE.Color(0x3a6090) },
      pulseColor1: { value: new THREE.Color(0x00d4ff) },
      pulseColor2: { value: new THREE.Color(0x7b61ff) },
      pulseColor3: { value: new THREE.Color(0x00ffa3) },
      fresnelColor: { value: new THREE.Color(0x00aaff) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      varying float vDisplacement;
      uniform float time;

      // Simple noise for vertex animation
      float snoise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        // Subtle organic breathing movement
        vec3 pos = position;
        float breathe = sin(time * 0.8) * 0.008 + sin(time * 1.3 + pos.y * 2.0) * 0.004;
        pos += normal * breathe;

        // Subtle neural pulse displacement
        float pulse = sin(time * 2.0 + pos.x * 4.0 + pos.y * 3.0) * 0.003;
        pulse += sin(time * 3.0 + pos.z * 5.0) * 0.002;
        pos += normal * pulse;
        vDisplacement = breathe + pulse;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 lightDir;
      uniform vec3 lightDir2;
      uniform vec3 viewPos;
      uniform vec3 baseColor;
      uniform vec3 foldColor;
      uniform vec3 highlightColor;
      uniform vec3 pulseColor1;
      uniform vec3 pulseColor2;
      uniform vec3 pulseColor3;
      uniform vec3 fresnelColor;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      varying float vDisplacement;

      // Simple hash-based noise for fragment shader
      float hash31(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise3D(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float a = hash31(i);
        float b = hash31(i + vec3(1, 0, 0));
        float c = hash31(i + vec3(0, 1, 0));
        float d = hash31(i + vec3(1, 1, 0));
        float e = hash31(i + vec3(0, 0, 1));
        float f1 = hash31(i + vec3(1, 0, 1));
        float g = hash31(i + vec3(0, 1, 1));
        float h = hash31(i + vec3(1, 1, 1));

        float x1 = mix(a, b, f.x);
        float x2 = mix(c, d, f.x);
        float x3 = mix(e, f1, f.x);
        float x4 = mix(g, h, f.x);
        float y1 = mix(x1, x2, f.y);
        float y2 = mix(x3, x4, f.y);
        return mix(y1, y2, f.z);
      }

      float fbm3(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise3D(p);
          p *= 2.1;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(viewPos - vWorldPosition);

        // ── Base brain coloring with fold depth ──
        float foldDepth = fbm3(vPosition * 3.5);
        float fineDetail = fbm3(vPosition * 8.0);
        vec3 brainColor = mix(foldColor, baseColor, smoothstep(0.3, 0.6, foldDepth));
        brainColor = mix(brainColor, highlightColor, smoothstep(0.55, 0.75, foldDepth) * 0.4);
        brainColor += (fineDetail - 0.5) * 0.03;

        // ── Lighting ──
        float diffuse1 = max(dot(N, lightDir), 0.0);
        float diffuse2 = max(dot(N, lightDir2), 0.0) * 0.35;
        float diffuse = diffuse1 + diffuse2;

        // Soft shadow in folds
        float shadow = smoothstep(0.25, 0.55, foldDepth);
        diffuse *= 0.6 + 0.4 * shadow;

        // Specular
        vec3 H = normalize(lightDir + V);
        float spec = pow(max(dot(N, H), 0.0), 60.0) * 0.4;

        // Subsurface scattering approximation
        float sss = pow(max(0.0, dot(-V, lightDir)), 3.0) * 0.1;
        vec3 sssColor = vec3(0.1, 0.2, 0.4);

        // ── Neural energy pulses ──
        // Pulse wave 1 — sweeps across brain
        float pulse1Pos = sin(time * 0.6) * 2.0;
        float pulse1 = exp(-pow(vPosition.x - pulse1Pos, 2.0) * 3.0) *
                        exp(-pow(vPosition.y - cos(time * 0.4) * 0.5, 2.0) * 2.0);
        pulse1 *= 0.5 + 0.5 * sin(time * 4.0 + vPosition.z * 6.0);

        // Pulse wave 2 — circular emanation
        float dist2 = length(vPosition - vec3(sin(time * 0.7) * 0.5, cos(time * 0.5) * 0.5, 0.0));
        float pulse2 = exp(-pow(dist2 - mod(time * 0.8, 3.0), 2.0) * 8.0) * 0.6;

        // Pulse wave 3 — neural sparks along folds
        float sparkNoise = noise3D(vPosition * 6.0 + time * 0.5);
        float spark = smoothstep(0.72, 0.78, sparkNoise) * 0.8;
        spark *= smoothstep(0.35, 0.55, foldDepth); // sparks in fold ridges

        // Random neural flickers
        float flicker = noise3D(vPosition * 12.0 + time * 2.0);
        float flickerIntensity = smoothstep(0.82, 0.88, flicker) * 0.4;

        vec3 pulseGlow = pulse1 * pulseColor1 * 0.35 +
                         pulse2 * pulseColor2 * 0.25 +
                         spark * pulseColor3 * 0.4 +
                         flickerIntensity * pulseColor1 * 0.3;

        // ── Fresnel rim glow ──
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.5);
        float fresnelPulse = 0.7 + 0.3 * sin(time * 1.5);
        vec3 fresnelGlow = fresnelColor * fresnel * 0.5 * fresnelPulse;

        // ── Compose final color ──
        vec3 color = brainColor * (0.15 + diffuse * 0.85);
        color += spec * vec3(0.5, 0.7, 1.0);
        color += sss * sssColor;
        color += pulseGlow;
        color += fresnelGlow;

        // Slight ambient occlusion in deep folds
        float ao = smoothstep(0.2, 0.5, foldDepth) * 0.3 + 0.7;
        color *= ao;

        // Tone mapping
        color = color / (color + vec3(1.0));
        color = pow(color, vec3(0.95));

        gl_FragColor = vec4(color, 0.95);
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
  });

  const brainMesh = new THREE.Mesh(brainGeo, brainMaterial);
  brainGroup.add(brainMesh);

  // ═══════════════════════════════════════════
  //  OUTER GLOW SHELL
  // ═══════════════════════════════════════════

  const glowShellGeo = new THREE.SphereGeometry(1.45, 48, 48);
  const glowShellMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      viewPos: { value: camera.position },
      glowColor: { value: new THREE.Color(0x00aaff) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 viewPos;
      uniform vec3 glowColor;
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 V = normalize(viewPos - vWorldPosition);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), V)), 2.5);
        float pulse = 0.6 + 0.4 * sin(time * 1.2);
        gl_FragColor = vec4(glowColor, fresnel * 0.12 * pulse);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const glowShell = new THREE.Mesh(glowShellGeo, glowShellMat);
  brainGroup.add(glowShell);

  // ═══════════════════════════════════════════
  //  NEURAL SPARK PARTICLES on brain surface
  // ═══════════════════════════════════════════

  const sparkCount = 120;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkSizes = new Float32Array(sparkCount);
  const sparkPhases = new Float32Array(sparkCount);
  const sparkSurfaceData = [];

  for (let i = 0; i < sparkCount; i++) {
    // Random point on brain surface
    const idx = Math.floor(Math.random() * vertexCount);
    const sx = origPositions[idx * 3];
    const sy = origPositions[idx * 3 + 1];
    const sz = origPositions[idx * 3 + 2];

    sparkPositions[i * 3] = sx * 1.02;
    sparkPositions[i * 3 + 1] = sy * 1.02;
    sparkPositions[i * 3 + 2] = sz * 1.02;

    sparkSizes[i] = 1.5 + Math.random() * 3;
    sparkPhases[i] = Math.random() * Math.PI * 2;

    sparkSurfaceData.push({
      baseIdx: idx,
      offset: 0.01 + Math.random() * 0.03,
      speed: 0.5 + Math.random() * 2.0,
    });
  }

  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  sparkGeo.setAttribute('size', new THREE.BufferAttribute(sparkSizes, 1));
  sparkGeo.setAttribute('phase', new THREE.BufferAttribute(sparkPhases, 1));

  const sparkMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      varying float vAlpha;
      uniform float time;
      void main() {
        float t = time * 1.5 + phase;
        vAlpha = pow(abs(sin(t)), 3.0) * 0.8;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (250.0 / -mvPosition.z) * (0.5 + 0.5 * vAlpha);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = 1.0 - smoothstep(0.0, 0.5, d);
        float core = 1.0 - smoothstep(0.0, 0.15, d);
        vec3 color = mix(vec3(0.0, 0.83, 1.0), vec3(0.8, 0.95, 1.0), core);
        gl_FragColor = vec4(color, glow * glow * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sparks = new THREE.Points(sparkGeo, sparkMaterial);
  brainGroup.add(sparks);

  // ═══════════════════════════════════════════
  //  ANIMATION LOOP
  // ═══════════════════════════════════════════

  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.006;

    // Update uniforms
    brainMaterial.uniforms.time.value = time;
    glowShellMat.uniforms.time.value = time;
    sparkMaterial.uniforms.time.value = time;

    // Slow rotation
    brainGroup.rotation.y = time * 0.12;

    // Floating motion
    brainGroup.position.y = Math.sin(time * 0.5) * 0.06;
    brainGroup.rotation.x = Math.sin(time * 0.3) * 0.05;
    brainGroup.rotation.z = Math.cos(time * 0.4) * 0.02;

    // Animate spark positions (drift slightly along surface)
    const sp = sparkGeo.getAttribute('position');
    for (let i = 0; i < sparkCount; i++) {
      const data = sparkSurfaceData[i];
      const phase = time * data.speed + i;
      const flicker = Math.sin(phase) * 0.5 + 0.5;

      // Migrate sparks to new surface positions occasionally
      if (Math.sin(phase * 0.3) > 0.98) {
        const newIdx = Math.floor(Math.random() * vertexCount);
        data.baseIdx = newIdx;
      }

      const idx = data.baseIdx;
      const bx = origPositions[idx * 3];
      const by = origPositions[idx * 3 + 1];
      const bz = origPositions[idx * 3 + 2];
      const len = Math.sqrt(bx * bx + by * by + bz * bz);
      const scale = (len + data.offset + flicker * 0.02) / len;

      sp.setXYZ(i, bx * scale, by * scale, bz * scale);
    }
    sp.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // ─── Resize ───
  function onResize() {
    // Use the brain container (not canvas parent) for dimensions,
    // since aspect-ratio: 1/1 controls its height via CSS
    const brainContainer = document.querySelector('.hero__brain-container');
    if (!brainContainer) return;
    width = brainContainer.offsetWidth;
    height = brainContainer.offsetHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', onResize);

  // Also handle initial sizing after a brief delay (for layout calculation)
  setTimeout(onResize, 100);
}
