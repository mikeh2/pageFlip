import { UI } from './UI';
//import { PageFlip } from '../PageFlip';
import type { FlipSetting } from '../Settings';
import { IApp, IUI } from '../BasicInterfaces';

/**
 * UI for HTML mode
 */
export class HTMLUI extends UI {
    private items: NodeListOf<HTMLElement> | HTMLElement[];

    constructor(
        inBlock: HTMLElement,
        app: IApp,
        items: NodeListOf<HTMLElement> | HTMLElement[]
    ) {
        super(inBlock, app);

        // Second wrapper to HTML page
        this.wrapper.insertAdjacentHTML('afterbegin', '<div class="stf__block"></div>');

        let ele:HTMLElement | null = inBlock.querySelector('.stf__block');
        if (ele === null) {
            throw new Error('Element not found');
        }

        this.distElement = ele; 

        this.items = items;
        for (const item of items) {
            this.distElement.appendChild(item);
        }

        this.setHandlers();
    }

    public clear(): void {
        for (const item of this.items) {
            this.parentElement.appendChild(item);
        }
    }

    /**
     * Update page list from HTMLElements
     *
     * @param {(NodeListOf<HTMLElement>|HTMLElement[])} items - List of pages as HTML Element
     */
    public updateItems(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
        this.removeHandlers();

        this.distElement.innerHTML = '';

        for (const item of items) {
            this.distElement.appendChild(item);
        }
        this.items = items;

        this.setHandlers();
    }

    public update(): void {
        this.app.getRender().update();
    }
}
