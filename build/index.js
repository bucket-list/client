"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _request2 = require("request");

var _request3 = _interopRequireDefault(_request2);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _api = require("abl-utils/build/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

process.env.NODE_ENV = process.env.NODE_ENV || "development";

if (process.env.ABL_DEBUG === "true") {
	_debug2.default.enable("abl-client:*");
}

var log = (0, _debug2.default)("abl-client:request");

var Client = function () {
	function Client(publicKey, secretKey) {
		_classCallCheck(this, Client);

		var keyLength = 64;

		if (!publicKey || publicKey.length !== keyLength) {
			throw new Error("API Key parameter must be specified and be of length " + keyLength + " characters");
		}

		if (!secretKey || secretKey.length !== keyLength) {
			throw new Error("API Secret parameter must be specified and be of length " + keyLength + " characters");
		}

		this.publicKey = publicKey;
		this.secretKey = secretKey;
		this.baseUrl = "http://localhost:8000/";
	}

	_createClass(Client, [{
		key: "makeJSONRequest",
		value: function makeJSONRequest(type, url) {
			var _request;

			var data = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

			var date = Date.now();
			var post = type === "PATCH" || type === "POST" || type === "PUT";
			var defer = _q2.default.defer();

			log(this.baseUrl + (0, _api.getUrl)("/" + url, data));

			(0, _request3.default)((_request = {
				url: url,
				baseUrl: this.baseUrl,
				method: type
			}, _defineProperty(_request, post ? "body" : "qs", data), _defineProperty(_request, "json", true), _defineProperty(_request, "headers", {
				"X-ABL-Access-Key": this.publicKey,
				"X-ABL-Signature": (0, _api.sign)(this.secretKey, (0, _api.getUrl)("/" + url, data), date),
				"X-ABL-Date": date,
				"Origin": this.baseUrl,
				"Content-Type": "application/json; charset=utf-8"
			}), _request), function (error, response, body) {
				if (error) {
					defer.reject(error);
				} else if (response.statusCode !== 200) {
					defer.reject(body);
				} else {
					defer.resolve(body);
				}
			});

			return defer.promise;
		}

		// ApiKey

	}, {
		key: "getApiKeys",
		value: function getApiKeys() {
			return this.makeJSONRequest("POST", "apikeys/affiliate");
		}

		// Activity

	}, {
		key: "getActivities",
		value: function getActivities(data) {
			return this.makeJSONRequest("GET", "activities", data);
		}
	}, {
		key: "createActivities",
		value: function createActivities(data) {
			return this.makeJSONRequest("POST", "activities", data);
		}
	}, {
		key: "getActivity",
		value: function getActivity(data) {
			var _id = data._id;

			return this.makeJSONRequest("GET", "activities/" + _id);
		}
	}, {
		key: "editActivity",
		value: function editActivity(data) {
			var _id = data._id;

			var other = _objectWithoutProperties(data, ["_id"]);

			return this.makeJSONRequest("PUT", "activities/" + _id, other);
		}
	}, {
		key: "removeActivity",
		value: function removeActivity(data) {
			var _id = data._id;

			return this.makeJSONRequest("DELETE", "activities/" + _id);
		}

		// Coupon

	}, {
		key: "getCoupon",
		value: function getCoupon(data) {
			var couponId = data.couponId;

			return this.makeJSONRequest("GET", "coupons/" + couponId);
		}
	}, {
		key: "createCoupon",
		value: function createCoupon(data) {
			return this.makeJSONRequest("POST", "coupons", data);
		}

		// Event

	}, {
		key: "getEvent",
		value: function getEvent(data) {
			var eventInstanceId = data.eventInstanceId;

			return this.makeJSONRequest("GET", "events/" + eventInstanceId);
		}
	}, {
		key: "editEvent",
		value: function editEvent(data) {
			var eventInstanceId = data.eventInstanceId;

			var other = _objectWithoutProperties(data, ["eventInstanceId"]);

			return this.makeJSONRequest("PUT", "events/" + eventInstanceId, other);
		}
	}, {
		key: "removeEvent",
		value: function removeEvent(data) {
			var eventInstanceId = data.eventInstanceId;

			return this.makeJSONRequest("DELETE", "events/" + eventInstanceId);
		}
	}, {
		key: "addGuideToEvent",
		value: function addGuideToEvent(data) {
			var eventInstanceId = data.eventInstanceId;
			var guide = data.guide;

			return this.makeJSONRequest("POST", "events/" + eventInstanceId + "/guides/" + guide);
		}
	}, {
		key: "removeGuideFromEvent",
		value: function removeGuideFromEvent(data) {
			var eventInstanceId = data.eventInstanceId;
			var guide = data.guide;

			return this.makeJSONRequest("DELETE", "events/" + eventInstanceId + "/guides/" + guide);
		}

		// TimeSlot

	}, {
		key: "addGuideToTimeSlot",
		value: function addGuideToTimeSlot(data) {
			var eventId = data.eventId;
			var guide = data.guide;

			var other = _objectWithoutProperties(data, ["eventId", "guide"]);

			return this.makeJSONRequest("POST", "timeslots/" + eventId + "/guides/" + guide, other);
		}
	}, {
		key: "removeGuideFromTimeSlot",
		value: function removeGuideFromTimeSlot(data) {
			var eventId = data.eventId;
			var guide = data.guide;

			var other = _objectWithoutProperties(data, ["eventId", "guide"]);

			return this.makeJSONRequest("POST", "timeslots/" + eventId + "/guides/" + guide, other);
		}
	}, {
		key: "removeTimeSlot",
		value: function removeTimeSlot(data) {
			var eventId = data.eventId;

			return this.makeJSONRequest("DELETE", "timeslots/" + eventId);
		}

		// Guide

	}, {
		key: "getGuidesEvents",
		value: function getGuidesEvents(data) {
			var _id = data._id;

			var other = _objectWithoutProperties(data, ["_id"]);

			return this.makeJSONRequest("GET", "guides/" + _id + "/events", other);
		}

		// User

	}, {
		key: "editUser",
		value: function editUser(data) {
			return this.makeJSONRequest("PUT", "users", data);
		}
	}, {
		key: "loginUser",
		value: function loginUser(data) {
			return this.makeJSONRequest("POST", "login", data);
		}

		// Other

	}, {
		key: "metricsOverview",
		value: function metricsOverview(data) {
			return this.makeJSONRequest("GET", "metrics/overview", data);
		}
	}, {
		key: "getCouponById",
		value: function getCouponById(data) {
			var couponId = data.couponId;

			return this.makeJSONRequest("GET", "coupon/" + couponId);
		}
	}, {
		key: "editCoupon",
		value: function editCoupon(data) {
			var _id = data._id;

			var other = _objectWithoutProperties(data, ["_id"]);

			return this.makeJSONRequest("PUT", "coupons/" + _id, other);
		}
	}, {
		key: "getRoaster",
		value: function getRoaster(data) {
			var eventInstanceId = data.eventInstanceId;

			return this.makeJSONRequest("GET", "events/" + eventInstanceId + "/roster");
		}
	}, {
		key: "getCustomers",
		value: function getCustomers(data) {
			return this.makeJSONRequest("GET", "customers", data);
		}
	}]);

	return Client;
}();

exports.default = Client;