"use strict";

import debug from "debug";
import assert from "power-assert";
import moment from "moment";
import {testDate} from "abl-constants/build/date";
import {getEventId} from "abl-utils/build/event";
import {mockInChain, cleanUp} from "abl-test-utils/build/flow";
import Client from "../../source/index";


const log = debug("test:guide");

let data;

describe("Controller Guide", () => {
	describe("#getEvents", () => {
		before(() =>
			mockInChain([{
				model: "ApiKey",
				count: 1
			}, {
				model: "User",
				requires: {
					ApiKey: "o2o"
				},
				count: 1
			}, {
				model: "Guide",
				requires: {
					User: "m2o"
				},
				count: 4
			}, {
				model: "Event",
				requires: {
					User: "m2o",
					Guide: [[], [1], [1], [3]]
				},
				data: [{
					title: "My event Title",
					startTime: moment(testDate).add(3, "d").add(0, "m").toDate(),
					endTime: moment(testDate).add(3, "d").add(5, "m").toDate()
				}, {
					title: "My event Title",
					startTime: moment(testDate).add(3, "d").add(0, "m").toDate(),
					endTime: moment(testDate).add(3, "d").add(5, "m").toDate()
				}, {
					title: "My event Title",
					startTime: moment(testDate).add(3, "d").add(0, "m").toDate(),
					endTime: moment(testDate).add(3, "d").add(5, "m").toDate()
				}, {
					title: "My event Title"
				}]
			}, {
				model: "TimeSlot",
				requires: {
					User: "m2o",
					Guide: [[0], [1], [2], []],
					Event: "o2o"
				},
				data: [{
					startTime: moment(testDate).add(1, "d").add(0, "m").toDate(),
					endTime: moment(testDate).add(1, "d").add(5, "m").toDate(),
					untilTime: moment(testDate).add(5, "d").add(5, "m").toDate()
				}, {
					startTime: moment(testDate).add(1, "d").add(0, "m").toDate(),
					endTime: moment(testDate).add(1, "d").add(5, "m").toDate(),
					untilTime: moment(testDate).add(5, "d").add(5, "m").toDate()
				}, {
					startTime: moment(testDate).add(1, "d").add(0, "m").toDate(),
					endTime: moment(testDate).add(1, "d").add(5, "m").toDate(),
					untilTime: moment(testDate).add(50, "d").add(5, "m").toDate()
				}, {}]
			}])
				.then(result => {
					data = result;
				})
		);

		it("should get guides events (timeslot 1 + event 1) +dateRange[start]", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getGuidesEvents({_id: data.Guide[1]._id, dateRange: [moment(testDate).tz("UTC").add(3, "d").add(0, "m").format()]})
				.then(response => {
					log("OK", response);
					assert.equal(response.events.length, 4);
					response.events.forEach((event, i) => {
						if (i === 1) {
							assert.equal(getEventId(event.eventInstanceId), data.TimeSlot[2].eventId);
						} else {
							assert.equal(getEventId(event.eventInstanceId), data.TimeSlot[1].eventId);
						}
					});
				});
		});

		it("should get guides events (timeslot 1 + event 1) +dateRange[start,end]", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getGuidesEvents({_id: data.Guide[1]._id, dateRange: [moment(testDate).tz("UTC").add(3, "d").add(0, "m").format(), moment(testDate).tz("UTC").add(3, "d").add(5, "m").format()]})
				.then(response => {
					log("OK", response);
					assert.equal(response.events.length, 2);
					response.events.forEach((event, i) => {
						if (i === 1) {
							assert.equal(getEventId(event.eventInstanceId), data.TimeSlot[2].eventId);
						} else {
							assert.equal(getEventId(event.eventInstanceId), data.TimeSlot[1].eventId);
						}
					});
				});
		});

		after(cleanUp);
	});
});
