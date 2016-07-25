process.env.NODE_ENV = process.env.NODE_ENV || "development";

import q from "q";
import request from "request";
import debug from "debug";
import {sign, getUrl} from "abl-utils/build/api";


if (process.env.ABL_DEBUG === "true") {
	debug.enable("abl-client:*");
}

const log = debug("abl-client:request");

export default class Client {

	constructor(publicKey, privateKey) {
		const keyLength = 64;

		if (!publicKey || publicKey.length !== keyLength) {
			throw new Error(`API Public Key parameter must be specified and be of length ${keyLength} characters`);
		}

		if (!privateKey || privateKey.length !== keyLength) {
			throw new Error(`API Private Key parameter must be specified and be of length ${keyLength} characters`);
		}

		this.publicKey = publicKey;
		this.privateKey = privateKey;
		this.baseUrl = "http://localhost:8001";
		this.prefix = "/api/v1/";
	}

	makeJSONRequest(type, url, data = {}) {
		const timestamp = Date.now();
		const post = type === "PATCH" || type === "POST" || type === "PUT";
		const defer = q.defer();

		log(this.baseUrl + getUrl(this.prefix + url, data));

		request({
			url,
			baseUrl: this.baseUrl + this.prefix,
			method: type,
			[post ? "body" : "qs"]: data,
			json: true,
			headers: {
				"X-ABL-Access-Key": this.publicKey,
				"X-ABL-Signature": sign(this.privateKey, getUrl(this.prefix + url, data), timestamp),
				"X-ABL-Date": timestamp,
				"Origin": this.baseUrl, // eslint-disable-line quote-props
				"Content-Type": "application/json; charset=utf-8"
			}
		}, (error, response, body) => {
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


	// Activity

	getActivities(data) {
		return this.makeJSONRequest("GET", "activities", data);
	}

	createActivity(data) {
		return this.makeJSONRequest("POST", "activities", data);
	}

	getActivity(data) {
		const {_id} = data;
		return this.makeJSONRequest("GET", `activities/${_id}`);
	}

	editActivity(data) {
		const {_id, ...other} = data;
		return this.makeJSONRequest("PUT", `activities/${_id}`, other);
	}

	removeActivity(data) {
		const {_id} = data;
		return this.makeJSONRequest("DELETE", `activities/${_id}`);
	}

	// Coupon

	getCoupon(data) {
		const {couponId} = data;
		return this.makeJSONRequest("GET", `coupons/${couponId}`);
	}

	createCoupon(data) {
		return this.makeJSONRequest("POST", "coupons", data);
	}

	getCouponById(data) {
		const {couponId} = data;
		return this.makeJSONRequest("GET", `coupon/${couponId}`);
	}

	editCoupon(data) {
		const {_id, ...other} = data;
		return this.makeJSONRequest("PUT", `coupons/${_id}`, other);
	}

	// Clients

	getClients(data) {
		return this.makeJSONRequest("GET", "operators/clients", data);
	}

	// Event

	getEvent(data) {
		const {eventInstanceId} = data;
		return this.makeJSONRequest("GET", `events/${eventInstanceId}`);
	}

	editEvent(data) {
		const {eventInstanceId, ...other} = data;
		return this.makeJSONRequest("PUT", `events/${eventInstanceId}`, other);
	}

	removeEvent(data) {
		const {eventInstanceId} = data;
		return this.makeJSONRequest("DELETE", `events/${eventInstanceId}`);
	}

	addGuideToEvent(data) {
		const {eventInstanceId, guide} = data;
		return this.makeJSONRequest("POST", `events/${eventInstanceId}/guides/${guide}`);
	}

	removeGuideFromEvent(data) {
		const {eventInstanceId, guide} = data;
		return this.makeJSONRequest("DELETE", `events/${eventInstanceId}/guides/${guide}`);
	}

	getDailyEvents(data) {
		const {date} = data;
		return this.makeJSONRequest("GET", `events/daily/${date}`);
	}

	// Guide

	getGuides(data) {
		return this.makeJSONRequest("GET", "operators/guide", data);
	}

	createGuide(data) {
		return this.makeJSONRequest("POST", "operators/guide", data);
	}

	getGuide(data) {
		const {_id} = data;
		return this.makeJSONRequest("GET", `operators/guide/${_id}`);
	}

	editGuide(data) {
		const {_id} = data;
		return this.makeJSONRequest("PUT", `operators/guide/${_id}`);
	}

	deleteGuide(data) {
		const {_id} = data;
		return this.makeJSONRequest("DELETE", `operators/guide/${_id}`);
	}

	getGuidesEvents(data) {
		const {_id, ...other} = data;
		return this.makeJSONRequest("GET", `operators/guide/${_id}/events`, other);
	}

	// TimeSlot

	getTimeSlot(data) {
		return this.makeJSONRequest("GET", "timeslots", data);
	}

	addGuideToTimeSlot(data) {
		const {eventId, guide, ...other} = data;
		return this.makeJSONRequest("POST", `timeslots/${eventId}/guides/${guide}`, other);
	}

	removeGuideFromTimeSlot(data) {
		const {eventId, guide, ...other} = data;
		return this.makeJSONRequest("POST", `timeslots/${eventId}/guides/${guide}`, other);
	}

	removeTimeSlot(data) {
		const {eventId} = data;
		return this.makeJSONRequest("DELETE", `timeslots/${eventId}`);
	}

	// User

	editUser(data) {
		return this.makeJSONRequest("PUT", "users", data);
	}

	loginUser(data) {
		return this.makeJSONRequest("POST", "login", data);
	}

	// Other

	metricsOverview(data) {
		return this.makeJSONRequest("GET", "metrics/overview", data);
	}

	getRoster(data) {
		const {type, ...other} = data;
		return this.makeJSONRequest("GET", `roster/${type}`, other);
	}

	// Booking

	createBooking(data) {
		return this.makeJSONRequest("POST", "bookings", data);
	}

	getOfflineData(data) {
		return this.makeJSONRequest("GET", "bookings/getOfflineData", data);
	}

	getByEventInstanceId(data) {
		const {eventInstanceId, ...other} = data;
		return this.makeJSONRequest("GET", `bookings/${eventInstanceId}`, other);
	}

	// Transaction

	partialRefund(data) {
		const {_id, ...other} = data;
		return this.makeJSONRequest("PATCH", `transaction/${_id}`, other);
	}
}
