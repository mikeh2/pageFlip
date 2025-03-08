import { PageCollection } from './PageCollection';
import type { IRender, IApp } from '../BasicInterfaces';
/**
 * Сlass representing a collection of pages as images on the canvas
 */
export declare class ImagePageCollection extends PageCollection {
    private readonly imagesHref;
    constructor(app: IApp, render: IRender, imagesHref: string[]);
    load(): void;
}
