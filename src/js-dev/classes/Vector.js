var Vector = (function () {

    var x,y,h,v;

    var Vector = function (x,y,h,v) {
            // x en y zijn de startcoordinaten van de vector.
            // deze zijn niet gelijkgesteld aan het nulpunt.
            // h is de heading van de vector in radialen. tussen -Pi en Pi.
            // v is de grotte van de vector. (velocity).
            this.x = x;
            this.y = y;
            this.h = h;
            this.v = v;
    };

    Vector.prototype.addVector = function(vector) {
        // telt de parameter vector op bij de de huidige vector
        // de huidige vector wordt de resulterende vector.
        // het vector punt wordt teruggegeven in een object.
        var endCoords1 = this.getEndCoords();
        var endCoords2 = vector.getEndCoords();

        var endX = endCoords1.x + endCoords2.x;
        var endY = endCoords1.y + endCoords2.y;

        this.h = Math.atan(endY/endX);
        if(endX >= 0){
            this.h += Math.PI;
        }


        this.v = Math.sqrt(Math.pow(endX,2)+Math.pow(endY,2));
        return {x:this.x + endX,y:this.y + endY};
    };

    Vector.prototype.getEndCoords = function(){
        // geeft een object terug met daarin de x en y van de staart van de vector.
        // deze zijn relatieve waarden aan de startpunten van de vector.
        var newY = -this.v * Math.sin(this.h);
        var newX = Math.sqrt(Math.pow(this.v,2)-Math.pow(newY,2));
        if(this.h <= Math.PI/2 || this.h >= 1.5*Math.PI){
            newX = -newX;
        }

        return {x:newX,y:newY};
    };

    Vector.prototype.clone = function() {
        var clone = new Vector(this.x,this.y,this.h,this.v);
        return clone;
    };

    return Vector;
})();