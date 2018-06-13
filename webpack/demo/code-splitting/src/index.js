// statically import form module.
// import form from "./form";

window.onload = function () {
	let btn = document.getElementById('load');
	btn.addEventListener('click', function () {
		// dynamically import form module at run time.
		import(/* webpackChunkName: "form" */ './form').then(function (form) {
			document.getElementById('form').appendChild(form.default.render());
		});
	});
};