var spareview, stageEditView, stageEditViewModal, sparestageModal, sparestageEditModal

document.addEventListener('DOMContentLoaded', function() {
	sparestageEditModal = M.Modal.init(document.getElementById('sparestageeditmodal'))

	showWait()

	spareview = new Vue({
		el: '#spares',
		data: function() {
			return {
				spares: [],

				newstage: {
					name: '',
					dateexpected: '',
					timeout: '',
					datedone: '',
					notes: ''
				},

				selectedSpare: {
					stages: []
				},

				selectedStage: -1
			}
		},

		mounted: function() {
			this.updateView()
			M.Collapsible.init(document.querySelectorAll('.collapsible'), {
				accordion: false
			})
			stageEditViewModal = M.Modal.init(document.getElementById('sparestagemodal'))

			// M.Modal.init(document.querySelectorAll('.modal'))
			// M.Datepicker.init(
			// 	document.querySelectorAll('.datepicker'),
			// 	{
			// 		defaultDate: new Date(),
			// 		setDefaultDate: true,
			// 		format: 'yyyy-mm-dd'
			// 	}
			// )
			M.updateTextFields()
			hideWait()
		},

		methods: {
			updateView: function() {
				showWait()
				fetch(hostaddress + '/api/spares')
					.then(function(response) {
						return response.json()
					})
					.then(function(listspares) {
						// console.log(listspares)

						listspares.forEach(spare => {
							if (spare.stages[0]) spare.stages[0].dateexpected = spare.stages[0].datedone

							for (i = 1; i < spare.stages.length; i++) {
								spare.stages[i].dateexpected = moment(spare.stages[i - 1].datedone).add(spare.stages[i].timeout, 'days')
							}

							// 	spare.newstage = {
							// 		dateexpected: '',
							// 		timeout: '',
							// 		datedone: ''
							// 	}
						})

						spareview.spares = listspares
						hideWait()
					})
			},
			createSpare: function() {
				showWait()
				var createform = document.getElementById('createspareform')
				var formData = new FormData(createform)

				var formobject = {}
				formData.forEach(function(value, key) {
					formobject[key] = value
				})

				fetch(hostaddress + '/api/spare/create', {
					method: 'POST', // *GET, POST, PUT, DELETE, etc.
					mode: 'cors', // no-cors, cors, *same-origin
					headers: {
						'Content-Type': 'application/json'
						// "Content-Type": "application/x-www-form-urlencoded",
					},
					body: JSON.stringify(formobject) // body data type must match "Content-Type" header
				})
					.then(function(response) {
						return response.json()
					})
					.then(function(result) {
						if (result) {
							M.toast({ html: 'Spare created!' })
							spareview.updateView()
							createform.reset()
						}
						hideWait()
					})
			},
			spareEdit: function(id) {
				localStorage.setItem('spareId', id)
				window.location.href = location.hostname == '' ? 'file:///android_asset/www/spare.html' : '/spare'
			},

			spareEditTimerModal: function(spareindex) {
				spareview.selectedSpare = spareview.spares[spareindex]
				stageEditViewModal.open()
				M.updateTextFields()
			},

			addStage: function() {
				// console.log(spareindex)

				this.selectedStage == -1 ? this.selectedSpare.stages.push(this.newstage) : (this.selectedSpare.stages[this.selectedStage] = this.newstage)

				this.spareStageUpdate(this.selectedSpare._id, this.selectedSpare.stages)

				this.clearStage()
				this.updateView()
				M.updateTextFields()
			},

			spareStageUpdate: function(id, stages) {
				showWait()
				// console.log('Seleceted ID:', spareview.selectedSpare._id)
				// console.log('ID:', id)
				// console.log('Stages:', stages)

				fetch(hostaddress + '/api/spare/' + id + '/stage', {
					method: 'POST',
					mode: 'cors',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ stages: stages })
				})
					.then(function(response) {
						return response.json()
					})
					.then(function(result) {
						if (result) {
							spareview.updateView()
							M.toast({ html: 'Updated!' })
						}
						hideWait()
					})
			},

			spareStageDone: function(spareindex, stageindex) {
				this.spares[spareindex].stages[stageindex].datedone = new Date()
				this.spares[spareindex].stage = stageindex

				this.spareStageUpdate(this.spares[spareindex]._id, this.spares[spareindex].stages)
			
				fetch(hostaddress + '/api/spare/' + this.spares[spareindex]._id + '/stage/done', {
					method: 'POST',
					mode: 'cors',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ stage: stageindex })
				})
					.then(function(response) {
						return response.json()
					})
					.then(function(result) {
						if (result) {
							spareview.updateView()
							M.toast({ html: 'Updated!' })
						}
						hideWait()
					})
			
			},

			// addStageModal: function(spareindex) {
			// 	sparestageEditModal.open()
			// },
			selectStage: function(stageIndex) {
				// console.log(stageIndex)
				this.newstage = this.selectedSpare.stages[stageIndex]
				this.selectedStage = stageIndex
				// this.stageSaveButtonText = "Save"
				M.updateTextFields()
			},

			spareDelete: function(id) {
				if (confirm('Delete this spare?')) {
					showWait()
					fetch(hostaddress + '/api/spare/' + id + '/delete', {
						method: 'POST',
						mode: 'cors'
					})
						.then(function(response) {
							return response.json()
						})
						.then(function(result) {
							if (result) {
								M.toast({ html: 'Spare deleted!' })
								spareview.updateView()
							}
							hideWait()
						})
				}
			},

			deleteStage: function() {
				this.selectedSpare.stages.splice(this.selectedStage, 1)
				this.spareStageUpdate(this.selectedSpare._id, this.selectedSpare.stages)
				this.clearStage()
				this.updateView()
			},

			clearStage: function() {
				this.newstage = {
					name: '',
					dateexpected: '',
					timeout: '',
					datedone: '',
					notes: ''
				}

				this.selectedStage = -1
			}
		}
	})
})

// function spareEditTimer(id) {
// 	showWait()
// 	var newtimerform = new FormData(document.getElementById('sparestagemodalform' + id))
// 	var newtimerdata = {}
// 	newtimerform.forEach(function(value, key) {
// 		newtimerdata[key] = value
// 	})

// 	var newtimer = {}

// 	console.log(newtimer)

// 	fetch(hostaddress + '/api/spare/' + id + '/stage/timer', {
// 		method: 'POST',
// 		mode: 'cors',
// 		headers: {
// 			'Content-Type': 'application/json'
// 		},
// 		body: JSON.stringify(newtimer)
// 	})
// 		.then(function(response) {
// 			return response.json()
// 		})
// 		.then(function(result) {
// 			if (result) {
// 				// spareview.updateView()
// 				M.toast({ html: 'Timer updated!' })
// 			}
// 			hideWait()
// 		})
// }
