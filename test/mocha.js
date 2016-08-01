import "abl-common/build/configs/winston";
import winston from "winston";

process.env.NODE_ENV = process.env.NODE_ENV || "test";

Error.stackTraceLimit = Infinity;

const q = require("q");
q.longStackSupport = true;

process.on("uncaughtException", (exception) => {
	winston.error(exception);
});
