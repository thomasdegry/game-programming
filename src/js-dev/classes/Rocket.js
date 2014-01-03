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

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#' + color);
        this.shape.graphics.drawPolyStar(0, 0, width, 3, 0, 180);
        this.shape.graphics.endFill();
        this.shape.scaleX = 4.5;
        this.shape.scaleY = 2.4;

        this.rocketImg = new createjs.Bitmap('img/rocket.png');

        this.zero = new createjs.Shape();
        this.zero.graphics.beginFill('#ff0000');
        this.zero.graphics.drawCircle(-(width/2), (-height/2), 1);
        this.zero.graphics.endFill();

        this.shape.x = this.x - (this.width / 2);
        this.shape.y = this.y - (this.width / 2);

        this.rocketImg.x = this.x - 74;
        this.rocketImg.y = this.y - 43;

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

    Rocket.prototype.dieOnce = function() {
        this.remainingLives--;
    };

    return Rocket;
})();