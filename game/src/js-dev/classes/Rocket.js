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