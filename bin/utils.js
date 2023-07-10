"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallGlobalCommands = exports.DiscordRequest = exports.VerifyDiscordRequest = void 0;
require("dotenv/config");
const node_fetch_1 = __importDefault(require("node-fetch"));
const discord_interactions_1 = require("discord-interactions");
function VerifyDiscordRequest(clientKey) {
    return function (req, res, buf, encoding) {
        const signature = req.get('X-Signature-Ed25519');
        const timestamp = req.get('X-Signature-Timestamp');
        const isValidRequest = (0, discord_interactions_1.verifyKey)(buf, signature, timestamp, clientKey);
        if (!isValidRequest) {
            res.status(401).send('Bad request signature');
            throw new Error('Bad request signature');
        }
    };
}
exports.VerifyDiscordRequest = VerifyDiscordRequest;
function DiscordRequest(endpoint, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // append endpoint to root API URL
        const url = 'https://discord.com/api/v10/' + endpoint;
        // Stringify payloads
        if (options.body)
            options.body = JSON.stringify(options.body);
        // Use node-fetch to make requests
        const res = yield (0, node_fetch_1.default)(url, Object.assign({ headers: {
                Authorization: `Bot ${process.env.TOKEN}`,
                'Content-Type': 'application/json; charset=UTF-8',
                'User-Agent': 'LP-Bot',
            } }, options));
        // throw API errors
        if (!res.ok) {
            const data = yield res.json();
            console.log(res.status);
            throw new Error(JSON.stringify(data));
        }
        // return original response
        return res;
    });
}
exports.DiscordRequest = DiscordRequest;
function InstallGlobalCommands(appId, commands) {
    return __awaiter(this, void 0, void 0, function* () {
        // API endpoint to overwrite global commands
        const endpoint = `applications/${appId}/commands`;
        try {
            // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
            yield DiscordRequest(endpoint, { method: 'PUT', body: commands });
        }
        catch (err) {
            console.error(err);
        }
    });
}
exports.InstallGlobalCommands = InstallGlobalCommands;
