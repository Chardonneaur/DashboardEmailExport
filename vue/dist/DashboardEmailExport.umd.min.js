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
            report: { type: Object, required: false, default: null },
            onChange: { type: Function, required: false, default: null },
            reportType: { type: String, required: true },
            defaultIncludeDashboard: { type: Boolean, required: true },
            defaultDashboardId: { type: Number, required: true },
            dashboards: { type: Array, required: true }
        },
        components: { Field: Field },
        data: function() {
            return {
                report_: this.report
            };
        },
        computed: {
            currentReport: function() {
                return this.report_ || this.report || {};
            },
            showOption: function() {
                var r = this.currentReport;
                return r && r.type === 'email';
            },
            dashboardOptions: function() {
                return this.dashboards.map(function(d) {
                    return { key: String(d.id), value: d.name };
                });
            }
        },
        watch: {
            report: function(newVal) {
                this.report_ = newVal;
            }
        },
        methods: {
            onIncludeDashboardChange: function(value) {
                if (this.currentReport) {
                    this.currentReport.includeDashboard = value;
                }
                if (this.onChange) {
                    this.onChange('includeDashboard', value);
                }
            },
            onDashboardIdChange: function(value) {
                if (this.currentReport) {
                    this.currentReport.dashboardId = value;
                }
                if (this.onChange) {
                    this.onChange('dashboardId', value);
                }
            }
        },
        setup: function(props) {
            var reportType = props.reportType;

            // Store original functions
            var resetFns = window.resetReportParametersFunctions || {};
            var updateFns = window.updateReportParametersFunctions || {};
            var getFns = window.getReportParametersFunctions || {};

            window.resetReportParametersFunctions = resetFns;
            window.updateReportParametersFunctions = updateFns;
            window.getReportParametersFunctions = getFns;

            var origReset = resetFns[reportType];
            var origUpdate = updateFns[reportType];
            var origGet = getFns[reportType];

            resetFns[reportType] = function(theReport) {
                if (origReset) origReset(theReport);
                theReport.includeDashboard = props.defaultIncludeDashboard;
                theReport.dashboardId = props.defaultDashboardId;
            };

            updateFns[reportType] = function(theReport) {
                if (origUpdate) origUpdate(theReport);
                if (!theReport || !theReport.parameters) return;
                if ('includeDashboard' in theReport.parameters) {
                    theReport.includeDashboard = theReport.parameters.includeDashboard;
                }
                if ('dashboardId' in theReport.parameters) {
                    theReport.dashboardId = theReport.parameters.dashboardId;
                }
            };

            getFns[reportType] = function(theReport) {
                var result = origGet ? origGet(theReport) : {};
                result.includeDashboard = theReport.includeDashboard || false;
                result.dashboardId = theReport.dashboardId || 1;
                return result;
            };

            return {
                translate: translate
            };
        },
        template: '<div v-if="showOption" class="dashboard-export-option" style="margin-top: 15px;">' +
            '<div class="form-group row" style="margin-bottom: 10px;">' +
            '<div class="col s12"><h3 style="font-size: 14px; margin: 0 0 10px 0;">{{ translate("DashboardEmailExport_IncludeDashboard") }}</h3></div>' +
            '</div>' +
            '<div>' +
            '<Field uicontrol="checkbox" name="report_include_dashboard" ' +
            ':model-value="currentReport.includeDashboard" ' +
            '@update:model-value="onIncludeDashboardChange" ' +
            ':title="translate(\'DashboardEmailExport_IncludeDashboard\')" ' +
            ':inline-help="translate(\'DashboardEmailExport_IncludeDashboardHelp\')"/>' +
            '</div>' +
            '<div v-if="currentReport.includeDashboard" style="margin-top: 10px;">' +
            '<Field uicontrol="select" name="report_dashboard_id" ' +
            ':model-value="currentReport.dashboardId" ' +
            '@update:model-value="onDashboardIdChange" ' +
            ':title="translate(\'DashboardEmailExport_SelectDashboard\')" ' +
            ':options="dashboardOptions"/>' +
            '</div>' +
            '</div>'
    });

    return {
        DashboardExportOption: DashboardExportOption
    };
});
