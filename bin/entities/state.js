"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
var State;
(function (State) {
    State[State["open"] = 0] = "open";
    State[State["closed"] = 1] = "closed";
})(State || (exports.State = State = {}));
exports.default = State;
