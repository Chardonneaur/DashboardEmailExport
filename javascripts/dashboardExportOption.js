/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

(function() {
    'use strict';

    // Wait for DOM and ensure the report form exists
    function initDashboardExportOption() {
        // Extend the parameter functions for email type
        var reportType = 'email';

        // Store original functions
        var origReset = window.resetReportParametersFunctions ? window.resetReportParametersFunctions[reportType] : null;
        var origUpdate = window.updateReportParametersFunctions ? window.updateReportParametersFunctions[reportType] : null;
        var origGet = window.getReportParametersFunctions ? window.getReportParametersFunctions[reportType] : null;

        // Ensure objects exist
        window.resetReportParametersFunctions = window.resetReportParametersFunctions || {};
        window.updateReportParametersFunctions = window.updateReportParametersFunctions || {};
        window.getReportParametersFunctions = window.getReportParametersFunctions || {};

        // Extend reset function
        window.resetReportParametersFunctions[reportType] = function(report) {
            if (origReset) origReset(report);
            report.includeDashboard = false;
            report.dashboardId = 1;
        };

        // Extend update function
        window.updateReportParametersFunctions[reportType] = function(report) {
            if (origUpdate) origUpdate(report);
            if (report && report.parameters) {
                if ('includeDashboard' in report.parameters) {
                    report.includeDashboard = report.parameters.includeDashboard;
                }
                if ('dashboardId' in report.parameters) {
                    report.dashboardId = report.parameters.dashboardId;
                }
            }
        };

        // Extend get function
        window.getReportParametersFunctions[reportType] = function(report) {
            var result = origGet ? origGet(report) : {};
            result.includeDashboard = report.includeDashboard || false;
            result.dashboardId = report.dashboardId || 1;
            return result;
        };

        console.log('[DashboardEmailExport] Parameter functions initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboardExportOption);
    } else {
        initDashboardExportOption();
    }

    // Also try to initialize when piwik is ready
    if (typeof window.piwik !== 'undefined' && window.piwik.on) {
        window.piwik.on('piwikPageChange', initDashboardExportOption);
    }
})();
