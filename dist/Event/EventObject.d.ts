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
export declare abstract class EventObject {
    private events;
    /**
     * Add new event handler
     *
     * @param {string} eventName
     * @param {EventCallback} callback
     */
    on(eventName: string, callback: EventCallback): EventObject;
    /**
     * Removing all handlers from an event
     *
     * @param {string} event - Event name
     */
    off(event: string): void;
    protected trigger(eventName: string, app: IApp, data?: DataType | null): void;
}
export {};
