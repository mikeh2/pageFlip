import { PageCollection } from './PageCollection';
import type { IApp, IRender } from '../BasicInterfaces';
/**
 * Сlass representing a collection of pages as HTML Element
 */
export declare class HTMLPageCollection extends PageCollection {
    private readonly element;
    private readonly pagesElement;
    constructor(app: IApp, render: IRender, element: HTMLElement, items: NodeListOf<HTMLElement> | HTMLElement[]);
    load(): void;
}
