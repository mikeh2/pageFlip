export class Settings {
    _default = {
        startPage: 0,
        width: 0,
        height: 0,
        orientation: "landscape" /* Orientation.LANDSCAPE */,
        drawShadow: true,
        flippingTime: 1000,
        startZIndex: 0,
        maxShadowOpacity: 1,
        showCover: false,
        mobileScrollSupport: true,
        swipeDistance: 30,
        clickEventForward: true,
        showPageCorners: true,
        clickFlipType: 1 /* ClickFlipType.ANYWHERE_ON_PAGE */,
    };
    /**
     * Processing parameters received from the user. Substitution default values
     *
     * @param userSetting
     * @returns {FlipSetting} Сonfiguration object
     */
    getSettings(userSetting) {
        const result = this._default;
        Object.assign(result, userSetting);
        if (result.width <= 0 || result.height <= 0)
            throw new Error('Invalid width or height');
        if (result.flippingTime <= 0)
            throw new Error('Invalid flipping time');
        return result;
    }
}
//# sourceMappingURL=Settings.js.map