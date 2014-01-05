(function(){

var Settings =(function () {

    var Settings = function () {

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
        this.container.addChild(this.container);
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

var Planet = (function () {

    var Planet = function (x, y, radius) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.gravityRadius = radius + Math.floor(Math.random() * 200);

        this.container = new createjs.Container();

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#FF0000');
        this.shape.graphics.drawCircle((-radius / 2), (-radius/2), radius);
        this.shape.graphics.endFill();
        // this.container.addChild(this.shape);

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
        // this.planetImg.x = this.x - Math.floor(254 * this.planetImg.scaleX / 2);
        // this.planetImg.y = this.y - Math.floor(254 * this.planetImg.scaleY / 2);
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

var Rocket = (function () {

    var Rocket = function (x, y, width, height, color, vector) {
        _.bindAll(this);

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.rocketVector = vector;
        this.workingVectors = [];
        this.remainingLives = 2;

        this.socket = window.socket;

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#' + color);
        this.shape.graphics.drawPolyStar(0, 0, width, 3, 0, 180);
        this.shape.graphics.endFill();
        this.shape.scaleX = 4.5;
        this.shape.scaleY = 2.4;

        this.identifier = undefined;

        this.rocketImg = new createjs.Bitmap('img/rocket.png');

        this.zero = new createjs.Shape();
        this.zero.graphics.beginFill('#ff0000');
        this.zero.graphics.drawCircle(-(width/2), (-height/2), 1);
        this.zero.graphics.endFill();

        this.shape.x = this.x - (this.width / 2);
        this.shape.y = this.y - (this.width / 2);

        this.rocketImg.x = this.x - 74;
        this.rocketImg.y = this.y - 43;

        this.bind();

    };

    Rocket.prototype.bind = function() {
        var that = this;

        this.socket.on('move', function(data) {
            that.updateHeading(data['tilt'] / 500);
        });

        this.socket.on('speed:change', function(data) {
            that.setRelativeSpeed(data['speed']);
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
                this.updateHeading(-0.1);
                break;

            case 39: //right
                this.updateHeading(0.1);
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

        this.shape.x = this.x - (this.width / 2);
        this.shape.y = this.y - (this.width / 2);

        this.rocketImg.x = this.x - 74;
        this.rocketImg.y = this.y - 43;

        this.shape.rotation = this.rocketVector.getHeading();

        this.workingVectors = [];
    };

    Rocket.prototype.updateHeading = function(heading) {
        this.rocketVector.setHeading(this.rocketVector.h + heading);
    };

    Rocket.prototype.setDirectSpeed = function(speed) {
        this.rocketVector.v = speed;
    };

    Rocket.prototype.setRelativeSpeed = function(direction) {
        if(direction === 'up') {
            if(this.rocketVector.v <= 690) {
                this.rocketVector.v += 10;
            }
        } else if(direction === 'down') {
            if(this.rocketVector.v > 0) {
                this.rocketVector.v -= 10;
            }
        }
        this.socket.emit('speed:updated', {newSpeed: this.rocketVector.v});
    };

    Rocket.prototype.dieOnce = function() {
        this.remainingLives--;
    };

    return Rocket;
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