/* globals Vector:true, Rocket:true, Galaxy: true, Bound:true, Settings:true, ndgmr:true, CollisionDetection:true, Planet:true, Ufo:true, Util:true, io:true, Gamestats:true */
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

        this.settings = new Settings();

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

        this.socket.on('gameplay:restart', this.restart);

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
        $(".connect-instructions p em").text(this.settings.hostName);
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
        this.currentUFOYPos = this.galaxy.height - 3000;
        console.log(this.currentUFOYPos);
        this.planets = [];
        this.ufos = [];
        this.createPlanets();
        this.createUFOs();

        // make a rocket
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.shape);
        this.galaxy.addObject(this.rocket.rocketImg);

        // create a game stats instance
        this.gamestats = new Gamestats(15, 30, 2);
        this.stage.addChild(this.gamestats.container);

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

            this.gamestats.takeAllLives();
            this.endGame();
        } else {
            if(this.debug) {
                $("#crash").removeClass('true').addClass('false');
            }
        }

        for(var k = 0; k < this.ufos.length; k++) {
            var intersection = ndgmr.checkRectCollision(this.ufos[k].ufoImg, this.rocket.rocketImg);
            if(intersection !== null) {
                // subtract a life of your rocket
                this.rocket.dieOnce();
                // remove the current planet from the galaxy
                this.galaxy.removeObject(this.ufos[k].container);
                this.ufos.splice(k, 1);
                this.gamestats.takeALive();

                if(this.rocket.remainingLives === 0) {
                    this.endGame();
                    return false;
                }
            }
        }

        this.gamestats.updateScore(this.galaxy.container.y);

        if(Math.abs(Math.floor(this.galaxy.container.y)) % 500 === 0) {
            this.difficultyMultiplier = Math.floor(this.difficultyMultiplier + 0.1);
            if(this.planetDistance > 5) {
                this.planetDistance -= 5;
            }
        }

        this.reArrangePlanets();
        this.reArrangeUfos();

        this.rocket.update();

        this.galaxy.followRocket(this.rocket, this.cHeight, 230);

        this.stage.update();
    };

    Game.prototype.endGame = function() {
        console.log('[GAME] in end game function');
        this.ticker.removeEventListener('tick', this.tickHandler);
        this.currentPlanetYPos = this.galaxy.height - 250;
        this.currentUFOYPos = this.galaxy.height - 3000;
        this.galaxy.removeObject(this.rocket.shape);
        this.stage.removeChild(this.galaxy.container);
        this.stage.update();
        this.difficultyMultiplier = 1;
        this.rocket = undefined;
        this.vector1 = undefined;
        this.planets = [];
        this.ufos = [];

        var that = this;
        if(this.useController) {
            $(".restart-instructions-controller").removeClass('out');
        } else {
            $(".restart-instructions-no-controller").removeClass('out');
            document.getElementById('restart').addEventListener('click', function(event) {
                event.preventDefault();
                that.restart();
            });
        }

        if(this.useController) {
            this.socket.emit('gameplay:stop');
        }
    };

    Game.prototype.restart = function() {
        console.log('[GAME] Game.prototype.restart');
        if(this.useController) {
            $(".restart-instructions-controller").addClass('out');
        } else {
            $(".restart-instructions-no-controller").addClass('out');
            document.getElementById('restart').removeEventListener('click');
        }

        this.galaxy = new Galaxy(this.cWidth, 300000);
        this.galaxy.container.y = -(this.galaxy.height-this.cHeight);
        this.stage.addChild(this.galaxy.container);

        this.vector1 = new Vector(0, 0, this.h1, this.v1);
        this.rocket = new Rocket(-5, -10, 10, 20, 'AA00FF', this.vector1);
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.shape);

        this.rocket = new Rocket(-5, -10, 10, 20, 'efefef', this.vector1);
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.shape);
        this.galaxy.addObject(this.rocket.rocketImg);

        this.createPlanets();
        this.createUFOs();

        this.ticker.addEventListener('tick', this.tickHandler);
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

    Game.prototype.reArrangeUfos = function() {
        for(var i = 0; i < this.ufos.length; i++) {
            if(this.rocket.y - this.ufos[i].startYPos < (-this.cHeight)) {
                this.ufos[i].startYPos = this.currentUFOYPos;
                this.ufos[i].update(this.difficultyMultiplier);
                this.currentUFOYPos -= Math.floor((Math.random() * 3000) + 2500);
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

    Game.prototype.createUFOs = function() {
        for(var i = 0; i < 6; i++) {
            this.ufos.push(new Ufo(20, this.currentUFOYPos));
            this.currentUFOYPos -= Math.floor((Math.random() * 3000) + 2500);
        }

        for(var j = this.ufos.length - 1; j >= 0; j--) {
            this.galaxy.addObject(this.ufos[j].container);
        }
    };

    Game.prototype.createBounds = function() {
        // three bounds, no bound on the top, right border, bottom border, left border
        this.bounds.push(new Bound(this.galaxy.width - 1, 0, 1, this.galaxy.height));
        this.bounds.push(new Bound(0, 0, 1, this.galaxy.height));
    };

    return Game;
})();