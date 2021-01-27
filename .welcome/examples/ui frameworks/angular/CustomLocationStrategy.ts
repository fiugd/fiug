/*

location strategy is overriden because preview needs base href to be ../../
however, angular does not need to do this and does not allow code to use custome base href otherwise

it might be useful to create a routing strategy that uses session storage instead of url


  path(includeHash?: boolean): string
  prepareExternalUrl(internal: string): string
  pushState(state: any, title: string, url: string, queryParams: string): void
  replaceState(state: any, title: string, url: string, queryParams: string): void
  forward(): void
  back(): void
  onPopState(fn: LocationChangeListener): void
  getBaseHref(): string

*/

import { Injectable } from '@angular/core';
import { HashLocationStrategy } from "@angular/common";

@Injectable()
export class CustomLocationStrategy extends HashLocationStrategy {
	prepareExternalUrl(internal: string): string {
		// don't change the url at all
		//console.log(internal)
		return document.location.href.split('#')[0];

		const url = document.location.href.split('#')[0] + '#' + internal;
		return url;
	}
	pushState(state, title, url, queryParams){
		//console.log({ state, title, url, queryParams })
	}
	replaceState(state: any, title: string, url: string, queryParams: string): void {
		//console.log({ state, title, url, queryParams })
	}
}