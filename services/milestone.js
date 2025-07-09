// services/milestone.js
class MilestoneService {
  constructor() {
    this.milestoneDefinitions = [
      {
        distance: 100,
        title: '🏔️ Lake Titicaca Explorer',
        description: 'Highest navigable lake in the world at 3,812 meters above sea level! Located between Peru and Bolivia.',
        location: 'Lake Titicaca',
        educationalFacts: [
          'Home to unique floating islands made of totora reeds',
          'Contains 41 islands, some inhabited by local communities',
          'Sacred lake in Inca mythology, birthplace of the sun god'
        ]
      },
      {
        distance: 300,
        title: '🗿 Easter Island Voyager',
        description: 'Mysterious island in the Pacific with nearly 1,000 moai statues! One of the most remote inhabited places on Earth.',
        location: 'Easter Island',
        educationalFacts: [
          'The moai statues were carved between 1250-1500 CE',
          'Island covers only 164 square kilometers',
          'Called Rapa Nui by the indigenous Polynesian people'
        ]
      },
      {
        distance: 500,
        title: '🏯 Great Wall Pioneer',
        description: 'Ancient wonder stretching over 21,000 kilometers across northern China! Built over many dynasties.',
        location: 'Great Wall of China',
        educationalFacts: [
          'Took over 2,000 years to build completely',
          'Can be seen from space is actually a myth',
          'Built by millions of workers including soldiers and peasants'
        ]
      },
      {
        distance: 1000,
        title: '🌳 Amazon Guardian',
        description: 'Lungs of the Earth with incredible biodiversity! Home to 10% of all known species on the planet.',
        location: 'Amazon Rainforest',
        educationalFacts: [
          'Produces 20% of the world\'s oxygen',
          'Covers 5.5 million square kilometers',
          'Home to over 400 billion trees and 2.5 million insect species'
        ]
      },
      {
        distance: 2500,
        title: '🏜️ Sahara Crossing',
        description: 'Largest hot desert in the world, nearly as big as the entire United States!',
        location: 'Sahara Desert',
        educationalFacts: [
          'Covers 9 million square kilometers across North Africa',
          'Temperatures can reach 58°C (136°F) during the day',
          'Contains fascinating oases and ancient rock art'
        ]
      },
      {
        distance: 5000,
        title: '⛰️ Everest Base Camp Trekker',
        description: 'Highest peak on Earth at 8,848 meters! Known as Chomolungma in Tibetan and Sagarmatha in Nepali.',
        location: 'Mount Everest',
        educationalFacts: [
          'First summited by Edmund Hillary and Tenzing Norgay in 1953',
          'Located on the border between Nepal and Tibet',
          'Growing about 4mm taller each year due to tectonic activity'
        ]
      },
      {
        distance: 8000,
        title: '🌊 Pacific Ocean Navigator',
        description: 'Largest ocean covering one-third of Earth\'s surface! Deeper than Mount Everest is tall.',
        location: 'Pacific Ocean',
        educationalFacts: [
          'Contains more than half of all free water on Earth',
          'Deepest point is Challenger Deep at 11,034 meters',
          'Name means "peaceful" but contains the Ring of Fire'
        ]
      },
      {
        distance: 10000,
        title: '🚀 Space Station Orbit',
        description: 'International Space Station orbiting 400km above Earth! Traveling at 27,600 km/h around our planet.',
        location: 'International Space Station',
        educationalFacts: [
          'Completes 15.5 orbits around Earth every day',
          'Home to astronauts from many different countries',
          'Laboratory for experiments that help us understand space and Earth'
        ]
      },
      {
        distance: 15000,
        title: '🌍 Around the World Adventurer',
        description: 'You\'ve traveled far enough to circle the entire Earth! The equatorial circumference is about 40,075 km.',
        location: 'Around the World',
        educationalFacts: [
          'Earth is not perfectly round - it\'s slightly flattened at the poles',
          'First circumnavigation completed by Magellan\'s expedition in 1522',
          'Modern commercial flights can circle Earth in about 52 hours'
        ]
      },
      {
        distance: 25000,
        title: '🌙 Lunar Distance Explorer',
        description: 'The Moon is on average 384,400 km away from Earth - you\'re getting close to that distance!',
        location: 'Earth-Moon Distance',
        educationalFacts: [
          'Moon is moving away from Earth at 3.8 cm per year',
          'Apollo missions took about 3 days to reach the Moon',
          'Moon\'s gravity causes tides in Earth\'s oceans'
        ]
      }
    ];
  }
  
  getMilestoneForDistance(distance) {
    // Find the highest milestone that's been achieved
    const achievedMilestones = this.milestoneDefinitions.filter(m => distance >= m.distance);
    return achievedMilestones.length > 0 ? achievedMilestones[achievedMilestones.length - 1] : null;
  }
  
  getNextMilestone(distance) {
    // Find the next milestone to achieve
    const nextMilestones = this.milestoneDefinitions.filter(m => distance < m.distance);
    return nextMilestones.length > 0 ? nextMilestones[0] : null;
  }
  
  getAllMilestones() {
    return [...this.milestoneDefinitions];
  }
  
  getMilestoneProgress(currentDistance, milestoneDistance) {
    if (currentDistance >= milestoneDistance) return 100;
    return Math.min((currentDistance / milestoneDistance) * 100, 100);
  }
  
  async checkAndCreateMilestones(driverId, totalDistance, databaseService) {
    const newMilestones = [];
    
    for (const milestone of this.milestoneDefinitions) {
      if (totalDistance >= milestone.distance) {
        // Check if this milestone already exists
        const existing = await databaseService.checkMilestone(driverId, 'distance', milestone.distance);
        
        if (!existing) {
          // Create new milestone
          const newMilestone = await databaseService.addMilestone({
            driverId: driverId,
            type: 'distance',
            value: milestone.distance,
            title: milestone.title,
            description: milestone.description,
            educationalFacts: milestone.educationalFacts
          });
          
          newMilestones.push(newMilestone);
        }
      }
    }
    
    return newMilestones;
  }
  
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 100) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }
  
  generateMilestoneNotification(milestone) {
    return {
      title: '🎉 New Achievement Unlocked!',
      body: milestone.title,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        type: 'milestone',
        milestone: milestone
      },
      actions: [
        {
          action: 'view',
          title: 'View Details'
        }
      ]
    };
  }
}



// Export services
export const milestoneService = new MilestoneService();
