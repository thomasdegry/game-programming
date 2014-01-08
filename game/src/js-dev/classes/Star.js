/* globals TweenMax:true, Linear:true */
var Star = (function () {

    var Star = function (x, y) {
        _.bindAll(this);

        this.x = x;
        this.y = y;

        this.container = new createjs.Container();

        this.starImg = new createjs.Bitmap('img/star.png');
        this.container.addChild(this.starImg);

        this.starImg.x = this.x+30;
        this.starImg.y = this.y;

        TweenMax.to(this.starImg, 3, {bezier:[{x:this.x - 30, y: this.y}, {x:this.x + 30, y:this.y}], ease: Linear.easeNone, repeat:-1});
    };

    Star.prototype.update = function() {
        TweenMax.killTweensOf(this.starImg);
        this.container.removeChild(this.starImg);

        this.starImg = new createjs.Bitmap('img/star.png');
        this.container.addChild(this.starImg);

        this.starImg.x = this.x+30;
        this.starImg.y = this.y;

        TweenMax.to(this.starImg, 3, {bezier:[{x:this.x - 30, y: this.y}, {x:this.x + 30, y:this.y}], ease: Linear.easeNone, repeat:-1});
    };

    return Star;
})();