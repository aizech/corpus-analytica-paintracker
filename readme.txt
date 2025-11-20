=== Corpus Analytica – PainTracker ===
Contributors: corpusanalytica
Tags: pain, 3d, medical, visualization, tracking, health
Requires at least: 6.0
Tested up to: 6.6
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Interactive 3D pain mapping tool that lets patients mark pain areas on a male/female body model and saves the data as JSON for further processing.

== Description ==

Corpus Analytica – PainTracker is an interactive 3D pain mapping plugin.

It allows patients to visually mark pain areas on a male or female 3D body model.
Each marker includes a description and size, and all markers are stored as JSON
so they can be processed by other systems (for example, the Corpus Analytica
"Second Opinion" workflow plugin).

**Main features:**

- 3D model (male/female) rendered with Babylon.js
- Custom marker cursor with adjustable marker size
- List of all placed markers with per-marker delete actions
- Global reset button to remove all markers
- Saves marker data as JSON in a hidden form field
- Shortcode `[wp-paintracker]` to embed the tool anywhere
- Optional integration point for external plugins via `paintracker_render_widget()`

== Installation ==

1. Upload the `wp-paintracker` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the *Plugins* screen in WordPress.
3. (Optional) If you are using Contact Form 7, you can use the custom form tag
   registered by the plugin (`3d_model_toggle`).
4. To embed the PainTracker anywhere, add the shortcode to a page or post:

   `[wp-paintracker]`

== Usage ==

=== Shortcode ===

Basic usage:

`[wp-paintracker]`

With a custom button label:

`[wp-paintracker label="Schmerzbereiche markieren"]`

When the user clicks the button, a modal opens with the 3D model and tools to
place markers on the body. When the user clicks **Speichern**, the plugin
serializes all marker data as JSON into a hidden input field (`json_data`).

You can then read that JSON on form submission and store it (for example in a
file or as post meta).

=== Integration helper ===

For developers, the function `paintracker_render_widget( array $params = [] )`
can be used to embed the PainTracker widget from PHP. It accepts the same
parameters as the shortcode (e.g. `label`).

Example:

`echo paintracker_render_widget( [ 'label' => 'Schmerzbereiche markieren' ] );`

== Frequently Asked Questions ==

= Where is the data stored? =

The PainTracker writes all markers into a hidden input field named
`json_data` (or an integration-specific field). How and where the data is
persisted is up to the integrating form or plugin. For example, the
"Corpus Analytica – Second Opinion" plugin writes the JSON file into the
patient upload folder as `paintracker.json`.

= Does this plugin send any data to external services? =

No. All processing happens in the browser and on your WordPress site.
The only external resources loaded are the Babylon.js CDN scripts used
for rendering the 3D model.

= Do I need Contact Form 7? =

No. PainTracker provides a shortcode that works without CF7. There is an
optional CF7 form tag handler (`3d_model_toggle`) for legacy or advanced use
cases.

== Screenshots ==

1. PainTracker modal with 3D body model and toolbar
2. Marker list with delete buttons

== Changelog ==

= 1.0.0 =
* Initial public release of Corpus Analytica – PainTracker.
* 3D male/female models, marker placement, marker list, and JSON export.
