import { UI } from "./UI";
import { PageFlip } from "../PageFlip";
/**
 * UI for canvas mode
 */
export declare class CanvasUI extends UI {
    private readonly canvas;
    constructor(inBlock: HTMLElement, app: PageFlip);
    private resizeCanvas;
    /**
     * Get canvas element
     */
    getCanvas(): HTMLCanvasElement;
    update(): void;
}
