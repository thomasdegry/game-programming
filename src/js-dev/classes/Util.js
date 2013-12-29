var Util =(function () {

    var Util = function () {

    };

    Util.getDistance = function(obj1, obj2) {
        var d = Math.sqrt(Math.pow((obj1.x - obj2.x),2)+Math.pow((obj1.y-obj2.y),2));
        return d;
    };

    return Util;

})();