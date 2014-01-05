/* globals Vector:true, Rocket:true, Galaxy: true, Bound:true, CollisionDetection:true, Planet:true, Util:true, io:true */
window.socket = io.connect('http://' + window.location.host + '/');
var Game = (function () {

    var Game = function () {
        _.bindAll(this);

        // debug vars
        this.log = false;

        // setup defaults
        this.h1 = Math.PI / 2;
        this.v1 = 1;
        this.difficultyMultiplier = 1;
        this.planetDistance = 200;
        this.debug = true;
        this.useController = true;

        this.socket = window.socket;

        this.cWidth = 500;
        this.cHeight = 700;

        // create default vector
        this.vector1 = new Vector(0, 0, this.h1, this.v1);

        if(this.debug) {
            $("#crash, #inbound").removeClass('hide');
        }

        this.bind();
    };

    Game.prototype.bind = function() {
        var that = this;
        $("#launch").click(this.showConnect);

        $("#no-controller").click(this.proceedWithoutController);

        this.socket.on('join:accept', function(data) {
            that.startGame();
        });

        window.onbeforeunload = function() {
            this.socket.emit('game:stop');
            this.socket.disconnect();
        };
    };

    Game.prototype.showConnect = function(e) {
        e.preventDefault();
        $("#launch").addClass('out');
        var gameIdentifier = Math.floor(Math.random() * 1000);
        this.socket.emit('game:start', {code: gameIdentifier});
        this.rocket = new Rocket(-5, -10, 10, 20, 'efefef', this.vector1);
        this.rocket.identifier = gameIdentifier;

        $(".connect-instructions").removeClass('out');
        $(".connect-instructions p span").text(this.rocket.identifier);
    };

    Game.prototype.proceedWithoutController = function(event) {
        event.preventDefault();
        this.useController = false;
        this.startGame();
    };

    Game.prototype.startGame = function() {
        if(this.useController) {
            this.socket.emit('gameplay:start');
        }

        $(".connect-instructions").addClass('out');
        // setup the stage
        this.stage = new createjs.Stage("canvas");
        this.stage.canvas.width = this.cWidth;
        this.stage.canvas.height = this.cHeight;

        // set container height
        this.galaxy = new Galaxy(this.cWidth, 300000);
        // create a galaxy
        this.galaxy.container.y = -(this.galaxy.height-this.cHeight);
        this.stage.addChild(this.galaxy.container);

        // create an empty bounds array and fill it in the createbounds()
        this.bounds = [];
        this.createBounds();

        // create temporary level
        this.currentPlanetYPos = this.galaxy.height - 250;
        this.planets = [];
        this.createPlanets();

        // make a rocket
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.shape);
        this.galaxy.addObject(this.rocket.rocketImg);

        // score field
        this.score = new createjs.Text("0000", "20px sequibold", "#efefef");
        this.score.x = 15;
        this.score.y = 30;
        this.score.textBaseline = "alphabetic";
        this.stage.addChild(this.score);

        // setup the ticker
        this.ticker = createjs.Ticker;
        this.ticker.useRAF = true;
        this.ticker.setFPS(60);
        this.ticker.addEventListener('tick', this.tickHandler);
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

        var collisionFlag = false,
            crashFlag = false,
            crashPlanet,
            crashIndex;

        for(var j = 0; j < this.planets.length; j++){
            // if(this.log) {
            //     console.log("distance to planet "+j+": "+ Util.getDistance(this.planets[j],this.rocket));
            // }

            var d = Util.getDistance(this.planets[j],this.rocket);

            if(d < this.planets[j].gravityRadius) {
                collisionFlag = true;
                var angle = Util.getAngle(this.planets[j],this.rocket);
                var force = this.planets[j].gravityRadius - d;
                this.rocket.workingVectors.push(new Vector(this.rocket.x, this.rocket.y,angle,force));
            } else {
                if(!collisionFlag) {
                    collisionFlag = false;
                }
            }

            if(Util.getDistance(this.planets[j],this.rocket) < this.planets[j].radius) {
                crashFlag = true;
                crashPlanet = this.planets[j];
                crashIndex = j;
            } else {
                if(!crashFlag) {
                    crashFlag = false;
                }
            }
        }

        if(collisionFlag && this.debug === true) {
            $("#inbound").removeClass('false').addClass('true');
        } else {
            $("#inbound").removeClass('true').addClass('false');
        }

        if(crashFlag) {
            if(this.debug === true) {
                $("#crash").removeClass('false').addClass('true');
            }
            this.rocket.dieOnce();
            this.galaxy.removeObject(crashPlanet.container);
            this.planets.splice(crashIndex, 1);
            console.log(this.rocket.remainingLives);
            if(this.rocket.remainingLives === 0) {
                this.endGame();
            }
        } else {
            if(this.debug) {
                $("#crash").removeClass('true').addClass('false');
            }
        }

        this.score.text = Util.proceedZeros(Math.floor(300000 + this.galaxy.container.y - 600));

        if(Math.abs(Math.floor(this.galaxy.container.y)) % 500 === 0) {
            this.difficultyMultiplier = Math.floor(this.difficultyMultiplier + 0.1);
            if(this.planetDistance > 5) {
                this.planetDistance -= 5;
            }
        }

        this.reArrangePlanets();

        this.rocket.update();

        this.galaxy.followRocket(this.rocket, this.cHeight, 230);

        this.stage.update();
        this.draw();
    };

    Game.prototype.draw = function() {
    };

    Game.prototype.endGame = function() {
        this.difficultyMultiplier = 1;

        this.stage.removeChild(this.galaxy.container);
        this.galaxy = undefined;
        this.galaxy = new Galaxy(this.cWidth, 300000);
        this.galaxy.container.y = -(this.galaxy.height-this.cHeight);
        this.stage.addChild(this.galaxy.container);

        this.galaxy.removeObject(this.rocket.shape);
        this.rocket = undefined;
        this.vector1 = undefined;
        this.vector1 = new Vector(0, 0, this.h1, this.v1);
        this.rocket = new Rocket(-5, -10, 10, 20, 'AA00FF', this.vector1);
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.shape);

        this.currentPlanetYPos = this.galaxy.height - 250;
        this.planets = [];
        this.createPlanets();
    };

    Game.prototype.reArrangePlanets = function() {
        for(var i = 0; i < this.planets.length; i++) {
            if(this.rocket.y - this.planets[i].y < (-this.cHeight)) {
                this.planets[i].y = this.currentPlanetYPos;
                this.planets[i].x = Math.floor(Math.random() * this.cWidth);
                this.planets[i].update(this.difficultyMultiplier);
                this.currentPlanetYPos -= this.planetDistance;
            }
        }
    };

    Game.prototype.createPlanets = function() {
        for(var i = 0; i < 15; i++) {
            this.planets.push(new Planet(Math.floor(Math.random() * this.cWidth), this.currentPlanetYPos, (Math.floor(Math.random() * 20) + 20)));
            this.currentPlanetYPos -= this.planetDistance;
        }

        for (var j = this.planets.length - 1; j >= 0; j--) {
            this.galaxy.addObject(this.planets[j].container);
        }
    };

    Game.prototype.createBounds = function() {
        // three bounds, no bound on the top, right border, bottom border, left border
        this.bounds.push(new Bound(this.galaxy.width - 1, 0, 1, this.galaxy.height));
        this.bounds.push(new Bound(0, 0, 1, this.galaxy.height));
    };

    return Game;
})();