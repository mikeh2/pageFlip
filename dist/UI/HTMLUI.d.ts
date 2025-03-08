import { UI } from './UI';
import { IApp } from '../BasicInterfaces';
/**
 * UI for HTML mode
 */
export declare class HTMLUI extends UI {
    private items;
    constructor(inBlock: HTMLElement, app: IApp, items: NodeListOf<HTMLElement> | HTMLElement[]);
    clear(): void;
    /**
     * Update page list from HTMLElements
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    updateItems(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    update(): void;
}
