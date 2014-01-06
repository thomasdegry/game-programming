/* global Util:true */
var Gamestats = (function () {

    var Gamestats = function (x, y, lives) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.lives = lives;
        this.heartImgs = [];
        this.heartImgsXPos = 70;
        this.container = new createjs.Container();

        // score field
        this.score = new createjs.Text("0000", "20px sequibold", "#efefef");
        this.score.textBaseline = "alphabetic";
        this.container.addChild(this.score);

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