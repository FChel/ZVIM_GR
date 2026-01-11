sap.ui.define([], function () {
	"use strict";

	return {
		liDialogWidth: function(system){
			if(system.desktop){
				return "70%";
			}
			return "100%";
		},
			
		fieldLengthFormatter: function(sValue){
			if(!isNaN(Number(sValue))){
				return Number(sValue);
			}	
			return 0;
		},
		
		balanceStatus: function(bTolerance){
			if(bTolerance){
				return "Success";
			}
			
			return "Error";
		},
		
		
		tableMode: function(creditMemo, enableButtons){
			if(creditMemo || !enableButtons){
				return "None";
			}
			return "MultiSelect";
		},
		
		tableColDisplay: function(creditMemo, enableButtons){
			if(creditMemo || !enableButtons){
				return false;
			}
			return true;
		},
		
		/**
		 * 
		 */
		removeLeadingZero: function (sValue) {
			return sValue ? sValue.replace(/^0+/, '') : "";
		},
		
		/**
		 * 
		 */
		currencyValue : function (sValue, currency) {
			var temp = sValue;
			if (!temp) {
				temp = 0;
			}
			if(currency){
				var oLocale = new sap.ui.core.Locale("en-AU");
				var oFormatOptions = {
				    showMeasure: false,
				    currencyCode: true,
				    currencyContext: "standard"};
				var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance(oFormatOptions, oLocale);
				return oCurrencyFormat.format(temp, currency); 
			}

			return parseFloat(temp).toFixed(2);
		},		
		
		/**
		 * 
		 */
		netPriceFormatter: function(netPrice, currency, unitPrice, unitQty){
			var amount = (netPrice === undefined || netPrice === null || netPrice <= 0) ? 
							unitPrice * unitQty : 
							netPrice;
			return this.formatter.currencyValue(amount, currency);
		},
		
		taxCodeDescription: function(sTaxCode){
			var oData = this.getModel("dropDownModel").getData();
			if(sTaxCode && oData.TaxCodes){
				for(var i in oData.TaxCodes){
					if(oData.TaxCodes[i].Key === sTaxCode){
						return oData.TaxCodes[i].Value;
					}
				}
			}
			return "";
		},
		
		/**
		 * Formatter for Value Help input fields display.			 
		 * @public
		 * @param {string} sKey Key value
		 * @param {string} sDescription Description associated to the key
		 * @returns {string} Formatted text
		 */
		valueHelpDisplay: function(sKey, sDescription){
			if(!sKey){
				return "";
			}
				
			return (sDescription) ? sKey + " ( " + sDescription + " )" : sKey;
		},

		/**
		 * Removes 0s on the left of the line number			 
		 * @public
		 * @param {string} sValue line number
		 * @returns {string} formatted line number
		 */
		lineNumberFormatter: function(sValue){
			if(!isNaN(Number(sValue))){
				return Number(sValue);
			}	
			return sValue;
		}		
		
	};

});