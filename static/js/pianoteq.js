async function rpc(method, params=[], id=0) {
  const payload = {
    method: method,
    params: params,
    jsonrpc: "2.0",
    id: id
  }

  const resp = await fetch("/jsonrpc", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const msg = `failed to perform JSON RPC: ${resp.status} ${resp.statusText}`;
    console.log(msg);
    throw new Error(msg);
  }

  const data = await resp.json();

  if ("error" in data) {
    const msg = `error while running ${method}: ${data.error.message} (${data.error.code})`;
    console.log(msg);
    throw new Error(msg);
  }

  return data.result;
}

async function get_display_data(include_demos = false) {
  const preset_promise = rpc("getListOfPresets");
  const info_promise = rpc("getInfo");
  const parameters_promise = rpc("getParameters");

  let preset_result = await preset_promise;
  let info_result = await info_promise;
  let parameters_result = await parameters_promise;

  // Info result appears to be a list for some reason
  info_result = info_result[0];

  // Parse the available presets, only including the non-demo ones.
  let available_presets = [];
  let current_preset_found = false;
  for (let i in preset_result) {
    let preset = preset_result[i];
    if (!include_demos && preset.license_status == "demo") {
      continue;
    }

    available_presets.push(preset.name);
    if (preset.name == info_result.current_preset.name) {
      current_preset_found = true;
    }
  }

  if (!current_preset_found) {
    available_presets = [info_result.current_preset.name].concat(available_presets);
  }

  // Parsing parameters result
  // For now, parse only output mode. Pianoteq doesn't seem to be output
  let parameters = {};

  for (let i in parameters_result) {
    let item = parameters_result[i];
    parameters[item.id] = item.text;
  }

  let data = {
    preset: info_result.current_preset.name,
    available_presets: available_presets,
    output_mode: parameters["Output Mode"],
    data_table: [
      [info_result.product_name, info_result.version],
    ],
  };

  return data;
}

async function load_preset(name) {

}

async function set_sound_output(output_mode) {

}

export { rpc, get_display_data, load_preset, set_sound_output }
