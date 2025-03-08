import type { PageRect, Point } from './BasicTypes';
import { Flip } from './Flip/Flip';
import { FlipCorner, FlippingState } from './BasicTypes';
import { Orientation } from './Settings';
import { EventObject } from './Event/EventObject';
import type { FlipSetting } from './Settings';
import type { IPageCollection, IUI, IApp, IPage, IRender } from './BasicInterfaces';
import './Style/stPageFlip.css';
/**
 * Class representing a main PageFlip object
 *
 * @extends EventObject
 */
export declare class PageFlip extends EventObject implements IApp {
    private mousePosition;
    private isUserTouch;
    private isUserMove;
    private setting;
    private readonly block;
    private pages;
    private flipController;
    private render;
    private ui;
    /**
     * Create a new PageFlip instance
     *
     * @constructor
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {Object} setting - Configuration object
     */
    constructor(inBlock: HTMLElement, setting: Partial<FlipSetting>);
    setSettings(settings: FlipSetting): void;
    /**
     * Destructor. Remove a root HTML element and all event handlers
     */
    destroy(): void;
    /**
     * Update the render area. Re-show current page.
     */
    update(): void;
    /**
     * Load pages from images on the Canvas mode
     *
     * @param {string[]} imagesHref - List of paths to images
     */
    loadFromImages(imagesHref: string[]): void;
    /**
     * Load pages from HTML elements on the HTML mode
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    /**
     * Update current pages from images
     *
     * @param {string[]} imagesHref - List of paths to images
     */
    updateFromImages(imagesHref: string[]): void;
    /**
     * Update current pages from HTML
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    /**
     * Clear pages from HTML (remove to initinalState)
     */
    clear(): void;
    /**
     * Turn to the previous page (without animation)
     */
    turnToPrevPage(): void;
    /**
     * Turn to the next page (without animation)
     */
    turnToNextPage(): void;
    /**
     * Turn to the specified page number (without animation)
     *
     * @param {number} page - New page number
     */
    turnToPage(page: number): void;
    /**
     * Turn to the next page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flipNext(corner?: FlipCorner): void;
    /**
     * Turn to the prev page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flipPrev(corner?: FlipCorner): void;
    /**
     * Turn to the specified page number (with animation)
     *
     * @param {number} page - New page number
     * @param {FlipCorner} corner - Active page corner when turning
     */
    flip(page: number, corner?: FlipCorner): void;
    /**
     * Call a state change event trigger
     *
     * @param {FlippingState} newState - New  state of the object
     */
    updateState(newState: FlippingState): void;
    /**
     * Call a page number change event trigger
     *
     * @param {number} newPage - New page Number
     */
    updatePageIndex(newPage: number): void;
    /**
     * Call a page orientation change event trigger. Update UI and rendering area
     *
     * @param {Orientation} newOrientation - New page orientation (portrait, landscape)
     */
    updateOrientation(newOrientation: Orientation): void;
    /**
     * Get the total number of pages in a book
     *
     * @returns {number}
     */
    getPageCount(): number;
    /**
     * Get the index of the current page in the page list (starts at 0)
     *
     * @returns {number}
     */
    getCurrentPageIndex(): number;
    /**
     * Get page from collection by number
     *
     * @param {number} pageIndex
     * @returns {Page}
     */
    getPage(pageIndex: number): IPage;
    /**
     * Get the current rendering object
     *
     * @returns {Render}
     */
    getRender(): IRender;
    /**
     * Get current object responsible for flipping
     *
     * @returns {Flip}
     */
    getFlipController(): Flip;
    /**
     * Get current page orientation
     *
     * @returns {Orientation} Сurrent orientation: portrait or landscape
     */
    getOrientation(): Orientation;
    /**
     * Get current book sizes and position
     *
     * @returns {PageRect}
     */
    getBoundsRect(): PageRect;
    /**
     * Get configuration object
     *
     * @returns {FlipSetting}
     */
    getSettings(): FlipSetting;
    /**
     * Get UI object
     *
     * @returns {UI}
     */
    getUI(): IUI;
    /**
     * Get current flipping state
     *
     * @returns {FlippingState}
     */
    getState(): FlippingState;
    /**
     * Get page collection
     *
     * @returns {PageCollection}
     */
    getPageCollection(): IPageCollection;
    /**
     * Start page turning. Called when a user clicks or touches
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     */
    startUserTouch(pos: Point): void;
    /**
     * Called when a finger / mouse moves
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     * @param {boolean} isTouch - True if there was a touch event, not a mouse click
     */
    userMove(pos: Point, isTouch: boolean): void;
    /**
     * Сalled when the user has stopped touching
     *
     * @param {Point} pos - Touch end position in coordinates relative to the book
     * @param {boolean} isSwipe - true if there was a mobile swipe event
     */
    userStop(pos: Point, isSwipe?: boolean): void;
}
