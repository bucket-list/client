"use strict";

Error.stackTraceLimit = Infinity;

const debug = require("debug");
if (process.env.ABL_DEBUG === "true") {
	debug.enable("test:*");
}

const q = require("q");
q.longStackSupport = true;

process.on("uncaughtException", (exception) => {
	debug("log:mocha")(exception);
});
