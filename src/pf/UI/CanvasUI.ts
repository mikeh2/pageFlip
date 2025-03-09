import {UI} from "./UI";
// import {PageFlip} from "../PageFlip";
import type {FlipSetting} from "../Settings";
import type { IApp } from "../BasicInterfaces";

/**
 * UI for canvas mode
 */
export class CanvasUI extends UI {
    private readonly canvas: HTMLCanvasElement;

    constructor(inBlock: HTMLElement, app: IApp) {
        super(inBlock, app);

        this.wrapper.innerHTML = '<canvas class="stf__canvas"></canvas>';

        this.canvas = inBlock.querySelectorAll('canvas')[0];

        this.distElement = this.canvas;

        this.resizeCanvas();
        this.setHandlers();
    }

    private resizeCanvas(): void {
        const cs = getComputedStyle(this.canvas);
        const width = parseInt(cs.getPropertyValue('width'), 10);
        const height = parseInt(cs.getPropertyValue('height'), 10);

        this.canvas.width = width;
        this.canvas.height = height;
    }

    public clear(): void {
        const ctx = this.canvas.getContext('2d');
        if (ctx == null) {
            return;
        }
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get canvas element
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public update(): void {
        this.resizeCanvas();
        this.app.getRender().update();
    }
}