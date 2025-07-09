
// components/language-selector.js
class LanguageSelector extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.currentLanguage = 'en';
      this.languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
      ];
      this.init();
    }
    
    init() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            position: relative;
          }
          
          .language-selector {
            position: relative;
          }
          
          .language-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            padding: 0.5rem 1rem;
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
          }
          
          .language-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
          }
          
          .language-button:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
          }
          
          .language-flag {
            font-size: 1rem;
          }
          
          .language-code {
            text-transform: uppercase;
            font-weight: 600;
          }
          
          .dropdown-arrow {
            margin-left: 0.25rem;
            font-size: 0.75rem;
            transition: transform 0.2s ease;
          }
          
          .language-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid var(--color-gray-200, #e5e7eb);
            overflow: hidden;
            z-index: 1000;
            min-width: 160px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
          }
          
          .language-dropdown.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          
          .language-option {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: var(--color-gray-700, #374151);
            text-decoration: none;
            transition: background-color 0.2s ease;
            cursor: pointer;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
            font-size: 0.875rem;
          }
          
          .language-option:hover {
            background: var(--color-gray-50, #f9fafb);
          }
          
          .language-option.active {
            background: var(--color-secondary, #6366f1);
            color: white;
          }
          
          .language-option.active:hover {
            background: var(--color-secondary-dark, #4f46e5);
          }
          
          .option-flag {
            font-size: 1.25rem;
          }
          
          .option-details {
            flex: 1;
          }
          
          .option-name {
            font-weight: 500;
          }
          
          .option-native {
            font-size: 0.75rem;
            opacity: 0.7;
          }
          
          .check-icon {
            margin-left: auto;
            font-size: 0.875rem;
          }
          
          @media (max-width: 640px) {
            .language-dropdown {
              right: auto;
              left: 0;
            }
          }
        </style>
        
        <div class="language-selector">
          <button class="language-button" type="button">
            <span class="language-flag">🌍</span>
            <span class="language-code">EN</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          
          <div class="language-dropdown">
            <!-- Language options will be populated here -->
          </div>
        </div>
      `;
      
      this.button = this.shadowRoot.querySelector('.language-button');
      this.dropdown = this.shadowRoot.querySelector('.language-dropdown');
      this.flag = this.shadowRoot.querySelector('.language-flag');
      this.code = this.shadowRoot.querySelector('.language-code');
      this.arrow = this.shadowRoot.querySelector('.dropdown-arrow');
      
      this.setupEventListeners();
      this.populateDropdown();
      this.updateDisplay();
    }
    
    setupEventListeners() {
      this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.contains(e.target)) {
          this.closeDropdown();
        }
      });
      
      // Close dropdown on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeDropdown();
        }
      });
    }
    
    populateDropdown() {
      this.dropdown.innerHTML = this.languages.map(lang => `
        <button class="language-option ${lang.code === this.currentLanguage ? 'active' : ''}" 
                data-language="${lang.code}">
          <span class="option-flag">${lang.flag}</span>
          <div class="option-details">
            <div class="option-name">${lang.name}</div>
          </div>
          ${lang.code === this.currentLanguage ? '<span class="check-icon">✓</span>' : ''}
        </button>
      `).join('');
      
      // Add event listeners to options
      this.dropdown.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const language = option.dataset.language;
          this.selectLanguage(language);
        });
      });
    }
    
    toggleDropdown() {
      const isOpen = this.dropdown.classList.contains('open');
      if (isOpen) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
    }
    
    openDropdown() {
      this.dropdown.classList.add('open');
      this.arrow.style.transform = 'rotate(180deg)';
    }
    
    closeDropdown() {
      this.dropdown.classList.remove('open');
      this.arrow.style.transform = 'rotate(0deg)';
    }
    
    selectLanguage(languageCode) {
      if (languageCode !== this.currentLanguage) {
        this.currentLanguage = languageCode;
        this.updateDisplay();
        this.populateDropdown();
        
        // Dispatch language change event
        this.dispatchEvent(new CustomEvent('language-changed', {
          detail: { language: languageCode },
          bubbles: true
        }));
      }
      
      this.closeDropdown();
    }
    
    updateDisplay() {
      const currentLang = this.languages.find(lang => lang.code === this.currentLanguage);
      if (currentLang) {
        this.flag.textContent = currentLang.flag;
        this.code.textContent = currentLang.code.toUpperCase();
      }
    }
    
    setLanguage(languageCode) {
      if (this.languages.some(lang => lang.code === languageCode)) {
        this.currentLanguage = languageCode;
        this.updateDisplay();
        this.populateDropdown();
      }
    }
    
    getLanguage() {
      return this.currentLanguage;
    }
    
    // Lifecycle
    connectedCallback() {
      // Load saved language preference
      const savedLanguage = localStorage.getItem('vroom_language');
      if (savedLanguage && this.languages.some(lang => lang.code === savedLanguage)) {
        this.currentLanguage = savedLanguage;
        this.updateDisplay();
        this.populateDropdown();
      }
    }
    
    disconnectedCallback() {
      // Cleanup event listeners
      document.removeEventListener('click', this.closeDropdown);
      document.removeEventListener('keydown', this.closeDropdown);
    }
    
    // Attributes
    static get observedAttributes() {
      return ['language'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'language' && newValue !== oldValue) {
        this.setLanguage(newValue);
      }
    }
  }

  customElements.define('language-selector', LanguageSelector);
  