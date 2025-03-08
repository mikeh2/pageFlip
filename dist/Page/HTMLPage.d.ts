import { Page } from './Page';
import { PageDensity, PageOrientation } from '../BasicTypes';
import type { IRender } from '../BasicInterfaces';
/**
 * Class representing a book page as a HTML Element
 */
export declare class HTMLPage extends Page {
    private readonly element;
    private copiedElement;
    private temporaryCopy;
    private isLoad;
    constructor(render: IRender, element: HTMLElement, density: PageDensity);
    newTemporaryCopy(): Page;
    getTemporaryCopy(): Page;
    hideTemporaryCopy(): void;
    draw(tempDensity: PageDensity | null): void;
    private drawHard;
    private drawSoft;
    simpleDraw(orient: PageOrientation): void;
    getElement(): HTMLElement;
    load(): void;
    setOrientation(orientation: PageOrientation): void;
    setDrawingDensity(density: PageDensity): void;
}
