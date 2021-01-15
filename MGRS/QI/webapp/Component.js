sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

	var Component = UIComponent.extend("mgrs.QI.Component", {

		metadata : {
			manifest: "json",
			includes: ["style/style.css"]
			
		},
		init: function () {
			var oRenderer = sap.ushell.Container.getRenderer("fiori2");
			// oRenderer.setHeaderVisibility(false, false);
			UIComponent.prototype.init.apply(this, arguments);
		}
	});

	return Component;

});
