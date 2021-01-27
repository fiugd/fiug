import { clone } from './utilities.mjs';

const chunkUtil = {
	rotate: (centerX, centerY, x, y, angle) => {
		var radians = (Math.PI / 180) * angle,
			cos = Math.cos(radians),
			sin = Math.sin(radians),
			nx = (cos * (x - centerX)) + (sin * (y - centerY)) + centerX,
			ny = (cos * (y - centerY)) - (sin * (x - centerX)) + centerY;
		return [nx, ny];
	},
	distance: (self, target) => {
		const { x: x1, y: y1 } = self;
		const { x: x2, y: y2 } = target;
		const distance = Math.hypot(x2 - x1, y2 - y1);
		//distance < 30 && console.log(`x diff: ${h}, y diff: ${v}, distance: ${distance}`);
		return distance;
	}
};

function distance(self, target) {
	const { x, y } = self;
	const { v, h } = target;
	const distance = Math.hypot(h, v);
	//distance < 30 && console.log(`x diff: ${h}, y diff: ${v}, distance: ${distance}`);
	return distance;
}

function rotate(centerX, centerY, x, y, angle) {
	var radians = (Math.PI / 180) * angle,
		cos = Math.cos(radians),
		sin = Math.sin(radians),
		nx = (cos * (x - centerX)) + (sin * (y - centerY)) + centerX,
		ny = (cos * (y - centerY)) - (sin * (x - centerX)) + centerY;
	return [nx, ny];
}

function worldToLocal(self, others = []) {
	const mapped = {
		front: [],
		left: [],
		right: [],
		back: []
	};

	const translated = others.map(o => {
		const rot = self.direction === 270
			? [o.x, o.y]
			: rotate(self.x, self.y, o.x, o.y, self.direction === 90
				? 270 - self.direction
				: 90 - self.direction
			);
		return {
			h: Number((rot[0] - self.x).toFixed(5)),
			v: Number((self.y - rot[1]).toFixed(5)),
			speed: o.speed, life: o.life
		};
	});
	// if(others.length > 5){
	//     debugger
	// }
	const sameLane = h => Math.abs(Math.round(h)) === 0;
	mapped.front = translated.filter(t => sameLane(t.h) && t.v > 0);
	mapped.back = translated.filter(t => sameLane(t.h) && t.v <= 0);
	mapped.left = translated.filter(t => Math.round(t.h) < 0);
	mapped.right = translated.filter(t => Math.round(t.h) > 0);

	return mapped;
}

function chunkRotCenter(chunk, intersect) {
	//TODO: change based on chunk attributes
	let whichRot = chunk.rotate || 0;
	if (chunk.type === "intersect") {
		whichRot = intersect;
	}
	const rots = {
		0: {
			x: chunk.min._x,
			y: chunk.max._y
		},
		90: {
			x: chunk.min._x,
			y: chunk.min._y
		},
		180: {
			x: chunk.max._x,
			y: chunk.min._y
		},
		270: {
			x: chunk.max._x,
			y: chunk.max._y
		}
	}
	return rots[whichRot];
}

function curvedMove(chunk, car, intersect) {
	//debugger
	//if(typeof intersect !== "undefined") debugger
	// find center of rotation based on chunk
	// determine change in x, y, direction, and rotation based on speed and chunk rotation center

	const angleSign = [180, 270].includes(chunk.rotate)
		? -1
		: 1;

	let reverseCurve = car.reverseCurve;
	if (!car.turning && car.direction === 0 && (!chunk.rotate || chunk.rotate === 0)) {
		reverseCurve = true;
	}

	if (!car.turning && car.direction === 90 && chunk.rotate === 180) {
		reverseCurve = true;
	}

	if (!car.turning && car.direction === 180 && chunk.rotate === 270) {
		reverseCurve = true;
	}

	if (!car.turning && car.direction === 90 && chunk.rotate === 90) {
		reverseCurve = true;
	}

	const rotCenter = chunkRotCenter(chunk, intersect);
	const distanceFromCenter = chunkUtil.distance({
		x: rotCenter.x,
		y: rotCenter.y,
	},
		car
	);
	//const distanceFromCenter = distance(rotCenter, car);

	let angle = angleSign * 11 * (car.speed / 2) * (1 - distanceFromCenter / 50);
	if (reverseCurve) {
		angle = -1 * angle;
	}
	const newCoords = chunkUtil.rotate(
		rotCenter.x,
		rotCenter.y,
		car.x, car.y,
		angle
	);

	/*
	//TODO: turning rotation: this could be done better, but fine for now
	// also - this is buggier than what is below
	const distanceFromCenter = distance({
		x: rotCenter.x,
		y: rotCenter.y,
	},
		{ x: newCoords[0], y: newCoords[1] }
	);
	const relativeXDistance = newCoords[0] - rotCenter.x;
	const relativeYDistance = rotCenter.y - newCoords[1];
	const xFactor = (1 - (relativeXDistance / distanceFromCenter));
	const yFactor = relativeYDistance / distanceFromCenter;
	const averageFactor = (xFactor + yFactor) / 2;
	*/

	const relativeXDistance = Math.abs(newCoords[0] - rotCenter.x);

	//TODO: see above, this is hacky and wrong
	const rot = (() => {
		const portion = (1 - (relativeXDistance / distanceFromCenter));
		return {
			0: -90 * portion,
			90: 90 * portion,
			180: -90 * portion,
			270: 90 * portion,
		}[chunk.rotate || 0];
	})();

	return {
		x: newCoords[0],
		y: newCoords[1],
		rotate: rot,
		reverseCurve
	};
}

function chunkMove(chunk, car, intersect) {
	let xdiff = 'TODO';
	let ydiff = 'TODO';
	let rotate = random(0, 359);

	let curvedTransform;
	if (chunk.type === "curved" || chunk.type === "intersect") {
		curvedTransform = curvedMove(chunk, car, intersect);
	}

	const transform = {
		x: xdiff,
		y: ydiff,
		rotate
	};
	return curvedTransform || transform;
}

function move(self, LANES_COUNT, CAR_WIDTH) {
	// will move in the proper direction
	// will stop at intersections
	// may change direction at intersection

	// will slow down if blocked from changing lanes
	// will resume speed if unblocked (+ will check if unblocked)
	// will change lane if blocked only in front

	const senseResult = self.sense('proximity').result;
	const { neighbors, umvelt = {} } = senseResult;
	if (self.chunk && umvelt.chunk && self.chunk.index === 121 && umvelt.chunk.index !== self.chunk.index) {
		//debugger;
	}

	self.prevChunk = (self.chunk && umvelt.chunk && self.chunk.index === umvelt.chunk.index)
		? self.prevChunk
		: self.chunk;
	self.chunk = umvelt.chunk;
	const local = worldToLocal(self, neighbors);

	// if(self.chunk && ["intersect", "curved"].includes(self.chunk.type)){
	//     self.x += self.CLIENT_WIDTH/2;
	//     self.y += self.CLIENT_HEIGHT/2;
	// }

	if (
		self.chunk && self.chunk.type === "intersect"
		&& [86].includes(self.chunk.index)
		&& self.direction === 90
		&& self.lane === 1
	) {
		const intersect = 180;
		self.reverseCurve = true;
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, intersect);
		self.x = transform.x;
		self.y = transform.y;

		self.rotate = transform.rotate;  //TODO: ugh!  a mess!!!;
		self.rotate = 180 - transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		return;
	}

	if (
		self.chunk && self.chunk.type === "intersect"
		&& [88, 86].includes(self.chunk.index)
		&& self.direction === 90
		//&& self.lane === 2
	) {
		const intersect = 90;
		//self.reverseCurve = true;
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, intersect);
		self.x = transform.x;
		self.y = transform.y;

		self.rotate = transform.rotate;  //TODO: ugh!  a mess!!!;
		self.rotate = 180 + transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 121 && self.prevChunk.index === 137) {
		//TODO: transform based on chunk should be used for all movements
		const intersect = self.lane === 1
			? 0
			: 270;
		if (self.lane !== 1) {
			self.reverseCurve = true;
		}
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, intersect);
		self.x = transform.x;
		self.y = transform.y;
		// console.log({
		//     x: self.x,
		//     y: self.y
		// });
		self.rotate = 180 - transform.rotate;  //TODO: ugh!  a mess!!!;
		if (self.lane !== 1) {
			self.rotate = 180 + transform.rotate;
		}

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		//self.direction = transform.reverseCurve ? -90 : 90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 121 && self.prevChunk.index === 122) {
			//TODO: transform based on chunk should be used for all movements
			const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 270);

			self.x = transform.x;
			self.y = transform.y;
			self.direction = 180;
			self.rotate = -90 + transform.rotate;

			self.life -= 1;
			if (self.alive) {
				self.alive = self.life > 0;
			}
			self.turning = true;
			self.reverseCurve = transform.reverseCurve;
			//self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
			return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 150 && self.prevChunk.index !== 151) {
		//TODO: transform based on chunk should be used for all movements
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 90);

		self.x = transform.x;
		self.y = transform.y;
		self.rotate = transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 150 && self.prevChunk.index === 151) {
		//TODO: transform based on chunk should be used for all movements
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 180);

		self.x = transform.x;
		self.y = transform.y;
		self.rotate = 180 - transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 118 && self.prevChunk.index === 117) {
		//TODO: transform based on chunk should be used for all movements
		self.reverseCurve = true;
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 0);

		self.x = transform.x;
		self.y = transform.y;

		self.rotate = 90 - transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		self.direction = 0;
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 118 && self.prevChunk.index === 119) {
		//TODO: transform based on chunk should be used for all movements
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 270);

		self.x = transform.x;
		self.y = transform.y;
		self.direction = 180;
		self.rotate = -90 + transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		//self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 118 && self.prevChunk.index === 134) {
		//TODO: transform based on chunk should be used for all movements
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 0);

		self.x = transform.x;
		self.y = transform.y;
		self.rotate = 180 - transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 114 && self.prevChunk.index === 115) {
		//TODO: transform based on chunk should be used for all movements
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 270);

		self.x = transform.x;
		self.y = transform.y;

		self.rotate = -1 * transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 125 && self.prevChunk.index === 124) {
		self.reverseCurve = true;
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 90);

		self.x = transform.x;
		self.y = transform.y;

		self.rotate = -90 - transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		//self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	const isGoing125from109 = self.chunk && self.chunk.type === "intersect" && self.chunk.index === 125 && self.prevChunk.index === 109;
	if(isGoing125from109){
		if(!self.randomTrueTried){
			self.randomTrue = random(1,100) > 50;
			self.randomTrueTried = true;
		}
	}
	if (isGoing125from109 && (self.turning || self.randomTrue)) {
		self.direction = 0;
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 90);

		self.x = transform.x;
		self.y = transform.y;

		self.rotate = 90 -transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		//self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 35 && self.prevChunk.index === 51) {
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 0);

		self.x = transform.x;
		self.y = transform.y;

		self.rotate = 180 - transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 35 && self.prevChunk.index === 34) {
		//TODO: transform based on chunk should be used for all movements
		//self.reverseCurve = true;
		//self.direction = 180;
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 0);

		self.x = transform.x;
		self.y = transform.y;

		self.rotate = -1 * transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		//self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "intersect" && self.chunk.index === 114 && self.prevChunk.index === 98) {
		//TODO: transform based on chunk should be used for all movements
		//self.reverseCurve = true;
		//self.direction = 180;
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, 180);

		self.x = transform.x;
		self.y = transform.y;

		self.rotate = 180 + transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		//self.direction = transform.reverseCurve ? 90 : -90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.chunk.type === "curved") {
		if (self.chunk.index === 149) {
			self.reverseCurve = true;
		}

		//TODO: transform based on chunk should be used for all movements
		const transform = umvelt.chunk && chunkMove(umvelt.chunk, self, umvelt);

		self.x = transform.x;
		self.y = transform.y;
		self.rotate = transform.rotate;

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		self.turning = true;
		self.reverseCurve = transform.reverseCurve;
		self.direction = transform.reverseCurve ? -90 : 90; //because all turns are based from 90
		return;
	}

	if (self.chunk && self.turning) {
		self.turning = false;

		if (self.chunk && self.prevChunk.index !== self.chunk.index) {
			if (self.chunk.north && self.chunk.north.index === self.prevChunk.index) {
				self.direction = 90;
			}
			if (self.chunk.east && self.chunk.east.index === self.prevChunk.index) {
				self.direction = 180;
			}
			if (self.chunk.south && self.chunk.south.index === self.prevChunk.index) {
				self.direction = 270;
			}
			if (self.chunk.west && self.chunk.west.index === self.prevChunk.index) {
				self.direction = 0;
			}
		}

		delete self.rotate;
		delete self.reverseCurve;
	}

	const isChangingLane = self.changing && self.changing.length;

	if (isChangingLane) {
		const delta = self.changing.pop();

		// this should be worked out using local -> global conversion
		// incremental change in perpendicular direction
		// TODO: change in x and y should relate to speed and triangular distance
		if (Number(self.direction) === 270) { // north
			self.x += delta;
			self.y -= self.speed;
		}
		if (Number(self.direction) === 180) { // west
			self.y -= delta;
			self.x -= self.speed;
		}
		if (Number(self.direction) === 90) {  // south
			self.x -= delta;
			self.y += self.speed;
		}
		if (Number(self.direction) === 0) {   // east
			self.y += delta;
			self.x += self.speed;
		}

		if (!self.changing.length) {
			self.changing = undefined;
		}

		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		return;
	}

	// if(local.front && local.front.length){
	//     console.log(local.front);
	// }

	const carsInFront = local.front && local.front.length &&
		local.front.sort((a, b) => a.v - b.v)[0].v < 30;
	const safeOnRight = local.right.length === 0
		|| !local.right.find(r => distance(self, r) < 40);
	const safeOnLeft = local.left.length === 0
		|| !local.left.find(l => distance(self, l) < 40);;
	const safeOnSide = safeOnLeft && safeOnRight;

	if (carsInFront && safeOnSide) {
		self.changeLane(LANES_COUNT, CAR_WIDTH);
		//TODO: why????
		self.move(LANES_COUNT, CAR_WIDTH);
		return;
	}

	if (carsInFront && !safeOnSide) {
		//console.log('cannot pass')
		const frontBlocker = local.front.sort((a, b) => a.v - b.v)[0];
		// TODO: would be nice to only temporarily change speed
		self.speed = clone(frontBlocker.speed);
		//self.life = clone(frontBlocker.life) + (frontBlocker.v/frontBlocker.speed);
		self.life -= 1;
		if (self.alive) {
			self.alive = self.life > 0;
		}
		//
		return;
	}


	// this should be worked out using local -> global conversion
	if (Number(self.direction) === 270) {
		self.y -= self.speed;
	}
	if (Number(self.direction) === 180) {
		self.x -= self.speed;
	}
	if (Number(self.direction) === 90) {
		self.y += self.speed;
	}
	if (Number(self.direction) === 0) {
		self.x += self.speed;
	}

	// const newSenseResult = self.sense('proximity').result;
	// if(!newSenseResult.umvelt.chunk){
	//     self.alive = false;
	// };

	self.life -= 1;
	if (self.alive) {
		self.alive = self.life > 0;
	}
}

export default move;
