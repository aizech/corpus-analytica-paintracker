# Corpus Analytica – PainTracker

Interactive 3D pain mapping tool for WordPress. PainTracker lets patients mark pain areas on a male/female 3D body model and stores the data as JSON for downstream processing (e.g. in the **Corpus Analytica – Second Opinion** workflow).

## Features

- 3D male/female body models rendered with Babylon.js
- Interactive cursor and adjustable marker size
- List of all markers with per-marker delete buttons
- Global reset button to remove all markers at once
- Saves all marker data as JSON into a hidden form field
- Shortcode `[`wp-paintracker`]` to embed the tool anywhere
- Reusable PHP helper `paintracker_render_widget()` for integrations

## Requirements

- WordPress 6.0 or higher
- PHP 8.0 or higher

## Installation

1. Clone or download this repository into your WordPress `wp-content/plugins/` directory as `wp-paintracker`.
2. In the WordPress admin, go to **Plugins → Installed Plugins** and activate **Corpus Analytica – PainTracker**.
3. Add the shortcode to a page or post to display the PainTracker button:

   ```text
   [wp-paintracker]
   ```

## Usage

### Shortcode

Basic usage:

```text
[wp-paintracker]
```

With a custom button label:

```text
[wp-paintracker label="Schmerzbereiche markieren"]
```

When the user clicks the button, a modal opens with the 3D model and toolbar. After placing markers and clicking **Speichern**, all marker data is serialized as JSON into a hidden input field (`json_data`).

It is the responsibility of the integrating form or plugin to read that JSON on submission and store it (e.g. as a file or post meta).

### PHP Integration Helper

From PHP you can embed the widget with the helper:

```php
echo paintracker_render_widget([
    'label' => 'Schmerzbereiche markieren',
]);
```

This is useful for deeper integrations, such as within the **Corpus Analytica – Second Opinion** plugin.

## Data Flow

- The user opens the PainTracker modal from a button.
- For each click on the 3D model, a marker is created (with size and description).
- The current marker set is kept in the browser and reflected in the UI list.
- When the user saves, the marker set is serialized into JSON and written to a hidden field (`json_data`).
- Your form handler can then store that JSON (for example as `paintracker.json` alongside other intake files).

## Screenshots

Screenshots used in this repository:

1. ![PainTracker modal with 3D body model and toolbar](paintracker_modal.png?w=300)
2. ![Marker list and markers placed on the 3D model](paintracker_modal_with_marker.png?w=300)

## Development Notes

- The 3D rendering is handled by **Babylon.js**, loaded from the public CDN.
- GLB models (male/female) are stored under `models/` and loaded dynamically based on a toggle.
- Core UI and Babylon integration live in `js/script.js`.
- Styling is in `css/style.css`, including the modal, toolbar, marker list, and cursor.
- The plugin also registers an optional Contact Form 7 form tag (`3d_model_toggle`) for legacy/advanced CF7 usage.

## License

This project is licensed under the **GPLv2 or later** license, the same as WordPress.

See `readme.txt` for the WordPress.org-style plugin readme.
