/* globals TweenMax:true, Power1:true, Sine:true */
var Ufo = (function () {

    var Ufo = function (startXPos, startYPos) {
        _.bindAll(this);
        this.startYPos = startYPos;
        this.startXPos = startXPos;
        this.container = new createjs.Container();

        var colorDecider = Math.floor(Math.random() * 101);
        if(colorDecider > 50) {
            this.color = 'orange';
        } else {
            this.color = 'yellow';
        }

        this.ufoImg = new createjs.Bitmap('img/ufo-' + this.color + '.png');
        this.container.addChild(this.ufoImg);

        this.ufoImg.x = this.startXPos;
        this.ufoImg.y = this.startYPos;

        // if(this.color === 'orange') {
        //     TweenMax.to(this.ufoImg, 9, {bezier:[{x:230, y: this.startYPos+4}, {x:450, y:this.startYPos-10}, {x:140, y:this.startYPos+15}, {x:20, y:this.startYPos}], ease:Power1.easeInOut, repeat:-1});
        // } else {
        //     TweenMax.to(this.ufoImg, 7, {bezier:[{x:210, y:this.startYPos+13}, {x:430, y:this.startYPos-7}, {x:20, y:this.startYPos}], ease:Sine.easeInOut, repeat:-1});
        // }
    };

    Ufo.prototype.update = function(multiplier) {
        TweenMax.killTweensOf(this.ufoImg);
        this.container.removeChild(this.ufoImg);

        var colorDecider = Math.floor(Math.random() * 101);
        if(colorDecider > 50) {
            this.color = 'orange';
        } else {
            this.color = 'yellow';
        }

        this.ufoImg = new createjs.Bitmap('img/ufo-' + this.color + '.png');
        this.container.addChild(this.ufoImg);

        this.ufoImg.x = this.startXPos;
        this.ufoImg.y = this.startYPos;

        if(this.color === 'orange') {
            TweenMax.to(this.ufoImg, 9, {bezier:[{x:230, y: this.startYPos+4}, {x:450, y:this.startYPos-10}, {x:140, y:this.startYPos+15}, {x:20, y:this.startYPos}], ease:Power1.easeInOut, repeat:-1});
        } else {
            TweenMax.to(this.ufoImg, 7, {bezier:[{x:210, y:this.startYPos+13}, {x:430, y:this.startYPos-7}, {x:20, y:this.startYPos}], ease:Sine.easeInOut, repeat:-1});
        }
    };

    return Ufo;
})();