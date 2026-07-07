export class SoundManager {
  constructor() {
    // إعدادات الصوت الأساسية
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.5;
    this.audioContext = null;
    this.masterGain = null;        // 👈 من الملف الجديد
    this.isLoaded = false;
    this._lastClickTime = new Map(); // 👈 من الملف الجديد (لمنع التكرار)
    
    // قائمة الملفات الصوتية (اختياري للـ MP3)
    this.soundFiles = {
      collision: '/sounds/collision.mp3',
    };
    
    this._initAudioContext();
    this._loadSounds();
  }

  // ============================================
  // 1. تهيئة السياق الصوتي
  // ============================================
  _initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      console.log('✅ AudioContext initialized');
    } catch (error) {
      console.warn('⚠️ Web Audio API not supported');
      this.isEnabled = false;
    }
  }

  // ============================================
  // 2. تحميل الملف الصوتي (اختياري)
  // ============================================
  async _loadSounds() {
    if (!this.audioContext) return;
    
    try {
      console.log('🔄 Loading sound...');
      const response = await fetch('/sounds/collision.mp3');
      
      if (!response.ok) {
        console.warn('⚠️ Sound file not found, using metal oscillator');
        this.isLoaded = false;
        return;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.collision = audioBuffer;
      this.isLoaded = true;
      console.log('✅ Sound loaded successfully!');
      
    } catch (error) {
      console.warn('⚠️ Failed to load sound:', error);
      this.isLoaded = false;
    }
  }

  // ============================================
  // 3. تشغيل السياق الصوتي
  // ============================================
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      console.log('▶️ AudioContext resumed');
    }
  }

  // ============================================
  // 4. منع التكرار السريع (من الملف الجديد)
  // ============================================
  _canPlayClick(pairIndex) {
    const now = performance.now();
    const last = this._lastClickTime.get(pairIndex) || 0;
    if (now - last < 30) return false;
    this._lastClickTime.set(pairIndex, now);
    return true;
  }

  // ============================================
  // 5. صوت التصادم المعدني (الرئيسي) 🎵
  // ============================================
  playCollisionSound(intensity = 1, pairIndex = -1) {
    // منع التكرار السريع
    if (pairIndex >= 0 && !this._canPlayClick(pairIndex)) return;
    
    if (!this.isEnabled || !this.audioContext) return;
    
    // إذا كان الملف الصوتي محمّل، استخدمه
    if (this.isLoaded && this.sounds.collision) {
      this._playFileSound(intensity);
      return;
    }
    
    // وإلا استخدم الصوت المعدني الاصطناعي
    this._playMetalSound(intensity);
  }

  // ============================================
  // 6. تشغيل الملف الصوتي (إذا موجود)
  // ============================================
  _playFileSound(intensity = 1) {
    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.sounds.collision;
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      const volumeLevel = this.volume * Math.min(1, intensity * 0.8 + 0.2);
      gainNode.gain.setValueAtTime(volumeLevel, this.audioContext.currentTime);source.playbackRate.value = 0.9 + intensity * 0.2;
      
      source.start(this.audioContext.currentTime);
      
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.warn('Error playing file sound:', error);
      this._playMetalSound(intensity);
    }
  }

  // ============================================
  // 7. الصوت المعدني الاصطناعي (من الملف الجديد) 🥁
  // ============================================
  _playMetalSound(intensity = 1) {
    try {
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const vol = Math.min(1, Math.max(0.05, intensity)) * 0.18 * this.volume;

      // الماستر Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(vol, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      masterGain.connect(this.masterGain);

      // ==========================================
      // الضوضاء (تعطي الإحساس بالمعدن)
      // ==========================================
      const noiseLen = Math.floor(ctx.sampleRate * 0.02);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const bpFilter = ctx.createBiquadFilter();
      bpFilter.type = 'bandpass';
      bpFilter.frequency.value = 3500 + intensity * 2000;
      bpFilter.Q.value = 2;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35 * intensity, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      noiseSrc.connect(bpFilter);
      bpFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.025);

      // ==========================================
      // النغمات التوافقية (تعطي الرنين المعدني)
      // ==========================================
      const baseFreq = 800 * (0.97 + Math.random() * 0.06);
      const partials = [1, 2.4, 3.8, 5.6];
      const ringDurations = [0.09, 0.07, 0.05, 0.04];
      const ringGains = [0.08, 0.05, 0.03, 0.02];

      for (let i = 0; i < partials.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * partials[i], now);

        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(ringGains[i] * intensity, now);
        pGain.gain.exponentialRampToValueAtTime(0.001, now + ringDurations[i]);

        osc.connect(pGain);
        pGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + ringDurations[i] + 0.005);
      }

    } catch (error) {
      console.warn('Error playing metal sound:', error);
    }
  }

  // ============================================
  // 8. صوت النقر (للتفاعلات)
  // ============================================
  playClickSound() {
    if (!this.isEnabled || !this.audioContext) return;
    this._playMetalSound(0.1);
  }

  // ============================================
  // 9. التحكم في مستوى الصوت
  // ============================================
  increaseVolume(amount = 0.1) {
    this.volume = Math.min(1, this.volume + amount);
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
    this.playClickSound();
    console.log(`🔊 Volume: ${this.getVolumePercent()}%`);
  }

  decreaseVolume(amount = 0.1) {
    this.volume = Math.max(0, this.volume - amount);
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
    this.playClickSound();
    console.log(`🔊 Volume: ${this.getVolumePercent()}%`);
  }// ============================================
  // 10. كتم/تفعيل الصوت
  // ============================================
  toggleSound() {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.resumeAudioContext();
    }
    this.playClickSound();
    console.log(`🔊 Sound ${this.isEnabled ? 'ON' : 'OFF'}`);
    return this.isEnabled;
  }

  // ============================================
  // 11. دوال مساعدة
  // ============================================
  getVolumePercent() {
    return Math.round(this.volume * 100);
  }

  isSoundEnabled() {
    return this.isEnabled;
  }

  // ============================================
  // 12. تنظيف الموارد
  // ============================================
  dispose() {
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.masterGain = null;
    }
    this.sounds = {};
    console.log('🔇 SoundManager disposed');
  }
}