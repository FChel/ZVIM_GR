sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"../model/util",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/events/KeyCodes"
	], function(Controller, UIComponent, JSONModel, MessageBox, util, Filter, FilterOperator, KeyCodes) {
	"use strict";

	return Controller.extend("au.gov.defence.roman.zvim.gr.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/* =========================================================== */
		/* user info popover                                           */
		/* =========================================================== */

		/**
		 *
		 */
		onToggleUserPopover: function(oEvent) {
			if (!this.oUserPopover) {
				this.oUserPopover = sap.ui.xmlfragment("au.gov.defence.roman.zvim.gr.view.UserPopover", this);
				this.getView().addDependent(this.oUserPopover);
			}
			if (this.oUserPopover.isOpen()) {
				this.oUserPopover.close();
			} else {
				this.oUserPopover.openBy(oEvent.getSource());
			}
		},

		/* =========================================================== */
		/* messaging methods                                           */
		/* =========================================================== */

		/**
		 *
		 */
		registerMessageManager: function() {
			// set message model
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(this.getView(), true);
		},

		/**
		 *
		 */
		getMessagePopover: function() {
			// create popover lazily (singleton)
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "au.gov.defence.roman.zvim.gr.view.MessagePopover", this);
				this.getView().addDependent(this._oMessagePopover);
			}
			return this._oMessagePopover;
		},

		/**
		 *
		 */
		onMessagePopoverPress: function(oEvent) {
			this.getMessagePopover().openBy(oEvent.getSource());
		},

		/**
		 * Return the button type according to the message with the highest severity
		 * Error > Warning > Success > Info
		 */
		getMessageButtonType: function() {
			var sHighestSeverity = "Ghost";
			var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().oData;

			aMessages.forEach(function(sMessage) {
				switch (sMessage.type) {
				case "Error":
					sHighestSeverity = "Reject";
					break;
				case "Warning":
					sHighestSeverity = sHighestSeverity !== "Reject" ? "Emphasized" : sHighestSeverity;
					break;
				case "Success":
					sHighestSeverity = sHighestSeverity !== "Reject" && sHighestSeverity !== "Emphasized" ? "Accept" : sHighestSeverity;
					break;
				default:
					sHighestSeverity = !sHighestSeverity ? "Ghost" : sHighestSeverity;
				break;
				}
			});

			return sHighestSeverity;
		},

		/**
		 * Return the button icon according to the message with the highest severity
		 * Error > Warning > Success > Info
		 */
		getMessageButtonIcon: function() {
			var sIcon = "sap-icon://warning2";
			var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().oData;

			aMessages.forEach(function(sMessage) {
				switch (sMessage.type) {
				case "Error":
					sIcon = "sap-icon://error";
					break;
				case "Warning":
					sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
					break;
				case "Success":
					sIcon = "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://message-success" : sIcon;
					break;
				default:
					sIcon = !sIcon ? "sap-icon://warning2" : sIcon;
				break;
				}
			});

			return sIcon;
		},

		/* =========================================================== */
		/* navigation methods                                          */
		/* =========================================================== */

		/**
		 *
		 */
		onNavBack: function() {
			history.go(-1);
		},

		/**
		 * Event handler for navigating to landing page
		 * @public
		 */
		onNavHome: function() {    	
			var bFLP = this.getModel("componentModel").getProperty("/inFLP");			
			if (bFLP === true) {
				sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			} else {
				//window.location.replace("/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html");	
				var sUrl = this.getResourceBundle().getText("myFi.home.url");
				sap.m.URLHelper.redirect(sUrl, false);
			}    	    	
		},

		/**
		 * Event handler for navigating to landing page
		 * @public
		 */
		onNavHelp: function() {
			var sHelpUrl = this.getModel("userModel").getData().HelpUrl;
			sap.m.URLHelper.redirect(sHelpUrl, true);
		},


		callServiceCreateDeepEntity: function(bSync) {
			var oViewModel = this.getModel("viewModel");

			var oData = this.getView().getBindingContext().getObject({
				expand: "BalanceCheck,ActionNav,LockingAction"
			});

			oData.GoodsReceipts = [];
			var items = this.byId("movementsTable").getItems();
			for (var i in items) {
				oData.GoodsReceipts.push(items[i].getBindingContext().getObject());
			}

			oViewModel.setProperty("/busy", true);
			var sPath = util.getContextPath(this.getView());

			var oModel = this.getOwnerComponent().getModel();
			if (bSync) {
				//oModel = new sap.ui.model.odata.ODataModel(oModel.sServiceUrl);
			}
			oModel.create("/VimDocHeaders", oData, {
				success: function(oResult, oResponse) {
					oViewModel.setProperty("/busy", false);

					var sBalPath = sPath + "BalanceCheck/";
					for (i in oResult.BalanceCheck) {
						if (i.indexOf("__") !== 0) {
							this.getModel().setProperty(sBalPath + i, oResult.BalanceCheck[i]);
						}
					}
					var userAction = oResult.ActionNav.Useraction;
					var bMsgDisplayed = false;
					// response header message
					var hdrMessage = oResponse.headers["sap-message"];

					if (hdrMessage !== undefined) {
						var hdrMessageObject = JSON.parse(hdrMessage);

						if ((hdrMessageObject.code.substring(0, 2) === "LK") && (hdrMessageObject.severity === "warning")) {
							MessageBox.warning(hdrMessageObject.message, {
								title: this.getResourceBundle().getText("errorTitle"),
								initialFocus: null,
								actions: [MessageBox.Action.YES, MessageBox.Action.NO],
								onClose: function(oAction) {
									if (oAction === MessageBox.Action.YES) {
										// Do another call to force the lock to be set
										this.getModel().setProperty(sPath + "LockingAction/LockAction", "F");
										this.callServiceCreateDeepEntity();
									} else { //No was selected
										// Stop processing - Disable the app if it can't be closed.
										this.enableElements(false);
										oViewModel.setProperty("/enableSubmitBtn", false);
									}
								}.bind(this)

							});
							return;
						} else if (hdrMessageObject.code.substring(0, 2) === "VA") {
							bMsgDisplayed = true;
							var sMsg = hdrMessageObject.code === "VA/001" ? this.getResourceBundle().getText("nonZeroWarning") : hdrMessageObject.message;
							MessageBox.warning( sMsg, {
								icon: MessageBox.Icon.Warning,
								title: this.getResourceBundle().getText("Warning"),
								actions: [MessageBox.Action.OK]
							});
						} else {
							if (userAction !== "BAL") {
								bMsgDisplayed = true;
								MessageBox.error(
										hdrMessageObject.message, {
											icon: MessageBox.Icon.ERROR,
											title: this.getResourceBundle().getText("errorTitle"),
											actions: [MessageBox.Action.OK],
											onClose: function(oAction) {
												this.enableElements(false);
												oViewModel.setProperty("/enableSubmitBtn", false);
											}.bind(this)
										});
							}
							return;
						}

					}

					//Check if the app  just called the back-end for a balance check.  If so and the balance is now 0, set the Submit button to enabled
					if (oResult.BalanceCheck.IsWithinTolerance && (userAction === "" || userAction === "VALIDATE" || userAction === "BAL")) {
						oViewModel.setProperty("/enableSubmitBtn", true);
						this.enableElements(true);

						if(!bMsgDisplayed){
							if (userAction === "VALIDATE") {
								MessageBox.success(
										this.getResourceBundle().getText("validateSucess"), {
											icon: MessageBox.Icon.Sucess,
											title: this.getResourceBundle().getText("successTitle"),
											actions: [MessageBox.Action.OK]
										});
							}
						}
					} else {
						oViewModel.setProperty("/enableSubmitBtn", false);
					}

					//If the back-end was called for a Submit or Reject and there were no errors, disable the buttons
					if (userAction === "SUBMIT" || userAction === "REJECT") {
						this.enableElements(false);
						var sdocType = this.getModel().getProperty(sPath + "Creditmemo") ? "credit" : "inv";
						var sSubmitType = userAction === "SUBMIT" ? "SubmitSucess" : "RejectSucess";
						var message = this.getResourceBundle().getText(sdocType + sSubmitType, [this.getModel().getProperty(sPath + "Invnumber")]);

						var oRating = this.getModel("searchHelp").createEntry("/FeedbackRatings").getObject();
						oRating.Rating = 0;
						oRating.Comments = "";
						oRating.SourceApp = "VIMM";
						oRating.SourceKey = this.getModel().getProperty(sPath + "Vimdocid");
						var oRateModel = new JSONModel(oRating);
						var oDisplayModel = new JSONModel({message: message});
						if (!this.ratingDlg) {
							this.ratingDlg = sap.ui.xmlfragment(this.createId("ratingDlg"), "au.gov.defence.roman.zvim.gr.view.ratingDlg", this);
							this.getView().addDependent(this.ratingDlg);
						}
						this.ratingDlg.setModel(oRateModel);
						this.ratingDlg.setModel(oDisplayModel, "displayModel");
						this.ratingDlg.open();

						// MessageBox.success(  message, {
						//    icon: MessageBox.Icon.Sucess,
						//    title: this.getResourceBundle().getText("successTitle"),
						//    actions: [MessageBox.Action.OK]
						//  });
					}

				}.bind(this),
				error: function(oError) {
					oViewModel.setProperty("/busy", false);
				}
			});
		},

		onRatingOkPressed: function(oEvent){
			var ratingPromise = jQuery.Deferred();
			var oRating = oEvent.getSource().getModel().getData();
			this.ratingDlg.setBusy(true);

			if(!oRating.Rating && !oRating.Comments){
				ratingPromise.resolve();
			}
			else{
				util.removeMetadata(oRating); 
				oRating.Rating += "";
				this.getModel("searchHelp").create("/FeedbackRatings", oRating, {
					success: function(oData){
						ratingPromise.resolve();
					}.bind(this),
					error: function(oData){
						ratingPromise.resolve();
					}.bind(this)
				});
				setTimeout(function(){ ratingPromise.resolve(); }, 700);
			}

			ratingPromise.then(function(){
				this.ratingDlg.setBusy(false);
				this.ratingDlg.close();
				//this.getRouter().navTo("worklist", {}, false);
			}.bind(this));
		},


		/* =========================================================== */
		/* value help methods                                          */
		/* =========================================================== */

		/**
		 *
		 */
		onDocValueHelpRequested: function(oEvent) {

			var oViewModel = this.getModel("viewModel");
			oViewModel.setProperty("/busy", true);

			var oResourceBundle = this.getResourceBundle();

			var oColModel = new JSONModel();
			oColModel.setData({
				cols: [
					{
						"label": oResourceBundle.getText("vhVimDoc"),
						"template": "Docid"
					},
					{
						"label": oResourceBundle.getText("vhPO"),
						"template": "Ebeln",
					},
					{
						"label": oResourceBundle.getText("vhVendor"),
						"template": "Lifnr"
					},
					{
						"label": oResourceBundle.getText("vhVendorName"),
						"template": "VendName",
						"width": "19rem"
					}
					]
			});

			if (! this.oValueHelpDialog ) {
				this.oValueHelpDialog = sap.ui.xmlfragment("au.gov.defence.roman.zvim.gr.view.DocValueHelp", this);
				this.getView().addDependent(this.oValueHelpDialog);
				var oController = this;
				this.oValueHelpDialog.attachBrowserEvent("keydown", function (oEvent) {
					//add an event handler for searching by ENTER key
					if (oEvent.keyCode === KeyCodes.ENTER) {
						oEvent.stopImmediatePropagation();
						oEvent.preventDefault();
						oController.oValueHelpDialog.getFilterBar().search();
					}
				});

				this.oValueHelpDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(this.getOwnerComponent().getModel());
					oTable.setModel(oColModel, "columns");
					if (oTable.bindRows) {
						oTable.bindRows("/VimDocSHSet");
					}
					oTable.setBusyIndicatorDelay(1);
					oTable.setEnableBusyIndicator(true);
					this.oValueHelpDialog.update();
				}.bind(this));

				this.oValueHelpDialog._sTableTitleNoCount = oResourceBundle.getText("vhTableTitle");

				var oFilterBar = this.oValueHelpDialog.getFilterBar();
				//Hide 'Hide Advanced Search' button
				//oFilterBar._oHideShowButton = new sap.m.Button();
				oFilterBar._oHideShowButton.setVisible(false);
			}


			this.oValueHelpDialog.getTable().setNoData(oResourceBundle.getText("vhNoData1"));

			this.oValueHelpDialog.setTokens([]);
			this.oValueHelpDialog.open();

			oViewModel.setProperty("/busy", false);
		},

		/**
		 *
		 */
		onDocValueHelpOkPress: function(oEvent) {
			var oToken = oEvent.getParameter("tokens")[0];
			this.getModel("viewModel").setProperty("/docSelectInput", oToken.getKey());
			this.oValueHelpDialog.close();

		},

		/**
		 *
		 */
		onDocValueHelpCancelPress: function(oEvent) {
			this.oValueHelpDialog.close();
		},

		/**
		 *
		 */
		onDocValueHelpAfterClose: function(oEvent) {

		},

		/**
		 *
		 */
		onDocFilterBarSearch: function(oEvent) {

			var oController = this;
			var aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {

						aResult.push(new Filter({
							path: oControl.getName(),
							operator: FilterOperator.Contains,
							value1: oControl.getValue()
						}));
				}

				return aResult;
			}, []);

			var oFilter = new Filter({
				filters: aFilters,
				and: true
			});

			var oBinding = this.oValueHelpDialog.getTable().getBinding("rows");

			this.oValueHelpDialog.getTable().setNoData(this.getResourceBundle().getText("vhNoData2"));

			if (aFilters.length > 0) {
				oBinding.filter(oFilter);
			} else {
				MessageBox.error(this.getResourceBundle().getText("vhNoParameter"));
			}
		},		

	});

});