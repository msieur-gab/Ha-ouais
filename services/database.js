// services/database.js
class DatabaseService {
  constructor() {
    this.db = new Dexie('VroomDatabase');
    this.initDatabase();
  }
  
  initDatabase() {
    this.db.version(1).stores({
      drivers: '++id, name, homeLocation, homeCoords, language, created',
      // Corrected: 'selected' is now an index for the 'cars' store
      cars: '++id, selected, name, config, created', 
      photos: '++id, driverId, carId, imageData, location, coords, distance, timestamp, processed',
      milestones: '++id, driverId, type, value, title, description, unlocked, timestamp',
      settings: '++id, key, value, updated'
    });
    
    // Add hooks for data validation
    this.db.drivers.hook('creating', (primKey, obj, trans) => {
      obj.created = obj.created || new Date();
    });
    
    this.db.cars.hook('creating', (primKey, obj, trans) => {
      obj.created = obj.created || new Date();
      obj.selected = obj.selected || false;
    });
    
    this.db.photos.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = obj.timestamp || new Date();
      obj.processed = obj.processed || false;
    });
    
    this.db.milestones.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = obj.timestamp || new Date();
      obj.unlocked = obj.unlocked || false;
    });
  }
  
  // Driver methods
  async createDriver(driverData) {
    try {
      const id = await this.db.drivers.add({
        name: driverData.name,
        homeLocation: driverData.homeLocation,
        homeCoords: driverData.homeCoords || null,
        language: driverData.language || 'en',
        created: new Date()
      });
      
      return await this.getDriver(id);
    } catch (error) {
      console.error('Failed to create driver:', error);
      throw new Error('Failed to create driver profile');
    }
  }
  
  async getDriver(id) {
    try {
      return await this.db.drivers.get(id);
    } catch (error) {
      console.error('Failed to get driver:', error);
      return null;
    }
  }
  
  async getAllDrivers() {
    try {
      return await this.db.drivers.orderBy('created').reverse().toArray();
    }
    catch (error) {
      console.error('Failed to get drivers:', error);
      return [];
    }
  }
  
  async updateDriver(id, updates) {
    try {
      await this.db.drivers.update(id, updates);
      return await this.getDriver(id);
    } catch (error) {
      console.error('Failed to update driver:', error);
      throw new Error('Failed to update driver profile');
    }
  }
  
  async deleteDriver(id) {
    try {
      // Also delete related data
      await this.db.transaction('rw', this.db.drivers, this.db.photos, this.db.milestones, async () => {
        await this.db.drivers.delete(id);
        await this.db.photos.where('driverId').equals(id).delete();
        await this.db.milestones.where('driverId').equals(id).delete();
      });
    } catch (error) {
      console.error('Failed to delete driver:', error);
      throw new Error('Failed to delete driver profile');
    }
  }
  
  // Car methods
  async addCar(carData) {
    try {
      // Deselect all existing cars by iterating and updating, bypassing the problematic 'equals(true)' query
      const allExistingCars = await this.db.cars.toArray();
      for (const car of allExistingCars) {
        if (car.selected) {
          await this.db.cars.update(car.id, { selected: false });
        }
      }

      const id = await this.db.cars.add({
        name: carData.name,
        config: carData.config,
        selected: carData.selected || false, 
        created: new Date()
      });
      
      return await this.getCar(id);
    } catch (error) {
      console.error('Failed to add car:', error);
      throw new Error('Failed to add car');
    }
  }
  
  async getCar(id) {
    try {
      return await this.db.cars.get(id);
    } catch (error) {
      console.error('Failed to get car:', error);
      return null;
    }
  }
  
  async getAllCars() {
    try {
      return await this.db.cars.orderBy('created').reverse().toArray();
    } catch (error) {
      console.error('Failed to get cars:', error);
      return [];
    }
  }
  
  async getSelectedCar() {
    try {
      // Find the selected car by iterating through all cars, bypassing the problematic 'equals(true)' query
      const allCars = await this.db.cars.toArray();
      return allCars.find(car => car.selected === true);
    } catch (error) {
      console.error('Failed to get selected car:', error);
      return null;
    }
  }
  
  async selectCar(id) {
    try {
      await this.db.transaction('rw', this.db.cars, async () => {
        // Deselect all cars
        // Using `toArray` and iterating as a fallback if `where('selected').equals(true)` fails consistently
        const allCurrentlySelected = await this.db.cars.toArray();
        for (const car of allCurrentlySelected) {
            if (car.selected) {
                await this.db.cars.update(car.id, { selected: false });
            }
        }
        // Select the specified car
        await this.db.cars.update(id, { selected: true });
      });
      
      return await this.getCar(id);
    } catch (error) {
      console.error('Failed to select car:', error);
      throw new Error('Failed to select car');
    }
  }
  
  async deleteCar(id) {
    try {
      // Also delete related photos
      await this.db.transaction('rw', this.db.cars, this.db.photos, async () => {
        await this.db.cars.delete(id);
        await this.db.photos.where('carId').equals(id).delete();
      });
    } catch (error) {
      console.error('Failed to delete car:', error);
      throw new Error('Failed to delete car');
    }
  }
  
  // Photo methods
  async addPhoto(photoData) {
    try {
      const id = await this.db.photos.add({
        driverId: photoData.driverId,
        carId: photoData.carId,
        imageData: photoData.imageData,
        location: photoData.location,
        coords: photoData.coords,
        distance: photoData.distance || 0,
        timestamp: photoData.timestamp || new Date(),
        processed: false
      });
      
      return await this.getPhoto(id);
    } catch (error) {
      console.error('Failed to add photo:', error);
      throw new Error('Failed to save photo');
    }
  }
  
  async getPhoto(id) {
    try {
      return await this.db.photos.get(id);
    } catch (error) {
      console.error('Failed to get photo:', error);
      return null;
    }
  }
  
  async getPhotosForDriver(driverId, limit = null) {
    try {
      let photos = await this.db.photos.where('driverId').equals(driverId).toArray();
      photos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort descending by timestamp
      
      if (limit) {
        photos = photos.slice(0, limit);
      }
      
      return photos;
    } catch (error) {
      console.error('Failed to get photos for driver:', error);
      return [];
    }
  }
  
  async getPhotosForCar(carId, limit = null) {
    try {
      let photos = await this.db.photos.where('carId').equals(carId).toArray();
      photos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort descending by timestamp
      
      if (limit) {
        photos = photos.slice(0, limit);
      }
      
      return photos;
    } catch (error) {
      console.error('Failed to get photos for car:', error);
      return [];
    }
  }
  
  async updatePhoto(id, updates) {
    try {
      await this.db.photos.update(id, updates);
      return await this.getPhoto(id);
    } catch (error) {
      console.error('Failed to update photo:', error);
      throw new Error('Failed to update photo');
    }
  }
  
  async deletePhoto(id) {
    try {
      await this.db.photos.delete(id);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      throw new Error('Failed to delete photo');
    }
  }
  
  async getTotalDistanceForDriver(driverId) {
    try {
      const photos = await this.db.photos.where('driverId').equals(driverId).toArray();
      return photos.reduce((total, photo) => total + (photo.distance || 0), 0);
    } catch (error) {
      console.error('Failed to calculate total distance:', error);
      return 0;
    }
  }
  
  // Milestone methods
  async addMilestone(milestoneData) {
    try {
      // Check if milestone already exists
      const existing = await this.db.milestones
        .where(['driverId', 'type', 'value'])
        .equals([milestoneData.driverId, milestoneData.type, milestoneData.value])
        .first();
      
      if (existing) {
        return existing;
      }
      
      const id = await this.db.milestones.add({
        driverId: milestoneData.driverId,
        type: milestoneData.type,
        value: milestoneData.value,
        title: milestoneData.title,
        description: milestoneData.description,
        unlocked: true,
        timestamp: new Date()
      });
      
      return await this.getMilestone(id);
    } catch (error) {
      console.error('Failed to add milestone:', error);
      throw new Error('Failed to add milestone');
    }
  }
  
  async getMilestone(id) {
    try {
      return await this.db.milestones.get(id);
    } catch (error) {
      console.error('Failed to get milestone:', error);
      return null;
    }
  }
  
  async getMilestonesForDriver(driverId) {
    try {
      let milestones = await this.db.milestones
        .where('driverId')
        .equals(driverId)
        .toArray();
      milestones.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort descending by timestamp
      return milestones;
    } catch (error) {
      console.error('Failed to get milestones for driver:', error);
      return [];
    }
  }
  
  async checkMilestone(driverId, type, value) {
    try {
      return await this.db.milestones
        .where(['driverId', 'type', 'value'])
        .equals([driverId, type, value])
        .first();
    } catch (error) {
      console.error('Failed to check milestone:', error);
      return null;
    }
  }
  
  // Settings methods
  async setSetting(key, value) {
    try {
      const existing = await this.db.settings.where('key').equals(key).first();
      
      if (existing) {
        await this.db.settings.update(existing.id, { value, updated: new Date() });
      } else {
        await this.db.settings.add({ key, value, updated: new Date() });
      }
    } catch (error) {
      console.error('Failed to set setting:', error);
      throw new Error('Failed to save setting');
    }
  }
  
  async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.db.settings.where('key').equals(key).first();
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  }
  
  async getAllSettings() {
    try {
      const settings = await this.db.settings.toArray();
      return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }
  
  // Data export/import
  async exportData() {
    try {
      const data = {
        drivers: await this.db.drivers.toArray(),
        cars: await this.db.cars.toArray(),
        photos: await this.db.photos.toArray(),
        milestones: await this.db.milestones.toArray(),
        settings: await this.db.settings.toArray(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }
  
  async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      await this.db.transaction('rw', this.db.drivers, this.db.cars, this.db.photos, this.db.milestones, this.db.settings, async () => {
        // Clear existing data
        await this.db.drivers.clear();
        await this.db.cars.clear();
        await this.db.photos.clear();
        await this.db.milestones.clear();
        await this.db.settings.clear();
        
        // Import new data
        if (data.drivers) await this.db.drivers.bulkAdd(data.drivers);
        if (data.cars) await this.db.cars.bulkAdd(data.cars);
        if (data.photos) await this.db.photos.bulkAdd(data.photos);
        if (data.milestones) await this.db.milestones.bulkAdd(data.milestones);
        if (data.settings) await this.db.settings.bulkAdd(data.settings);
      });
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data: ' + error.message);
    }
  }
  
  // Database utilities
  async clearAllData() {
    try {
      await this.db.transaction('rw', this.db.drivers, this.db.cars, this.db.photos, this.db.milestones, this.db.settings, async () => {
        await this.db.drivers.clear();
        await this.db.cars.clear();
        await this.db.photos.clear();
        await this.db.milestones.clear();
        await this.db.settings.clear();
      });
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear database');
    }
  }
  
  async getDatabaseStats() {
    try {
      const stats = {
        drivers: await this.db.drivers.count(),
        cars: await this.db.cars.count(),
        photos: await this.db.photos.count(),
        milestones: await this.db.milestones.count(),
        settings: await this.db.settings.count()
      };
      
      // Calculate total size (approximate)
      const allData = await this.exportData();
      stats.approximateSize = new Blob([allData]).size;
      
      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const databaseService = new DatabaseService();
export default databaseService;