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