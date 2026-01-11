sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"jquery.sap.global"
], function (BaseController, JSONModel, jQuery) {
	"use strict";

	return BaseController.extend("au.gov.defence.roman.zvim.gr.controller.App", {
	
	_sVim: "",

		onInit : function () {
		
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy : true,
				delay : 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};
			
			
			// disable busy indication when the metadata is loaded and in case of errors
			this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
			this.getOwnerComponent().metadataFailed().then(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
		}
	});

});