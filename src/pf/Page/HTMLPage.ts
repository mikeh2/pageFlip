import { Page } from './Page';
import { PageDensity, PageOrientation } from '../BasicTypes';
// import { Render } from '../Render/Render';
import { Helper } from '../Helper';
import { FlipDirection } from '../BasicTypes';
import type { Point } from '../BasicTypes';
import type { IRender } from '../BasicInterfaces';

/**
 * Class representing a book page as a HTML Element
 */
export class HTMLPage extends Page {
    private readonly element: HTMLElement;

    private copiedElement: HTMLElement | null = null;
    private temporaryCopy: Page | null = null;

    private isLoad = false;

    constructor(render: IRender, element: HTMLElement, density: PageDensity) {
        super(render, density);

        this.element = element;
        this.element.classList.add('stf__item');
        this.element.classList.add('__' + density);
    }

    public newTemporaryCopy(): Page {
        if (this.nowDrawingDensity === PageDensity.HARD) {
            return this;
        }
        let parent = this.element.parentElement;
        if (parent === null) {
            throw new Error('Element not found');
        }

        if (this.temporaryCopy === null) {
            this.copiedElement = this.element.cloneNode(true) as HTMLElement;
            parent.appendChild(this.copiedElement);

            this.temporaryCopy = new HTMLPage(
                this.render,
                this.copiedElement,
                this.nowDrawingDensity
            );
        }

        let temp = this.getTemporaryCopy(); 
        if (temp === null) {
            console.error('unable create temp');
            return this
        }
        return temp; 
    }

    public getTemporaryCopy(): Page | null {
        return this.temporaryCopy;
    }

    public hideTemporaryCopy(): void {
        if (this.temporaryCopy !== null) {
            if (this.copiedElement !== null) {
                this.copiedElement.remove();
            }
            this.copiedElement = null;
            this.temporaryCopy = null;
        }
    }

    public draw(tempDensity: PageDensity | null): void {
        const density = tempDensity ? tempDensity : this.nowDrawingDensity;

        const pagePos = this.render.convertToGlobal(this.state.position);
        const pageWidth = this.render.getRect().pageWidth;
        const pageHeight = this.render.getRect().height;

        this.element.classList.remove('__simple');

        const commonStyle = `
            display: block;
            z-index: ${this.element.style.zIndex};
            left: 0;
            top: 0;
            width: ${pageWidth}px;
            height: ${pageHeight}px;
        `;

        density === PageDensity.HARD
            ? this.drawHard(commonStyle)
            : this.drawSoft(pagePos, commonStyle);
    }

    private drawHard(commonStyle = ''): void {
        const pos = this.render.getRect().left + this.render.getRect().width / 2;

        const angle = this.state.hardDrawingAngle;

        const newStyle =
            commonStyle +
            `
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                clip-path: none;
                -webkit-clip-path: none;
            ` +
            (this.orientation === PageOrientation.LEFT
                ? `transform-origin: ${this.render.getRect().pageWidth}px 0; 
                   transform: translate3d(0, 0, 0) rotateY(${angle}deg);`
                : `transform-origin: 0 0; 
                   transform: translate3d(${pos}px, 0, 0) rotateY(${angle}deg);`);

        this.element.style.cssText = newStyle;
    }

    private drawSoft(position: Point, commonStyle = ''): void {
        let polygon = 'polygon( ';
        for (const p of this.state.area) {
            if (p !== null) {
                let g =
                    this.render.getDirection() === FlipDirection.BACK
                        ? {
                              x: -p.x + this.state.position.x,
                              y: p.y - this.state.position.y,
                          }
                        : {
                              x: p.x - this.state.position.x,
                              y: p.y - this.state.position.y,
                          };

                g = Helper.GetRotatedPoint(g, { x: 0, y: 0 }, this.state.angle);
                polygon += g.x + 'px ' + g.y + 'px, ';
            }
        }
        polygon = polygon.slice(0, -2);
        polygon += ')';

        const newStyle =
            commonStyle +
            `transform-origin: 0 0; clip-path: ${polygon}; -webkit-clip-path: ${polygon};` +
            (this.render.isSafari() && this.state.angle === 0
                ? `transform: translate(${position.x}px, ${position.y}px);`
                : `transform: translate3d(${position.x}px, ${position.y}px, 0) rotate(${this.state.angle}rad);`);

        this.element.style.cssText = newStyle;
    }

    public simpleDraw(orient: PageOrientation): void {
        const rect = this.render.getRect();

        const pageWidth = rect.pageWidth;
        const pageHeight = rect.height;

        const x = orient === PageOrientation.RIGHT ? rect.left + rect.pageWidth : rect.left;

        const y = rect.top;

        this.element.classList.add('__simple');
        this.element.style.cssText = `
            position: absolute; 
            display: block; 
            height: ${pageHeight}px; 
            left: ${x}px; 
            top: ${y}px; 
            width: ${pageWidth}px; 
            z-index: ${this.render.getSettings().startZIndex + 1};`;
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public load(): void {
        this.isLoad = true;
    }

    public setOrientation(orientation: PageOrientation): void {
        super.setOrientation(orientation);
        this.element.classList.remove('__left', '__right');
        this.element.classList.add(orientation === PageOrientation.RIGHT ? '__right' : '__left');
    }

    public setDrawingDensity(density: PageDensity): void {
        this.element.classList.remove('__soft', '__hard');
        this.element.classList.add('__' + density);

        super.setDrawingDensity(density);
    }
}
