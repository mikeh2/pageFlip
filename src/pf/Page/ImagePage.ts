import { CanvasRender } from '../Render/CanvasRender';
import { PageDensity, PageOrientation } from '../BasicTypes';
import type { Point } from '../BasicTypes';
// import { Render } from '../Render/Render';
import { Page } from './Page';
import type { IRender } from '../BasicInterfaces';

/**
 * Class representing a book page as an image on Canvas
 */
export class ImagePage extends Page {
    private readonly image: HTMLImageElement | null = null;
    private isLoad = false;

    private loadingAngle = 0;

    constructor(render: IRender, href: string, density: PageDensity) {
        super(render, density);

        this.image = new Image();
        this.image.src = href;
    }

    public draw(tempDensity: PageDensity | null): void {

        const ctx = (this.render as CanvasRender).getContext();

        const pagePos = this.render.convertToGlobal(this.state.position);
        const pageWidth = this.render.getRect().pageWidth;
        const pageHeight = this.render.getRect().height;

        if (!ctx) return
        ctx.save();
        ctx.translate(pagePos.x, pagePos.y);
        ctx.beginPath();

        for (let p of this.state.area) {
            if (p !== null) {
                p = this.render.convertToGlobal(p);
                ctx.lineTo(p.x - pagePos.x, p.y - pagePos.y);
            }
        }

        ctx.rotate(this.state.angle);

        ctx.clip();

        if (!this.isLoad) {
            this.drawLoader(ctx, { x: 0, y: 0 }, pageWidth, pageHeight);
        } else {
            if (!this.image) return
            ctx.drawImage(this.image, 0, 0, pageWidth, pageHeight);
        }

        ctx.restore();
    }

    public simpleDraw(orient: PageOrientation): void {
        const rect = this.render.getRect();
        const ctx = (this.render as CanvasRender).getContext();
        

        const pageWidth = rect.pageWidth;
        const pageHeight = rect.height;

        const x = orient === PageOrientation.RIGHT ? rect.left + rect.pageWidth : rect.left;

        const y = rect.top;

        if (!ctx) return
        if (!this.isLoad) {
            this.drawLoader(ctx, { x, y }, pageWidth, pageHeight);
        } else {
            if (!this.image) return
            ctx.drawImage(this.image, x, y, pageWidth, pageHeight);
        }
    }

    private drawLoader(
        ctx: CanvasRenderingContext2D,
        shiftPos: Point,
        pageWidth: number,
        pageHeight: number
    ): void {
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.lineWidth = 1;
        ctx.rect(shiftPos.x + 1, shiftPos.y + 1, pageWidth - 1, pageHeight - 1);
        ctx.stroke();
        ctx.fill();

        const middlePoint: Point = {
            x: shiftPos.x + pageWidth / 2,
            y: shiftPos.y + pageHeight / 2,
        };

        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.arc(
            middlePoint.x,
            middlePoint.y,
            20,
            this.loadingAngle,
            (3 * Math.PI) / 2 + this.loadingAngle
        );
        ctx.stroke();
        ctx.closePath();

        this.loadingAngle += 0.07;
        if (this.loadingAngle >= 2 * Math.PI) {
            this.loadingAngle = 0;
        }
    }

    public load(): void {
        if (!this.image) return
        if (!this.isLoad)
            this.image.onload = (): void => {
                this.isLoad = true;
            };
    }

    public newTemporaryCopy(): Page {
        return this;
    }

    public getTemporaryCopy(): Page {
        return this;
    }

    public hideTemporaryCopy(): void {
        return;
    }
}
