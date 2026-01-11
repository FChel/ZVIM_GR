sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("au.gov.defence.roman.zvim.gr.controller.NotFound", {

		/**
		 * Navigates back when the link is pressed
		 * @public
		 */
		onLinkPressed : function () {
			this.onNavBack();
		}

	});

});