# Base Web Page

small collection of useful javascripts and stylesheets to display simple layouts (dark mode support), dynamic menu, interactive views like sideshows and diagrams with API calls in the background

**Installation**<br>
To use all functions of the collection, the scripts must be integrate in HTML.<br>
To use specific functions, for example only sideshow, at least bwp_general.js and bwp_layout.css must be integrate as well

> [!IMPORTANT]
> every javascript, excepted bwp_general.js, must be integrate with the **defer**-attribute, to run correctly f.e.<br>
>```
><script src="../js/bwp_menu.js" defer></script>
>```

A further development as one universal script is planned

## Layouts, Menus & Base Functions

### Layouts

three layout styles are supported yet:
- **Onepage Layout**: All elements are arranged one below the other
- **Sidebar Layout**: classic layout with narrow sidebar and compact heading (heading and menu together)
- **Compact Layout**: similar to Onepage with compact heading (heading and menu together)

> [!TIP]
> For a better idea, it is worth taking a look at the [examples/](examples/)

> [!NOTE]
> static and always shown elements like header and footer are also supported

### Menus

The menu is created dynamically at runtime by the browser, with the data provided as a JSON-encoded string in the HTML or retrieved via an API call. Highlighting the current page/entry is done via URL matching.

### Jumper 6 Co

By default, the layout script always generates a simple button that jumps back to the top of the page
If no CMS is integrated, a simple search field for the current page can be created using input.bwp-search-bar

Also a lightweight popup system for dialogs and detailed views is supported

> [!TIP]
> For more information, look at [examples/bwp_sidebar_layout.html](examples/bwp_sidebar_layout.html)

## Sideshow

An lightweight sideshow module for presenting diashows, documents and other webpages is integrated and supports external configuration by API call

> [!TIP]
> For more information, look at [examples/bwp_sideshow.html](examples/bwp_sideshow.html)

## Diagrams

An lightweight diagrams module for interactive presenting data at runtime is integrated and supports external queries by API call as well.

> [!TIP]
> Useful by creating small dashboards

## TODO

- [ ] add api-control-panel for diagrams to switch APIs at runtime
- [ ] and new diagram type to show basic numbers
- [ ] add helpful classes to suppport new container layouts, f.e. Image-Container
- [ ] integrate new function to display more details for images using the popup
