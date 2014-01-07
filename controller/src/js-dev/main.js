/* globals io */
/* globals FastClick */
/* globals alert */
/* globals swipe */

var Controller = (function () {

    function Controller () {
        this.socket = io.connect('http://' + window.location.host);
        this.code = 0;
        this.emitOrientation = true;
        this.emitSpeed = true;
        this.emitTimeout = null;
        this.sliderHeight = undefined;
        this.underConstruction = false;

        FastClick.attach(document.body);

        if (!window.DeviceOrientationEvent) {
            window.alert('this device cannot be used as a controller');
            return false;
        }

        if(this.underConstruction) {
            this.fakeControlPanel();
        } else {
            this.bind();
        }
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
            that.showSpeedOnControlPanel(1-relPosOnScreen);
            that.emitSpeed = true;
            if(that.emitSpeed) {
                // that.socket.emit('speed:change', {speed: relativeFingerHeight});
                that.socket.emit('speed:change', {speed: 1-relPosOnScreen});
                that.emitSpeed = false;

                that.emitSpeedTimeout = setTimeout(function() {
                    that.emitSpeed = true;
                }, 50);
            }
        };

        this.socket.on('join:accept', function (data) {
            var login = document.getElementById('login');
            var header = document.getElementsByTagName('h1');

            login.parentNode.removeChild(header[0]);
            login.parentNode.removeChild(login);

            $("#speedSlider").removeClass('out');
            that.sliderHeight = $("#speedSlider").height();
        });

        this.socket.on('gameplay:start', function () {
            console.log('[CONTROLLER] received gameplay:start event through socket');
            that.startLevel();
        });

        this.socket.on('gameplay:stop', function () {
            console.log('[CONTROLLER] gameplay:stop received');
            that.stopLevel();
        });

        this.socket.on('code:wrong', function() {
            alert('Game not found, please check try again with the correct code');
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
        if($("#speedSlider").hasClass('out')) {
            $("#speedSlider").removeClass('out');
        }

        this.emitOrientation = true;
        this.emitSpeed = true;

        // Start listening for accelerometer
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

        //TODO: WILL BE DEPRECATED
        /*
        $("#speedSlider").swipe({
            swipeStatus:function(event, phase, direction, distance, duration, fingers) {
                if(that.emitSpeed && phase === 'move') {
                    // that.socket.emit('speed:change', {speed: relativeFingerHeight});
                    that.socket.emit('speed:change', {speed: direction});
                    that.emitSpeed = false;

                    that.emitSpeedTimeout = setTimeout(function() {
                        that.emitSpeed = true;
                    }, 17);
                }
            },
            threshold:200,
            maxTimeThreshold:5000,
            fingers:1
        });

        this.socket.on('speed:updated', function(data) {
            that.showSpeedOnControlPanel(data['newSpeed']);
        });*/
    };

    Controller.prototype.stopLevel = function () {
        console.log('[CONTROLLER] in stopLevel');
        window.removeEventListener('deviceorientation');
        console.log('[CONTROLLER] removedEventListener');
        this.emitOrientation = false;
        this.emitTimeout = null;
        this.emitSpeed = false;
        this.emitSpeedTimeout = null;
        $("#speedSlider").swipe("destroy");
        window.removeEventListener('deviceorientation');

        this.showSpeedOnControlPanel(0);
        this.showHeadingOnControlPanel(0);
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


        var that = this;
        document.getElementById('restartButton').addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            that.socket.emit('gameplay:restart');
            that.startLevel();
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

    Controller.prototype.fakeControlPanel = function() {
        document.body.ontouchmove = function(e) { e.preventDefault(); };
        var login = document.getElementById('login');
        var header = document.getElementsByTagName('h1');

        login.parentNode.removeChild(header[0]);
        login.parentNode.removeChild(login);

        $("#speedSlider").removeClass('hide');
        this.sliderHeight = $("#speedSlider").height();

        var that = this;
        window.addEventListener('deviceorientation', function (e) {
            var tilt = e.gamma;
            if(tilt < -90) {
                tilt = -90;
            } else if(tilt > 90) {
                tilt = 90;
            }

            that.showHeadingOnControlPanel(tilt);

        }, false);
    };

    return Controller;

})();

var c = new Controller();