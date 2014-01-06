var Rocket = (function () {

    var Rocket = function (x, y, vector) {
        _.bindAll(this);

        this.x = x;
        this.y = y;
        this.rocketVector = vector;
        this.workingVectors = [];
        this.remainingLives = 2;

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

        this.sprite = new createjs.Sprite(this.RocketAnim,'fly');
        this.sprite.framerate = 10;
        this.sprite.regX = 24;
        this.sprite.regY = 52;
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.identifier = undefined;

        //TODO: wat is dit?
        // this.zero = new createjs.Shape();
        // this.zero.graphics.beginFill('#ff0000');
        // this.zero.graphics.drawCircle(-(width/2), (-height/2), 1);
        // this.zero.graphics.endFill();


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

        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.sprite.rotation = this.rocketVector.getHeading() - 90;

        this.workingVectors = [];
    };

    Rocket.prototype.updateHeading = function(heading) {
        //de checks dienen om de raket niet terug naar beneden te laten vliegen.
        if(this.rocketVector.h <= Math.PI || this.rocketVector.h !== 0){
            this.rocketVector.setHeading(this.rocketVector.h + heading);
            if(this.rocketVector.h > Math.PI && heading > 0){
                this.rocketVector.h = Math.PI;
            }else if(this.rocketVector.h > Math.PI && heading < 0){
                this.rocketVector.h = 0;
            }
        }
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