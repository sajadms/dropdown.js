/* globals jQuery, window, document */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {

  var methods = {
    options : {
      "optionClass": "",
      "dropdownClass": "",
      "autoinit": false,
      "callback": false,
      "onSelected": false,
      "destroy": function(element) {
        this.destroy(element);
      },
      "dynamicOptLabel": "Add a new option..."
    },
    init: function(options) {

      // Apply user options if user has defined some
      if (options) {
        options = $.extend(methods.options, options);
      } else {
        options = methods.options;
      }

      function initElement($select) {
        // Don't do anything if this is not a select or if this select was already initialized
        if ($select.data("dropdownjs") || !$select.is("select")) {
          return;
        }

        // Is it a multi select?
        var multi = $select.attr("multiple");

        // Does it allow to create new options dynamically?
        var dynamicOptions = $select.attr("data-dynamic-opts"),
            $dynamicInput = $();

        // Create the dropdown wrapper
        var $dropdown = $("<div></div>");
        $dropdown.addClass("dropdownjs").addClass(options.dropdownClass);
        $dropdown.data("select", $select);

        // Create the fake input used as "select" element and cache it as $input
        var $input = $("<input type=text readonly class=fakeinput>");
        if ($.material) { $input.data("mdproc", true); }
        // Append it to the dropdown wrapper
        $dropdown.append($input);

        // Create the UL that will be used as dropdown and cache it AS $ul
        var $ul = $("<ul></ul>");
        $ul.data("select", $select);

        // Append it to the dropdown
        $dropdown.append($ul);

        // Transfer the placeholder attribute
        $input.attr("placeholder", $select.attr("placeholder"));

        // Loop trough options and transfer them to the dropdown menu
        $select.find("option").each(function() {
          // Cache $(this)
          var $this = $(this);
          methods._addOption($ul, $this);

        });

        // If this select allows dynamic options add the widget
        if (dynamicOptions) {
          $dynamicInput = $("<li class=dropdownjs-add></li>");
          $dynamicInput.append("<input>");
          $dynamicInput.find("input").attr("placeholder", options.dynamicOptLabel);
          $ul.append($dynamicInput);
        }



        // Cache the dropdown options
        var selectOptions = $dropdown.find("li");

        // If is a single select, selected the first one or the last with selected attribute
        if (!multi) {
            var $selected;
            if ($select.find(":selected").length) {
                $selected = $select.find(":selected").last();
            }
            else {
                $selected = $select.find("option, li").first();
               // $selected = $select.find("option").first();
            }
            methods._select($dropdown, $selected);
        } else {
            var selectors = [], val = $select.val()
            for (var i in val) {
              selectors.push(val[i]);
            }
            if (selectors.length > 0) {
              var $target = $dropdown.find(function() { return $.inArray($(this).data("value"), selectors) !== -1; });
              $target.removeClass("selected");
              methods._select($dropdown, $target);
            }
        }

        // Transfer the classes of the select to the input dropdown
        $input.addClass($select[0].className);

        // Hide the old and ugly select
        $select.hide().attr("data-dropdownjs", true);

        // Bring to life our awesome dropdownjs
        $select.after($dropdown);

        // Call the callback
        if (options.callback) {
          options.callback($dropdown);
        }

        //---------------------------------------//
        // DROPDOWN EVENTS                       //
        //---------------------------------------//

        // On click, set the clicked one as selected
        $ul.on("click", "li:not(.dropdownjs-add)", function(e) {
          methods._select($dropdown, $(this));
          // trigger change event, if declared on the original selector
          $select.change();
        });
        $ul.on("keydown", "li:not(.dropdownjs-add)", function(e) {
          if (e.which === 27) {
            $(".dropdownjs > ul > li").attr("tabindex", -1);
            return $input.removeClass("focus").blur();
          }
          if (e.which === 32 && !$(e.target).is("input")) {
            methods._select($dropdown, $(this));
            return false;
          }
        });

        $ul.on("focus", "li:not(.dropdownjs-add)", function() {
          if ($select.is(":disabled")) {
            return;
          }
          $input.addClass("focus");
        });

        // Add new options when the widget is used
        if (dynamicOptions && dynamicOptions.length) {
          $dynamicInput.on("keydown", function(e) {
            if(e.which !== 13) return;
            var $option = $("<option>"),
                val = $dynamicInput.find("input").val();
            $dynamicInput.find("input").val("");

            $option.attr("value", val);
            $option.text(val);
            $select.append($option);

          });
        }

        // Listen for new added options and update dropdown if needed
        $select.on("DOMNodeInserted", function(e) {
          var $this = $(e.target);
          if (!$this.val().length) return;

          methods._addOption($ul, $this);
          $ul.find("li").not(".dropdownjs-add").attr("tabindex", 0);

        });

        $select.on("DOMNodeRemoved", function(e) {
          var deletedValue = $(e.target).attr('value');
          $ul.find("li").filter(function() { return $(this).data("value") === deletedValue; }).remove();
          var $selected;

          setTimeout(function () {
            if ($select.find(":selected").length) {
              $selected = $select.find(":selected").last();
            }
            else {
              $selected = $select.find("option, li").first();
            }
            methods._select($dropdown, $selected);
          }, 100);

        });

        // Update dropdown when using val, need to use .val("value").trigger("change");
        $select.on("change", function(e) {
          var $this = $(e.target);

          if (!multi) {
            var $selected;
            if ($select.find(":selected").length) {
              $selected = $select.find(":selected").last();
            }
            else {
              $selected = $select.find("option, li").first();
            }
            methods._select($dropdown, $selected);
          } else {
            var target = $select.find(":selected"),
                values = $(this).val();
            // Unselect all options
            selectOptions.removeClass("selected");
            // Select options
            target.each(function () {
                var selected = selectOptions.filter(function() { return $.inArray($(this).data("value"), values) !== -1; });
                selected.addClass("selected");
            });
          }
        });

        // Used to make the dropdown menu more dropdown-ish
        $input.on("click focus", function(e) {
          e.stopPropagation();
          if ($select.is(":disabled")) {
            return;
          }
          $(".dropdownjs > ul > li").attr("tabindex", -1);
          $(".dropdownjs > input.focus").not($(this)).removeClass("focus").blur();

          $(".dropdownjs > ul > li").not(".dropdownjs-add").attr("tabindex", 0);

          // Set height of the dropdown
          var coords = {
            top: $(this).offset().top - $(document).scrollTop(),
            left: $(this).offset().left - $(document).scrollLeft(),
            bottom: $(window).height() - ($(this).offset().top - $(document).scrollTop()),
            right: $(window).width() - ($(this).offset().left - $(document).scrollLeft())
          };

          var height = coords.bottom;

          // Decide if place the dropdown below or above the input
          if (height < 200 && coords.top > coords.bottom) {
            height = coords.top;
            $ul.attr("placement", $("body").hasClass("rtl") ? "top-right" : "top-left");
          } else {
            $ul.attr("placement", $("body").hasClass("rtl") ? "bottom-right" : "bottom-left");
          }

          $(this).next("ul").css("max-height", height - 20);
          $(this).addClass("focus");
        });
        // Close every dropdown on click outside
        $(document).on("click", function(e) {

          // Don't close the multi dropdown if user is clicking inside it
          if (multi && $(e.target).parents(".dropdownjs").length) return;

          // Don't close the dropdown if user is clicking inside the dynamic-opts widget
          if ($(e.target).parents(".dropdownjs-add").length || $(e.target).is(".dropdownjs-add")) return;

          // Close opened dropdowns
          $(".dropdownjs > ul > li").attr("tabindex", -1);
            if ($(e.target).hasClass('disabled')) {
              return;
        }
          $input.removeClass("focus");
        });
      }

      if (options.autoinit) {
        $(document).on("DOMNodeInserted", function(e) {
          var $this = $(e.target);
          if (!$this.is("select")) {
            $this = $this.find('select');
          }
            $this.each(function() {
                if ($(this).is(options.autoinit)) {
                    initElement($(this));
                }
            });
        });
      }

      // Loop trough elements
      $(this).each(function() {
        initElement($(this));
      });
    },
    select: function(target) {
      var $target = $(this).find(function() { return $(this).data("value") === target; });
      methods._select($(this), $target);
    },
    _select: function($dropdown, $target) {

      if ($target.is(".dropdownjs-add")) return;

      // Get dropdown's elements
      var $select = $dropdown.data("select"),
          $input  = $dropdown.find("input.fakeinput");
      // Is it a multi select?
      var multi = $select.attr("multiple");

      // Cache the dropdown options
      var selectOptions = $dropdown.find("li");

      // Behavior for multiple select
      if (multi) {
        // Toggle option state
        $target.toggleClass("selected");
        // Toggle selection of the clicked option in native select
        $target.each(function(){
          var value = $(this).prop("tagName") === "OPTION" ? $(this).val() : $(this).data("value"),
              $selected = $select.find("[value=\"" + value + "\"]");
          $selected.prop("selected", $(this).hasClass("selected"));
        });
        // Add or remove the value from the input
        var text = [];
        selectOptions.each(function() {
          if ($(this).hasClass("selected")) {
            text.push($(this).text());
          }
        });
        $input.val(text.join(", "));
      }

      // Behavior for single select
      if (!multi) {
        if ($target.hasClass("disabled")) {
          return;
        }
        // Unselect options except the one that will be selected
        if ($target.is("li")) {
            selectOptions.not($target).removeClass("selected");
        }
        // Select the selected option
        $target.addClass("selected");
        // Set the value to the input
        $input.val($target.text().trim());
        var value = $target.prop("tagName") === "OPTION" ? $target.val() : $target.data("value");
        // When val is set below on $select, it will fire change event,
        // which ends up back here, make sure to not end up in an infinite loop.
        // This is done last so text input is initialized on first load when condition is true.
        if (value === $select.val()) {
          return;
        }
        // Set the value to the native select
        $select.val(value);
      }

      // This is used only if Material Design for Bootstrap is selected
      if ($.material) {
        if ($input.val().trim()) {
          $select.removeClass("empty");
        } else {
          $select.addClass("empty");
        }
      }

      // Call the callback
      if (this.options.onSelected) {
        this.options.onSelected($target.data("value"));
      }

    },
    _addOption: function($ul, $this) {
      // Create the option
      var $option = $("<li></li>");

      // Style the option
      $option.addClass(this.options.optionClass);

      // If the option has some text then transfer it
      if ($this.text()) {
        $option.text($this.text());
      }
      // Otherwise set the empty label and set it as an empty option
      else {
        $option.html("&nbsp;");
      }
      // Set the value of the option
      $option.data("value", $this.val());

      // Will user be able to remove this option?
      if ($ul.data("select").attr("data-dynamic-opts")) {
        $option.append("<span class=close></span>");
        $option.find(".close").on("click", function() {
          $option.remove();
          $this.remove();
        });
      }

      // Ss it selected?
      if ($this.prop("selected")) {
        $option.attr("selected", true);
        $option.addClass("selected");
      }

      if ($this.prop("disabled")) {
        $option.addClass("disabled");
      }

      // Append option to our dropdown
      if ($ul.find(".dropdownjs-add").length) {
        $ul.find(".dropdownjs-add").before($option);
      } else {
        $ul.append($option);
      }
    },
    destroy: function($e) {
      $($e).show().removeAttr('data-dropdownjs').next('.dropdownjs').remove();
    }
  };

  $.fn.dropdown = function(params) {
    if( typeof methods[params] == 'function' ) methods[params](this);
    if (methods[params]) {
      return methods[params].apply(this, Array.prototype.slice.call(arguments,1));
    } else if (typeof params === "object" | !params) {
      return methods.init.apply(this, arguments);
    } else {
      $.error("Method " + params + " does not exists on jQuery.dropdown");
    }
  };

}));

