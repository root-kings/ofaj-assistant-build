let documentVue

document.addEventListener('DOMContentLoaded', function() {
	showWait()
	documentVue = new Vue({
		el: '#document',
		data: {
			documentId: '',
			name: '',
			urgent: false,
			fileUrl: '',
			done: false,
			rejected: false,
			_id: '',
			applicant: '',
			currentOfficer: '',
			history: [],
			approved: false,
			passingOfficerLoggedIn: false
		},

		methods: {
			poplateDocument: function() {
				this.documentId = localStorage.getItem('selectedDocument')

				let currentVue = this

				fetch(`/api/document/${currentVue.documentId}`)
					.then(function(response) {
						return response.json()
					})
					.then(function(document) {
						currentVue.name = document.name
						currentVue.urgent = document.urgent
						currentVue.fileUrl = document.fileUrl
						currentVue.done = document.done
						currentVue.rejected = document.rejected
						currentVue._id = document._id
						currentVue.applicant = document.applicant
						currentVue.currentOfficer = document.currentOfficer
						currentVue.history = document.history
						currentVue.passingOfficerLoggedIn = localStorage.getItem('loggeduser') == currentVue.currentOfficer._id
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
			},

			rejectDocument: function() {
				if (confirm('Reject this document?')) {
					let currentVue = this
					showWait()
					fetch(`/api/document/${currentVue.documentId}/reject`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({officer: currentVue.currentOfficer._id})
					})
						.then(function(response) {
							if (response.status == 200) {
								M.toast({ html: 'Document rejected!' })
								currentVue.rejected = true
							} else {
								M.toast({ html: 'Error occured! Check console for details.' })
							}
							// TODO: redirect to success page
						})
						.catch(function(error) {
							M.toast({ html: 'Error occured! Check console for details.' })
							console.err(error)
						})
						.then(function() {
							hideWait()
						})
				}
			},

			approveDocument: function() {
				let currentVue = this
				showWait()
				fetch(`/api/document/${currentVue.documentId}/approve`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({officer: currentVue.currentOfficer._id})
				})
					.then(function(response) {
						if (response.status == 200) {
							M.toast({ html: 'Document approved!' })
							currentVue.approved = true
						} else {
							M.toast({ html: 'Error occured! Check console for details.' })
						}
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

			finalizeDocument: function() {
				let currentVue = this
				showWait()
				fetch(`/api/document/${currentVue.documentId}/finalize`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({officer: currentVue.currentOfficer._id})
				})
					.then(function(response) {
						if (response.status == 200) {
							M.toast({ html: 'Document finalized!' })
							currentVue.done = true
						} else {
							M.toast({ html: 'Error occured! Check console for details.' })
						}
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

			forwardDocument: function() {}
		},

		mounted: function() {
			this.poplateDocument()
			M.AutoInit()
			hideWait()
		}
	})
})
