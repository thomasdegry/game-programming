var Rocket = (function () {

    var Rocket = function (x, y, width, height, color, vector) {
        _.bindAll(this);

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vector = vector;

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#' + color);
        this.shape.graphics.drawRect((-width / 2), (-height/2), width, height);
        this.shape.graphics.endFill();

        this.shape.x = this.x;
        this.shape.y = this.y;
    };

    Rocket.prototype.update = function() {
        var vector = this.vector.clone();
        var endCoords = vector.getEndCoords();

        this.shape.x += parseFloat(endCoords.x / 100);
        this.shape.y += parseFloat(endCoords.y / 100);

        this.shape.rotation = this.vector.getHeading();
    };

    return Rocket;
})();