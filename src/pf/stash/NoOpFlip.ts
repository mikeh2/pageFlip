/*
export class NoOpFlip {
    private readonly render: Render;
    private readonly app: PageFlip;
    private calc: FlipCalculation = null;
    private state: FlippingState = FlippingState.READ;
    constructor(render: Render, app: PageFlip) {
        this.render = render;
        this.app = app;
    }

    public fold(globalPos: Point): void { }
    public flip(globalPos: Point): void { }
    public start(globalPos: Point): boolean { }
    public flipToPage(page: number, corner: FlipCorner): void { }
    public flipNext(corner: FlipCorner): void { }
    public flipPrev(corner: FlipCorner): void { }
    public stopMove(): void { }
    public showCorner(globalPos: Point): void { }
    public getCalculation(): FlipCalculation {
        return this.calc;
    }
    public getState(): FlippingState {
        return this.state;
    }
}
*/