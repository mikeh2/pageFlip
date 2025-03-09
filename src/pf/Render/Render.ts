import type { Point, PageRect, RectPoints } from '../BasicTypes';
import { FlipDirection } from '../BasicTypes';
// import { Page } from '../Page/Page';
// import { PageFlip } from '../PageFlip';
import { PageOrientation } from '../BasicTypes';
import { Orientation, type FlipSetting} from '../Settings';

import type { IApp, IRender, IPage } from '../BasicInterfaces';

type FrameAction = () => void;
type AnimationSuccessAction = () => void;

/**
 * Type describing calculated values for drop shadows
 */
type Shadow = {
    /** Shadow Position Start Point */
    pos: Point;
    /** The angle of the shadows relative to the book */
    angle: number;
    /** Base width shadow */
    width: number;
    /** Base shadow opacity */
    opacity: number;
    /** Flipping Direction, the direction of the shadow gradients */
    direction: FlipDirection;
    /** Flipping progress in percent (0 - 100) */
    progress: number;
};
const emptyShadow: Shadow = {
    pos: { x: 0, y: 0 },
    angle: 0,
    width: 0,
    opacity: 0,
    direction: FlipDirection.FORWARD,
    progress: 100,
};

/**
 * Type describing the animation process
 * Only one animation process can be started at a same time
 */
type AnimationProcess = {
    /** List of frames in playback order. Each frame is a function. */
    frames: FrameAction[];
    /** Total animation duration */
    duration: number;
    /** Animation duration of one frame */
    durationFrame: number;
    /** Сallback at the end of the animation */
    onAnimateEnd: AnimationSuccessAction;
    /** Animation start time (Global Timer) */
    startedAt: number;
};

/**
 * Class responsible for rendering the book
 */
export abstract class Render implements IRender {
    protected readonly app: IApp;

    /** Left static book page */
    protected leftPage: IPage | null = null;
    /** Right static book page */
    protected rightPage: IPage | null = null;

    /** Page currently flipping */
    protected flippingPage: IPage | null = null;
    /** Next page at the time of flipping */
    protected bottomPage: IPage  | null= null;

    /** Current flipping direction */
    protected direction: FlipDirection = FlipDirection.FORWARD;
    /** Current book orientation */
    protected orientation: Orientation = Orientation.LANDSCAPE;
    /** Сurrent state of the shadows */
    protected shadow: Shadow = emptyShadow;
    /** Сurrent animation process */
    protected animation: AnimationProcess  | null= null;
    /** Page borders while flipping */
    protected pageRect: RectPoints  = { topLeft: { x: 0, y: 0 }, topRight: { x: 0, y: 0 }, bottomLeft: { x: 0, y: 0 }, bottomRight: { x: 0, y: 0 } };
    /** Current book area */
    private boundsRect: PageRect = { pageWidth: 0, width: 0, height: 0, top: 0, left: 0 };

    /** Timer started from start of rendering */
    protected timer = 0;

    /**
     * Safari browser definitions for resolving a bug with a css property clip-area
     *
     * https://bugs.webkit.org/show_bug.cgi?id=126207
     */
    private safari = false;

    protected constructor(app: IApp) {
        this.app = app;

        // detect safari
        const regex = new RegExp('Version\\/[\\d\\.]+.*Safari/');
        this.safari = regex.exec(window.navigator.userAgent) !== null;
    }

    /**
     * Rendering action on each requestAnimationFrame call. The entire rendering process is performed only in this method
     */
    protected abstract drawFrame(): void;

    /**
     * Reload the render area, after update pages
     */
    public abstract reload(): void;

    /**
     * Executed when requestAnimationFrame is called. Performs the current animation process and call drawFrame()
     *
     * @param timer
     */
    private render(timer: number): void {
        if (this.animation !== null) {
            // Find current frame of animation
            const frameIndex = Math.round(
                (timer - this.animation.startedAt) / this.animation.durationFrame
            );

            if (frameIndex < this.animation.frames.length) {
                this.animation.frames[frameIndex]();
            } else {
                this.animation.onAnimateEnd();
                this.animation = null;
            }
        }

        this.timer = timer;
        this.drawFrame();
    }

    /**
     * Running requestAnimationFrame, and rendering process
     */
    public start(): void {
        this.update();

        const loop = (timer: number): void => {
            this.render(timer);
            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    /**
     * Start a new animation process
     *
     * @param {FrameAction[]} frames - Frame list
     * @param {number} duration - total animation duration
     * @param {AnimationSuccessAction} onAnimateEnd - Animation callback function
     */
    public startAnimation(
        frames: FrameAction[],
        duration: number,
        onAnimateEnd: AnimationSuccessAction
    ): void {
        this.finishAnimation(); // finish the previous animation process

        this.animation = {
            frames,
            duration,
            durationFrame: duration / frames.length,
            onAnimateEnd,
            startedAt: this.timer,
        };
    }

    /**
     * End the current animation process and call the callback
     */
    public finishAnimation(): void {
        if (this.animation !== null) {
            this.animation.frames[this.animation.frames.length - 1]();

            if (this.animation.onAnimateEnd !== null) {
                this.animation.onAnimateEnd();
            }
        }

        this.animation = null;
    }

    /**
     * Recalculate the size of the displayed area, and update the page orientation
     */
    public update(): void {
        const orientation = this.calculateBoundsRect();

        if (this.orientation !== orientation) {
            this.orientation = orientation;
            this.app.updateOrientation(orientation);
        }
    }

    /**
     * Calculate the size and position of the book depending on the parent element and configuration parameters
     */
    private calculateBoundsRect(): Orientation {

        // parent element (stf__block)
        let wrapper = this.app.getUI().getDistElement();
        const blockWidth = this.getBlockWidth();
        const blockHeight = this.getBlockHeight();
        const middlePoint: Point = {
            x: blockWidth / 2,
            y: blockHeight / 2,
        };
        // effect-wise, a 0 margin is best
        let margin = 0;
        let w = this.app.getSettings().width;
        let h = this.app.getSettings().height;

        // portrait mode
        // this is needed for offscreen rendering
        let canvas_width = w * 2;

        let orientation = this.app.getSettings().orientation; 
        let pw = w - margin*2;
        let ph = h - margin*2;
        let left = -w + margin*2; 

        if (orientation === Orientation.LANDSCAPE) {
            pw = w/2 - margin*2;
            left = margin*2 
            canvas_width = w;
        }else{  
            left = middlePoint.x - pw / 2 - pw
        }
        this.boundsRect = {
            left:left,
            top: margin,
            width: canvas_width,
            height:h-margin*2,
            pageWidth: pw,
        };

        return orientation;
    }

    /**
     * Set the current parameters of the drop shadow
     *
     * @param {Point} pos - Shadow Position Start Point
     * @param {number} angle - The angle of the shadows relative to the book
     * @param {number} progress - Flipping progress in percent (0 - 100)
     * @param {FlipDirection} direction - Flipping Direction, the direction of the shadow gradients
     */
    public setShadowData(
        pos: Point,
        angle: number,
        progress: number,
        direction: FlipDirection
    ): void {
        if (!this.app.getSettings().drawShadow) return;

        const maxShadowOpacity = 100 * this.getSettings().maxShadowOpacity;

        this.shadow = {
            pos,
            angle,
            width: (((this.getRect().pageWidth * 3) / 4) * progress) / 100,
            opacity: ((100 - progress) * maxShadowOpacity) / 100 / 100,
            direction,
            progress: progress * 2,
        };
    }

    /**
     * Clear shadow
     */
    public clearShadow(): void {
        this.shadow = emptyShadow;
    }

    /**
     * Get parent block offset width
     */
    public getBlockWidth(): number {
        let ele:HTMLElement | null = this.app.getUI().getDistElement();
        if (ele === null) return 0;
        return ele.offsetWidth;
    }

    /**
     * Get parent block offset height
     */
    public getBlockHeight(): number {
        let ele:HTMLElement | null = this.app.getUI().getDistElement();
        if (ele === null) return 0;
        return ele.offsetHeight;
    }

    /**
     * Get current flipping direction
     */
    public getDirection(): FlipDirection {
        return this.direction;
    }

    /**
     * Сurrent size and position of the book
     */
    public getRect(): PageRect {

        if (this.boundsRect === null) {
           // side effect of calculating boundsRect
           let orientation = this.calculateBoundsRect();
        } 
        if (this.boundsRect === null) {
            return { pageWidth: 0, width: 0, height: 0, top: 0, left: 0 };
        }
        return this.boundsRect;
    }

    /**
     * Get configuration object
     */
    public getSettings(): FlipSetting {
        return this.app.getSettings();
    }

    /**
     * Get current book orientation
     */
    public getOrientation(): Orientation {
        return this.orientation;
    }

    /**
     * Set page area while flipping
     *
     * @param direction
     */
    public setPageRect(pageRect: RectPoints): void {
        this.pageRect = pageRect;
    }

    /**
     * Set flipping direction
     *
     * @param direction
     */
    public setDirection(direction: FlipDirection): void {
        this.direction = direction;
    }

    /**
     * Set right static book page
     *
     * @param page
     */
    public setRightPage(page: IPage): void {
        if (page !== null) page.setOrientation(PageOrientation.RIGHT);

        this.rightPage = page;
    }

    /**
     * Set left static book page
     * @param page
     */
    public setLeftPage(page: IPage): void {
        if (page !== null) page.setOrientation(PageOrientation.LEFT);

        this.leftPage = page;
    }

    /**
     * Set next page at the time of flipping
     * @param page
     */
    public setBottomPage(page: IPage): void {
        if (page !== null)
            page.setOrientation(
                this.direction === FlipDirection.BACK ? PageOrientation.LEFT : PageOrientation.RIGHT
            );

        this.bottomPage = page;
    }

    /**
     * Set currently flipping page
     *
     * @param page
     */
    public setFlippingPage(page: IPage): void {
        if (page !== null)
            page.setOrientation(
                this.direction === FlipDirection.FORWARD &&
                    this.orientation !== Orientation.PORTRAIT
                    ? PageOrientation.LEFT
                    : PageOrientation.RIGHT
            );

        this.flippingPage = page;
    }

    /**
     * Coordinate conversion function. Window coordinates -> to book coordinates
     *
     * @param {Point} pos - Global coordinates relative to the window
     * @returns {Point} Coordinates relative to the book
     */
    public convertToBook(pos: Point): Point {
        const rect = this.getRect();

        return {
            x: pos.x - rect.left,
            y: pos.y - rect.top,
        };
    }

    public isSafari(): boolean {
        return this.safari;
    }

    /**
     * Coordinate conversion function. Window coordinates -> to current coordinates of the working page
     *
     * @param {Point} pos - Global coordinates relative to the window
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {Point} Coordinates relative to the work page
     */
    public convertToPage(pos: Point, direction?: FlipDirection): Point {

        if (!direction || direction == null) {
            direction = this.direction;
        }

        const rect = this.getRect();
        const x =
            direction === FlipDirection.FORWARD
                ? pos.x - rect.left - rect.width / 2
                : rect.width / 2 - pos.x + rect.left;

        return {
            x,
            y: pos.y - rect.top,
        };
    }

    /**
     * Coordinate conversion function. Coordinates relative to the work page -> Window coordinates
     *
     * @param {Point} pos - Coordinates relative to the work page
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {Point} Global coordinates relative to the window
     */
    public convertToGlobal(pos: Point, direction?: FlipDirection): Point {
        if (!direction) direction = this.direction;

        if (pos == null) return pos;

        const rect = this.getRect();

        const x =
            direction === FlipDirection.FORWARD
                ? pos.x + rect.left + rect.width / 2
                : rect.width / 2 - pos.x + rect.left;

        return {
            x,
            y: pos.y + rect.top,
        };
    }

    /**
     * Casting the coordinates of the corners of the rectangle in the coordinates relative to the window
     *
     * @param {RectPoints} rect - Coordinates of the corners of the rectangle relative to the work page
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {RectPoints} Coordinates of the corners of the rectangle relative to the window
     */
    public convertRectToGlobal(rect: RectPoints, direction?: FlipDirection): RectPoints {
        if (!direction) direction = this.direction;

        return {
            topLeft: this.convertToGlobal(rect.topLeft, direction),
            topRight: this.convertToGlobal(rect.topRight, direction),
            bottomLeft: this.convertToGlobal(rect.bottomLeft, direction),
            bottomRight: this.convertToGlobal(rect.bottomRight, direction),
        };
    }
}
