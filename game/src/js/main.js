(function(){

var Settings =(function () {

    var Settings = function () {
        this.hostName = 'http://192.168.60.220';
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
        this.rocket = new Rocket(-5, -10, this.vector1);
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
        this.reArrangeStars();

        if (this.playing){
            this.rocket.update();
            this.galaxy.followRocket(this.rocket, this.cHeight, 230);
        }


        this.stage.update();
    };

    Game.prototype.endGame = function() {
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

    Game.prototype.createBounds = function() {
        // three bounds, no bound on the top, right border, bottom border, left border
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
        this.heartImgsXPos = 70;
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

    Gamestats.prototype.showInvincibleFor = function(seconds) {
        this.countdownContainer.alpha = 1;
        this.countdownFill.scaleX = 1;
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

var Planet = (function () {

    var Planet = function (x, y, radius) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.gravityRadius = radius + Math.floor(Math.random() * 150 +100);

        this.container = new createjs.Container();

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#FF0000');
        this.shape.graphics.drawCircle((-radius / 2), (-radius/2), radius);
        this.shape.graphics.endFill();

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
        this.planetImg = new createjs.Bitmap('img/planet.png');
        this.planetImg.scaleX = (1/254) * (radius * 2);
        this.planetImg.scaleY = (1/247) * (radius * 2);
        this.container.addChild(this.planetImg);

        this.shape.x = this.x;
        this.shape.y = this.y;

        // console.log('planeet met - ' + (254 * this.planetImg.scaleX / 2) + ' en width van ' + (this.radius * 2));
        this.planetImg.x = this.x - (Math.floor(127 * this.planetImg.scaleX)) - (this.radius / 2);
        this.planetImg.y = this.y - (Math.floor(123.5 * this.planetImg.scaleY)) - (this.radius / 2);

        this.stroke.x = this.x;
        this.stroke.y = this.y;

        this.gravityField.x = this.x;
        this.gravityField.y = this.y;
    };

    Planet.prototype.update = function(multiplier) {
        this.shape.x = this.x;
        this.shape.y = this.y;

        this.gravityRadius = (this.radius + Math.floor(Math.random() * 200)) * multiplier;
        var newRadius = this.radius * multiplier;

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
    };

    return Planet;
})();

/* globals TweenMax:true */
var Rocket = (function () {

    var Rocket = function (x, y, vector) {
        _.bindAll(this);

        this.x = x;
        this.y = y;
        this.rocketVector = vector;
        this.workingVectors = [];
        this.remainingLives = 2;
        this.invincible = false;

        this.socket = window.socket;

        this.RocketAnim = new createjs.SpriteSheet({
            'images': ["img/rocket.png"],
            'frames': [
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
            'animations': {fly:[0,9]},
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
            that.rocketVector.v = 700 * data['speed'];
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
        // this.sprite.rotation = this.rocketVector.getHeading() - 90;

        this.workingVectors = [];
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
    };

    Rocket.prototype.makeInvincible = function(miliseconds) {
        this.invincible = true;

        var that = this;
        setTimeout(function() {
            that.invincible = false;
            console.log('not invincible anymore');
        }, miliseconds);
    };

    return Rocket;
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
            return "000" + score;
        } else if(score.toString().length === 2) {
            return "00" + score;
        } else if(score.toString().length === 3) {
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