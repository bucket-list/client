"use strict";

import debug from "debug";
import assert from "power-assert";
import moment from "moment-config-trejgun";
import {attendees} from "abl-constants/build/misc";
import {startTime, endTime} from "abl-constants/build/date";
import {AAPArray, chargeArray, customerObject, cardObject} from "abl-constants/build/objects";
import {cardNumbers, defaultCurrency} from "abl-constants/build/stripe";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";

import TransactionController from "abl-common/build/controllers/operator/transaction";

import SAPI from "abl-common/build/connect/stripe";

import Client from "../../source/index";

const log = debug("test:booking");


let data;

describe("Controller Booking", () => {
	describe("#insert", () => {
		let stripeToken;

		before(() =>
			mockInChain([{
				model: "ApiKey",
				count: 1
			}, {
				model: "Payment",
				count: 1
			}, {
				model: "Location",
				count: 1
			}, {
				model: "Operator",
				requires: {
					Location: "o2o",
					ApiKey: "o2o",
					Payment: "o2o"
				},
				count: 1
			}, {
				model: "Aap",
				requires: {
					Operator: [0, 0, 0]
				},
				data: [...AAPArray]
			}, {
				model: "Charge",
				data: Object.keys(chargeArray).map(key => chargeArray[key])
			}, {
				model: "Discount",
				requires: {
					Operator: "o2o"
				},
				count: 1
			}, {
				model: "Coupon",
				requires: {
					Operator: "o2o"
				},
				count: 1
			}, {
				model: "Event",
				requires: {
					Operator: "o2o"
				},
				data: [{
					startTime: moment(startTime).add(1, "d").toDate(),
					endTime: moment(endTime).add(1, "d").toDate()
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Event: "o2o",
					Operator: "o2o",
					Charge: [[0, 1, 2]],
					Discount: "o2o",
					Aap: [[0, 1, 2]]
				},
				data: [{
					startTime: moment(startTime).add(-1, "d").toDate(),
					endTime: moment(endTime).add(-1, "d").toDate(),
					maxOcc: attendees * 2
				}]
			}, {
				model: "Question",
				requires: {
					Operator: "o2o"
				},
				count: 1
			}, {
				model: "Activity",
				requires: {
					Location: "m2o",
					Operator: "o2o",
					TimeSlot: "o2o",
					Charge: [[3, 4, 5, 6, 7, 8]],
					Question: "o2o"
				},
				count: 1
			}])
				.then(result => {
					data = result;
					return SAPI.tokenCreate({
							card: cardObject({
								number: cardNumbers[5]
							})
						})
						.then(token => {
							stripeToken = token;
						});
				})
		);

		it("should create booking (credit)", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.book({
					...customerObject(),
					eventInstanceId: data.Event[0].eventInstanceId,
					paymentMethod: TransactionController.paymentMethods.credit,
					currency: defaultCurrency,
					stripeToken: stripeToken.id,
					couponId: data.Coupon[0].couponId,
					attendees: {
						[data.Charge[0]._id]: [null],
						[data.Charge[1]._id]: [null],
						[data.Charge[2]._id]: [null]
					},
					addons: {
						[data.Charge[3]._id]: [null, null]
					},
					answers: {
						[data.Question[0]._id]: "answer 1"
					}
				})
				.then(booking => {
					log(booking);
					assert.ok(booking);
				});
		});

		after(cleanUp);
	});
});
