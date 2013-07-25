////
//// A full take on a production live search for GOlr.
//// It ends up being a light wrapping around the search_pane widget.
//// 

//
function LiveSearchGOlrInit(){

    // Logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('LS: ' + str); }    

    // Start messages.
    ll('');
    ll('LiveSearchGOlr.js');
    ll('LiveSearchGOlrInit start...');

    // Aliases.
    var loop = bbop.core.each;

    // Make unnecessary things roll up.
    amigo.ui.rollup(["inf01"]);

    // Use jQuery UI to tooltip-ify doc.
    var tt_args = {'position': {'my': 'left bottom', 'at': 'right top'}};
    jQuery('.bbop-js-tooltip').tooltip(tt_args);

    ///
    /// A description of the active buttons and what to do when they
    /// are clicked. Very likely the only thing that you'd have to
    /// change on this page.
    ///

    function _establish_buttons(personality, manager){
	if( personality == 'bbop_ann' ){
	    manager.clear_buttons();
	    manager.add_button(facet_matrix_button);
	    manager.add_button(gaf_download_button);
	    //manager.add_button(gaf_galaxy_button);
	    manager.add_button(bookmark_button);
	}else if( personality == 'bbop_ont' ){
	    manager.clear_buttons();
	    manager.add_button(id_label_download_button);
	    //manager.add_button(id_term_label_galaxy_button);
	    manager.add_button(bookmark_button);
	}else if( personality == 'bbop_bio' ){
	    manager.clear_buttons();
	    manager.add_button(id_download_button);
	    //manager.add_button(id_symbol_galaxy_button);
	    manager.add_button(bookmark_button);
	//}else if( personality == 'bbop_ann_ev_agg' ){
	}else{
	    manager.clear_buttons();
	}
    }

    var active_classes = [
	{
	    id: 'bbop_ann', 
	    on_click: function(manager){
		manager.add_query_filter('document_category',
					 'annotation', ['*']);
		_establish_buttons('bbop_ann', manager);
	    }
	},
	{
	    id: 'bbop_ont',
	    on_click: function(manager){
    		manager.add_query_filter('document_category',
					 'ontology_class', ['*']);
		_establish_buttons('bbop_ont', manager);
	    }
	},
	{
	    id: 'bbop_bio',
	    on_click: function(manager){
    		manager.add_query_filter('document_category',
					 'bioentity', ['*']);
		_establish_buttons('bbop_bio', manager);
	    }
	},
	{
	    id: 'bbop_family',
	    on_click: function(manager){
    		manager.add_query_filter('document_category',
					 'family', ['*']);
		_establish_buttons('bbop_family', manager);
	    }
	},
	{
	    id: 'bbop_general',
	    on_click: function(manager){
    		manager.add_query_filter('document_category',
					 'general', ['*']);
		_establish_buttons('bbop_general', manager);
	    }
	},
	{
	    id: 'bbop_ann_ev_agg',
	    on_click: function(manager){
    		manager.add_query_filter('document_category',
    					 'annotation_evidence_aggregate',['*']);
		_establish_buttons('bbop_ann_ev_agg', manager);
	    }
	}
    ];

    // Helper function to pull out class by id.
    function _get_active_class(cid){
	var retcls = null;
	loop(active_classes,
	     function(acls, index){
		 //ll("index: " + index);		 
		 //ll("acls['id']: " + acls['id']);		 
		 if( acls['id'] == cid ){
		     retcls = acls;
		 }
	     });
	return retcls;
    }

    ///
    /// Tabify the layout if we can (may be in a non-tabby version).
    ///

    // var dtabs = jQuery("#display-tabs");
    // if( dtabs ){
    // 	ll('Apply tabs...');
    // 	jQuery("#display-tabs").tabs();
    // 	//dtabs.tabs();
    // 	jQuery("#display-tabs").tabs('select', 0);
    // }

    ///
    /// Ready the configuration that we'll use.
    ///

    var gconf = new bbop.golr.conf(amigo.data.golr);
    var sd = new amigo.data.server();
    var linker = new amigo.linker();
    var solr_server = sd.golr_base();
    var div_id = 'display-general-search';

    ///
    /// Defined some useful buttons.
    ///

    // Download limit.    
    //var dlimit = 7500;
    var dlimit = 100000;

    // Global download properties.
    var _dl_props = {
	'entity_list': null,
	'rows': dlimit
    };

    // Define the rows that we'll use to create a psuedo-GAF.
    var _gaf_fl = [
	'source', // c1
	'bioentity_internal_id', // c2; not bioentity
	'bioentity_label', // c3
	'qualifier', // c4
	'annotation_class', // c5
	'reference', // c6
	'evidence_type', // c7
	'evidence_with', // c8
	'aspect', // c9
	'bioentity_name', // c10
	'synonym', // c11
	'type', // c12
	'taxon', // c13
	'date', // c14
	'assigned_by', // c15
	'annotation_extension_class', // c16
	'bioentity_isoform' // c17
    ];

    // Create button templates to use from our library.
    var btmpl = bbop.widget.display.button_templates;

    var id_download_button =
	btmpl.field_download('Download IDs (up to ' +
			     dlimit + ')',
			     dlimit, ['id']);
    var id_label_download_button =
	btmpl.field_download('Download IDs and labels (up to ' +
			     dlimit + ')',
			     dlimit, ['annotation_class',
				      'annotation_class_label']);
    var gaf_download_button =
	btmpl.field_download('GAF chunk download (up to ' +
			     dlimit + ')',
			     dlimit, _gaf_fl);
    var bookmark_button = btmpl.bookmark(linker);
    var facet_matrix_button = btmpl.open_facet_matrix(gconf, sd);
    var gaf_galaxy_button =
	btmpl.send_fields_to_galaxy('Send GAF chunk to Galaxy (up to ' +
				    dlimit + ')',
				    dlimit, _gaf_fl, global_galaxy_url);
    var id_term_label_galaxy_button =
	btmpl.send_fields_to_galaxy('Send IDs and names to Galaxy (up to ' +
				    dlimit + ')',
				    dlimit, ['annotation_class',
					   'annotation_class_label'],
				    global_galaxy_url);
    var id_symbol_galaxy_button =
	btmpl.send_fields_to_galaxy('Send IDs and symbols to Galaxy ' +
				    '(up to ' + dlimit + ')',
				    dlimit,['bioentity', 'bioentity_label'],
				    global_galaxy_url);

    ///
    /// Ready widget.
    ///

    var handler = new amigo.handler();
    var hargs = {
	'linker': linker,
	'handler': handler,
	'base_icon_url' : null,
    	'image_type' : 'gif',
    	'layout_type' : 'two-column',
    	'show_global_reset_p' : true,
    	'show_searchbox_p' : true,
    	'show_filterbox_p' : true,
    	'show_pager_p' : true,
    	'show_checkboxes_p' : true,
    	//'show_checkboxes_p' : false,
    	//'spinner_search_source' : '',
    	'spinner_search_source' : sd.image_base() + '/waiting_ajax.gif',
    	//'spinner_shield_source' : sd.image_base() + '/waiting_poll.gif'
    	'spinner_shield_source' : sd.image_base() + '/waiting_ajax.gif'
	//
    	//'icon_clear_label' : _button_wrapper('X', 'Clear text from query'),
    	//'icon_clear_source' : 'http://amigo2.berkeleybop.org/amigo2/images/warning.png',
    	//'icon_reset_label' : '&nbsp;<b>[reset all user filters]</b>',
    	//'icon_remove_label' : _button_wrapper('X', 'Remove filter from query'),
    	//'icon_remove_source' : 'http://amigo2.berkeleybop.org/amigo2/images/warning.png',
    	//'icon_positive_label' : _button_wrapper('+', 'Add positive filter'),
    	//'icon_positive_source' : 'http://amigo2.berkeleybop.org/amigo2/images/warning.png',
    	//'icon_negative_label' : _button_wrapper('-', 'Add negative filter')
    	//'icon_negative_source' : 'http://amigo2.berkeleybop.org/amigo2/images/warning.png'
    };
    var search = new bbop.widget.search_pane(solr_server, gconf, div_id, hargs);
    // We like highlights; they should be included automatically
    // through the widget.
    search.include_highlighting(true);
    
    // NOTE: We leave the rest of the configuration to the triggered
    // button click below.

    ///
    /// Enable search class switching.
    /// 

    // Process to switch the search into a different type.
    function _on_search_select(string_or_event){

	// Recover the 'id' of the clicked element if we didn't
	// already define it as a string argument. If it's not a
	// string argument, it's probably an event.
	var cid = string_or_event; // string
	if( bbop.core.what_is(string_or_event) != 'string' ){ // event
    	    cid = jQuery(this).attr('id');	    
    	    //cid = jQuery(this).val();
	}

    	// Make sure whatever document_category sticky filters we had
    	// are completely gone.
	loop(search.get_sticky_query_filters(),
	     function(sqf_pair){
		 var sqf_filter = sqf_pair['filter'];
		 var sqf_value = sqf_pair['value'];
		 if( sqf_filter && sqf_filter == 'document_category' ){
    		     search.remove_query_filter('document_category',
						sqf_value, ['*']);
		 }
	     });

	// Find the click class in the set of active classes.
	var active_class = _get_active_class(cid);

	// If we found it, set personality, run the stored function,
	// and then establish/reset display.
	if( ! active_class ){
	    alert('ERROR: Could not find class: ' + cid);
	}else{
    	    search.set_personality(cid);
	    search.lite(true);
	    var run_fun = active_class['on_click'];
	    run_fun(search);
    	    search.establish_display();
	    search.reset();
	}
    }

    // Turn the radio row into a jQuery button set and make them
    // active to clicks.
    jQuery("#search_radio").buttonset();
    loop(active_classes,
    	 function(active_class){
	     var cclass_id = active_class['id'];
    	     var c = '#' + cclass_id;
    	     jQuery(c).click(_on_search_select);
    	 });


    // First, define a helper function to try and probe various things
    // to establish what should be established--find the checked radio
    // button (from the layout) and click it, or, failing that, the
    // first one and click it.
    function _establish_default_interface(){

	// // Check to see if we have an incoming query (likely the
	// // landing page).
	// var qfield_text = null;
	// if( global_live_search_query ){ // has incoming query
	//     qfield_text = global_live_search_query;
    	//     ll("Try and use incoming query: " + qfield_text);
    	//     // search.set_query_field_text(global_live_search_query);
    	//     // search.set_comfy_query(global_live_search_query);
    	//     // search.search();
	// }

	// Work the radio.
	var checked_radio_vals = [];
	var checked_elt = null;
	jQuery("[name='" + 'search_radio' + "']:checked").each(
	    function(){
		checked_elt = jQuery(this);
		checked_radio_vals.push(checked_elt.val());
	    });
	
	if( checked_radio_vals && checked_radio_vals.length == 1 ){
	    // Find the checked radio value and click on it.
	    var clid = checked_radio_vals[0];
	    var cls = _get_active_class(clid);
	    ll("Select the checked radio value: " + cls['id']);
	    //jQuery(checked_elt).click();
	    //jQuery('#' + cls['id']).click();
	    _on_search_select(cls['id']);
	}else{
	    // Click the first defined class.
	    ll("Just select the first: " + active_classes[0]['id']);
	    //jQuery('#' + active_classes[0]['id']).click();
	    _on_search_select(active_classes[0]['id']);
	}
    }

    // Check to see if we have an incoming query (likely the landing page).
    // If we do, work with tricking the reset and initial run
    // mechanisms to make it look like we're catching the incoming
    // parameter and setting the environment.
    if( global_live_search_query ){ // has incoming query
    	ll("Try and use incoming query (set default): " +
	   global_live_search_query);
    	//search.set_comfy_query(global_live_search_query);
	var def_comfy = search.set_comfy_query(global_live_search_query);
    	search.set_default_query(def_comfy);

	// Things to do after the initial reset is complete.
	function _first_runner(response, manager){
	    // Ignoring the args--we'll just use the "local" names for
	    // clarity.

	    // Unstick the default query and add the text to the search.
	    if( global_live_search_query ){ // has incoming query
    		ll("Initial reset: try set the env to the proper settings...");
		search.reset_default_query();
    		search.set_query_field_text(global_live_search_query);
    		search.set_comfy_query(global_live_search_query);
	    }
	}
	search.set_initial_reset_callback(_first_runner);
    }

    // Establish the display (and run a reset) depending on bookmark.
    // Check to see if we have a bookmark or not. If we have one, run
    // it, otherwise use the default. This also establishes the
    // display at this level.
    if( global_live_search_bookmark ){ // has bookmark
	ll("Try and use bookmark in establishment.");

	// Load it and see what happens.
	var parm_list = 
	    bbop.core.url_parameters(global_live_search_bookmark);
	//alert(bbop.core.dump(parm_list));
	var bookmark_probe = bbop.core.hashify(parm_list);
	//alert(bbop.core.dump(bookmark_probe));

	if( ! bookmark_probe['personality'] || // bookmark is bad
	    bookmark_probe['json.nl'] != 'arrarr' ||
	    bookmark_probe['wt'] != 'json' ){ //||
	    //! bookmark_probe['document_category'] ){

            ll("Bookmark lacks sanity.");
	    alert('ERROR: Bookmark did not include a personality, and sanity. '+
		  'Please remove the bookmark parameter from the URL.');
	    // Fall back onto the defaults.
	    _establish_default_interface();
	}else{ // probably good bookmark
	    //ll("Bookmark has a personality: " + search.get_personality());

	    // Load bookmark.
	    //ll("Pre bookmark: " + search.get_query_url());
	    //ll(global_live_search_bookmark);
	    //ll("Pre-bookmark personality: " + search.get_personality());
	    search.load_url(global_live_search_bookmark);
	    ll("Post-bookmark personality: " + search.get_personality());
	    ll("Post bookmark: " + search.get_query_url());

	    // Establish the display with what we have.
    	    search.establish_display();
	    search.search();
	    //ll("Post establish: " + search.get_query_url());

	    // Make sure the text query is there and proper.
	    // Remember, we don't refresh it off of search like the others
	    // because it needs persistance for the UI.
	    //ll("Post query: " + search.get_query());
	    //ll("Post default query: " + search.get_default_query());
	    if( search.get_query() == search.get_default_query() ){
		// The default is the same as nothing at all.
		search.set_query_field_text('');
	    }else{
		search.set_query_field_text(search.get_query());
	    }
	    
	    // While we're here, make sure that the appropriate
	    // buttons appear as well.
	    _establish_buttons(search.get_personality(), search);
	}

	// Destroy the bookmark so we don't keep hitting it.
	global_live_search_bookmark = null;

    }else{ // no bookmark
	ll("No bookmark in establishment.");
	_establish_default_interface();
    } 

    // A little handling if we came in on a personality dispatch.
    if( global_live_search_personality &&
	global_live_search_personality != ''){
	ll("Detected dispatch argument: " + global_live_search_personality);
	_on_search_select(global_live_search_personality);
    }

    // Done message.
    ll('LiveSearchGOlrInit done.');

    // DEBUGGING: A temporary external hook to help with dev and
    // debugging.
    s = search;
}
var s;
