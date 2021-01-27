import { Component, NgModule, VERSION, OnInit, forwardRef, Inject } from '@angular/core';
import { FeatureFlagService } from './feature-flags/feature-flags.service.ts';

@Component({
	selector: "app-root",
	templateUrl: './app.component.html',
	styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit {
	constructor(
		@Inject(forwardRef(() => FeatureFlagService)) private featureFlagService: FeatureFlagService
	) { }

	ngOnInit(): void {
		this.featureFlagService.getDiscount()
	}

}