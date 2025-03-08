import { Orientation } from '../Settings';
import { IUI, IApp } from '../BasicInterfaces';
/**
 * UI Class, represents work with DOM
 */
export declare abstract class UI implements IUI {
    protected readonly parentElement: HTMLElement;
    protected readonly app: IApp;
    protected readonly wrapper: HTMLElement;
    protected distElement: HTMLElement;
    private touchPoint;
    private readonly swipeTimeout;
    private readonly swipeDistance;
    private onResize;
    /**
     * @constructor
     *
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {PageFlip} app - PageFlip instanse
     * @param {FlipSetting} setting - Configuration object
     */
    protected constructor(inBlock: HTMLElement, app: IApp);
    /**
     * Destructor. Remove all HTML elements and all event handlers
     */
    destroy(): void;
    /**
     * Updating child components when resizing
     */
    abstract update(): void;
    abstract clear(): void;
    /**
     * Get parent element for book
     *
     * @returns {HTMLElement}
     */
    getDistElement(): HTMLElement;
    /**
     * Get wrapper element
     *
     * @returns {HTMLElement}
     */
    getWrapper(): HTMLElement;
    /**
     * Updates styles and sizes based on book orientation
     *
     * @param {Orientation} orientation - New book orientation
     */
    setOrientationStyle(orientation: Orientation): void;
    removeHandlers(): void;
    setHandlers(): void;
    /**
     * Convert global coordinates to relative book coordinates
     *
     * @param x
     * @param y
     */
    private getMousePos;
    private checkTarget;
    private onMouseDown;
    private onTouchStart;
    private onMouseUp;
    private onMouseMove;
    private onTouchMove;
    private onTouchEnd;
}
