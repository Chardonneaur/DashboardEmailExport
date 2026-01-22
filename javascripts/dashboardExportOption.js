/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

(function() {
    'use strict';

    // Wait for the window to be ready
    if (typeof window.resetReportParametersFunctions === 'undefined') {
        window.resetReportParametersFunctions = {};
    }
    if (typeof window.updateReportParametersFunctions === 'undefined') {
        window.updateReportParametersFunctions = {};
    }
    if (typeof window.getReportParametersFunctions === 'undefined') {
        window.getReportParametersFunctions = {};
    }

    var originalReset = window.resetReportParametersFunctions['email'];
    var originalUpdate = window.updateReportParametersFunctions['email'];
    var originalGet = window.getReportParametersFunctions['email'];

    // Extend reset function
    window.resetReportParametersFunctions['email'] = function(report) {
        if (originalReset) {
            originalReset(report);
        }
        report.includeDashboard = false;
        report.dashboardId = 1;
    };

    // Extend update function
    window.updateReportParametersFunctions['email'] = function(report) {
        if (originalUpdate) {
            originalUpdate(report);
        }
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
    window.getReportParametersFunctions['email'] = function(report) {
        var result = originalGet ? originalGet(report) : {};
        result.includeDashboard = report.includeDashboard || false;
        result.dashboardId = report.dashboardId || 1;
        return result;
    };
})();
