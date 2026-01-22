<?php
/**
 * Simple test script to verify the plugin loads correctly
 */

// Change to Matomo root directory
chdir(dirname(__DIR__, 3));

define('PIWIK_INCLUDE_PATH', getcwd());
define('PIWIK_USER_PATH', getcwd());
define('PIWIK_DOCUMENT_ROOT', getcwd());

require_once 'index.php';

echo "Testing DashboardEmailExport plugin\n";
echo "=====================================\n\n";

// Check if the plugin class exists
if (class_exists('\Piwik\Plugins\DashboardEmailExport\DashboardEmailExport')) {
    echo "Plugin class exists.\n";
} else {
    echo "ERROR: Plugin class not found!\n";
    exit(1);
}

// Check if the plugin is activated
$pluginManager = \Piwik\Plugin\Manager::getInstance();
if ($pluginManager->isPluginActivated('DashboardEmailExport')) {
    echo "Plugin is activated.\n";
} else {
    echo "ERROR: Plugin is not activated!\n";
    exit(1);
}

// Check registered events
$plugin = new \Piwik\Plugins\DashboardEmailExport\DashboardEmailExport();
$events = $plugin->registerEvents();

echo "\nRegistered events:\n";
foreach ($events as $event => $handler) {
    echo "  - $event -> $handler\n";
}

echo "\nPlugin test completed successfully!\n";
