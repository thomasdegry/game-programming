var Util =(function () {

    var Util = function () {

    };

    Util.getDistance = function(obj1, obj2) {
        var d = Math.sqrt(Math.pow((obj1.x - obj2.x),2)+Math.pow((obj1.y-obj2.y),2));
        return d;
    };

    Util.getAngle = function(obj1, obj2){
        var angle = Math.atan(Math.abs(obj1.y-obj2.y)/Math.abs(obj1.x-obj2.x));

        if (obj2.x < obj1.x && obj2.y > obj1.y || obj2.x > obj1.x && obj2.y < obj1.y) {
            angle = Math.PI - angle;
        }
        if (obj2.y < obj1.y) {
            angle += Math.PI;
        }

        if (angle < 0) {
            angle = angle + 2*Math.PI;
        }
        if (angle > 2*Math.PI) {
            angle = angle - 2*Math.PI;
        }
        return angle;
    };

    Util.proceedZeros = function(score) {
        if(score.toString().length === 1) {
            return "0000" + score;
        } else if(score.toString().length === 2) {
            return "000" + score;
        } else if(score.toString().length === 3) {
            return "00" + score;
        } else if(score.toString().length === 4) {
            return "0" + score;
        } else {
            return score;
        }
    };

    return Util;

})();