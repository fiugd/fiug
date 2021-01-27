import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as LDClient from "launchdarkly-js-client-sdk";

@Injectable({
	providedIn: 'root'
})
export class FeatureFlagService {
	discount: BehaviorSubject<string>;

	constructor(){
		this.discount = new BehaviorSubject(0);
		const initLD = () => new Promise((resolve, reject) => {
			const options = {
				baseUrl: 'http://localhost:3333/proxy/https://app.launchdarkly.com',
				streamUrl: 'http://localhost:3333/proxy/https://clientstream.launchdarkly.com',
				eventsUrl:'http://localhost:3333/proxy/https://events.launchdarkly.com'
			};
			var ldclient = LDClient.initialize(
				'5fce9ba176384e0b5c5f1088',
				{ key: 'test', anonymous: true },
				options
			);
			ldclient
				.on('ready', function () {
					resolve(ldclient)
				})
		});
		
		initLD()
			.then(ldclient => {
				this.ldclient = ldclient
				const discount = this.ldclient.variation('store-discount');
				this.discount.next(discount);
				//console.log('feature discount set: ' + discount);
				this.ldclient
					.on('change', () => {
						const discount = this.ldclient.variation('store-discount');
						this.discount.next(discount);
						//console.log('feature discount updated: ' + discount);
					})
			})
	}

	getDiscount(): BehaviorSubject<String> {
		return this.discount;
	}
}
