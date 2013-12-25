(function(){

var Settings =(function () {

    var Settings = function () {

    };

    return Settings;

})();

/* globals Vector:true, createjs:true */
var Game = (function () {

    var Game = function () {
        _.bindAll(this);

        this.h1 = -Math.PI / 2;
        this.h2 = -Math.PI / 2;
        this.v1 = 1;
        this.v2 = 1;

        this.vector1 = new Vector(0, 0, this.h1, this.v1);
        this.vector2 = new Vector(0, 0, this.h2, this.v2);

        this.stage = new createjs.Stage("canvas");
        this.stage.canvas.width = 300;
        this.stage.canvas.height = 500;

        this.ship = new createjs.Shape();
        this.ship.graphics.beginFill('#262626');
        this.ship.graphics.drawRect(-5, -10, 10, 20);
        this.ship.graphics.endFill();

        this.ship.x = 160;
        this.ship.y = 495;
        this.ship.rotation = 0;

        this.stage.addChild(this.ship);

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

        this.ship.x = x;
        this.ship.y = y;
    };

    Game.prototype.keyDownHandler = function(event) {
        switch(event.keyCode) {
            case 38:
                //up
                this.vector1.v += 100;
                break;

            case 40:
                //down
                this.vector1.v -= 100;
                break;

            case 37:
                //left
                this.vector1.h -= 0.1;
                console.log(this.vector1.h);
                break;

            case 39:
                //right
                this.vector1.h += 0.1;
                console.log(this.vector1.h);
                break;
        }
    };

    Game.prototype.tickHandler = function(event) {
        var vector = this.vector1.clone();
            vector.addVector(this.vector2);
        var endCoords = vector.getEndCoords();

        this.ship.x += parseFloat(endCoords.x / 100);
        this.ship.y += parseFloat(endCoords.y / 100);

        this.ship.rotation = vector.h * 57.2957795;

        this.stage.update();
        this.draw();
    };

    Game.prototype.draw = function() {
    };

    return Game;
})();

var Vector = (function () {

    var x,y,h,v;

    var Vector = function (x,y,h,v) {
            // x en y zijn de startcoordinaten van de vector.
            // deze zijn niet gelijkgesteld aan het nulpunt.
            // h is de heading van de vector in radialen. tussen -Pi en Pi.
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

    Vector.prototype.clone = function() {
        var clone = new Vector(this.x,this.y,this.h,this.v);
        return clone;
    };

    return Vector;
})();

/* globals Game:true */
var game = new Game();

})();