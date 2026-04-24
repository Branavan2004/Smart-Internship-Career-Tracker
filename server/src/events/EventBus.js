/**
 * EventBus — Lightweight in-process domain event system.
 *
 * In production this maps 1:1 onto a message broker (Kafka, RabbitMQ, WSO2 MB):
 *   - publish()  → producer.send()
 *   - subscribe() → consumer.subscribe()
 *
 * The event schema is identical either way, so the transport is swappable
 * without changing business logic.
 */

import { EventEmitter } from "events";
import { logger } from "../config/logger.js";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 200; // exponential backoff: 200, 400, 800 ms

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Dead-letter store — events that failed all retries
    this._deadLetterQueue = [];
    // Audit log — every emitted event, kept for /api/metrics/events
    this._eventLog = [];
    this.setMaxListeners(50);
  }

  /**
   * Publish a domain event.
   * @param {string} eventName  e.g. "application.created"
   * @param {object} payload    domain data attached to the event
   */
  publish(eventName, payload) {
    const envelope = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event: eventName,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    this._eventLog.unshift(envelope);
    if (this._eventLog.length > 200) this._eventLog.pop(); // cap in-memory log

    logger.info({ event: eventName, id: envelope.id }, "EventBus: publishing");
    this.emit(eventName, envelope);
  }

  /**
   * Subscribe a handler to an event.
   * Wraps the handler with retry + dead-letter logic.
   * @param {string}   eventName
   * @param {Function} handler   async (envelope) => void
   */
  subscribe(eventName, handler) {
    const wrappedHandler = async (envelope) => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          await handler(envelope);
          return; // success
        } catch (err) {
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          logger.warn(
            { event: eventName, id: envelope.id, attempt, err: err.message },
            `EventBus: handler failed — retry in ${delay}ms`
          );
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, delay));
          } else {
            // All retries exhausted → dead-letter
            this._deadLetterQueue.unshift({ ...envelope, failedAt: new Date().toISOString(), error: err.message });
            if (this._deadLetterQueue.length > 50) this._deadLetterQueue.pop();
            logger.error(
              { event: eventName, id: envelope.id },
              "EventBus: moved to dead-letter queue after exhausting retries"
            );
          }
        }
      }
    };

    this.on(eventName, wrappedHandler);
    logger.info({ event: eventName }, "EventBus: handler registered");
  }

  /** Returns the audit log (newest first) for /api/metrics/events */
  getEventLog(limit = 100) {
    return this._eventLog.slice(0, limit);
  }

  /** Returns the dead-letter queue */
  getDeadLetters() {
    return this._deadLetterQueue;
  }
}

// Singleton — one bus per process, just like a single broker connection
export const eventBus = new EventBus();
