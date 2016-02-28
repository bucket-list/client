"use strict";

import debug from "debug";
import assert from "power-assert";
import {mockInChain, cleanUp} from "abl-common/build/test-utils/flow";
import Client from "../../source/index";

import CouponController from "abl-common/build/controllers/operator/coupon";

const log = debug("test:coupon");


let data;

describe("Controller Coupon", () => {
	describe("#get", () => {
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
				model: "Coupon",
				requires: {
					Operator: "m2o"
				},
				data: [{
					status: CouponController.statuses.active
				}, {
					status: CouponController.statuses.inactive
				}]
			}])
				.then(result => {
					data = result;
				})
		);

		it("should get active coupon", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getCouponById({couponId: data.Coupon[0].couponId})
				.then(coupon => {
					log(coupon);
					assert.ok(coupon);
				});
		});

		it("should get inactive coupon", () => {
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.getCouponById({couponId: data.Coupon[1].couponId})
				.then(coupon => {
					log(coupon);
					assert.ok(coupon);
				});
		});

		after(cleanUp);
	});

	describe("#edit", () => {
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
				model: "Coupon",
				requires: {
					Operator: "m2o"
				},
				data: [{
					status: CouponController.statuses.active
				}, {
					status: CouponController.statuses.inactive
				}]
			}])
				.then(result => {
					data = result;
				})
		);

		it("should edit coupon", () => {
			const maxRedemptions = 100;
			const client = new Client(data.ApiKey[0].publicKey, data.ApiKey[0].privateKey);
			return client.editCoupon({
					_id: data.Coupon[0]._id,
					maxRedemptions
				})
				.then(coupon => {
					log(coupon);
					assert.equal(coupon.maxRedemptions, maxRedemptions);
				});
		});

		after(cleanUp);
	});
});
