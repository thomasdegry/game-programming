/* globals TweenMax:true */
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

    return Rocket;
})();