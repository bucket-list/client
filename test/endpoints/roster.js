import debug from "debug";
import assert from "power-assert";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";
import {date} from "abl-constants/build/date";
import {getEventInstanceId} from "abl-utils/build/event";
import langController from "abl-lang/bundle/en/controller";
import langNotFound from "abl-lang/bundle/en/not-found";
import Client from "../../source/index";

import ApiKeyController from "abl-common/build/controllers/operator/api-key";
import BookingController from "abl-common/build/controllers/operator/booking";


const log = debug("test:pdf");

let data;

describe("PDF", () => {
	describe("#roster", () => {
		before(() =>
			mockInChain([{
				model: "Payment",
				count: 1
			}, {
				model: "ApiKey",
				data: [{
					permissions: ApiKeyController.permissions.dashboard,
					type: ApiKeyController.types.widget
				}]
			}, {
				model: "Location",
				count: 1
			}, {
				model: "Operator",
				requires: {
					ApiKey: "o2o",
					Location: "o2o",
					Payment: "o2o"
				},
				data: [{
					companyImage: "https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png"
				}]
			}, {
				model: "Answer",
				requires: {
					Operator: "m2o"
				},
				count: 2
			}, {
				model: "Guide",
				requires: {
					Operator: "m2o"
				},
				count: 2
			}, {
				model: "Transaction",
				data: [{
					charges: [{
						type: "addon",
						name: "hamburger",
						amount: 10 * 100
					}, {
						type: "addon",
						name: "cola",
						amount: 10 * 100
					}, {
						type: "aap",
						name: "Adult",
						amount: 300 * 100
					}, {
						type: "aap",
						name: "Child",
						amount: 100 * 100
					}]
				}, {}, {}, {}, {}]
			}, {
				model: "Booking",
				requires: {
					Operator: "m2o",
					Transaction: "o2o",
					Answer: [[0], [0, 1], [], [0], [1]]
				},
				data: [{
					status: BookingController.statuses.unpaid
				}, {
					checkin: new Date(),
					status: BookingController.statuses.paid
				}, {
					status: BookingController.statuses.paid
				}, {
					checkin: new Date(),
					status: BookingController.statuses.paid
				}, {
					checkin: new Date(),
					status: BookingController.statuses.paid
				}]
			}, {
				model: "Event",
				requires: {
					Operator: "m2o",
					Guide: "m2m",
					Booking: [[0, 1, 2], [3], [4], []]
				},
				count: 4
			}, {
				model: "TimeSlot",
				requires: {
					Operator: "m2o",
					Event: [[0], [1, 2, 3], []]
				},
				count: 3
			}, {
				model: "Activity",
				requires: {
					Operator: "m2o",
					TimeSlot: [[0, 1], [2]],
					Location: "m2o"
				},
				count: 2
			}, {
				model: "Customer",
				requires: {
					Booking: [[0, 1], [2], [3, 4]]
				},
				count: 3
			}])
				.then(result => {
					data = result;
				})
		);

		it("should create PDF roster (eventInstanceId)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				eventInstanceId: data.Event[0].eventInstanceId
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create PDF roster (event/single)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				event: data.Event[0]._id.toString()
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create PDF roster (event/multi)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				event: [
					data.Event[0]._id.toString(),
					data.Event[1]._id.toString(),
					data.Event[2]._id.toString()
				]
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create PDF roster (timeslot)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				timeslot: data.TimeSlot[1]._id.toString()
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create PDF roster (activity)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				dateRange: [date],
				activity: data.Activity[0]._id.toString()
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create CVS roster (eventInstanceId)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "csv",
				eventInstanceId: data.Event[0].eventInstanceId
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create CVS roster (event/single)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "csv",
				event: data.Event[0]._id.toString()
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create CVS roster (event/multi)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "csv",
				dateRange: [date],
				event: [
					data.Event[0]._id.toString(),
					data.Event[1]._id.toString(),
					data.Event[2]._id.toString()
				]
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create CVS roster (timeslot)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "csv",
				dateRange: [date],
				timeslot: data.TimeSlot[1]._id.toString()
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create CVS roster (activity)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "csv",
				dateRange: [date],
				activity: data.Activity[0]._id.toString()
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should create PDF roster event/no bookings", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				eventInstanceId: data.Event[3].eventInstanceId
			})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		it("should throw `time-slot-not-found`", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				eventInstanceId: getEventInstanceId("crap", date)
			})
				.catch(e => {
					assert.equal(e.status, 404);
					assert.equal(e.errors.length, 1);
					assert.equal(e.errors[0], langNotFound["time-slot"]);
				})
				.then(assert.ifError);
		});

		it("should throw `roster-no-events-matching-criteria`", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoster({
				type: "pdf",
				timeslot: data.TimeSlot[2]._id.toString()
			})
				.catch(e => {
					assert.equal(e.status, 400);
					assert.equal(e.errors.length, 1);
					assert.equal(e.errors[0], langController["roster-no-events-matching-criteria"]);
				})
				.then(assert.ifError);
		});
		after(cleanUp);
	});
});
