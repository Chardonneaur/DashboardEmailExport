<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\DashboardEmailExport;

use Piwik\API\Request;
use Piwik\Common;
use Piwik\Piwik;
use Piwik\Plugin;
use Piwik\Plugins\Dashboard\API as DashboardAPI;
use Piwik\Plugins\ScheduledReports\ScheduledReports;
use Piwik\View;

class DashboardEmailExport extends Plugin
{
    public const INCLUDE_DASHBOARD_PARAMETER = 'includeDashboard';
    public const INCLUDE_DASHBOARD_PARAMETER_DEFAULT_VALUE = false;

    public const DASHBOARD_ID_PARAMETER = 'dashboardId';
    public const DASHBOARD_ID_PARAMETER_DEFAULT_VALUE = 1;

    /**
     * @see \Piwik\Plugin::registerEvents
     */
    public function registerEvents()
    {
        return [
            'ScheduledReports.getReportParameters'      => 'getReportParameters',
            'ScheduledReports.validateReportParameters' => 'validateReportParameters',
            'ScheduledReports.processReports'           => 'processReports',
            'Template.reportParametersScheduledReports' => 'templateReportParametersScheduledReports',
            'Translate.getClientSideTranslationKeys'    => 'getClientSideTranslationKeys',
            'AssetManager.getJavaScriptFiles'           => 'getJsFiles',
        ];
    }

    public function getJsFiles(&$jsFiles)
    {
        $jsFiles[] = 'plugins/DashboardEmailExport/vue/dist/DashboardEmailExport.umd.min.js';
        $jsFiles[] = 'plugins/DashboardEmailExport/javascripts/dashboardExportOption.js';
    }

    public function getClientSideTranslationKeys(&$translationKeys)
    {
        $translationKeys[] = 'DashboardEmailExport_IncludeDashboard';
        $translationKeys[] = 'DashboardEmailExport_IncludeDashboardHelp';
        $translationKeys[] = 'DashboardEmailExport_SelectDashboard';
    }

    /**
     * Add our parameters to the available parameters list
     */
    public function getReportParameters(&$availableParameters, $reportType)
    {
        if ($reportType === ScheduledReports::EMAIL_TYPE) {
            $availableParameters[self::INCLUDE_DASHBOARD_PARAMETER] = false;
            $availableParameters[self::DASHBOARD_ID_PARAMETER] = false;
        }
    }

    /**
     * Validate our parameters
     */
    public function validateReportParameters(&$parameters, $reportType)
    {
        if ($reportType !== ScheduledReports::EMAIL_TYPE) {
            return;
        }

        if (!isset($parameters[self::INCLUDE_DASHBOARD_PARAMETER])) {
            $parameters[self::INCLUDE_DASHBOARD_PARAMETER] = self::INCLUDE_DASHBOARD_PARAMETER_DEFAULT_VALUE;
        } else {
            $parameters[self::INCLUDE_DASHBOARD_PARAMETER] = self::valueIsTrue($parameters[self::INCLUDE_DASHBOARD_PARAMETER]);
        }

        if (!isset($parameters[self::DASHBOARD_ID_PARAMETER])) {
            $parameters[self::DASHBOARD_ID_PARAMETER] = self::DASHBOARD_ID_PARAMETER_DEFAULT_VALUE;
        } else {
            $parameters[self::DASHBOARD_ID_PARAMETER] = (int) $parameters[self::DASHBOARD_ID_PARAMETER];
        }
    }

    /**
     * Process reports - add dashboard widgets if the option is enabled
     */
    public function processReports(&$processedReports, $reportType, $outputType, $report)
    {
        if ($reportType !== ScheduledReports::EMAIL_TYPE) {
            return;
        }

        $parameters = $report['parameters'];

        if (empty($parameters[self::INCLUDE_DASHBOARD_PARAMETER])) {
            return;
        }

        $idSite = $report['idsite'];
        $dashboardId = $parameters[self::DASHBOARD_ID_PARAMETER] ?? self::DASHBOARD_ID_PARAMETER_DEFAULT_VALUE;

        try {
            $dashboardWidgets = $this->getDashboardWidgetsAsReports($idSite, $dashboardId, $report);

            if (!empty($dashboardWidgets)) {
                $processedReports = array_merge($processedReports, $dashboardWidgets);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the entire report
            \Piwik\Log::warning('DashboardEmailExport: Failed to include dashboard widgets: ' . $e->getMessage());
        }
    }

    /**
     * Add our template/Vue component to the scheduled reports form
     */
    public static function templateReportParametersScheduledReports(&$out)
    {
        $dashboards = [];

        try {
            $dashboardAPI = DashboardAPI::getInstance();
            $userDashboards = $dashboardAPI->getDashboards();

            foreach ($userDashboards as $dashboard) {
                $dashboards[] = [
                    'id' => $dashboard['id'],
                    'name' => $dashboard['name'],
                ];
            }
        } catch (\Exception $e) {
            $dashboards = [
                ['id' => 1, 'name' => Piwik::translate('Dashboard_Dashboard')]
            ];
        }

        $view = new View('@DashboardEmailExport/reportParametersDashboardExport');
        $view->reportType = ScheduledReports::EMAIL_TYPE;
        $view->defaultIncludeDashboard = self::INCLUDE_DASHBOARD_PARAMETER_DEFAULT_VALUE;
        $view->defaultDashboardId = self::DASHBOARD_ID_PARAMETER_DEFAULT_VALUE;
        $view->dashboards = $dashboards;
        $out .= $view->render();
    }

    /**
     * Get dashboard widgets formatted as processed reports
     */
    private function getDashboardWidgetsAsReports($idSite, $dashboardId, $report)
    {
        $processedWidgetReports = [];

        $dashboardAPI = DashboardAPI::getInstance();
        $dashboards = $dashboardAPI->getDashboards();

        $selectedDashboard = null;
        foreach ($dashboards as $dashboard) {
            if ($dashboard['id'] == $dashboardId) {
                $selectedDashboard = $dashboard;
                break;
            }
        }

        if (empty($selectedDashboard) || empty($selectedDashboard['widgets'])) {
            return $processedWidgetReports;
        }

        $period = $report['period_param'] ?? $report['period'];
        if ($period === 'never') {
            $period = 'day';
        }

        $date = \Piwik\Date::now()->subPeriod(1, $period)->toString();

        $segment = null;
        if (!empty($report['idsegment'])) {
            $segment = \Piwik\Plugins\ScheduledReports\API::getSegment($report['idsegment']);
        }

        foreach ($selectedDashboard['widgets'] as $widget) {
            try {
                $widgetReport = $this->getWidgetAsProcessedReport(
                    $idSite,
                    $widget['module'],
                    $widget['action'],
                    $period,
                    $date,
                    $segment,
                    $report
                );

                if ($widgetReport !== null) {
                    $processedWidgetReports[] = $widgetReport;
                }
            } catch (\Exception $e) {
                \Piwik\Log::debug('DashboardEmailExport: Failed to process widget ' . $widget['module'] . '.' . $widget['action'] . ': ' . $e->getMessage());
            }
        }

        return $processedWidgetReports;
    }

    /**
     * Convert a widget to a processed report format
     */
    private function getWidgetAsProcessedReport($idSite, $module, $action, $period, $date, $segment, $report)
    {
        $params = [
            'idSite' => $idSite,
            'period' => $period,
            'date' => $date,
            'apiModule' => $module,
            'apiAction' => $action,
            'apiParameters' => [],
            'flat' => 1,
            'idGoal' => false,
            'serialize' => 0,
            'format' => 'original',
        ];

        if ($segment !== null) {
            $params['segment'] = urlencode($segment['definition']);
        } else {
            $params['segment'] = false;
        }

        try {
            $processedReport = Request::processRequest('API.getProcessedReport', $params);

            if (empty($processedReport) || empty($processedReport['metadata'])) {
                return null;
            }

            $processedReport['segment'] = $segment;

            $displayFormat = $report['parameters'][ScheduledReports::DISPLAY_FORMAT_PARAMETER] ?? ScheduledReports::DEFAULT_DISPLAY_FORMAT;
            $evolutionGraph = $report['parameters'][ScheduledReports::EVOLUTION_GRAPH_PARAMETER] ?? ScheduledReports::EVOLUTION_GRAPH_PARAMETER_DEFAULT_VALUE;

            $metadata = $processedReport['metadata'];
            $isAggregateReport = !empty($metadata['dimension']);

            $processedReport['displayTable'] = $displayFormat != ScheduledReports::DISPLAY_FORMAT_GRAPHS_ONLY;
            $processedReport['displayGraph'] =
                ($isAggregateReport ?
                    $displayFormat == ScheduledReports::DISPLAY_FORMAT_GRAPHS_ONLY || $displayFormat == ScheduledReports::DISPLAY_FORMAT_TABLES_AND_GRAPHS
                    :
                    $displayFormat != ScheduledReports::DISPLAY_FORMAT_TABLES_ONLY)
                && \Piwik\SettingsServer::isGdExtensionEnabled()
                && \Piwik\Plugin\Manager::getInstance()->isPluginActivated('ImageGraph')
                && !empty($metadata['imageGraphUrl']);

            $processedReport['evolutionGraph'] = $evolutionGraph;

            return $processedReport;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check if a value is considered "true"
     */
    private static function valueIsTrue($value)
    {
        return $value === 'true' || $value === 1 || $value === '1' || $value === true;
    }
}
