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
                this.rocket.rocketVector.v += 10;
                break;

            case 40: //down
                this.rocket.rocketVector.v -= 10;
                break;

            case 37: //left
                this.rocket.rocketVector.setHeading(this.rocket.rocketVector.h - 0.1);
                break;

            case 39: //right
                this.rocket.rocketVector.setHeading(this.rocket.rocketVector.h + 0.1);
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
                // this.rocket.workingVectors.push(new Vector(this.rocket.x,this.rocket.y));
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

var Planet = (function () {

    var Planet = function (x, y, radius) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.gravityRadius = radius + Math.floor(Math.random() * 70);

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#FF0000');
        this.shape.graphics.drawCircle((-radius / 2), (-radius/2), radius);
        this.shape.graphics.endFill();

        this.gravityField = new createjs.Shape();
        this.gravityField.graphics.beginFill("#00FF00");
        this.gravityField.graphics.drawCircle((-radius / 2), (-radius/2), this.gravityRadius);
        this.gravityField.graphics.endFill();

        this.shape.x = this.x;
        this.shape.y = this.y;

        this.gravityField.x = this.x;
        this.gravityField.y = this.y;
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

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#' + color);
        this.shape.graphics.drawRect((-width / 2), (-height/2), width, height);
        this.shape.graphics.endFill();

        this.shape.x = this.x;
        this.shape.y = this.y;
    };

    Rocket.prototype.update = function() {
        var vector = this.rocketVector.clone();

        for(var i = 0; i < this.workingVectors.length; i++){
            vector.addVector(this.workingVectors[i]);
        }

        var endCoords = vector.getEndCoords();

        this.x += parseFloat(endCoords.x / 100);
        this.y += parseFloat(endCoords.y / 100);

        this.shape.x = this.x;
        this.shape.y = this.y;

        this.shape.rotation = this.vector.getHeading();
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
            this.v = v;
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