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
  const audio_device_promise = rpc("getAudioDeviceInfo");
  const metronome_promise = rpc("getMetronome");

  let preset_result = await preset_promise;
  let info_result = await info_promise;
  let parameters_result = await parameters_promise;
  let audio_device_result = await audio_device_promise;
  let metronome_result = await metronome_promise;

  // Info result appears to be a list for some reason
  info_result = info_result[0];

  // Parse the available presets, only including the non-demo ones.
  let available_presets = {};
  for (let i in preset_result) {
    let preset = preset_result[i];
    if (!include_demos && preset.license_status == "demo") {
      continue;
    }

    // ES2015 should guarentee that iteration order is in insertion order.
    available_presets[preset.name] = {bank: preset.bank};
  }

  if (!(info_result.current_preset.name in available_presets)) {
    // Invalid bank value is OK, because this entry is only used for display,
    // as we will never switch from the same instrument to itself with the
    // dropdown menu.
    available_presets[info_result.current_preset.name] = {bank: ""};
  }

  // Parsing parameters result
  // For now, parse only output mode. Pianoteq doesn't seem to be output
  let parameters = {};

  for (let i in parameters_result) {
    let item = parameters_result[i];
    parameters[item.id] = item;
  }

  let output_mode = parameters["Output Mode"].text;
  if (output_mode == "Sterophonic") {
    // Pianoteq 7.5.2 returns spelling even though in set parameters it is done correctly. So we fix it here.
    output_mode = "Stereophonic"
  }

  let data = {
    preset: info_result.current_preset.name,
    available_presets: available_presets,
    reverb: info_result.current_preset.mini_presets.reverb,
    output_mode: output_mode,
    data_table: [
      [info_result.product_name, info_result.version],
      ["Output", audio_device_result.audio_output_device_name],
    ],
    metronome: metronome_result[0],
  };

  console.log(data);

  return data;
}

async function load_preset(name, bank) {
  console.log(`load_preset(${name}, ${bank})`);
  return await rpc("loadPreset", {name: name, bank: bank});
}

async function set_sound_output(output_mode) {
  console.log(`set_sound_output(${output_mode})`);
  return await rpc("setParameters", {list: [{id: "Output Mode", text: output_mode}]})
}

async function set_reverb(reverb) {
  return await rpc("loadPreset", {name: reverb, bank: "", preset_type: "reverb"})
}

async function set_metronome(enabled, bpm, signature, volume, accent) {
  return await rpc("setMetronome", {bpm: bpm, enabled: enabled, timesig: signature, volume_db: volume, accentuate: accent})
}

export { rpc, get_display_data, load_preset, set_sound_output, set_reverb, set_metronome }
