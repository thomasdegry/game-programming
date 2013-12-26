/* globals Vector:true, Rocket:true, Galaxy: true, Bound:true, CollisionDetection:true */
var Game = (function () {

    var Game = function () {
        _.bindAll(this);

        // setup defaults
        this.h1 = Math.PI / 2;
        this.v1 = 1;

        this.cWidth = 300;
        this.cHeight = 500;

        // create default vector
        this.vector1 = new Vector(0, 0, this.h1, this.v1);

        // setup the stage
        this.stage = new createjs.Stage("canvas");
        this.stage.canvas.width = this.cWidth;
        this.stage.canvas.height = this.cHeight;

        // create a galaxy
        this.galaxy = new Galaxy(300, 3000);

        // create an empty bounds array and fill it in the createbounds()
        this.bounds = [];
        this.createBounds();

        // make a rocket
        this.rocket = new Rocket(-5, -10, 10, 20, 'FF0000', this.vector1);
        this.rocket.shape.x = 160;
        this.rocket.shape.y = 495;
        this.stage.addChild(this.rocket.shape);

        // setup the ticker
        this.ticker = createjs.Ticker;
        this.ticker.useRAF = true;
        this.ticker.setFPS(60);
        this.ticker.addEventListener('tick', this.tickHandler);

        // add the eventlisteners
        window.onkeydown = this.keyDownHandler;
        document.getElementById('canvas').addEventListener('mousedown', this.resetToMousePos);
    };

    Game.prototype.resetToMousePos = function(event) {
        var x = event.x;
        var y = event.y;

        var canvas = document.getElementById('canvas');

        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;

        this.rocket.x = x;
        this.rocket.y = y;
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
        // loop through the bounds to see if there is collision
        for(var i = 0; i < this.bounds.length; i++) {
            switch(CollisionDetection.checkCollision(this.rocket, this.bounds[i])) {
                case "l":
                    this.rocket.shape.x = 0;
                    break;

                case "r":
                    this.rocket.shape.x = this.cWidth;
                    break;
            }
        }

        this.rocket.update();

        this.stage.update();
        this.draw();
    };

    Game.prototype.draw = function() {
    };

    Game.prototype.createBounds = function() {
        // three bounds, no bound on the top, right border, bottom border, left border
        this.bounds.push(new Bound(this.galaxy.width - 1, 0, 1, this.galaxy.height));
        this.bounds.push(new Bound(0, this.galaxy.height - 1, this.galaxy.width, 1));
        this.bounds.push(new Bound(0, 0, 1, this.galaxy.height));

        console.log(this.bounds);
    };

    return Game;
})();