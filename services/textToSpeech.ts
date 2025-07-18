export interface SpeechOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class TextToSpeechService {
  private speechSynthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.initializeVoices();
  }

  private initializeVoices() {
    // Load voices when they become available
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.voices = this.speechSynthesis.getVoices();
        this.isInitialized = true;
      };
    }
    
    // Try to get voices immediately
    this.voices = this.speechSynthesis.getVoices();
    if (this.voices.length > 0) {
      this.isInitialized = true;
    }
  }

  private getDefaultVoice(): SpeechSynthesisVoice | null {
    // Try to find a good default female voice
    const preferredFemaleVoices = [
      'en-US-female', 'en-GB-female', 'en-female',
      'Samantha', 'Victoria', 'Karen', 'Alex', 'Nicky',
      'Google UK English Female', 'Google US English Female',
      'Microsoft Zira Desktop', 'Microsoft Hazel Desktop'
    ];
    
    // First try to find a female voice by name
    for (const preferred of preferredFemaleVoices) {
      const voice = this.voices.find(v => 
        v.name.toLowerCase().includes(preferred.toLowerCase()) ||
        v.name.toLowerCase().includes('female')
      );
      if (voice) return voice;
    }
    
    // Then try to find any English voice
    const preferredVoices = ['en-US', 'en-GB', 'en'];
    for (const preferred of preferredVoices) {
      const voice = this.voices.find(v => v.lang.startsWith(preferred));
      if (voice) return voice;
    }
    
    // Fallback to first available voice
    return this.voices.length > 0 ? this.voices[0] : null;
  }

  public getHindiVoices(): { male: SpeechSynthesisVoice[], female: SpeechSynthesisVoice[] } {
    const hindiVoices = this.voices.filter(v => 
      v.lang.startsWith('hi') || 
      v.lang.includes('IN') ||
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('india') ||
      v.name.toLowerCase().includes('google') ||
      v.name.toLowerCase().includes('microsoft')
    );
    
    console.log('Hindi voices found:', hindiVoices.map(v => `${v.name} (${v.lang})`));
    
    const maleHindi = hindiVoices.filter(v => 
      v.name.toLowerCase().includes('male') ||
      v.name.toLowerCase().includes('raj') ||
      v.name.toLowerCase().includes('amit') ||
      v.name.toLowerCase().includes('google') ||
      v.name.toLowerCase().includes('microsoft')
    );
    
    const femaleHindi = hindiVoices.filter(v => 
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('priya') ||
      v.name.toLowerCase().includes('neha') ||
      v.name.toLowerCase().includes('anjali') ||
      v.name.toLowerCase().includes('google') ||
      v.name.toLowerCase().includes('microsoft')
    );
    
    return { male: maleHindi, female: femaleHindi };
  }

  public speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        if (options.voice) {
          const selectedVoice = this.voices.find(v => v.name === options.voice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        } else {
          const defaultVoice = this.getDefaultVoice();
          if (defaultVoice) {
            utterance.voice = defaultVoice;
          }
        }

        // Set speech properties
        utterance.rate = options.rate || 0.9; // Slightly slower for clarity
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        // Handle events
        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`));

        // Speak
        this.speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  public speakWithVoice(text: string, voiceName: string, options: SpeechOptions = {}): Promise<void> {
    return this.speak(text, { ...options, voice: voiceName });
  }

  public speakReminder(reminder: { title: string; description?: string; time: string }, language: 'english' | 'hindi' = 'english'): Promise<void> {
    const timeText = this.formatTimeForSpeech(reminder.time);
    const descriptionText = reminder.description ? ` ${reminder.description}` : '';
    
    let speechText: string;
    
    if (language === 'hindi') {
      // Translate to Hindi
      speechText = this.translateToHindi(reminder.title, reminder.description, timeText);
    } else {
      // English version
      speechText = `It is ${timeText}, time to ${reminder.title.toLowerCase()}.${descriptionText}`;
    }
    
    return this.speak(speechText, {
      rate: 0.85, // Slightly faster for natural conversation
      pitch: 1.05 // More natural pitch
    });
  }

  public translateToHindi(title: string, description?: string, timeText?: string): string {
    // Simple Hindi translations for common phrases
    const translations: { [key: string]: string } = {
      'take your morning pills': 'सुबह की दवाई लेने का समय है',
      'have your lunch': 'दोपहर का खाना खाने का समय है',
      'go for your afternoon walk': 'दोपहर की सैर के लिए जाने का समय है',
      'take your evening medication': 'शाम की दवाई लेने का समय है',
      'Take the blue pills and green pill along with water': 'नीली गोलियां और हरी गोली पानी के साथ लें',
      'Don\'t forget to take your diabetes medication with your meal': 'भोजन के साथ मधुमेह की दवाई लेना न भूलें',
      'Remember to wear your comfortable shoes and take your water bottle': 'आरामदायक जूते पहनना और पानी की बोतल लेना याद रखें',
      'Take the white pills with dinner and don\'t forget to check your blood pressure': 'रात के खाने के साथ सफेद गोलियां लें और रक्तचाप की जांच करना न भूलें',
      'morning': 'सुबह',
      'afternoon': 'दोपहर',
      'evening': 'शाम',
      'night': 'रात',
      'pills': 'दवाई',
      'medication': 'दवाई',
      'walk': 'सैर',
      'lunch': 'दोपहर का खाना',
      'dinner': 'रात का खाना',
      'water': 'पानी',
      'shoes': 'जूते',
      'blood pressure': 'रक्तचाप',
      'diabetes': 'मधुमेह'
    };

    // Translate title
    let translatedTitle = title;
    for (const [english, hindi] of Object.entries(translations)) {
      translatedTitle = translatedTitle.replace(new RegExp(english, 'gi'), hindi);
    }

    // Translate description
    let translatedDescription = description || '';
    for (const [english, hindi] of Object.entries(translations)) {
      translatedDescription = translatedDescription.replace(new RegExp(english, 'gi'), hindi);
    }

    // Format time in Hindi
    const hindiTimeText = this.formatTimeForHindiSpeech(timeText || '');
    
    return `${hindiTimeText} है, ${translatedTitle}।${translatedDescription}`;
  }

  private formatTimeForHindiSpeech(timeText: string): string {
    // Convert English time to Hindi
    const timeMap: { [key: string]: string } = {
      '9 AM': 'सुबह के नौ बजे',
      '12 30 PM': 'दोपहर के साढ़े बारह बजे',
      '3 PM': 'दोपहर के तीन बजे',
      '6 PM': 'शाम के छह बजे',
      '9 15 AM': 'सुबह के सवा नौ बजे',
      '9 30 AM': 'सुबह के साढ़े नौ बजे',
      '9 45 AM': 'सुबह के पौने दस बजे'
    };
    
    return timeMap[timeText] || timeText;
  }

  private formatTimeForSpeech(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // More natural time formatting
    if (minutes === 0) {
      return `${hour} ${ampm}`;
    } else if (minutes === 15) {
      return `${hour} 15 ${ampm}`;
    } else if (minutes === 30) {
      return `${hour} 30 ${ampm}`;
    } else if (minutes === 45) {
      return `${hour} 45 ${ampm}`;
    } else {
      return `${hour} ${minutes} ${ampm}`;
    }
  }

  public stop(): void {
    this.speechSynthesis.cancel();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public isSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }
}

// Create a singleton instance
export const textToSpeech = new TextToSpeechService(); 