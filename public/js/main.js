var sound = new Audio("/sounds/button.mp3");

function BlockMove(event) {
    // Tell Safari not to move the window.
    event.preventDefault();
}

function cmd2Url(cmd) {

    var split = cmd.split("_");

    if (split && split.length > 1) {
        var action = split[split.length - 1];
        var device = cmd.replace("_" + action, "");
        var result = "/device/" + device + "/" + action;
        return result;
    }

    return null;
}

function cmd2Obj(cmd) {

    var split = cmd.split("_");

    if (split && split.length > 1) {
        var cmdObj = {};
        cmdObj.command = split[split.length - 1];
        cmdObj.device = cmd.replace("_" + cmdObj.command, "");
        return cmdObj;
    }

    return null;
}

function executeCommand(cmd, repeat) {

    if (!repeat) {
      repeat = 1;
    }

    var linkPatt = new RegExp(/^#.+/);
    // iOS URL Scheme
    var urlPatt = new RegExp(/.+:\/\/$/);

    if (linkPatt.test(cmd)) {//cmd.startsWith("#")) {
        $.mobile.changePage(cmd, {transition: "pop"});

    } else if (urlPatt.test(cmd)) {
        window.location = cmd;

    } else {
        //$.get(cmd2Url(cmd));
        // no more ajax... socket IO!
        var cmdObj = cmd2Obj(cmd);
        socket.emit('control', { dev: cmdObj.device, cmd: cmdObj.command, repeat: repeat });
    }
}

var socket = io.connect(window.location.origin);
socket.on('result', function (data) {
    console.log(data.message);
});

var current_event_type;
var tapHoldCounter = 0;
var tapholdTimer;

$(document).ready(function() {

    $.event.special.tap.emitTapOnTaphold = false;

    $(".ui-bar").on("jGestures.touchstart", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        console.log(obj);

        // stopping repeating IR
        var cmd_stop = $(".command-grid").attr("data-cmd-stop");
        if (cmd_stop) {
            executeCommand(cmd_stop);
        }

        var initialEvent = event;
        tapholdTimer = setInterval(function () {

            console.log($(initialEvent.target).attr("data-cmd-taphold"));

            var cmd = $(initialEvent.target).attr("data-cmd-taphold");

            if (!cmd) {
                sound.play();
                cmd = $(initialEvent.target).attr("data-cmd-tap");
                executeCommand(cmd, 8);

            } else if (tapHoldCounter === 0) {
                sound.play();
                executeCommand(cmd);
            }

            tapHoldCounter++;
        }, 750);

        return false;
    });

    /*$(".command-grid").on("pinchopen", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        // no more taphold
        clearInterval(tapholdTimer);
        tapHoldCounter = 0;

        console.log("pinchopen");
        return false;
    });

    $(".command-grid").on("pinchclose", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        // no more taphold
        clearInterval(tapholdTimer);
        tapHoldCounter = 0;

        console.log("pinchclose");
        return false;
    });

    $(".command-grid").on("rotatecw", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        // no more taphold
        clearInterval(tapholdTimer);
        tapHoldCounter = 0;

        console.log("rotatecw");
        return false;
    });

    $(".command-grid").on("rotateccw", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        // no more taphold
        clearInterval(tapholdTimer);
        tapHoldCounter = 0;

        console.log("rotateccw");
        return false;
    });*/

    $(".command-grid").on("shake", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        sound.play();
        console.log("shake!");
        return false;
    });

    $(".ui-bar").on("tapone", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        // end of taphold
        clearInterval(tapholdTimer);

        // stopping repeating IR
        var cmd_stop = $(".command-grid").attr("data-cmd-stop");
        if (tapHoldCounter > 1 && cmd_stop) {
            executeCommand(cmd_stop);
        }

        tapholdTimer = null;
        tapHoldCounter = 0;

        if (obj.duration > 200) {
            return;
        }

        sound.play();
        console.log(obj);

        var cmd = $(this).attr("data-cmd-tap");

        if (!cmd) {
            return false;
        }

        executeCommand(cmd);

        return false;
    });

    /*$(".command-grid").on("swipeleft swiperight swipeup swipedown", function(event) {
        event.preventDefault();
        event.stopPropagation();
        sound.play();

        var cmd = $(this).attr("data-cmd-" + event.type);
        console.log("comando: " + cmd);
        if (cmd) {
            $.get(cmd2Url(cmd));
        }

        //console.log(event.type);
        return false;
    });*/

    $(".command-grid").on("swipeone", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        //console.log("swipeone!!!");
        current_event_type = null;

        // no more taphold
        clearInterval(tapholdTimer);
        tapHoldCounter = 0;

        // stopping repeating IR
        var cmd_stop = $(".command-grid").attr("data-cmd-stop");
        if (tapHoldCounter > 1 && cmd_stop) {
            executeCommand(cmd_stop);
        }

        return false;
    });

    var totalMovedX = 0;
    var totalMovedY = 0;

    $(".command-grid").on("swipemove", function(event, obj) {
        event.preventDefault();
        event.stopPropagation();

        // no more taphold
        clearInterval(tapholdTimer);
        tapHoldCounter = 0;

        if (obj.originalEvent.touches.length > 1) {
            console.log("no swipe!");
            return;
        }

        var deltaX = obj.delta[0].lastX;
        var deltaY = obj.delta[0].lastY;

        totalMovedX += Math.abs(deltaX);
        totalMovedY += Math.abs(deltaY);

        if (totalMovedY > 80 || totalMovedX > 60) {
            //console.log(obj.delta[0].moved);

            totalMovedX = 0;
            totalMovedY = 0;
            //console.log(obj);
            var description = obj.description.split(":");
            var axis_x = description[2];
            var axis_y = description[3];
            var event_type = "swipe";

            // considera direcao predominante
            if (Math.abs(deltaY) < Math.abs(deltaX) * 0.4) {
                axis_y = '';
            } else if (Math.abs(deltaY) >= Math.abs(deltaX) * 1.4) {
                axis_x = '';
            }

            if (axis_x !== "steady") {
                event_type += axis_x;
            }

            if (axis_y !== "steady") {
                event_type += axis_y;
            }

            console.log(event_type);

            if (!current_event_type) {
                current_event_type = event_type;
            }

            if (event_type === "swipedown"
                  || event_type === "swipeup"
                  || event_type === "swiperight"
                  || event_type === "swipeleft") {

                var cmd = $(this).attr("data-cmd-" + event_type);

                if (cmd) {
                    sound.play();
                    console.log("comando: " + cmd);

                    // acceleration => repeats
                    var repeat;
                    if (axis_y !== '' && Math.abs(deltaY) > 6) {
                        repeat = Math.abs(deltaY * 0.5);

                    } else if (axis_x !== '' && Math.abs(deltaX) > 6) {
                        repeat = Math.abs(deltaX * 0.5);
                    }

                    executeCommand(cmd, repeat);
                }
                //console.log(obj);
            }
        }

        return false;
    });

});
