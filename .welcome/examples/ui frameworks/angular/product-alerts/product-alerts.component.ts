import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
	selector: 'app-product-alerts',
	templateUrl: './product-alerts/product-alerts.component.html',
	styleUrls: ['./product-alerts/product-alerts.component.css']
})
export class ProductAlertsComponent {
	@Input() product;
	@Output() notify = new EventEmitter();
}
