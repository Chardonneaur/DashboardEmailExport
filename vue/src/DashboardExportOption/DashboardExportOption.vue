<!--
  Matomo - free/libre analytics platform

  @link    https://matomo.org
  @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
-->

<template>
  <div v-if="report && report.type === 'email' && report.format === 'pdf'">
    <div class="form-group row">
      <h3 class="col s12">
        {{ translate('DashboardEmailExport_IncludeDashboard') }}
      </h3>
    </div>
    <div>
      <Field
        uicontrol="checkbox"
        name="report_include_dashboard"
        :model-value="report.includeDashboard"
        @update:model-value="$emit('change', 'includeDashboard', $event)"
        :title="translate('DashboardEmailExport_IncludeDashboard')"
        :inline-help="translate('DashboardEmailExport_IncludeDashboardHelp')"
      />
    </div>
    <div v-show="report.includeDashboard">
      <Field
        uicontrol="select"
        name="report_dashboard_id"
        :model-value="report.dashboardId"
        @update:model-value="$emit('change', 'dashboardId', $event)"
        :title="translate('DashboardEmailExport_SelectDashboard')"
        :options="dashboardOptions"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { translate } from 'CoreHome';
import { Field } from 'CorePluginsAdmin';

interface Dashboard {
  id: number;
  name: string;
}

interface ReportParameters {
  [key: string]: unknown;
}

export default defineComponent({
  props: {
    report: {
      type: Object,
      required: true,
    },
    reportType: {
      type: String,
      required: true,
    },
    defaultIncludeDashboard: {
      type: Boolean,
      required: true,
    },
    defaultDashboardId: {
      type: Number,
      required: true,
    },
    dashboards: {
      type: Array as () => Dashboard[],
      required: true,
    },
  },
  emits: ['change'],
  components: {
    Field,
  },
  setup(props) {
    const {
      resetReportParametersFunctions,
      updateReportParametersFunctions,
      getReportParametersFunctions,
    } = window as unknown as {
      resetReportParametersFunctions: Record<string, (report: ReportParameters) => void>;
      updateReportParametersFunctions: Record<string, (report: ReportParameters) => void>;
      getReportParametersFunctions: Record<string, (report: ReportParameters) => Record<string, unknown>>;
    };

    const originalReset = resetReportParametersFunctions[props.reportType];
    const originalUpdate = updateReportParametersFunctions[props.reportType];
    const originalGet = getReportParametersFunctions[props.reportType];

    resetReportParametersFunctions[props.reportType] = (theReport: ReportParameters) => {
      if (originalReset) {
        originalReset(theReport);
      }
      theReport.includeDashboard = props.defaultIncludeDashboard;
      theReport.dashboardId = props.defaultDashboardId;
    };

    updateReportParametersFunctions[props.reportType] = (theReport: ReportParameters) => {
      if (originalUpdate) {
        originalUpdate(theReport);
      }
      if (!theReport?.parameters) {
        return;
      }
      const params = theReport.parameters as Record<string, unknown>;
      if ('includeDashboard' in params) {
        theReport.includeDashboard = params.includeDashboard;
      }
      if ('dashboardId' in params) {
        theReport.dashboardId = params.dashboardId;
      }
    };

    getReportParametersFunctions[props.reportType] = (theReport: ReportParameters) => {
      const result = originalGet ? originalGet(theReport) : {};
      return {
        ...result,
        includeDashboard: theReport.includeDashboard,
        dashboardId: theReport.dashboardId,
      };
    };

    const dashboardOptions = computed(() => {
      return props.dashboards.map((dashboard: Dashboard) => ({
        key: dashboard.id.toString(),
        value: dashboard.name,
      }));
    });

    return {
      translate,
      dashboardOptions,
    };
  },
});
</script>
