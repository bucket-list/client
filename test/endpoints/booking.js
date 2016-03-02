"use strict";

import debug from "debug";
import assert from "power-assert";
import moment from "abl-constants/build/moment";
import {attendees, chargeNames} from "abl-constants/build/misc";
import {startDate, endDate} from "abl-constants/build/date";
import {AAPObject, customerObject, cardObject} from "abl-constants/build/objects";
import {cardNumbers, defaultCurrency} from "abl-constants/build/stripe";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";

import ChargeController from "abl-common/build/controllers/operator/charge";
import TransactionController from "abl-common/build/controllers/operator/transaction";

import SAPI from "abl-connect/build/stripe";

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
				data: [...AAPObject]
			}, {
				model: "Charge",
				data: [{
					name: chargeNames.tax,
					type: ChargeController.types.tax,
					percentage: true,
					amount: 10
				}, {
					name: chargeNames.fee,
					type: ChargeController.types.fee,
					amount: 10 * 100
				}, {
					name: chargeNames.addon.food,
					type: ChargeController.types.addon,
					amount: 50 * 100
				}, {
					name: chargeNames.aap.adult,
					type: ChargeController.types.aap,
					amount: 300 * 100
				}, {
					name: chargeNames.aap.youth,
					type: ChargeController.types.aap,
					amount: 200 * 100
				}, {
					name: chargeNames.aap.child,
					type: ChargeController.types.aap,
					amount: 100 * 100
				}]
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
					startTime: moment(startDate).add(1, "d").toDate(),
					endTime: moment(endDate).add(1, "d").toDate()
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Event: "o2o",
					Operator: "o2o",
					Charge: [[3, 4, 5]],
					Discount: "o2o",
					Aap: [[0, 1, 2]]
				},
				data: [{
					startTime: moment(startDate).add(-1, "d").toDate(),
					endTime: moment(endDate).add(-1, "d").toDate(),
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
					Charge: [[0, 1, 2]],
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
						[data.Charge[3]._id]: [null],
						[data.Charge[4]._id]: [null],
						[data.Charge[5]._id]: [null]
					},
					addons: {
						[data.Charge[2]._id]: [null, null]
					},
					answers: {
						[data.Question[0]._id]: "answer 1"
					}
				})
				.then(coupon => {
					log(coupon);
					assert.ok(coupon);
				});
		});

		after(cleanUp);
	});
});
