"use strict";

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

	constructor(publicKey, secretKey) {
		const keyLength = 64;

		if (!publicKey || publicKey.length !== keyLength) {
			throw new Error(`API Key parameter must be specified and be of length ${keyLength} characters`);
		}

		if (!secretKey || secretKey.length !== keyLength) {
			throw new Error(`API Secret parameter must be specified and be of length ${keyLength} characters`);
		}

		this.publicKey = publicKey;
		this.secretKey = secretKey;
		this.baseUrl = "http://localhost:8000/";
	}

	makeJSONRequest(type, url, data = {}) {
		const date = Date.now();
		const post = type === "PATCH" || type === "POST" || type === "PUT";
		const defer = q.defer();

		log(this.baseUrl + getUrl("/" + url, data));

		request({
			url,
			baseUrl: this.baseUrl,
			method: type,
			[post ? "body" : "qs"]: data,
			json: true,
			headers: {
				"X-ABL-Access-Key": this.publicKey,
				"X-ABL-Signature": sign(this.secretKey, getUrl("/" + url, data), date),
				"X-ABL-Date": date,
				"Origin": this.baseUrl,
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

	createActivities(data) {
		return this.makeJSONRequest("POST", "activities", data);
	}

	getActivity(data) {
		const {_id} = data;
		return this.makeJSONRequest("GET", "activities/" + _id);
	}

	editActivity(data) {
		const {_id, ...other} = data;
		return this.makeJSONRequest("PUT", "activities/" + _id, other);
	}

	removeActivity(data) {
		const {_id} = data;
		return this.makeJSONRequest("DELETE", "activities/" + _id);
	}

	// Coupon

	getCoupon(data) {
		const {couponId} = data;
		return this.makeJSONRequest("GET", "coupons/" + couponId);
	}

	createCoupon(data) {
		return this.makeJSONRequest("POST", "coupons", data);
	}

	// Event

	getEvent(data) {
		const {eventInstanceId} = data;
		return this.makeJSONRequest("GET", "events/" + eventInstanceId);
	}

	editEvent(data) {
		const {eventInstanceId, ...other} = data;
		return this.makeJSONRequest("PUT", "events/" + eventInstanceId, other);
	}

	removeEvent(data) {
		const {eventInstanceId} = data;
		return this.makeJSONRequest("DELETE", "events/" + eventInstanceId);
	}

	addGuideToEvent(data) {
		const {eventInstanceId, guide} = data;
		return this.makeJSONRequest("POST", "events/" + eventInstanceId + "/guides/" + guide);
	}

	removeGuideFromEvent(data) {
		const {eventInstanceId, guide} = data;
		return this.makeJSONRequest("DELETE", "events/" + eventInstanceId + "/guides/" + guide);
	}

	// TimeSlot

	addGuideToTimeSlot(data) {
		const {eventId, guide, ...other} = data;
		return this.makeJSONRequest("POST", "timeslots/" + eventId + "/guides/" + guide, other);
	}

	removeGuideFromTimeSlot(data) {
		const {eventId, guide, ...other} = data;
		return this.makeJSONRequest("POST", "timeslots/" + eventId + "/guides/" + guide, other);
	}

	removeTimeSlot(data) {
		const {eventId} = data;
		return this.makeJSONRequest("DELETE", "timeslots/" + eventId);
	}

	// Guide

	getGuidesEvents(data) {
		const {_id, ...other} = data;
		return this.makeJSONRequest("GET", "guides/" + _id + "/events", other);
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


	getCouponById(data) {
		const {couponId} = data;
		return this.makeJSONRequest("GET", "coupon/" + couponId);
	}

	editCoupon(data) {
		const {_id, ...other} = data;
		return this.makeJSONRequest("PUT", "coupons/" + _id, other);
	}

	getRoaster(data) {
		const {eventInstanceId} = data;
		return this.makeJSONRequest("GET", "events/" + eventInstanceId + "/roster");
	}

	getCustomers(data) {
		return this.makeJSONRequest("GET", "customers", data);
	}

	book(data) {
		return this.makeJSONRequest("GET", "/api/v1/bookings", data);
	}
}
