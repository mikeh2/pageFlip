import type { Point, PageRect, RectPoints } from '../BasicTypes';
import { FlipDirection } from '../BasicTypes';
import { Orientation, type FlipSetting } from '../Settings';
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
export declare abstract class Render implements IRender {
    protected readonly app: IApp;
    /** Left static book page */
    protected leftPage: IPage;
    /** Right static book page */
    protected rightPage: IPage;
    /** Page currently flipping */
    protected flippingPage: IPage;
    /** Next page at the time of flipping */
    protected bottomPage: IPage;
    /** Current flipping direction */
    protected direction: FlipDirection;
    /** Current book orientation */
    protected orientation: Orientation;
    /** Сurrent state of the shadows */
    protected shadow: Shadow;
    /** Сurrent animation process */
    protected animation: AnimationProcess;
    /** Page borders while flipping */
    protected pageRect: RectPoints;
    /** Current book area */
    private boundsRect;
    /** Timer started from start of rendering */
    protected timer: number;
    /**
     * Safari browser definitions for resolving a bug with a css property clip-area
     *
     * https://bugs.webkit.org/show_bug.cgi?id=126207
     */
    private safari;
    protected constructor(app: IApp);
    /**
     * Rendering action on each requestAnimationFrame call. The entire rendering process is performed only in this method
     */
    protected abstract drawFrame(): void;
    /**
     * Reload the render area, after update pages
     */
    abstract reload(): void;
    /**
     * Executed when requestAnimationFrame is called. Performs the current animation process and call drawFrame()
     *
     * @param timer
     */
    private render;
    /**
     * Running requestAnimationFrame, and rendering process
     */
    start(): void;
    /**
     * Start a new animation process
     *
     * @param {FrameAction[]} frames - Frame list
     * @param {number} duration - total animation duration
     * @param {AnimationSuccessAction} onAnimateEnd - Animation callback function
     */
    startAnimation(frames: FrameAction[], duration: number, onAnimateEnd: AnimationSuccessAction): void;
    /**
     * End the current animation process and call the callback
     */
    finishAnimation(): void;
    /**
     * Recalculate the size of the displayed area, and update the page orientation
     */
    update(): void;
    /**
     * Calculate the size and position of the book depending on the parent element and configuration parameters
     */
    private calculateBoundsRect;
    /**
     * Set the current parameters of the drop shadow
     *
     * @param {Point} pos - Shadow Position Start Point
     * @param {number} angle - The angle of the shadows relative to the book
     * @param {number} progress - Flipping progress in percent (0 - 100)
     * @param {FlipDirection} direction - Flipping Direction, the direction of the shadow gradients
     */
    setShadowData(pos: Point, angle: number, progress: number, direction: FlipDirection): void;
    /**
     * Clear shadow
     */
    clearShadow(): void;
    /**
     * Get parent block offset width
     */
    getBlockWidth(): number;
    /**
     * Get parent block offset height
     */
    getBlockHeight(): number;
    /**
     * Get current flipping direction
     */
    getDirection(): FlipDirection;
    /**
     * Сurrent size and position of the book
     */
    getRect(): PageRect;
    /**
     * Get configuration object
     */
    getSettings(): FlipSetting;
    /**
     * Get current book orientation
     */
    getOrientation(): Orientation;
    /**
     * Set page area while flipping
     *
     * @param direction
     */
    setPageRect(pageRect: RectPoints): void;
    /**
     * Set flipping direction
     *
     * @param direction
     */
    setDirection(direction: FlipDirection): void;
    /**
     * Set right static book page
     *
     * @param page
     */
    setRightPage(page: IPage): void;
    /**
     * Set left static book page
     * @param page
     */
    setLeftPage(page: IPage): void;
    /**
     * Set next page at the time of flipping
     * @param page
     */
    setBottomPage(page: IPage): void;
    /**
     * Set currently flipping page
     *
     * @param page
     */
    setFlippingPage(page: IPage): void;
    /**
     * Coordinate conversion function. Window coordinates -> to book coordinates
     *
     * @param {Point} pos - Global coordinates relative to the window
     * @returns {Point} Coordinates relative to the book
     */
    convertToBook(pos: Point): Point;
    isSafari(): boolean;
    /**
     * Coordinate conversion function. Window coordinates -> to current coordinates of the working page
     *
     * @param {Point} pos - Global coordinates relative to the window
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {Point} Coordinates relative to the work page
     */
    convertToPage(pos: Point, direction?: FlipDirection): Point;
    /**
     * Coordinate conversion function. Coordinates relative to the work page -> Window coordinates
     *
     * @param {Point} pos - Coordinates relative to the work page
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {Point} Global coordinates relative to the window
     */
    convertToGlobal(pos: Point, direction?: FlipDirection): Point;
    /**
     * Casting the coordinates of the corners of the rectangle in the coordinates relative to the window
     *
     * @param {RectPoints} rect - Coordinates of the corners of the rectangle relative to the work page
     * @param {FlipDirection} direction  - Current flipping direction
     *
     * @returns {RectPoints} Coordinates of the corners of the rectangle relative to the window
     */
    convertRectToGlobal(rect: RectPoints, direction?: FlipDirection): RectPoints;
}
export {};
