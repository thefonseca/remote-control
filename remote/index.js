var net = require('net');
var commands = require('./commands');
var macros = require('./macros');

var HOST = '192.168.0.56';
var PORT = 4998;
var DEFAULT_MODULE = 1;
var DEFAULT_CONNECTOR = 3;
var DEFAULT_CMD_ID = 1;

var client = null;
var command_queue = [];
var clientTimeout;
var last_repeat_command;

function connect(callback) {

    client = new net.Socket();
    client.connect(PORT, HOST, function() {

        console.log('CONNECTED TO: ' + HOST + ':' + PORT);
        callback();
    });

    // Add a 'data' event handler for the client socket
    // data is what the server sent to this socket
    client.on('data', function(data) {

        console.log('DATA: ' + data);
        var next_cmd = command_queue.shift();

        if (next_cmd) {

            if (isNumber(next_cmd[1])) {

                var delay = 0;

                while (isNumber(next_cmd[1])) {
                    delay += next_cmd[1];
                    next_cmd = command_queue.shift();
                }

                console.log('Scheduling next command - ' + delay + ' milliseconds');

                setTimeout(function() {
                    write_command(next_cmd[0], next_cmd[1]);
                }, delay);

            } else {
                write_command(next_cmd[0], next_cmd[1]);
            }

        } else {
            clientTimeout = setTimeout(function() {
                if (client) {
                    client.end();
                }
            }, 60000);
        }
    });

    client.on('end', function() {
        console.log('Connection end');
        client = null;
    });

    // Add a 'close' event handler for the client socket
    client.on('close', function() {
        console.log('Connection closed');
        client = null;
    });


    client.on('error', function() {
        console.log('Connection error');

        try {
            client.destroy();

        } catch (e) {
            console.log(e.message);
        }
        client = null;
    });

}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function process_commands(device, cmd_name, repeat) {

    var key = device;

    if (cmd_name) {
        key += "_" + cmd_name;
    }

    if (!commands[key]) {
        return;
    }

    if (commands[key] instanceof Array) {

        for (var i = 0; i < commands[key].length; i++) {

            if (isNumber(commands[key][i])) {
                command_queue.push(new Array('delay', commands[key][i]));

            } else {
                process_commands(commands[key][i], null);
            }
        }

    } else if (commands[key].name) { // an object with ir command data

        if (!repeat) {
            repeat = commands[key].repeat;
        }

        cmd_str = buildCommandStr(commands[key], command_queue.length + 1, repeat);
        command_queue.push(new Array(key, cmd_str));

    } else { // a string command like sendir,1:3,1,37650,1,1,342,169,..., 3765\r

        //console.log('pushing (' + key + ", " + commands[key] + ")")
        command_queue.push(new Array(key, commands[key]));
    }
}

function buildCommandStr(cmd, id, repeat) {

    if (!repeat) {
        repeat = 1;
    }

    var offset = cmd.offset;
    if (!offset || repeat === 1) {
        offset = 1;
    }

    var cmd_str = cmd.name + "," + cmd.module + ":" + cmd.connector;

    if (cmd.name === "sendir") {
        cmd_str += "," + id + "," + cmd.frequency;

        if (cmd.repeat_timing_pattern && repeat > 1) {

            cmd_str += ",1,1," + cmd.timing_pattern;

            for (i = 0; i < repeat; i++) {
              cmd_str += "," + cmd.repeat_timing_pattern;
            }

        } else {
            cmd_str += "," + repeat + "," + offset
                    + "," + cmd.timing_pattern;
        }
    }

    cmd_str += "\r";

    return cmd_str;
}

function write_command(name, cmd) {

    if (!client) {

        connect(function() {
            console.log('Sending first command ' + name);
            client.write(cmd);
        });

    } else {
        console.log('Sending command ' + name);
        //console.log(cmd);
        client.write(cmd);
    }
}

exports.send_command = function(device, cmd, repeat) {
    //command_queue = [];

    // reject new commands if queue still has elements
    if (command_queue.length) {
        return {success: false, message: 'Failed to send command ' + cmd + ' to device ' + device + '(repeat = ' + repeat + ') - device busy!'};
    }

    clearTimeout(clientTimeout);

    process_commands(device, cmd, repeat);
    var first_cmd = command_queue.shift();

    if (first_cmd) {//  && !client) {
        write_command(first_cmd[0], first_cmd[1]);
        return {success: true, message: 'Command ' + cmd + ' successfully sent to ' + device + '(repeat = ' + repeat + ')'};
    }

    return {success: false, message: 'Failed to send command ' + cmd + ' to device ' + device + '(repeat = ' + repeat + ')'};
}

exports.get_macros = function() {
    return macros;
}

