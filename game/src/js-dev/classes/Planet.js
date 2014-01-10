/* globals TweenMax:true, Sine:true */
var Planet = (function () {

    var Planet = function (x, y, radius) {
        _.bindAll(this);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.gravityRadius = radius + 50 + Math.floor(Math.random() * 100);

        this.container = new createjs.Container();

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
        var randomColorDecider = Math.floor(Math.random() * 100);
        if(randomColorDecider < 33) {
            this.planetImg = new createjs.Bitmap('img/planet.png');
        } else if(randomColorDecider >= 33 && randomColorDecider < 66) {
            this.planetImg = new createjs.Bitmap('img/planet-blue.png');
        } else {
            this.planetImg = new createjs.Bitmap('img/planet-orange.png');
        }
        this.planetImg.scaleX = (1/254) * (radius * 2);
        this.planetImg.scaleY = (1/247) * (radius * 2);
        this.container.addChild(this.planetImg);

        // console.log('planeet met - ' + (254 * this.planetImg.scaleX / 2) + ' en width van ' + (this.radius * 2));
        this.planetImg.x = this.x - (Math.floor(127 * this.planetImg.scaleX)) - (this.radius / 2);
        this.planetImg.y = this.y - (Math.floor(123.5 * this.planetImg.scaleY)) - (this.radius / 2);

        this.stroke.x = this.x;
        this.stroke.y = this.y;

        this.gravityField.x = this.x;
        this.gravityField.y = this.y;

        var time = Math.floor(Math.random()*3)+2;

        TweenMax.to(this.container, time, {y: ++time * 7, yoyo:true, repeat:-1, ease:Sine.easeInOut});
        TweenMax.to(this.planetImg, time, {y: this.planetImg.y + 10, yoyo:true, repeat:-1, ease:Sine.easeInOut});
        TweenMax.to(this.planetImg, time, {rotation: 10, yoyo:true, repeat:-1, ease:Sine.easeInOut});
    };

    Planet.prototype.update = function(multiplier) {
        // this.gravityRadius = (this.radius + Math.floor(Math.random() * 200)) * multiplier;
        this.gravityRadius = this.radius + 50 + Math.floor(Math.random() * (100 * multiplier));
        var newRadius = this.radius * multiplier;

        var randomColorDecider = Math.floor(Math.random() * 100);
        if(randomColorDecider < 33) {
            this.planetImg = new createjs.Bitmap('img/planet.png');
        } else if(randomColorDecider >= 33 && randomColorDecider < 66) {
            this.planetImg = new createjs.Bitmap('img/planet-blue.png');
        } else {
            this.planetImg = new createjs.Bitmap('img/planet-orange.png');
        }
        this.planetImg.scaleX = (1/254) * (newRadius * 2);
        this.planetImg.scaleY = (1/247) * (newRadius * 2);
        this.container.addChild(this.planetImg);

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