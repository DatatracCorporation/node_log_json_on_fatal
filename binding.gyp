{
	"targets" : [{
		"target_name" : "node_log_json_on_fatal_native",
		"sources" : [ "fatal_error.cc" ],
		"include_dirs": [
			'<!(node -e "require(\'nan\')")'
		],
		"win_delay_load_hook" : "false"
	}]
}
