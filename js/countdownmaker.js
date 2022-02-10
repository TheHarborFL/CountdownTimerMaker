"use strict";

const CANVAS_SIZE_X = 1920;
const CANVAS_SIZE_Y = 1080;

const TIME_FORMAT_MCSS = 1;
const TIME_FORMAT_CSS = 2;
const TIME_FORMAT_SS = 3;
const TIME_FORMAT_S = 4;

// Set up the background canvas
let bgCanvas = document.getElementById('background-canvas');
let bgCtx = bgCanvas.getContext('2d');

bgCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
for (let y = 0; y < 9; y++) {
	for (let x = y % 2; x < 16; x += 2) {
		bgCtx.fillRect(x * 120, y * 120, 120, 120);
	}
}

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let g_TextVerticalPosition;

drawCanvas(stringifySeconds(document.getElementById('duration').value), true);

let inputElements = document.querySelectorAll('input, select');
for (let i = 0; i < inputElements.length; i++) {
	inputElements[i].addEventListener('change', function() {
		let previewValue = document.getElementById('duration').value;
		if (this.id == 'sub-1m-format') {
			previewValue = 9;
		}
		drawCanvas(stringifySeconds(previewValue), true)
	});
}

document.getElementById('make-images').addEventListener('click', async () => {
	setControlsDisabled(true);
	let duration = document.getElementById('duration').value;
	let progressBar = document.getElementById('progress-bar');
	progressBar.style.display = 'block';
	progressBar.max = duration;

	let zipBlobWriter = new zip.BlobWriter('application/zip');
	let zipWriter = new zip.ZipWriter(zipBlobWriter);

	for (let seconds = duration; seconds >= 0; seconds--) {
		progressBar.value = duration - seconds;

		drawCanvas(stringifySeconds(seconds));

		let img = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
		await zipWriter.add((duration - seconds).toString().padStart(duration.toString().length, '0') + '.png', new zip.BlobReader(img));
	}

	await zipWriter.close();
	let blob = zipBlobWriter.getData();
	location.href = URL.createObjectURL(blob);
	setControlsDisabled(false);
});

function setControlsDisabled(disabled) {
	document.body.className = disabled ? 'working' : '';

	let controls = document.querySelectorAll('input, select, button');
	for (let i = 0; i < controls.length; i++) {
		controls[i].disabled = disabled;
	}
}

function stringifySeconds(seconds) {
	let formatted = Math.floor(seconds / 60) + ':' + (seconds % 60).toString().padStart(2, '0');
	if (seconds < 60) {
		switch (parseInt(document.getElementById('sub-1m-format').value, 10)) {
			case TIME_FORMAT_CSS:
				formatted = ':' + seconds.toString().padStart(2, '0');
				break;

			case TIME_FORMAT_SS:
				formatted = seconds.toString().padStart(2, '0');
				break;

			case TIME_FORMAT_S:
				formatted = seconds;
				break;
		}
	}

	return formatted;
}

function drawCanvas(text, recalculatePosition = false) {
	ctx.clearRect(0, 0, CANVAS_SIZE_X, CANVAS_SIZE_Y);

	ctx.strokeStyle = document.getElementById('stroke-color').value;
	ctx.lineWidth = document.getElementById('line-width').value;
	ctx.fillStyle = document.getElementById('text-color').value;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'bottom';

	let font = '';
	if (document.getElementById('font-bold').checked) {
		font += 'bold ';
	}
	if (document.getElementById('font-italic').checked) {
		font += 'italic ';
	}
	font += document.getElementById('font-size').value + 'px ';
	font += document.getElementById('font').value;
	ctx.font = font;

	if (recalculatePosition) {
		// Figure out our text position manually because textBaseline='middle' includes space for hangers, which don't
		// exist on numbers in most fonts.
		let textMetrics = ctx.measureText(text);
		g_TextVerticalPosition = (CANVAS_SIZE_Y + textMetrics.actualBoundingBoxAscent + Math.abs(textMetrics.actualBoundingBoxDescent)) / 2;
	}

	ctx.fillText(text, CANVAS_SIZE_X / 2, g_TextVerticalPosition);

	if (!document.getElementById('disable-stroke').checked) {
		ctx.strokeText(text, CANVAS_SIZE_X / 2, g_TextVerticalPosition);
	}
}
