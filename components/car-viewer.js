// components/car-viewer.js - Isolated version to prevent conflicts
class CarViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Create unique instance ID to prevent conflicts
    this.instanceId = 'car-viewer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Three.js scene objects - all isolated per instance
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.loadedObjects = new Map();
    this.group = new THREE.Group();
    this.groundPlane = null;
    
    // Audio system - isolated per instance
    this.audioListener = null;
    this.audioBuffers = new Map();
    this.defaultClickSoundBuffer = null;
    this.activeInteractionSound = null;
    this.activeInteractionPartId = null;
    
    // Interaction system
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Vibration system
    this.vibrationActive = false;
    this.vibrationEndTime = 0;
    this.currentVibrationAmplitude = 0.4;
    this.currentVibrationFrequency = 12;
    this.currentVibrationAxis = 'x';
    this.currentVibratableParts = [];
    this.originalMeshPositions = new Map();
    this.originalEmissiveProperties = new Map();
    
    // Animation frame ID and state
    this.animationId = null;
    this.isInitialized = false;
    this.isDestroyed = false;
    
    console.log(`CarViewer instance created: ${this.instanceId}`);
    this.init();
  }
  
  init() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          background: #f45436;
          border-radius: 0.5rem;
          overflow: hidden;
          min-height: 300px;
        }
        
        canvas {
          display: block;
          width: 100%;
          height: 100%;
          background: #f45436;
        }
        
        .loading-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-family: var(--font-family-base, sans-serif);
          font-size: 1rem;
          font-weight: 500;
          text-align: center;
          pointer-events: none;
          z-index: 10;
        }
        
        .error-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fee2e2;
          font-family: var(--font-family-base, sans-serif);
          font-size: 0.875rem;
          text-align: center;
          pointer-events: none;
          background: rgba(239, 68, 68, 0.1);
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(239, 68, 68, 0.3);
          z-index: 10;
          max-width: 90%;
        }
        
        .debug-info {
          position: absolute;
          bottom: 10px;
          left: 10px;
          color: white;
          font-size: 10px;
          opacity: 0.7;
          pointer-events: none;
          z-index: 10;
        }
      </style>
      
      <canvas id="car-canvas-${this.instanceId}"></canvas>
      <div class="loading-message" id="loading-message-${this.instanceId}">Loading 3D car...</div>
      <div class="error-message" id="error-message-${this.instanceId}" style="display: none;"></div>
      <div class="debug-info" id="debug-info-${this.instanceId}">${this.instanceId}</div>
    `;
    
    this.canvas = this.shadowRoot.getElementById(`car-canvas-${this.instanceId}`);
    this.loadingMessage = this.shadowRoot.getElementById(`loading-message-${this.instanceId}`);
    this.errorMessage = this.shadowRoot.getElementById(`error-message-${this.instanceId}`);
    this.debugInfo = this.shadowRoot.getElementById(`debug-info-${this.instanceId}`);
  }
  
  async setupThreeJS() {
    if (this.isDestroyed) return;
    
    try {
      console.log(`${this.instanceId}: Setting up Three.js scene...`);
      
      // Check WebGL support
      if (!this.checkWebGLSupport()) {
        throw new Error('WebGL not supported');
      }
      
      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf45436);
      this.scene.add(this.group);
      
      // Camera
      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      this.camera.position.set(-60, 30, 90);
      
      // Renderer with explicit settings for isolation
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: this.canvas, 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
      
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Check for WebGL context loss
      this.canvas.addEventListener('webglcontextlost', (e) => {
        console.warn(`${this.instanceId}: WebGL context lost`);
        e.preventDefault();
        this.stopAnimation();
      });
      
      this.canvas.addEventListener('webglcontextrestored', () => {
        console.log(`${this.instanceId}: WebGL context restored`);
        this.startAnimation();
      });
      
      // Initial size
      this.handleResize();
      
      // Lighting
      this.setupLighting();
      
      // Ground plane
      this.setupGroundPlane();
      
      // Controls
      this.setupControls();
      
      // Audio
      this.setupAudio();
      
      // Event listeners
      this.setupEventListeners();
      
      // Handle resize
      this.resizeObserver = new ResizeObserver((entries) => {
        if (!this.isDestroyed) {
          this.handleResize();
        }
      });
      this.resizeObserver.observe(this);
      
      this.isInitialized = true;
      this.hideLoading();
      
      console.log(`${this.instanceId}: Three.js scene setup complete`);
      
    } catch (error) {
      this.showError(`Failed to initialize 3D viewer: ${error.message}`);
      console.error(`${this.instanceId}: Initialization error:`, error);
    }
  }
  
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }
  
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight1 = new THREE.DirectionalLight(0xe2e2e2, 1);
    directionalLight1.position.set(50, 200, 100);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 500;
    directionalLight1.shadow.camera.left = -80;
    directionalLight1.shadow.camera.right = 80;
    directionalLight1.shadow.camera.top = 80;
    directionalLight1.shadow.camera.bottom = -80;
    directionalLight1.shadow.bias = -0.0005;
    directionalLight1.shadow.normalBias = 0.02;
    directionalLight1.shadow.radius = 8;
    this.scene.add(directionalLight1);
    
    // Fill light
    const directionalLight2 = new THREE.DirectionalLight(0xe2e2e2, 0.8);
    directionalLight2.position.set(-50, -100, -50).normalize();
    this.scene.add(directionalLight2);
  }
  
  setupGroundPlane() {
    const planeGeometry = new THREE.CircleGeometry(90, 64);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.2
    });
    
    this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -50;
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);
  }
  
  setupControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 500;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 4.0;
    this.controls.target.set(0, 0, 0);
  }
  
  setupAudio() {
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
  }
  
  setupEventListeners() {
    const clickHandler = (e) => {
      if (!this.isDestroyed) {
        this.handleInteraction(e);
      }
    };
    
    this.canvas.addEventListener('click', clickHandler);
    this.canvas.addEventListener('touchstart', clickHandler);
    
    // Store handlers for cleanup
    this.eventHandlers = { clickHandler };
  }
  
  startAnimation() {
    if (this.isDestroyed || this.animationId) return;
    
    const animate = () => {
      if (this.isDestroyed) return;
      
      this.animationId = requestAnimationFrame(animate);
      
      if (this.controls) {
        this.controls.update();
      }
      
      this.updateVibration();
      
      if (this.renderer && this.scene && this.camera && !this.isDestroyed) {
        try {
          this.renderer.render(this.scene, this.camera);
        } catch (error) {
          console.error(`${this.instanceId}: Render error:`, error);
          this.stopAnimation();
        }
      }
    };
    
    animate();
    console.log(`${this.instanceId}: Animation loop started`);
  }
  
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log(`${this.instanceId}: Animation loop stopped`);
    }
  }
  
  updateVibration() {
    if (this.vibrationActive) {
      const currentTime = performance.now();
      if (currentTime < this.vibrationEndTime) {
        const elapsedTime = currentTime - (this.vibrationEndTime - 
          (this.activeInteractionSound && this.activeInteractionSound.buffer ? 
           this.activeInteractionSound.buffer.duration : 0) * 1000);
        const offset = Math.sin(elapsedTime * 0.001 * this.currentVibrationFrequency * Math.PI * 2) * 
                      this.currentVibrationAmplitude;
        
        this.loadedObjects.forEach((data, id) => {
          if (this.originalMeshPositions.has(id)) {
            data.mesh.position.copy(this.originalMeshPositions.get(id));
            if (this.currentVibrationAxis === 'x') {
              data.mesh.position.x += offset;
            } else if (this.currentVibrationAxis === 'y') {
              data.mesh.position.y += offset;
            } else if (this.currentVibrationAxis === 'z') {
              data.mesh.position.z += offset;
            }
          }
        });
      } else {
        this.stopVibration();
      }
    }
  }
  
  startVibration(endTimeMs) {
    this.vibrationActive = true;
    this.vibrationEndTime = endTimeMs;
    
    this.originalMeshPositions.clear();
    this.originalEmissiveProperties.clear();
    
    this.loadedObjects.forEach((data, id) => {
      const partName = data.originalFileName.toLowerCase();
      
      if (this.currentVibratableParts.includes(partName)) {
        if (!this.originalMeshPositions.has(id)) {
          this.originalMeshPositions.set(id, data.mesh.position.clone());
        }
      }
      
      if (partName.includes('light')) {
        if (data.mesh.material && data.mesh.material.isMeshStandardMaterial) {
          if (!this.originalEmissiveProperties.has(id)) {
            this.originalEmissiveProperties.set(id, {
              color: data.mesh.material.emissive.clone(),
              intensity: data.mesh.material.emissiveIntensity
            });
          }
          data.mesh.material.emissive.copy(data.mesh.material.color);
          data.mesh.material.emissiveIntensity = 0.8;
          data.mesh.material.needsUpdate = true;
        }
      }
    });
  }
  
  stopVibration() {
    this.vibrationActive = false;
    
    this.loadedObjects.forEach((data, id) => {
      if (this.originalMeshPositions.has(id)) {
        data.mesh.position.copy(this.originalMeshPositions.get(id));
      }
      
      if (this.originalEmissiveProperties.has(id)) {
        const originalProps = this.originalEmissiveProperties.get(id);
        data.mesh.material.emissive.copy(originalProps.color);
        data.mesh.material.emissiveIntensity = originalProps.intensity;
        data.mesh.material.needsUpdate = true;
      }
    });
    
    this.originalMeshPositions.clear();
    this.originalEmissiveProperties.clear();
  }
  
  handleInteraction(event) {
    if (!this.isInitialized || this.isDestroyed) return;
    
    event.preventDefault();
    
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.group.children, true);
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      let clickedLoadedObject = null;
      
      for (const [id, data] of this.loadedObjects.entries()) {
        if (data.mesh === intersectedObject || 
            (intersectedObject.parent && data.mesh === intersectedObject.parent) ||
            (data.mesh.children && data.mesh.children.includes(intersectedObject))) {
          clickedLoadedObject = data;
          break;
        }
      }
      
      if (clickedLoadedObject) {
        this.playPartSound(clickedLoadedObject);
        
        this.dispatchEvent(new CustomEvent('part-clicked', {
          detail: {
            partName: clickedLoadedObject.originalFileName,
            partData: clickedLoadedObject
          }
        }));
      }
    }
  }
  
  playPartSound(partData) {
    if (this.activeInteractionSound && this.activeInteractionSound.isPlaying) {
      this.activeInteractionSound.stop();
    }
    this.stopVibration();
    
    const soundBuffer = partData.soundBuffer || this.defaultClickSoundBuffer;
    
    if (soundBuffer) {
      this.activeInteractionSound = new THREE.Audio(this.audioListener);
      this.activeInteractionSound.setBuffer(soundBuffer);
      this.activeInteractionSound.setLoop(false);
      this.activeInteractionSound.setVolume(0.5);
      this.activeInteractionPartId = partData.id;
      
      const currentSoundEndTime = performance.now() + soundBuffer.duration * 1000;
      this.startVibration(currentSoundEndTime);
      
      this.activeInteractionSound.play();
    }
  }
  
  async loadCar(carConfig) {
    if (this.isDestroyed) return;
    
    try {
      console.log(`${this.instanceId}: Loading car config:`, carConfig);
      
      if (!this.isInitialized) {
        console.log(`${this.instanceId}: Initializing Three.js before loading car`);
        await this.setupThreeJS();
      }
      
      this.clearAllParts();
      this.showLoading('Loading car...');
      
      // Set vibration parameters from config
      this.currentVibrationAmplitude = carConfig.vibrationAmplitude || 0.4;
      this.currentVibrationFrequency = carConfig.vibrationFrequency || 12;
      this.currentVibrationAxis = (carConfig.vibrationAxis || 'x').toLowerCase();
      this.currentVibratableParts = carConfig.vibratableParts ? 
        carConfig.vibratableParts.map(part => part.toLowerCase()) : [];
      
      // Load default click sound if specified
      if (carConfig.defaultClickSound) {
        try {
          this.defaultClickSoundBuffer = await this.loadAudioBuffer(carConfig.defaultClickSound);
        } catch (e) {
          console.warn(`${this.instanceId}: Could not load default click sound:`, e);
        }
      }
      
      // Load all parts
      console.log(`${this.instanceId}: Loading ${carConfig.parts.length} parts`);
      const partLoadPromises = carConfig.parts.map(partConfig => this.loadPart(partConfig));
      await Promise.all(partLoadPromises);
      
      console.log(`${this.instanceId}: All parts loaded, updating camera and controls`);
      this.updateCameraAndControls();
      this.hideLoading();
      
      // Ensure animation is running
      if (!this.animationId && !this.isDestroyed) {
        this.startAnimation();
      }
      
      // Dispatch loaded event
      this.dispatchEvent(new CustomEvent('car-loaded', {
        detail: { carConfig }
      }));
      
      console.log(`${this.instanceId}: Car loading complete`);
      
    } catch (error) {
      this.showError(`Failed to load car: ${error.message}`);
      console.error(`${this.instanceId}: Car loading error:`, error);
    }
  }
  
  async loadPart(partConfig) {
    if (this.isDestroyed) return;
    
    try {
      console.log(`${this.instanceId}: Loading part:`, partConfig.name);
      const geometry = await this.loadSTLFromUrl(partConfig.stlUrl);
      
      const materialProperties = {
        roughness: 0.8,
        metalness: 0.1
      };
      
      const hasValidVertexColors = geometry.hasColors && 
        geometry.attributes.color && 
        geometry.attributes.color.count > 0;
      
      if (hasValidVertexColors) {
        materialProperties.vertexColors = true;
        materialProperties.roughness = 0.7;
      } else {
        materialProperties.color = new THREE.Color(partConfig.defaultColor || '#007bff');
        
        if (partConfig.transparent !== undefined) {
          materialProperties.transparent = partConfig.transparent;
        }
        if (partConfig.opacity !== undefined) {
          materialProperties.opacity = partConfig.opacity;
        }
      }
      
      const material = new THREE.MeshStandardMaterial(materialProperties);
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.rotation.x = -Math.PI / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Load part-specific sound
      let soundBuffer = null;
      if (partConfig.soundUrl) {
        try {
          soundBuffer = await this.loadAudioBuffer(partConfig.soundUrl);
        } catch (e) {
          console.warn(`${this.instanceId}: Could not load sound for part ${partConfig.name}:`, e);
        }
      }
      
      const partId = `${this.instanceId}-${Date.now()}-${partConfig.name}-${Math.random().toString(36).substr(2, 9)}`;
      const partData = {
        mesh: mesh,
        originalFileName: partConfig.name,
        customColor: material.color.getHexString(),
        hasEmbeddedColor: hasValidVertexColors,
        soundBuffer: soundBuffer,
        id: partId
      };
      
      this.loadedObjects.set(partId, partData);
      this.group.add(mesh);
      
      console.log(`${this.instanceId}: Part loaded successfully:`, partConfig.name);
      
    } catch (error) {
      console.error(`${this.instanceId}: Failed to load part ${partConfig.name}:`, error);
      throw error;
    }
  }
  
  loadSTLFromUrl(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.STLLoader();
      loader.load(url,
        (geometry) => {
          geometry.computeBoundingBox();
          resolve(geometry);
        },
        (xhr) => {
          const progress = xhr.loaded / xhr.total * 100;
          console.log(`${this.instanceId}: Loading STL progress: ${progress.toFixed(1)}%`);
        },
        (error) => {
          console.error(`${this.instanceId}: STL loading error:`, error);
          reject(error);
        }
      );
    });
  }
  
  loadAudioBuffer(url) {
    return new Promise((resolve, reject) => {
      if (this.audioBuffers.has(url)) {
        resolve(this.audioBuffers.get(url));
        return;
      }
      
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(url,
        (buffer) => {
          this.audioBuffers.set(url, buffer);
          resolve(buffer);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  clearAllParts() {
    if (this.activeInteractionSound && this.activeInteractionSound.isPlaying) {
      this.activeInteractionSound.stop();
    }
    this.stopVibration();
    
    this.group.children.forEach(child => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    });
    this.group.clear();
    this.loadedObjects.clear();
    
    console.log(`${this.instanceId}: All parts cleared`);
  }
  
  updateCameraAndControls() {
    if (this.loadedObjects.size === 0) {
      this.camera.position.set(-60, 30, 90);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      this.group.position.set(0, 0, 0);
      return;
    }
    
    const box = new THREE.Box3().setFromObject(this.group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const currentLowestY = box.min.y;
    const targetLowestY = this.groundPlane.position.y;
    const offsetY = targetLowestY - currentLowestY;
    this.group.position.y += offsetY;
    this.group.position.x -= center.x;
    this.group.position.z -= center.z;
    
    box.setFromObject(this.group);
    box.getCenter(center);
    this.controls.target.copy(center);
    
    const maxDim = Math.max(
      box.getSize(new THREE.Vector3()).x,
      box.getSize(new THREE.Vector3()).y,
      box.getSize(new THREE.Vector3()).z
    );
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;
    
    this.camera.position.copy(center);
    this.camera.position.x += cameraZ * 0.7;
    this.camera.position.z += cameraZ * 0.8;
    this.camera.position.y += cameraZ * 0.5;
    this.camera.lookAt(center);
    
    this.controls.update();
    
    console.log(`${this.instanceId}: Camera and controls updated`);
  }
  
  setAutoRotate(enabled) {
    if (this.controls) {
      this.controls.autoRotate = enabled;
    }
  }
  
  resetView() {
    this.updateCameraAndControls();
  }
  
  handleResize() {
    if (!this.renderer || !this.camera || this.isDestroyed) return;
    
    const rect = this.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      console.log(`${this.instanceId}: Canvas resized to: ${width} x ${height}`);
    }
  }
  
  showLoading(message = 'Loading...') {
    if (this.loadingMessage) {
      this.loadingMessage.textContent = message;
      this.loadingMessage.style.display = 'block';
    }
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
  }
  
  hideLoading() {
    if (this.loadingMessage) {
      this.loadingMessage.style.display = 'none';
    }
  }
  
  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
    }
    if (this.loadingMessage) {
      this.loadingMessage.style.display = 'none';
    }
  }
  
  destroy() {
    console.log(`${this.instanceId}: Destroying car viewer`);
    this.isDestroyed = true;
    
    this.stopAnimation();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.eventHandlers) {
      this.canvas.removeEventListener('click', this.eventHandlers.clickHandler);
      this.canvas.removeEventListener('touchstart', this.eventHandlers.clickHandler);
    }
    
    this.clearAllParts();
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }
    
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    
    this.scene = null;
    this.camera = null;
  }
  
  // Lifecycle
  connectedCallback() {
    console.log(`${this.instanceId}: Connected to DOM`);
    
    if (!this.isInitialized && !this.isDestroyed) {
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.setupThreeJS().then(() => {
            if (!this.isDestroyed) {
              this.startAnimation();
            }
          }).catch(error => {
            console.error(`${this.instanceId}: Failed to setup Three.js:`, error);
          });
        }
      }, 100); // Small delay to ensure DOM is ready
    } else if (this.isInitialized && !this.isDestroyed) {
      this.startAnimation();
      this.handleResize();
    }
  }
  
  disconnectedCallback() {
    console.log(`${this.instanceId}: Disconnected from DOM`);
    this.stopAnimation();
  }
  
  // Cleanup when element is removed permanently
  destructor() {
    this.destroy();
  }
  
  // Attribute handling
  static get observedAttributes() {
    return ['auto-rotate'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'auto-rotate') {
      this.setAutoRotate(newValue !== null);
    }
  }
}

// Register the custom element
customElements.define('car-viewer', CarViewer);