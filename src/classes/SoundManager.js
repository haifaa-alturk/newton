//صوت الكرات عند الاصطدام
export class SoundManager {
  constructor() {
    // إعدادات الصوت الأساسية
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 5;
    this.audioContext = null;
    this.isLoaded = false;
    
    // قائمة الملفات الصوتية (سنستخدمها لاحقاً)
    this.soundFiles = {
      collision1: '/sounds/collision1.mp3',
      collision2: '/sounds/collision2.mp3',
      collision3: '/sounds/collision3.mp3',
      click: '/sounds/click.mp3',
    };
    
    // تهيئة السياق الصوتي
    
    this._initAudioContext();
    
    // محاولة تحميل الملفات الصوتية
    this._loadSounds();
  }

  
  // 1. تهيئة السياق الصوتي (AudioContext)

  _initAudioContext() {
    try {
      // إنشاء السياق الصوتي (يدعم المتصفحات المختلفة)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('✅ AudioContext initialized');
    } catch (error) {
      console.warn('⚠️ Web Audio API not supported');
      this.isEnabled = false;
    }
  }

  
  
  async _loadSounds() {

    if (!this.audioContext) return;
    
    try {
      console.log('Loading sounds...');
      
      
      const loadPromises = Object.entries(this.soundFiles).map(async ([key, url]) => {
        try {
          const response = await fetch(url);
          
        
          if (!response.ok) {
            console.warn(` Sound file not found: ${url}`);
            return;
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.sounds[key] = audioBuffer;
          console.log(`Loaded: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Failed to load ${key}:`, error);
        }
      });
      
      await Promise.all(loadPromises);
      
      // التحقق من نجاح التحميل
      const loadedCount = Object.keys(this.sounds).length;
      if (loadedCount > 0) {
        this.isLoaded = true;
        console.log(`All sounds loaded successfully! (${loadedCount} files)`);
      } else {
        console.warn('No sounds loaded, using fallback oscillator');
        this.isLoaded = false;
      }
      
    } catch (error) {
      console.warn(' Failed to load sounds, using fallback oscillator:', error);
      this.isLoaded = false;
    }
  }

  
  
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      console.log('▶️ AudioContext resumed');
    }
  }

 
  playCollisionSound(intensity = 1) {
    if (!this.isEnabled || !this.audioContext) return;
    
    if (!this.isLoaded) {
      this._playFallbackCollisionSound(intensity);
      return;
    }

    try {
      let soundKey = 'collision1';
      if (intensity > 0.7) soundKey = 'collision3';
      else if (intensity > 0.3) soundKey = 'collision2';
      
      const buffer = this.sounds[soundKey];
      if (!buffer) {
      
        this._playFallbackCollisionSound(intensity);
        return;
      }

    
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);// حساب مستوى الصوت حسب الشدة
      const volumeLevel = this.volume * Math.min(1, intensity * 0.8 + 0.2);
      gainNode.gain.setValueAtTime(volumeLevel, this.audioContext.currentTime);
      
      
      source.playbackRate.value = 0.9 + intensity * 0.2;

    
      source.start(this.audioContext.currentTime);
      
      
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };

    } catch (error) {
      console.warn('Error playing collision sound:', error);
      this._playFallbackCollisionSound(intensity);
    }
  }

  //
  _playFallbackCollisionSound(intensity = 1) {
    try {
    
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

    
      oscillator.type = 'sine';
      
      
      const frequency = 300 + intensity * 400;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 0.3, 
        this.audioContext.currentTime + 0.1
      );

      
      const volumeLevel = this.volume * Math.min(1, intensity * 0.8 + 0.2);
      gainNode.gain.setValueAtTime(volumeLevel, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

      // تشغيل الصوت
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);

    } catch (error) {
      console.warn('Error playing fallback sound:', error);
    }
  }

  
  playClickSound() {
    if (!this.isEnabled || !this.audioContext) return;

    
    if (this.isLoaded && this.sounds.click) {
      try {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds.click;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        source.start(this.audioContext.currentTime);
        
        source.onended = () => {
          source.disconnect();
          gainNode.disconnect();
        };
      } catch (error) {
        this._playFallbackClickSound();
      }
    } else {
      this._playFallbackClickSound();
    }
  }

  _playFallbackClickSound() {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);

      gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.08);

    } catch (error) {
      console.warn('Error playing fallback click:', error);
    }
  }
  increaseVolume(amount = 0.1) {
    this.volume = Math.min(1, this.volume + amount);
    this.playClickSound();
    console.log(` Volume: ${this.getVolumePercent()}%`);
  }

  decreaseVolume(amount = 0.1) {
    this.volume = Math.max(0, this.volume - amount);
    this.playClickSound();
    console.log(`🔊 Volume: ${this.getVolumePercent()}%`);
  }

  toggleSound() {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.resumeAudioContext();
    }
    this.playClickSound();
    console.log(`🔊 Sound ${this.isEnabled ? 'ON' : 'OFF'}`);
    return this.isEnabled;
  }

  getVolumePercent() {
    return Math.round(this.volume * 100);
  }

  isSoundEnabled() {
    return this.isEnabled;
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.sounds = {};
    console.log(' SoundManager disposed');
  }
}