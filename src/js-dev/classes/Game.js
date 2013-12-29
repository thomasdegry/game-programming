/* globals Vector:true, Rocket:true, Galaxy: true, Bound:true, CollisionDetection:true, Planet:true, Util:true */
var Game = (function () {

    var Game = function () {
        _.bindAll(this);

        this.log = false;

        // setup defaults
        this.h1 = Math.PI / 2;
        this.v1 = 1;

        this.cWidth = 500;
        this.cHeight = 700;

        // create default vector
        this.vector1 = new Vector(0, 0, this.h1, this.v1);

        // setup the stage
        this.stage = new createjs.Stage("canvas");
        this.stage.canvas.width = this.cWidth;
        this.stage.canvas.height = this.cHeight;

        // create a galaxy
        this.galaxy = new Galaxy(this.cWidth, 3000);
        this.galaxy.container.y = -2500;
        this.stage.addChild(this.galaxy.container);

        // create an empty bounds array and fill it in the createbounds()
        this.bounds = [];
        this.createBounds();

        // create temporary level
        this.planets = [];
        this.createPlanets();

        // make a rocket
        this.rocket = new Rocket(-5, -10, 10, 20, 'FF0000', this.vector1);
        // this.rocket.shape.x = 250;
        // this.rocket.shape.y = 2500;
        this.rocket.x = 150;
        this.rocket.y = 2980;
        this.galaxy.addObject(this.rocket.shape);

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
        this.rocket.y = y - this.galaxy.container.y;
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

            case 76:
                this.log = !this.log;
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

        for(var j = 0; j < this.planets.length; j++){
            if (this.log) {
                console.log("distance to planet "+j+": "+ Util.getDistance(this.planets[j],this.rocket));
            }
            if(Util.getDistance(this.planets[j],this.rocket) < this.planets[j].gravityRadius){
                $("#inbound").removeClass('false').addClass('true');
            }else{
                $("#inbound").removeClass('true').addClass('false');

            }
            if(Util.getDistance(this.planets[j],this.rocket) < this.planets[j].radius){
                $("#crash").removeClass('false').addClass('true');
            }else{
                $("#crash").removeClass('true').addClass('false');

            }
        }

        this.rocket.update();

        this.galaxy.followRocket(this.rocket, this.cHeight, 0);
        this.stage.update();
        this.draw();
    };

    Game.prototype.draw = function() {
    };

    Game.prototype.createPlanets = function() {
        var yPos = 100;
        for(var i = 0; i < 27; i++) {
            this.planets.push(new Planet(Math.floor(Math.random() * this.cWidth), yPos, (Math.floor(Math.random() * 20) + 20)));
            yPos += 100;
        }

        for (var j = this.planets.length - 1; j >= 0; j--) {
            this.galaxy.addObject(this.planets[j].gravityField);
            this.galaxy.addObject(this.planets[j].shape);
        }
    };

    Game.prototype.createBounds = function() {
        // three bounds, no bound on the top, right border, bottom border, left border
        this.bounds.push(new Bound(this.galaxy.width - 1, 0, 1, this.galaxy.height));
        // this.bounds.push(new Bound(0, this.galaxy.height - 1, this.galaxy.width, 1));
        this.bounds.push(new Bound(0, 0, 1, this.galaxy.height));
    };

    return Game;
})();