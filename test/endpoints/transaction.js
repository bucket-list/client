import debug from "debug";
import assert from "power-assert";
import {chargeArray} from "abl-constants/build/objects";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";

import ApiKeyController from "abl-common/build/controllers/operator/api-key";


import Client from "../../source/index";

const log = debug("test:booking");

let data;

describe("Booking", () => {
	describe("#insert (widget)", () => {
		before(() =>
			mockInChain([{
				model: "ApiKey",
				data: [{
					permissions: ApiKeyController.permissions.dashboard,
					public: false,
					type: ApiKeyController.types.widget
				}]
			}, {
				model: "Payment",
				count: 1
			}, {
				model: "Operator",
				requires: {
					ApiKey: "o2o",
					Payment: "o2o"
				},
				count: 1
			}, {
				model: "Transaction",
				requires: {
					Operator: "m2o"
				},
				count: 1
			}])
				.then(result => {
					data = result;
				})
		);

		it("should partially refund payment", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.partialRefund({
				_id: data.Transaction[0]._id.toString(),
				amount: chargeArray.adult.amount / 2
			})
				.then(transaction => {
					console.log("transaction", transaction);
					assert.equal(transaction.balance, chargeArray.adult.amount / 2);

					assert.equal(transaction.payments.length, 2);
					assert.equal(transaction.payments[0].amount, chargeArray.adult.amount / 2);
					assert.equal(transaction.payments[1].amount, chargeArray.adult.amount);

					assert.equal(transaction.refunds.length, 1);
					assert.equal(transaction.refunds[0].amount, chargeArray.adult.amount / 2);
				});
		});

		after(cleanUp);
	});

});
