sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/Device"
	
], function(Filter, FilterOperator, JSONModel, MessageBox) {
	"use strict";

	return {
		
		/**
		 * Finds biding context path for a control
		 * @public
		 * @param {Control} obj control to check
		 * @returns {string} Binding context path
		 */
		getContextPath: function(obj, model){
			if(!obj.getBindingContext(model) || !obj.getBindingContext().getPath(model)){
				return "";
			}
			return obj.getBindingContext(model).getPath() + (obj.getBindingContext(model).getPath() === "/" ? "" : "/");
		},
		
		/**
		 * Searches the current element and it's parent up to iMaxLevel for the first 
		 * element of the required type.			 
		 * @public
		 * @param {Element} oCurrElement sCurrent element
		 * @param {string} sElementType type of element to search for
		 * @param {int} iMaxLevel max number of levels to check
		 * @returns {string} Element if found, null otherwise
		 */
		getImmediateParentByType: function(oCurrElement, sElementType, iMaxLevel) {
			var oElement = oCurrElement;
			var level = 0;

			var iMaximumLevel = iMaxLevel ? iMaxLevel : 5;

			try {
				do {
					level = level + 1;
					oElement = oElement.getParent();
					if (oElement.getMetadata().getName() === sElementType ||
						oElement.getMetadata().getParent().getName() === sElementType) {
						return oElement;
					}
				} while (level <= iMaximumLevel);

			} catch (e) {
				return null;
			}

			return null;
		},

		/**
		 * Searches the current element and it's childrent for the first 
		 * element of the required type.			 
		 * @public
		 * @param {Control} oControl sCurrent element
		 * @param {string} sType type of element to search for
		 * @returns {string} Element if found, null otherwise
		 */
		getImmediateChildByType: function(oControl, sType) {
			var oRetControl = null;
			if (oControl.getMetadata().getName() === sType ||
				oControl.getMetadata().getParent().getName() === sType) {
				oRetControl = oControl;
				return oRetControl;
			}

			var aItems = [];

			//traverse generically, not just content and items
			if (oControl.mAggregations) {
				for (var key in oControl.mAggregations) {
					var item = oControl.mAggregations[key];
					switch ($.type(item)) {
						case "object":
							aItems = aItems.concat(item);
							break;
						case "array":
							for (var i in item) {
								var o = item[i];
								aItems = aItems.concat(o);
							}
							break;
					}
				}
			}

			for (var j in aItems) {
				var oItem = aItems[j];
				oRetControl = this.getImmediateChildByType(oItem, sType);
				if (oRetControl) {
					return oRetControl;
				}
			}

			return oRetControl;
		},
		
		/**
		 * A utility function to remove __metadata from the object and it's children.
		 * @public
		 * @param {Object} obj Object to be cleaned
		 */
		removeMetadata: function(obj) {
			if (!obj) {
				return;
			}

			if (obj.__metadata) {
				delete obj.__metadata;
			}

			if (typeof obj === "object") {
				for (var i in obj) {
					if (Array.isArray(obj[i])) {
						for (var j in obj[i]) {
							this.removeMetadata(obj[i][j]);
						}
					} else if (obj[i] && (typeof obj[i] === "object") && (obj[i] !== null)) {
						this.removeMetadata(obj[i]);
					}
				}
			}
		},
		
		
		/**
		 * Converts the oData error object to an array of error objetcs(type and message)			 
		 * @public
		 * @param {Control} oError oData error object
		 * @param {string} resourceBundle i18n resource bundle
		 * @returns {Array} Array of error objects 
		 */
		processODataError: function(oError, resourceBundle) {
			var aErrors = [],
				jsonError = {};
			if (oError.responseText || (oError.response && oError.response.body)) {
				try {
					jsonError = JSON.parse(oError.responseText || oError.response.body);

					var aErrorDetails = jsonError.error.innererror.errordetails;
					if (!aErrorDetails || !Array.isArray(aErrorDetails) || aErrorDetails.length === 0) {
						throw oError.statusText;
					}
					for (var i in aErrorDetails) {
						if (aErrorDetails[i].code === "/IWBEP/CX_MGW_TECH_EXCEPTION") {
							if (aErrorDetails.length === 1) {
								aErrors.push({
									type: sap.ui.core.MessageType.Error,
									message: resourceBundle.getText("errorText", ["Internal Server Error"])
								});
							}
						} else {
							var sMessageType;
							switch (aErrorDetails[i].severity){
								case "error":
									sMessageType = sap.ui.core.MessageType.Error;
									break;
								case "warning":
									sMessageType = sap.ui.core.MessageType.Warning;
									break;
								case "success": 
									sMessageType = sap.ui.core.MessageType.Success;
									break;
								default:
									sMessageType = sap.ui.core.MessageType.Information;
									break;
							}
							
							aErrors.push({
								code: aErrorDetails[i].code,
								type: sMessageType,
								message: aErrorDetails[i].message + ((aErrorDetails[i].code) ? "(" + aErrorDetails[i].code + ")" : "")
							});
						}
					}

					//Handle exception if the error is a generic gateway error and not a errorList	
				} catch (e) {
					aErrors.push({
						type: sap.ui.core.MessageType.Error,
						message: resourceBundle.getText("errorText", [oError.statusText])
					});

				}
			}

			return aErrors;
		}
	};

});