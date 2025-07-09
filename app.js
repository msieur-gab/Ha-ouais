// app.js - Main application logic
import  databaseService from './services/database.js';
import { geolocationService } from './services/geolocation.js';
import { translationService } from './services/translation.js';
import { nfcService } from './services/nfc.js';
import { cameraService } from './services/camera.js';
import { milestoneService } from './services/milestone.js';
import { utilsService } from './services/utils.js';

class VroomApp {
  constructor() {
    // App state
    this.currentScreen = 'welcome';
    this.currentDriver = null;
    this.currentCar = null;
    this.isInitialized = false;
    
    // UI elements
    this.screens = new Map();
    this.loadingOverlay = null;
    this.carViewer = null; // Main dashboard car viewer
    this.onboardCarViewer = null; // New onboarding car viewer
    this.photoTimeline = null;
    this.languageSelector = null;
    this.carOnboardScreen = null; // New onboarding screen element
    
    // Camera stream
    this.currentCameraStream = null;
    
    // Initialize app
    this.init();
  }
  
  async init() {
    try {
      // Cache DOM elements FIRST to ensure they are available
      this.cacheElements();
      
      this.showLoading('Initializing Vroom Adventures...');
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize services
      await this.initializeServices();
      
      // Check for existing user data and handle initial routing
      await this.checkExistingData();
      
      // Hide loading
      this.hideLoading();
      
      this.isInitialized = true;
      console.log('Vroom app initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize app. Please refresh and try again.');
    }
  }
  
  cacheElements() {
    // Cache all screens
    document.querySelectorAll('[data-screen]').forEach(screen => {
      const screenName = screen.dataset.screen;
      this.screens.set(screenName, screen);
    });
    
    // Cache commonly used elements
    this.loadingOverlay = document.querySelector('.loading-overlay');
    this.carViewer = document.querySelector('car-viewer'); // Main viewer
    this.photoTimeline = document.querySelector('photo-timeline');
    this.languageSelector = document.querySelector('language-selector');
    
    // Cache new onboarding screen elements
    this.carOnboardScreen = this.screens.get('car-onboard');
    this.onboardCarViewer = document.getElementById('onboardCarViewer'); // Onboarding viewer
    
    // Cache modals
    this.nfcModal = document.querySelector('.nfc-modal');
  }
  
  setupEventListeners() {
    // Navigation events
    document.querySelector('.scan-nfc-btn').addEventListener('click', () => this.handleNFCScan());
    document.querySelector('.manual-select-btn').addEventListener('click', () => this.showCarSelection());
    document.querySelector('.create-driver-btn').addEventListener('click', () => this.showDriverCreation());
    document.querySelector('.settings-btn').addEventListener('click', () => this.showSettings());
    
    // Driver form
    document.querySelector('.driver-form').addEventListener('submit', (e) => this.handleDriverSubmit(e));
    document.querySelector('.use-location-btn').addEventListener('click', () => this.useCurrentLocation());
    
    // NEW: Onboard screen driver creation button
    document.querySelector('.create-driver-onboard-btn').addEventListener('click', () => {
        this.showDriverCreation();
    });

    // Photo capture
    document.querySelector('.take-photo-btn').addEventListener('click', () => this.startPhotoCapture());
    document.querySelector('.capture-btn').addEventListener('click', () => this.capturePhoto());
    document.querySelector('.cancel-photo-btn').addEventListener('click', () => this.cancelPhotoCapture());
    
    // Settings
    document.querySelector('#language-select').addEventListener('change', (e) => this.changeLanguage(e.target.value));
    document.querySelector('.update-home-btn').addEventListener('click', () => this.updateHomeLocation());
    document.querySelector('.export-data-btn').addEventListener('click', () => this.exportData());
    document.querySelector('.close-settings-btn').addEventListener('click', () => this.showDashboard());
    
    // Modal events
    document.querySelector('.close-nfc-modal').addEventListener('click', () => this.hideNFCModal());
    
    // Language selector events
    if (this.languageSelector) {
      this.languageSelector.addEventListener('language-changed', (e) => {
        this.changeLanguage(e.detail.language);
      });
    }
    
    // Car viewer events
    if (this.carViewer) {
      this.carViewer.addEventListener('car-loaded', (e) => {
        console.log('Car loaded into main viewer:', e.detail.carConfig);
      });
      
      this.carViewer.addEventListener('part-clicked', (e) => {
        console.log('Car part clicked:', e.detail.partName);
        utilsService.vibrate([100, 50, 100]);
      });
    }

    // Onboarding car viewer events (if needed, otherwise just load)
    if (this.onboardCarViewer) {
        this.onboardCarViewer.addEventListener('car-loaded', (e) => {
            console.log('Car loaded into onboarding viewer:', e.detail.carConfig);
        });
    }
    
    // Photo timeline events
    if (this.photoTimeline) {
      this.photoTimeline.addEventListener('photo-selected', (e) => {
        this.showPhotoDetails(e.detail.photo);
      });
    }
    
    // Milestone events
    document.addEventListener('milestone-unlocked', (e) => {
      this.celebrateMilestone(e.detail.milestone);
    });
    
    // Service worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        this.handleServiceWorkerMessage(e.data);
      });
    }
  }
  
  async initializeServices() {
    // Initialize translation service
    const savedLanguage = await databaseService.getSetting('language', 'en');
    translationService.setLanguage(savedLanguage);
    
    if (this.languageSelector) {
      this.languageSelector.setLanguage(savedLanguage);
    }
    
    // Update language select
    document.querySelector('#language-select').value = savedLanguage;
  }
  
  async checkExistingData() {
    const drivers = await databaseService.getAllDrivers();
    this.currentDriver = drivers.length > 0 ? drivers[0] : null;

    const params = utilsService.parseURLParams();

    if (params.config) {
        // If car config is in URL, try to load it first
        try {
            await this.loadCarFromURL(params.config, params.lang); // This will set this.currentCar
            if (!this.currentDriver) {
                // Car loaded, but no driver -> show onboarding for car
                this.showCarOnboard();
            } else {
                // Car loaded, and driver exists -> show dashboard
                await this.showDashboard();
            }
        } catch (error) {
            console.error("Failed to load car from URL during initialization:", error);
            // Fallback to welcome if URL car load fails
            this.showWelcome();
        }
    } else if (this.currentDriver) {
        // No URL car, but driver exists. Check for selected car.
        const selectedCar = await databaseService.getSelectedCar();
        if (selectedCar) {
            this.currentCar = selectedCar;
            await this.loadCarInViewer(selectedCar.config);
            await this.showDashboard();
        } else {
            // Driver exists, but no selected car (e.g., first time or car deleted)
            this.showCarSelection();
        }
    } else {
        // No driver, no URL car -> show welcome
        this.showWelcome();
    }
  }
  
  // Navigation methods
  showScreen(screenName) {
    // Hide all screens
    this.screens.forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = this.screens.get(screenName);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.currentScreen = screenName;
      // Re-apply translations for the new screen content
      translationService.updateDOM();
    }
  }
  
  showWelcome() {
    this.showScreen('welcome');
  }
  
  showDriverCreation() {
    this.showScreen('driver');
  }
  
  showCarSelection() {
    this.showScreen('car-select');
    this.loadAvailableCars();
  }
  
  async showDashboard() {
    this.showScreen('dashboard');
    await this.loadDashboardData();
  }
  
  showPhotoCapture() {
    this.showScreen('photo');
  }
  
  showSettings() {
    this.showScreen('settings');
    this.loadSettingsData();
  }

  // NEW: Show Car Onboarding Screen
  async showCarOnboard() {
    this.showScreen('car-onboard');
    if (this.currentCar) {
        // Display car name
        document.querySelector('.car-name-onboard').textContent = 
            typeof this.currentCar.name === 'object' ? 
            (translationService.translate(this.currentCar.name) || this.currentCar.name.en) : // Try to translate, fallback to English if object, or use directly if string
            this.currentCar.name;

        // Load car into the dedicated onboarding viewer
        if (this.onboardCarViewer) {
             await this.onboardCarViewer.loadCar(this.currentCar.config);
        }
    }
  }
  
  // Driver management
  async handleDriverSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const driverData = {
      name: formData.get('driverName'),
      homeLocation: formData.get('homeLocation'),
      language: translationService.getLanguage()
    };
    
    try {
      this.showLoading('Creating driver profile...');
      
      // Get home coordinates if location is provided
      if (driverData.homeLocation) {
        try {
          const position = await geolocationService.getCurrentPosition();
          driverData.homeCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (error) {
          console.warn('Could not get coordinates for home location:', error);
        }
      }
      
      this.currentDriver = await databaseService.createDriver(driverData);
      this.hideLoading();
      
      await this.showDashboard();
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to create driver profile: ' + error.message);
    }
  }
  
  async useCurrentLocation() {
    try {
      this.showLoading('Getting current location...');
      
      const position = await geolocationService.getCurrentPosition();
      const locationString = geolocationService.formatCoordinates(position.coords);
      
      document.querySelector('#home-location').value = locationString;
      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to get current location: ' + error.message);
    }
  }
  
  // NFC handling
  async handleNFCScan() {
    if (!nfcService.isSupported) {
      this.showNFCModal();
      return;
    }
    
    try {
      this.showLoading('Scanning for NFC tag...');
      
      const result = await nfcService.startScan();
      this.hideLoading();
      
      if (result.carConfig) {
        await this.loadCarFromNFC(result);
      } else if (result.url) {
        // If NFC tag only contains a generic URL, try to load it as a config URL
        // assuming it follows the same pattern as a direct URL load.
        // This might not be what you want if generic URLs should lead elsewhere.
        await this.loadCarFromURL(result.url); 
      } else {
        this.showError('NFC tag does not contain recognizable car configuration data.');
      }
      
    } catch (error) {
      this.hideLoading();
      console.error('NFC scan failed:', error);
      
      if (error.message.includes('not supported')) {
        this.showNFCModal();
      } else {
        this.showError('NFC scan failed: ' + error.message);
      }
    }
  }
  
  async loadCarFromNFC(nfcData) {
    try {
      this.showLoading('Loading car configuration...');
      
      // Set language if provided in NFC data
      if (nfcData.language) {
        this.changeLanguage(nfcData.language);
      }
      
      // Assume carConfig from NFC is a path like "configs/conf-vroom.json"
      const carConfig = await this.fetchCarConfig(nfcData.carConfig);
      await this.loadCar(carConfig); // This will set this.currentCar

      // Decide next screen after car is loaded
      if (!this.currentDriver) {
          this.showCarOnboard();
      } else {
          await this.showDashboard();
      }
      
      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load car from NFC: ' + error.message);
    }
  }
  
  async loadCarFromURL(configUrl, language = null) {
    try {
      this.showLoading('Loading car from URL...');
      
      if (language) {
        this.changeLanguage(language);
      }
      
      // configUrl should already be like "configs/conf-vroom.json"
      const carConfig = await this.fetchCarConfig(configUrl);
      await this.loadCar(carConfig); // This will set this.currentCar
      
      // The calling function (checkExistingData) will handle the navigation from here
      // For NFC, this function is directly called, so it needs navigation
      // For URL from checkExistingData, it already handles it.
      // To ensure consistent behavior:
      if (this.currentScreen !== 'car-onboard' && this.currentScreen !== 'dashboard') {
          if (!this.currentDriver) {
              this.showCarOnboard();
          } else {
              await this.showDashboard();
          }
      }

      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to load car from URL: ' + error.message);
    }
  }
  
  async fetchCarConfig(configPath) {
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch car config: ${response.status}`);
    }
    return await response.json();
  }
  
  async loadCar(carConfig) {
    try {
      // Store car name using current language if multi-lingual, fallback to English
      const carNameForDB = typeof carConfig.carName === 'object' ? 
                           (carConfig.carName[translationService.getLanguage()] || carConfig.carName.en) : 
                           carConfig.carName;

      const car = await databaseService.addCar({
        name: carNameForDB,
        config: carConfig,
        selected: true
      });
      
      this.currentCar = car;
      
      // The car is loaded into the main viewer if it's currently on dashboard screen
      // or into the onboarding viewer if that's the active screen.
      // The specific screen's `show` function will handle loading into its viewer.
      
    } catch (error) {
      throw new Error('Failed to load car: ' + error.message);
    }
  }
  
  async loadCarInViewer(carConfig) {
    if (this.carViewer && carConfig) {
      await this.carViewer.loadCar(carConfig);
    }
  }
  
  // Photo capture
  async startPhotoCapture() {
    try {
      this.showLoading('Starting camera...');
      
      const stream = await cameraService.startCamera();
      const videoElement = document.querySelector('.camera-preview');
      videoElement.srcObject = stream;
      
      this.currentCameraStream = stream;
      this.showPhotoCapture();
      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to start camera: ' + error.message);
    }
  }
  
  async capturePhoto() {
    if (!this.currentDriver) {
      this.showError('No driver profile found');
      return;
    }
    
    try {
      this.showLoading('Capturing photo...');
      
      const videoElement = document.querySelector('.camera-preview');
      const imageData = cameraService.capturePhoto(videoElement);
      
      // Get current location
      let position = null;
      let distance = 0;
      
      try {
        position = await geolocationService.getCurrentPosition();
        
        if (this.currentDriver.homeCoords && position) {
          distance = geolocationService.calculateDistance(
            this.currentDriver.homeCoords.lat,
            this.currentDriver.homeCoords.lng,
            position.coords.latitude,
            position.coords.longitude
          );
        }
      } catch (error) {
        console.warn('Could not get location for photo:', error);
      }
      
      // Save photo
      const photo = await databaseService.addPhoto({
        driverId: this.currentDriver.id,
        carId: this.currentCar?.id || null,
        imageData: imageData,
        location: position ? geolocationService.formatCoordinates(position.coords) : 'Unknown',
        coords: position ? {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        } : null,
        distance: distance
      });
      
      // Check for new milestones
      await this.checkMilestones();
      
      this.cancelPhotoCapture();
      await this.showDashboard();
      this.hideLoading();
      
      // Show success message
      this.showSuccess(`Photo captured! Distance from home: ${milestoneService.formatDistance(distance)}`);
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to capture photo: ' + error.message);
    }
  }
  
  cancelPhotoCapture() {
    cameraService.stopCamera();
    this.currentCameraStream = null;
    this.showDashboard();
  }
  
  // Dashboard
  async loadDashboardData() {
    if (!this.currentDriver) return;
    
    try {
      // Load statistics
      const photos = await databaseService.getPhotosForDriver(this.currentDriver.id);
      const totalDistance = await databaseService.getTotalDistanceForDriver(this.currentDriver.id);
      
      // Update stats
      document.querySelector('#total-distance').textContent = milestoneService.formatDistance(totalDistance);
      document.querySelector('#photo-count').textContent = photos.length;
      
      // Update car name
      if (this.currentCar) {
        // Display car name, consider multilingual config
        const carNameDisplay = typeof this.currentCar.name === 'object' ? 
            (this.currentCar.name[translationService.getLanguage()] || this.currentCar.name.en) : 
            this.currentCar.name;
        document.querySelector('.car-name').textContent = carNameDisplay;

        // Ensure main car viewer is loaded if dashboard is active and car is present
        if (this.carViewer && this.currentCar.config && this.currentScreen === 'dashboard') {
            await this.carViewer.loadCar(this.currentCar.config);
        }
      }
      
      // Load milestones
      await this.loadMilestones();
      
      // Load photo timeline
      if (this.photoTimeline) {
        this.photoTimeline.setPhotos(photos);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }
  
  async loadMilestones() {
    if (!this.currentDriver) return;
    
    try {
      const milestones = await databaseService.getMilestonesForDriver(this.currentDriver.id);
      const totalDistance = await databaseService.getTotalDistanceForDriver(this.currentDriver.id);
      
      const milestonesContainer = document.querySelector('.milestones-container');
      milestonesContainer.innerHTML = '';
      
      // Show all milestone definitions with status
      for (const milestoneDefinition of milestoneService.getAllMilestones()) {
        const achieved = milestones.find(m => m.value === milestoneDefinition.distance);
        
        const milestoneCard = document.createElement('milestone-card');
        milestoneCard.setMilestone({
          ...milestoneDefinition,
          value: milestoneDefinition.distance,
          unlocked: !!achieved,
          timestamp: achieved?.timestamp
        }, totalDistance);
        
        milestonesContainer.appendChild(milestoneCard);
      }
      
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  }
  
  async checkMilestones() {
    if (!this.currentDriver) return;
    
    try {
      const totalDistance = await databaseService.getTotalDistanceForDriver(this.currentDriver.id);
      const newMilestones = await milestoneService.checkAndCreateMilestones(
        this.currentDriver.id,
        totalDistance,
        databaseService
      );
      
      // Show notifications for new milestones
      for (const milestone of newMilestones) {
        this.celebrateMilestone(milestone);
      }
      
    } catch (error) {
      console.error('Failed to check milestones:', error);
    }
  }
  
  // Settings
  loadSettingsData() {
    // Load current settings
    document.querySelector('#language-select').value = translationService.getLanguage();
    
    if (this.currentDriver) {
      document.querySelector('#new-home-location').value = this.currentDriver.homeLocation || '';
    }
  }
  
  changeLanguage(language) {
    translationService.setLanguage(language);
    databaseService.setSetting('language', language);
    
    if (this.languageSelector) {
      this.languageSelector.setLanguage(language);
    }
  }
  
  async updateHomeLocation() {
    if (!this.currentDriver) return;
    
    const newLocation = document.querySelector('#new-home-location').value;
    if (!newLocation.trim()) return;
    
    try {
      this.showLoading('Updating home location...');
      
      await databaseService.updateDriver(this.currentDriver.id, {
        homeLocation: newLocation
      });
      
      this.currentDriver.homeLocation = newLocation;
      this.hideLoading();
      this.showSuccess('Home location updated successfully');
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to update home location: ' + error.message);
    }
  }
  
  async exportData() {
    try {
      this.showLoading('Exporting data...');
      
      const data = await databaseService.exportData();
      const filename = `vroom-data-${new Date().toISOString().split('T')[0]}.json`;
      
      utilsService.downloadFile(data, filename, 'application/json');
      
      this.hideLoading();
      this.showSuccess('Data exported successfully');
      
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to export data: ' + error.message);
    }
  }
  
  // UI helpers
  showLoading(message = 'Loading...') {
    document.querySelector('#loading-text').textContent = message;
    this.loadingOverlay.setAttribute('aria-hidden', 'false');
  }
  
  hideLoading() {
    this.loadingOverlay.setAttribute('aria-hidden', 'true');
  }
  
  showNFCModal() {
    this.nfcModal.setAttribute('aria-hidden', 'false');
  }
  
  hideNFCModal() {
    this.nfcModal.setAttribute('aria-hidden', 'true');
  }
  
  showError(message) {
    console.error('App Error:', message);
    // In a real app, show a proper error notification
    alert('Error: ' + message);
  }
  
  showSuccess(message) {
    console.log('Success:', message);
    // In a real app, show a proper success notification
    utilsService.showNotification('Success', { body: message });
  }
  
  celebrateMilestone(milestone) {
    // Show milestone celebration
    utilsService.vibrate([200, 100, 200, 100, 200]);
    utilsService.showNotification(
      '🎉 New Achievement!',
      {
        body: milestone.title,
        icon: '/icons/icon-192x192.png'
      }
    );
    
    // Trigger visual celebration in the UI
    document.dispatchEvent(new CustomEvent('milestone-celebration', {
      detail: { milestone }
    }));
  }
  
  showPhotoDetails(photo) {
    // Show detailed photo view (implement as needed)
    console.log('Show photo details:', photo);
  }
  
  handleServiceWorkerMessage(data) {
    if (data.type === 'milestone-notification') {
      this.celebrateMilestone(data.milestone);
    }
  }
  
  // Available cars management
  async loadAvailableCars() {
    // This would load available car configurations
    // For now, show example cars
    const carGrid = document.querySelector('.car-grid');
    carGrid.innerHTML = `
      <div class="car-option" data-config="configs/conf-vroom.json">
        <h3>Classic Vroom</h3>
        <p>Vintage racing car with authentic sounds</p>
      </div>
      <div class="car-option" data-config="configs/conf-dodge.json">
        <h3>Classic Dodge</h3>
        <p>Powerful muscle car with V8 engine sounds</p>
      </div>
    `;
    
    // Add click handlers
    carGrid.querySelectorAll('.car-option').forEach(option => {
      option.addEventListener('click', async () => {
        const configPath = option.dataset.config;
        try {
          const carConfig = await this.fetchCarConfig(configPath);
          await this.loadCar(carConfig);
          // After selecting manually, if no driver, go to driver creation
          if (!this.currentDriver) {
              this.showDriverCreation();
          } else {
              await this.showDashboard();
          }
        } catch (error) {
          this.showError('Failed to load car: ' + error.message);
        }
      });
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.vroomApp = new VroomApp();
});

// Register service worker
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('./sw.js')
//       .then(registration => {
//         console.log('SW registered: ', registration);
//       })
//       .catch(registrationError => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }