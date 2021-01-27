import { Component, OnInit, forwardRef, Inject, Input } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { products } from './products.ts';
import { CartService } from './cart/cart.service.ts';
import { FeatureFlagService } from './feature-flags/feature-flags.service.ts';

@Component({
	templateUrl: './product-details/product-details.component.html',
	styleUrls: ['./product-details/product-details.component.css'],
})
export class ProductDetailsComponent implements OnInit {
	product;
	discount;

	constructor(
		@Inject(forwardRef(() => ActivatedRoute)) private route: ActivatedRoute,
		@Inject(forwardRef(() => CartService)) private cartService: CartService,
		@Inject(forwardRef(() => FeatureFlagService)) private featureFlagService: FeatureFlagService
	) { }
	
	ngOnInit() {
		this.routeSub = this.route.paramMap.subscribe(params => {
			this.product = products[+params.get('id')];
		});
		this.discount = this.featureFlagService.getDiscount();
	}

	addToCart(product) {
		this.cartService.addToCart(product);
		window.alert('Your product has been added to the cart!');
	}

	ngOnDestroy() {
		this.routeSub.unsubscribe();
	}

}