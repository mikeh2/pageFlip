import { UI } from "./UI";
/**
 * UI for canvas mode
 */
export class CanvasUI extends UI {
    canvas;
    constructor(inBlock, app) {
        super(inBlock, app);
        this.wrapper.innerHTML = '<canvas class="stf__canvas"></canvas>';
        this.canvas = inBlock.querySelectorAll('canvas')[0];
        this.distElement = this.canvas;
        this.resizeCanvas();
        this.setHandlers();
    }
    resizeCanvas() {
        const cs = getComputedStyle(this.canvas);
        const width = parseInt(cs.getPropertyValue('width'), 10);
        const height = parseInt(cs.getPropertyValue('height'), 10);
        this.canvas.width = width;
        this.canvas.height = height;
    }
    clear() {
        const ctx = this.canvas.getContext('2d');
        if (ctx == null) {
            return;
        }
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }
    update() {
        this.resizeCanvas();
        this.app.getRender().update();
    }
}
//# sourceMappingURL=CanvasUI.js.map