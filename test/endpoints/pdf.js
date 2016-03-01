"use strict";

import debug from "debug";
import assert from "power-assert";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";
import Client from "../../source/index";


const log = debug("test:pdf");

let data;

describe("Controller PDF", () => {
	describe("#roster", () => {
		before(() =>
			mockInChain([{
				model: "Payment",
				count: 1
			}, {
				model: "ApiKey",
				count: 1
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
				count: 1
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
						amount: 10
					}, {
						type: "addon",
						name: "cola",
						amount: 10
					}, {
						type: "aap",
						name: "Adult",
						amount: 300
					}, {
						type: "aap",
						name: "Child",
						amount: 100
					}]
				}, {}, {}]
			}, {
				model: "Booking",
				requires: {
					Operator: "m2o",
					Transaction: "o2o",
					Answer: [[0], [0, 1], []]
				},
				count: 3
			}, {
				model: "Event",
				requires: {
					Operator: "o2o",
					Guide: "o2m",
					Booking: "o2m"
				},
				count: 1
			}, {
				model: "TimeSlot",
				requires: {
					Operator: "o2o",
					Event: "o2o"
				},
				count: 1
			}, {
				model: "Activity",
				requires: {
					Operator: "o2o",
					TimeSlot: "o2o",
					Location: "o2o"
				},
				count: 1
			}, {
				model: "Customer",
				requires: {
					Booking: [[0, 1], [2]]
				},
				count: 2
			}])
				.then(result => {
					data = result;
				})
		);

		it("should download roster", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getRoaster({eventInstanceId: data.Event[0].eventInstanceId})
				.then(() => {
					assert(true);
					log("OK");
				});
		});

		after(cleanUp);
	});
});
