const hostaddress = location.hostname == '' ? 'https://root-maintenance-manager.herokuapp.com' : ''
document.addEventListener('DOMContentLoaded', function() {
	M.AutoInit()
	if (localStorage.getItem('theme') == 'dark') {
		console.log('Setting dark theme')
		goDark()
		document.getElementById('theme').checked = true
	}
	if (!localStorage.getItem('loggeduser') && !(window.location.href.includes('login') || window.location.href.includes('register'))) {
		window.location.href = location.hostname == '' ? 'file:///android_asset/www/login.html' : '/login'
	}
})
function logout() {
	localStorage.removeItem('loggeduser')
	window.location.href = location.hostname == '' ? 'file:///android_asset/www/login.html' : '/login'
}

function hasClass(el, className) {
	if (el != undefined) {
		if (el.classList) return el.classList.contains(className)
		return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
	} else {
		console.warn(`Element not found.`)
	}
}
function addClass(el, className) {
	if (el != undefined) {
		if (el.classList) el.classList.add(className)
		else if (!hasClass(el, className)) el.className += ' ' + className
	} else {
		console.warn(`Element not found.`)
	}
}
function addClassAll(els, className) {
	if (els != undefined) {
		els.forEach(el => {
			if (el.classList) el.classList.add(className)
			else if (!hasClass(el, className)) el.className += ' ' + className
		})
	} else {
		console.warn(`Elements not found.`)
	}
}
function removeClass(el, className) {
	if (el != undefined) {
		if (el.classList) el.classList.remove(className)
		else if (hasClass(el, className)) {
			var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
			el.className = el.className.replace(reg, ' ')
		}
	} else {
		console.warn(`Element not found.`)
	}
}
function removeClassAll(els, className) {
	if (els != undefined) {
		els.forEach(el => {
			if (el.classList) el.classList.remove(className)
			else if (hasClass(el, className)) {
				var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
				el.className = el.className.replace(reg, ' ')
			}
		})
	} else {
		console.warn(`Elements not found.`)
	}
}

function goDark() {
	addClass(document.querySelector('body'), 'dark')
	addClassAll(document.querySelectorAll('#upcoming, #spares'), 'container')
	addClassAll(document.querySelectorAll('.container li'), 'rounded')
	addClassAll(document.querySelectorAll('.container li .collapsible-body'), 'no-margin')
	removeClassAll(document.querySelectorAll('.card-title'), 'grey-text')
	removeClassAll(document.querySelectorAll('.card-title'), 'text-darken-4')
	removeClassAll(document.querySelectorAll('nav a'), 'teal-text')
	removeClass(document.querySelector('nav'), 'white')

	localStorage.setItem('theme', 'dark')
}

function goLight() {
	removeClass(document.querySelector('body'), 'dark')
	removeClassAll(document.querySelectorAll('#upcoming, #spares'), 'container')
	removeClassAll(document.querySelectorAll('li.rounded'), 'rounded')
	removeClassAll(document.querySelectorAll('li.rounded .collapsible-body'), 'no-margin')
	addClassAll(document.querySelectorAll('.card-title'), 'grey-text')
	addClassAll(document.querySelectorAll('.card-title'), 'text-darken-4')
	addClassAll(document.querySelectorAll('nav a'), 'teal-text')
	addClass(document.querySelector('nav'), 'white')

	localStorage.setItem('theme', 'light')
}

function changeTheme(checkbox) {
	console.log(checkbox.checked)
	if (checkbox.checked) {
		goDark()
	} else {
		goLight()
	}
}

function showWait() {
	document.getElementById('waitoverlay').style.display = 'block'
}

function hideWait() {
	document.getElementById('waitoverlay').style.display = 'none'
}
