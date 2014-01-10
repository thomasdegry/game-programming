(function(){

var Settings =(function () {

    var Settings = function () {
        this.hostName = 'http://192.168.0.247';
        this.debug = true;
        this.tips = ['Maybe you should try not to kiss planets?', 'UFO\'s aren\'t that fond of rockets..', 'You can do better! Try agian! C\'mon!', 'I agree it can be hot inside the rocket.. But this?', 'Can we agree to not do this from now on?'];
    };

    return Settings;

})();

var Bound = (function () {

    var Bound = function (x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    };

    return Bound;
})();

var CollisionDetection = (function() {

    function CollisionDetection() {

    }

    CollisionDetection.checkCollision = function(shapeA, shapeB) {
        var vX = (shapeA.x + (shapeA.width/2)) - (shapeB.x + (shapeB.width / 2));
        var vY = (shapeA.y + (shapeA.height/2)) - (shapeB.y + (shapeB.height / 2));

        var hWidths = (shapeA.width/2) + (shapeB.width/2);
        var hHeights = (shapeA.height/2) + (shapeB.height/2);

        var waar = Math.abs(vX) < hWidths && Math.abs(vY) < hHeights;
        // console.log(vX, vY, hWidths, hHeights, waar);

        var colDir = "";

        if(Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
            //Botsing langs de zijkanten
            var oX = hWidths - Math.abs(vX);
            var oY = hHeights - Math.abs(vY);

            if(oX >= oY) {
                //top bottom
                if(vY > 0) {
                    colDir = "t";
                    shapeA.y += oY;
                } else {
                    colDir = "b";
                    shapeA.y -= oY;
                }
            } else {
                //left right
                if(vX > 0) {
                    colDir = "l";
                    shapeA.x += oX;
                } else {
                    colDir = "r";
                    shapeA.x -= oX;
                }
            }

            return colDir;
        }
    };

    return CollisionDetection;

})();

var Galaxy = (function () {

    var Galaxy = function (width, height) {
        _.bindAll(this);

        this.width = width;
        this.height = height;

        this.container = new createjs.Container();

        this.background = new createjs.Shape();
        this.background.graphics.beginFill('#efefef');
        this.background.graphics.drawRect(0, 0, width, height);
        this.background.graphics.endFill();
        //WAAROM VOEG JE DIE TOE IN ZICHZELF?
        //this.container.addChild(this.container);
    };

    Galaxy.prototype.addObject = function(object) {
        this.container.addChild(object);
    };

    Galaxy.prototype.removeObject = function(object) {
        this.container.removeChild(object);
    };

    Galaxy.prototype.followRocket = function(rocket, height, offset) {
        var y = -(rocket.y - (height/2)) + offset;

        if(y < this.boundW) {
            this.container.y = this.boundW;
        } else if(y > 0) {
            this.container.y = 0;
        } else {
            this.container.y = y;
        }
    };

    return Galaxy;
})();

/* globals Vector:true, Rocket:true, buzz:true, Soundboard:true, Galaxy: true, Bound:true, Settings:true, ndgmr:true, CollisionDetection:true, Planet:true, Ufo:true, Star:true, RocketManipulator:true, Util:true, io:true, Gamestats:true */
window.socket = io.connect('http://' + window.location.host + '/');
var Game = (function () {

    var Game = function () {
        _.bindAll(this);

        this.settings = new Settings();
        $(".launchscreen").removeClass('out');

        // setup defaults
        this.h1 = Math.PI / 2;
        this.v1 = 1;
        this.difficultyMultiplier = 1;
        this.planetDistance = 400;
        this.debug = true;
        this.useController = true;
        // use how many planets replaced to increase difficulty
        this.planetsMoved = 0;
        this.previousNumberOfMovedAndIncreasedDifficulty = 0;

        this.settings = new Settings();

        this.socket = window.socket;

        this.cWidth = 500;
        this.cHeight = 700;

        // create default vector
        this.vector1 = new Vector(0, 0, this.h1, this.v1);

        if(this.debug) {
            $("#crash, #inbound").removeClass('hide');
        }

        if(!this.settings.debug) {
            this.soundboard = new Soundboard();
            this.soundboard.lobbyloop.fadeIn(3000);
            $('#mute').click(function(e){
                e.preventDefault();
                buzz.all().toggleMute();
                if ($(this).hasClass('dim')) {
                    $(this).removeClass('dim');
                }else{
                    $(this).addClass('dim');
                }
            });
        }

        this.bind();
    };

    Game.prototype.bind = function() {
        var that = this;
        $("#launch").click(this.showConnect);

        $("#no-controller").click(this.proceedWithoutController);

        this.socket.on('join:accept', function(data) {
            that.startGame();
            $("#multiplayerstats #controller1").removeClass('dim');

        });

        this.socket.on('join:player2', function(data) {
            $("#multiplayerstats #controller2").removeClass('dim');
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
        this.rocket = new Rocket(-5, -10, this.vector1, this.soundboard);
        this.rocket.identifier = gameIdentifier;

        $(".connect-instructions").removeClass('out');
        $(".connect-instructions p span").text(this.rocket.identifier);
        $(".connect-instructions p em").text(this.settings.hostName);

        $("#multiplayerstats").removeClass('out');
        $("#multiplayerstats p span").text(this.rocket.identifier);

    };

    Game.prototype.proceedWithoutController = function(event) {
        event.preventDefault();
        this.useController = false;
        this.startGame();
        $("#multiplayerstats").addClass('out');
    };

    Game.prototype.startGame = function() {
        if(this.useController) {
            this.socket.emit('gameplay:start');
        }

        $(".launchscreen").addClass('out');
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
        this.currentPlanetYPos = this.galaxy.height - 320;
        this.currentUFOYPos = this.galaxy.height - 3000 - Math.floor(Math.random() * 200);
        this.currentStarYpos = this.galaxy.height - 1700 - Math.floor(Math.random() * 300);
        this.currentManipulatorYPos = this.galaxy.height - 1000 - Math.floor(Math.random() * 400);
        this.planets = [];
        this.ufos = [];
        this.stars = [];
        this.rocketManipulators = [];
        this.createPlanets(25);
        this.createUFOs(7);
        this.createStars(3);
        this.createRocketManipulators(8);

        // make a rocket
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.rocketImg);
        this.galaxy.addObject(this.rocket.sprite);
        this.stage.setChildIndex(this.rocket.sprite, this.stage.getNumChildren() - 1);

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
        if(this.useController) {
            $(".restart-instructions-controller").removeClass('hide');
        } else {
            $(".restart-instructions-no-controller").removeClass('hide');
        }

        if(!this.settings.debug) {
            this.soundboard.lobbyloop.stop();
            this.soundboard.gameloop.fadeIn(2000);
            this.soundboard.rocketloop.play();
        }

    };

    Game.prototype.tickHandler = function(event) {
        // don't let it go out the screen
        if (this.rocket.x < 0) {
            this.rocket.x = 0;
        }else if(this.rocket.x > this.cWidth){
            this.rocket.x = this.cWidth;
        }


        var collisionFlag = false,
            crashFlag = false;

        // loop over planets with distance formula to check if planets need to attract you, sexy huh, and secondly check collision
        for(var j = 0; j < this.planets.length; j++){
            var d = Util.getDistance(this.planets[j],this.rocket);

            if(d < this.planets[j].gravityRadius) {
                var angle = Util.getAngle(this.planets[j],this.rocket);
                var force = this.planets[j].gravityRadius - d;
                this.rocket.workingVectors.push(new Vector(this.rocket.x, this.rocket.y,angle,force * 3));
            }

            var intersactionPlanet = ndgmr.checkPixelCollision(this.planets[j].planetImg, this.rocket.rocketImg);
            if(intersactionPlanet !== false && !this.rocket.invincible) {
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
                // this.gamestats.showInvincibleFor(10);
                this.gamestats.showSomething('invincible', 10);
            }
        }

        // loop over alle manipulators
        for(var m = 0; m < this.rocketManipulators.length; m++) {
            var manipulatorIntersection = ndgmr.checkPixelCollision(this.rocketManipulators[m].arrows, this.rocket.rocketImg);
            if(manipulatorIntersection !== false && !this.rocketManipulators[m].isUsed) {
                var type = this.rocketManipulators[m].type;
                if(type === 'up') {
                    this.rocket.boostEngine();
                    this.gamestats.showSomething('boostEngine', 3);
                } else {
                    this.rocket.breakEngine();
                    this.gamestats.showSomething('breakEngine', 3);
                }
                this.rocketManipulators[m].isUsed = true;
            }
        }

        // update score in gamestats
        this.gamestats.updateScore(this.galaxy.container.y);


        // difficulty increaser
        if(this.planetsMoved % 6 === 0 && this.planetsMoved !== 0 && this.planetsMoved !== this.previousNumberOfMovedAndIncreasedDifficulty) {
            if(this.planetDistance > 160) {
                this.planetDistance -= 20;
            } else {
                this.planetDistance -= 1;
            }

            if(this.difficultyMultiplier >= 1.75) {
                this.difficultyMultiplier += 0.01;
            } else if(this.difficultyMultiplier >= 1.5) {
                this.difficultyMultiplier += 0.05;
            } else {
                this.difficultyMultiplier += 0.1;
            }
            this.previousNumberOfMovedAndIncreasedDifficulty = this.planetsMoved;
        }


        // recycle graphics on top and update
        this.reArrangePlanets();
        this.reArrangeUfos();
        this.reArrangeStars();
        this.reArrangeManipulators();

        if (this.playing){
            this.rocket.update();
            this.galaxy.followRocket(this.rocket, this.cHeight, 230);
        }


        this.stage.update();
    };

    Game.prototype.endGame = function() {
        this.playing = false;
        this.ticker.removeEventListener('tick', this.tickHandler);
        this.currentPlanetYPos = this.galaxy.height - 320;
        this.currentUFOYPos = this.galaxy.height - 3000 - Math.floor(Math.random() * 200);
        this.currentStarYpos = this.galaxy.height - 1700 - Math.floor(Math.random() * 300);
        this.currentManipulatorYPos = this.galaxy.height - 1000 - Math.floor(Math.random() * 400);
        this.galaxy.removeObject(this.rocket.sprite);
        this.stage.removeChild(this.galaxy.container);
        this.stage.update();
        this.difficultyMultiplier = 1;
        this.planetsMoved = 1;
        this.planetDistance = 400;
        this.previousNumberOfMovedAndIncreasedDifficulty = 1;
        this.rocket = undefined;
        this.vector1 = undefined;
        this.planets = [];
        this.ufos = [];
        this.stars = [];
        this.rocketManipulators = [];

        var that = this;
        if(this.useController) {
            $(".restart-instructions-controller").removeClass('out');
        } else {
            $(".restart-instructions-no-controller").removeClass('out');
            $(".restart-instructions-no-controller .tip span").text(this.settings.tips[Math.floor(Math.random() * this.settings.tips.length)]);
            document.getElementById('restart').addEventListener('click', that.restart);
        }

        if(this.useController) {
            this.socket.emit('gameplay:stop');
        }

        if(!this.settings.debug) {
            this.soundboard.gameloop.stop();
            this.soundboard.invincible.stop();
            this.soundboard.rocketloop.stop();
            this.soundboard.endgame.play();
            this.soundboard.lobbyloop.fadeIn(2000);
        }
    };

    Game.prototype.restart = function(event) {
        var that = this;
        if(event !== undefined) {
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
        this.rocket = new Rocket(-5, -10, this.vector1, this.soundboard);
        this.rocket.x = 150;
        this.rocket.y = this.galaxy.height - 20;
        this.galaxy.addObject(this.rocket.rocketImg);
        this.galaxy.addObject(this.rocket.sprite);

        this.createPlanets(25);
        this.createUFOs(7);
        this.createStars(3);
        this.createRocketManipulators(8);

        this.gamestats.relive();
        this.stage.setChildIndex(this.gamestats.container, this.stage.getNumChildren() - 1);
        this.stage.setChildIndex(this.rocket.sprite, this.stage.getNumChildren() - 1);

        this.ticker.addEventListener('tick', this.tickHandler);

        this.playing = true;

        if(!this.settings.debug) {
            this.soundboard.lobbyloop.stop();
            this.soundboard.gameloop.fadeIn(2000);
            this.soundboard.rocketloop.play();
            this.soundboard.newlife.play();
        }
    };

    Game.prototype.reArrangePlanets = function() {
        for(var i = 0; i < this.planets.length; i++) {
            if(this.rocket.y - this.planets[i].y < (-this.cHeight)) {
                this.planets[i].y = this.currentPlanetYPos;
                this.planets[i].x = Math.floor(Math.random() * this.cWidth);
                this.planets[i].update(this.difficultyMultiplier);
                this.currentPlanetYPos -= this.planetDistance;
                // add planet to # planets moved to increase difficulty
                this.planetsMoved++;
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

    Game.prototype.reArrangeStars = function() {
        for(var i = 0; i < this.stars.length; i++) {
            if(this.rocket.y - this.stars[i].y < (-this.cHeight)) {
                this.stars[i].y = this.currentStarYpos;
                this.stars[i].x = Math.floor(Math.random() * this.cWidth);
                this.stars[i].update();
                this.currentStarYpos -= Math.floor((Math.random() * 3000) + 5000);
            }
        }
    };

    Game.prototype.reArrangeManipulators = function() {
        for(var i = 0; i < this.rocketManipulators.length; i++) {
            if(this.rocket.y - this.rocketManipulators[i].y < (-this.cHeight)) {
                this.rocketManipulators[i].y = this.currentManipulatorYPos;
                this.rocketManipulators[i].x = Math.floor(Math.random() * this.cWidth);
                this.rocketManipulators[i].update();
                this.currentManipulatorYPos -= Math.floor((Math.random() * 5000) + 1500);
            }
        }
    };

    Game.prototype.createPlanets = function(ammount) {
        for(var i = 0; i < ammount - 1; i++) {
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

    Game.prototype.createRocketManipulators = function(ammount) {
        for(var i = 0; i < ammount - 1; i++) {
            this.rocketManipulators.push(new RocketManipulator(Math.floor(Math.random() * this.cWidth), this.currentManipulatorYPos));
            this.currentManipulatorYPos -= Math.floor((Math.random() * 5000) + 1500);
            this.galaxy.addObject(this.rocketManipulators[i].container);
        }
    };

    Game.prototype.createBounds = function() {
        this.bounds.push(new Bound(this.galaxy.width - 1, 0, 1, this.galaxy.height));
        this.bounds.push(new Bound(0, 0, 1, this.galaxy.height));
    };

    return Game;
})();

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

/* globals TweenMax:true, Sine:true */
var Planet = (function () {

    var Planet = function (x, y, radius) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.gravityRadius = radius + 50 + Math.floor(Math.random() * 100);

        this.container = new createjs.Container();

        this.gravityField = new createjs.Shape();
        this.gravityField.graphics.beginStroke("#3f3a49").setStrokeStyle(2).beginFill("#484356");
        this.gravityField.graphics.drawCircle((-radius / 2), (-radius/2), this.gravityRadius);
        this.gravityField.graphics.endFill();
        this.gravityField.alpha = 0.1;
        this.container.addChild(this.gravityField);

        this.stroke = new createjs.Shape();
        this.stroke.graphics.beginStroke("#3f3a49").setStrokeStyle(2);
        this.stroke.graphics.drawCircle((-radius / 2), (-radius/2), this.gravityRadius);
        this.stroke.graphics.endFill();
        this.container.addChild(this.stroke);

        // planeet img is 254 * 247px
        var randomColorDecider = Math.floor(Math.random() * 100);
        if(randomColorDecider < 33) {
            this.planetImg = new createjs.Bitmap('img/planet.png');
        } else if(randomColorDecider >= 33 && randomColorDecider < 66) {
            this.planetImg = new createjs.Bitmap('img/planet-blue.png');
        } else {
            this.planetImg = new createjs.Bitmap('img/planet-orange.png');
        }
        this.planetImg.scaleX = (1/254) * (radius * 2);
        this.planetImg.scaleY = (1/247) * (radius * 2);
        this.container.addChild(this.planetImg);

        // console.log('planeet met - ' + (254 * this.planetImg.scaleX / 2) + ' en width van ' + (this.radius * 2));
        this.planetImg.x = this.x - (Math.floor(127 * this.planetImg.scaleX)) - (this.radius / 2);
        this.planetImg.y = this.y - (Math.floor(123.5 * this.planetImg.scaleY)) - (this.radius / 2);

        this.stroke.x = this.x;
        this.stroke.y = this.y;

        this.gravityField.x = this.x;
        this.gravityField.y = this.y;

        var time = Math.floor(Math.random()*3)+2;

        TweenMax.to(this.container, time, {y: ++time * 7, yoyo:true, repeat:-1, ease:Sine.easeInOut});
        TweenMax.to(this.planetImg, time, {y: this.planetImg.y + 10, yoyo:true, repeat:-1, ease:Sine.easeInOut});
        TweenMax.to(this.planetImg, time, {rotation: 10, yoyo:true, repeat:-1, ease:Sine.easeInOut});
    };

    Planet.prototype.update = function(multiplier) {
        // this.gravityRadius = (this.radius + Math.floor(Math.random() * 200)) * multiplier;
        this.gravityRadius = this.radius + 50 + Math.floor(Math.random() * (100 * multiplier));
        var newRadius = this.radius * multiplier;

        var randomColorDecider = Math.floor(Math.random() * 100);
        if(randomColorDecider < 33) {
            this.planetImg = new createjs.Bitmap('img/planet.png');
        } else if(randomColorDecider >= 33 && randomColorDecider < 66) {
            this.planetImg = new createjs.Bitmap('img/planet-blue.png');
        } else {
            this.planetImg = new createjs.Bitmap('img/planet-orange.png');
        }
        this.planetImg.scaleX = (1/254) * (newRadius * 2);
        this.planetImg.scaleY = (1/247) * (newRadius * 2);
        this.container.addChild(this.planetImg);

        this.gravityField.graphics.clear();
        this.gravityField.graphics.beginStroke("#3f3a49").setStrokeStyle(2).beginFill("#484356");
        this.gravityField.graphics.drawCircle((-this.radius / 2), (-this.radius/2), this.gravityRadius);
        this.gravityField.graphics.endFill();
        this.gravityField.alpha = 0.1;

        this.stroke.graphics.clear();
        this.stroke.graphics.beginStroke("#3f3a49").setStrokeStyle(2);
        this.stroke.graphics.drawCircle((-this.radius / 2), (-this.radius/2), this.gravityRadius);
        this.stroke.graphics.endFill();

        this.planetImg.x = this.x - (Math.floor(127 * this.planetImg.scaleX)) - (this.radius / 2);
        this.planetImg.y = this.y - (Math.floor(123.5 * this.planetImg.scaleY)) - (this.radius / 2);

        this.gravityField.x = this.x;
        this.gravityField.y = this.y;

        this.stroke.x = this.x;
        this.stroke.y = this.y;

        var time = Math.floor(Math.random()*3)+2;

        TweenMax.to(this.container, time, {y: ++time * 7, yoyo:true, repeat:-1, ease:Sine.easeInOut});
        TweenMax.to(this.planetImg, time, {y: this.planetImg.y + 10, yoyo:true, repeat:-1, ease:Sine.easeInOut});
        TweenMax.to(this.planetImg, time, {rotation: 10, yoyo:true, repeat:-1, ease:Sine.easeInOut});
    };

    return Planet;
})();

/* globals TweenMax:true, Soundboard:true, Settings:true */
var Rocket = (function () {

    var Rocket = function (x, y, vector, soundboard) {
        _.bindAll(this);

        this.x = x;
        this.y = y;
        this.rocketVector = vector;
        this.soundboard = soundboard;
        this.workingVectors = [];
        this.remainingLives = 2;
        this.invincible = false;
        this.settings = new Settings();

        this.speedBeforeManipulator = 0;
        this.isUnderManipulation = false;

        this.socket = window.socket;

        this.RocketAnim = new createjs.SpriteSheet({
            'images': ["img/rocket.png"],
            'frames': [
                [1952, 2, 48, 104],
                [1902, 2, 48, 104],
                [1852, 2, 48, 104],
                [1802, 2, 48, 104],
                [1752, 2, 48, 104],
                [1702, 2, 48, 104],
                [1652, 2, 48, 104],
                [1602, 2, 48, 104],
                [1552, 2, 48, 104],
                [1502, 2, 48, 104],
                [1452, 2, 48, 104],
                [1402, 2, 48, 104],
                [1352, 2, 48, 104],
                [1302, 2, 48, 104],
                [1252, 2, 48, 104],
                [1202, 2, 48, 104],
                [1152, 2, 48, 104],
                [1102, 2, 48, 104],
                [1052, 2, 48, 104],
                [1002, 2, 48, 104],
                [952, 2, 48, 104],
                [902, 2, 48, 104],
                [852, 2, 48, 104],
                [802, 2, 48, 104],
                [752, 2, 48, 104],
                [702, 2, 48, 104],
                [652, 2, 48, 104],
                [602, 2, 48, 104],
                [552, 2, 48, 104],
                [502, 2, 48, 104],
                [452, 2, 48, 104],
                [402, 2, 48, 104],
                [352, 2, 48, 104],
                [302, 2, 48, 104],
                [252, 2, 48, 104],
                [202, 2, 48, 104],
                [152, 2, 48, 104],
                [102, 2, 48, 104],
                [52, 2, 48, 104],
                [2, 2, 48, 104]
            ],
            'animations': {fly:[30,39],boost:[0,9],break:[10,19],invincible:[20,29]},
            'framerate': 10
        });

        this.rocketImg = new createjs.Bitmap('img/rocket-ghost.png');
        this.rocketImg.regX = 26;
        this.rocketImg.regY = 52;
        this.rocketImg.x = this.x;
        this.rocketImg.y = this.y;

        this.sprite = new createjs.Sprite(this.RocketAnim,'fly');
        this.sprite.framerate = 10;
        this.sprite.regX = 24;
        this.sprite.regY = 52;
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.identifier = undefined;

        this.bind();

    };

    Rocket.prototype.bind = function() {
        var that = this;

        this.socket.on('move', function(data) {
            var angleInRad = data['tilt'] / 57.2957795;
            that.updateHeading(angleInRad + Math.PI/2);
        });

        this.socket.on('speed:change', function(data) {
            if(!this.isUnderManipulation) {
                that.rocketVector.v = 700 * data['speed'];
            }
        });

        window.onkeydown = this.keyDownHandler;
    };

    Rocket.prototype.keyDownHandler = function(event) {
        event.preventDefault();
        switch(event.keyCode) {
            case 38: //up
                this.rocketVector.v += 10;
                break;

            case 40: //down
                this.rocketVector.v -= 10;
                break;

            case 37: //left
                this.updateHeading(this.rocketVector.h - 0.1);
                break;

            case 39: //right
                this.updateHeading(this.rocketVector.h + 0.1);
                break;

        }
    };

    Rocket.prototype.update = function() {
        var vector = this.rocketVector.clone();

        for(var i = 0; i < this.workingVectors.length; i++){
            vector.addVector(this.workingVectors[i]);
        }

        var endCoords = vector.getEndCoords();

        this.x += parseFloat(endCoords.x / 100);
        this.y += parseFloat(endCoords.y / 100);

        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.rocketImg.x = this.x;
        this.rocketImg.y = this.y;

        TweenMax.to(this.sprite, 0.5, {rotation: this.rocketVector.getHeading() - 90});
        TweenMax.to(this.rocketImg, 0.5, {rotation: this.rocketVector.getHeading() - 90});

        this.workingVectors = [];

        if(!this.settings.debug) {
            this.soundboard.rocketloop.setVolume(this.rocketVector.v/5);
        }
    };

    Rocket.prototype.updateHeading = function(heading) {
        //de checks dienen om de raket niet terug naar beneden te laten vliegen.
        if(this.rocketVector.h <= Math.PI || this.rocketVector.h !== 0){
            this.rocketVector.setHeading(heading);
            if(heading > Math.PI ){
                this.rocketVector.setHeading(Math.PI);
            }else if(heading < 0){
                this.rocketVector.setHeading(0);
            }
        }
    };

    Rocket.prototype.setDirectSpeed = function(speed) {
        this.rocketVector.v = speed;
    };

    Rocket.prototype.dieOnce = function() {
        this.remainingLives--;
        if(!this.settings.debug) {
            this.soundboard.lostlife.play();
        }
    };

    Rocket.prototype.makeInvincible = function(miliseconds) {
        this.invincible = true;
        this.sprite.gotoAndPlay('invincible');
        if(!this.settings.debug) {
            this.soundboard.gameloop.pause();
            this.soundboard.invincible.play();
        }

        var that = this;
        setTimeout(function() {
            that.invincible = false;
            that.sprite.gotoAndPlay('fly');
            if(!that.settings.debug) {
                that.soundboard.invincible.stop();
                that.soundboard.gameloop.play();
            }
        }, miliseconds);
    };

    Rocket.prototype.breakEngine = function() {
        this.isUnderManipulation = true;
        this.speedBeforeManipulator = this.rocketVector.v;
        this.rocketVector.v = Math.floor(this.speedBeforeManipulator / 2);
        this.sprite.gotoAndPlay('break');
        if(!this.settings.debug) {
            this.soundboard.break.play();
        }

        var that = this;
        setTimeout(function() {
            that.isUnderManipulation = false;
            that.rocketVector.v = that.speedBeforeManipulator;
            that.sprite.gotoAndPlay('fly');
        }, 3000);
    };

    Rocket.prototype.boostEngine = function() {
        this.isUnderManipulation = true;
        this.speedBeforeManipulator = this.rocketVector.v;
        this.rocketVector.v = 900;
        this.sprite.gotoAndPlay('boost');
        if(!this.settings.debug) {
            this.soundboard.boost.play();
        }

        var that = this;
        setTimeout(function() {
            that.isUnderManipulation = false;
            that.rocketVector.v = that.speedBeforeManipulator;
            that.sprite.gotoAndPlay('fly');
        }, 3000);
    };

    return Rocket;
})();

var RocketManipulator = (function () {

    var RocketManipulator = function (x, y) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.type = 'up';
        this.isUsed = false;

        this.container = new createjs.Container();

        this.arrows = new createjs.Bitmap('img/manipulator.png');
        this.arrows.x = this.x;
        this.arrows.y = this.y;
        this.container.addChild(this.arrows);

        if(Math.floor(Math.random() * 100) < 50) {
            this.type = 'down';
            this.arrows.rotation = 180;
        }
    };

    RocketManipulator.prototype.update = function() {
        this.arrows.x = this.x;
        this.arrows.y = this.y;
        this.isUsed = false;
    };

    return RocketManipulator;
})();

/* globals buzz: true */
var Soundboard = (function (){
    var Soundboard = function(){
        this.lobbyloop = new buzz.sound('sound/lobby.mp3',{preload: true, loop: true});
        this.gameloop = new buzz.sound('sound/game.mp3',{preload: true, loop: true});
        this.endgame = new buzz.sound('sound/endgame.mp3',{preload: true, loop: false});
        this.boost = new buzz.sound('sound/boost.mp3',{preload: true, loop: false});
        this.break = new buzz.sound('sound/enginebreak.mp3',{preload: true, loop: false});
        this.lostlife = new buzz.sound('sound/lostlife.mp3',{preload: true, loop: false});
        this.newlife = new buzz.sound('sound/newlife.mp3',{preload: true, loop: false});
        this.invincible = new buzz.sound('sound/invincible.mp3',{preload: true, loop: true});
        this.rocketloop = new buzz.sound('sound/rocketloop.mp3',{preload: true, loop: true});
        this.rocketloop.setVolume(0);
    };

    return Soundboard;
})();

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

        if(this.color === 'orange') {
            TweenMax.to(this.ufoImg, 9, {bezier:[{x:230, y: this.startYPos+4}, {x:450, y:this.startYPos-10}, {x:140, y:this.startYPos+15}, {x:20, y:this.startYPos}], ease:Power1.easeInOut, repeat:-1});
        } else {
            TweenMax.to(this.ufoImg, 7, {bezier:[{x:210, y:this.startYPos+13}, {x:430, y:this.startYPos-7}, {x:20, y:this.startYPos}], ease:Sine.easeInOut, repeat:-1});
        }
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

var Util =(function () {

    var Util = function () {

    };

    Util.getDistance = function(obj1, obj2) {
        var d = Math.sqrt(Math.pow((obj1.x - obj2.x),2)+Math.pow((obj1.y-obj2.y),2));
        return d;
    };

    Util.getAngle = function(obj1, obj2){
        var angle = Math.atan(Math.abs(obj1.y-obj2.y)/Math.abs(obj1.x-obj2.x));

        if (obj2.x < obj1.x && obj2.y > obj1.y || obj2.x > obj1.x && obj2.y < obj1.y) {
            angle = Math.PI - angle;
        }
        if (obj2.y < obj1.y) {
            angle += Math.PI;
        }

        if (angle < 0) {
            angle = angle + 2*Math.PI;
        }
        if (angle > 2*Math.PI) {
            angle = angle - 2*Math.PI;
        }
        return angle;
    };

    Util.proceedZeros = function(score) {
        if(score.toString().length === 1) {
            return "0000" + score;
        } else if(score.toString().length === 2) {
            return "000" + score;
        } else if(score.toString().length === 3) {
            return "00" + score;
        } else if(score.toString().length === 4) {
            return "0" + score;
        } else {
            return score;
        }
    };

    return Util;

})();

var Vector = (function () {

    var x,y,h,v;

    var Vector = function (x,y,h,v) {
            // x en y zijn de startcoordinaten van de vector.
            // deze zijn niet gelijkgesteld aan het nulpunt.
            // h is de heading van de vector in radialen. tussen 0 en 2Pi.
            // v is de grotte van de vector. (velocity).
            this.x = x;
            this.y = y;
            this.h = h;
            if (v < 0) {
                this.v = 0;
            }else{
                this.v = v;
            }
    };

    Vector.prototype.addVector = function(vector) {
        // telt de parameter vector op bij de de huidige vector
        // de huidige vector wordt de resulterende vector.
        // het vector punt wordt teruggegeven in een object.
        var endCoords1 = this.getEndCoords();
        var endCoords2 = vector.getEndCoords();

        var endX = endCoords1.x + endCoords2.x;
        var endY = endCoords1.y + endCoords2.y;

        this.h = Math.atan(endY/endX);
        if(endX >= 0){
            this.h += Math.PI;
        }


        this.v = Math.sqrt(Math.pow(endX,2)+Math.pow(endY,2));
        return {x:this.x + endX,y:this.y + endY};
    };

    Vector.prototype.getEndCoords = function(){
        // geeft een object terug met daarin de x en y van de staart van de vector.
        // deze zijn relatieve waarden aan de startpunten van de vector.
        var newY = -this.v * Math.sin(this.h);
        var newX = Math.sqrt(Math.pow(this.v,2)-Math.pow(newY,2));
        if(this.h <= Math.PI/2 || this.h >= 1.5*Math.PI){
            newX = -newX;
        }

        return {x:newX,y:newY};
    };

    Vector.prototype.setHeading = function(heading){
        this.h = heading;
        if (this.h > 2*Math.PI) {
            this.h -= 2*Math.PI;
        }
        if(this.h < 0){
            this.h += 2*Math.PI;
        }
    };

    Vector.prototype.getHeading = function(){
        return this.h * 57.2957795;
    };

    Vector.prototype.clone = function() {
        var clone = new Vector(this.x,this.y,this.h,this.v);
        return clone;
    };

    return Vector;
})();

/* globals Game:true */
var game = new Game();

})();