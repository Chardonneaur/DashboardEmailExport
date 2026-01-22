(function webpackUniversalModuleDefinition(root, factory) {
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory(require("CoreHome"), require("vue"), require("CorePluginsAdmin"));
    else if(typeof define === 'function' && define.amd)
        define(["CoreHome", , "CorePluginsAdmin"], factory);
    else if(typeof exports === 'object')
        exports["DashboardEmailExport"] = factory(require("CoreHome"), require("vue"), require("CorePluginsAdmin"));
    else
        root["DashboardEmailExport"] = factory(root["CoreHome"], root["Vue"], root["CorePluginsAdmin"]);
})((typeof self !== 'undefined' ? self : this), function(CoreHome, Vue, CorePluginsAdmin) {
    "use strict";

    var translate = CoreHome.translate;
    var Field = CorePluginsAdmin.Field;

    var DashboardExportOption = Vue.defineComponent({
        props: {
            report: { type: Object, required: true },
            reportType: { type: String, required: true },
            defaultIncludeDashboard: { type: Boolean, required: true },
            defaultDashboardId: { type: Number, required: true },
            dashboards: { type: Array, required: true }
        },
        emits: ['change'],
        components: { Field: Field },
        setup: function(props, ctx) {
            var resetFns = window.resetReportParametersFunctions;
            var updateFns = window.updateReportParametersFunctions;
            var getFns = window.getReportParametersFunctions;

            var origReset = resetFns[props.reportType];
            var origUpdate = updateFns[props.reportType];
            var origGet = getFns[props.reportType];

            resetFns[props.reportType] = function(theReport) {
                if (origReset) origReset(theReport);
                theReport.includeDashboard = props.defaultIncludeDashboard;
                theReport.dashboardId = props.defaultDashboardId;
            };

            updateFns[props.reportType] = function(theReport) {
                if (origUpdate) origUpdate(theReport);
                if (!theReport || !theReport.parameters) return;
                if ('includeDashboard' in theReport.parameters) {
                    theReport.includeDashboard = theReport.parameters.includeDashboard;
                }
                if ('dashboardId' in theReport.parameters) {
                    theReport.dashboardId = theReport.parameters.dashboardId;
                }
            };

            getFns[props.reportType] = function(theReport) {
                var result = origGet ? origGet(theReport) : {};
                result.includeDashboard = theReport.includeDashboard;
                result.dashboardId = theReport.dashboardId;
                return result;
            };

            var dashboardOptions = Vue.computed(function() {
                return props.dashboards.map(function(d) {
                    return { key: String(d.id), value: d.name };
                });
            });

            return {
                translate: translate,
                dashboardOptions: dashboardOptions
            };
        },
        template: '<div v-if="report && report.type === \'email\' && report.format === \'pdf\'">' +
            '<div class="form-group row"><h3 class="col s12">{{ translate("DashboardEmailExport_IncludeDashboard") }}</h3></div>' +
            '<div><Field uicontrol="checkbox" name="report_include_dashboard" :model-value="report.includeDashboard" @update:model-value="$emit(\'change\', \'includeDashboard\', $event)" :title="translate(\'DashboardEmailExport_IncludeDashboard\')" :inline-help="translate(\'DashboardEmailExport_IncludeDashboardHelp\')"/></div>' +
            '<div v-show="report.includeDashboard"><Field uicontrol="select" name="report_dashboard_id" :model-value="report.dashboardId" @update:model-value="$emit(\'change\', \'dashboardId\', $event)" :title="translate(\'DashboardEmailExport_SelectDashboard\')" :options="dashboardOptions"/></div>' +
            '</div>'
    });

    return {
        DashboardExportOption: DashboardExportOption
    };
});
