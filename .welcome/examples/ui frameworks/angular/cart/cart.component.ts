import { Component, OnInit, forwardRef, Inject } from '@angular/core';
import { CartService } from './cart/cart.service.ts';

@Component({
	selector: 'app-cart',
	templateUrl: './cart/cart.component.html',
	styleUrls: ['./cart/cart.component.css']
})
export class CartComponent implements OnInit {
	items;

	constructor(
		@Inject(forwardRef(() => CartService))  private cartService: CartService
	) { }

	ngOnInit() {
		this.items = this.cartService.getItems();
	}

}