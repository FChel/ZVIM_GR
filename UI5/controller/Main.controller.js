sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/message/Message",
	"sap/m/MessageBox",
	"sap/ui/core/library",
	"jquery.sap.global",
	"../model/util",
	"../model/models",
	"sap/ui/model/Sorter"
	], function(BaseController, formatter, JSONModel, Filter, FilterOperator, Message, MessageBox, library, jQuery, util, models, Sorter) {
	"use strict";

	return BaseController.extend("au.gov.defence.roman.zvim.gr.controller.Main", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		
		onInit: function() {
			this.registerMessageManager();

			this.setModel(new JSONModel({}), "viewModel");
			var viewModel = new JSONModel({});
			viewModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			
			this.getRouter().getRoute("main").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("doc").attachPatternMatched(this._onDocMatched, this);
			this.getRouter().getRoute("doc_prompt").attachPatternMatched(this._onDocPromptMatched, this);				
			
			models.initialiseFilterConfig(this.getOwnerComponent());
			
			// overwrite FLP back button ...
			var bFLP = this.getOwnerComponent().getModel("componentModel").getProperty("/inFLP");			
			if (bFLP === true) {
				this.getOwnerComponent().getService("ShellUIService").then(function(oShellService) {
					oShellService.setBackNavigation(function() {
						sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
							target: {
								shellHash: "#Shell-home"
							}
						});
					});
				});				
			}			
		},
		
		onExit: function(oEvent) {
			var oViewModel = this.getModel("viewModel");
			var sLockAction = "";
			if (oViewModel.getProperty("/addGrAction")) {
				oViewModel.setProperty("/addGrAction", false);
				sLockAction = "E";
			}

			var sPath = util.getContextPath(this.getView());
			if (sPath !== "") {
				this.getModel().setProperty(sPath + "LockingAction/LockAction", sLockAction);
				this.getModel().setProperty(sPath + "ActionNav/Useraction", "CLOSE");
		
				this.callServiceCreateDeepEntity(true);
			}
		},		

		/* =========================================================== */
		/* pattern match route handlers                                */
		/* =========================================================== */
		
		_onRouteMatched: function(oEvent) {
			//Get VIM DOc ID from URI Parameter
			var sVim = jQuery.sap.getUriParameters().get("VIMDOC");
			this._resetView();
			if (sVim === null) {
				var sTitle = this.getResourceBundle().getText("noVIMDocNoTitle");
				var sMsg = this.getResourceBundle().getText("noVIMDocNo");

				MessageBox.error(sMsg, {
					title: sTitle, //"No VIM Document Number",
					actions: [MessageBox.Action.OK]
				});

			} else {
				this._bindView(sVim.toString());
			}
		},
		
		_onDocMatched: function (oEvent) {
			this._resetView();
					
			var sObjectId =  oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				this._bindView(sObjectId);
			}.bind(this));
		},

		_onDocPromptMatched: function (oEvent) {
			this._resetView();
			
			this.getModel().metadataLoaded().then( function() {
				this.getDocSelectDialog().open();
			}.bind(this));
		},		
		
		/* =========================================================== */
		/* Doc Select Dialog                                            */
		/* =========================================================== */

		onDocSelectOK: function() {
			var sDocId = this.getModel("viewModel").getProperty("/docSelectInput");			
			if (sDocId === "") {
				MessageBox.error(this.getResourceBundle().getText("poBlankErrorText"), {
					title: this.getResourceBundle().getText("errorTitle"),
					initialFocus: null,
					onClose: function(sAction) {}
				});
			} else {
				this.getRouter().navTo("doc", {
					objectId: sDocId
				}, false);

				this.getDocSelectDialog().close();
			}
		},

		onDocSelectCancel: function() {
			this.getDocSelectDialog().close();
			this.onNavHome();
		},

		getDocSelectDialog: function () {
			if (! this.oDocSelectDialog) {
				this.oDocSelectDialog = sap.ui.xmlfragment("au.gov.defence.roman.zvim.gr.view.DocSelectDialog", this);
				this.oDocSelectDialog.setEscapeHandler(function(oEscHandler) {oEscHandler.reject(); });
				this.getView().addDependent(this.oDocSelectDialog);
			}
			return this.oDocSelectDialog;
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * submitting data to the backend if bSubmit flag is true then post a GR otherwise validate only
		 */

		enableElements: function(flag) {
			this.getModel("viewModel").setProperty("/enableBtns", flag);
		},

		// Display image in new window
		onViewImage: function() {
			// Retrieve the image from the oData service and display in a new Browser session (pops up in front of the app)
			//var sURI = this.getResourceBundle().getText("imageUrl", [this.getView().getBindingContext().getObject("Vimdocid")]);
			var sURI = this.getModel().sServiceUrl + "/VimImages('" + this.getView().getBindingContext().getObject("Vimdocid") + "')/$value";
			window.open(sURI, "Popup", "location,status,scrollbars,resizable,width=800, height=800");
		},

		onGRSortClick: function(oEvent) {
			if (!this.invoiceGRSortDialog) {
				this.invoiceGRSortDialog = sap.ui.xmlfragment(this.createId("GRSortDlg"), "au.gov.defence.roman.zvim.gr.view.GRSortDlg", this);
				this.getView().addDependent(this.invoiceGRSortDialog);
			}

			this.invoiceGRSortDialog.addCustomData(new sap.ui.core.CustomData({
				key: "table",
				value: "movementsTable"
			}));

			this.invoiceGRSortDialog.open();
		},

		onItemsSortClick: function(oEvent) {
			if (!this.creditGRSortDialog) {
				this.creditGRSortDialog = sap.ui.xmlfragment(this.createId("itemsSortDlg"), "au.gov.defence.roman.zvim.gr.view.itemsSortDlg", this);
				this.getView().addDependent(this.creditGRSortDialog);
			}

			this.creditGRSortDialog.addCustomData(new sap.ui.core.CustomData({
				key: "table",
				value: "itemsTable"
			}));

			this.creditGRSortDialog.open();
		},

		onSortDialogConfirm: function(oEvent) {
			var oTable = this.byId(oEvent.getSource().data().table),
			mParams = oEvent.getParameters(),
			oBinding = oTable.getBinding("items"),
			sPath,
			bDescending,
			aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		onFilterClick: function(oEvent) {
			var sDialogName = oEvent.getSource().data().dlgName;
			var filterConfigData = this.getModel("filterConfigModel").getData();
			var filterConfig = filterConfigData[sDialogName];

			if (!sDialogName || !filterConfig) {
				return;
			}
			var oComponenet = this.getOwnerComponent();
			var oResourceBundle = this.getResourceBundle();

			var oDialog = oComponenet.filterDialogs[sDialogName];
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(this.createId(sDialogName), "au.gov.defence.roman.zvim.gr.view.filterDlg", this);
				oEvent.getSource().addDependent(oDialog);
				var filterModel = new JSONModel({});
				oDialog.setModel(filterModel, "filterModel");
				oDialog.addCustomData(new sap.ui.core.CustomData({
					key: "dlgName",
					value: sDialogName
				}));

				var keyCodes = sap.ui.requireSync("sap/ui/events/KeyCodes");
				oDialog.attachBrowserEvent("keydown", function(evt) {
					//add an event handler so that user can use ENTER to search
					if (evt.keyCode === keyCodes.ENTER) {
						evt.stopImmediatePropagation();
						evt.preventDefault();
						if (oDialog.getBeginButton()) {
							oDialog.getBeginButton().firePress();
						}
					}
				});

				oDialog.setModel(new JSONModel({
					"dlgName": sDialogName,
					"tabelName": oEvent.getSource().data().tabelName
				}), "displayModel");
				oComponenet.filterDialogs[sDialogName] = oDialog;

				var oForm = new sap.ui.layout.form.SimpleForm({
					editable: true,
					layout: "ColumnLayout",
					columnsM: 2,
					columnsL: 2,
					columnsXL: 2,
					labelSpanXL: 3,
					labelSpanL: 4,
					labelSpanM: 3
				});

				for (var fieldName in filterConfig.fieldList) {
					if (!filterConfig.fieldList[fieldName]) {
						continue;
					}

					//if the field is filterable
					if (filterConfig.fieldList[fieldName].filterOperator && filterConfig.fieldList[fieldName].label) {
						var oControl = null;
						var label = oResourceBundle.getText(filterConfig.fieldList[fieldName].label);
						var placeHolder = oResourceBundle.getText(filterConfig.fieldList[fieldName].placeholderLabel || filterConfig.fieldList[fieldName]
						.label);
						placeHolder = oResourceBundle.getText("filter." + filterConfig.fieldList[fieldName].filterOperator + ".placeholder", [
							placeHolder
							]);
						oForm.addContent(new sap.m.Label({
							text: label
						}));

						if (filterConfig.fieldList[fieldName].hasOwnProperty("default")) {
							filterModel.setProperty("/" + fieldName, filterConfig.fieldList[fieldName].default);
						}
						switch (filterConfig.fieldList[fieldName].controlType) {
						case "boolean":
							oControl = new sap.m.CheckBox({
								selected: "{filterModel>/" + fieldName + "}"
							});
							break;

						case "range":
							if (filterConfig.fieldList[fieldName].type === "date") {
								oControl = new sap.m.DateRangeSelection({
									dateValue: "{path: 'filterModel>/" + fieldName + "_FROM'}",
									secondDateValue: "{path: 'filterModel>/" + fieldName + "_TO'}",
									displayFormat: "dd.MM.yyyy",
									valueFormat: "dd.MM.yyyy"
								});
							} else {
								oControl = new sap.m.Input({
									value: "{filterModel>/" + fieldName + "_FROM}",
									maxLength: {
										path: (filterConfig.modelName ? filterConfig.modelName + ">" : "") + filterConfig.entitySet + "/" + fieldName +
										"/0/#@maxLength",
										formatter: formatter.fieldLengthFormatter
									},
									type: filterConfig.fieldList[fieldName].type === "number" ? sap.m.InputType.Number : sap.m.InputType.Text,
											placeholder: "From",
											valueLiveUpdate: true
								});
								oForm.addContent(oControl);
								oControl = new sap.m.Input({
									value: "{filterModel>/" + fieldName + "_TO}",
									maxLength: {
										path: (filterConfig.modelName ? filterConfig.modelName + ">" : "") + filterConfig.entitySet + "/" + fieldName +
										"/0/#@maxLength",
										formatter: formatter.fieldLengthFormatter
									},
									type: filterConfig.fieldList[fieldName].type === "number" ? sap.m.InputType.Number : sap.m.InputType.Text,
											placeholder: "To",
											valueLiveUpdate: true
								});
							}
							break;

						case "comboBox":
							oControl = new sap.m.Select({
								selectedKey: "{path: 'filterModel>/" + fieldName + "'}",
								items: {
									path: filterConfig.fieldList[fieldName].items,
									template: new sap.ui.core.Item({
										key: {
											path: filterConfig.fieldList[fieldName].itemKey
										},
										text: {
											parts: [{
												path: filterConfig.fieldList[fieldName].itemKey
											}, {
												path: filterConfig.fieldList[fieldName].itemValue
											}],
											formatter: formatter[filterConfig.fieldList[fieldName].formatter] ? formatter[filterConfig.fieldList[fieldName].formatter]
										.bind(this) : formatter.valueHelpDisplay.bind(this)
										}
									})
								}

							});
							break;

						default:
							oControl = new sap.m.Input({
								value: "{filterModel>/" + fieldName + "}",
								maxLength: {
									path: (filterConfig.modelName ? filterConfig.modelName + ">" : "") + filterConfig.entitySet + "/" + fieldName +
									"/0/#@maxLength",
									formatter: formatter.fieldLengthFormatter
								},
								placeholder: placeHolder,
								type: filterConfig.fieldList[fieldName].type === "number" ? sap.m.InputType.Number : sap.m.InputType.Text,
										valueLiveUpdate: true
							});
						break;
						}
						if (oControl) {
							oForm.addContent(oControl);
						}

					}
				}

				oDialog.addContent(oForm);
			} else {
				oDialog.setModel(oEvent.getSource().getModel());
			}
			oDialog.open();

		},

		onFilterOK: function(oEvent) {
			var sDlgName = oEvent.getSource().getModel("displayModel").getProperty("/dlgName");
			var oDialog = this.getOwnerComponent().filterDialogs[sDlgName];

			var oFilterModel = oDialog.getModel("filterModel");
			var oFilterData = oFilterModel.getData();
			var oTable = this.byId(oEvent.getSource().getModel("displayModel").getProperty("/tabelName"));
			var aFilters = [];
			var oFilter, sDataField;
			var filterConfigData = this.getModel("filterConfigModel").getData();
			var vhConfig = filterConfigData[sDlgName];
			var to, from, sFilterFieldName;

			for (var oFilterItem in oFilterData) {
				oFilter = null;
				if ((oFilterData[oFilterItem] || oFilterData[oFilterItem] === false) && oFilterData[oFilterItem] !== "" && oFilterData[oFilterItem] !==
					undefined) {
					//Remove FROM and TO if this is a range filter
					sFilterFieldName = oFilterItem;
					sDataField = oFilterItem.replace("_FROM", "").replace("_TO", "");
					if (vhConfig.fieldList[sDataField].type === "number" && oFilterData[oFilterItem]) {
						oFilterData[oFilterItem] = Number(oFilterData[oFilterItem]);
					}
					if (oFilterItem.indexOf("_FROM") > -1) {
						to = oFilterItem.replace("_FROM", "_TO");
						sFilterFieldName = sFilterFieldName.replace("_FROM", "");
						// if(oFilterData[to]){
						if (oFilterData[to] && oFilterData[to] && Number(oFilterData[oFilterItem]) > Number(oFilterData[to])) {
							MessageBox.error(this.getResourceBundle().getText(vhConfig.fieldList[sFilterFieldName].label) +
									this.getResourceBundle().getText("fromMoreThanTo.error"), {
								actions: [MessageBox.Action.OK]
							});
							return;
						}
						if (vhConfig.fieldList[sDataField].type === "number" && oFilterData[to]) {
							oFilterData[to] = Number(oFilterData[to]);
						}
						oFilter = new Filter(sFilterFieldName, FilterOperator.BT, oFilterData[oFilterItem] || null, oFilterData[to] || null);

					} else if (oFilterItem.indexOf("_TO") > -1) {
						from = oFilterItem.replace("_TO", "_FROM");
						sFilterFieldName = sFilterFieldName.replace("_TO", "");

						//if from field exists, this was handled by FROM above
						if (!oFilterData[from]) {
							oFilter = new Filter(sFilterFieldName, FilterOperator.BT, oFilterData[from] || null, oFilterData[oFilterItem] || null);
						}
					} else {
						oFilter = new Filter(sFilterFieldName, FilterOperator[vhConfig.fieldList[oFilterItem].filterOperator], oFilterData[oFilterItem]);
					}
					if (oFilter) {
						aFilters.push(oFilter);
					}

				}
			}

			oFilter = aFilters.length > 1 ? [new Filter({
				filters: aFilters,
				and: true
			})] : aFilters;

			if (oTable.bindItems) {
				oTable.getBinding("items").filter(oFilter);
			}

			oDialog.close();
		},

		onFilterCancel: function(oEvent) {
			var sDlgName = oEvent.getSource().getModel("displayModel").getProperty("/dlgName");
			if (this.getOwnerComponent().filterDialogs[sDlgName]) {
				this.getOwnerComponent().filterDialogs[sDlgName].close();
			}
		},

		onPurchaseOrderPress: function(oEvent) {
			var oDoc = oEvent.getSource().getBindingContext().getObject();

			var sUrl = this.getResourceBundle().getText("ssp.po.app.display.url", [oDoc.PoNumber]);
			sap.m.URLHelper.redirect(sUrl, true);
		},

		onValidate: function() {
			var sPath = util.getContextPath(this.getView());
			this.getModel().setProperty(sPath + "LockingAction/LockAction", "E");
			this.getModel().setProperty(sPath + "ActionNav/Useraction", "VALIDATE");

			this.callServiceCreateDeepEntity();
		},

		onItemSelectionChanged: function(oEvent) {

			var sPath = util.getContextPath(this.getView());
			this.getModel().setProperty(sPath + "LockingAction/LockAction", "E");
			this.getModel().setProperty(sPath + "ActionNav/Useraction", "BAL");

			this.callServiceCreateDeepEntity();

		},

		onQtyLiveChange: function(oEvent) {
			var oSrc = oEvent.getSource();
			if (!oSrc.getBinding("value") || !oSrc.getBinding("value").getType()) {
				return;
			}
			var newValue = oEvent.getParameter("newValue");

			var sFormatted = oSrc.getBinding("value").getType().formatValue(newValue, "string");
			newValue = newValue.replace(/,/g, "");

			if (sFormatted.length < newValue.length) {
				var oBinding = oSrc.getBindingInfo("value");
				var qtyModel = oBinding.parts[0].model;
				var qtyPath = oBinding.parts[0].path;
				qtyPath = util.getContextPath(oSrc, qtyModel) + qtyPath;

				oSrc.getModel(qtyModel).setProperty(qtyPath, null);
				oSrc.getModel(qtyModel).setProperty(qtyPath, Number(sFormatted));
				oSrc._lastValue = newValue;
			}
		},

		onQtyChange: function(oEvent) {
			this.onItemSelectionChanged(oEvent);
		},

		onSubmit: function() {
			// var sTitle = this.getResourceBundle().getText("submitTitle");
			var overDueWarning = this.getResourceBundle().getText("overDueWarning");
			var sPath = util.getContextPath(this.getView());
			var bOverdue = this.getModel().getProperty(sPath + "IsDueDatePassed");
			var sLateComment = this.getModel().getProperty(sPath + "LateComment");
			var sLateReason = this.getModel().getProperty(sPath + "LateReason");
			var sdocType = this.getModel().getProperty(sPath + "Creditmemo") ? "credit" : "inv";
			var sMsg = this.getResourceBundle().getText(sdocType + "SubmitMessage");
			var sBalance = this.getModel().getProperty(sPath + "BalanceCheck/Balance");
			var bWithinTolerance = this.getModel().getProperty(sPath + "BalanceCheck/IsWithinTolerance");

			if(!bWithinTolerance){//this should not happen as the button should be disabled
				return;
			}

			var oPromise = jQuery.Deferred();
			if(Number(sBalance) !== 0){
				MessageBox.warning( this.getResourceBundle().getText("toleranceWarning", [sBalance]), {
					icon: MessageBox.Icon.WARNING,
					actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
					onClose: function(oAction) {
						if (oAction !== MessageBox.Action.CANCEL) {
							oPromise.resolve();
						}
					}.bind(this)
				});
			}
			else{
				oPromise.resolve();
			}

			oPromise.then(function(){
				if (!this.confirmDialog) {
					this.confirmDialog = sap.ui.xmlfragment(this.createId("confirmDialog"), "au.gov.defence.roman.zvim.gr.view.confirmDialog", this);
					this.getView().addDependent(this.confirmDialog);
					this.confirmDialog.setModel(new JSONModel({}));
				}
				this.confirmDialog.getModel().setData({LateComment: sLateComment || "",
					LateReason: sLateReason || "",
					IsDueDatePassed: bOverdue, 
					Msg: sMsg, overDueWarning: 
						overDueWarning});
				this.confirmDialog.open();
			}.bind(this));
		},

		onConfirmOk: function(oEvent){
			var sPath = util.getContextPath(this.getView());
			this.getModel().setProperty(sPath + "LateComment", this.confirmDialog.getModel().getData().LateComment);
			this.getModel().setProperty(sPath + "LateReason", this.confirmDialog.getModel().getData().LateReason);
			this.getModel().setProperty(sPath + "LockingAction/LockAction", "E");
			this.getModel().setProperty(sPath + "ActionNav/Useraction", "SUBMIT");
			this.callServiceCreateDeepEntity();
			this.confirmDialog.close();
		},

		onConfirmCancel: function(oEvent){
			this.confirmDialog.close();
		},


		onReject: function() {
			if (!this.rejectDialog) {
				this.rejectDialog = sap.ui.xmlfragment(this.createId("RejectDialog"), "au.gov.defence.roman.zvim.gr.view.RejectDialog", this);
				this.getView().addDependent(this.rejectDialog);
				this.rejectDialog.setModel(new JSONModel({}));
			}
			this.rejectDialog.getModel().setData({
				RejectReason: "",
				RejectReasonCode: ""
			});
			this.rejectDialog.open();
		},

		onRejectOK: function() {
			//var sRejectReason = this.getView("mainView").
			var sRejectReason = this.rejectDialog.getModel().getProperty("/RejectReason");
			var sRejectReasonCode = this.rejectDialog.getModel().getProperty("/RejectReasonCode");
			if (!sRejectReasonCode) {
				MessageBox.show(
						"Please select a reason .", {
							icon: MessageBox.Icon.ERROR,
							title: "No Rejection Reason", //"No VIM Document Number",
							actions: [MessageBox.Action.OK]
						}
				);
			} else {
				var sPath = util.getContextPath(this.getView());
				this.getModel().setProperty(sPath + "LockingAction/LockAction", "E");
				this.getModel().setProperty(sPath + "ActionNav/Useraction", "REJECT");
				this.getModel().setProperty(sPath + "ActionNav/Rejectreason", sRejectReason);
				this.getModel().setProperty(sPath + "RejectReason", sRejectReasonCode);
				this.callServiceCreateDeepEntity();

				this.rejectDialog.close();
			}
		},

		onRejectCancel: function() {
			this.rejectDialog.close();
		},

		/**
		 *
		 */
		onAddGr: function(oEvent) {
			var sPath = util.getContextPath(this.getView());
			this.getModel().setProperty(sPath + "LockingAction/LockAction", "");
			this.getModel().setProperty(sPath + "ActionNav/Useraction", "RECEIPT");
			this.callServiceCreateDeepEntity();

			var vimDoc = oEvent.getSource().getBindingContext().getObject().Vimdocid;
			var sUrl = this.getResourceBundle().getText("gr.app.create.url", [vimDoc]);
			this.getModel("viewModel").setProperty("/addGrAction", true);
			var bFLP = this.getModel("componentModel").getProperty("/inFLP");			
			if (bFLP === true) {
				
				sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
					target: { shellHash: "#ZMYFI_REC-PO_VIM?&/VIM/" + vimDoc }
				});				
				
			} else {
				setTimeout( function() { sap.m.URLHelper.redirect(sUrl, false); }, 1000);
			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 *
		 */
		_onNavHome: function(oEvent) {
			var sUrl = this.getResourceBundle().getText("myFi.home.url");
			sap.m.URLHelper.redirect(sUrl, false);
		},

		/**
		 *
		 */
		_resetView: function() {
			this.getView().unbindElement();
			this.getModel().setProperty("/", {});

			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				movtLineCount: "",
				itemsCount: "",
				messageButtonType: "Ghost",
				messageButtonIcon: "sap-icon://warning2",
				enableBtns: false,
				enableSubmitBtn: false,
				enableValidateBtn: true
			});
			this.setModel(oViewModel, "viewModel");
			
			// reset all errors
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		/**
		 *
		 */
		_bindView: function(sObjectId) {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getModel("viewModel");

			oModel.metadataLoaded().then(function() {
				var sObjectPath = oModel.createKey("/VimDocHeaders", {
					Vimdocid: sObjectId
				});

				oViewModel.setProperty("/busy", true);
				this.enableElements(true);
				var that = this;
				this.getView().bindElement({
					path: sObjectPath,
					parameters: {
						expand: "GoodsReceipts,LockingAction,Items,BalanceCheck,ActionNav"
					},
					events: {
						change: function(oEvent) {
							oViewModel.setProperty("/busy", false);
						}.bind(this),
						dataReceived: function(oEvent) {
							oViewModel.setProperty("/busy", false);
							var sPath = util.getContextPath(that.getView());
							oViewModel.setProperty("/Currency", that.getModel().getProperty(sPath + "Currency"));

							var aMessage = this.getModel("message").oMessageParser._lastMessages;
							if (!aMessage || aMessage.length === 0) { //No message was returned
								that.enableElements(true); //Enable Create Purchase Receipt, Validate and Reject
							} else {
								var sMsg = this.getModel("message").oMessageParser._lastMessages[0].message;
								if (aMessage[0].type === "Warning") {
									if((aMessage[0].code.toString().substring(0, 2) === "LK")){
										MessageBox.warning(sMsg, {
											title: that.getResourceBundle().getText("warningTitle"),
											initialFocus: null,
											actions: [MessageBox.Action.YES, MessageBox.Action.NO],
											onClose: function(oAction) {
												if (oAction === MessageBox.Action.YES) {
													this.getModel().setProperty(sPath + "LockingAction/LockAction", "F");

													this.callServiceCreateDeepEntity();
												} else { //No was selected
													// Stop processing - Disable the app if it can't be closed.
													this.enableElements(false);
												} //else NO was selected
											}.bind(that)
										});
										return;
									}
									else{
										MessageBox.warning(sMsg, {
											title: that.getResourceBundle().getText("warningTitle"),
											initialFocus: null
										});
									}
								} else {
									that.enableElements(false);
									MessageBox.error(
											sMsg, {
												icon: MessageBox.Icon.ERROR,
												title: that.getResourceBundle().getText("errorTitle"),
												actions: [MessageBox.Action.OK]
											}
									);
									return;
								}

							}

							// If the app loads with a zero balance, set the Submit button to true
							if (that.getModel().getProperty(sPath + "BalanceCheck/IsWithinTolerance") === true) {
								oViewModel.setProperty("/enableSubmitBtn", true);
							} else {
								oViewModel.setProperty("/enableSubmitBtn", false);
							}
							sap.ui.getCore().getMessageManager().removeAllMessages();

						}
					}
				});

			}.bind(this));

		},

		onGrDocPress: function(oEvent) {
			var grObj = oEvent.getSource().getBindingContext().getObject();

			var sUrl = this.getResourceBundle().getText("gr.app.display.url", [grObj.Grdocnumber, grObj.Grdocyear]);
			sap.m.URLHelper.redirect(sUrl, true);
		},

		onPOTableUpdateFinished: function(oEvent) {
			var oTable = oEvent.getSource(),
			iTotalItems = oEvent.getParameter("total");

			if ((iTotalItems || iTotalItems === 0) && oTable.getBinding("items").isLengthFinal()) {
				this.getModel("viewModel").setProperty("/itemsCount", "(" + iTotalItems + ")");
			} else {
				this.getModel("viewModel").setProperty("/itemsCount", "");
			}

			this.getModel("viewModel").setProperty("/itemsScrollHeight", iTotalItems > 10 ? "20em" : "");
		},

		onGRTableUpdateFinished: function(oEvent) {
			var oTable = oEvent.getSource(),
			iTotalItems = oEvent.getParameter("total");

			if ((iTotalItems || iTotalItems === 0) && oTable.getBinding("items").isLengthFinal()) {
				this.getModel("viewModel").setProperty("/movtLineCount", "(" + iTotalItems + ")");
			} else {
				this.getModel("viewModel").setProperty("/movtLineCount", "");
			}
			if (oEvent.getParameter("reason") === "Filter") {
				var sPath = util.getContextPath(this.getView());
				this.getModel().setProperty(sPath + "LockingAction/LockAction", "E");
				this.getModel().setProperty(sPath + "ActionNav/Useraction", "BAL");

				this.callServiceCreateDeepEntity();
			}
		}

	});

});