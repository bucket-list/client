import q from "q";
import debug from "debug";
import assert from "power-assert";
import moment from "moment-config-trejgun";
import winston from "winston";
import {times} from "lodash";
import {attendees} from "abl-constants/build/misc";
import {startTime, endTime} from "abl-constants/build/date";
import {AAPArray, chargeArray, customerObject, cardObject} from "abl-constants/build/objects";
import {cardNumbers, cardErrors} from "abl-constants/build/stripe";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";

import ApiKeyController from "abl-common/build/controllers/user/api-key";
import BookingController from "abl-common/build/controllers/operator/booking";
import MailController from "abl-common/build/controllers/mail/mail";
import StripeErrorController from "abl-common/build/controllers/operator/stripe-error";
import TransactionController from "abl-common/build/controllers/operator/transaction";


import SAPI from "abl-common/build/connect/stripe";

import Client from "../../source/index";

const log = debug("test:booking");


let data;
let stripeSuccessTokens;

describe("Booking", () => {
	const bookingController = new BookingController();
	const mailController = new MailController();
	const stripeErrorController = new StripeErrorController();

	describe("#insert (widget)", () => {
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
					startTime: moment(startTime).add(3, "d"),
					endTime: moment(endTime).add(3, "d")
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
					startTime: moment(startTime).add(-1, "d"),
					endTime: moment(endTime).add(-1, "d"),
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
					return q.all(times(1, () => SAPI.tokenCreate({
						card: cardObject({
							number: cardNumbers[5]
						})
					})))
						.then((successTokens) => {
							stripeSuccessTokens = successTokens;
						});
				})
		);

		it("should create booking (credit)", () => {
			const eventInstanceId = data.Event[0].eventInstanceId;
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.createBooking({
				...customerObject(),
				eventInstanceId,
				paymentMethod: TransactionController.paymentMethods.credit,
				stripeToken: stripeSuccessTokens[0].id,
				couponId: data.Coupon[0].couponId,
				amount: 0,
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
					assert.equal(booking.eventInstanceId, eventInstanceId);
				});
		});

		after(cleanUp);
	});

	describe("#insert (coupon)", () => {
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
					Location: "o2o",
					ApiKey: "o2o",
					Payment: "o2o"
				},
				count: 1
			}, {
				model: "Charge",
				data: [
					chargeArray.vat,
					chargeArray.visa,
					chargeArray.food,
					chargeArray.adult,
					chargeArray.youth,
					chargeArray.child
				]
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
					Event: "o2o",
					Operator: "o2o",
					Charge: [[3, 4, 5]]
				},
				count: 1
			}, {
				model: "Question",
				requires: {
					Operator: "m2o"
				},
				count: 2
			}, {
				model: "Activity",
				requires: {
					Location: "o2o",
					Operator: "o2o",
					TimeSlot: "o2o",
					Charge: [[0, 1, 2]],
					Question: "m2o"
				},
				count: 1
			}, {
				model: "Coupon",
				requires: {
					Operator: "m2o",
					Activity: "m2o"
				},
				data: [{
					amount: 20,
					endTime: moment(endTime).add(5, "d"),
					isTotal: false,
					startTime: moment(startTime).add(0, "d"),
					redemptions: 0,
					maxRedemptions: 0,
					percentage: true
				}]
			}])
				.then(result => {
					data = result;
					return q.all(times(1, () => SAPI.tokenCreate({
						card: cardObject()
					})))
						.then(successTokens => {
							stripeSuccessTokens = successTokens;
						});
				})
		);

		it("should create booking (coupon)", () => {
			const eventInstanceId = data.Event[0].eventInstanceId;
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.createBooking({
				...customerObject(),
				eventInstanceId,
				paymentMethod: TransactionController.paymentMethods.credit,
				stripeToken: stripeSuccessTokens[0].id,
				couponId: data.Coupon[0].couponId,
				amount: 0,
				attendees: {
					[data.Charge[3]._id]: [null]
				},
				answers: {
					[data.Question[0]._id]: "answer 1"
				}
			})
				.then(booking => {
					console.log(booking);
					assert.equal(booking.eventInstanceId, eventInstanceId);
				});
		});

		after(cleanUp);
	});

	describe("#insert (stripe errors)", () => {
		const mapping = [
			{number: cardErrors[9], code: "card_declined", message: "Your card was declined."},
			{number: cardErrors[10], code: "incorrect_cvc", message: "Your card's security code is incorrect."},
			{number: cardErrors[11], code: "expired_card", message: "Your card has expired."},
			{number: cardErrors[12], code: "processing_error", message: "An error occurred while processing your card. Try again in a little bit."}
		];

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
				model: "Charge",
				data: [
					chargeArray.vat,
					chargeArray.visa,
					chargeArray.food,
					chargeArray.adult,
					chargeArray.youth,
					chargeArray.child
				]
			}, {
				model: "Event",
				requires: {
					Operator: "o2o"
				},
				data: [{
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d")
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Event: [[0]],
					Operator: "o2o",
					Charge: [[3, 4, 5], [3, 4, 5]]
				},
				data: [{
					startTime: moment(startTime).add(-1, "d"),
					endTime: moment(endTime).add(-1, "d")
				}]
			}, {
				model: "Question",
				requires: {
					Operator: "m2o"
				},
				count: 2
			}, {
				model: "Activity",
				requires: {
					Location: "o2o",
					Operator: "o2o",
					TimeSlot: [[0]],
					Charge: [[0, 1, 2]],
					Question: [[0, 1]]
				},
				count: 1
			}])
				.then(result => {
					data = result;
				})
		);

		afterEach(() =>
			q.all([
				mailController.remove(),
				stripeErrorController.remove()
			])
		);

		mapping.forEach(({number, code, message}) => {
			it(`should throw \`${code}\``, () =>
				SAPI.tokenCreate({
					card: cardObject({
						number
					})
				})
					.then(token => {
						const eventInstanceId = data.Event[0].eventInstanceId;
						const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
						return client.createBooking({
							...customerObject(),
							eventInstanceId,
							paymentMethod: TransactionController.paymentMethods.credit,
							stripeToken: token.id,
							attendees: {
								[data.Charge[3]._id]: [null]
							}
						})
							.catch(e =>
								q.all([
									bookingController.findOne({eventInstanceId}, {populate: "transaction"}),
									stripeErrorController.find({eventInstanceId}),
									mailController.find()
								])
									.spread((booking, stripeError, mails) => {
										assert.equal(e.errors[0], message);
										assert.equal(booking.status, BookingController.statuses.inactive);
										assert.equal(booking.transaction.status, TransactionController.statuses.failed);
										assert.equal(stripeError.length, 1);
										assert.deepEqual(mails.map(mail => mail.templateName).sort(), ["booking_cancelled", "booking_confirmation_customer", "booking_confirmation_operator", "payment_error_operator"]);
									})
							)
							.then(assert.ifError);
					})
			);
		});

		after(cleanUp);
	});

	describe("#edit", () => {
		before(() =>
			mockInChain([{
				model: "ApiKey",
				data: [{
					permissions: ApiKeyController.permissions.admin,
					public: false
				}]
			}, {
				model: "Location",
				count: 1
			}, {
				model: "Manager",
				requires: {
					ApiKey: "o2o",
					Location: "o2o"
				},
				count: 1
			}, {
				model: "Payment",
				count: 1
			}, {
				model: "Operator",
				requires: {
					Location: "o2o",
					Manager: "o2o",
					Payment: "o2o"
				},
				count: 1
			}, {
				model: "Charge",
				data: [
					chargeArray.vat,
					chargeArray.visa,
					chargeArray.food,
					chargeArray.adult,
					chargeArray.youth,
					chargeArray.child
				]
			}, {
				model: "Transaction",
				requires: {
					Operator: "m2o"
				},
				data: new Array(3).fill({
					charges: [
						chargeArray.adult,
						chargeArray.youth,
						chargeArray.child,
						chargeArray.food,
						chargeArray.visa,
						chargeArray.vat,
						chargeArray.adjustment
					]
				})
			}, {
				model: "Question",
				requires: {
					Operator: "m2o"
				},
				count: 3
			}, {
				model: "Answer",
				requires: {
					Operator: "m2o",
					Question: "o2o"
				},
				count: 2
			}, {
				model: "Booking",
				requires: {
					Answer: [[], [], [0, 1]],
					ApiKey: "m2o",
					Operator: "m2o",
					Transaction: "o2o"
				},
				count: 3
			}, {
				model: "Event",
				requires: {
					Operator: "m2o",
					Booking: "o2o"
				},
				data: [{
					startTime: moment(startTime).add(1, "d"),
					endTime: moment(endTime).add(1, "d"),
					attendees: 3
				}, {
					startTime: moment(startTime).add(2, "d"),
					endTime: moment(endTime).add(2, "d"),
					attendees: 3
				}, {
					startTime: moment(startTime).add(3, "d"),
					endTime: moment(endTime).add(3, "d"),
					attendees: 3
				}]
			}, {
				model: "TimeSlot",
				requires: {
					Event: "o2m",
					Operator: "o2o",
					Charge: [[3, 4, 5]]
				},
				data: [{
					startTime: moment(startTime).add(-1, "d"),
					endTime: moment(endTime).add(-1, "d")
				}]
			}, {
				model: "Activity",
				requires: {
					Location: "o2o",
					Operator: "o2o",
					TimeSlot: "o2o",
					Charge: [[0, 1, 2]],
					Question: "o2m"
				},
				count: 1
			}, {
				model: "Client",
				requires: {
					Operator: "m2o",
					Booking: "o2o",
					Location: "m2o"
				},
				count: 3
			}])
				.then(result => {
					data = result;
					return q.all([
						q.all(times(3, () => SAPI.tokenCreate(data.Manager[0], {
							card: cardObject({
								number: cardNumbers[5]
							})
						})))
					])
						.spread((successTokens) => {
							stripeSuccessTokens = successTokens;
						});
				})
		);

		it("should edit attendees", () => {
			const answers = ["new answer 1", "new answer 2"];
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.editBooking({
				bookingId: data.Booking[2].bookingId,
				paymentMethod: TransactionController.paymentMethods.credit,
				stripeToken: stripeSuccessTokens[1].id,
				attendees: {
					[data.Charge[3]._id]: [data.Transaction[2].charges[0]._id.toString()],
					[data.Charge[4]._id]: [data.Transaction[2].charges[1]._id.toString()],
					[data.Charge[5]._id]: [data.Transaction[2].charges[2]._id.toString()]
				},
				addons: {
					[data.Charge[2]._id]: [data.Transaction[2].charges[3]._id.toString()]
				},
				answers: {
					[data.Question[0]._id]: answers[0],
					[data.Question[2]._id]: answers[1]
				}
			})
				.then(booking => {
					winston.debug("booking", booking);
					assert.equal(booking.answers.length, 3);
					assert.equal(booking.answers[0].answerText, "default answer 1");
					assert.equal(booking.answers[1].answerText, answers[0]);
					assert.equal(booking.answers[2].answerText, answers[1]);
				});
		});

		after(cleanUp);
	});

	describe("#patch", () => {
		before(() =>
			mockInChain([{
				model: "ApiKey",
				count: 1
			}, {
				model: "Location",
				count: 1
			}, {
				model: "Manager",
				requires: {
					ApiKey: "o2o",
					Location: "o2o"
				},
				count: 1
			}, {
				model: "Operator",
				requires: {
					Manager: "o2o"
				},
				count: 1
			}, {
				model: "Question",
				requires: {
					Operator: "m2o"
				},
				count: 3
			}, {
				model: "Answer",
				requires: {
					Operator: "m2o",
					Question: "o2o"
				},
				count: 2
			}, {
				model: "Booking",
				requires: {
					Operator: "m2o",
					Answer: [[], [], [], [], [0, 1], []]
				},
				data: [{
					startTime: moment(startTime).add(1, "d")
				}]
			}, {
				model: "Client",
				requires: {
					Booking: "o2o",
					Location: "o2o",
					Operator: "o2o"
				},
				count: 1
			}])
				.then(result => {
					data = result;
				})
		);

		it("should change answers", () => {
			const answers = ["new answer 1", "new answer 2"];
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.patchBooking({
				bookingId: data.Booking[0].bookingId,
				answers: {
					[data.Question[0]._id]: answers[0],
					[data.Question[2]._id]: answers[1]
				}
			})
				.then(booking => {
					assert.equal(booking.answers.length, 3);
					assert.equal(booking.answers[0].answerText, "default answer 1");
					assert.equal(booking.answers[1].answerText, answers[0]);
					assert.equal(booking.answers[2].answerText, answers[1]);
				});
		});

		after(cleanUp);
	});
});
