import _ from "lodash";

export default {
	render: function () {
		let form = document.createElement('form');
		_.map(['Name', 'Email', 'Contact'], function (field) {
			let lbl = document.createElement('label');
			lbl.innerHTML = field;
			let txt = document.createElement('input');
			txt.type = 'text';
			let container = document.createElement('div');
			container.className = 'field';
			container.appendChild(lbl);
			container.appendChild(txt);
			form.appendChild(container);
		});
		return form;
	}
};