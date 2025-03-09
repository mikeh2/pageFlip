import { ImagePage } from '../Page/ImagePage';
import { PageCollection } from './PageCollection';
import { PageDensity } from '../BasicTypes';

// import { PageFlip } from '../PageFlip';
// import { Render } from '../Render/Render';
import type {IRender, IApp} from '../BasicInterfaces';

/**
 * Сlass representing a collection of pages as images on the canvas
 */
export class ImagePageCollection extends PageCollection {
    private readonly imagesHref: string[];

    constructor(app: IApp, render: IRender, imagesHref: string[]) {
        super(app, render);

        this.imagesHref = imagesHref;
    }

    public load(): void {
        for (const href of this.imagesHref) {
            const page = new ImagePage(this.render, href, PageDensity.SOFT);

            page.load();
            this.pages.push(page);
        }

        this.createSpread();
    }
}
