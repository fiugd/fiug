/*
  https://developer.chrome.com/apps/offline_storage#managing_quota

  https://demo.agektmr.com/storage/


  https://gist.github.com/wilsonpage/01d2eb139959c79e0d9a
  https://localforage.github.io/localForage/


  https://love2dev.com/blog/what-is-the-service-worker-cache-storage-limit/
  https://blog.teamtreehouse.com/building-an-html5-text-editor-with-the-filesystem-apis

*/

const deps = [
	'../shared.styl',
];

function formatBytes(bytes) {
  var marker = 1024; // Change to 1000 if required
  var decimal = 3; // Change as required
  var kiloBytes = marker; // One Kilobyte is 1024 bytes
  var megaBytes = marker * marker; // One MB is 1024 KB
  var gigaBytes = marker * marker * marker; // One GB is 1024 MB
  var teraBytes = marker * marker * marker * marker; // One TB is 1024 GB

  if(bytes < kiloBytes) return bytes + " Bytes";
  if(bytes < megaBytes) return(bytes / kiloBytes).toFixed(decimal) + " KB";
  if(bytes < gigaBytes) return(bytes / megaBytes).toFixed(decimal) + " MB";
  return(bytes / gigaBytes).toFixed(decimal) + " GB";
}

/**
 * Calculate byte size of a text snippet
 * @author Lea Verou
 * MIT License
 */

(function(){
	var crlf = /(\r?\n|\r)/g;
	const whitespace = /(\r?\n|\r|\s+)/g;

	window.ByteSize = {
		count: function(text, options) {
			// Set option defaults
			options = options || {};
			options.lineBreaks = options.lineBreaks || 1;
			options.ignoreWhitespace = options.ignoreWhitespace || false;

			var length = text.length;
			const nonAscii = length - text.replace(/[\u0100-\uFFFF]/g, '').length;
			const lineBreaks = length - text.replace(crlf, '').length; 

			if (options.ignoreWhitespace) {
				// Strip whitespace
				text = text.replace(whitespace, '');

				return text.length + nonAscii;
			}
			else {
				return length + nonAscii + Math.max(0, options.lineBreaks * (lineBreaks - 1));
			}
		}
	};

})();


(async () => {
	await appendUrls(deps);

	const exampleFnText = (await (await fetch('./quotaIssue.js')).text());
	console.info(`Size of this file: ${formatBytes(window.ByteSize.count(exampleFnText))}`)



	// query
	let queryCallback = (used, granted) =>
		console.log(`Temp storage API: \tusing ${formatBytes(used)} of ${formatBytes(granted)}`);
	navigator.webkitTemporaryStorage
		.queryUsageAndQuota( queryCallback, console.error );

	// query Storage API
	if ('storage' in navigator && 'estimate' in navigator.storage) {
		const estimate = await navigator.storage.estimate()
		console.log(`Storage API: \t\tusing ${formatBytes(estimate.usage)} out of ${formatBytes(estimate.quota)}.`);
	}

	// requestQuota - probably does not work on temporary storage
	let newQuotaInBytes = 1e+9;
	let quotaCallback = (amount) => {
		console.log(`New quota amount: ${formatBytes(amount)}`);
	}
	let errorCallback = console.error;
	navigator.webkitTemporaryStorage
		.requestQuota(newQuotaInBytes,quotaCallback,errorCallback);
})()