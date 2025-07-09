// services/geolocation.js
class GeolocationService {
  constructor() {
    this.lastKnownPosition = null;
    this.watchId = null;
  }
  
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options
    };
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastKnownPosition = position;
          resolve(position);
        },
        (error) => {
          let errorMessage = 'Unknown geolocation error';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }
  
  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula for calculating distance between two points on Earth
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }
  
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  formatCoordinates(coords, precision = 4) {
    return `${coords.latitude.toFixed(precision)}, ${coords.longitude.toFixed(precision)}`;
  }
  
  async reverseGeocode(lat, lon) {
    try {
      // In a real implementation, you would use a geocoding service
      // For now, we'll return formatted coordinates
      return this.formatCoordinates({ latitude: lat, longitude: lon });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return this.formatCoordinates({ latitude: lat, longitude: lon });
    }
  }
  
  isSupported() {
    return 'geolocation' in navigator;
  }
  
  watchPosition(callback, errorCallback, options = {}) {
    if (!this.isSupported()) {
      errorCallback(new Error('Geolocation not supported'));
      return null;
    }
    
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
      ...options
    };
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastKnownPosition = position;
        callback(position);
      },
      errorCallback,
      defaultOptions
    );
    
    return this.watchId;
  }
  
  clearWatch() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}





// Export services
export const geolocationService = new GeolocationService();


