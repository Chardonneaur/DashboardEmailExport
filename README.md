# Dashboard Email Export Plugin for Matomo

A Matomo plugin that extends the email report functionality to include an option for exporting the full dashboard with all widgets in PDF format.

## Features

- Adds a checkbox option to scheduled email reports for including dashboard widgets
- Allows selection of which dashboard to export
- Exports all widgets from the selected dashboard in PDF format
- Integrates seamlessly with Matomo's existing scheduled reports system

## Requirements

- Matomo >= 4.0.0
- PHP >= 7.2
- ScheduledReports plugin (core plugin, enabled by default)
- Dashboard plugin (core plugin, enabled by default)

## Installation

### Via Matomo Marketplace

1. Go to Administration > Marketplace in your Matomo instance
2. Search for "Dashboard Email Export"
3. Click Install

### Manual Installation

1. Download or clone this repository
2. Copy the `DashboardEmailExport` folder to your Matomo's `plugins/` directory
3. Activate the plugin in Administration > Plugins

## Usage

1. Go to **Personal > Email Reports** (or Administration > Personal > Email Reports)
2. Create a new email report or edit an existing one
3. Select **PDF** as the report format
4. Check the **Include Dashboard Widgets** checkbox that appears
5. Select which dashboard to include from the dropdown
6. Save the report

When the scheduled report is generated and sent, it will include all widgets from the selected dashboard in addition to any other reports you've selected.

## Configuration

The plugin adds two parameters to email reports:

- **includeDashboard**: Boolean flag to enable/disable dashboard export
- **dashboardId**: The ID of the dashboard to export (defaults to 1)

## Technical Details

### Events Hooked

The plugin hooks into the following Matomo events:

- `ScheduledReports.getReportParameters` - Registers the new parameters
- `ScheduledReports.validateReportParameters` - Validates the parameters
- `ScheduledReports.processReports` - Processes dashboard widgets as reports
- `Template.reportParametersScheduledReports` - Adds the UI checkbox
- `Translate.getClientSideTranslationKeys` - Provides translations
- `AssetManager.getJavaScriptFiles` - Registers JavaScript files

### How It Works

1. When creating/editing an email report, a new checkbox appears for PDF format reports
2. If enabled, the plugin fetches all widgets from the selected dashboard using the Dashboard API
3. Each widget is converted to a processed report format compatible with the PDF renderer
4. The widget reports are appended to the scheduled report's processed reports array
5. The standard PDF renderer handles the output of all reports including the dashboard widgets

## Translations

Currently supported languages:
- English (en)

To add translations, create a new JSON file in the `lang/` directory following the pattern in `lang/en.json`.

## Development

### Building Vue Components

If you need to modify the Vue component:

```bash
cd /path/to/matomo
npm install
php console vue:build DashboardEmailExport
```

### Running Tests

```bash
php console tests:run DashboardEmailExport
```

## License

GPL v3 or later - See [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
