(function(){



/* globals io */
/* globals FastClick */
/* globals alert */
/* globals swipe */

var Controller = (function () {

    function Controller () {
        this.socket = io.connect('http://' + window.location.host);
        this.code = 0;
        this.emit = true;
        this.emitTimeout = null;
        this.sliderHeight = undefined;

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

        document.body.ontouchmove = function(e) { e.preventDefault(); };

        this.socket.on('join:accept', function (data) {
            var login = document.getElementById('login');
            var header = document.getElementsByTagName('h1');

            login.parentNode.removeChild(header[0]);
            login.parentNode.removeChild(login);

            $("#speedSlider").removeClass('hide');
            that.sliderHeight = $("#speedSlider").height();
        });

        this.socket.on('gameplay:start', function () {
            console.log('[CONTROLLER] received gameplay:start event through socket');
            that.startLevel();
        });

        this.socket.on('gameplay:stop', function () {
            that.stopLevel();
        });
    };

    Controller.prototype.handleCode = function () {
    };

    Controller.prototype.startLevel = function() {
        var that = this;

        this.emit = true;
        this.emitSpeed = true;

        // Start listening for accelerometer
        window.addEventListener('deviceorientation', function (e) {
            var tilt = e.gamma;
            if (that.emit) {
                that.socket.emit('move', {tilt: tilt});
                that.emit = false;

                that.emitTimeout = setTimeout(function () {
                    that.emit = true;
                }, 17);
            }
        }, false);

        $("#speedSlider").swipe({
            swipeStatus:function(event, phase, direction, distance, duration, fingers) {
                // var relativeFingerHeight = event.pageY / that.sliderHeight;
                // if(relativeFingerHeight > 1) {
                //     relativeFingerHeight = 1;
                // } else if(relativeFingerHeight < 0) {
                //     relativeFingerHeight = 0;
                // }

                if(that.emitSpeed && phase === 'move') {
                    // that.socket.emit('speedchange', {speed: relativeFingerHeight});
                    that.socket.emit('speedchange', {speed: direction});
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
    };

    Controller.prototype.stopLevel = function () {
        this.emit = false;
        this.emitTimeout = null;
        window.removeEventListener('deviceorientation');
        //document.getElementById('jump').removeEventListener('click');
    };

    return Controller;

})();

var c = new Controller();

})();