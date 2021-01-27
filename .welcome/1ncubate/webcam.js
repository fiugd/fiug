/*

https://github.com/thiscouldbebetter/HexEditor


*/


const deps = [
	'../shared.styl'
];

(async () => {

	await appendUrls(deps);

	console.info('collecting references: see comments')
	const video = document.createElement('video');
	video.muted = true;
	video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
	video.play()
	video.style.objectFit = 'cover';
	video.style.width = '100%';
	video.style.height = 'auto'
	const button = document.createElement('button');
	button.textContent = 'launch PiP'
	button.addEventListener("click", () => {
		video.requestPictureInPicture(); 
	});
	document.body.appendChild(video)
	document.body.appendChild(button);

})();
