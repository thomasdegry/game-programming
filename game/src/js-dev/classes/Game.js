/* globals Vector:true, Rocket:true, Galaxy: true, Bound:true, Settings:true, ndgmr:true, CollisionDetection:true, Planet:true, Ufo:true, Star:true, Util:true, io:true, Gamestats:true */
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
        this.rocket = new Rocket(-5, -10, this.vector1);
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
        this.currentStarYpos = this.galaxy.height - 200;
        console.log(this.currentUFOYPos);
        this.planets = [];
        this.ufos = [];
        this.stars = [];
        this.createPlanets(17);
        this.createUFOs(7);
        this.createStars(3);

        // make a rocket
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.rocketImg);
        this.galaxy.addObject(this.rocket.sprite);

        // create a game stats instance
        this.gamestats = new Gamestats(15, 30, 2);
        this.stage.addChild(this.gamestats.container);

        // setup the ticker
        this.ticker = createjs.Ticker;
        this.ticker.RAF = true;
        this.ticker.setFPS(60);
        this.ticker.addEventListener('tick', this.tickHandler);

        //set playing boolean true for slow tickhandler fallback
        this.playing = true;
    };

    Game.prototype.tickHandler = function(event) {
        // loop through the bounds to see if there is collision
        for(var i = 0; i < this.bounds.length; i++) {
            switch(CollisionDetection.checkCollision(this.rocket, this.bounds[i])) {
                case "l":
                    this.rocket.sprite.x = 0;
                    break;

                case "r":
                    this.rocket.sprite.x = this.cWidth;
                    break;
            }
        }

        var collisionFlag = false,
            crashFlag = false;

        // loop over planets with distance formula to check if planets need to attract you, sexy huh, and secondly check collision
        for(var j = 0; j < this.planets.length; j++){
            var d = Util.getDistance(this.planets[j],this.rocket);

            if(d < this.planets[j].gravityRadius) {
                var angle = Util.getAngle(this.planets[j],this.rocket);
                var force = this.planets[j].gravityRadius - d;
                this.rocket.workingVectors.push(new Vector(this.rocket.x, this.rocket.y,angle,force));
            }

            var intersactionPlanet = ndgmr.checkPixelCollision(this.planets[j].planetImg, this.rocket.rocketImg);
            if(intersactionPlanet !== false && !this.rocket.invincible) {
                console.log(this.rocket.invincible);
                crashFlag = true;
            }
        }

        // creash op een planeet
        if(crashFlag) {
            // update gamestats
            this.gamestats.takeAllLives();
            this.endGame();
        }

        // loop over ufos and check if collision
        for(var k = 0; k < this.ufos.length; k++) {
            var intersection = ndgmr.checkPixelCollision(this.ufos[k].ufoImg, this.rocket.rocketImg);
            if(intersection !== false && !this.rocket.invincible) {
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

        // loop over alle stars en check collision
        for(var l = 0; l < this.stars.length; l++) {
            var starIntersection = ndgmr.checkPixelCollision(this.stars[l].starImg, this.rocket.rocketImg);
            if(starIntersection !== false) {
                // if intersection we move the star up to reuse it, we don't do this in a reArrangeStars because collision keeps happening when flying slow, ufo's die if we hit them, stars don't, you can keep on collecting stars, but you can't keep collecting ufo's, you die after two
                this.stars[l].y = this.currentStarYpos;
                this.stars[l].update();
                this.currentStarYpos -= Math.floor((Math.random() * 3000) + 5000);
                this.rocket.makeInvincible(10000);
                this.gamestats.showInvincibleFor(10);
            }
        }

        // update score in gamestats
        this.gamestats.updateScore(this.galaxy.container.y);


        // difficulty increaser
        // TODO: rapper moeilijk maken, niet aan 100000px geraken, te gemakkelijk dan
        if(Math.abs(Math.floor(this.galaxy.container.y)) % 500 === 0) {
            this.difficultyMultiplier = Math.floor(this.difficultyMultiplier + 0.1);
            if(this.planetDistance > 5) {
                this.planetDistance -= 5;
            }
        }

        // recycle graphics on top and update
        this.reArrangePlanets();
        this.reArrangeUfos();

        if (this.playing){
            this.rocket.update();
            this.galaxy.followRocket(this.rocket, this.cHeight, 230);
        }


        this.stage.update();
    };

    Game.prototype.endGame = function() {
        console.log('[ENDGAME]');
        this.playing = false;
        this.ticker.removeEventListener('tick', this.tickHandler);
        this.currentPlanetYPos = this.galaxy.height - 250;
        this.currentUFOYPos = this.galaxy.height - 3000;
        this.currentStarYpos = this.galaxy.height - 200;
        this.galaxy.removeObject(this.rocket.sprite);
        this.stage.removeChild(this.galaxy.container);
        this.stage.update();
        this.difficultyMultiplier = 1;
        this.rocket = undefined;
        this.vector1 = undefined;
        this.planets = [];
        this.ufos = [];
        this.stars = [];

        var that = this;
        if(this.useController) {
            $(".restart-instructions-controller").removeClass('out');
        } else {
            $(".restart-instructions-no-controller").removeClass('out');
            document.getElementById('restart').addEventListener('click', that.restart);
        }

        if(this.useController) {
            this.socket.emit('gameplay:stop');
        }
    };

    Game.prototype.restart = function(event) {
        console.log('[GAME] Game.prototype.restart');
        var that = this;
        if(event !== null || event !== undefined) {
            event.preventDefault();
        }

        if(this.useController) {
            $(".restart-instructions-controller").addClass('out');
        } else {
            $(".restart-instructions-no-controller").addClass('out');
            document.getElementById('restart').removeEventListener('click', that.restart);
        }

        this.galaxy = new Galaxy(this.cWidth, 300000);
        this.galaxy.container.y = -(this.galaxy.height-this.cHeight);
        this.stage.addChild(this.galaxy.container);

        this.vector1 = new Vector(0, 0, this.h1, this.v1);
        this.rocket = new Rocket(-5, -10, this.vector1);
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.rocketImg);
        this.galaxy.addObject(this.rocket.sprite);

        this.createPlanets(17);
        this.createUFOs(7);
        this.createStars(3);

        this.gamestats.relive();
        this.stage.setChildIndex(this.gamestats.container, this.stage.getNumChildren() - 1);

        this.ticker.addEventListener('tick', this.tickHandler);

        this.playing = true;
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


    Game.prototype.createPlanets = function(ammount) {
        for(var i = 0; i < ammount - 1; i++) {
            console.log('[createPlanets] current planet y pos = ' + this.currentPlanetYPos);
            this.planets.push(new Planet(Math.floor(Math.random() * this.cWidth), this.currentPlanetYPos, (Math.floor(Math.random() * 20) + 20)));
            this.currentPlanetYPos -= this.planetDistance;
            this.galaxy.addObject(this.planets[i].container);
        }
    };

    Game.prototype.createUFOs = function(ammount) {
        for(var i = 0; i < ammount - 1; i++) {
            this.ufos.push(new Ufo(20, this.currentUFOYPos));
            this.currentUFOYPos -= Math.floor((Math.random() * 3000) + 2500);
            this.galaxy.addObject(this.ufos[i].container);
        }
    };

    Game.prototype.createStars = function(ammount) {
        for(var i = 0; i < ammount - 1; i++) {
            this.stars.push(new Star(Math.floor(Math.random() * this.cWidth), this.currentStarYpos));
            this.currentStarYpos -= Math.floor((Math.random() * 3000) + 5000);
            this.galaxy.addObject(this.stars[i].container);
        }
    };

    Game.prototype.createBounds = function() {
        // three bounds, no bound on the top, right border, bottom border, left border
        this.bounds.push(new Bound(this.galaxy.width - 1, 0, 1, this.galaxy.height));
        this.bounds.push(new Bound(0, 0, 1, this.galaxy.height));
    };

    return Game;
})();