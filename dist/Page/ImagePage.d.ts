import { PageDensity, PageOrientation } from '../BasicTypes';
import { Page } from './Page';
import type { IRender } from '../BasicInterfaces';
/**
 * Class representing a book page as an image on Canvas
 */
export declare class ImagePage extends Page {
    private readonly image;
    private isLoad;
    private loadingAngle;
    constructor(render: IRender, href: string, density: PageDensity);
    draw(tempDensity: PageDensity | null): void;
    simpleDraw(orient: PageOrientation): void;
    private drawLoader;
    load(): void;
    newTemporaryCopy(): Page;
    getTemporaryCopy(): Page;
    hideTemporaryCopy(): void;
}
