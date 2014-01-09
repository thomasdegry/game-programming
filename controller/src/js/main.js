(function(){



var Settings = (function () {

    var Settings = function () {
        this.tips = ['Tip 1', 'Tip 2', 'Tip 3', 'Tip 4', 'Tip 5'];
    };

    return Settings;
})();

/* globals io */
/* globals FastClick */
/* globals alert */
/* globals swipe */
/* globals Settings */

var Controller = (function () {

    function Controller () {
        this.socket = io.connect('http://' + window.location.host);
        this.code = 0;
        this.emitOrientation = true;
        this.emitSpeed = false;
        this.emitTimeout = null;
        this.sliderHeight = undefined;
        this.player = 1;
        this.twoPlayers = false;

        this.settings = new Settings();

        FastClick.attach(document.body);

        if (!window.DeviceOrientationEvent) {
            window.alert('this device cannot be used as a controller');
            return false;
        }

        this.bind();
    }

    Controller.prototype.bind = function() {
        var that = this;

        document.getElementById('game-id-submit').onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            that.code = document.getElementById('game-id').value;

            that.socket.emit('join:request', {code: that.code});
        };

        document.body.ontouchmove = function(e) {
            e.preventDefault();
            var relPosOnScreen = e.pageY / document.height;
            if (relPosOnScreen > 1) {
                relPosOnScreen = 1;
            }else if(relPosOnScreen < 0){
                relPosOnScreen = 0;
            }
            if(that.emitSpeed) {
                that.showSpeedOnControlPanel(1-relPosOnScreen);

                that.socket.emit('speed:change', {speed: 1-relPosOnScreen});
                that.emitSpeed = false;

                that.emitSpeedTimeout = setTimeout(function() {
                    that.emitSpeed = true;
                }, 50);
            }
        };

        this.socket.on('join:accept', function (data) {
            console.log(data);
            that.player = data.player;

            var login = document.getElementById('login');
            var header = document.getElementsByTagName('h1');

            login.parentNode.removeChild(header[0]);
            login.parentNode.removeChild(login);

            $("#speedSlider").removeClass('out');
            that.sliderHeight = $("#speedSlider").height();
        });

        this.socket.on('join:player2', function (data){
            console.log('[CONTROLLER] seccondPlayerHasJoined');

            that.twoPlayers = true;
            switch(that.player){
                case 1:
                    that.emitSpeed = false;
                    $('.speed-o-meter, .speed-instructions').addClass('dim');
                    $('.speed-instructions p').html('Your partner is now controlling the speed...');
                break;

                case 2:
                    that.startLevel();
                    that.emitSpeed = true;
                    $('div.heading-meter, div.heading-instructions').addClass('dim');
                    $('.heading-instructions p').html('Your partner is now controlling the direction...');

                break;
            }
        });

        this.socket.on('gameplay:start', function () {
            console.log('[CONTROLLER] received gameplay:start event through socket');
            that.startLevel();
        });

        this.socket.on('gameplay:restart', function () {
            console.log('[CONTROLLER] received gameplay:restart event through socket');
            switch(that.player){
                case 1:
                    that.startLevel();
                    if (that.twoPlayers) {
                        that.emitSpeed = false;
                        $('.speed-o-meter, .speed-instructions').addClass('dim');
                    }
                break;

                case 2:
                    that.startLevel();
                    that.emitSpeed = true;
                    $('div.heading-meter, div.heading-instructions').addClass('dim');
                break;
            }
        });

        this.socket.on('gameplay:stop', function () {
            console.log('[CONTROLLER] gameplay:stop received');
            that.stopLevel();
        });

        this.socket.on('code:wrong', function() {
            alert('Game not found, please check try again with the correct code');
        });
        this.socket.on('code:full', function() {
            alert('This room is full! :-(');
        });
    };


    Controller.prototype.handleCode = function () {
    };

    Controller.prototype.startLevel = function() {
        var that = this;
        console.log('[CONTROLLER] startLevel');

        var restartButton = document.getElementById('restartButton');
        if(restartButton !== null) {
            restartButton.parentNode.removeChild(restartButton);
        }

        var tip = document.getElementById('tip');
        if(tip !== null) {
            tip.parentNode.removeChild(tip);
        }

        if($("#speedSlider").hasClass('out')) {
            $("#speedSlider").removeClass('out');
        }



        // Start listening for accelerometer
        if (this.player === 1) {
            this.emitOrientation = true;
            this.emitSpeed = true;

            window.addEventListener('deviceorientation', function (e) {
                var tilt = e.gamma;
                if(tilt < -180) {
                    tilt = -180;
                } else if(tilt > 180) {
                    tilt = 180;
                }

                if (that.emitOrientation) {
                    that.socket.emit('move', {tilt: tilt});
                    that.emitOrientation = false;
                    that.showHeadingOnControlPanel(tilt);

                    that.emitTimeout = setTimeout(function () {
                        that.emitOrientation = true;
                    }, 50);
                }
            }, false);
        }
    };

    Controller.prototype.stopLevel = function () {
        console.log('[CONTROLLER] in stopLevel');
        window.removeEventListener('deviceorientation');
        console.log('[CONTROLLER] removedEventListener');
        this.emitOrientation = false;
        this.emitTimeout = null;
        this.emitSpeed = false;
        this.emitSpeedTimeout = null;
        window.removeEventListener('deviceorientation');

        this.showSpeedOnControlPanel(0);
        this.showHeadingOnControlPanel(0);
        $('.dim').removeClass('dim');
        $('#speedSlider').addClass('out');

        var speedSlider = document.getElementById('speedSlider');
        var restartButton = document.createElement('a');
        restartButton.setAttribute('href', '#');
        restartButton.setAttribute('id', 'restartButton');
        restartButton.setAttribute('class', 'out');
        restartButton.innerHTML = 'Restart?';
        document.getElementById('speedSlider').appendChild(restartButton);
        setTimeout(function() {
            $("#restartButton").removeClass('out');
        }, 1);

        var tip = document.createElement('div');
        tip.setAttribute('class', 'out');
        tip.setAttribute('id', 'tip');
        document.getElementById('speedSlider').appendChild(tip);
        $("#tip").html('Tip <span>' + this.settings.tips[Math.floor(Math.random() * this.settings.tips.length)] + '</span>');
        setTimeout(function() {
            $("#tip").removeClass('out');
        }, 1);

        var that = this;
        document.getElementById('restartButton').addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            that.socket.emit('gameplay:restart');
            // that.startLevel();
        });
    };

    Controller.prototype.showHeadingOnControlPanel = function(tilt) {
        var tiltCalculated = ((tilt + 90) / 180) * 100;
        $(".indicator").css({'left': tiltCalculated + '%'});
    };

    Controller.prototype.showSpeedOnControlPanel = function(speed) {
        var speedCalculated = (speed * 180) - 90;
        $(".needle").css({ WebkitTransform: 'rotate(' + speedCalculated + 'deg)'});
    };

    return Controller;

})();

var c = new Controller();

})();