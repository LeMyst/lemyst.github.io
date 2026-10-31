---
layout: compress
permalink: '/:path/swconf.js'
# Note that this file will be fetched by the ServiceWorker, so it will not be cached.
---

{%- comment -%}
  Local override of the theme's `assets/js/data/swconf.js` (jekyll-theme-chirpy 7.6.0).
  The `swconf` object below is the upstream file, unchanged: re-sync it when upgrading Chirpy.

  Addition: an allow-list for the service worker. Its scope is the whole lemyst.github.io
  origin, which also hosts the GitHub Pages sites of other repositories (/<repo>/). The fetch
  listener at the bottom is registered before the theme's own one (sw.min.js imports this file
  first), and stops any same-origin request whose first path segment is not produced by this
  site, so the browser handles it natively and it is never cached. The list of segments is
  computed at build time from this site's pages, documents and static files.

  This file goes through the `compress` layout, which joins all lines: no `//` comments, and
  every statement must end with a semicolon.
{%- endcomment -%}

const swconf = {
  {% if site.pwa.cache.enabled %}
    cacheName: 'chirpy-{{ "now" | date: "%s" }}',

    {%- comment -%} Resources added to the cache during PWA installation. {%- endcomment -%}
    resources: [
      '{{ "/assets/css/:THEME.css" | replace: ':THEME', site.theme | relative_url }}',
      '{{ "/" | relative_url }}',
      {% for tab in site.tabs %}
        '{{- tab.url | relative_url -}}',
      {% endfor %}

      {% assign cache_list = site.static_files | where: 'swcache', true %}
      {% for file in cache_list %}
        '{{ file.path | relative_url }}'{%- unless forloop.last -%},{%- endunless -%}
      {% endfor %}
    ],

    interceptor: {
      {%- comment -%} URLs containing the following paths will not be cached. {%- endcomment -%}
      paths: [
        {% for path in site.pwa.cache.deny_paths %}
          {% unless path == empty %}
            '{{ path | relative_url }}'{%- unless forloop.last -%},{%- endunless -%}
          {% endunless  %}
        {% endfor %}
      ],

      {%- comment -%} URLs containing the following prefixes will not be cached. {%- endcomment -%}
      urlPrefixes: [
        {% if site.analytics.goatcounter.id != nil and site.pageviews.provider == 'goatcounter' %}
          'https://{{ site.analytics.goatcounter.id }}.goatcounter.com/counter/'
        {% endif %}
      ]
    },

    purge: false
  {% else %}
    purge: true
  {% endif %}
};

{%- assign sw_page_urls = site.pages | map: 'url' -%}
{%- assign sw_doc_urls = site.documents | map: 'url' -%}
{%- assign sw_file_urls = site.static_files | map: 'path' -%}
{%- assign sw_urls = sw_page_urls | concat: sw_doc_urls | concat: sw_file_urls -%}
{%- assign sw_roots = '' | split: '' -%}
{%- for sw_url in sw_urls -%}
  {%- assign sw_parts = sw_url | split: '/' -%}
  {%- if sw_parts.size > 1 -%}
    {%- assign sw_roots = sw_roots | push: sw_parts[1] -%}
  {%- endif -%}
{%- endfor -%}
{%- assign sw_roots = sw_roots | uniq | sort %}

(function () {
  var allowedRoots = {{ sw_roots | jsonify }};

  self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);

    if (url.origin !== self.location.origin) {
      return;
    }

    var root = url.pathname.split('/')[1];
    var bareRoot = root.replace(/\.[a-z0-9]+$/i, '');

    if (root === '' || allowedRoots.indexOf(root) !== -1 || allowedRoots.indexOf(bareRoot) !== -1) {
      return;
    }

    event.stopImmediatePropagation();
  });
})();
