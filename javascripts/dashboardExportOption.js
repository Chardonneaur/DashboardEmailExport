/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

(function() {
    'use strict';

    var initialized = false;

    function initDashboardExportOption() {
        if (initialized) return;

        var reportType = 'email';

        // Ensure objects exist
        window.resetReportParametersFunctions = window.resetReportParametersFunctions || {};
        window.updateReportParametersFunctions = window.updateReportParametersFunctions || {};
        window.getReportParametersFunctions = window.getReportParametersFunctions || {};

        var resetFns = window.resetReportParametersFunctions;
        var updateFns = window.updateReportParametersFunctions;
        var getFns = window.getReportParametersFunctions;

        // Check if ScheduledReports has set its functions yet
        var origGet = getFns[reportType];
        if (!origGet) {
            // ScheduledReports hasn't initialized yet, try again later
            setTimeout(initDashboardExportOption, 200);
            return;
        }

        initialized = true;

        var origReset = resetFns[reportType];
        var origUpdate = updateFns[reportType];

        // Wrap reset function
        if (origReset && !origReset._dashboardExportWrapped) {
            var wrappedReset = function(report) {
                origReset(report);
                report.includeDashboard = false;
                report.dashboardId = 1;
            };
            wrappedReset._dashboardExportWrapped = true;
            resetFns[reportType] = wrappedReset;
        }

        // Wrap update function
        if (origUpdate && !origUpdate._dashboardExportWrapped) {
            var wrappedUpdate = function(report) {
                origUpdate(report);
                if (report && report.parameters) {
                    if ('includeDashboard' in report.parameters) {
                        report.includeDashboard = report.parameters.includeDashboard;
                    }
                    if ('dashboardId' in report.parameters) {
                        report.dashboardId = report.parameters.dashboardId;
                    }
                }
            };
            wrappedUpdate._dashboardExportWrapped = true;
            updateFns[reportType] = wrappedUpdate;
        }

        // Wrap get function
        if (origGet && !origGet._dashboardExportWrapped) {
            var wrappedGet = function(report) {
                var result = origGet(report);
                result.includeDashboard = report.includeDashboard || false;
                result.dashboardId = report.dashboardId || 1;
                return result;
            };
            wrappedGet._dashboardExportWrapped = true;
            getFns[reportType] = wrappedGet;
        }

        console.log('[DashboardEmailExport] Parameter functions wrapped successfully');
    }

    // Try to initialize after a delay to ensure ScheduledReports loads first
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initDashboardExportOption, 500);
        });
    } else {
        setTimeout(initDashboardExportOption, 500);
    }
})();
