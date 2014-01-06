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
        //WAAROM VOEG JE DIE TOE IN ZICHZELF?
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