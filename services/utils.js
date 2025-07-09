// services/utils.js
class UtilsService {
    constructor() {
      this.debounceTimers = new Map();
    }
    
    // Debounce function calls
    debounce(func, delay, key = 'default') {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }
      
      const timer = setTimeout(() => {
        func();
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    }
    
    // Throttle function calls
    throttle(func, delay) {
      let lastCall = 0;
      return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return func.apply(this, args);
        }
      };
    }
    
    // Format file size
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Format time differences
    formatTimeAgo(date) {
      const now = new Date();
      const diffInMs = now - new Date(date);
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return new Date(date).toLocaleDateString();
      }
    }
    
    // Generate unique IDs
    generateId(prefix = '') {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 9);
      return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
    }
    
    // Validate email
    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    
    // Sanitize HTML
    sanitizeHTML(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
    
    // Deep clone object
    deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
    
    // Check if object is empty
    isEmpty(obj) {
      if (obj === null || obj === undefined) return true;
      if (Array.isArray(obj)) return obj.length === 0;
      if (typeof obj === 'object') return Object.keys(obj).length === 0;
      if (typeof obj === 'string') return obj.trim().length === 0;
      return false;
    }
    
    // Capitalize first letter
    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    // Truncate text
    truncate(text, maxLength, suffix = '...') {
      if (text.length <= maxLength) return text;
      return text.substr(0, maxLength - suffix.length) + suffix;
    }
    
    // Get contrasting color (black or white) for a given background color
    getContrastingColor(hexColor) {
      // Convert hex to RGB
      const r = parseInt(hexColor.substr(1, 2), 16);
      const g = parseInt(hexColor.substr(3, 2), 16);
      const b = parseInt(hexColor.substr(5, 2), 16);
      
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      return luminance > 0.5 ? '#000000' : '#ffffff';
    }
    
    // Parse URL parameters
    parseURLParams(url = window.location.href) {
      const urlObj = new URL(url);
      const params = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return params;
    }
    
    // Download data as file
    downloadFile(data, filename, type = 'application/json') {
      const blob = new Blob([data], { type });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
    
    // Copy text to clipboard
    async copyToClipboard(text) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          return true;
        }
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
    }
    
    // Vibrate device (if supported)
    vibrate(pattern = [200]) {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    }
    
    // Show notification
    async showNotification(title, options = {}) {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
      }
      
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        const notification = new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        return notification;
      }
      
      return false;
    }
    
    // Get device info
    getDeviceInfo() {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        screen: {
          width: screen.width,
          height: screen.height,
          pixelRatio: window.devicePixelRatio
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        support: {
          geolocation: 'geolocation' in navigator,
          camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          nfc: 'NDEFReader' in window,
          serviceWorker: 'serviceWorker' in navigator,
          notifications: 'Notification' in window,
          vibration: 'vibrate' in navigator
        }
      };
    }
    
    // Convert blob to base64
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    
    // Compress image
    compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
      });
    }
  }

  export const utilsService = new UtilsService();