// services/nfc.js
class NFCService {
    constructor() {
      this.isSupported = 'NDEFReader' in window;
      this.reader = null;
      this.isScanning = false;
    }
    
    async startScan() {
      if (!this.isSupported) {
        throw new Error('NFC is not supported on this device');
      }
      
      if (this.isScanning) {
        throw new Error('NFC scan already in progress');
      }
      
      try {
        this.reader = new NDEFReader();
        await this.reader.scan();
        this.isScanning = true;
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.stopScan();
            reject(new Error('NFC scan timeout'));
          }, 30000);
          
          this.reader.addEventListener('reading', ({ message, serialNumber }) => {
            clearTimeout(timeout);
            this.stopScan();
            
            const result = this.parseNFCMessage(message);
            resolve({ ...result, serialNumber });
          });
          
          this.reader.addEventListener('readingerror', (event) => {
            clearTimeout(timeout);
            this.stopScan();
            reject(new Error('NFC reading error: ' + event.message));
          });
        });
        
      } catch (error) {
        this.isScanning = false;
        throw new Error('Failed to start NFC scan: ' + error.message);
      }
    }
    
    stopScan() {
      this.isScanning = false;
      if (this.reader) {
        // Note: NDEFReader doesn't have a stop method in current spec
        // The scan continues until the reader goes out of scope
        this.reader = null;
      }
    }
    
    parseNFCMessage(message) {
      const data = {
        records: [],
        carConfig: null,
        language: null,
        url: null
      };
      
      for (const record of message.records) {
        if (record.recordType === 'url') {
          const url = new TextDecoder().decode(record.data);
          data.url = url;
          data.records.push({ type: 'url', data: url });
          
          // Parse Vroom-specific URL format
          try {
            const urlObj = new URL(url);
            const carConfig = urlObj.searchParams.get('config');
            const language = urlObj.searchParams.get('lang');
            
            if (carConfig) {
              data.carConfig = carConfig;
            }
            if (language) {
              data.language = language;
            }
          } catch (e) {
            console.warn('Failed to parse NFC URL:', e);
          }
        } else if (record.recordType === 'text') {
          const text = new TextDecoder().decode(record.data);
          data.records.push({ type: 'text', data: text });
        }
      }
      
      return data;
    }
    
    async writeNFCTag(data) {
      if (!this.isSupported) {
        throw new Error('NFC is not supported on this device');
      }
      
      try {
        const writer = new NDEFReader();
        
        const message = {
          records: []
        };
        
        if (data.url) {
          message.records.push({
            recordType: 'url',
            data: data.url
          });
        }
        
        if (data.text) {
          message.records.push({
            recordType: 'text',
            data: data.text
          });
        }
        
        await writer.write(message);
        return true;
        
      } catch (error) {
        throw new Error('Failed to write NFC tag: ' + error.message);
      }
    }
    
    generateCarURL(carConfig, language = 'en', baseUrl = window.location.origin) {
      const url = new URL(baseUrl);
      url.searchParams.set('config', carConfig);
      url.searchParams.set('lang', language);
      return url.toString();
    }
  }

  export const nfcService = new NFCService();