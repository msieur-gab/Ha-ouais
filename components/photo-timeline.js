// components/photo-timeline.js
class PhotoTimeline extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.photos = [];
    this.init();
  }
  
  init() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .timeline-container {
          position: relative;
          max-height: 400px;
          overflow-y: auto;
          padding: 1rem 0;
        }
        
        .timeline-line {
          position: absolute;
          left: 2rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, var(--color-secondary, #6366f1), var(--color-primary, #f45436));
          border-radius: 1px;
        }
        
        .timeline-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-left: 4.5rem;
          animation: slideIn 0.3s ease-out;
        }
        
        .timeline-item:last-child {
          margin-bottom: 0;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .timeline-marker {
          position: absolute;
          left: 1.5rem;
          top: 0.5rem;
          width: 1rem;
          height: 1rem;
          background: white;
          border: 3px solid var(--color-secondary, #6366f1);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 1;
        }
        
        .timeline-marker.milestone {
          background: var(--color-warning, #f59e0b);
          border-color: var(--color-warning, #f59e0b);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
          }
        }
        
        .timeline-card {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          flex: 1;
        }
        
        .timeline-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .photo-container {
          position: relative;
          width: 100%;
          height: 8rem;
          overflow: hidden;
          background: var(--color-gray-100, #f3f4f6);
        }
        
        .photo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .timeline-card:hover .photo-image {
          transform: scale(1.05);
        }
        
        .photo-overlay {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .photo-content {
          padding: 1rem;
        }
        
        .photo-location {
          font-weight: 600;
          color: var(--color-gray-900, #111827);
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.25;
        }
        
        .photo-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .photo-distance {
          background: var(--color-secondary, #6366f1);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .photo-time {
          color: var(--color-gray-500, #6b7280);
          font-size: 0.75rem;
        }
        
        .photo-milestone {
          background: linear-gradient(135deg, var(--color-warning, #f59e0b), var(--color-warning-dark, #d97706));
          color: white;
          padding: 0.5rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 0.5rem;
          text-align: center;
          animation: slideIn 0.5s ease-out;
        }
        
        .milestone-icon {
          margin-right: 0.25rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: var(--color-gray-500, #6b7280);
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        
        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--color-gray-700, #374151);
        }
        
        .empty-description {
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        /* Responsive */
        @media (max-width: 640px) {
          .timeline-item {
            padding-left: 3.5rem;
          }
          
          .timeline-marker {
            left: 1rem;
          }
          
          .timeline-line {
            left: 1.5rem;
          }
          
          .photo-container {
            height: 6rem;
          }
          
          .photo-content {
            padding: 0.75rem;
          }
        }
      </style>
      
      <div class="timeline-container">
        <div class="timeline-line"></div>
        <div class="timeline-content">
          <div class="empty-state">
            <div class="empty-icon">📸</div>
            <div class="empty-title">No adventures yet!</div>
            <div class="empty-description">Take your first photo to start your journey timeline</div>
          </div>
        </div>
      </div>
    `;
    
    this.timelineContent = this.shadowRoot.querySelector('.timeline-content');
  }
  
  setPhotos(photos) {
    this.photos = [...photos].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    this.render();
  }
  
  addPhoto(photo) {
    this.photos.unshift(photo);
    this.render();
  }
  
  render() {
    if (this.photos.length === 0) {
      this.timelineContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📸</div>
          <div class="empty-title">No adventures yet!</div>
          <div class="empty-description">Take your first photo to start your journey timeline</div>
        </div>
      `;
      return;
    }
    
    const timelineItems = this.photos.map((photo, index) => this.createTimelineItem(photo, index)).join('');
    this.timelineContent.innerHTML = timelineItems;
    
    // Add event listeners to timeline items
    this.timelineContent.querySelectorAll('.timeline-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('photo-selected', {
          detail: { photo: this.photos[index], index }
        }));
      });
    });
  }
  
  createTimelineItem(photo, index) {
    const isFirstPhoto = index === 0;
    const isMilestone = photo.milestone;
    const markerClass = isMilestone ? 'timeline-marker milestone' : 'timeline-marker';
    
    const formattedTime = this.formatTime(photo.timestamp);
    const formattedDistance = this.formatDistance(photo.distance);
    
    return `
      <div class="timeline-item">
        <div class="${markerClass}"></div>
        <div class="timeline-card">
          <div class="photo-container">
            <img src="${photo.imageData}" alt="Adventure photo" class="photo-image" loading="lazy">
            ${isFirstPhoto ? '<div class="photo-overlay">Latest</div>' : ''}
          </div>
          <div class="photo-content">
            <div class="photo-location">${this.truncateLocation(photo.location)}</div>
            <div class="photo-details">
              <div class="photo-distance">${formattedDistance}</div>
              <div class="photo-time">${formattedTime}</div>
            </div>
            ${isMilestone ? this.createMilestoneContent(photo.milestone) : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  createMilestoneContent(milestone) {
    return `
      <div class="photo-milestone">
        <span class="milestone-icon">🎉</span>
        ${milestone.title}
      </div>
    `;
  }
  
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
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
  
  truncateLocation(location, maxLength = 30) {
    if (location.length <= maxLength) {
      return location;
    }
    return location.substring(0, maxLength - 3) + '...';
  }
  
  // API methods
  addMilestone(photoIndex, milestone) {
    if (this.photos[photoIndex]) {
      this.photos[photoIndex].milestone = milestone;
      this.render();
    }
  }
  
  updatePhoto(photoIndex, updates) {
    if (this.photos[photoIndex]) {
      Object.assign(this.photos[photoIndex], updates);
      this.render();
    }
  }
  
  removePhoto(photoIndex) {
    if (this.photos[photoIndex]) {
      this.photos.splice(photoIndex, 1);
      this.render();
    }
  }
  
  // Lifecycle
  connectedCallback() {
    // Component added to DOM
  }
  
  disconnectedCallback() {
    // Cleanup when component is removed
  }
  
  // Attribute handling
  static get observedAttributes() {
    return ['max-height'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'max-height') {
      const container = this.shadowRoot.querySelector('.timeline-container');
      if (container) {
        container.style.maxHeight = newValue || '400px';
      }
    }
  }
}

// Register the custom element
customElements.define('photo-timeline', PhotoTimeline);