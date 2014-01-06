var Planet = (function () {

    var Planet = function (x, y, radius) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.gravityRadius = radius + Math.floor(Math.random() * 200);

        this.container = new createjs.Container();

        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill('#FF0000');
        this.shape.graphics.drawCircle((-radius / 2), (-radius/2), radius);
        this.shape.graphics.endFill();

        this.gravityField = new createjs.Shape();
        this.gravityField.graphics.beginStroke("#3f3a49").setStrokeStyle(2).beginFill("#484356");
        this.gravityField.graphics.drawCircle((-radius / 2), (-radius/2), this.gravityRadius);
        this.gravityField.graphics.endFill();
        this.gravityField.alpha = 0.1;
        this.container.addChild(this.gravityField);

        this.stroke = new createjs.Shape();
        this.stroke.graphics.beginStroke("#3f3a49").setStrokeStyle(2);
        this.stroke.graphics.drawCircle((-radius / 2), (-radius/2), this.gravityRadius);
        this.stroke.graphics.endFill();
        this.container.addChild(this.stroke);

        // planeet img is 254 * 247px
        this.planetImg = new createjs.Bitmap('img/planet.png');
        this.planetImg.scaleX = (1/254) * (radius * 2);
        this.planetImg.scaleY = (1/247) * (radius * 2);
        this.container.addChild(this.planetImg);

        this.shape.x = this.x;
        this.shape.y = this.y;

        // console.log('planeet met - ' + (254 * this.planetImg.scaleX / 2) + ' en width van ' + (this.radius * 2));
        this.planetImg.x = this.x - (Math.floor(127 * this.planetImg.scaleX)) - (this.radius / 2);
        this.planetImg.y = this.y - (Math.floor(123.5 * this.planetImg.scaleY)) - (this.radius / 2);

        this.stroke.x = this.x;
        this.stroke.y = this.y;

        this.gravityField.x = this.x;
        this.gravityField.y = this.y;
    };

    Planet.prototype.update = function(multiplier) {
        this.shape.x = this.x;
        this.shape.y = this.y;

        this.gravityRadius = (this.radius + Math.floor(Math.random() * 200)) * multiplier;
        var newRadius = this.radius * multiplier;

        this.gravityField.graphics.clear();
        this.gravityField.graphics.beginStroke("#3f3a49").setStrokeStyle(2).beginFill("#484356");
        this.gravityField.graphics.drawCircle((-this.radius / 2), (-this.radius/2), this.gravityRadius);
        this.gravityField.graphics.endFill();
        this.gravityField.alpha = 0.1;

        this.stroke.graphics.clear();
        this.stroke.graphics.beginStroke("#3f3a49").setStrokeStyle(2);
        this.stroke.graphics.drawCircle((-this.radius / 2), (-this.radius/2), this.gravityRadius);
        this.stroke.graphics.endFill();

        this.planetImg.x = this.x - (Math.floor(127 * this.planetImg.scaleX)) - (this.radius / 2);
        this.planetImg.y = this.y - (Math.floor(123.5 * this.planetImg.scaleY)) - (this.radius / 2);

        this.gravityField.x = this.x;
        this.gravityField.y = this.y;

        this.stroke.x = this.x;
        this.stroke.y = this.y;
    };

    return Planet;
})();