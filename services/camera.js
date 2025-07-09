
// services/camera.js
class CameraService {
    constructor() {
      this.stream = null;
      this.isActive = false;
    }
    
    async startCamera(constraints = {}) {
      const defaultConstraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
        ...constraints
      };
      
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
        this.isActive = true;
        return this.stream;
      } catch (error) {
        this.isActive = false;
        
        let errorMessage = 'Camera access failed';
        
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied by user';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found on device';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is already in use';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints not supported';
            break;
        }
        
        throw new Error(errorMessage);
      }
    }
    
    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
        this.isActive = false;
      }
    }
    
    capturePhoto(videoElement, quality = 0.8) {
      if (!this.isActive || !videoElement) {
        throw new Error('Camera not active or video element not provided');
      }
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      context.drawImage(videoElement, 0, 0);
      
      return canvas.toDataURL('image/jpeg', quality);
    }
    
    async getAvailableCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.substr(0, 8)}...`,
            facingMode: this.guessFacingMode(device.label)
          }));
      } catch (error) {
        console.error('Failed to get camera devices:', error);
        return [];
      }
    }
    
    guessFacingMode(label) {
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('back') || lowerLabel.includes('rear')) {
        return 'environment';
      } else if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
        return 'user';
      }
      return 'environment'; // Default to back camera
    }
    
    switchCamera(deviceId) {
      if (this.isActive) {
        this.stopCamera();
      }
      
      return this.startCamera({
        video: { deviceId: { exact: deviceId } }
      });
    }
    
    isSupported() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
  }
  
  export const cameraService = new CameraService();