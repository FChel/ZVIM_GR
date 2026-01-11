sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/Device"
], function (Filter, FilterOperator, JSONModel, MessageBox, Device) {
	"use strict";

	return {

		createDeviceModel : function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		/**
		 * Loads the dropdown data from oData and sets it to the JSON model. It limits payment terms,
		 * sets common order units and hardcodes Account Assignment
		 * @public
		 * @param {Control} oParent Parent control to set the model to
		 * @param {JSONModel} dropdownModel JSON model to hold the data
		 */
		loadDropDowns: function(oParent, dropDownModel) {
			var aFilters = [];
			aFilters.push(new Filter("DataType", FilterOperator.EQ, "OrderUnits"));
			aFilters.push(new Filter("DataType", FilterOperator.EQ, "TaxCodes"));
			aFilters = [new Filter({
				filters: aFilters,
				and: false
			})];

			var mParameters = {
				method: "GET",
				filters: aFilters,
				success: function(oData) {
					var obj = oData.results;
					var obj2 = {};
					var emptyLine = {
						Key: "",
						Value: "",
						Rate: ""
					};
					for (var i in obj) {
						if (!obj2[obj[i].DataType]) {
							obj2[obj[i].DataType] = [];
							//if (obj[i].DataType !== "OrderUnits" ) {
								obj2[obj[i].DataType].push($.extend({}, emptyLine));
							//}
						}
						obj2[obj[i].DataType].push(obj[i]);
					}
									
					dropDownModel.setData(obj2);

				}.bind(this),
				error: function(oError) {
					var aErrors = this.processODataError(oError, oParent.getResourceBundle());

					MessageBox.error(oParent.getResourceBundle().getText("dropdownRead.error", [aErrors[0].message]));
				}.bind(this)
			};
			var oModel = oParent.getModel("searchHelp");
			if (!oModel) {
				oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZEDM_SEARCHHELP_SRV", {
					useBatch: false,
					defaultCountMode: sap.ui.model.odata.CountMode.Inline
				});
			}
			oModel.read("/RefDataSet", mParameters);
		},
		
		initialiseFilterConfig: function(oParent){
			var filterConfigData = oParent.getModel("filterConfigModel").getData();
			for (var oConfig in filterConfigData) {
				if (filterConfigData[oConfig].parent) {
					filterConfigData[oConfig] = $.extend(true, {}, filterConfigData[filterConfigData[oConfig].parent], filterConfigData[oConfig]);
				}
			}
		}

	};
});