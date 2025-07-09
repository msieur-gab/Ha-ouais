// components/milestone-card.js
class MilestoneCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.milestone = null;
    this.init();
  }
  
  init() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 1rem;
        }
        
        .milestone-card {
          background: linear-gradient(135deg, var(--color-warning, #f59e0b) 0%, var(--color-warning-dark, #d97706) 100%);
          color: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .milestone-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .milestone-card.unlocked {
          animation: milestoneUnlock 0.6s ease-out;
        }
        
        @keyframes milestoneUnlock {
          0% {
            transform: scale(0.9) rotateY(-15deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) rotateY(5deg);
          }
          100% {
            transform: scale(1) rotateY(0);
            opacity: 1;
          }
        }
        
        .milestone-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .milestone-icon {
          font-size: 2rem;
          margin-right: 0.75rem;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-5px);
          }
          60% {
            transform: translateY(-3px);
          }
        }
        
        .milestone-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }
        
        .milestone-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }
        
        .milestone-description {
          font-size: 0.875rem;
          line-height: 1.5;
          opacity: 0.9;
          margin-bottom: 1rem;
        }
        
        .milestone-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .milestone-distance {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .milestone-date {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        
        .milestone-decoration {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        
        .milestone-card.locked {
          background: linear-gradient(135deg, var(--color-gray-400, #9ca3af) 0%, var(--color-gray-500, #6b7280) 100%);
          opacity: 0.7;
        }
        
        .milestone-card.locked .milestone-icon {
          animation: none;
          opacity: 0.5;
        }
        
        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 1rem;
        }
        
        .progress-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
          transition: width 0.5s ease;
        }
      </style>
      
      <article class="milestone-card">
        <div class="milestone-decoration"></div>
        <header class="milestone-header">
          <div class="milestone-title">
            <span class="milestone-icon">🏆</span>
            <span class="milestone-title-text">Achievement</span>
          </div>
          <div class="milestone-badge">NEW</div>
        </header>
        <div class="milestone-description">
          Complete your first adventure to unlock this milestone.
        </div>
        <footer class="milestone-stats">
          <div class="milestone-distance">0 km</div>
          <div class="milestone-date">Not achieved</div>
        </footer>
        <div class="progress-bar" style="display: none;">
          <div class="progress-fill" style="width: 0%;"></div>
        </div>
      </article>
    `;
    
    this.card = this.shadowRoot.querySelector('.milestone-card');
    this.icon = this.shadowRoot.querySelector('.milestone-icon');
    this.titleText = this.shadowRoot.querySelector('.milestone-title-text');
    this.badge = this.shadowRoot.querySelector('.milestone-badge');
    this.description = this.shadowRoot.querySelector('.milestone-description');
    this.distance = this.shadowRoot.querySelector('.milestone-distance');
    this.date = this.shadowRoot.querySelector('.milestone-date');
    this.progressBar = this.shadowRoot.querySelector('.progress-bar');
    this.progressFill = this.shadowRoot.querySelector('.progress-fill');
  }
  
  setMilestone(milestone, currentDistance = 0) {
    this.milestone = milestone;
    
    // Update content
    this.icon.textContent = this.getMilestoneIcon(milestone);
    this.titleText.textContent = milestone.title;
    this.description.textContent = milestone.description;
    this.distance.textContent = `${milestone.value} km`;
    
    // Update state
    if (milestone.unlocked) {
      this.card.classList.remove('locked');
      this.card.classList.add('unlocked');
      this.badge.textContent = 'ACHIEVED';
      this.badge.style.background = 'rgba(16, 185, 129, 0.8)';
      this.date.textContent = this.formatDate(milestone.timestamp);
      this.progressBar.style.display = 'none';
    } else {
      this.card.classList.add('locked');
      this.card.classList.remove('unlocked');
      this.badge.textContent = 'LOCKED';
      this.badge.style.background = 'rgba(107, 114, 128, 0.8)';
      this.date.textContent = 'Not achieved';
      
      // Show progress if we're working towards this milestone
      if (currentDistance > 0 && currentDistance < milestone.value) {
        const progress = (currentDistance / milestone.value) * 100;
        this.progressBar.style.display = 'block';
        this.progressFill.style.width = `${progress}%`;
      } else {
        this.progressBar.style.display = 'none';
      }
    }
  }
  
  getMilestoneIcon(milestone) {
    const icons = {
      'Lake Titicaca': '🏔️',
      'Great Wall of China': '🏯',
      'Amazon Rainforest': '🌳',
      'Sahara Desert': '🏜️',
      'Mount Everest': '⛰️',
      'International Space Station': '🚀'
    };
    
    for (const [location, icon] of Object.entries(icons)) {
      if (milestone.title.includes(location)) {
        return icon;
      }
    }
    
    return '🏆';
  }
  
  formatDate(timestamp) {
    if (!timestamp) return 'Not achieved';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  animateUnlock() {
    this.card.classList.add('unlocked');
    
    // Trigger celebration effect
    this.dispatchEvent(new CustomEvent('milestone-unlocked', {
      detail: { milestone: this.milestone },
      bubbles: true
    }));
  }
  
  // Lifecycle
  connectedCallback() {
    this.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('milestone-clicked', {
        detail: { milestone: this.milestone },
        bubbles: true
      }));
    });
  }
  
  disconnectedCallback() {
    // Cleanup
  }
  
  // Attributes
  static get observedAttributes() {
    return ['unlocked', 'progress'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'unlocked' && newValue !== null) {
      this.animateUnlock();
    } else if (name === 'progress') {
      const progress = parseFloat(newValue) || 0;
      this.progressFill.style.width = `${Math.min(progress, 100)}%`;
    }
  }
}

// Register the custom element
customElements.define('milestone-card', MilestoneCard);