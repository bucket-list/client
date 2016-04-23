"use strict";

import debug from "debug";
import assert from "power-assert";
import moment from "moment-config-trejgun";
import {startTime, endTime} from "abl-constants/build/date";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";

import EventController from "abl-common/build/controllers/operator/event";

import Client from "../../source/index";

const log = debug("test:booking");


let data;

describe("Controller Event", () => {
	describe("#getDailyEvents", () => {
		before(() =>
			mockInChain([{
				model: "ApiKey",
				count: 1
			}, {
				model: "Operator",
				requires: {
					ApiKey: "o2o"
				},
				count: 1
			}, {
				model: "Event",
				requires: {
					Operator: "m2o"
				},
				data: [{
					startTime: moment(startTime).add(1, "d").toDate(),
					endTime: moment(endTime).add(1, "d").toDate()
				}, {
					startTime: moment(startTime).add(2, "d").toDate(),
					endTime: moment(endTime).add(2, "d").toDate(),
					status: EventController.statuses.inactive
				}, {
					startTime: moment(startTime).add(3, "d").toDate(),
					endTime: moment(endTime).add(3, "d").toDate()
				}, {
					startTime: moment(startTime).add(1, "d").toDate(),
					endTime: moment(endTime).add(1, "d").toDate()
				}, {
					startTime: moment(startTime).add(2, "d").toDate(),
					endTime: moment(endTime).add(2, "d").toDate()
				}, {
					startTime: moment(startTime).add(3, "d").toDate(),
					endTime: moment(endTime).add(3, "d").toDate()
				}, {
					startTime: moment(startTime).add(1, "d").toDate(),
					endTime: moment(endTime).add(1, "d").toDate()
				}, {
					startTime: moment(startTime).add(3, "d").toDate(),
					endTime: moment(endTime).add(3, "d").toDate()
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Operator: "m2o",
					Event: [[0, 1, 2], [3, 4, 5], [6, 7]]
				},
				count: 3
			}])
				.then(result => {
					data = result;
				})
		);

		it("should get daily events", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getDailyEvents({
					date: moment(startTime).add(2, "d").format("YYYY-MM-DD")
				})
				.then(obj => {
					log(obj);
					assert.equal(obj.list.length, 2);
				});
		});

		after(cleanUp);
	});
});
