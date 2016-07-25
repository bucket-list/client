import q from "q";
import debug from "debug";
import assert from "power-assert";
import moment from "moment-config-trejgun";
import {testTime, startTime, endTime, untilTime, ISO_8601} from "abl-constants/build/date";
import {getEventId} from "abl-utils/build/event";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";
import Client from "../../source/index";
import langServer from "abl-lang/bundle/en/server";

import EventController from "abl-common/build/controllers/operator/event";
import TimeSlotController from "abl-common/build/controllers/operator/time-slot";
import UserController from "abl-common/build/controllers/user/user";

const log = debug("test:guide");

let data;

describe("Guide", () => {
	const eventController = new EventController();
	const timeSlotController = new TimeSlotController();
	const userController = new UserController();

	describe("#getEvents", () => {
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
				model: "Guide",
				requires: {
					Operator: "m2o"
				},
				count: 4
			}, {
				model: "Event",
				requires: {
					Operator: "m2o",
					Guide: [[], [1], [1], [3]]
				},
				data: [{
					title: "My event Title",
					startTime: moment(testTime).add(3, "d").add(0, "m"),
					endTime: moment(testTime).add(3, "d").add(5, "m")
				}, {
					title: "My event Title",
					startTime: moment(testTime).add(3, "d").add(0, "m"),
					endTime: moment(testTime).add(3, "d").add(5, "m")
				}, {
					title: "My event Title",
					startTime: moment(testTime).add(3, "d").add(0, "m"),
					endTime: moment(testTime).add(3, "d").add(5, "m")
				}, {
					title: "My event Title"
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Operator: "m2o",
					Guide: [[0], [1], [2], []],
					Event: "o2o"
				},
				data: [{
					startTime: moment(startTime).add(1, "d").add(0, "m"),
					endTime: moment(endTime).add(1, "d").add(5, "m"),
					untilTime: moment(untilTime).add(5, "d").add(5, "m")
				}, {
					startTime: moment(startTime).add(1, "d").add(0, "m"),
					endTime: moment(endTime).add(1, "d").add(5, "m"),
					untilTime: moment(untilTime).add(5, "d").add(5, "m")
				}, {
					startTime: moment(startTime).add(1, "d").add(0, "m"),
					endTime: moment(endTime).add(1, "d").add(5, "m"),
					untilTime: moment(untilTime).add(50, "d").add(5, "m")
				}, {}]
			}, {
				model: "Activity",
				requires: {
					Operator: "o2o",
					TimeSlot: "o2m"
				},
				count: 1
			}])
				.then(result => {
					data = result;
				})
		);

		it("should get guides events (timeslot 1 + event 1) +dateRange[start]", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getGuidesEvents({
				_id: data.Guide[1]._id,
				dateRange: [
					moment(startTime).add(3, "d").add(0, "m").format(ISO_8601)
				]
			})
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
			return client.getGuidesEvents({
				_id: data.Guide[1]._id,
				dateRange: [
					moment(startTime).add(3, "d").add(0, "m").format(ISO_8601),
					moment(startTime).add(3, "d").add(5, "m").format(ISO_8601)
				]
			})
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

	describe("#getById", () => {
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
				model: "Guide",
				requires: {
					Operator: "m2o"
				},
				count: 1
			}, {
				model: "Event",
				requires: {
					Operator: "m2o",
					Guide: [[], [0]]
				},
				data: [{
					title: "My event Title",
					startTime: moment(startTime).add(3, "d"),
					endTime: moment(endTime).add(3, "d")
				}, {
					title: "My event Title",
					startTime: moment(startTime).add(3, "d"),
					endTime: moment(endTime).add(3, "d")
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Operator: "m2o",
					Guide: [[0], []],
					Event: "o2o"
				},
				data: [{
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d"),
					untilTime: moment(untilTime).add(-9, "d")
				}, {
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d"),
					untilTime: moment(untilTime).add(-9, "d")
				}]
			}])
				.then(result => {
					data = result;
				})
		);

		it("should get guide", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getById({_id: data.Guide[0]._id})
				.then(guide => {
					log("OK", guide);
					assert.ok(guide.email);
				});
		});

		after(cleanUp);
	});

	describe("#list", () => {
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
				model: "Guide",
				requires: {
					Operator: "m2o"
				},
				count: 5
			}])
				.then(result => {
					data = result;
				})
		);

		it("should get guides", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getGuides({pageSize: 3})
				.then(guides => {
					log("OK", guides);
					assert.equal(guides.list.length, 3);
				});
		});

		after(cleanUp);
	});

	describe.only("#delete", () => {
		before(() =>
			mockInChain([{
				model: "ApiKey",
				data: [{
					permissions: []
				}, {
					permissions: ["user:delete"]
				}, {
					permissions: []
				}, {
					permissions: []
				}, {
					permissions: []
				}, {
					permissions: ["user:delete"]
				}, {
					permissions: []
				}]
			}, {
				model: "Guide",
				requires: {
					ApiKey: "o2o"
				},
				count: 7
			}, {
				model: "Operator",
				requires: {
					Guide: [[0, 1, 2, 3, 4, 5], [6]]
				},
				count: 2
			}, {
				model: "Event",
				requires: {
					Operator: [0, 0],
					Guide: [[0, 1], [2]]
				},
				count: 2
			}, {
				model: "TimeSlot",
				requires: {
					Operator: [0, 0],
					Guide: [[0, 1], [2]],
					Event: "o2o"
				},
				count: 2
			}])
				.then(result => {
					data = result;
				})
		);

		it("should delete self", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.deleteGuide({
				_id: data.Guide[0]._id
			})
				.then(result => {
					assert.equal(result.success, true);
					return q.all([
						eventController.find({guides: data.Guide[0]._id}),
						timeSlotController.find({guides: data.Guide[0]._id}),
						userController.find({_id: {$in: [data.Guide[0]._id]}})
					])
						.spread((events, timeslots, users) => {
							assert.equal(events.length, 0);
							assert.equal(timeslots.length, 0);
							assert.equal(users[0].status, UserController.statuses.inactive);
						});
				});
		});

		it("should delete guide", () => {
			const client = new Client(data.ApiKey[1].publicKey, data.ApiKey[1].privateKey);
			return client.deleteGuide({
				_id: data.Guide[2]._id
			})
				.then(result => {
					assert.equal(result.success, true);
					return q.all([
						eventController.find({guides: data.Guide[2]._id}),
						timeSlotController.find({guides: data.Guide[2]._id}),
						userController.find({_id: {$in: [data.Guide[1]._id, data.Guide[2]._id]}})
					])
						.spread((events, timeslots, users) => {
							assert.equal(events.length, 0);
							assert.equal(timeslots.length, 0);
							assert.equal(users[0].status, UserController.statuses.active);
							assert.equal(users[1].status, UserController.statuses.inactive);
						});
				});
		});

		it.only("should throw `access-denied` (permissions)", () => {
			const client = new Client(data.ApiKey[3].publicKey, data.ApiKey[3].privateKey);
			return client.deleteGuide({
				_id: data.Guide[4]._id
			})
				.catch(e => {
					assert.equal(e.status, 403);
					assert.equal(e.errors[0], langServer["access-denied"]);
				})
				.then(assert.ifError);
		});

		it("should throw `access-denied` (operator)", () => {
			const client = new Client(data.ApiKey[5].publicKey, data.ApiKey[5].privateKey);
			return client.deleteGuide({
				_id: data.Guide[6]._id
			})
				.catch(e => {
					assert.equal(e.status, 403);
					assert.equal(e.errors[0], langServer["access-denied"]);
				})
				.then(assert.ifError);
		});

		after(cleanUp);
	});
});
