var RocketManipulator = (function () {

    var RocketManipulator = function (x, y) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.type = 'up';
        this.isUsed = false;

        this.container = new createjs.Container();

        this.arrows = new createjs.Bitmap('img/manipulator.png');
        this.arrows.x = this.x;
        this.arrows.y = this.y;
        this.container.addChild(this.arrows);

        if(Math.floor(Math.random() * 100) < 50) {
            this.type = 'down';
            this.arrows.rotation = 180;
        }
    };

    RocketManipulator.prototype.update = function() {
        this.arrows.x = this.x;
        this.arrows.y = this.y;
        this.isUsed = false;
    };

    return RocketManipulator;
})();