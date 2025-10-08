import { ScheduledLesson } from './scheduledLessonService';

type EventCallback = (data: any) => void;

class MockWebSocket {
  private listeners: Map<string, EventCallback[]> = new Map();
  private userId: string = `user_${Math.random().toString(36).substr(2, 9)}`;

  constructor() {
    console.log(`Mock WebSocket client initialized for ${this.userId}`);
    this.simulateServerPush();
  }

  // Register an event listener
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  // Unregister an event listener
  off(event: string, callback: EventCallback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      this.listeners.set(event, eventListeners.filter(cb => cb !== callback));
    }
  }

  // Emit an event to the "server"
  emit(event: string, data: any) {
    console.log(`[Socket EMIT] Event: ${event}, Data:`, data);
    // Simulate server processing and broadcasting back to clients
    setTimeout(() => {
      // In a real app, the server would send this back to all clients.
      // Here, we just trigger the client's own listeners.
      const serverResponse = { ...data, version: data.version + 1, lastUpdatedBy: this.userId };
      this.trigger(event, serverResponse);
    }, 500); // Simulate network latency
  }

  // Trigger all callbacks for an event
  private trigger(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      console.log(`[Socket RECEIVE] Event: ${event}, Data:`, data);
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Simulate another user making a change every 15 seconds
  private simulateServerPush() {
    setInterval(() => {
      const randomLessonId = 101 + Math.floor(Math.random() * 4);
      const updatedLesson = {
        id: randomLessonId,
        title: `(Updated by another user) Lesson ${randomLessonId}`,
        status: 'planned',
        version: new Date().getTime(), // Use timestamp as a simple version
        lastUpdatedBy: 'other_user',
      };
      this.trigger('lesson-updated', updatedLesson);
    }, 15000);
  }
}

// Export a singleton instance
export const webSocketService = new MockWebSocket();
