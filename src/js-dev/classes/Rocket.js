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
        this.shape.graphics.drawRect((-width / 2), (-height/2), width, height);
        this.shape.graphics.endFill();

        this.shape.x = this.x;
        this.shape.y = this.y;
    };

    Rocket.prototype.update = function() {
        var vector = this.rocketVector.clone();

        for(var i = 0; i < this.workingVectors.length; i++){
            vector.addVector(this.workingVectors[i]);
        }

        var endCoords = vector.getEndCoords();

        this.x += parseFloat(endCoords.x / 100);
        this.y += parseFloat(endCoords.y / 100);

        this.shape.x = this.x;
        this.shape.y = this.y;

        this.shape.rotation = this.rocketVector.getHeading();

        this.workingVectors = [];
    };

    Rocket.prototype.dieOnce = function() {
        this.remainingLives--;
    };

    return Rocket;
})();