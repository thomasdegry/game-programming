/* globals buzz: true */
var Soundboard = (function (){
    var Soundboard = function(){
        this.lobbyloop = new buzz.sound('sound/lobby.mp3',{preload: true, loop: true});
        this.gameloop = new buzz.sound('sound/game.mp3',{preload: true, loop: true});
        this.endgame = new buzz.sound('sound/endgame.mp3',{preload: true, loop: false});
        this.boost = new buzz.sound('sound/boost.mp3',{preload: true, loop: false});
        this.break = new buzz.sound('sound/enginebreak.mp3',{preload: true, loop: false});
        this.lostlife = new buzz.sound('sound/lostlife.mp3',{preload: true, loop: false});
        this.newlife = new buzz.sound('sound/newlife.mp3',{preload: true, loop: false});
        this.invincible = new buzz.sound('sound/invincible.mp3',{preload: true, loop: true});
        this.rocketloop = new buzz.sound('sound/rocketloop.mp3',{preload: true, loop: true});
        this.rocketloop.setVolume(0);
    };

    return Soundboard;
})();