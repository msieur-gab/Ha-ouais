// components/car-viewer.js
class CarViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Three.js scene objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.loadedObjects = new Map();
    this.group = new THREE.Group();
    this.groundPlane = null;
    
    // Audio system
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
    
    // Animation frame ID
    this.animationId = null;
    
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
        }
      </style>
      
      <canvas id="car-canvas"></canvas>
      <div class="loading-message" id="loading-message">Loading 3D car...</div>
      <div class="error-message" id="error-message" style="display: none;"></div>
    `;
    
    this.canvas = this.shadowRoot.getElementById('car-canvas');
    this.loadingMessage = this.shadowRoot.getElementById('loading-message');
    this.errorMessage = this.shadowRoot.getElementById('error-message');
    
    this.setupThreeJS();
    this.setupEventListeners();
  }
  
  setupThreeJS() {
    try {
      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf45436);
      this.scene.add(this.group);
      
      // Camera
      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      this.camera.position.set(-60, 30, 90);
      
      // Renderer
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: this.canvas, 
        antialias: true,
        alpha: true
      });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Lighting
      this.setupLighting();
      
      // Ground plane
      this.setupGroundPlane();
      
      // Controls
      this.setupControls();
      
      // Audio
      this.setupAudio();
      
      // Start render loop - only start if already connected to DOM, otherwise do it in connectedCallback
      // This is called in the constructor, but animation might stop later if disconnected.
      // So connectedCallback will ensure it's running.
      
      // Handle resize
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this);
      
      this.loadingMessage.style.display = 'none';
      
    } catch (error) {
      this.showError('Failed to initialize 3D viewer');
      console.error('CarViewer initialization error:', error);
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
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 4.0;
    this.controls.target.set(0, 0, 0);
  }
  
  setupAudio() {
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
  }
  
  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleInteraction(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleInteraction(e));
  }
  
  startAnimation() {
    // Only start if not already running
    if (this.animationId) {
        cancelAnimationFrame(this.animationId); // Clear any existing animation frame
    }
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      if (this.controls) {
        this.controls.update();
      }
      
      this.updateVibration();
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    animate();
  }
  
  updateVibration() {
    if (this.vibrationActive) {
      const currentTime = performance.now();
      if (currentTime < this.vibrationEndTime) {
        const elapsedTime = currentTime - (this.vibrationEndTime - 
          (this.activeInteractionSound && this.activeInteractionSound.buffer ? 
           this.activeInteractionSound.buffer.duration : 0) * 1000);
        const offset = Math.sin(elapsedTime * 0.001 * this.currentVibrationFrequency * Math.PI * 2) * this.currentVibrationAmplitude;
        
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
      
      // Store original positions for vibrating parts
      if (this.currentVibratableParts.includes(partName)) {
        if (!this.originalMeshPositions.has(id)) {
          this.originalMeshPositions.set(id, data.mesh.position.clone());
        }
      }
      
      // Handle light glow for light parts
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
      // Restore original positions
      if (this.originalMeshPositions.has(id)) {
        data.mesh.position.copy(this.originalMeshPositions.get(id));
      }
      
      // Restore original emissive properties
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
      
      // Find the clicked object in our loaded objects map
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
        
        // Dispatch custom event
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
    // Stop any current sound and vibration
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
    try {
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
          console.warn('Could not load default click sound:', e);
        }
      }
      
      // Load all parts
      const partLoadPromises = carConfig.parts.map(partConfig => this.loadPart(partConfig));
      await Promise.all(partLoadPromises);
      
      this.updateCameraAndControls();
      this.hideLoading();
      
      // Dispatch loaded event
      this.dispatchEvent(new CustomEvent('car-loaded', {
        detail: { carConfig }
      }));
      
    } catch (error) {
      this.showError('Failed to load car');
      console.error('Car loading error:', error);
    }
  }
  
  async loadPart(partConfig) {
    try {
      const geometry = await this.loadSTLFromUrl(partConfig.stlUrl);
      
      // Create material
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
          console.warn(`Could not load sound for part ${partConfig.name}:`, e);
        }
      }
      
      // Store part data
      const partId = Date.now() + '-' + partConfig.name + '-' + Math.random().toString(36).substr(2, 9);
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
      
    } catch (error) {
      console.error(`Failed to load part ${partConfig.name}:`, error);
      throw error;
    }
  }
  
  loadSTLFromUrl(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.STLLoader();
      loader.load(url,
        function(geometry) {
          geometry.computeBoundingBox();
          resolve(geometry);
        },
        function(xhr) {
          // Progress callback
        },
        function(error) {
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
    // Stop any active sound and vibration
    if (this.activeInteractionSound && this.activeInteractionSound.isPlaying) {
      this.activeInteractionSound.stop();
    }
    this.stopVibration();
    
    // Remove all meshes and dispose resources
    this.group.children.forEach(child => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    });
    this.group.clear();
    this.loadedObjects.clear();
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
    
    // Position group so bottom touches ground plane
    const currentLowestY = box.min.y;
    const targetLowestY = this.groundPlane.position.y;
    const offsetY = targetLowestY - currentLowestY;
    this.group.position.y += offsetY;
    this.group.position.x -= center.x;
    this.group.position.z -= center.z;
    
    // Update controls target
    box.setFromObject(this.group);
    box.getCenter(center);
    this.controls.target.copy(center);
    
    // Position camera
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
    if (!this.renderer || !this.camera) return;
    
    const rect = this.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Only resize if width or height are greater than zero to avoid errors
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }
  
  showLoading(message = 'Loading...') {
    this.loadingMessage.textContent = message;
    this.loadingMessage.style.display = 'block';
    this.errorMessage.style.display = 'none';
  }
  
  hideLoading() {
    this.loadingMessage.style.display = 'none';
  }
  
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    this.loadingMessage.style.display = 'none';
  }
  
  // Lifecycle
  connectedCallback() {
    // Component added to DOM
    // Ensure the renderer and animation loop are active when the component is re-added to DOM
    // If setupThreeJS was already called (from constructor), just restart animation and handle resize
    if (this.renderer && this.scene && this.camera) {
        this.startAnimation(); // Restart the animation loop
        this.handleResize(); // Ensure canvas is correctly sized for current display
    } else {
        // If for some reason init() or setupThreeJS() wasn't fully executed, re-run
        this.init(); // This should ideally only happen once, but as a fallback.
                     // It's safer to just restart animation and resize if already setup.
    }
  }
  
  disconnectedCallback() {
    // Cleanup when component is removed
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null; // Clear animation ID
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    this.clearAllParts();
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null; // Clear renderer reference
    }
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