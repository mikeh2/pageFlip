import { ImagePageCollection } from './Collection/ImagePageCollection';
import { HTMLPageCollection } from './Collection/HTMLPageCollection';
import type { PageRect, Point } from './BasicTypes';
import { Flip } from './Flip/Flip';
import { FlipCorner, FlippingState } from './BasicTypes';
import { Orientation } from './Settings';
import { CanvasRender } from './Render/CanvasRender';
import { HTMLUI } from './UI/HTMLUI';
import { CanvasUI } from './UI/CanvasUI';
import { Helper } from './Helper';
import { EventObject } from './Event/EventObject';
import { HTMLRender } from './Render/HTMLRender';
import type { FlipSetting} from './Settings';
import { Settings, ClickFlipType } from './Settings';

// import { PageCollection } from './Collection/PageCollection';
// import { UI } from './UI/UI';
// import { Page } from './Page/Page';
//import { Render } from './Render/Render';

import type {IPageCollection, IUI, IApp, IPage, IRender} from './BasicInterfaces';
import { NoOpRender, NoOpUI, NoOpPageCollection } from './BasicInterfaces';
import { zeroPoint } from './BasicInterfaces';

import './Style/stPageFlip.css';

/**
 * Class representing a main PageFlip object
 *
 * @extends EventObject
 */
export class PageFlip extends EventObject implements IApp {

    private mousePosition: Point = zeroPoint;
    private isUserTouch = false;
    private isUserMove = false;

    private setting: FlipSetting;
    private readonly block: HTMLElement; // Root HTML Element

    private pages: IPageCollection  = new NoOpPageCollection();
    private flipController: Flip | null  = null;
    private render: IRender = new NoOpRender();

    private ui: IUI = new NoOpUI();

    /**
     * Create a new PageFlip instance
     *
     * @constructor
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {Object} setting - Configuration object
     */
    constructor(inBlock: HTMLElement, setting: Partial<FlipSetting>) {
        super();

        this.setting = new Settings().getSettings(setting);
        this.block = inBlock;
    }

    public setSettings(settings:FlipSetting) {
        this.ui.removeHandlers()
        this.setting = settings
        this.ui.setHandlers()
    }

    /**
     * Destructor. Remove a root HTML element and all event handlers
     */
    public destroy(): void {
        this.ui.destroy();
        this.block.remove();
    }

    /**
     * Update the render area. Re-show current page.
     */
    public update(): void {
        this.render.update();
        if (this.pages){
            this.pages.show(null);
        }
    }

    /**
     * Load pages from images on the Canvas mode
     *
     * @param {string[]} imagesHref - List of paths to images
     */
    public loadFromImages(imagesHref: string[]): void {
        this.ui = new CanvasUI(this.block, this);

        const canvas = (this.ui as CanvasUI).getCanvas();
        this.render = new CanvasRender(this, canvas);

        this.flipController = new Flip(this.render, this);

        this.pages = new ImagePageCollection(this, this.render, imagesHref);
        this.pages.load();

        this.render.start();

        this.pages.show(this.getSettings().startPage);

        // safari fix
        setTimeout(() => {
            this.ui.update();
            this.trigger('init', this, {
                page: this.getSettings().startPage,
                mode: this.render.getOrientation(),
            });
        }, 1);
    }

    /**
     * Load pages from HTML elements on the HTML mode
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    public loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
        this.ui = new HTMLUI(this.block, this, items);
        let distElement = this.ui.getDistElement();
        if (distElement === null) {
            throw new Error('Element not found');
        }

        this.render = new HTMLRender(this, distElement);

        this.flipController = new Flip(this.render, this);

        this.pages = new HTMLPageCollection(this, this.render, distElement, items);
        this.pages.load();

        this.render.start();

        this.pages.show(this.getSettings().startPage);

        // safari fix
        setTimeout(() => {
            this.ui.update();
            this.trigger('init', this, {
                page: this.getSettings().startPage,
                mode: this.render.getOrientation(),
            });
        }, 1);
    }

    /**
     * Update current pages from images
     *
     * @param {string[]} imagesHref - List of paths to images
     */
    public updateFromImages(imagesHref: string[]): void {

        if (!this.pages || 
            this.pages.getCurrentPageIndex() === -1 ||
            this.render === null)
        {
            return
        }
        const current = this.pages.getCurrentPageIndex();

        this.pages.destroy();
        this.pages = new ImagePageCollection(this, this.render, imagesHref);
        this.pages.load();

        this.pages.show(current);
        this.trigger('update', this, {
            page: current,
            mode: this.render.getOrientation(),
        });
    }

    /**
     * Update current pages from HTML
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    public updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void {

        let distElement = this.ui.getDistElement();
        if (!this.pages || 
            this.pages.getCurrentPageIndex() === -1 ||
            this.render === null || 
            distElement === null)
        {
            console.error('Error updateFromHtml')
            return
        }

        const current = this.pages.getCurrentPageIndex();

        this.pages.destroy();
        this.pages = new HTMLPageCollection(this, this.render, distElement, items);
        this.pages.load();
        (this.ui as HTMLUI).updateItems(items);
        this.render.reload();

        this.pages.show(current);
        this.trigger('update', this, {
            page: current,
            mode: this.render.getOrientation(),
        });
    }

    /**
     * Clear pages from HTML (remove to initinalState)
     */
    public clear(): void {
        if (!this.pages) return;
        this.pages.destroy();
        (this.ui as HTMLUI).clear();
    }

    /**
     * Turn to the previous page (without animation)
     */
    public turnToPrevPage(): void {
        if (! this.pages) return;
        this.pages.showPrev();
    }

    /**
     * Turn to the next page (without animation)
     */
    public turnToNextPage(): void {
        if (! this.pages) return;
        this.pages.showNext();
    }

    /**
     * Turn to the specified page number (without animation)
     *
     * @param {number} page - New page number
     */
    public turnToPage(page: number): void {
        if (! this.pages) return;
        this.pages.show(page);
    }

    /**
     * Turn to the next page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipNext(corner: FlipCorner = FlipCorner.TOP): void {
        if (! this.flipController) return;
        this.flipController.flipNext(corner);
    }

    /**
     * Turn to the prev page (with animation)
     *
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipPrev(corner: FlipCorner = FlipCorner.TOP): void {
        if (! this.flipController) return;
        this.flipController.flipPrev(corner);
    }

    /**
     * Turn to the specified page number (with animation)
     *
     * @param {number} page - New page number
     * @param {FlipCorner} corner - Active page corner when turning
     */
    public flipToPage(page: number, corner: FlipCorner = FlipCorner.TOP): void {
        if (! this.flipController) return;
        this.flipController.flipToPage(page, corner);
    }

    /**
     * Call a state change event trigger
     *
     * @param {FlippingState} newState - New  state of the object
     */
    public updateState(newState: FlippingState): void {
        this.trigger('changeState', this, newState);
    }

    /**
     * Call a page number change event trigger
     *
     * @param {number} newPage - New page Number
     */
    public updatePageIndex(newPage: number): void {
        this.trigger('flip', this, newPage);
    }

    /**
     * Call a page orientation change event trigger. Update UI and rendering area
     *
     * @param {Orientation} newOrientation - New page orientation (portrait, landscape)
     */
    public updateOrientation(newOrientation: Orientation): void {
        this.ui.setOrientationStyle(newOrientation);
        this.update();
        this.trigger('changeOrientation', this, newOrientation);
    }

    /**
     * Get the total number of pages in a book
     *
     * @returns {number}
     */
    public getPageCount(): number {
        if (!this.pages) return 0;
        return this.pages.getPageCount();
    }

    /**
     * Get the index of the current page in the page list (starts at 0)
     *
     * @returns {number}
     */
    public getCurrentPageIndex(): number {
        if (!this.pages) return 0;
        return this.pages.getCurrentPageIndex();
    }

    /**
     * Get page from collection by number
     *
     * @param {number} pageIndex
     * @returns {Page}
     */
    public getPage(pageIndex: number): IPage | null {
        if (!this.pages) return null;
        return this.pages.getPage(pageIndex);
    }

    /**
     * Get the current rendering object
     *
     * @returns {Render}
     */
    public getRender(): IRender {
        return this.render;
    }

    /**
     * Get current object responsible for flipping
     *
     * @returns {Flip}
     */
    public getFlipController(): Flip | null {
        return this.flipController;
    }

    /**
     * Get current page orientation
     *
     * @returns {Orientation} Сurrent orientation: portrait or landscape
     */
    public getOrientation(): Orientation {
        return this.render.getOrientation();
    }

    /**
     * Get current book sizes and position
     *
     * @returns {PageRect}
     */
    public getBoundsRect(): PageRect {
        return this.render.getRect();
    }

    /**
     * Get configuration object
     *
     * @returns {FlipSetting}
     */
    public getSettings(): FlipSetting {
        return this.setting;
    }

    /**
     * Get UI object
     *
     * @returns {UI}
     */
    public getUI(): IUI {
        return this.ui;
    }

    /**
     * Get current flipping state
     *
     * @returns {FlippingState}
     */
    public getState(): FlippingState {
        if (!this.flipController) return FlippingState.READ
        return this.flipController.getState();
    }

    /**
     * Get page collection
     *
     * @returns {PageCollection}
     */
    public getPageCollection(): IPageCollection {
        return this.pages;
    }

    /**
     * Start page turning. Called when a user clicks or touches
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     */
    public startUserTouch(pos: Point): void {
        this.mousePosition = pos; // Save touch position
        this.isUserTouch = true;
        this.isUserMove = false;
    }

    /**
     * Called when a finger / mouse moves
     *
     * @param {Point} pos - Touch position in coordinates relative to the book
     * @param {boolean} isTouch - True if there was a touch event, not a mouse click
     */
    public userMove(pos: Point, isTouch: boolean): void {

        if (! this.flipController) return;

        // let margin = 10
        // let w = this.getSettings().width + margin;
        // let h = this.getSettings().height + margin;
        // if (pos.x < -margin || pos.x > w || pos.y < -margin || pos.y > h) return;
        
        if (!this.isUserTouch && !isTouch && this.getSettings().showPageCorners) {
            this.flipController.showCorner(pos); // fold Page Corner
        } else if (this.isUserTouch) {
            if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                this.isUserMove = true;
                this.flipController.fold(pos);
            }
        }
    }

    /**
     * Сalled when the user has stopped touching
     *
     * @param {Point} pos - Touch end position in coordinates relative to the book
     * @param {boolean} isSwipe - true if there was a mobile swipe event
     */
    public userStop(pos: Point, isSwipe = false): void {

        if (! this.flipController) return;

        if (this.isUserTouch) {
            this.isUserTouch = false;

            if (!isSwipe) {
                if (!this.isUserMove) {
                    console.log('user stop flip')
                    this.flipController.flip(pos);
                } 
                else {
                    this.flipController.stopMove();
                }
            }
        }
    }
}
