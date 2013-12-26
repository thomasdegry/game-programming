/* globals Vector:true, Rocket:true */
var Game = (function () {

    var Game = function () {
        _.bindAll(this);

        this.h1 = Math.PI / 2;
        this.v1 = 1;

        this.vector1 = new Vector(0, 0, this.h1, this.v1);

        this.stage = new createjs.Stage("canvas");
        this.stage.canvas.width = 300;
        this.stage.canvas.height = 500;

        this.rocket = new Rocket(-5, -10, 10, 20, 'FF0000', this.vector1);
        this.rocket.shape.x = 160;
        this.rocket.shape.y = 495;
        this.stage.addChild(this.rocket.shape);

        // this.stage.addChild(this.ship);

        this.ticker = createjs.Ticker;
        this.ticker.useRAF = true;
        this.ticker.setFPS(60);
        this.ticker.addEventListener('tick', this.tickHandler);

        window.onkeydown = this.keyDownHandler;
        document.getElementById('canvas').addEventListener('mousedown', this.resetToMousePos);
    };

    Game.prototype.resetToMousePos = function(event) {
        var x = event.x;
        var y = event.y;

        var canvas = document.getElementById('canvas');

        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;

        this.rocket.shape.x = x;
        this.rocket.shape.y = y;
    };

    Game.prototype.keyDownHandler = function(event) {
        switch(event.keyCode) {
            case 38: //up
                this.rocket.vector.v += 10;
                break;

            case 40: //down
                this.rocket.vector.v -= 10;
                break;

            case 37: //left
                this.rocket.vector.setHeading(this.rocket.vector.h - 0.1);
                break;

            case 39: //right
                this.rocket.vector.setHeading(this.rocket.vector.h + 0.1);
                break;
        }
    };

    Game.prototype.tickHandler = function(event) {
        this.rocket.update();

        this.stage.update();
        this.draw();
    };

    Game.prototype.draw = function() {
    };

    return Game;
})();