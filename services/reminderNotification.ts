import { Reminder } from '../types';
import { textToSpeech } from './textToSpeech';

export class ReminderNotificationService {
  private checkInterval: number | null = null;
  private lastCheckedReminders: Set<string> = new Set();
  private isEnabled = true;

  constructor() {
    this.startChecking();
  }

  public startChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 30 seconds
    this.checkInterval = window.setInterval(() => {
      if (this.isEnabled) {
        this.checkForDueReminders();
      }
    }, 30000); // 30 seconds

    // Also check immediately
    this.checkForDueReminders();
  }

  public stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      textToSpeech.stop();
    }
  }

  private checkForDueReminders(): void {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get reminders from localStorage or use a callback
    const reminders = this.getReminders();
    
    reminders.forEach(reminder => {
      const reminderKey = `${reminder.id}-${reminder.date}-${reminder.time}`;
      
      // Check if reminder is due (within 1 minute of the scheduled time)
      if (this.isReminderDue(reminder, currentDate, currentTime) && 
          !this.lastCheckedReminders.has(reminderKey)) {
        
        this.triggerReminder(reminder);
        this.lastCheckedReminders.add(reminderKey);
        
        // Remove from checked set after 5 minutes to allow re-triggering
        setTimeout(() => {
          this.lastCheckedReminders.delete(reminderKey);
        }, 300000); // 5 minutes
      }
    });
  }

  private isReminderDue(reminder: Reminder, currentDate: string, currentTime: string): boolean {
    // Check if it's the right date
    if (reminder.date !== currentDate) {
      return false;
    }

    // Check if it's the right time (within 1 minute)
    const reminderTime = new Date(`2000-01-01T${reminder.time}:00`);
    const currentTimeObj = new Date(`2000-01-01T${currentTime}:00`);
    const diffMinutes = Math.abs(currentTimeObj.getTime() - reminderTime.getTime()) / (1000 * 60);

    return diffMinutes <= 1; // Within 1 minute
  }

  private async triggerReminder(reminder: Reminder): Promise<void> {
    try {
      console.log(`Triggering reminder: ${reminder.title} at ${reminder.time}`);
      
      // Speak the reminder in English (default)
      await textToSpeech.speakReminder({
        title: reminder.title,
        description: reminder.description,
        time: reminder.time
      }, 'english');

      // You could also show a browser notification here
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reminder', {
          body: `${reminder.title} - ${reminder.description || ''}`,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Failed to trigger reminder:', error);
    }
  }

  public testReminderWithVoice(reminder: Reminder, voiceName: string, language: 'english' | 'hindi' = 'english'): Promise<void> {
    return this.triggerReminderWithVoice(reminder, voiceName, language);
  }

  private async triggerReminderWithVoice(reminder: Reminder, voiceName: string, language: 'english' | 'hindi' = 'english'): Promise<void> {
    try {
      console.log(`Triggering reminder with voice ${voiceName} in ${language}: ${reminder.title} at ${reminder.time}`);
      
      let speechText: string;
      if (language === 'hindi') {
        // Use Hindi translation
        speechText = textToSpeech.translateToHindi(reminder.title, reminder.description, this.formatTimeForSpeech(reminder.time));
      } else {
        // Use English
        const timeText = this.formatTimeForSpeech(reminder.time);
        const descriptionText = reminder.description ? ` ${reminder.description}` : '';
        speechText = `It is ${timeText}, time to ${reminder.title.toLowerCase()}.${descriptionText}`;
      }
      
      await textToSpeech.speakWithVoice(speechText, voiceName, {
        rate: 0.85,
        pitch: 1.05
      });

      // You could also show a browser notification here
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reminder', {
          body: `${reminder.title} - ${reminder.description || ''}`,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Failed to trigger reminder:', error);
    }
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

  private getReminders(): Reminder[] {
    // This should be replaced with actual data source
    // For now, we'll use a callback approach
    if (this.getRemindersCallback) {
      return this.getRemindersCallback();
    }
    return [];
  }

  private getRemindersCallback: (() => Reminder[]) | null = null;

  public setRemindersCallback(callback: () => Reminder[]): void {
    this.getRemindersCallback = callback;
  }

  public testReminder(reminder: Reminder): Promise<void> {
    return this.triggerReminder(reminder);
  }

  public requestNotificationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!('Notification' in window)) {
        resolve(false);
        return;
      }

      if (Notification.permission === 'granted') {
        resolve(true);
        return;
      }

      if (Notification.permission === 'denied') {
        resolve(false);
        return;
      }

      Notification.requestPermission().then((permission) => {
        resolve(permission === 'granted');
      });
    });
  }
}

// Create a singleton instance
export const reminderNotification = new ReminderNotificationService(); 