var Discord = require('discord.js');
var exec = require('child_process').exec;
var Table = require('easy-table');

var asmbot = new Discord.Client();

function strncmp(a, b, n){
    return a.substring(0, n) == b.substring(0, n);
}

function formatHexString(hex) {
    var newhex = "";
    for (var i = 0; i < hex.length; i+=2) {
        if (strncmp(hex, "0x", 2)) break;
        if (hex[i] == "x") continue;

        newhex += "0x"+hex.substr(i, 2)+" ";
    }
    return newhex;
}

function getHexString(str) {
    var output = str;
    output = output.replace(/@/g, "");
    output = output.replace(/\[/g, "");
    output = output.replace(/0x/g, "");
    output = output.replace(/,/g, "");
    output = output.replace(/\]/g, "");
    return output.toUpperCase();
}

function getInstrString(str) {
    str = str.replace(/\s{2,}/g, ' ').replace("\n", "").substr(str.lastIndexOf(".text")+6);
    console.log(str);
    return str.toUpperCase();
}

function commandIsValid(array) {
    if (array[1] !== "asm" && array[1] !== "hex") return false;
    var arch = array[2].toLowerCase();
    if (arch !== "armv7" && arch !== "thumb" && arch !== "arm64" && arch !== "x86" && arch !== "x64") return false;
    return true;
}

function makeCommand(array) {
    var methodStr = array[1];
    var method = (methodStr == "asm") ? "-assemble -show-encoding" : "-disassemble";

    var archStr = array[2];
    if (archStr == "armv7") var arch = "armv7";
    if (archStr == "thumb") var arch = "thumbv7";
    if (archStr == "arm64") var arch = "aarch64";
    if (archStr == "x86") var arch = "x86";
    if (archStr == "x64") var arch = "x86-64";

    var code = array.slice(3).join(" ");
    code = code.replace(";", "\n");
    if (methodStr == "hex") {
        code = formatHexString(code);
    }

    var out = {
        method : method,
        prettyMethod : array[1],
        arch : arch,
        code : code
    };

    return out;
}

function createHexTable(asm, hex) {
    var t = new Table;
    var data = [
        {
            asm: asm,
            hex: hex,
            xeh: "TODO ;)"
        }
    ];

    data.forEach(function(converted) {
        t.cell("Arm", converted.asm);
        t.cell("Hex", converted.hex);
        t.cell("Hex (Big Endian)", converted.xeh);
        t.newRow();
    });
    return t;
}

function convert(bot, message) {
    var content = message.content;
    var commands = content.split(' ');

    if (!commandIsValid(commands)) {
        message.reply("Invalid format. Please run `>help` for help");
        return;
    }

    var command = makeCommand(commands);
    console.log(command.code);
    var execString = "printf \"$CODE\" | ./llvm-mc $METHOD -triple=$ARCH";

    execString = execString.replace("$CODE", command.code);
    execString = execString.replace("$METHOD", command.method);
    execString = execString.replace("$ARCH", command.arch);
    console.log(execString);

    exec(execString, function(err, stdout, stderr) {
        if (err || stderr) {
            message.reply("An error has occured while trying to convert `" + command.code + "`. Please use `>help` for help");
            return;
        }

        var t = null;
        if (command.prettyMethod == "asm") {
            var hex = getHexString(stdout.substring(stdout.indexOf("[")));
            hex = hex.replace("\n", "");
            t = createHexTable(command.code.toUpperCase(), hex);
        }
        else {
            var asm = getInstrString(stdout);
            t = createHexTable(asm, command.code);
        }
        console.log(t.toString());
        message.reply("```\n"+t.toString()+"```\n");
    });
}

var commands = {
    "convert" : {
        usage : ">convert [asm|hex] [armv7|thumb|arm64] {code}",
        task : convert
    },
    "armv7" : {
        usage : ">armv7 {code} - shortcut for >convert asm armv7 {code}",
        task : function(bot, message) {
            var content = message.content;
            var code = content.split(" ").slice(1).join(" ");
            message.content = ">convert asm armv7 " + code;
            convert(bot, message);
        }
    },
    "thumb" : {
        usage : ">thumb {code} - shortcut for >convert asm thumb {code}",
        task : function(bot, message) {
            var content = message.content;
            var code = content.split(" ").slice(1).join(" ");
            message.content = ">convert asm thumb " + code;
            convert(bot, message);
        }
    },
    "arm64" : {
        usage : ">arm64 {code} - shortcut for >convert asm arm64 {code}",
        task : function(bot, message) {
            var content = message.content;
            var code = content.split(" ").slice(1).join(" ");
            message.content = ">convert asm arm64 " + code;
            convert(bot, message);
        }
    },
    "help" : {
        usage : ">help",
        task : function(bot, message) {
            var str = "**__Commands:__** \n ```";
            for (var key in commands) {
                if (commands.hasOwnProperty(key)) {
                    str += "    \"" + commands[key].usage + "\"\n";
                }
            }
            str += "```";
            bot.sendMessage(message.channel, str);
        }
    }
}

asmbot.on("message", function(msg) {
    var content = msg.content;
    if (content[0] !== '>') return;
    var commandStr = content.split(' ')[0].substring(1);
    var command = commands[commandStr];
    if (command) {
        command.task(asmbot, msg);
    }
});

asmbot.on("ready", function() {
    asmbot.setPlayingGame("IDA Pro");
});

asmbot.loginWithToken("Bot MTkyNjkxNDEzNzQ4NTQ3NTg0.CkMhXQ.WvP340EV9JKN23WFqDAnhoI5jeY", function(error, token) {
    console.log(error);
});
