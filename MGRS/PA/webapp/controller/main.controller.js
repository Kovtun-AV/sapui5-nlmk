sap.ui.define(['sap/m/MessageToast',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	"sap/m/MessageBox"],
	function(MessageToast, Controller, JSONModel, Filter, MessageBox) {
	"use strict";

	var PageController = Controller.extend("mgrs.PA.controller.main", {
		onInit: function (e) {
			var oModelData = {
				selected: {
					ReplicationX: false,
					DashboardId: "3",
					SubdivId: false,
					GroupId: false,
					DataTypeId: false,
					GranularId: false,
					Year: null,
					Month: null,
					Decade: null,
					Week: null,
					DateFrom: null,
					DateTo: null,
					YearRange: null,
					MonthRange: null,
					CreatePeriodX: "E",
					SteelTypeId: false
				},
				filters: {
					dashboard : false,
					division : false,
					group: false,
					dataType: false,
					granular: false,
					steelType: false
				},
				settings: {
					SteelType: false,
					Collapse: true,
					SubdivId: {
						path:"SubdivisionSet",
						filters: ["DashboardId"],
						id: "idDivision"
					},
					GroupId : {
						path:"GroupSet",
						filters: ["DashboardId","SubdivId"],
						id: "idGroup"
					},
					DataTypeId: {
						path:"DataTypeSet",
						filters: ["DashboardId","SubdivId", "GroupId"],
						id: "idDataType"
					},
					GranularId : {
						path:"GranularitySet",
						filters: ["DashboardId", "SubdivId", "GroupId", "DataTypeId"],
						id: "idGranular"
					},
					SteelTypeId : {
						path:"SteelTypeSet",
						filters: ["DashboardId", "SubdivId", "GroupId", "DataTypeId", "GranularId"],
						id: "idSteelType"
					}
				},
				show:{
					Year:false,
					Month:false,
					Decade:false,
					Week:false,
					Range: false,
					YearRange: false,
					Free: false,
					LastPeriod: false,
					SteelType: false
				},
				columns:{
					thickness: false,
					brigade: false,
					aggregate: false,
					redistrib: false,
					dateStr: false,
					setValid: false,
					value: false
				},
				granular: {
					"01": "Range",
					"02": "Week",
					"03": "Decade",
					"04": "Month",
					"05": "Year",
					"06": "Free"
				},
				periodicity: {
					Year: false,
					Month: [{text:"Январь", key:0},{text:"Февраль", key:1},{text:"Март", key:2},
						{text:"Апрель", key:3},{text:"Май", key:4},{text:"Июнь", key:5},{text:"Июль", key:6},
						{text:"Август", key:7},{text:"Сентябрь", key:8},{text:"Октябрь", key:9},{text:"Ноябрь", key:10},{text:"Декабрь", key:11}],
					Decade: [{text:1, key: 1},{text:2, key: 2},{text:3, key: 3}],
					Week: false,
					Free: []
				}
			};
			
			var oMainModel = new JSONModel(oModelData);
			this.getView().setModel(oMainModel, "main");
			this.setCurrentDate();
			oMainModel.attachPropertyChange(this.onModelChange, this);
			this.bindSelect("SubdivId");
			this.setWeeks(new Date());
		},
		setCurrentDate: function() {			
			var oModel = this.getView().getModel("main");
			var oSelected = oModel.getProperty("/selected");
			var sDataType = oModel.getProperty("/selected/DataTypeId");
			var aTemp = [-2, -1, 0];

			sDataType == "1" && aTemp.push(1);

			var iYear = new Date().getFullYear();
			var aYears = aTemp.map(function(el){
				return {text: iYear + el, key: iYear + el};
			})
			var oTempNew = {
				Year: new Date().getFullYear(),
				Month: new Date().getMonth(),
				Decade: [1],
				Week: [1],
				DateFrom: new Date(new Date().setHours(3)),
				DateTo: new Date(new Date().setHours(3)),
				YearRange: [new Date().getFullYear()],
				MonthRange: [new Date().getMonth()]
			}
			var objs = [oSelected, oTempNew],
			oSelected =  objs.reduce(function (r, o) {
				Object.keys(o).forEach(function (k) {
					r[k] = o[k];
				});
				return r;
			}, {});

			console.log("aYears", aYears, "oSelected", oSelected);
			oModel.setProperty("/selected", oSelected);
			oModel.setProperty("/periodicity/Year", aYears);
		},
		onAfterRendering: function (id) {
			var oController = this;
			var oTable = this.getView().byId("idTable");
			oTable.onAfterRendering = function() {
				if (sap.ui.table.TreeTable.prototype.onAfterRendering) {
					sap.ui.table.TreeTable.prototype.onAfterRendering.apply(this, arguments);
				}
					oTable.getDomRef().addEventListener('paste', function (e) {
					e.preventDefault();
					var oInput = sap.ui.getCore().byId($(e.target).parent().parent()[0].id);
					oController.onPaste(oInput, oController);
				});
		 }
		},
		onModelChange: function(e) {
			var oModel = this.getView().getModel('main');					
			var sValue = e.getParameter("value");
			var sPath = e.getParameter("path");
			var sKey = oModel.getProperty("/selected/GranularId");
			var sGran = oModel.getProperty("/granular/" + sKey);
			
			console.log("onModelChange", sValue, sPath, this, '/n gran', sGran);
			
			var sProp = sPath.split('/')[2];
			// var sTarget = oModel.getProperty("/settings/" + sProp + "/target");
			// this.bindSelect(sTarget);
			!this['onChange' + sProp] || this['onChange' + sProp]();
			!this['onChange' + sGran] || this['onChange' + sGran]();
			this.clearTable();
			var oSelected = oModel.getProperty('/selected');
			var bChecked = null;
			for (var key in oSelected) {
				bChecked = !!oSelected[key];
			};

			this.setSteelType();

			// if (!bChecked) {
			// 	console.log('not all filters', oSelected);
			// 	return;
			// }
			var aFilters = this.getFilters(["DashboardId", "SubdivId", "GroupId", "DataTypeId", "DateFrom", "DateTo", "GranularId"]);
			this.configureColumns(aFilters);			
		},
		setSteelType: function(){
			var aFilters = this.getFilters(["DashboardId", "SubdivId", "GroupId"]);
			var oModelTemp = this.getOwnerComponent().getModel("oDataModel");
			var oModel = this.getView().getModel("main");
			oModelTemp.read('/SteelTypeSet', {
				filters: aFilters,
				success: function (e) {
					console.log('SteelTypeSet ', e);
					oModel.setProperty("/settings/SteelType", !!e.results[0]);
				},
				error: function (e) {
					console.log('error', e);
				}
			})

			var oBtn = this.getView().byId("idSteelType");
			oBtn.bindItems({
				path: "oDataModel>/SteelTypeSet",
				filters: aFilters,
				template: new sap.ui.core.Item({
					text: "{oDataModel>Txtmd}",
					key: "{oDataModel>SteelTypeId}"
				})
			});
		},
		onClear: function(){
			var oModel = this.getView().getModel("oDataModel");
			oModel.resetChanges();
			MessageToast.show("Отмена введенных значений успешно выполнена.");
		},
		handleChange: function(e) {
			var oModel = this.getView().getModel("main");
			var dDateFrom = e.getParameter("from");
			var dDateTo = e.getParameter("to");
			var sDataType = oModel.getProperty("/selected/DataTypeId");
			var sNow = new Date();

			if (sDataType == "2" && (dDateFrom > sNow || dDateTo > sNow)) {
				dDateFrom = dDateFrom > sNow ? sNow : dDateFrom;
				dDateTo = dDateTo > sNow ? sNow : dDateTo;
				MessageToast.show("Ввод фактических значений в будущем запрещён.");
			}

			
			dDateFrom.setHours(3);
			dDateTo.setHours(3);
			oModel.setProperty('/selected/DateFrom', dDateFrom);
			oModel.setProperty('/selected/DateTo', dDateTo);
		},
		getFilter: function(sName) {
			var oModel = this.getView().getModel("main");
			var sValue = oModel.getProperty("/selected/" + sName);
			return new Filter(sName, "EQ", sValue);
		},
		getFilters: function(aNames){
			var oController = this;
			return aNames.map(function(sName) {
				return oController.getFilter(sName);
			});
		},
		//придумать норм название
		bindSelect: function(sName){// а может и норм
			var oModel = this.getView().getModel('main');
			var oSettings = oModel.getProperty('/settings/' + sName);
			var oSelect = this.getView().byId(oSettings.id);
			var aFilters = this.getFilters(oSettings.filters);
			oSelect.setSelectedKey(false);
			oSelect.bindItems({
				path: "oDataModel>/" + oSettings.path, //SubdivisionSet" 
				filters : aFilters,
				template : new sap.ui.core.Item({ text:"{oDataModel>Txtmd}", key:"{oDataModel>" + sName + "}"})
			 } );
		},
		onChangeSubdivId: function() {
			this.bindSelect("GroupId");
		},
		onChangeGroupId: function() {
			this.bindSelect("DataTypeId");
		},
		onChangeDataTypeId : function() {
			this.bindSelect("GranularId");
		},
		onChangeGranularId : function() {
			var oModel = this.getView().getModel("main");
			var sKey = oModel.getProperty("/selected/GranularId");
			var sGran = oModel.getProperty("/granular/" + sKey);
			var oShow = oModel.getProperty("/show");
			for (var key in oShow) {
				oShow[key] = false;
			};
			oModel.setProperty("/selected/ReplicationX", false);
			oModel.setProperty("/selected/CreatePeriodX", "E");
			!this['onChange' + sGran] || this['onChange' + sGran]();
			oModel.setProperty("/show/" + sGran, true);
			this.setCurrentDate();
		},
		onChangeFree: function() {
			var oModel = this.getView().getModel("main");
			var oSelect = this.getView().byId("idFree");
			var dDateFrom = new Date(oModel.getProperty("/selected/DateFrom"));
			var sDataType = oModel.getProperty("/selected/DataTypeId");
			var dDateTo = new Date(oModel.getProperty("/selected/DateFrom"));		
			dDateFrom.setDate(1);
			dDateFrom.setMonth(0);
			dDateFrom.setHours(3);			
			
			if (sDataType == "2" && dDateTo.getFullYear() >= new Date().getFullYear()) {
				dDateTo = new Date();
			}			
			else {
				dDateTo.setDate(31);
				dDateTo.setMonth(11);				
			}
			
			dDateTo.setHours(3);

			var bShowSteelType = oModel.getProperty("/settings/SteelType");
			var aFilterNames = ["DashboardId", "SubdivId", "GroupId", "DataTypeId"];
			!bShowSteelType || aFilterNames.push("SteelTypeId");
			var aFilters = this.getFilters(aFilterNames);
			aFilters.push(new Filter("DateFrom", "EQ", dDateFrom));
			aFilters.push(new Filter("DateTo", "EQ", dDateTo));
			console.log("111aFilters", aFilters);
			oSelect.setSelectedKey(false);
			oSelect.bindItems({
				path: "oDataModel>/PeriodSet",
				filters : aFilters,
				template : new sap.ui.core.Item({ text:"{oDataModel>DateStr}", key:"{oDataModel>DateStr}"})
			 } );
		},
		onPressCompact: function() {
			this.loadTableData();
		},
		loadTableData: function() {	
			var oModel = this.getView().getModel('main');
			var oSelected = oModel.getProperty('/selected');
			var isCustom = oModel.getProperty('/selected/GranularId');
			var isEditState = oModel.getProperty('/selected/CreatePeriodX');
			var oSelectCustom = this.getView().byId("idFree").getSelectedItem();
			var bChecked = null;
			var oTable = this.getView().byId("idTable");			

			oModel.setProperty("/settings/Collapse", true);
			for (var key in oSelected) {
				bChecked = !!oSelected[key];
			};

			// if (!bChecked) {
			// 	console.log('not all filters', oSelected);
			// 	return;
			// }

			if (isCustom == "06" && isEditState == "E" && !oSelectCustom) {
				MessageToast.show("Произвольный период обязателен для заполнения.");
				return;
			}

			var aFilterNames = ["DashboardId", "SubdivId", "GroupId", "DataTypeId", "DateFrom", "DateTo", "GranularId", "ReplicationX", "CreatePeriodX"];
			var bShowSteelType = oModel.getProperty("/settings/SteelType");
			!bShowSteelType || aFilterNames.push("SteelTypeId");
			var aFilters = this.getFilters(aFilterNames);

			console.log('aFilters', aFilters);

			oTable.bindAggregation("rows", {
				path: "oDataModel>/IndicatorSet",
				filters: aFilters, 
				parameters: {
					expand: "AttributeSet",
					navigation: {
						"IndicatorSet": "AttributeSet"
					  }
				 }
			})			
		},
		onSave: function() {
			var oModel = this.getView().getModel("oDataModel");
			var sText;
			oModel.submitChanges({
				success: function (e) {
					console.log('success', e);
					e.__batchResponses.forEach(function(el) {
						if (el.response && el.response.statusCode === "400") {		
							console.log("current item", el);					
							try {
								// sText = JSON.parse(el.response.body).error.message.value;
								sText = "Поле значения не может быть пустым";
							}
							catch(ex) {
								sText = ex;
							}
							MessageBox.error(sText, {
								title: "Ошибка",
								actions: [MessageBox.Action.OK]
							});
							oModel.resetChanges();							
						} 
						sText || MessageToast.show("Сохранение успешно выполнено.");
					});					
				},
				error: function(e) {
					console.log('error', e);
				}
			});
		},
		getMiddleValues: function(arr, start, end){
			var aMiddleValues = arr.filter(function (e) {
				return e.key >= start && e.key <= end;
			});
			var aSet = new Set(aMiddleValues.map(function (el) {return el.key;}));
			//   myDataSet[index - 1].data = Array.prototype.slice.call(tmp)
			var temp_array = [],
				length = aSet.length;

			for (var i = 0; i < length; i++) {
				temp_array.push(aSet[i]);
			}
			return temp_array;// Избавляет от дублей помещая в объект сет, и переводит в массив.
		},
		setWeeks: function(dDate){
			var oModel = this.getView().getModel("main");
			var aWeeks = [];
			var nFirstDayWeekMonth = new Date(dDate.setDate(1)).getDay() || 7;	// День недели, воскресенье 0, нам так не надо
			var nFirstWeeksDays = 7 - (nFirstDayWeekMonth-1);	//количество дней в первой неделе
			var nDaysInMonth = new Date(dDate.getFullYear(), dDate.getMonth()+1,0).getDate();
			var nWeeks = Math.ceil((nDaysInMonth - nFirstWeeksDays)/7)+1;
			for(var i = 1; i <= nWeeks; i++) {
				aWeeks.push({text: i, key: i});
			}
			oModel.setProperty('/periodicity/Week', aWeeks);
		},
		calcDate: function(sName) {
			var oModel = this.getView().getModel("main");
			var dDateFrom = oModel.getProperty('/selected/DateFrom');
			var dDateTo = oModel.getProperty('/selected/DateTo');
			var oDates = this["calc" + sName](dDateFrom, dDateTo);
			oDates.dDateFrom.setHours(3);
			oDates.dDateTo.setHours(3);
			oModel.setProperty('/selected/DateFrom', oDates.dDateFrom);
			oModel.setProperty('/selected/DateTo', oDates.dDateTo);
		},
		onSelectYearRange:function(e) {
			this.calcDate('YearRange');
			var oSelect = this.getView().byId("idYearRange");
			oSelect.rerender();
		},
		calcYearRange: function(dDateFrom, dDateTo) {// можно переделать на создание даты
			var oModel = this.getView().getModel("main");
			var aKeys = this.getView().byId("idYearRange").getSelectedKeys();
			var aAllYears = oModel.getProperty('/periodicity/Year');
			aKeys.sort(function (x, n) {
				return x - n;
			  });
			var yearStart = aKeys[0] || new Date().getFullYear();
			var yearEnd = aKeys[aKeys.length-1] || new Date().getFullYear();
			dDateFrom.setYear(+yearStart);
			dDateFrom.setMonth(0);
			dDateFrom.setDate(1);
			dDateTo.setYear(+yearEnd);
			dDateTo.setMonth(11);
			dDateTo.setDate(31);
			oModel.setProperty('/selected/YearRange', this.getMiddleValues(aAllYears, yearStart, yearEnd));
			return {dDateFrom: dDateFrom, dDateTo: dDateTo};
		},
		onChangeYear: function(e){
			this.calcDate('Year');
		},
		calcYear: function(dDateFrom, dDateTo){// можно переделать на создание даты
			var oModel = this.getView().getModel("main");
			var sKey = oModel.getProperty('/selected/Year');
			dDateFrom.setMonth(0);
			dDateFrom.setDate(1);
			dDateFrom.setYear(+sKey);
			dDateTo.setMonth(11);
			dDateTo.setDate(31);
			dDateTo.setYear(+sKey);
			this.setWeeks(new Date(dDateTo));
			return {dDateFrom: dDateFrom, dDateTo: dDateTo};
		},
		onSelectMonthRange: function() {
			this.calcDate('MonthRange');
			var oSelect = this.getView().byId("idRangeMonth");	
			oSelect.rerender();
		},
		calcMonthRange: function(dDateFrom, dDateTo) {
			var oModel = this.getView().getModel("main");
			var aKeys = oModel.getProperty('/selected/MonthRange');
			// aKeys = aKeys.map(function (x) {
			// 	return +x;
			//   });
			aKeys.sort(function (x, n) {
				return x - n;
			  });
			var nMonthStart = aKeys[0] ;
			var nMonthEnd = aKeys[aKeys.length-1];
			var aAllMonths = oModel.getProperty('/periodicity/Month');
			dDateFrom.setMonth(nMonthStart || 0);
			dDateFrom.setDate(1);
			dDateTo.setDate(1);
			dDateTo.setMonth(nMonthEnd === undefined ? 11 : nMonthEnd);
			dDateTo.setDate(new Date(dDateTo.getFullYear(),dDateTo.getMonth()+1,0).getDate());
			oModel.setProperty('/selected/MonthRange', this.getMiddleValues(aAllMonths, nMonthStart, nMonthEnd));	// Добавляет промежуточным значениям выделение.
			return {dDateFrom: dDateFrom, dDateTo: dDateTo}
		},
		onChangeMonth: function(e){
			//начало треша, переделать
			var oModel = this.getView().getModel("main");
			var sGranKey = oModel.getProperty("/selected/GranularId");
			var sGran = oModel.getProperty("/granular/" + sGranKey);
			if (sGran === "Month") {
				this.onSelectMonthRange();
				return;
			}
			//конец треша
			this.calcDate('Month');
			
		},
		calcMonth: function(dDateFrom, dDateTo){
			var oModel = this.getView().getModel("main");
			var sKey = +oModel.getProperty('/selected/Month');
			dDateFrom.setMonth(sKey);
			dDateTo.setDate(1);
			dDateTo.setMonth(sKey);
			oModel.setProperty('/selected/DateFrom', dDateFrom);
			oModel.setProperty('/selected/DateTo', dDateTo);
			this.setWeeks(new Date(dDateTo));
			return {dDateFrom: dDateFrom, dDateTo: dDateTo};
		},
		onChangeDecade: function() {
			this.calcDate('Decade');
			var oSelect = this.getView().byId("idDecade");
			oSelect.rerender();
		},
		calcDecade: function(dDateFrom, dDateTo){
			var oModel = this.getView().getModel("main");
			var aDecades = oModel.getProperty("/selected/Decade");
			var aAllDecades = oModel.getProperty('/periodicity/Decade');
			aDecades.sort();
			var decadeStart = aDecades[0];
			var decadeEnd = aDecades[aDecades.length-1];
			var nDays = 1+(((decadeStart || 1)-1)*10) ;// первый день декады. 
			var nEndDay = 1+(((decadeEnd || 3)-1)*10);
			dDateFrom.setDate(nDays);
			dDateTo.setDate(decadeEnd || 3 == 3 ? new Date(dDateFrom.getFullYear(), dDateFrom.getMonth()+1,0).getDate() : nEndDay+9||1);
			oModel.setProperty('/selected/Decade', this.getMiddleValues(aAllDecades, decadeStart, decadeEnd));
			return {dDateFrom: dDateFrom, dDateTo: dDateTo};
		},
		onChangeWeek: function() {
			this.calcDate('Week');
			var oSelect = this.getView().byId("idWeeks");
			oSelect.rerender();
		},
		calcWeek: function(dDateFrom, dDateTo){
			var oModel = this.getView().getModel("main");
			var aWeeks = oModel.getProperty('/selected/Week');
			aWeeks.sort(function (a, b) {
				return a - b;
			  });
			var weekStart = aWeeks[0];
			var weekEnd = aWeeks[aWeeks.length-1];
			var nFirstDayWeekMonth = new Date(dDateFrom.setDate(1)).getDay() || 7;	// День недели, воскресенье 0, нам так не надо
			var nFirstWeeksDays = 7 - (nFirstDayWeekMonth-1);	//количество дней в первой неделе		
			var nFirstWeekDay = (weekStart > 1 ? nFirstWeeksDays : 1) + (weekStart > 1 ? 7*(weekStart-2) + 1 : 0); 
			var nLastWeekDay = nFirstWeeksDays + (weekEnd-1)*7; // первая выбранная неделя начинается тут
			nLastWeekDay = nLastWeekDay <= new Date(dDateFrom.getFullYear(), dDateFrom.getMonth()+1,0).getDate() ?
			nLastWeekDay : new Date(dDateFrom.getFullYear(),dDateFrom.getMonth()+1,0).getDate();
			dDateTo.setDate(nLastWeekDay);
			dDateFrom.setDate(nFirstWeekDay);
			var aAllWeeks = oModel.getProperty('/periodicity/Week');
			oModel.setProperty('/selected/Week', this.getMiddleValues(aAllWeeks, weekStart, weekEnd));
			return {dDateFrom: dDateFrom, dDateTo: dDateTo};
		},
		onSelectFreeRange: function(e) {
			var oModel = this.getView().getModel("main");
			var oItem = e.getParameter('selectedItem');
			
			var aItems = e.getSource().getSelectableItems();
			var bEqual = aItems.indexOf(oItem) === aItems.length - 1;
			oModel.setProperty("/show/LastPeriod", bEqual);

			if (!oItem) return;		
			
			var oContext = oItem.getBindingContext('oDataModel').getObject();
			var dDateFrom = oContext.DateFrom;
			var dDateTo = oContext.DateTo;

			dDateFrom.setHours(3);
			dDateTo.setHours(3);
			oModel.setProperty('/selected/DateFrom', dDateFrom);
			oModel.setProperty('/selected/DateTo', dDateTo);
		},
		clearTable: function() {
			var oModel = this.getView().getModel("main");
			var oColumns = oModel.getProperty("/columns");
			var oTable = this.getView().byId("idTable");
			oModel.setProperty("/settings/Collapse", true);
			oTable.unbindRows();
			for (var key in oColumns) {
				oColumns[key] = false;
			};
			oModel.setProperty("/columns", oColumns);
		},
		configureColumns: function(aFilters) {
			var oModel = this.getView().getModel("oDataModel");
			var oMainModel = this.getView().getModel("main");
			var oData = {};
			var oDataValueEdit = oModel.getProperty("/ValueEditX");
			var oView = this.getView();
			var sError;

			if (!oDataValueEdit) {
				oModel.setProperty("/Value", '');
			}

			oView.setBusy(true);

			oModel.read('/IndicatorSet', {
				filters: aFilters,
				success: function(e) {
					oView.setBusy(false);
					console.log('configure data ', e.results);
					var aColumns = e.results;
					oData = {
						thickness: aColumns.some(function (a) {
							return !!a.ThicknessX;
						  }),
						  brigade: aColumns.some(function (a) {
							return !!a.BrigadeX;
						  }),
						  aggregate: aColumns.some(function (a) {
							return !!a.AggregateX;
						  }),
						  redistrib: aColumns.some(function (a) {
							return !!a.RedistribX;
						  }),
						  dateStr: aColumns.some(function (a) {
							return !!a.DateStrX;
						  }),
						  date: aColumns.some(function (a) {
							return !!a.DateX;
						  }),
						  setValid: aColumns.some(function (a) {
							return !!a.SetValX;
						  }),
						  value: aColumns.some(function (a) {
							return !!a.ValueX;
						  })
					};
					oMainModel.setProperty("/columns", oData);
				},
				error: function (e) {
					oView.setBusy(false);
					sError = JSON.parse(e.responseText);
					MessageToast.show(sError.error.message.value);
					console.log('error', e);
				}
			})
		},
		onPaste: function(oInput, oController) {
			var sProp = oInput.data("prop");
			var oTable = oController.getView().byId("idTable");
			var oModel = oTable.getModel('oDataModel');
			var sInitPath = oInput.getBindingContext('oDataModel').getPath();
			var iIdx;
			// Находим индекс строки, куда вставили значения
			for (var i = 0; oTable.getContextByIndex(i); i++){
				if (sInitPath === oTable.getContextByIndex(i).getPath()){
					iIdx = i;
					break;
				}
			}
		
			var iArrIdx = 0;
			var sPath;
			if (navigator.clipboard != undefined) {//Chrome
				navigator.clipboard.readText().then(function (text) {
					var arr = text.split("\n");
					oTable._updateBindingContexts(arr.length);//Подгружаем строки, чтобы отработал getContextByIndex
					// пробегаемся пока есть значения и не вышли за пределы показателя
					for (var i = iIdx; oTable.getContextByIndex(i) && oTable.getContextByIndex(i).getObject().IsAttr && arr[iArrIdx]; i++){
						sPath = oTable.getContextByIndex(i).getPath();
						oModel.setProperty(sPath + "/" + sProp, arr[iArrIdx]);
						iArrIdx++;
					}
				})
			}else if(window.clipboardData) { // Internet Explorer
				var arr = window.clipboardData.getData('text').split("\n");
				oTable._updateBindingContexts(arr.length);//Подгружаем строки, чтобы отработал getContextByIndex
				for (var i = iIdx ; oTable.getContextByIndex(i) && oTable.getContextByIndex(i).getObject().IsAttr && arr[iArrIdx]; i++){
					sPath = oTable.getContextByIndex(i).getPath();
					oModel.setProperty(sPath + "/" + sProp, arr[iArrIdx]);
					iArrIdx++;
				}
			}
		},
		onRouteDashPA: function(e) {
			var oModel = this.getView().getModel("main");
			var oDataModel = this.getView().getModel("oDataModel");
			var sId = oModel.getProperty("/selected/DashboardId");
			var oView = this.getView();
			oView.setBusy(true);
			oDataModel.read("/DashboardSet('".concat(sId, "')"), {
				success: function(e) {
					oView.setBusy(false);
					console.log(e);
					if (!!e.Value) {
						window.open(e.Value);
					} else {
						MessageToast.show("Дашборд временно не доступен в связи с реализацией дополнительной функциональности");
					}	
				},
				error: function(oResponse) {
					oView.setBusy(false);
					console.log("error", oResponse);
				}
			})
		},
		onRemoveLastPeriod: function(e) {
			var oController = this;
			var oModel = this.getView().getModel("main");
			var bShowSteelType = oModel.getProperty("/settings/SteelType");
			var oDataModel = this.getView().getModel("oDataModel");
			var oView = this.getView();
			var sPath = "/AttributeSet(CreatePeriodX='" +
			"E',SteelTypeId='" +  (bShowSteelType ? oModel.getProperty("/selected/SteelTypeId") : 0) + 
			"',DashboardId='" + oModel.getProperty("/selected/DashboardId") + 
			"',ReplicationX=false,DateAttrTo=" + encodeURIComponent(sap.ui.model.odata.ODataUtils.formatValue(oModel.getProperty("/selected/DateTo"), "Edm.DateTime")) + 
			",SubdivId='" + oModel.getProperty("/selected/SubdivId") + 
			"',GroupId='" + oModel.getProperty("/selected/GroupId") + 
			"',DataTypeId='" + oModel.getProperty("/selected/DataTypeId") + 
			"',GranularId='" + oModel.getProperty("/selected/GranularId") + 
			"',IndicatorId='1" + 
			"',DateAttr=" + encodeURIComponent(sap.ui.model.odata.ODataUtils.formatValue(oModel.getProperty("/selected/DateFrom"), "Edm.DateTime")) + 
			",RedistribId='',BrigadeId='',AggregateId='',ThicknessId='')"
			console.log('sPath',sPath);

			oView.setBusy(true);

			MessageBox.confirm(
				"Вы уверены, что хотите удалить период?", {
					styleClass: "sapUiSizeCompact",
					onClose: function (sAction) {
						if (sAction !== "OK") {
							oView.setBusy(false);
							return;
						};
						oDataModel.remove(sPath, {
							batch: false,
							success: function(result) {
								oView.setBusy(false);
								console.log('success', result);
								oController.onChangeGranularId();
								oController.clearTable();
								oModel.setProperty("/show/LastPeriod", false);
								MessageToast.show("Успешно удалено.");
							},
							error: function(result) {
								oView.setBusy(false);
								console.log('error', result);
							},
						});			
					}
				}
			);			
		},

		onLoadTableau: function (e) {
			var oDataModel = this.getView().getModel('oDataModel');
			var oController = this;
			var oModel = this.getView().getModel('main');
			var sId = oModel.getProperty("/selected/DashboardId");
			oDataModel.read("/DashboardSet('".concat(sId, "')"), {
				success: function(success) {
					console.log("success",success);
					if (!success.Value){
						MessageToast.show("Дашборд временно не доступен в связи с реализацией дополнительной функциональности");
						return;
					}
					var obj = {
						host_url: success.Value.split("#")[0],
						embed_code_version: '3',
						tabs: "yes",
						toolbar: "yes",
						embed: "y"
					};
					var name = success.Value.split("#")[1];
					var iFrameContainer = oController.getView().byId("idTablo").getDomRef();
					// oController.getView().byId('idTabloContainer').setVisible(true);
			//var site_root = "t/dataart";
					var iFrame = iFrameContainer.firstElementChild;
					var sPath = obj.host_url + name;
					var oModel = oController.getView().getModel("main");
					var dDateTo = oModel.getProperty("/selected/DateTo");
					var dDateFrom = oModel.getProperty("/selected/DateFrom");
					var sMonth = dDateFrom.getMonth() + 1;
					var sYear = dDateFrom.getFullYear();
					var arr = [];
					var oSelectDivision = oController.getView().byId("idDivision");
					var sDivision = oSelectDivision.getSelectedItem().getText();
					var oSelectGroup = oController.getView().byId("idGroup");
					var sGroup = oSelectGroup.getSelectedItem().getText();

					if (dDateTo.getMonth() == dDateFrom.getMonth()) {
						arr = new Array(dDateTo.getDate() - dDateFrom.getDate());
						for (i = 0; i < dDateTo.getDate() - dDateFrom.getDate() + 1; i++){
							arr[i] = dDateFrom.getDate()+i;
						}
					}

					var aFilter = [
						"",
						"ZMGRC001___T=" + sDivision,
						"ZMGRC100__ZMGRC101___T=" + sGroup,
						"YEAR(%D0%94%D0%B0%D1%82%D0%B0%20%D0%BE%D0%B1%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B8)=" + sYear,
						"MONTH(%D0%94%D0%B0%D1%82%D0%B0%20%D0%BE%D0%B1%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B8)=" + sMonth,
						"DAY(%D0%94%D0%B0%D1%82%D0%B0%20%D0%BE%D0%B1%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B8)=" + String(arr)
					];
					var i = 0;

					for (var prop in obj) {
						sPath = sPath + (!i ? "?" : "&") + ":" + prop + "=" + obj[prop];
						i++;
					}

					console.log("sPath", iFrame.src);
					sPath += aFilter.join("&");
					iFrame.src = sPath;
					console.log(sPath, "sPath", iFrame.src); 
				}, error : function(oResponse) {
					console.log('error',oResponse);
				}
			});
			
			
			
		},
		onExpand: function() {
			var oModel = this.getView().getModel("main");
			var oTable = this.getView().byId("idTable");
			var bExpand = oModel.getProperty("/settings/Collapse");
			bExpand ? oTable.expandToLevel(1) : oTable.collapseAll();
			oModel.setProperty("/settings/Collapse", !bExpand);
		},

		amountFormatter: function(valueSet, valueValid) {
			console.log("format test");
			var temp = valueSet / valueValid || 0;
			return parseInt(temp * 1000) / 1000 ;
		}
	});
	return PageController;
});