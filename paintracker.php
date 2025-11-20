<?php
/*
 * Plugin Name:       Corpus Analytica – PainTracker
 * Plugin URI:        https://www.corpusanalytica.com/
 * Description:       Interactive 3D pain mapping tool that lets patients mark pain areas on a male/female body model and saves the data as JSON.
 * Version:           1.0.1
 * Author:            Connor Bröder, Bernhard Zechmann
 * Author URI:        https://www.corpusanalytica.com/
 * Text Domain:       wp-corpus-analytica-paintracker
 * Requires at least: 6.0
 * Requires PHP:      8.0
*/

if (!defined('ABSPATH')) {
    exit;
}

// Optional Freemius integration
if (!defined('PAINTRACKER_ENABLE_FREEMIUS')) {
    define('PAINTRACKER_ENABLE_FREEMIUS', false);
}

if (PAINTRACKER_ENABLE_FREEMIUS && !function_exists('paintracker_fs')) {
    function paintracker_fs()
    {
        global $paintracker_fs;

        if (!isset($paintracker_fs)) {
            // TODO: Replace placeholder keys/IDs with values from your Freemius dashboard.
            $freemius_start = dirname(__FILE__) . '/freemius/start.php';

            if (file_exists($freemius_start)) {
                require_once $freemius_start;

                $paintracker_fs = fs_dynamic_init([
                    'id'             => 'wp-corpus-analytica-paintracker',
                    'slug'           => 'wp-corpus-analytica-paintracker',
                    'type'           => 'plugin',
                    'public_key'     => 'REPLACE_WITH_PUBLIC_KEY',
                    'is_premium'     => false,
                    'premium_suffix' => __('Pro', 'wp-corpus-analytica-paintracker'),
                    'has_premium_version' => false,
                    'has_addons'     => false,
                    'has_paid_plans' => false,
                    'menu'           => [
                        'slug'    => 'corpus-analytica-paintracker',
                        'support' => false,
                    ],
                ]);
            }
        }

        return $paintracker_fs;
    }

    if (file_exists(dirname(__FILE__) . '/freemius/start.php')) {
        paintracker_fs();
        do_action('paintracker_fs_loaded');
    }
}

function enqueue_3d_model_scripts()
{
    wp_enqueue_script('babylonjs', 'https://cdn.babylonjs.com/babylon.js', array(), '1.0', true);
    wp_enqueue_script('babylonjs-loaders', 'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js', array('babylonjs'), '1.0', true);
    wp_enqueue_script('plugin-script', plugin_dir_url(__FILE__) . 'js/script.js', array('babylonjs', 'babylonjs-loaders'), '1.0', true);
    // Expose plugin base URL to JS so we can load GLB models from the plugin folder
    wp_localize_script('plugin-script', 'PaintrackerConfig', array(
        'baseUrl' => plugin_dir_url(__FILE__),
    ));
    wp_enqueue_script('custom-script', plugin_dir_url(__FILE__) . 'js/custom-script.js', array(), '1.0', true);
    wp_enqueue_style('plugin-style', plugin_dir_url(__FILE__) . 'css/style.css', array(), '1.0');
}

add_action('wp_enqueue_scripts', 'enqueue_3d_model_scripts');

add_action('wpcf7_init', 'my_custom_form_tag');

function my_custom_form_tag()
{
    wpcf7_add_form_tag('3d_model_toggle', 'my_custom_form_tag_handler');
}

function my_custom_form_tag_handler($tag)
{
    $attributes = shortcode_atts(array(
        'label' => 'Open Modal',
    ), $tag->parameters);

    return '<input type="hidden" name="json_data" id="json_data" value="">
            <div id="modalOverlay" class="overlay"></div>
            <!-- Toggle switch for switching between male and female models -->
            <div class="container">
                <button id="openModalBtn" class="gender-button">' . esc_html($attributes['label']) . '</button>
                <div id="myModal" class="modal">
                    <div class="modal-content">
                        <div id="cursor" class="cursor"></div>
                        <div class="canvasContainer">
                            <canvas id="renderCanvas"></canvas>
                            <div id="popup" class="popup">
                                <div class="popup-content">
                                    <span id="popup-close" class="popup-close">&times;</span>
                                    <p id="popup-description"></p>
                                </div>
                                <div id="descriptionPopup" class="popup">
                                    <div class="popup-content">
                                        <span id="descriptionPopup-close" class="popup-close">&times;</span>
                                        <p>Enter Marker Description:</p>
                                        <input type="text" id="descriptionInput" placeholder="Enter description...">
                                        <button id="descriptionConfirm">Confirm</button>
                                    </div>
                                </div>
                            </div>
                            <span class="close-btn" onclick="closeModal()">
                                <svg width="45px" height="45px" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round"
                                        stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.624"></g>
                                    <g id="SVGRepo_iconCarrier">
                                        <g opacity="0.4">
                                            <path
                                                d="M9.16992 14.8299L14.8299 9.16992"
                                                stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"
                                                stroke-linejoin="round"></path>
                                            <path
                                                d="M14.8299 14.8299L9.16992 9.16992"
                                                stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"
                                                stroke-linejoin="round"></path>
                                        </g>
                                        <path
                                            d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                                            stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"
                                            stroke-linejoin="round"></path>
                                    </g>
                                </svg>
                            </span>
                        </div>
                        <div class="toolbar">
                            <div>
                                <label class="switch">
                                    <span class="sun">♀</span>
                                    <span class="moon">♂</span>
                                    <input type="checkbox" class="input" id="modelToggle">
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="button-container">
                                <span class="marker-size-label">Markergröße</span>
                                <div class="range">
                                    <div class="sliderValue">
                                        <span>100</span>
                                    </div>
                                    <div class="field">
                                        <div class="value left">
                                            1
                                        </div>
                                        <input type="range" id="markerSizeSlider" min="1" max="15" step="0.1"
                                            value="1.5">
                                        <div class="value right">
                                            10
                                        </div>
                                    </div>
                                </div>
                                <button id="pointerButton">
                                    <i style="font-size: 17px;" class="fa fa-highlighter"></i>
                                    Markieren
                                </button>
                                <button id="resetButton">Alle Marker löschen</button>
                                <button id="saveButton">Speichern</button>
                            </div>
                        </div>
                    </div>
                    <div class="features-container" id="paintracker-features-container">
                    </div>
                </div>
            </div>';
}

// Reusable PainTracker widget for external integrations (e.g. Corpus Analytica 2nd Opinion)
// This allows embedding the same UI without requiring a CF7 form context.
if (!function_exists('paintracker_render_widget')) {
    function paintracker_render_widget($params = array())
    {
        // Build a minimal tag-like object compatible with the handler signature
        $tag = (object) [
            'parameters' => $params,
        ];

        return my_custom_form_tag_handler($tag);
    }
}

// Shortcode to embed PainTracker on any page/post via [wp-paintracker]
add_shortcode('wp-paintracker', function ($atts) {
    $atts = shortcode_atts(array(
        'label' => 'Open PainTracker',
    ), $atts, 'wp-paintracker');

    if (function_exists('paintracker_render_widget')) {
        return paintracker_render_widget($atts);
    }

    return '';
});
?>