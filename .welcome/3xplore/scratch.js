const deps = [
	'../shared.styl'
];

async function dataWrangling(){
	/*
	all items from data 2 should be updated with info from data 1

	can this be made easier/quicker to write?

	*/

	// data 1
	{
	var parameters = `
		{ "name": "acct_status", "type": "char(1)" },
		{ "name": "advanced_query", "type": "char(1)" },
		{ "name": "attp_status_code", "type": "char(1)" },
		{ "name": "bill_to_company_list", "type": "varchar(100)", "value": company_list },
		{ "name": "bol_nbr", "type": "varchar(20)" },
		{ "name": "bol_ticket_nbr", "type": "varchar(20)" },
		{ "name": "bookout_date", "type": "varchar(25)" },
		{ "name": "bookout_status", "type": "char(1)" },
		{ "name": "broker", "type": "char(12)" },
		{ "name": "broker_trade_id", "type": "char(24)" },
		{ "name": "bulletin_terminal_id", "type": "int" },
		{ "name": "carrier_conf_status", "type": "varchar(100)" },
		{ "name": "carrier_entity_id", "type": "varchar(4)" },
		{ "name": "carrier_facility_id", "type": "varchar(5)" },
		{ "name": "carrier_list", "type": "varchar(100)", "value": carrier_list },
		{ "name": "company_list", "type": "varchar(100)" },
		{ "name": "container_details", "type": "VARCHAR(256)" },
		{ "name": "container_list", "type": "VARCHAR(100)" },
		{ "name": "contract_list", "type": "VARCHAR(100)" },
		{ "name": "counter_party", "type": "varchar(3)" },
		{ "name": "counter_party_trade_id", "type": "char(24)" },
		{ "name": "coverage", "type": "varchar(64)" },
		{ "name": "created_date_criteria", "type": "varchar(50)" },
		{ "name": "cust_pl_sys", "type": "VARCHAR(3)" },
		{ "name": "cust_point", "type": "varchar(20)" },
		{ "name": "customer_list", "type": "varchar(100)" },
		{ "name": "customer_reference", "type": "VARCHAR(16)" },
		{ "name": "cycle_list", "type": "varchar(256)", "value": cycle_list },
		{ "name": "date_criteria_day_type", "type": "char(1)" },
		{ "name": "destination_list", "type": "varchar(100)" },
		{ "name": "display_coverages", "type": "char(1)" },
		{ "name": "display_cycle", "type": "char(1)" },
		{ "name": "display_external_batch_id", "type": "char(1)", "value": "NULL" },
		{ "name": "display_legacy_batch_code", "type": "char(1)" },
		{ "name": "display_nom_vol", "type": "char(1)" },
		{ "name": "display_origin_loc", "type": "char(1)" },
		{ "name": "display_receipt_date", "type": "char(1)" },
		{ "name": "display_remarks", "type": "char(1)" },
		{ "name": "display_shipper_batch_id", "type": "char(1)" },
		{ "name": "display_stop_date", "type": "char(1)" },
		{ "name": "driver_list", "type": "varchar(100)" },
		{ "name": "email_address_list", "type": "varchar(255)" },
		{ "name": "employed_by_company_list", "type": "varchar(100)" },
		{ "name": "event_date_criteria", "type": "varchar(50)" },
		{ "name": "event_type_list", "type": "varchar(100)" },
		{ "name": "expire_date_criteria", "type": "varchar(25)" },
		{ "name": "flex_location_list", "type": "varchar(100)", "value": flex_location_list },
		{ "name": "flow_date_criteria", "type": "varchar(25)" },
		{ "name": "fname_list", "type": "varchar(100)" },
		{ "name": "from_shipper_conf_status", "type": "char(1)" },
		{ "name": "gauge_type_list", "type": "varchar(100)", "value": gauge_type_list },
		{ "name": "group_by", "type": "VARCHAR(100)" },
		{ "name": "hour", "type": "numeric(2,0)" },
		{ "name": "id_list", "type": "varchar(100)" },
		{ "name": "include_confirmed", "type": "char(1)" },
		{ "name": "include_connected_fac", "type": "VARCHAR(1)" },
		{ "name": "include_proving", "type": "char(1)", "value": include_proving },
		{ "name": "include_on_allocation", "type": "char(1)" },
		{ "name": "include_voided", "type": "char(1)" },
		{ "name": "inspector_list", "type": "varchar(100)" },
		{ "name": "invoice_date_criteria", "type": "varchar(25)" },
		{ "name": "invoice_number", "type": "bigint" },
		{ "name": "invoice_type", "type": "char(3)" },
		{ "name": "involved_party_list", "type": "varchar(100)" },
		{ "name": "legacy_batch_code", "type": "varchar(100)", "value": legacy_batch_code },
		{ "name": "letter_number", "type": "varchar(9)" },
		{ "name": "line_segment_list", "type": "varchar(100)", "value": line_segment_list },
		{ "name": "lname_list", "type": "varchar(100)" },
		{ "name": "location_list", "type": "varchar(100)", "value": location_list },
		{ "name": "meter_id", "type": "varchar(64)", "value": meter_id },
		{ "name": "month", "type": "numeric(2,0)" },
		{ "name": "movement_type_list", "type": "varchar(100)" },
		{ "name": "operator_list", "type": "varchar(100)" },
		{ "name": "order_by", "type": "varchar(150)" },
		{ "name": "origin_list", "type": "varchar(100)" },
		{ "name": "padd_list", "type": "varchar(100)" },
		{ "name": "page_number", "type": "tinyint" },
		{ "name": "paper_ticket_num", "type": "varchar(25)", "value": paper_ticket_num },
		{ "name": "parcel_id", "type": "varchar(25)" },
		{ "name": "partner_entity_id", "type": "varchar(4)" },
		{ "name": "partner_facility_id", "type": "varchar(5)" },
		{ "name": "period_code", "type": "char(2)" },
		{ "name": "period_list", "type": "varchar(100)" },
		{ "name": "period_type", "type": "char(1)" },
		{ "name": "phone_list", "type": "varchar(100)" },
		{ "name": "process_date_criteria", "type": "varchar(50)", "value": T4DateAsSqlDate(process_date_criteria) },
		{ "name": "product_group", "type": "VARCHAR(8)", "value": product_group },
		{ "name": "product_list", "type": "varchar(100)", "value": product_list },
		{ "name": "pto_number", "type": "int" },
		{ "name": "pto_type_list", "type": "char(1)" },
		{ "name": "publisher_list", "type": "varchar(100)" },
		{ "name": "publisher_type_list", "type": "varchar(100)" },
		{ "name": "push_request_type", "type": "char(1)" },
		{ "name": "query_sec", "type": "decimal(6,3)" },
		{ "name": "rcpt_delvr", "type": "char(1)", "value": rcpt_delvr },
		{ "name": "rcvng_party_acct_abbr_list", "type": "varchar(100)" },
		{ "name": "rcvng_party_list", "type": "varchar(100)" },
		{ "name": "receipt_date_criteria", "type": "varchar(25)" },
		{ "name": "report_type", "type": "varchar(20)" },
		{ "name": "reversal_ind", "type": "VARCHAR(1)" },
		{ "name": "scd_list", "type": "varchar(256)", "value": scd_list },
		{ "name": "schedule_status_list", "type": "varchar(100)" },
		{ "name": "seq_number", "type": "varchar(10)" },
		{ "name": "sequence_list", "type": "varchar(100)", "value": sequence_list },
		{ "name": "session_id", "type": "varchar (50)", "value": session_id },
		{ "name": "shipper_acct_abbr_list", "type": "varchar(100)", "value": shipper_acct_abbr_list },
		{ "name": "shipper_batch_id", "type": "varchar(30)" },
		{ "name": "shipper_conf_status", "type": "VARCHAR(100)" },
		{ "name": "shipper_list", "type": "varchar(100)", "value": shipper_list },
		{ "name": "shipper_trade_id", "type": "varchar(24)" },
		{ "name": "show_all", "type": "char(1)" },
		{ "name": "show_maint_noms", "type": "CHAR (1)" },
		{ "name": "show_my_noms", "type": "char(1)" },
		{ "name": "sis_nom_type_list", "type": "varchar(100)", "value": sis_nom_type_list },
		{ "name": "sis_page_key", "type": "varchar(20)", "value": sis_menu_key },
		{ "name": "sis_page_return_type_id", "type": "int", "value": sis_page_return_type_id },
		{ "name": "sis_product_type_list", "type": "varchar(100)", "value": sis_product_type_list },
		{ "name": "sis_pto_id_list", "type": "varchar(100)" },
		{ "name": "stop_date_criteria", "type": "varchar(50)", "value": T4DateAsSqlDate(stop_date_criteria) },
		{ "name": "sup_con_conf_status", "type": "varchar(100)" },
		{ "name": "sup_con_list", "type": "varchar(100)", "value": sup_con_list },
		{ "name": "system_name", "type": "varchar(64)" },
		{ "name": "tank_number", "type": "varchar(15)" },
		{ "name": "tank_product", "type": "varchar(20)" },
		{ "name": "tanker_conf_status", "type": "varchar(100)" },
		{ "name": "tanker_list", "type": "varchar(100)", "value": tanker_list },
		{ "name": "terminal_list", "type": "varchar(100)" },
		{ "name": "ticket_number", "type": "varchar(18)", "value": ticket_number },
		{ "name": "tkcar_nbr", "type": "varchar(12)", "value": tkcar_nbr },
		{ "name": "tms_bol_type_list", "type": "varchar(100)" },
		{ "name": "tms_carrier_list", "type": "varchar(100)" },
		{ "name": "tms_product_type_list", "type": "varchar(100)" },
		{ "name": "to_shipper_conf_status", "type": "char(1)" },
		{ "name": "to_shipper_list", "type": "varchar(100)", "value": to_shipper_list },
		{ "name": "touched_date_criteria", "type": "varchar(50)", "value": T4DateAsSqlDate(touched_date_criteria) },
		{ "name": "trade_date_criteria", "type": "varchar(25)" },
		{ "name": "trade_status", "type": "char(1)" },
		{ "name": "trade_type", "type": "varchar(8)" },
		{ "name": "tran_type", "type": "char(1)" },
		{ "name": "transport_type_list", "type": "varchar(100)" },
		{ "name": "ulsd_product_type_list", "type": "varchar(100)" },
		{ "name": "units_of_measure", "type": "VARCHAR(5)" },
		{ "name": "user_code", "type": "varchar (20)", "value": user },
		{ "name": "user_code_list", "type": "varchar(100)" },
		{ "name": "user_type_list", "type": "varchar(100)" },
		{ "name": "version", "type": "decimal(6,3)" },
		{ "name": "volume", "type": "int" },
		{ "name": "year", "type": "numeric(4,0)" },
	`;
	}

	// data 2
	{
	var parametersPush = `
		{ "name": "user_push_request_id" },
		{ "name": "sis_menu_page_id" },
		{ "name": "sf_id" },
		{ "name": "user_code" },
		{ "name": "session_id" },
		{ "name": "show_all" },
		{ "name": "advanced_query" },
		{ "name": "push_request_type" },
		{ "name": "requested_on" },
		{ "name": "sis_page_return_type_id" },
		{ "name": "telecomm_address" },
		{ "name": "telecomm_type" },
		{ "name": "pushed" },
		{ "name": "pushed_date" },
		{ "name": "carrier_list" },
		{ "name": "shipper_list" },
		{ "name": "product_list" },
		{ "name": "cycle_list" },
		{ "name": "sequence_list" },
		{ "name": "scd_list" },
		{ "name": "location_list" },
		{ "name": "sis_product_type_list" },
		{ "name": "line_segment_list" },
		{ "name": "sup_con_list" },
		{ "name": "tanker_list" },
		{ "name": "gauge_type_list" },
		{ "name": "company_list" },
		{ "name": "event_type_list" },
		{ "name": "id_list" },
		{ "name": "movement_type_list" },
		{ "name": "transport_type_list" },
		{ "name": "origin_list" },
		{ "name": "padd_list" },
		{ "name": "rcvng_party_list" },
		{ "name": "rcvng_party_acct_abbr_list" },
		{ "name": "shipper_acct_abbr_list" },
		{ "name": "schedule_status_list" },
		{ "name": "attp_status_code" },
		{ "name": "carrier_conf_status" },
		{ "name": "sup_con_conf_status" },
		{ "name": "tanker_conf_status" },
		{ "name": "carrier_entity_id" },
		{ "name": "carrier_facility_id" },
		{ "name": "partner_entity_id" },
		{ "name": "partner_facility_id" },
		{ "name": "shipper_batch_id" },
		{ "name": "paper_ticket_num" },
		{ "name": "ticket_number" },
		{ "name": "letter_number" },
		{ "name": "invoice_number" },
		{ "name": "seq_number" },
		{ "name": "tank_number" },
		{ "name": "event_date_criteria" },
		{ "name": "touched_date_criteria" },
		{ "name": "created_date_criteria" },
		{ "name": "stop_date_criteria" },
		{ "name": "receipt_date_criteria" },
		{ "name": "hour" },
		{ "name": "month" },
		{ "name": "year" },
		{ "name": "period_code" },
		{ "name": "display_cycle" },
		{ "name": "display_coverages" },
		{ "name": "display_external_batch_id" },
		{ "name": "display_nom_vol" },
		{ "name": "display_origin_loc" },
		{ "name": "display_remarks" },
		{ "name": "display_shipper_batch_id" },
		{ "name": "display_stop_date" },
		{ "name": "display_legacy_batch_code" },
		{ "name": "display_receipt_date" },
		{ "name": "show_my_noms" },
		{ "name": "include_confirmed" },
		{ "name": "include_on_allocation" },
		{ "name": "include_voided" },
		{ "name": "rcpt_delvr" },
		{ "name": "tran_type" },
		{ "name": "coverage" },
		{ "name": "cust_point" },
		{ "name": "tank_product" },
		{ "name": "report_type" },
		{ "name": "system_name" },
		{ "name": "order_by" },
		{ "name": "tkcar_nbr" },
		{ "name": "ulsd_product_type_list" },
		{ "name": "to_shipper_list" },
		{ "name": "bill_to_company_list" },
		{ "name": "flow_date_criteria" },
		{ "name": "process_date_criteria" },
		{ "name": "invoice_date_criteria" },
		{ "name": "invoice_type" },
		{ "name": "email_send_type" },
		{ "name": "attach_file_name" },
		{ "name": "pto_type_list" },
		{ "name": "from_shipper_conf_status" },
		{ "name": "to_shipper_conf_status" },
		{ "name": "pto_number" },
		{ "name": "driver_list" },
		{ "name": "destination_list" },
		{ "name": "customer_list" },
		{ "name": "operator_list" },
		{ "name": "terminal_list" },
		{ "name": "BOL_nbr" },
		{ "name": "BOL_Ticket_nbr" },
		{ "name": "tms_carrier_list" },
		{ "name": "tms_product_type_list" },
		{ "name": "tms_bol_type_list" },
		{ "name": "user_push_def_id" },
		{ "name": "fax_msg_id" },
		{ "name": "fax_status" },
		{ "name": "fax_page_count" },
		{ "name": "billed_on" },
		{ "name": "billed" },
		{ "name": "employed_by_company_list" },
		{ "name": "user_type_list" },
		{ "name": "fname_list" },
		{ "name": "lname_list" },
		{ "name": "email_address_list" },
		{ "name": "phone_list" },
		{ "name": "expire_date_criteria" },
		{ "name": "acct_status" },
		{ "name": "version" },
		{ "name": "user_code_list" },
		{ "name": "publisher_type_list" },
		{ "name": "publisher_list" },
		{ "name": "bulletin_terminal_id" },
		{ "name": "shipper_trade_id" },
		{ "name": "counter_party_trade_id" },
		{ "name": "broker" },
		{ "name": "broker_trade_id" },
		{ "name": "counter_party" },
		{ "name": "trade_type" },
		{ "name": "trade_status" },
		{ "name": "bookout_status" },
		{ "name": "bookout_date" },
		{ "name": "volume" },
		{ "name": "period_list" },
		{ "name": "period_type" },
		{ "name": "trade_date_criteria" },
		{ "name": "involved_party_list" },
		{ "name": "parcel_id" },
		{ "name": "user_push_request_identity_id" },
		{ "name": "flex_location_list" },
		{ "name": "sis_nom_type_list" },
		{ "name": "inspector_list" },
		{ "name": "shipper_conf_status" },
		{ "name": "container_list" },
		{ "name": "container_details" },
		{ "name": "contract_list" },
		{ "name": "include_proving" },
		{ "name": "legacy_batch_code" },
		{ "name": "product_group" },
		{ "name": "cust_pl_sys" },
		{ "name": "units_of_measure" },
		{ "name": "include_connected_fac" },
		{ "name": "reversal_ind" },
		{ "name": "show_maint_noms" },
		{ "name": "customer_reference" },
		{ "name": "sis_pto_id_list" },
		{ "name": "meter_id" },
		{ "name": "schedule_view_type" },
		`;
	}

	const sort = (arr, prop) => {
		return arr.sort(function(a, b){
				if(prop){
					if(a[prop] < b[prop]) { return -1; }
					if(a[prop] > b[prop]) { return 1; }
					return 0;
				}
				if(a < b) { return -1; }
				if(a > b) { return 1; }
				return 0;
		})
	}

	const p = parameters.split("\n").filter(x=>!!x);
	const p2 = parametersPush.split("\n").filter(x=>!!x);

	const newP2 = [];
	const removeLastComma = str => str.substr(0, str.lastIndexOf(','))

	for(var i=0; i<p2.length; i++){
		const stringWithoutLastComma = removeLastComma(p2[i])
		if(!stringWithoutLastComma) continue;
		const pushP = JSON.parse(stringWithoutLastComma);
		const found = p.find(x => x.includes('{ "name": "' + pushP.name + '"'));
		if(found){
			newP2.push(removeLastComma(found).trim())
		} else {
			newP2.push(JSON.stringify(pushP, null, ' ').replace(/\n/g,''))
		}
	}
	await prism('javascript', sort(newP2).join(',\n'))
}

async function changeFileState(){
	const state = {
		openedFiles: {
			jimmy: { name: "jimmy", path: '', order: 2 },
			johnny: { name: "johnny", path: '', order: 1 },
			pammy: { name: "pammy", path: '', order: 8 },
			foo: { name: "fammy", path: '', order: 3 },
		}
	}

	function openFile({ name, path}){
		const order = state.openedFiles[name]
			? state.openedFiles[name].order
			: Math.max(...Object.entries(state.openedFiles).map(([k,v]) => v.order)) + 1;
		state.openedFiles[name] = {
			name, path, order
		};
	}

	function closeFile({ name}){
		state.openedFiles = Object.fromEntries(
			Object.entries(state.openedFiles)
				.map(([key,value]) => value)
				.filter(x => x.name !== name)
				.sort((a,b) => a.order - b.order)
				.map((x, i) => {
					return { ...x, ...{ order: i } };
				})
				.map(x => [x.name, x])
		);
	}

	function moveFile({ name, order}){
		state.openedFiles[name].order = order;
	}

	function getOpenedFiles(){
		return Object.entries(state.openedFiles)
				.map(([key,value]) => value)
				.sort((a,b) => a.order - b.order)
				.map((x, i) => {
					return { ...x, ...{ order: i } };
				});
	}

	openFile({ name: 'ted', path: '/wow'})
	await prism('javascript', JSON.stringify(getOpenedFiles(), null, 2) )
	closeFile({ name: 'pammy' })
	await prism('javascript', JSON.stringify(getOpenedFiles(), null, 2) )
	moveFile({ name: 'ted', order: Number.MAX_SAFE_INTEGER })
	await prism('javascript', JSON.stringify(getOpenedFiles(), null, 2) )

}

async function sortingFileNames(){
	const sortAlg = (propFn=(x=>x), alg='alpha') => {
		if(alg === 'alpha'){
			const lowSafe = (x='') => x.toLowerCase();
			return (a, b) => {
				const afilename = lowSafe(propFn(a)).split('.').slice(0,-1).join('.') || lowSafe(propFn(a));
				const bfilename = lowSafe(propFn(b)).split('.').slice(0,-1).join('.') || lowSafe(propFn(b));
				if(afilename < bfilename) { return -1; }
				if(afilename > bfilename) { return 1; }
				const aExt = lowSafe(propFn(a)).replace(afilename, '');
				const bExt = lowSafe(propFn(b)).replace(bfilename, '');
				if(aExt < bExt) { return -1; }
				if(aExt > bExt) { return 1; }
				return (a, b) => propFn(a) - propFn(b);
			}
		}
		console.log(`sort algorithm not found: ${alg}`)
	}

	const files = [{
		name: 'todo-actions.jsx'
	}, {
		name: 'todo.jsx'
	}, {
		name: 'todo-foo.jsx'
	}];
	const sorted = files.sort(sortAlg(x => x.name))
	await prism('javascript', JSON.stringify(sorted, null, 2) )
}

(async () => {
	await appendUrls(deps);

	//await dataWrangling();
	//await changeFileState();
	//await sortingFileNames();

})()
