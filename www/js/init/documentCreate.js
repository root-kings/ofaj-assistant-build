let documentFormVue

document.addEventListener('DOMContentLoaded', function() {
	showWait()
	documentFormVue = new Vue({
		el: '#documentCreateForm',
		data: {
			user: localStorage.getItem('loggeduser'),
			name: '',
			selectedofficer: '',
			file: '',
			fileUrl: '',
			urgent: false,
			officers: []
		},

		methods: {
			onSubmit: function() {
				showWait()

				let newDocument = {
					fileUrl: this.fileUrl,
					applicant: this.user,
					name: this.name,
					officer: this.selectedofficer,
					urgent: this.urgent
				}

				fetch('/api/document/create', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(newDocument)
				})
					.then(function(response) {
						M.toast({ html: 'Document application sent!' })
						// TODO: redirect to success page
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.err(error)
					})
					.then(function() {
						hideWait()
					})
			},

			onFileUpload: function() {
				this.file = this.$refs.file.files[0]
				if (this.file == null) return alert('No file selected.')
				this.getSignedRequest(this.file)
			},

			getSignedRequest: function(file) {
				// console.log(file)
				currentVue = this

				fetch(`/api/document/sign-s3?fileName=${file.name}&fileType=${file.type}`)
					.then(function(response) {
						return response.json()
					})
					.then(function(data) {
						currentVue.uploadFile(file, data.signedRequest, data.url)
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
			},

			uploadFile: function(file, signedRequest, url) {
				showWait()
				currentVue = this

				fetch(signedRequest, {
					method: 'PUT',
					mode: 'cors',
					body: file
				})
					.then(function(response) {
						currentVue.fileUrl = url
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
					.then(function() {
						hideWait()
					})
			},

			populateOfficers: function() {
				let currentVue = this

				fetch('/api/users')
					.then(function(response) {
						return response.json()
					})
					.then(function(users) {
						currentVue.officers = users
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
			}
		},

		mounted: function() {
			M.AutoInit()
			M.updateTextFields()
			this.populateOfficers()
			// TODO: initialize materialize select
			hideWait()
		}
	})
})
