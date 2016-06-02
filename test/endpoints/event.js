import debug from "debug";
import assert from "power-assert";
import moment from "moment-config-trejgun";
import {startTime, endTime} from "abl-constants/build/date";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";
import {getEventInstanceId} from "abl-utils/build/event";

import EventController from "abl-common/build/controllers/operator/event";
import ApiKeyController from "abl-common/build/controllers/operator/api-key";

import Client from "../../source/index";

const log = debug("test:booking");


let data;

describe("Event", () => {
	const eventController = new EventController();

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
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d")
				}, {
					startTime: moment(startTime).add(2, "d"),
					endTime: moment(endTime).add(2, "d"),
					status: EventController.statuses.inactive
				}, {
					startTime: moment(startTime).add(3, "d"),
					endTime: moment(endTime).add(3, "d")
				}, {
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d")
				}, {
					startTime: moment(startTime).add(2, "d"),
					endTime: moment(endTime).add(2, "d")
				}, {
					startTime: moment(startTime).add(3, "d"),
					endTime: moment(endTime).add(3, "d")
				}, {
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d")
				}, {
					startTime: moment(startTime).add(3, "d"),
					endTime: moment(endTime).add(3, "d")
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

	describe.only("#addGuide", () => {
		before(() =>
			mockInChain([{
				model: "ApiKey",
				data: [{
					permissions: ApiKeyController.permissions.dashboard,
					type: ApiKeyController.types.widget
				}]
			}, {
				model: "Operator",
				requires: {
					ApiKey: "o2o"
				},
				count: 1
			}, {
				model: "Guide",
				requires: {
					Operator: "o2o"
				},
				count: 1
			}, {
				model: "Event",
				requires: {
					Operator: "m2o"
				},
				data: [{
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d")
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Operator: "o2o",
					Event: "o2m"
				},
				count: 1
			}])
				.then(result => {
					data = result;
				})
		);

		it("should add guide to event", () => {
			const eventInstanceId = getEventInstanceId(data.TimeSlot[0].eventId, moment(startTime).add(1, "d"));
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.addGuideToEvent({
				eventInstanceId,
				guide: data.Guide[0]._id
			})
				.then(status => {
					assert.equal(status.success, true);
					return eventController.findOne({eventInstanceId})
						.then(event => {
							assert.equal(event.guides[0].toString(), data.Guide[0]._id.toString());
						});
				});
		});

		it("should add guide to uninitialized event", () => {
			const eventInstanceId = getEventInstanceId(data.TimeSlot[0].eventId, moment(startTime).add(2, "d"));
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.addGuideToEvent({
				eventInstanceId,
				guide: data.Guide[0]._id
			})
				.then(status => {
					assert.equal(status.success, true);
					return eventController.findOne({eventInstanceId})
						.then(event => {
							assert.equal(event.guides[0].toString(), data.Guide[0]._id.toString());
						});
				});
		});

		//after(cleanUp);
	});
});
