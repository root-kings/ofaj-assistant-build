// Loaded via <script> tag, create shortcut to access PDF.js exports.
const pdfjsLib = window['pdfjs-dist/build/pdf']
// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/lib/pdf.worker.js'

let documentsVue, konvaTransformerInstance

document.addEventListener('DOMContentLoaded', function() {
	showWait()
	documentsVue = new Vue({
		el: '#documentList',
		data: {
			attendingdocuments: [],
			selfdocuments: [],
			selectedofficer: '',
			selectedformat: 'Case Purchase',
			documentId: '',
			name: '',
			fileUrl: '',
			applicant: localStorage.getItem('loggeduser'),
			currentOfficer: '',
			passingOfficerLoggedIn: false,
			file: '',
			officers: [],
			forwardOfficer: '',
			selectedDocument: '',

			OTP: '',
			OTPHash: ''
		},

		methods: {
			poplateDocuments: function() {
				let currentVue = this
				fetch(`/api/documents/user/${localStorage.getItem('loggeduser')}/to`)
					.then(function(response) {
						return response.json()
					})
					.then(function(docs) {
						docs.forEach((doc, docIndex) => {
							if (doc.history.length > 0) doc.approved = doc.history[doc.history.length - 1].action == 'Approved'
							doc.isBeingEdited = false
							doc.isBeingEdited = false
							doc.isSigned = doc.approved
							if (doc.rejected) docs.splice(docIndex, 1)
							doc.comment = ''
						})

						currentVue.attendingdocuments = docs
						currentVue.renderDocuments()
						// currentVue.documents.normal = documents.filter(document => !document.urgent)
					})

					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})

				fetch(`/api/documents/user/${localStorage.getItem('loggeduser')}/from`)
					.then(function(response) {
						return response.json()
					})
					.then(function(docs) {
						currentVue.selfdocuments = docs
						// currentVue.documents.normal = documents.filter(document => !document.urgent)
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
				hideWait()
			},

			viewDocument: function(id) {
				localStorage.setItem('selectedDocument', id)
				window.location.href = 'file:///android_asset/www/document'
			},

			poplateDocument: function() {
				this.documentId = localStorage.getItem('selectedDocument')

				let currentVue = this

				fetch(`/api/document/${currentVue.documentId}`)
					.then(function(response) {
						return response.json()
					})
					.then(function(doc) {
						currentVue.name = doc.name
						currentVue.urgent = doc.urgent
						currentVue.fileUrl = doc.fileUrl
						currentVue.done = doc.done
						currentVue.rejected = doc.rejected
						currentVue._id = doc._id
						currentVue.applicant = doc.applicant
						// currentVue.currentOfficer = document.currentOfficer
						currentVue.history = doc.history
						currentVue.passingOfficerLoggedIn = localStorage.getItem('loggeduser') == currentVue.currentOfficer._id
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
			},

			rejectDocument: function(doc) {
				if (sessionGet('OTPAuthenticated') == null) {
					M.toast({ html: 'You need to authenticate session.' })
					this.sessionSetModal()
					return
				}

				if (confirm('Reject this document?')) {
					let currentVue = this
					showWait()
					fetch(`/api/document/${doc._id}/reject`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ comment: doc.comment, officer: localStorage.getItem('loggeduser') })
					})
						.then(function(response) {
							if (response.status == 200) {
								M.toast({ html: 'Document rejected!' })
								doc.comment = ''
								// currentVue.rejected = true
							} else {
								M.toast({ html: 'Error occured! Check console for details.' })
							}
						})
						.catch(function(error) {
							M.toast({ html: 'Error occured! Check console for details.' })
							console.error(error)
						})
						.then(function() {
							currentVue.poplateDocuments()
							hideWait()
						})
				}
			},

			forwardDocumentModalOpen: function() {
				M.Modal.getInstance(document.querySelector('#documentForwardModal')).open()
			},

			sessionSetModal: function() {
				M.Modal.getInstance(document.querySelector('#OTPModal')).open()
				this.getOTPRequest()
			},

			validateOTP: function() {
				// console.log('Authenticating...')
				// console.log(this.OTP)
				hashish = sha256(JSON.stringify(this.OTP))
				// console.log(hashish)
				// console.log(this.OTPHash)

				if (this.OTPHash == hashish) {
					sessionSet('OTPAuthenticated', true)
					this.OTP = ''
					M.toast({ html: 'Authentication successful.' })

					M.Modal.getInstance(document.querySelector('#OTPModal')).close()
				}
			},

			getOTPRequest: function() {
				let currentVue = this
				fetch(`/api/document/getOTP`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ officer: localStorage.getItem('loggeduser') })
				})
					.then(function(response) {
						if (response.status == 200) {
							return response.json()
						} else {
							M.toast({ html: 'Error occured! Check console for details.' })
						}
					})
					.then(function(OTPHash) {
						currentVue.OTPHash = OTPHash.OTPHash ? OTPHash.OTPHash : ''
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
			},

			approveDocument: function() {
				if (sessionGet('OTPAuthenticated') == null) {
					M.toast({ html: 'You need to authenticate session.' })
					this.sessionSetModal()
					return
				}

				let currentVue = this
				let doc = this.selectedDocument

				showWait()

				// let formdata = new FormData()

				// formdata.append('comment', doc.comment)
				// formdata.append('officer', localStorage.getItem('loggeduser'))
				// formdata.append('fileData', doc.fileData)
				// formdata.append('fileUrl', doc.fileUrl)

				fetch(`/api/document/${doc._id}/approve`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},

					// body: formdata
					body: JSON.stringify({
						comment: doc.comment,
						officer: localStorage.getItem('loggeduser')
						// fileData: doc.fileData,
						// fileUrl: doc.fileUrl
					})
				})
					.then(function(response) {
						if (response.status == 200) {
							M.toast({ html: 'Document approved!' })
							doc.comment = ''
							// currentVue.approved = true
						} else {
							M.toast({ html: 'Error occured! Check console for details.' })
						}
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
					.then(function() {
						currentVue.poplateDocuments()
						hideWait()
					})
			},

			finalizeDocument: function() {
				let currentVue = this
				let doc = currentVue.selectedDocument
				showWait()
				fetch(`/api/document/${doc._id}/finalize`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ comment: doc.comment, officer: localStorage.getItem('loggeduser') })
				})
					.then(function(response) {
						if (response.status == 200) {
							M.toast({ html: 'Document finalized!' })
							doc.comment = ''
							// currentVue.done = true
						} else {
							M.toast({ html: 'Error occured! Check console for details.' })
						}
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
					.then(function() {
						currentVue.poplateDocuments()
						hideWait()
					})
			},

			forwardDocument: function() {
				let currentVue = this

				showWait()
				fetch(`/api/document/${currentVue.selectedDocument._id}/forward`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ comment: currentVue.selectedDocument.comment, officer: localStorage.getItem('loggeduser'), newOfficer: currentVue.forwardOfficer })
				})
					.then(function(response) {
						if (response.status == 200) {
							M.toast({ html: 'Document forwarded!' })
							currentVue.selectedDocument.comment = ''
							// currentVue.done = true
						} else {
							M.toast({ html: 'Error occured! Check console for details.' })
						}
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
					.then(function() {
						currentVue.poplateDocuments()
						M.Modal.getInstance(document.querySelector('#documentForwardModal')).close()
						hideWait()
					})
			},

			onSubmit: function() {
				showWait()
				let currentVue = this

				let newDocument = {
					fileUrl: this.fileUrl,
					applicant: this.applicant,
					name: this.name,
					officer: this.selectedofficer,
					format: this.selectedformat,
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
						console.error(error)
					})
					.then(function() {
						currentVue.poplateDocuments()
						hideWait()
					})
			},

			onFileUpload: function() {
				this.file = this.$refs.file.files[0]
				if (this.file == null) return alert('No file selected.')
				this.uploadFile(this.file)
			},

			// getSignedRequest: function(file) {
			// 	showWait()
			// 	// console.log(file)
			// 	currentVue = this

			// 	fetch(`/api/document/sign-s3?fileName=${file.name}&fileType=${file.type}`)
			// 		.then(function(response) {
			// 			return response.json()
			// 		})
			// 		.then(function(data) {
			// 			currentVue.uploadFile(file, data.signedRequest, data.url)
			// 		})
			// 		.catch(function(error) {
			// 			M.toast({ html: 'Error occured! Check console for details.' })
			// 			console.error(error)
			// 		})
			// },

			uploadFile: function(file) {
				// uploadFile: function(file, signedRequest, url) {
				showWait()
				currentVue = this

				// fetch(signedRequest, {
				// 	method: 'PUT',
				// 	mode: 'cors',
				// 	body: file
				// })
				let fileformdata = new FormData()
				fileformdata.append('file', file)
				fetch('/api/document/upload', {
					method: 'POST',
					body: fileformdata
				})
					.then(response => response.json())
					.then(function(response) {
						// currentVue.fileUrl = url
						currentVue.fileUrl = response.file
						console.log(response)
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
			},
			renderDocuments: function() {
				this.attendingdocuments.forEach(doc => {
					let url = doc.fileUrl
					let pdfid = `pdf${doc._id}`

					// Asynchronous download of PDF
					let loadingTask = pdfjsLib.getDocument(url)
					loadingTask.promise.then(
						function(pdf) {
							// console.log('PDF loaded')

							// Fetch the first page
							let pageNumber = 1
							pdf.getPage(pageNumber).then(function(page) {
								// console.log('Page loaded')

								let scale = 1.5 //1.5
								let viewport = page.getViewport({ scale: scale })

								// Prepare canvas using PDF page dimensions
								let canvas = document.getElementById(pdfid)
								let context = canvas.getContext('2d')
								canvas.height = viewport.height
								canvas.width = viewport.width

								// Render PDF page into canvas context
								let renderContext = {
									canvasContext: context,
									viewport: viewport
								}
								let renderTask = page.render(renderContext)
								renderTask.promise.then(function() {
									// console.log('Page rendered')
								})
							})
						},
						function(reason) {
							// PDF loading error
							console.error(reason)
						}
					)
				})
			},
			addCommentToPDF: function() {
				console.log('in addCommentToPDF')
				let doc = this.selectedDocument
				let doccanvas = document.querySelector(`#pdf${doc._id}`)
				var stage = new Konva.Stage({
					container: `konva-container${doc._id}`, // id of container <div>
					width: doccanvas.width,
					height: doccanvas.height
				})

				doc.isBeingEdited = true

				var layer = new Konva.Layer()
				stage.add(layer)

				var textNode = new Konva.Text({
					text: 'Comment',
					x: 50,
					y: 80,
					fontSize: 20,
					draggable: true,
					width: 200
				})

				layer.add(textNode)

				konvaTransformerInstance = new Konva.Transformer({
					node: textNode,
					enabledAnchors: ['middle-left', 'middle-right'],
					// set minimum width of text
					boundBoxFunc: function(oldBox, newBox) {
						newBox.width = Math.max(30, newBox.width)
						return newBox
					}
				})

				textNode.on('transform', function() {
					// reset scale, so only with is changing by transformer
					textNode.setAttrs({
						width: textNode.width() * textNode.scaleX(),
						scaleX: 1
					})
				})

				layer.add(konvaTransformerInstance)

				layer.draw()

				textNode.on('click', () => {
					konvaTransformerInstance.show()
				})

				textNode.on('dblclick', () => {
					// hide text node and transformer:
					textNode.hide()
					konvaTransformerInstance.hide()
					layer.draw()

					// create textarea over canvas with absolute position
					// first we need to find position for textarea
					// how to find it?

					// at first lets find position of text node relative to the stage:
					var textPosition = textNode.absolutePosition()

					// then lets find position of stage container on the page:
					var stageBox = stage.container().getBoundingClientRect()

					// so position of textarea will be the sum of positions above:
					var areaPosition = {
						x: stageBox.left + textPosition.x,
						y: stageBox.top + textPosition.y
					}

					// create textarea and style it
					var textarea = document.createElement('textarea')
					document.body.appendChild(textarea)

					// apply many styles to match text on canvas as close as possible
					// remember that text rendering on canvas and on the textarea can be different
					// and sometimes it is hard to make it 100% the same. But we will try...
					textarea.value = textNode.text()
					textarea.style.position = 'absolute'
					textarea.style.top = areaPosition.y + 'px'
					textarea.style.left = areaPosition.x + 'px'
					textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px'
					textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + 'px'
					textarea.style.fontSize = textNode.fontSize() + 'px'
					// textarea.style.border = 'none'
					textarea.style.padding = '0px'
					textarea.style.margin = '0px'
					textarea.style.overflow = 'hidden'
					textarea.style.background = 'none'
					textarea.style.outline = 'none'
					textarea.style.resize = 'none'
					textarea.style.lineHeight = textNode.lineHeight()
					textarea.style.fontFamily = textNode.fontFamily()
					textarea.style.transformOrigin = 'left top'
					textarea.style.textAlign = textNode.align()
					textarea.style.color = textNode.fill()
					rotation = textNode.rotation()
					var transform = ''
					if (rotation) {
						transform += 'rotateZ(' + rotation + 'deg)'
					}

					var px = 0
					// also we need to slightly move textarea on firefox
					// because it jumps a bit
					var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
					if (isFirefox) {
						px += 2 + Math.round(textNode.fontSize() / 20)
					}
					transform += 'translateY(-' + px + 'px)'

					textarea.style.transform = transform

					// reset height
					textarea.style.height = 'auto'
					// after browsers resized it we can set actual value
					textarea.style.height = textarea.scrollHeight + 3 + 'px'

					textarea.focus()

					function removeTextarea() {
						textarea.parentNode.removeChild(textarea)
						window.removeEventListener('click', handleOutsideClick)
						textNode.show()
						// tr.show()
						konvaTransformerInstance.forceUpdate()
						layer.draw()
					}

					function setTextareaWidth(newWidth) {
						if (!newWidth) {
							// set width for placeholder
							newWidth = textNode.placeholder.length * textNode.fontSize()
						}
						// some extra fixes on different browsers
						var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
						var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
						if (isSafari || isFirefox) {
							newWidth = Math.ceil(newWidth)
						}

						var isEdge = document.documentMode || /Edge/.test(navigator.userAgent)
						if (isEdge) {
							newWidth += 1
						}
						textarea.style.width = newWidth + 'px'
					}

					textarea.addEventListener('keydown', function(e) {
						// hide on enter
						// but don't hide on shift + enter
						if (e.keyCode === 13 && !e.shiftKey) {
							textNode.text(textarea.value)
							removeTextarea()
						}
						// on esc do not set value back to node
						if (e.keyCode === 27) {
							removeTextarea()
						}
					})

					textarea.addEventListener('keydown', function(e) {
						scale = textNode.getAbsoluteScale().x
						setTextareaWidth(textNode.width() * scale)
						textarea.style.height = 'auto'
						textarea.style.height = textarea.scrollHeight + textNode.fontSize() + 'px'
					})

					function handleOutsideClick(e) {
						konvaTransformerInstance.hide()
						if (e.target !== textarea) {
							removeTextarea()
						}
					}
					setTimeout(() => {
						window.addEventListener('click', handleOutsideClick)
					})
				})
			},

			finalizeTextOnCanvas: function() {
				let doc = this.selectedDocument
				let doccanvas = document.getElementById(`pdf${doc._id}`)
				let konvacont = document.getElementById(`konva-container${doc._id}`)
				let annotationcanvas = konvacont.querySelector('canvas')

				if (konvaTransformerInstance) konvaTransformerInstance.hide()
				// console.log(annotationcanvas)

				let ctx_doc = doccanvas.getContext('2d')
				// let ctx_annotation = annotationcanvas.getContext('2d')

				ctx_doc.drawImage(annotationcanvas, 0, 0, annotationcanvas.width, annotationcanvas.height)

				annotationcanvas.parentElement.removeChild(annotationcanvas)

				// doc.fileData = ctx_doc.toDataURL

				var imgData = doccanvas.toDataURL('image/jpeg', 1.0)

				var newPDF = new jsPDF({
					// orientation: 'p',
					unit: 'mm',
					format: 'a4'
					// putOnlyUsedFonts: false,
					// compress: false,
					// precision: 2,
					// userUnit: 1.0
				})

				console.log(doccanvas)
				console.log(annotationcanvas)
				console.log(newPDF)

				newPDF.addImage(imgData, 'JPEG', 0, 0,newPDF.internal.pageSize.width,newPDF.internal.pageSize.height)

				doc.fileData = newPDF.output('datauristring')
				// doc.fileData = dataURLtoFile(imgData, 'filedata.jpg')

				// console.log(doc.fileData)

				doc.isBeingEdited = false
				if (doc.isBeingSigned) {
					doc.isBeingEdited = false
					doc.isSigned = true
				}

				fetch(`/api/document/${doc._id}/save`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},

					// body: formdata
					body: JSON.stringify({
						fileData: doc.fileData,
						fileUrl: doc.fileUrl
					})
				})
					.then(function(response) {
						if (response.status == 200) {
							M.toast({ html: 'Document saved!' })
						} else {
							M.toast({ html: 'Error occured! Check console for details.' })
						}
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
					.then(function() {
						hideWait()
					})

				if (doc.isSigned && !doc.approved) {
					this.approveDocument()
				}
			},

			signDocument: function() {
				if (sessionGet('OTPAuthenticated') == null) {
					M.toast({ html: 'You need to authenticate session.' })
					this.sessionSetModal()
					return
				}

				let doc = this.selectedDocument

				doc.isBeingEdited = true
				doc.isBeingSigned = true

				let doccanvas = document.querySelector(`#pdf${doc._id}`)
				var stage = new Konva.Stage({
					container: `konva-container${doc._id}`, // id of container <div>
					width: doccanvas.width,
					height: doccanvas.height
				})

				var layer = new Konva.Layer()
				stage.add(layer)

				var textNode = new Konva.Text({
					text: 'Document digitally signed by Tusar Pandey',
					x: 50,
					y: 80,
					fontSize: 20,
					draggable: true,
					width: 300
				})

				layer.add(textNode)

				layer.draw()
			},
			// saveDocument: function(doc) {
			// 	let doccanvas = document.querySelector(`#pdf${doc._id}`)
			// 	// only jpeg is supported by jsPDF
			// 	var imgData = doccanvas.toDataURL('image/jpeg', 1.0)

			// 	doc.fileData = imgData
			// 	// var pdf = new jsPDF()

			// 	// pdf.addImage(imgData, 'JPEG', 0, 0)
			// 	// pdf.save('download.pdf')
			// },

			showContextMenu: function(e, doc) {
				this.selectedDocument = doc
				console.log(e.clientX + ',' + e.clientY)
				let cntnr = document.getElementById('cntnr')
				cntnr.style.left = e.clientX
				cntnr.style.top = e.clientY
				// $("#cntnr").hide(100);
				cntnr.style.display = 'block'

				document.addEventListener('click', function hidemenu() {
					cntnr.style.display = 'none'
					document.removeEventListener('click', hidemenu)
				})
			}
		},

		mounted: function() {
			showWait()
			this.poplateDocuments()
			// this.poplateDocument()
			this.populateOfficers()
			M.AutoInit()

			// hideWait()
		}
	})
})

// get from session (if the value expired it is destroyed)
function sessionGet(key) {
	let stringValue = window.sessionStorage.getItem(key)
	if (stringValue !== null) {
		let value = JSON.parse(stringValue)
		let expirationDate = new Date(value.expirationDate)
		if (expirationDate > new Date()) {
			return value.value
		} else {
			window.sessionStorage.removeItem(key)
		}
	}
	return null
}

// add into session
function sessionSet(key, value, expirationInMin = 30) {
	let expirationDate = new Date(new Date().getTime() + 60000 * expirationInMin)
	let newValue = {
		value: value,
		expirationDate: expirationDate.toISOString()
	}
	window.sessionStorage.setItem(key, JSON.stringify(newValue))
}

var sha256 = function sha256(ascii) {
	function rightRotate(value, amount) {
		return (value >>> amount) | (value << (32 - amount))
	}

	var mathPow = Math.pow
	var maxWord = mathPow(2, 32)
	var lengthProperty = 'length'
	var i, j // Used as a counter across the whole file
	var result = ''

	var words = []
	var asciiBitLength = ascii[lengthProperty] * 8

	//* caching results is optional - remove/add slash from front of this line to toggle
	// Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
	// (we actually calculate the first 64, but extra values are just ignored)
	var hash = (sha256.h = sha256.h || [])
	// Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
	var k = (sha256.k = sha256.k || [])
	var primeCounter = k[lengthProperty]
	/*/
	var hash = [], k = [];
	var primeCounter = 0;
	//*/

	var isComposite = {}
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate
			}
			hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
			k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0
		}
	}

	ascii += '\x80' // Append Ƈ' bit (plus zero padding)
	while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00' // More zero padding
	for (i = 0; i < ascii[lengthProperty]; i++) {
		j = ascii.charCodeAt(i)
		if (j >> 8) return // ASCII check: only accept characters in range 0-255
		words[i >> 2] |= j << (((3 - i) % 4) * 8)
	}
	words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0
	words[words[lengthProperty]] = asciiBitLength

	// process each chunk
	for (j = 0; j < words[lengthProperty]; ) {
		var w = words.slice(j, (j += 16)) // The message is expanded into 64 words as part of the iteration
		var oldHash = hash
		// This is now the undefinedworking hash", often labelled as variables a...g
		// (we have to truncate as well, otherwise extra entries at the end accumulate
		hash = hash.slice(0, 8)

		for (i = 0; i < 64; i++) {
			var i2 = i + j
			// Expand the message into 64 words
			// Used below if
			var w15 = w[i - 15],
				w2 = w[i - 2]

			// Iterate
			var a = hash[0],
				e = hash[4]
			var temp1 =
				hash[7] +
				(rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
				((e & hash[5]) ^ (~e & hash[6])) + // ch
				k[i] +
				// Expand the message schedule if needed
				(w[i] =
					i < 16
						? w[i]
						: (w[i - 16] +
						  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
								w[i - 7] +
								(rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | // s1
						  0)
			// This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
			var temp2 =
				(rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
				((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])) // maj

			hash = [(temp1 + temp2) | 0].concat(hash) // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
			hash[4] = (hash[4] + temp1) | 0
		}

		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i]) | 0
		}
	}

	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			var b = (hash[i] >> (j * 8)) & 255
			result += (b < 16 ? 0 : '') + b.toString(16)
		}
	}
	return result
}
