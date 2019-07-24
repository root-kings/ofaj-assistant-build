document.addEventListener('DOMContentLoaded', function() {
	goLight()
})

function doLogin() {
	let user = {
		username: document.querySelector('#username').value,
		password: document.querySelector('#password').value
	}
	// console.log(user)
	showWait()
	fetch(hostaddress + '/api/user/login', {
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		mode: 'cors', // no-cors, cors, *same-origin
		headers: {
			'Content-Type': 'application/json'
			// "Content-Type": "application/x-www-form-urlencoded",
		},
		body: JSON.stringify(user) // body data type must match "Content-Type" header
	})
		.then(function(response) {
			return response.json()
		})
		.then(function(result) {
			if (result) {
				console.log(result)
				localStorage.setItem('loggeduser', result._id)
				window.location.href = location.hostname == '' ? 'file:///android_asset/www/calibration.html' : '/calibration'
			}
			hideWait()
		})
}

function doRegister() {
	let user = {
		username: document.querySelector('#username').value,
		password: document.querySelector('#password').value,
		email: document.querySelector('#email').value,
		phone: document.querySelector('#phone').value,
		name: document.querySelector('#name').value
	}
	// console.log(user)

	showWait()

	fetch(hostaddress + '/api/user/create', {
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		mode: 'cors', // no-cors, cors, *same-origin
		headers: {
			'Content-Type': 'application/json'
			// "Content-Type": "application/x-www-form-urlencoded",
		},
		body: JSON.stringify({ user: user }) // body data type must match "Content-Type" header
	})
		.then(function(response) {
			return response.json()
		})
		.then(function(result) {
			if (result) {
				M.toast({ html: 'request sent' })
			}
			hideWait()
		})
}
