// services/translation.js
class TranslationService {
  constructor() {
    this.currentLanguage = localStorage.getItem('vroom_language') || 'en';
    this.translations = {};
    this.loadTranslations();
  }
  
  loadTranslations() {
    this.translations = {
      en: {
        'app.title': 'Vroom Adventures',
        'nav.settings': 'Settings',
        'welcome.title': 'Welcome to Vroom Adventures!',
        'welcome.subtitle': 'Scan your wooden car to start your journey',
        'welcome.scan': 'Scan NFC Car',
        'welcome.manual': 'Choose Car Manually',
        'welcome.driver': 'Create Driver Profile',
        'driver.title': 'Driver Profile',
        'driver.legend': 'Driver Information',
        'driver.name': 'Driver Name',
        'driver.home': 'Home Location',
        'driver.save': 'Save Profile',
        'car.select': 'Select Your Car',
        'dashboard.current_car': 'Current Car',
        'dashboard.switch': 'Switch Car',
        'dashboard.total_distance': 'Total Distance',
        'dashboard.photos': 'Photos Taken',
        'dashboard.take_photo': 'Take Photo',
        'dashboard.gallery': 'Gallery',
        'dashboard.achievements': 'Achievements',
        'dashboard.journey': 'Journey Timeline',
        'photo.title': 'Capture Adventure',
        'photo.capture': 'Capture',
        'photo.cancel': 'Cancel',
        'settings.title': 'Settings',
        'settings.preferences': 'Preferences',
        'settings.language': 'Language',
        'settings.home': 'Update Home Location',
        'settings.update': 'Update',
        'settings.export': 'Export Data',
        'settings.close': 'Close',
        'loading': 'Loading...',
        'nfc.not_supported': 'NFC Not Supported',
        'nfc.message': 'Your device doesn\'t support NFC or it\'s disabled. You can still use the app by selecting your car manually.',
        'nfc.ok': 'OK',
        // NEW Onboarding translations
        'onboard.title': 'Congratulations!',
        'onboard.subtitle': 'You\'ve unlocked a new Vroom Adventure car!',
        'onboard.create_profile': 'Create Driver Profile'
      },
      fr: {
        'app.title': 'Aventures Vroom',
        'nav.settings': 'Paramètres',
        'welcome.title': 'Bienvenue dans Aventures Vroom!',
        'welcome.subtitle': 'Scannez votre voiture en bois pour commencer',
        'welcome.scan': 'Scanner la voiture NFC',
        'welcome.manual': 'Choisir une voiture manuellement',
        'welcome.driver': 'Créer un profil de conducteur',
        'driver.title': 'Profil du conducteur',
        'driver.legend': 'Informations du conducteur',
        'driver.name': 'Nom du conducteur',
        'driver.home': 'Lieu de résidence',
        'driver.save': 'Sauvegarder le profil',
        'car.select': 'Sélectionnez votre voiture',
        'dashboard.current_car': 'Voiture actuelle',
        'dashboard.switch': 'Changer de voiture',
        'dashboard.total_distance': 'Distance totale',
        'dashboard.photos': 'Photos prises',
        'dashboard.take_photo': 'Prendre une photo',
        'dashboard.gallery': 'Galerie',
        'dashboard.achievements': 'Réalisations',
        'dashboard.journey': 'Chronologie du voyage',
        'photo.title': 'Capturer l\'aventure',
        'photo.capture': 'Capturer',
        'photo.cancel': 'Annuler',
        'settings.title': 'Paramètres',
        'settings.preferences': 'Préférences',
        'settings.language': 'Langue',
        'settings.home': 'Mettre à jour le lieu de résidence',
        'settings.update': 'Mettre à jour',
        'settings.export': 'Exporter les données',
        'settings.close': 'Fermer',
        'loading': 'Chargement...',
        'nfc.not_supported': 'NFC non supporté',
        'nfc.message': 'Votre appareil ne supporte pas NFC ou il est désactivé. Vous pouvez toujours utiliser l\'application en sélectionnant votre voiture manuellement.',
        'nfc.ok': 'OK',
        // NEW Onboarding translations
        'onboard.title': 'Félicitations !',
        'onboard.subtitle': 'Vous avez débloqué une nouvelle voiture Vroom Aventure !',
        'onboard.create_profile': 'Créer un profil de conducteur'
      },
      es: {
        'app.title': 'Aventuras Vroom',
        'nav.settings': 'Configuración',
        'welcome.title': '¡Bienvenido a Aventuras Vroom!',
        'welcome.subtitle': 'Escanea tu coche de madera para empezar',
        'welcome.scan': 'Escanear coche NFC',
        'welcome.manual': 'Elegir coche manualmente',
        'welcome.driver': 'Crear perfil de conductor',
        'driver.title': 'Perfil del conductor',
        'driver.legend': 'Información del conductor',
        'driver.name': 'Nombre del conductor',
        'driver.home': 'Ubicación del hogar',
        'driver.save': 'Guardar perfil',
        'car.select': 'Selecciona tu coche',
        'dashboard.current_car': 'Coche actual',
        'dashboard.switch': 'Cambiar coche',
        'dashboard.total_distance': 'Distancia total',
        'dashboard.photos': 'Fotos tomadas',
        'dashboard.take_photo': 'Tomar foto',
        'dashboard.gallery': 'Galería',
        'dashboard.achievements': 'Logros',
        'dashboard.journey': 'Cronología del viaje',
        'photo.title': 'Capturar aventura',
        'photo.capture': 'Capturar',
        'photo.cancel': 'Cancelar',
        'settings.title': 'Configuración',
        'settings.preferences': 'Preferencias',
        'settings.language': 'Idioma',
        'settings.home': 'Actualizar ubicación del hogar',
        'settings.update': 'Actualizar',
        'settings.export': 'Exportar datos',
        'settings.close': 'Cerrar',
        'loading': 'Cargando...',
        'nfc.not_supported': 'NFC no compatible',
        'nfc.message': 'Tu dispositivo no soporta NFC o está deshabilitado. Aún puedes usar la aplicación seleccionando tu coche manualmente.',
        'nfc.ok': 'OK',
        // NEW Onboarding translations
        'onboard.title': '¡Felicidades!',
        'onboard.subtitle': '¡Has desbloqueado un nuevo coche de Aventura Vroom!',
        'onboard.create_profile': 'Crear perfil de conductor'
      },
      de: {
        'app.title': 'Vroom Abenteuer',
        'nav.settings': 'Einstellungen',
        'welcome.title': 'Willkommen bei Vroom Abenteuer!',
        'welcome.subtitle': 'Scanne dein Holzauto um zu starten',
        'welcome.scan': 'NFC Auto scannen',
        'welcome.manual': 'Auto manuell auswählen',
        'welcome.driver': 'Fahrerprofil erstellen',
        'driver.title': 'Fahrerprofil',
        'driver.legend': 'Fahrerinformationen',
        'driver.name': 'Fahrername',
        'driver.home': 'Heimatort',
        'driver.save': 'Profil speichern',
        'car.select': 'Wähle dein Auto',
        'dashboard.current_car': 'Aktuelles Auto',
        'dashboard.switch': 'Auto wechseln',
        'dashboard.total_distance': 'Gesamte Entfernung',
        'dashboard.photos': 'Fotos aufgenommen',
        'dashboard.gallery': 'Galerie',
        'dashboard.achievements': 'Errungenschaften',
        'dashboard.journey': 'Reise-Zeitleiste',
        'photo.title': 'Abenteuer erfassen',
        'photo.capture': 'Aufnehmen',
        'photo.cancel': 'Abbrechen',
        'settings.title': 'Einstellungen',
        'settings.preferences': 'Präferenzen',
        'settings.language': 'Sprache',
        'settings.home': 'Heimatort aktualisieren',
        'settings.update': 'Aktualisieren',
        'settings.export': 'Daten exportieren',
        'settings.close': 'Schließen',
        'loading': 'Laden...',
        'nfc.not_supported': 'NFC nicht unterstützt',
        'nfc.message': 'Dein Gerät unterstützt kein NFC oder es ist deaktiviert. Du kannst die App trotzdem verwenden, indem du dein Auto manuell auswählst.',
        'nfc.ok': 'OK',
        // NEW Onboarding translations
        'onboard.title': 'Herzlichen Glückwunsch!',
        'onboard.subtitle': 'Du hast ein neues Vroom Abenteuer-Auto freigeschaltet!',
        'onboard.create_profile': 'Fahrerprofil erstellen'
      }
    };
  }
  
  setLanguage(language) {
    this.currentLanguage = language;
    localStorage.setItem('vroom_language', language);
    this.updateDOM();
  }
  
  getLanguage() {
    return this.currentLanguage;
  }
  
  translate(key, params = {}) {
    const translation = this.translations[this.currentLanguage]?.[key] || 
                       this.translations.en?.[key] || 
                       key;
    
    // Replace parameters in translation
    return Object.keys(params).reduce((text, param) => {
      return text.replace(`{{${param}}}`, params[param]);
    }, translation);
  }
  
  updateDOM() {
    document.documentElement.lang = this.currentLanguage;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.translate(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Dispatch language change event
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: this.currentLanguage }
    }));
  }
  
  getSupportedLanguages() {
    return Object.keys(this.translations);
  }
  
  getLanguageName(code) {
    const names = {
      en: 'English',
      fr: 'Français',
      es: 'Español',
      de: 'Deutsch'
    };
    return names[code] || code;
  }
}

export const translationService = new TranslationService();