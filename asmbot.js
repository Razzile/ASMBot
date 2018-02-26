// const Discord = require('discord.js');
// const exec = require('child_process').exec;
// const Table = require('easy-table');

// const asmbot = new Discord.Client();

'use strict';

const sprintf = require('sprintf-js').sprintf;
const cs = require('./capstone.js');
const ks = require('./keystone.js');
const Table = require('easy-table');
const Discord = require('discord.js');

const token = require('./token.json').token;

const bot = new Discord.Client();

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}


function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join("");
}

function createHexTable(asm, hex, xeh) {
    let t = new Table;
    let data = [
        {
            asm: asm,
            hex: hex,
            xeh: xeh
        }
    ];

    data.forEach(converted => {
        t.cell("ASM", converted.asm.toUpperCase());
        t.cell("Hex", converted.hex.toUpperCase());
        t.cell("Hex (Big Endian)", converted.xeh.toUpperCase());
        t.newRow();
    });
    return t;
}

function createHexEmbed(asm, hex, xeh) {
  const embed = new Discord.RichEmbed();
  embed.setColor("#33ccff");
  embed.addField("ASM", asm.toUpperCase(), true);
  embed.addField("Hex", hex.toUpperCase(), true);
  embed.addField("Hex (Big Endian)", xeh.toUpperCase(), true);

  return embed;
}

function createInstrTable(hex, instr) {
    let t = new Table;
    let data = [
        {
            hex: hex,
            instr: instr
        }
    ];

    data.forEach(converted => {
        t.cell("Hex", converted.hex.toUpperCase());
        t.cell("Instruction", converted.instr.toUpperCase());
        t.newRow();
    });
    return t;
}

function createInstrEmbed(hex, instr) {
  const embed = new Discord.RichEmbed();
  embed.setColor("#33ccff");
  embed.addField("Hex", hex.toUpperCase(), true);
  embed.addField("Instruction", instr.toUpperCase(), true);

  return embed;
}

function disasm(arch, mode, data) {
    const engine = new cs.Cs(arch, mode);
    let instrString = "";
    // Output: Array of capstone.Instruction objects
    let instructions = engine.disasm(data, 0x0);
    instructions.forEach((instr) => {
        instrString += sprintf("%s %s", instr.mnemonic, instr.op_str);
    });

    engine.delete();
    return instrString;
}

function asm(arch, mode, data) {
    const engine = new ks.Keystone(arch, mode);

    let hex = engine.asm(data, 0x0);

    engine.delete();

    return hex;
}

var commands = {
    "armv7": {
        assemble: (bot, msg) => {
            let code = msg.content.split(" ").slice(1).join(" ");
            let bytes = asm(ks.ARCH_ARM, ks.MODE_ARM, code);

            const embed = createHexEmbed(code, bytesToHex(bytes), bytesToHex(bytes.reverse()));
            msg.channel.send(embed);
        },
        disassemble: (bot, msg) => {
            let hex = msg.content.split(" ").slice(1).join(" ");
            let instr = disasm(cs.ARCH_ARM, cs.MODE_ARM, hexToBytes(hex));

            const embed = createInstrEmbed(hex, instr);
            msg.channel.send(embed);
        }
    },
    "thumb": {
        assemble: (bot, msg) => {
            let code = msg.content.split(" ").slice(1).join(" ");
            let bytes = asm(ks.ARCH_ARM, ks.MODE_THUMB, code);

            const embed = createHexEmbed(code, bytesToHex(bytes), bytesToHex(bytes.reverse()));
            msg.channel.send(embed);
        },
        disassemble: (bot, msg) => {
            let hex = msg.content.split(" ").slice(1).join(" ");
            let instr = disasm(cs.ARCH_ARM, cs.MODE_THUMB, hexToBytes(hex));

            const embed = createInstrEmbed(hex, instr);
            msg.channel.send(embed);
        }
    },
    "arm64": {
        assemble: (bot, msg) => {
            let code = msg.content.split(" ").slice(1).join(" ");
            let bytes = asm(ks.ARCH_ARM64, ks.MODE_LITTLE_ENDIAN, code);

            const embed = createHexEmbed(code, bytesToHex(bytes), bytesToHex(bytes.reverse()));
            msg.channel.send(embed);
        },
        disassemble: (bot, msg) => {
            let hex = msg.content.split(" ").slice(1).join(" ");
            let instr = disasm(cs.ARCH_ARM64, cs.MODE_LITTLE_ENDIAN, hexToBytes(hex));

            const embed = createInstrEmbed(hex, instr);
            msg.channel.send(embed);
        }
    }
}

bot.on('message', message => {
    let prefix = message.content[0];
    if (prefix === '<' || prefix === '>') {
        let command = commands[message.content.split(' ')[0].substring(1)];
        if (command) {
            switch (prefix) {
                case '>': {
                    command.assemble(bot, message);
                    break;
                }
                case '<': {
                    command.disassemble(bot, message);
                }
            }
        }
    }
});

bot.login(token);

// disasm(cs.ARCH_ARM, cs.MODE_ARM, [0x1E, 0xFF, 0x2F, 0xE1]);
// asm(ks.ARCH_ARM, ks.MODE_ARM, "SVC #0x80");
