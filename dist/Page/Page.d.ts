import { PageDensity, PageOrientation } from '../BasicTypes';
import type { PageState, Point } from '../BasicTypes';
import type { IPage } from '../BasicInterfaces';
import type { IRender } from '../BasicInterfaces';
/**
 * Class representing a book page
 */
export declare abstract class Page implements IPage {
    /** State of the page on the basis of which rendering */
    protected state: PageState;
    /** Render object */
    protected render: IRender;
    /** Page Orientation */
    protected orientation: PageOrientation;
    /** Density at creation */
    protected createdDensity: PageDensity;
    /** Density at the time of rendering (Depends on neighboring pages) */
    protected nowDrawingDensity: PageDensity;
    protected constructor(render: IRender, density: PageDensity);
    /**
     * Render static page
     *
     * @param {PageOrientation} orient - Static page orientation
     */
    abstract simpleDraw(orient: PageOrientation): void;
    /**
     * Render dynamic page, using state
     *
     * @param {PageDensity} tempDensity - Density at the time of rendering
     */
    abstract draw(tempDensity: PageDensity | null): void;
    /**
     * Page loading
     */
    abstract load(): void;
    /**
     * Set a constant page density
     *
     * @param {PageDensity} density
     */
    setDensity(density: PageDensity): void;
    /**
     * Set temp page density to next render
     *
     * @param {PageDensity}  density
     */
    setDrawingDensity(density: PageDensity): void;
    /**
     * Set page position
     *
     * @param {Point} pagePos
     */
    setPosition(pagePos: Point): void;
    /**
     * Set page angle
     *
     * @param {number} angle
     */
    setAngle(angle: number): void;
    /**
     * Set page crop area
     *
     * @param {Point[]} area
     */
    setArea(area: Point[]): void;
    /**
     * Rotate angle for hard pages to next render
     *
     * @param {number} angle
     */
    setHardDrawingAngle(angle: number): void;
    /**
     * Rotate angle for hard pages
     *
     * @param {number} angle
     */
    setHardAngle(angle: number): void;
    /**
     * Set page orientation
     *
     * @param {PageOrientation} orientation
     */
    setOrientation(orientation: PageOrientation): void;
    /**
     * Get temp page density
     */
    getDrawingDensity(): PageDensity;
    /**
     * Get a constant page density
     */
    getDensity(): PageDensity;
    /**
     * Get rotate angle for hard pages
     */
    getHardAngle(): number;
    abstract newTemporaryCopy(): Page;
    abstract getTemporaryCopy(): Page;
    abstract hideTemporaryCopy(): void;
}
