//import { PageFlip } from '../PageFlip';
import type { IApp } from "../BasicInterfaces";

/**
 * Data type passed to the event handler
 */
export type DataType = number | string | boolean | object;

/**
 * Type of object in event handlers
 */
export interface WidgetEvent {
    data: DataType | null;
    object: IApp;
}

type EventCallback = (e: WidgetEvent) => void;

/**
 * A class implementing a basic event model
 */
export abstract class EventObject {
    private events = new Map<string, EventCallback[]>();

    /**
     * Add new event handler
     *
     * @param {string} eventName
     * @param {EventCallback} callback
     */
    public on(eventName: string, callback: EventCallback): EventObject {
        let eventCallbacks = this.events.get(eventName);

        if (!this.events.has(eventName)) {
            this.events.set(eventName, [callback]);
        } else {
            if (eventCallbacks !== undefined) {
                eventCallbacks.push(callback);
            }
        }

        return this;
    }

    /**
     * Removing all handlers from an event
     *
     * @param {string} event - Event name
     */
    public off(event: string): void {
        this.events.delete(event);
    }

    protected trigger(eventName: string, app: IApp, data: DataType | null = null): void {

        if (!this.events.has(eventName)) return;
        let eventCallbacks = this.events.get(eventName);
        if (eventCallbacks === undefined) return

        for (const callback of eventCallbacks) {
            callback({ data, object: app });
        }
    }
}
