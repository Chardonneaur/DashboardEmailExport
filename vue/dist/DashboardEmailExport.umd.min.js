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

    // Track if we've already initialized to avoid double-wrapping
    var initialized = false;

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
        mounted: function() {
            var self = this;
            var reportType = this.reportType;

            // Only initialize once globally
            if (initialized) {
                return;
            }
            initialized = true;

            // Ensure objects exist
            window.resetReportParametersFunctions = window.resetReportParametersFunctions || {};
            window.updateReportParametersFunctions = window.updateReportParametersFunctions || {};
            window.getReportParametersFunctions = window.getReportParametersFunctions || {};

            // Wait a tick to ensure ScheduledReports has initialized first
            setTimeout(function() {
                var resetFns = window.resetReportParametersFunctions;
                var updateFns = window.updateReportParametersFunctions;
                var getFns = window.getReportParametersFunctions;

                // Store original functions (these should now be set by ScheduledReports)
                var origReset = resetFns[reportType];
                var origUpdate = updateFns[reportType];
                var origGet = getFns[reportType];

                // Only wrap if not already wrapped
                if (origReset && !origReset._dashboardExportWrapped) {
                    var wrappedReset = function(theReport) {
                        origReset(theReport);
                        theReport.includeDashboard = self.defaultIncludeDashboard;
                        theReport.dashboardId = self.defaultDashboardId;
                    };
                    wrappedReset._dashboardExportWrapped = true;
                    resetFns[reportType] = wrappedReset;
                }

                if (origUpdate && !origUpdate._dashboardExportWrapped) {
                    var wrappedUpdate = function(theReport) {
                        origUpdate(theReport);
                        if (theReport && theReport.parameters) {
                            if ('includeDashboard' in theReport.parameters) {
                                theReport.includeDashboard = theReport.parameters.includeDashboard;
                            }
                            if ('dashboardId' in theReport.parameters) {
                                theReport.dashboardId = theReport.parameters.dashboardId;
                            }
                        }
                    };
                    wrappedUpdate._dashboardExportWrapped = true;
                    updateFns[reportType] = wrappedUpdate;
                }

                if (origGet && !origGet._dashboardExportWrapped) {
                    var wrappedGet = function(theReport) {
                        var result = origGet(theReport);
                        result.includeDashboard = theReport.includeDashboard || false;
                        result.dashboardId = theReport.dashboardId || 1;
                        return result;
                    };
                    wrappedGet._dashboardExportWrapped = true;
                    getFns[reportType] = wrappedGet;
                }
            }, 100);
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
