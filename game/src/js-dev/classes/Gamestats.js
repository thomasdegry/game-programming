/* global Util:true, TweenMax:true, Linear:true */
var Gamestats = (function () {

    var Gamestats = function (x, y, lives) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.lives = lives;
        this.heartImgs = [];
        this.heartImgsXPos = 80;
        this.container = new createjs.Container();

        this.countdownContainer = new createjs.Container();
        this.countdownContainer.alpha = 0;

        this.container.addChild(this.countdownContainer);

        // score field
        this.score = new createjs.Text("0000", "20px sequibold", "#efefef");
        this.score.textBaseline = "alphabetic";
        this.container.addChild(this.score);

        // default star
        this.defaultStar = new createjs.Bitmap('img/default-star.png');
        this.defaultStar.x = 367;
        this.defaultStar.y = 19;
        this.countdownContainer.addChild(this.defaultStar);

        this.boost = new createjs.Bitmap('img/boost.png');
        this.boost.x = 367;
        this.boost.y = 19;
        this.countdownContainer.addChild(this.boost);

        this.break = new createjs.Bitmap('img/turtle.png');
        this.break.x = 362;
        this.break.y = 21;
        this.countdownContainer.addChild(this.break);

        this.countdownFill = new createjs.Shape();
        this.countdownFill.graphics.beginFill('#e7c54e');
        this.countdownFill.graphics.drawRect(0, 0, 90, 18);
        this.countdownFill.graphics.endFill();
        this.countdownFill.x = 390;
        this.countdownFill.y = 15;
        this.countdownContainer.addChild(this.countdownFill);

        this.countdownBox = new createjs.Shape();
        this.countdownBox.graphics.beginStroke('#ffffff').setStrokeStyle(1);
        this.countdownBox.graphics.drawRect(0, 0, 90, 18);
        this.countdownBox.graphics.endFill();
        this.countdownBox.x = 390;
        this.countdownBox.y = 15;
        this.countdownContainer.addChild(this.countdownBox);

        // create hearts for each lives
        for(var i = 0; i < this.lives; i++) {
            this.heartImgs.push(new createjs.Bitmap('img/heart.png'));
            this.heartImgs[i].x = this.heartImgsXPos;
            this.heartImgs[i].y = 10;
            this.container.addChild(this.heartImgs[i]);
            this.heartImgsXPos += 30;
        }

        this.score.x = this.x;
        this.score.y = this.y;
    };

    Gamestats.prototype.updateScore = function(score) {
        this.score.text = Util.proceedZeros(Math.floor(300000 + score - 600));
    };

    Gamestats.prototype.takeALive = function() {
        this.container.removeChild(this.heartImgs[this.heartImgs.length - 1]);
        this.heartImgs.splice(this.heartImgs.length - 1, 1);
    };

    Gamestats.prototype.takeAllLives = function() {
        for(var i = 0; i < this.heartImgs.length; i++) {
            this.container.removeChild(this.heartImgs[i]);
        }
        this.heartImgs = [];
    };

    Gamestats.prototype.showSomething = function(subject, seconds) {
        TweenMax.killTweensOf(this.countdownFill);
        this.countdownFill.graphics.clear();
        this.defaultStar.alpha = 0; this.boost.alpha = 0; this.break.alpha = 0;
        var color = '#e7c54e';
        switch(subject) {
            case 'boostEngine':
                color = '#81d766';
                this.boost.alpha = 1;
                break;

            case 'breakEngine':
                color = '#b11500';
                this.break.alpha = 1;
                break;

            default:
                this.defaultStar.alpha = 1;
                break;
        }

        this.countdownFill.graphics.beginFill(color);
        this.countdownFill.graphics.drawRect(0, 0, 90, 18);
        this.countdownFill.graphics.endFill();
        this.countdownFill.scaleX = 1;
        this.countdownContainer.alpha = 1;

        TweenMax.to(this.countdownFill, seconds, {scaleX:0, repeat:0, ease:Linear.easeNone, onComplete:this.hideCountdown});
    };

    Gamestats.prototype.hideCountdown = function() {
        TweenMax.to(this.countdownContainer, 0.7, {alpha: 0});
    };

    Gamestats.prototype.relive = function() {
        this.heartImgsXPos = 70;
        for(var i = 0; i < this.lives; i++) {
            this.heartImgs.push(new createjs.Bitmap('img/heart.png'));
            this.heartImgs[i].x = this.heartImgsXPos;
            this.heartImgs[i].y = 10;
            this.container.addChild(this.heartImgs[i]);
            this.heartImgsXPos += 30;
        }
    };

    return Gamestats;
})();