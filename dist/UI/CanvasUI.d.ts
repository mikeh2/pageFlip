import { UI } from "./UI";
import type { IApp } from "../BasicInterfaces";
/**
 * UI for canvas mode
 */
export declare class CanvasUI extends UI {
    private readonly canvas;
    constructor(inBlock: HTMLElement, app: IApp);
    private resizeCanvas;
    clear(): void;
    /**
     * Get canvas element
     */
    getCanvas(): HTMLCanvasElement;
    update(): void;
}
